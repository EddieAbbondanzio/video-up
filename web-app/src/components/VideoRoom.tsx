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
import {
  createNewRtcPeerConnection,
  MediaState,
  Peer,
  startLocalVideoAndAudio,
} from "../media";
import { Video } from "./Video";

export interface VideoRoomProps {
  ws: WebSocket;
}

export function VideoRoom(props: VideoRoomProps): JSX.Element {
  const { ws } = props;

  const [domain, setDomain] = useState<string>(undefined!);
  const [roomID, setRoomID] = useState<string | undefined>();
  const [participantID, setParticipantID] = useState<string | undefined>();
  const [isHost, setIsHost] = useState<boolean>(false);
  const [hasConfirmedJoin, setHasConfirmedJoin] = useState(false);

  const peers = useRef<Peer[]>([]);
  const localMedia = useRef<MediaState | undefined>();

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
    if (userIsHost) {
      setHasConfirmedJoin(true);
    }
    setDomain(url.href);
  }, [window.location.href, hasConfirmedJoin]);

  // Start camera / mic once user confirms the join
  useEffect(() => {
    if (!hasConfirmedJoin || !roomID || !participantID) {
      return;
    }

    (async () => {
      const media = await startLocalVideoAndAudio();
      localMedia.current = media;

      if (participantID == null) {
        throw new Error("Local user wasn't given a participant ID.");
      }

      for (const peer of peers.current) {
        peer.addLocalMedia(media);
      }
    })();
  }, [roomID, hasConfirmedJoin, participantID]);

  // Listen for websocket responses
  useEffect(() => {
    const onMessage = (ev: MessageEvent) => {
      const response: WebSocketResponse = JSON.parse(ev.data);
      console.log("GOT RESPONSE: ", response);

      switch (response.type) {
        case MessageType.CreateRoom:
          setRoomID(response.roomID);
          setParticipantID(response.participantID);
          console.log(
            "JOIN ROOM SUCCESS! got participant ID: ",
            response.participantID,
          );
          break;

        case MessageType.JoinRoom:
          if (response.error) {
            alert(response.error);
            window.location.replace("/");
          }
          console.log("Joined room! Set participant ID");
          setParticipantID(response.participantID);
          break;

        case MessageType.ParticipantJoined:
          const newPeer = new Peer(
            ws,
            response.participantID,
            response.peerType,
          );

          if (localMedia.current) {
            newPeer.addLocalMedia(localMedia.current);
          }

          peers.current.push(newPeer);
          break;

        case MessageType.ParticipantLeft:
          const peerThatLeft = peers.current.find(
            p => p.remoteParticipantID === response.participantID,
          );
          if (peerThatLeft == null) {
            throw new Error(
              `No peer found for remote participant (ID: ${response.participantID})`,
            );
          }

          peers.current = peers.current.filter(
            p => p.remoteParticipantID !== response.participantID,
          );

          peerThatLeft.destroy();
          break;
      }
    };
    ws.addEventListener("message", onMessage);

    return () => {
      ws.removeEventListener("message", onMessage);
    };
  }, [ws]);

  let videos: JSX.Element[] = [];

  if (hasConfirmedJoin) {
    videos.push(<Video key={participantID} media={localMedia.current} />);

    videos = peers.current.map(p => (
      <Video key={p.remoteParticipantID} media={p.remoteMedia} />
    ));
  }

  console.log("RENDER ", { hasConfirmedJoin });

  return (
    <VideoBackground>
      {!isHost && !hasConfirmedJoin && (
        <JoinModal
          onJoin={() => {
            console.log("JOIN WAS CLICKED!");
            setHasConfirmedJoin(true);
          }}
        />
      )}
      {videos}
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
