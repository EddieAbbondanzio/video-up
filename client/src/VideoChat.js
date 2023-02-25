import { useEffect, useMemo, useRef, useState } from "react";
import { MessageType, sendJSON } from "./ws.js";

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

  // Initialize
  useEffect(() => {
    if (!isHost) {
      sendJSON(ws, {
        type: MessageType.VideoOffer,
        callID,
      });
    } else {
      console.log("Start host video/audio");
      // TODO: Pull to function?
      (async () => {
        const { video, audio } = await startLocalVideoAndAudio();
        peerConnection.addTrack(video);
        peerConnection.addTrack(audio);
      })();
    }
  }, [callID, peerConnection]);

  // Manage PeerConnection event listeners
  useEffect(() => {
    console.log("Subscribe to pc events");

    // Notify signaling server of our SDP offer so it can pass the offer to the
    // callee when they join.
    const onNegotiationNeeded = async () => {
      console.log("SDP offer created. Notifying server...");

      if (isHost) {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        console.log("OFFER IS OF TYPE: ", offer);

        await sendJSON(ws, {
          type: MessageType.VideoOffer,
          callID,
          sdp: peerConnection.localDescription,
        });
      }
    };

    const onTrack = ev => {
      // TODO: Add tracks to HTML to start playing them.
      console.log("TRACK: ", ev);
    };

    const onIceCandidate = ev => {
      if (!ev.candidate) {
        return;
      }

      console.log("Sending ICE candidate to server");
      sendJSON(ws, {
        type: MessageType.NewIceCandidate,
        callID,
        candidate: ev.candidate,
      });
    };

    peerConnection.addEventListener("negotiationneeded", onNegotiationNeeded);
    peerConnection.addEventListener("track", onTrack);
    peerConnection.addEventListener("icecandidate", onIceCandidate);

    return () => {
      peerConnection.removeEventListener(
        "negotiationneeded",
        onNegotiationNeeded,
      );
      peerConnection.removeEventListener("track", onTrack);
      peerConnection.removeEventListener("icecandidate", onIceCandidate);
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
          // TODO: Pull this to a function
          (async () => {
            console.log("Client received video offer");
            const desc = new RTCSessionDescription(json.sdp);

            await peerConnection.setRemoteDescription(desc);

            const { video, audio } = await startLocalVideoAndAudio();
            peerConnection.addTrack(video);
            peerConnection.addTrack(audio);

            const answer = await peerConnection.createAnswer();
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
          if (!isHost) {
            return;
          }
          console.log("HOST GOT VIDEO ANSWER BACK!", json);
          peerConnection.setRemoteDescription(json.sdp);
          break;

        case MessageType.NewIceCandidate:
          const candidate = new RTCIceCandidate(json.candidate);
          peerConnection.addIceCandidate(candidate);
          break;
      }
    };

    ws.addEventListener("message", onMessage);

    return () => {
      ws.removeEventListener("message", onMessage);
    };
  }, [ws, peerConnection, isHost]);

  return <div>VIDEO!</div>;
}

async function startLocalVideoAndAudio() {
  const mediaStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
  });

  const [video] = mediaStream.getVideoTracks();
  const [audio] = mediaStream.getAudioTracks();

  return { video, audio };
}
