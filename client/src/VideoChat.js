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

  const [localVideoTrack, setLocalVideoTrack] = useState(null);
  const [localAudioTrack, setLocalAudioTrack] = useState(null);

  const [remoteVideoTrack, setRemoteVideoTrack] = useState(null);
  const [remoteAudioTrack, setRemoteAudioTrack] = useState(null);

  // Initialize
  useEffect(() => {
    if (!isHost) {
      sendJSON(ws, {
        type: MessageType.VideoOffer,
        callID,
      });
    } else {
      // TODO: Pull to function?
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
      switch (track.kind) {
        case "video":
          setRemoteVideoTrack(track);
          break;

        case "audio":
          setRemoteAudioTrack(track);
          break;
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
          // TODO: Pull this to a function
          (async () => {
            const desc = new RTCSessionDescription(json.sdp);

            console.log("setRemoteDescription (client)");
            await peerConnection.setRemoteDescription(desc);

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
          if (!isHost) {
            return;
          }
          console.log("setRemoteDescription (host)");
          peerConnection.setRemoteDescription(json.sdp);
          break;

        case MessageType.NewIceCandidate:
          console.log("addIceCandidate ", isHost ? "(host)" : "(client)");
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

  // TODO: Clean up below!

  const localVideoStream = useMemo(() => {
    if (localVideoTrack == null) {
      return null;
    }

    const ms = new MediaStream([localVideoTrack]);
    return ms;
  }, [localVideoTrack]);

  const localVideoRef = useRef();
  if (localVideoRef.current != null && localVideoStream != null) {
    localVideoRef.current.srcObject = localVideoStream;
  }

  const remoteVideoStream = useMemo(() => {
    if (remoteVideoTrack == null) {
      return null;
    }

    const ms = new MediaStream([remoteVideoTrack]);
    return ms;
  }, [remoteVideoTrack]);

  const remoteVideoRef = useRef();
  if (remoteVideoRef.current != null && remoteVideoStream != null) {
    remoteVideoRef.current.srcObject = remoteVideoStream;
  }

  const remoteAudioStream = useMemo(() => {
    if (remoteAudioTrack == null) {
      return null;
    }

    const ms = new MediaStream([remoteAudioTrack]);
    return ms;
  }, [remoteAudioTrack]);

  const remoteAudioRef = useRef();
  if (remoteAudioRef.current != null && remoteAudioStream != null) {
    remoteAudioRef.current.srcObject = remoteAudioStream;
  }

  return (
    <div>
      <div>
        <video ref={localVideoRef} autoPlay={true} playsInline={true} />
      </div>
      <div>
        <video ref={remoteVideoRef} autoPlay={true} playsInline={true} />
        <audio ref={remoteAudioRef} autoPlay={true} />
      </div>
    </div>
  );
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
