// https://gist.github.com/zziuni/3741933
export const STUN_SERVERS = [
  "stun.l.google.com:19302",
  "stun1.l.google.com:19302",
  "stun2.l.google.com:19302",
  "stun3.l.google.com:19302",
  "stun4.l.google.com:19302",
];

export function createNewRtcPeerConnection(): RTCPeerConnection {
  return new RTCPeerConnection({
    iceServers: STUN_SERVERS.map(s => ({ urls: s })),
  });
}

export async function startLocalVideoAndAudio() {
  const mediaStream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "user" },
    audio: true,
  });

  const [video] = mediaStream.getVideoTracks();
  const [audio] = mediaStream.getAudioTracks();

  return { video, audio };
}
