import React, { useEffect, useMemo, useState } from "react";
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

  const [domain, setDomain] = useState<string>("");
  const [roomID, setRoomID] = useState<string | undefined>();
  const [participantID, setParticipantID] = useState<string | undefined>();
  const [isHost, setIsHost] = useState<boolean>(false);
  const [hasConfirmedJoin, setHasConfirmedJoin] = useState(false);

  const [localMedia, setLocalMedia] = useState<MediaState | undefined>();
  const [peers, setPeers] = useState<Peer[]>([]);

  // Initialize room whenever the URL changes
  useEffect(() => {
    let existingRoomID;

    const url = new URL(window.location.href);
    if (url.pathname !== "/") {
      existingRoomID = url.pathname.slice(1);
    }

    if (!existingRoomID) {
      sendRequest(ws, {
        type: MessageType.CreateRoom,
      });
    } else if (hasConfirmedJoin) {
      if (!existingRoomID) {
        throw new Error("No roomID to join as participant.");
      }

      sendRequest(ws, {
        type: MessageType.JoinRoom,
        roomID: existingRoomID,
      });
    } else {
      return;
    }

    const userIsHost = existingRoomID == null;

    setRoomID(existingRoomID);
    setIsHost(userIsHost);
    if (userIsHost) {
      setHasConfirmedJoin(true);
    }
    setDomain(url.href);
  }, [hasConfirmedJoin, ws]);

  // Start camera / mic once user confirms the join
  useEffect(() => {
    if (!hasConfirmedJoin || !roomID || !participantID) {
      return;
    }

    (async () => {
      const media = await startLocalVideoAndAudio();
      setLocalMedia(media);

      for (const peer of peers) {
        peer.addLocalMedia(media);
      }
    })();
  }, [roomID, hasConfirmedJoin, participantID, peers]);

  // Listen for websocket responses
  useEffect(() => {
    const onMessage = (ev: MessageEvent) => {
      const response: WebSocketResponse = JSON.parse(ev.data);

      let peer: Peer | undefined;

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
          peer = new Peer(ws, response.participantID, response.peerType);

          if (localMedia) {
            peer.addLocalMedia(localMedia);
          }

          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          setPeers(existing => [...existing, peer!]);
          break;

        case MessageType.ParticipantLeft:
          peer = peers.find(
            p => p.remoteParticipantID === response.participantID,
          );
          if (peer == null) {
            throw new Error(
              `No peer found for remote participant (ID: ${response.participantID})`,
            );
          }

          setPeers(existing =>
            existing.filter(
              p => p.remoteParticipantID !== response.participantID,
            ),
          );

          peer.destroy();
          break;
      }
    };
    ws.addEventListener("message", onMessage);

    return () => {
      ws.removeEventListener("message", onMessage);
    };
  }, [ws, localMedia, peers]);

  // Listen for track changes, and re-render when needed.
  useEffect(() => {
    for (const peer of peers) {
      peer.onRemoteTrackReceived = () => {
        setPeers([...peers]);
      };
    }
  }, [peers]);

  const videos = useMemo(() => {
    const videos: JSX.Element[] = [];

    if (hasConfirmedJoin || isHost) {
      videos.push(<Video key={participantID} media={localMedia} />);

      for (const peer of peers) {
        videos.push(
          <Video key={peer.remoteParticipantID} media={peer.remoteMedia} />,
        );
      }
    }

    return videos;
  }, [localMedia, peers, hasConfirmedJoin, isHost, participantID]);

  const onJoin = () => {
    if (!hasConfirmedJoin) {
      setHasConfirmedJoin(true);
    }
  };

  console.log("Render VideoRoom!");
  return (
    <Content>
      {!isHost && !hasConfirmedJoin && <JoinModal onJoin={onJoin} />}
      <VideoBackground>{videos}</VideoBackground>
      {roomID && (
        <VideoToolbar isHost={isHost} roomID={roomID} domain={domain} />
      )}
    </Content>
  );
}

const Content = styled.div`
  flex-grow: 1;
  background-color: #262626;

  display: flex;
  flex-direction: column;
  align-items: center;
  overflow-y: auto;
`;

const VideoBackground = styled.div`
  flex-grow: 1;
  flex-shrink: 1;
  width: 1280px;

  display: grid;
  grid-template-columns: 1fr 1fr;
`;
