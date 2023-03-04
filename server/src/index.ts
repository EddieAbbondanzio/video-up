// @ts-nocheck

import { WebSocketServer } from "ws";
import { dataSource } from "./db";
import { createCall, getCallById, updateCallGuestID } from "./calls";
import { createIceCandidate, getIceCandidatesForCall } from "./ice-candidates";
import { nanoid } from "nanoid";

const PORT = 8080;
const WS_ID_LENGTH = 16;

// Keep in sync with front-end definition
const MessageType = Object.freeze({
  VideoOffer: "video-offer",
  VideoAnswer: "video-answer",
  NewIceCandidate: "new-ice-candidate",
  ParticipantLeft: "participant-left",
});

async function main() {
  console.log("Data source: ", dataSource);
  await dataSource.initialize();

  // const db = await getDB();
  // await initDB(db);

  // const wss = new WebSocketServer({ port: PORT, clientTracking: true }, () => {
  //   console.log(`Listening on ${PORT}`);
  // });

  // wss.on("connection", function connection(ws) {
  //   // Web sockets are assigned unique IDs so we can selectively forward messages
  //   // between each end of the video call.
  //   ws.id = nanoid(WS_ID_LENGTH);

  //   ws.on("error", console.error);

  //   ws.on("message", async function message(data) {
  //     const json = JSON.parse(data);
  //     let call;

  //     switch (json.type) {
  //       case MessageType.VideoOffer:
  //         // No SDP offer means it's a guest joining
  //         if (json.sdp == null) {
  //           call = await getCallById(db, json.callID);
  //           if (call == null) {
  //             return;
  //           }

  //           // When the guestID is set, it means there's already 2 people in the
  //           // call and we don't want to let any others join.
  //           if (call.guestID != null) {
  //             return;
  //           }

  //           sendJSON(ws, { type: MessageType.VideoOffer, sdp: call.sdp });
  //           await updateCallGuestID(db, call, ws.id);

  //           // Forward any ICE candidates we cached off from the host
  //           const iceCandidates = await getIceCandidatesForCall(
  //             db,
  //             call.callID,
  //             call.hostID,
  //           );

  //           for (const iceCandidate of iceCandidates) {
  //             sendJSON(ws, {
  //               type: MessageType.NewIceCandidate,
  //               candidate: iceCandidate.candidate,
  //             });
  //           }
  //         } else {
  //           await createCall(db, ws.id, json.callID, json.sdp);
  //         }

  //         ws.callID = json.callID;
  //         break;

  //       case MessageType.VideoAnswer:
  //         call = await getCallById(db, json.callID);
  //         if (call == null) {
  //           return;
  //         }

  //         const hostWS = getClientWebSocketById(wss, call.hostID);
  //         sendJSON(hostWS, { type: MessageType.VideoAnswer, sdp: json.sdp });
  //         break;

  //       case MessageType.NewIceCandidate:
  //         call = await getCallById(db, json.callID);
  //         if (call == null) {
  //           return;
  //         }

  //         const senderID = ws.id;
  //         const receiverID = [call.guestID, call.hostID].find(
  //           id => id != senderID,
  //         );

  //         // If the other end is already known, immediately forward ICE candidates
  //         if (receiverID != null) {
  //           const receiverWS = getClientWebSocketById(wss, receiverID);
  //           sendJSON(receiverWS, {
  //             type: MessageType.NewIceCandidate,
  //             candidate: json.candidate,
  //           });
  //         }
  //         // Otherwise cache them off so we can forward them later on.
  //         else {
  //           await createIceCandidate(db, json.callID, senderID, json.candidate);
  //         }
  //         break;
  //     }
  //   });

  //   // Listen for web socket close event so we can notify other end of call if
  //   // one participant leaves.
  //   ws.on("close", async () => {
  //     // If the web socket didn't have a call ID set it wasn't actively in a call.
  //     if (ws.callID == null) {
  //       return;
  //     }

  //     const call = await getCallById(db, ws.callID);
  //     if (call == null) {
  //       return;
  //     }

  //     const senderID = ws.id;
  //     const receiverID = [call.guestID, call.hostID].find(id => id != senderID);
  //     if (receiverID == null) {
  //       return;
  //     }

  //     // Attempt to notify other end of the call. We soft fail if we can't find
  //     // their websocket because they may have already left the call.
  //     const receiverWS = getClientWebSocketById(wss, receiverID, true);
  //     if (receiverWS != null) {
  //       sendJSON(receiverWS, {
  //         type: MessageType.ParticipantLeft,
  //       });
  //     }
  //   });
  // });
}

if (process.env.NODE_ENV !== "test") {
  main();
}

export function sendJSON(ws, obj) {
  if (ws == null) {
    throw new Error("ws is null");
  }

  ws.send(JSON.stringify(obj));
}

export function getClientWebSocketById(wss, id, optional = false) {
  const clients = Array.from(wss.clients.values());
  const ws = clients.find(ws => ws.id === id);

  if (ws == null && !optional) {
    throw new Error(`No websocket with ID (${id}) was found.`);
  }

  return ws;
}
