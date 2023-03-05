export enum MessageType {
  CreateRoom = "create-room",
  JoinRoom = "join-room",
  ParticipantJoined = "participant-joined",
  ParticipantLeft = "participant-left",
  RoomClosed = "room-closed",
}

// Participants send requests, the signaling server sends responses. (think HTTP)

export interface CreateRoomRequest {
  type: MessageType.CreateRoom;
}

export interface CreateRoomResponse {
  type: MessageType.CreateRoom;
  roomID: string;
}

export interface JoinRoomRequest {
  type: MessageType.JoinRoom;
  roomID: string;
}

export interface JoinRoomResponse {
  type: MessageType.JoinRoom;
  participantCount?: number;
  error?: string;
}

export interface ParticipantJoinedResponse {
  type: MessageType.ParticipantJoined;
  participantID: string;
}

export interface ParticipantLeftResponse {
  type: MessageType.ParticipantLeft;
  participantID: string;
}

export interface RoomClosedRequest {
  type: MessageType.RoomClosed;
}

export interface RoomClosedResponse {
  type: MessageType.RoomClosed;
  reason: string;
}

export type WebSocketRequest =
  | CreateRoomRequest
  | JoinRoomRequest
  | RoomClosedRequest;

export type WebSocketResponse =
  | CreateRoomResponse
  | JoinRoomResponse
  | ParticipantJoinedResponse
  | ParticipantLeftResponse
  | RoomClosedResponse;
