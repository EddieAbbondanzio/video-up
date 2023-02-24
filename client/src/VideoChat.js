import { useEffect, useState } from "react";

// // https://gist.github.com/zziuni/3741933
const STUN_SERVERS = [
  "stun.l.google.com:19302",
  "stun1.l.google.com:19302",
  "stun2.l.google.com:19302",
  "stun3.l.google.com:19302",
  "stun4.l.google.com:19302",
];

export function VideoChat(props) {
  const { ws, callID, remoteSDP } = props;

  if (callID == null) {
    throw new Error("callID was null");
  }
  if (remoteSDP == null) {
    throw new Error("remoteSDP was null");
  }

  const [pc, setPC] = useState(null);
  useEffect(() => {
    (async () => {
      console.log("Init video / audio");
      const pc = await createRtcPeerConnection(ws);

      const [video, audio] = await getVideoAndAudioTracks();
      pc.addTrack(video);
      pc.addTrack(audio);

      setPC(pc);
    })();
  }, [remoteSDP]);

  return <div>VIDEO!</div>;
}

async function createRtcPeerConnection(ws) {
  const pc = new RTCPeerConnection({});

  // Listen for when we find an ICE candidate so we can notify the other peer.
  pc.addEventListener("icecandidate", ev => {
    console.log("ICE CANDIDATE: ", ev);
  });

  // Listen for incoming tracks
  pc.addEventListener("track", ev => {
    console.log("TRACK: ", ev);
  });

  // Listen for when we need to restart the connection process.
  // (negotiationneeded is triggered when we add tracks to the stream)
  pc.addEventListener("negotiationneeded", async () => {
    console.log("Negotiation needed!");
    const offer = pc.createOffer();
    await pc.setLocalDescription(offer);
  });

  // Optionals
  // TODO: Decide if needed.
  pc.addEventListener("iceconnectionstatechange", ev => {
    console.log("ICE STATE CHANGE: ", ev);
  });

  return pc;
}

async function getVideoAndAudioTracks() {
  const mediaStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
  });

  const [videoTrack] = mediaStream.getVideoTracks();
  const [audioTrack] = mediaStream.getAudioTracks();

  return [videoTrack, audioTrack];
}
