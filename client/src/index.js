import { createRoot } from "react-dom/client";
import { App } from "./App";
import { openWSConnection } from "./ws.js";

async function main() {
  const ws = await openWSConnection("ws://localhost:8080");

  const container = document.getElementById("app");
  const root = createRoot(container);
  root.render(<App ws={ws} />);
}
main();

// // https://gist.github.com/zziuni/3741933
// const STUN_SERVERS = [
//   "stun.l.google.com:19302",
//   "stun1.l.google.com:19302",
//   "stun2.l.google.com:19302",
//   "stun3.l.google.com:19302",
//   "stun4.l.google.com:19302",
// ];

// async function main() {
//   const ws = await openWSConnection("ws://localhost:8080");
//   ws.addEventListener("message", ({ data }) => {
//     console.log(data);
//     const json = JSON.parse(data);

//     switch (json.type) {
//       case "get-sdp":
//         console.log("GOT SDP: ", json.sdp);
//         break;
//     }
//   });

//   // If a query param was set, it means we're trying to join an existing call, otherwise
//   // we want to host a new one.
//   let callID = new URL(window.location.href).searchParams.get("callID");
//   let isHost = callID == null;
//   if (isHost) {
//     callID = nanoid(CALL_ID_LENGTH);
//   } else {
//     console.log("REQUEST SDP FOR CALL ID: ", callID);
//     ws.send(
//       JSON.stringify({
//         type: "get-sdp",
//         callID,
//       }),
//     );
//   }

//   const [video, audio] = await getVideoAndAudioTracks();
//   const pc = await createRtcPeerConnection(ws, callID, isHost, video, audio);
// }
// main();

// async function createRtcPeerConnection(ws, callID, isHost, video, audio) {
//   const pc = new RTCPeerConnection({});
//   pc.addTrack(video);
//   pc.addTrack(audio);

//   // Listen for when we find an ICE candidate so we can notify the other peer.
//   pc.addEventListener("icecandidate", ev => {
//     console.log("ICE CANDIDATE: ", ev);
//   });

//   // Listen for incoming tracks
//   pc.addEventListener("track", ev => {
//     console.log("TRACK: ", ev);
//   });

//   // Listen for when we need to restart the connection process.
//   // (negotiationneeded is triggered when we add tracks to the stream)
//   pc.addEventListener("negotiationneeded", async () => {
//     console.log("Negotiation needed!");
//     const offer = pc.createOffer();
//     await pc.setLocalDescription(offer);

//     if (isHost) {
//       // Notify signaling server so we can pass the SDP offer to the other peer.
//       ws.send(
//         JSON.stringify({
//           type: "register-call",
//           callID,
//           sdp: pc.localDescription,
//         }),
//       );
//     }
//   });

//   // Optionals
//   // TODO: Decide if needed.
//   pc.addEventListener("iceconnectionstatechange", ev => {
//     console.log("ICE STATE CHANGE: ", ev);
//   });

//   return pc;
// }

// async function getVideoAndAudioTracks() {
//   const mediaStream = await navigator.mediaDevices.getUserMedia({
//     video: true,
//     audio: true,
//   });

//   const [videoTrack] = mediaStream.getVideoTracks();
//   const [audioTrack] = mediaStream.getAudioTracks();

//   return [videoTrack, audioTrack];
// }
