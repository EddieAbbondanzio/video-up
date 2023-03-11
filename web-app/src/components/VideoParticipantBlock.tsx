import React, { useEffect, useReducer, useRef } from "react";
import { MessageType, WebSocketResponse } from "../../../shared/src/ws";
import { createNewRtcPeerConnection } from "../media";
import { sendRequest } from "../ws";

export interface VideoParticipant {
  id: string;
  isLocal: boolean;
}

export interface VideoParticipantBlockProps {
  ws: WebSocket;
  participant: VideoParticipant;
  localVideo?: MediaStreamTrack;
  localAudio?: MediaStreamTrack;
}

export function VideoParticipantBlock(
  props: VideoParticipantBlockProps,
): JSX.Element {
  const { ws, participant, localVideo, localAudio } = props;

  const peerConnection = useRef<RTCPeerConnection | undefined>();

  // Initialize peer connection
  useEffect(() => {
    if (participant.isLocal) {
      return;
    }

    const newConnection = createNewRtcPeerConnection();
    if (localVideo) {
      newConnection.addTrack(localVideo);
    }
    if (localAudio) {
      newConnection.addTrack(localAudio);
    }

    const onNegotiationNeeded = async () => {
      console.log("negotiationneeded:", participant.id);

      const offer = await newConnection.createOffer();
      await newConnection.setLocalDescription(offer);

      // Send offer to remote participant
      sendRequest(ws, {
        type: MessageType.VideoOffer,
        destinationID: participant.id,
        sdp: newConnection.localDescription!,
      });
    };

    const onTrack = ({ track }: RTCTrackEvent) => {
      console.log("Remote track received: ", track!.kind);

      switch (track!.kind) {
        case "video":
          // setRemoteVideoTrack(track);
          break;
        case "audio":
          // setRemoteAudioTrack(track);
          break;
        default:
          throw new Error(`Unsupported video track kind: ${track.kind}`);
      }
    };

    newConnection.addEventListener("track", onTrack);
    newConnection.addEventListener("negotiationneeded", onNegotiationNeeded);
    peerConnection.current = newConnection;

    return () => {
      newConnection.removeEventListener("track", onTrack);
      newConnection.removeEventListener(
        "negotiationneeded",
        onNegotiationNeeded,
      );
    };
  }, [participant.id]);

  // Listen for websocket responses
  useEffect(() => {
    if (participant.isLocal) {
      return;
    }

    const onMessage = (ev: MessageEvent) => {
      const response: WebSocketResponse = JSON.parse(ev.data);
      console.log("GOT RESPONSE: ", response);

      switch (response.type) {
        case MessageType.VideoOffer:
          break;

        case MessageType.VideoAnswer:
          break;

        // TODO: Handle ICE candidates!
      }
    };
    ws.addEventListener("message", onMessage);

    return () => {
      ws.removeEventListener("message", onMessage);
    };
  });

  return <div>BLOCK</div>;
}
