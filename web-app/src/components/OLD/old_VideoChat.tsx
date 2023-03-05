// @ts-nocheck
import React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Video } from "./old_Video";
import { Audio } from "./old_Audio";
import { MessageType, sendJSON } from "../ws";

// https://gist.github.com/zziuni/3741933
const STUN_SERVERS = [
  "stun.l.google.com:19302",
  "stun1.l.google.com:19302",
  "stun2.l.google.com:19302",
  "stun3.l.google.com:19302",
  "stun4.l.google.com:19302",
];

export function VideoChat(props) {
  const { ws, callID, isHost } = props;

  if (callID == null) {
    throw new Error("callID was null");
  }

  const peerConnection = useMemo(() => {
    return new RTCPeerConnection({
      iceservers: STUN_SERVERS.map(s => ({ urls: s })),
    });
  }, [callID]);

  const [localVideoTrack, setLocalVideoTrack] = useState(null);
  const [localAudioTrack, setLocalAudioTrack] = useState(null);

  const [remoteVideoTrack, setRemoteVideoTrack] = useState(null);
  const [remoteAudioTrack, setRemoteAudioTrack] = useState(null);

  const iceCandidates = useRef([]);

  // Initialize
  useEffect(() => {
    if (!isHost) {
      sendJSON(ws, { type: MessageType.VideoOffer, callID });
    } else {
      (async () => {
        const { video, audio } = await startLocalVideoAndAudio();
        peerConnection.addTrack(video);
        peerConnection.addTrack(audio);

        setLocalVideoTrack(video);
        setLocalAudioTrack(audio);
      })();
    }
  }, [callID, peerConnection]);

  // Manage PeerConnection event listeners
  useEffect(() => {
    // Notify signaling server of our SDP offer so it can pass the offer to the
    // callee when they join.
    const onNegotiationNeeded = async () => {
      console.log("negotiationneeded");
      if (isHost) {
        const offer = await peerConnection.createOffer();
        console.log("setLocalDescription (host)");
        await peerConnection.setLocalDescription(offer);

        await sendJSON(ws, {
          type: MessageType.VideoOffer,
          callID,
          sdp: peerConnection.localDescription,
        });
      }
    };

    const onTrack = ({ track }) => {
      console.log("Remote track received: ", track.kind);

      switch (track.kind) {
        case "video":
          setRemoteVideoTrack(track);
          break;
        case "audio":
          setRemoteAudioTrack(track);
          break;
        default:
          throw new Error(`Unsupported video track kind: ${track.kind}`);
      }
    };

    const onIceCandidate = ev => {
      if (!ev.candidate) {
        return;
      }

      sendJSON(ws, {
        type: MessageType.NewIceCandidate,
        callID,
        candidate: ev.candidate,
      });
    };

    const onConnectionStateChange = ev => {
      console.log("===============================");
      console.log("connection State Change: ", ev);
      console.log("===============================");
    };

    peerConnection.addEventListener("negotiationneeded", onNegotiationNeeded);
    peerConnection.addEventListener("track", onTrack);
    peerConnection.addEventListener("icecandidate", onIceCandidate);
    peerConnection.addEventListener(
      "connectionstatechange",
      onConnectionStateChange,
    );

    return () => {
      peerConnection.removeEventListener(
        "negotiationneeded",
        onNegotiationNeeded,
      );
      peerConnection.removeEventListener("track", onTrack);
      peerConnection.removeEventListener("icecandidate", onIceCandidate);
      peerConnection.removeEventListener(
        "connectionstatechange",
        onConnectionStateChange,
      );
    };
  }, [ws, peerConnection]);

  // Listen for WebSocket messages from the signaling server
  useEffect(() => {
    const onMessage = ev => {
      const json = JSON.parse(ev.data);

      switch (json.type) {
        case MessageType.VideoOffer:
          // Host doesn't need to handle video offers since it's the original sender.
          if (isHost) {
            return;
          }

          // Client needs to create local SDP answer and return it back to host
          (async () => {
            const desc = new RTCSessionDescription(json.sdp);

            console.log("setRemoteDescription (client)");
            await peerConnection.setRemoteDescription(desc);

            const candidates = iceCandidates.current;
            if (candidates.length === 0) {
              return;
            }

            for (const c of candidates) {
              peerConnection.addIceCandidate(new RTCIceCandidate(c));
            }
            iceCandidates.current = [];

            const { video, audio } = await startLocalVideoAndAudio();
            peerConnection.addTrack(video);
            peerConnection.addTrack(audio);

            setLocalVideoTrack(video);
            setLocalAudioTrack(audio);

            const answer = await peerConnection.createAnswer();
            console.log("setLocalDescription (client)");
            await peerConnection.setLocalDescription(answer);

            // Alert signal server of our answer so it can be passed to the host.
            await sendJSON(ws, {
              type: MessageType.VideoAnswer,
              callID,
              sdp: peerConnection.localDescription,
            });
          })();
          break;

        case MessageType.VideoAnswer:
          // Guest doesn't handle video answers since it's the original sender.
          if (!isHost) {
            return;
          }

          (async () => {
            await peerConnection.setRemoteDescription(json.sdp);

            const candidates = iceCandidates.current;
            if (candidates.length === 0) {
              return;
            }

            for (const c of candidates) {
              peerConnection.addIceCandidate(new RTCIceCandidate(c));
            }
            iceCandidates.current = [];
          })();
          break;

        case MessageType.NewIceCandidate:
          console.log("addIceCandidate ", isHost ? "(host)" : "(client)");

          // N.B. Firefox throws an error if we add an ICE candidate before the
          // remote description so we backlog them if we haven't set the remote
          // description yet.
          if (peerConnection.remoteDescription == null) {
            iceCandidates.current.push(json.candidate);
          } else {
            const candidate = new RTCIceCandidate(json.candidate);
            peerConnection.addIceCandidate(candidate);
          }
          break;

        case MessageType.ParticipantLeft:
          console.log("Other participant left!");
          setRemoteVideoTrack(null);
          setRemoteAudioTrack(null);
          break;
      }
    };

    ws.addEventListener("message", onMessage);

    return () => {
      ws.removeEventListener("message", onMessage);
    };
  }, [ws, peerConnection, isHost]);

  return (
    <div>
      <div>
        <Video track={localVideoTrack} />
      </div>
      <div>
        <Video track={remoteVideoTrack} />
        <Audio track={remoteAudioTrack} />
      </div>
    </div>
  );
}

async function startLocalVideoAndAudio() {
  const mediaStream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "user" },
    audio: true,
  });

  const [video] = mediaStream.getVideoTracks();
  const [audio] = mediaStream.getAudioTracks();

  return { video, audio };
}
