import React, { useEffect, useMemo, useState } from "react";
import { VideoToolbar } from "./VideoToolbar";
import { MessageType, WebSocketResponse } from "../../../shared/src/ws";
import { sendRequest } from "../ws";
import { JoinModal } from "./JoinModal";
import styled from "styled-components";
import {
  MediaState,
  OnRemoteTrackEvent,
  Peer,
  PeerEventType,
  startLocalVideoAndAudio,
} from "../peer";
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
  const [remoteMedia, setRemoteMedia] = useState<Record<string, MediaState>>(
    {},
  );

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
    if (!hasConfirmedJoin || !roomID || !participantID || localMedia) {
      return;
    }

    (async () => {
      const media = await startLocalVideoAndAudio();

      for (const peer of peers) {
        peer.setLocalMedia(media);
      }

      setLocalMedia(media);
    })();
  }, [roomID, hasConfirmedJoin, participantID, peers, localMedia]);

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
          console.log("================");
          peer = new Peer(ws, response.participantID, response.peerType);
          console.log("new peer!");
          if (localMedia) {
            peer.setLocalMedia(localMedia);
          }
          console.log("=============");

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

  // Listen for tracks
  useEffect(() => {
    const onRemoteTrack = (ev: Event) => {
      const trackEvent = ev as OnRemoteTrackEvent;
      const { track, stream } = trackEvent.detail;

      const peer = trackEvent.target;
      const peerID = peer.remoteParticipantID;

      setRemoteMedia(existing => {
        if (existing[peerID] == null) {
          existing[peerID] = { stream };
        }

        switch (track.kind) {
          case "video":
            existing[peerID].video = track;
            break;

          case "audio":
            existing[peerID].audio = track;
            break;

          default:
            throw new Error(`Invalid remote track ${track.kind} received.`);
        }

        console.log("Room.onRemoteTrack; ", existing);
        return existing;
      });
    };

    for (const peer of peers) {
      peer.addEventListener(PeerEventType.OnRemoteTrack, onRemoteTrack);
    }

    return () => {
      for (const peer of peers) {
        peer.removeEventListener(PeerEventType.OnRemoteTrack, onRemoteTrack);
      }
    };
  }, [peers]);

  const remoteUserMedia = Object.entries(remoteMedia);
  const videos = useMemo(() => {
    const videos: JSX.Element[] = [];

    console.log("Videos useMemo called!", {
      participantID,
      hasConfirmedJoin,
      isHost,
    });

    if (participantID && (hasConfirmedJoin || isHost)) {
      videos.push(
        <Video
          key={participantID}
          remote={false}
          participantID={participantID}
          media={localMedia}
        />,
      );

      console.log("Curr remote media size: ", remoteUserMedia);
      for (const [pID, media] of remoteUserMedia) {
        videos.push(
          <Video key={pID} remote={true} participantID={pID} media={media} />,
        );
      }
    }

    return videos;
  }, [remoteUserMedia, hasConfirmedJoin, isHost, localMedia, participantID]);

  const onJoin = () => {
    if (!hasConfirmedJoin) {
      setHasConfirmedJoin(true);
    }
  };

  console.log("VideoRoom.render. Curr video length: ", videos.length);
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
  background-color: gray;
  // background-color: #262626;

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
