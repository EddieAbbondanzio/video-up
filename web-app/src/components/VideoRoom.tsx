import React, { useEffect, useState } from "react";
import { VideoToolbar } from "./VideoToolbar";
import {
  CreateRoomRequest,
  MessageType,
  WebSocketResponse,
} from "../../../shared/src/ws";
import { sendRequest } from "../ws";
import { JoinModal } from "./JoinModal";

export interface VideoRoomProps {
  ws: WebSocket;
}

export function VideoRoom(props: VideoRoomProps): JSX.Element {
  const { ws } = props;

  const [domain, setDomain] = useState<string>(undefined!);
  const [roomID, setRoomID] = useState<string | undefined>(undefined);
  const [isHost, setIsHost] = useState<boolean>(false);
  const [hasConfirmedJoin, setHasConfirmedJoin] = useState(false);

  // Initialize room whenever the URL changes
  useEffect(() => {
    let existingRoomID;

    let url = new URL(window.location.href);
    if (url.pathname !== "/") {
      existingRoomID = url.pathname.slice(1);
    }

    if (!existingRoomID) {
      sendRequest(ws, {
        type: MessageType.CreateRoom,
      });
    } else if (hasConfirmedJoin) {
      if (!existingRoomID) {
        throw new Error(`No roomID to join as participant.`);
      }

      sendRequest(ws, {
        type: MessageType.JoinRoom,
        roomID: existingRoomID,
      });
    } else {
      return;
    }

    setRoomID(existingRoomID);
    setIsHost(existingRoomID == null);
    setDomain(url.href);
  }, [window.location.href, hasConfirmedJoin]);

  // Listen for websocket responses
  useEffect(() => {
    const onMessage = (ev: MessageEvent) => {
      const response: WebSocketResponse = JSON.parse(ev.data);
      console.log("GOT RESPONSE: ", response);

      switch (response.type) {
        case MessageType.CreateRoom:
          setRoomID(response.roomID);
          break;

        case MessageType.JoinRoom:
          if (response.error) {
            alert(response.error);
            window.location.replace("/");
          }
          break;
      }
    };
    ws.addEventListener("message", onMessage);

    return () => {
      ws.removeEventListener("message", onMessage);
    };
  }, [ws]);

  // Need to send them our SDP, and accept theirs

  // Need to handle forwarding ICE candidates to each other participant

  // Need to handle participants leaving.

  // Use video participant! <VideoParticipant />

  return (
    <div>
      {!isHost && !hasConfirmedJoin && (
        <JoinModal onJoin={() => setHasConfirmedJoin(true)} />
      )}
      {roomID && (
        <VideoToolbar isHost={isHost} roomID={roomID} domain={domain} />
      )}
    </div>
  );
}
