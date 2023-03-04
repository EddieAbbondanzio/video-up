import { Server, WebSocketServer, WebSocket } from "ws";
import { dataSource } from "./db";
import { nanoid } from "nanoid";
import { Room } from "./entities/room";
import { Participant } from "./entities/participant";

// The server is responsible for transmitting signaling between the participants
// of a room and is fairly hands off. It only needs to keep track of the room's
// state and the current list of participants to forward messages to.

// Keep in sync with front-end definition
export enum MessageType {
  CreateRoom = "create-room",
  ParticipantJoined = "participant-joined",
  ParticipantLeft = "participant-left",
  RoomClosed = "room-closed",
}

export interface CreateRoomMessage {
  type: MessageType.CreateRoom;
  inviteURL: string;
}

export interface ParticipantJoinedMessage {
  type: MessageType.ParticipantJoined;
  participantID: string;
}

export interface ParticipantLeftMessage {
  type: MessageType.ParticipantLeft;
  participantID: string;
}

export interface RoomClosedMessage {
  type: MessageType.RoomClosed;
}

export type Message =
  | CreateRoomMessage
  | ParticipantJoinedMessage
  | ParticipantLeftMessage
  | RoomClosedMessage;

declare module "ws" {
  interface WebSocket {
    id: string;
  }
}

export const PORT = 8080;
export const WS_ID_LENGTH = 16;

// Be careful setting this too high. We are running video data over P2P and this
// gets expensive fast!
export const ROOM_MAX_CAPACITY = 4;

async function main() {
  await dataSource.initialize();

  const wss = new WebSocketServer({ port: PORT, clientTracking: true }, () => {
    console.log(`Listening on ${PORT}`);
  });

  wss.on("connection", async function connection(ws) {
    ws.on("open", async function open() {
      // Web sockets are assigned unique IDs so we can selectively forward messages
      // between each end of the video call.
      ws.id = nanoid(WS_ID_LENGTH);

      const existingParticipant = await Participant.findOneBy({
        websocketID: ws.id,
      });
      if (existingParticipant != null) {
        throw new Error(
          `New websocket already had existing participant (ID: ${existingParticipant.id})`,
        );
      }

      const participant = new Participant();
      participant.id = nanoid();
      participant.websocketID = ws.id;
      participant.isActive = true;
      participant.isHost = false;
      participant.room = null;
      await participant.save();
    });

    ws.on("error", console.error);

    ws.on("message", async function message(data) {
      const message: Message = JSON.parse(data.toString());

      // TODO: Add validation here.

      let sender = await Participant.findOne({
        where: { websocketID: ws.id },
        relations: { room: true },
      });

      if (sender == null) {
        return;
      }

      switch (message.type) {
        case MessageType.CreateRoom:
          if (sender.room != null) {
            return;
          }

          await dataSource.manager.transaction(async txManager => {
            sender!.isHost = true;
            await txManager.save(sender);

            const room = new Room();
            room.id = nanoid();
            room.isActive = true;
            room.participants = [sender!];
            await txManager.save(room);
          });

          break;

        case MessageType.ParticipantJoined:
          if (sender.room == null) {
            return;
          }

          if (sender.room.participants.length > ROOM_MAX_CAPACITY) {
            // TODO: Notify participant, along with reason why.
            return;
          }

          sender.room.participants.push(sender);
          forwardMessageToOthersInRoom(
            wss,
            sender.room,
            {
              type: MessageType.ParticipantJoined,
              participantID: sender.id,
            },
            sender,
          );
          break;

        case MessageType.ParticipantLeft:
          if (sender.room == null) {
            return;
          }

          await handleParticipantLeft(wss, sender);
          break;

        case MessageType.RoomClosed:
          if (sender.room == null) {
            return;
          }

          forwardMessageToOthersInRoom(wss, sender.room, message, sender);
          break;
      }
    });

    // Listen for web socket close event so we can notify other end of call if
    // one participant leaves.
    ws.on("close", async function close() {
      const participant = await Participant.findOne({
        where: {
          websocketID: ws.id,
        },
        relations: {
          room: true,
        },
      });

      // An inactive participant means we already know the user left the room,
      // and there's nothing left to do.
      if (participant == null || participant.isActive) {
        return;
      }

      await handleParticipantLeft(wss, participant);
    });
  });
}

if (process.env.NODE_ENV !== "test") {
  main();
}

export function sendMessageToRoom(
  wss: WebSocketServer,
  room: Room,
  message: Message,
): void {
  const webSocketClients = Array.from(wss.clients.values());

  for (const participant of room.participants) {
    const ws = webSocketClients.find(ws => ws.id === participant.websocketID);
    if (ws == null) {
      throw new Error(
        `No websocket found for participant (ID: ${participant.id})`,
      );
    }

    ws.send(JSON.stringify(message));
  }
}

export function forwardMessageToOthersInRoom(
  wss: WebSocketServer,
  room: Room,
  message: Message,
  sender: Participant,
): void {
  const webSocketClients = Array.from(wss.clients.values());
  const otherParticipants = room.participants.filter(p => p.id !== sender.id);

  for (const participant of otherParticipants) {
    const ws = webSocketClients.find(ws => ws.id === participant.websocketID);
    if (ws == null) {
      throw new Error(
        `No websocket found for participant (ID: ${participant.id})`,
      );
    }

    ws.send(JSON.stringify(message));
  }
}

export async function handleParticipantLeft(
  wss: WebSocketServer,
  participant: Participant,
): Promise<void> {
  participant.isActive = false;
  await participant.save();

  // No room means the participant never joined a room.
  const { room } = participant;
  if (room == null) {
    return;
  }

  // If host leaves, close the room
  if (participant.isHost) {
    room.isActive = false;
    await room.save();

    sendMessageToRoom(wss, room, {
      type: MessageType.RoomClosed,
    });
  }
  // Notify other participants that someone left.
  else {
    room.participants = room.participants.filter(p => p.id !== participant.id);
    await room.save();

    sendMessageToRoom(wss, room, {
      type: MessageType.ParticipantLeft,
      participantID: participant.id,
    });
  }
}
