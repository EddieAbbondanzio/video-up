import { PeerType } from "./media";

export enum MessageType {
  CreateRoom = "create-room",
  JoinRoom = "join-room",
  ParticipantJoined = "participant-joined",
  IceCandidate = "ice-candidate",
  SDPDescription = "sdp-description",
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
  participantID: string;
}

export interface JoinRoomRequest {
  type: MessageType.JoinRoom;
  roomID: string;
}

export interface JoinRoomResponse {
  type: MessageType.JoinRoom;
  participantID?: string;
  error?: string;
}

export interface ParticipantJoinedResponse {
  type: MessageType.ParticipantJoined;
  participantID: string;
  peerType: PeerType;
}

export interface SDPDescriptionRequest {
  type: MessageType.SDPDescription;
  destinationID: string;
  sdp: RTCSessionDescription;
}

export interface SDPDescriptionResponse {
  type: MessageType.SDPDescription;
  senderID: string;
  sdp: RTCSessionDescription;
}

export interface IceCandidateRequest {
  type: MessageType.IceCandidate;
  destinationID: string;
  candidate: RTCIceCandidateInit;
}

export interface IceCandidateResponse {
  type: MessageType.IceCandidate;
  senderID: string;
  candidate: RTCIceCandidateInit;
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
  | SDPDescriptionRequest
  | IceCandidateRequest
  | RoomClosedRequest;

export type WebSocketResponse =
  | CreateRoomResponse
  | JoinRoomResponse
  | ParticipantJoinedResponse
  | SDPDescriptionResponse
  | IceCandidateResponse
  | ParticipantLeftResponse
  | RoomClosedResponse;
