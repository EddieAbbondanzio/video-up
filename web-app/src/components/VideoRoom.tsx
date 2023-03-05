import React, { useEffect, useState } from "react";
import { VideoToolbar } from "./VideoToolbar";
import { CreateRoomRequest, MessageType } from "../../../shared/src/ws";
import { sendRequest } from "../ws";

export interface VideoRoomProps {
  ws: WebSocket;
  isHost: boolean;
  roomID: string | null;
}

export function VideoRoom(props: VideoRoomProps): JSX.Element {
  const { ws, isHost, roomID } = props;

  // Set up room on first load
  useEffect(() => {
    if (isHost) {
      sendRequest(ws, {
        type: MessageType.CreateRoom,
      });
    } else {
      if (roomID == null) {
        throw new Error(`No roomID to join as participant.`);
      }

      sendRequest(ws, {
        type: MessageType.JoinRoom,
        roomID,
      });
    }
  }, []);

  // Listen for websocket responses
  useEffect(() => {
    const onMessage = (ev: MessageEvent) => {
      const response = JSON.parse(ev.data);
      console.log("GOT RESPONSE: ", response);
    };
    ws.addEventListener("message", onMessage);

    return () => {
      ws.removeEventListener("message", onMessage);
    };
  }, [ws]);

  // TODO:
  // Send request to join room on server side
  // See if it sends us back 200, or throws error

  // Handle incoming participants that join
  // Need to send them our SDP, and accept theirs

  // Need to handle forwarding ICE candidates to each other participant

  // Need to handle participants leaving.

  // Use video participant! <VideoParticipant />

  return (
    <div>
      <i className="fas fa-user"></i>
      Hi, this is the video room.
      <VideoToolbar isHost={isHost} />
    </div>
  );
}
