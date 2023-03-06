import React, { useEffect, useMemo, useRef, useState } from "react";
import { VideoToolbar } from "./VideoToolbar";
import {
  CreateRoomRequest,
  MessageType,
  WebSocketResponse,
} from "../../../shared/src/ws";
import { sendRequest } from "../ws";
import { JoinModal } from "./JoinModal";
import styled from "styled-components";
import { createNewRtcPeerConnection, startLocalVideoAndAudio } from "../media";
import {
  VideoParticipant,
  VideoParticipantBlock,
} from "./VideoParticipantBlock";

export interface VideoRoomProps {
  ws: WebSocket;
}

export function VideoRoom(props: VideoRoomProps): JSX.Element {
  const { ws } = props;

  const [domain, setDomain] = useState<string>(undefined!);
  const [roomID, setRoomID] = useState<string | undefined>(undefined);
  const [isHost, setIsHost] = useState<boolean>(false);
  const [hasConfirmedJoin, setHasConfirmedJoin] = useState(false);
  const [roomParticipants, setRoomParticipants] = useState<VideoParticipant[]>(
    [],
  );

  const localVideo = useRef<MediaStreamTrack | undefined>();
  const localAudio = useRef<MediaStreamTrack | undefined>();

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

    let userIsHost = existingRoomID == null;

    setRoomID(existingRoomID);
    setIsHost(userIsHost);
    setHasConfirmedJoin(userIsHost);
    setDomain(url.href);
  }, [window.location.href, hasConfirmedJoin]);

  // Start camera / mic once user confirms the join
  useEffect(() => {
    if (!hasConfirmedJoin) {
      return;
    }

    (async () => {
      const { video, audio } = await startLocalVideoAndAudio();

      localVideo.current = video;
      localAudio.current = audio;

      // Add self to participants
      setRoomParticipants([
        {
          isLocal: true,
          id: "self",
        },
      ]);
    })();
  }, [hasConfirmedJoin]);

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

        case MessageType.ParticipantJoined:
          setRoomParticipants(existing => [
            ...existing,
            {
              id: response.participantID,
              isLocal: false,
            },
          ]);
          break;

        case MessageType.ParticipantLeft:
          setRoomParticipants(existing =>
            existing.filter(p => p.id !== response.participantID),
          );
          break;
      }
    };
    ws.addEventListener("message", onMessage);

    return () => {
      ws.removeEventListener("message", onMessage);
    };
  }, [ws]);

  let renderedParticipants: JSX.Element[] = [];
  if (hasConfirmedJoin) {
    renderedParticipants = roomParticipants.map(p => (
      <VideoParticipantBlock
        key={p.id}
        ws={ws}
        participant={p}
        localVideo={localVideo.current}
        localAudio={localAudio.current}
      />
    ));
  }

  return (
    <VideoBackground>
      {!isHost && !hasConfirmedJoin && (
        <JoinModal onJoin={() => setHasConfirmedJoin(true)} />
      )}
      {renderedParticipants}
      {roomID && (
        <VideoToolbar isHost={isHost} roomID={roomID} domain={domain} />
      )}
    </VideoBackground>
  );
}

const VideoBackground = styled.div`
  flex-grow: 1;
  background-color: #262626;
`;
