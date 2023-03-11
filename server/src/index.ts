import { Server, WebSocketServer, WebSocket } from "ws";
import { dataSource } from "./db";
import { nanoid } from "nanoid";
import { Room } from "./entities/room";
import { Participant } from "./entities/participant";
import {
  MessageType,
  WebSocketRequest,
  WebSocketResponse,
} from "../../shared/src/ws";
import { DataSource } from "typeorm";

// The server is responsible for transmitting signaling between the participants
// of a room and is fairly hands off. It only needs to keep track of the room's
// state and the current list of participants to forward messages to.

declare module "ws" {
  interface WebSocket {
    id: string;
  }
}

export const PORT = 8080;
export const WS_ID_LENGTH = 16;
export const ROOM_SHAREABLE_ID_LENGTH = 12;

// Be careful setting this too high. We are running video data over P2P and this
// gets expensive fast!
export const ROOM_MAX_CAPACITY = 4;

async function main() {
  await dataSource.initialize();

  const wss = new WebSocketServer({ port: PORT, clientTracking: true }, () => {
    console.log(`Listening on ${PORT}`);
  });

  wss.on("connection", async function connection(ws) {
    await initWebSocket(ws);

    ws.on("error", console.error);

    ws.on("message", async function message(data) {
      const request: WebSocketRequest = JSON.parse(data.toString());
      console.log("Server got message: ", request);

      // TODO: Add validation here.

      let sender = await Participant.findOne({
        where: { websocketID: ws.id },
        relations: { room: true },
      });

      if (sender == null) {
        return;
      }

      switch (request.type) {
        case MessageType.CreateRoom:
          if (sender.room != null) {
            return;
          }

          await dataSource.manager.transaction(async txManager => {
            const room = new Room();
            room.id = nanoid();
            room.isActive = true;
            room.participants = [sender!];
            room.shareableID = nanoid(ROOM_SHAREABLE_ID_LENGTH);

            sender!.isHost = true;
            sender!.room = room;

            await txManager.save([sender, room]);

            sendResponse(ws, {
              type: MessageType.CreateRoom,
              roomID: room.shareableID,
              participantID: sender!.id,
            });
          });
          break;

        case MessageType.JoinRoom:
          if (sender.room != null) {
            return;
          }

          const room = await Room.findOne({
            where: {
              shareableID: request.roomID,
            },
            relations: {
              participants: true,
            },
          });

          if (room == null) {
            sendResponse(ws, {
              type: MessageType.JoinRoom,
              error: "Room not found.",
            });
            return;
          }

          if (!room.isActive) {
            sendResponse(ws, {
              type: MessageType.JoinRoom,
              error: "Room was closed.",
            });
            return;
          }

          if (room.participants.length > ROOM_MAX_CAPACITY) {
            sendResponse(ws, {
              type: MessageType.JoinRoom,
              error: "Room is full.",
            });
            return;
          }

          await dataSource.manager.transaction(async txManager => {
            sender!.isActive = true;
            sender!.room = room;
            await txManager.save(sender);

            room.participants.push(sender!);
            await txManager.save(room);
          });

          sendResponse(ws, {
            type: MessageType.JoinRoom,
            participantID: sender.id,
            participantCount: room.participants.length,
          });

          // Notify others in the room a new user joined.
          sendResponseToOthersInRoom(wss, sender, {
            type: MessageType.ParticipantJoined,
            participantID: sender.id,
          });
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
          room: {
            participants: true,
          },
        },
      });

      // An inactive participant means we already know the user left the room,
      // and there's nothing left to do.
      if (participant == null || participant.room == null) {
        return;
      }

      await handleParticipantLeft(wss, dataSource, participant);
    });
  });
}

if (process.env.NODE_ENV !== "test") {
  main();
}

export async function initWebSocket(ws: WebSocket) {
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
}

export function sendResponseToOthersInRoom(
  wss: WebSocketServer,
  sender: Participant,
  response: WebSocketResponse,
) {
  const webSocketClients = Array.from(wss.clients.values());

  const { room } = sender;
  if (room == null) {
    return;
  }

  const otherParticipants = room.participants.filter(p => p.id !== sender.id);
  for (const participant of otherParticipants) {
    const ws = webSocketClients.find(ws => ws.id === participant.websocketID);
    if (ws == null) {
      throw new Error(
        `No websocket found for participant (ID: ${participant.id})`,
      );
    }

    sendResponse(ws, response);
  }
}

export function sendResponseToRoom(
  wss: WebSocketServer,
  room: Room,
  response: WebSocketResponse,
): void {
  const webSocketClients = Array.from(wss.clients.values());

  for (const participant of room.participants) {
    const ws = webSocketClients.find(ws => ws.id === participant.websocketID);
    if (ws == null) {
      throw new Error(
        `No websocket found for participant (ID: ${participant.id})`,
      );
    }

    sendResponse(ws, response);
  }
}

export function sendResponse(ws: WebSocket, response: WebSocketResponse): void {
  ws.send(JSON.stringify(response));
}

export async function handleParticipantLeft(
  wss: WebSocketServer,
  dataSource: DataSource,
  participant: Participant,
): Promise<void> {
  // No room means the participant never joined a room.
  const { room } = participant;
  if (room == null) {
    return;
  }

  let response: WebSocketResponse;

  // If host leaves, close the room. (There's no technical reason for requiring
  // this since video / audio are sent P2P but it makes it easy to track when to
  // invalidate rooms)
  if (participant.isHost) {
    room.isActive = false;

    response = {
      type: MessageType.RoomClosed,
      reason: "Host left.",
    };
  }
  // Notify other participants that someone left.
  else {
    response = {
      type: MessageType.ParticipantLeft,
      participantID: participant.id,
    };
  }

  await dataSource.manager.transaction(async txManager => {
    participant.isActive = false;
    await txManager.save(participant);

    room.participants = room.participants.filter(p => p.id !== participant.id);
    await txManager.save(room);
  });

  sendResponseToRoom(wss, room, response);
}
