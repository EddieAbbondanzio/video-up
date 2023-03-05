// Keep in sync with front-end definition
export enum MessageType {
  CreateRoom = "create-room",
  JoinRoom = "join-room",
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
