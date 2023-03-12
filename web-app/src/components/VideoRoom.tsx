import React, { useEffect, useMemo, useRef, useState } from "react";
import { VideoToolbar } from "./VideoToolbar";
import { MessageType, WebSocketResponse } from "../../../shared/src/ws";
import { sendRequest } from "../ws";
import { JoinModal } from "./JoinModal";
import styled from "styled-components";
import { MediaState, Peer, startLocalVideoAndAudio } from "../peer";
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

  const [localMedia, setLocalMedia] = useState<MediaState | undefined>();
  const [peers, setPeers] = useState<Peer[]>([]);

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
      console.log("Started camera. Got media: ", media);
      setLocalMedia(media);

      if (participantID == null) {
        throw new Error("Local user wasn't given a participant ID.");
      }

      for (const peer of peers) {
        peer.addLocalMedia(media);
      }
    })();
  }, [roomID, hasConfirmedJoin, participantID]);

  // Listen for websocket responses
  useEffect(() => {
    const onMessage = (ev: MessageEvent) => {
      const response: WebSocketResponse = JSON.parse(ev.data);

      switch (response.type) {
        case MessageType.CreateRoom:
          setRoomID(response.roomID);
          setParticipantID(response.participantID);
          break;

        case MessageType.JoinRoom:
          if (response.error) {
            alert(response.error);
            window.location.replace("/");
          }
          setParticipantID(response.participantID);
          break;

        case MessageType.ParticipantJoined:
          const newPeer = new Peer(
            ws,
            response.participantID,
            response.peerType,
          );

          if (localMedia) {
            newPeer.addLocalMedia(localMedia);
          }

          setPeers(existing => [...existing, newPeer]);
          break;

        case MessageType.ParticipantLeft:
          const peerThatLeft = peers.find(
            p => p.remoteParticipantID === response.participantID,
          );
          if (peerThatLeft == null) {
            throw new Error(
              `No peer found for remote participant (ID: ${response.participantID})`,
            );
          }

          setPeers(existing =>
            existing.filter(
              p => p.remoteParticipantID !== response.participantID,
            ),
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

  const videos = useMemo(() => {
    let videos: JSX.Element[] = [];

    if (hasConfirmedJoin || isHost) {
      videos.push(<Video key={participantID} media={localMedia} />);

      for (const peer of peers) {
        console.log("PEER REMOTE MEDIA: ", peer);
        videos.push(
          <Video key={peer.remoteParticipantID} media={peer.remoteMedia} />,
        );
      }
    }

    return videos;
  }, [localMedia, peers]);

  const onJoin = () => {
    if (!hasConfirmedJoin) {
      setHasConfirmedJoin(true);
    }
  };

  return (
    <VideoBackground>
      {!isHost && !hasConfirmedJoin && <JoinModal onJoin={onJoin} />}
      <div className="video-container">{videos}</div>
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
