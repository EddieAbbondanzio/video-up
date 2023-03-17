import React, { useEffect, useMemo, useRef, useState } from "react";
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

  // Avoid race conditions with starting camera by saving current state in a
  // promise.
  const localMediaPromise = useRef<Promise<MediaState> | undefined>(undefined);
  useEffect(() => {
    if (localMediaPromise.current) {
      return;
    }
    if (!hasConfirmedJoin && !isHost) {
      return;
    }

    (async () => {
      localMediaPromise.current = startLocalVideoAndAudio();
      setLocalMedia(await localMediaPromise.current);
    })();
  }, [isHost, hasConfirmedJoin, localMedia]);

  // Send local media to peers on change.
  useEffect(() => {
    if (!localMedia) {
      return;
    }

    for (const peer of peers) {
      peer.setLocalMedia(localMedia);
    }
  }, [peers, localMedia]);

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
            peer.setLocalMedia(localMedia);
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
          setRemoteMedia(existing => {
            delete existing[peer!.remoteParticipantID];
            return { ...existing };
          });
          peer.destroy();
          break;

        case MessageType.RoomClosed:
          setPeers(peers => {
            for (const peer of peers) {
              peer.destroy();
            }

            return [];
          });
          setRemoteMedia({});

          // TODO: Come up with better UI for closing room.
          setTimeout(() => {
            alert("Room was closed due to host leaving.");
            window.location.replace("/");
          }, 30);
          break;
      }
    };
    ws.addEventListener("message", onMessage);

    return () => {
      ws.removeEventListener("message", onMessage);
    };
  }, [ws, localMedia, peers]);

  // Listen for incoming remote tracks
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

        // N.B. React won't detect the change unless we spread into a new object.
        return { ...existing };
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

  // Render videos
  const videos = useMemo(() => {
    const vids: JSX.Element[] = [];

    if (participantID && (hasConfirmedJoin || isHost)) {
      vids.push(
        <Video
          key={participantID}
          remote={false}
          participantID={participantID}
          media={localMedia}
        />,
      );

      for (const [pID, media] of Object.entries(remoteMedia)) {
        vids.push(
          <Video key={pID} remote={true} participantID={pID} media={media} />,
        );
      }
    }

    return vids;
  }, [remoteMedia, hasConfirmedJoin, isHost, localMedia, participantID]);

  const onJoin = () => {
    if (!hasConfirmedJoin) {
      setHasConfirmedJoin(true);
    }
  };

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
