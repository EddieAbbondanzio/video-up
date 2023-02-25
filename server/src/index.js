import { WebSocketServer } from "ws";
import { getDB, initDB } from "./db.js";
import { nanoid } from "nanoid";
import { createCall, getCallById, updateCallGuestID } from "./calls.js";

const PORT = 8080;
const WS_ID_LENGTH = 16;

// Keep in sync with front-end definition
const MessageType = Object.freeze({
  VideoOffer: "video-offer",
  VideoAnswer: "video-answer",
  NewIceCandidate: "new-ice-candidate",
});

async function main() {
  const db = await getDB();
  await initDB(db);

  const wss = new WebSocketServer({ port: PORT, clientTracking: true }, () => {
    console.log(`Listening on ${PORT}`);
  });

  wss.on("connection", function connection(ws) {
    // Web sockets are assigned unique IDs so we can selectively forward messages
    // between each end of the video call.
    ws.id = nanoid(WS_ID_LENGTH);

    ws.on("error", console.error);

    ws.on("message", async function message(data) {
      const json = JSON.parse(data);

      switch (json.type) {
        case MessageType.VideoOffer:
          if (json.sdp == null) {
            const call = await getCallById(db, json.callID);
            if (call == null) {
              return;
            }

            // When the guestID is set, it means there's already 2 people in the
            // call and we don't want to let any others join.
            if (call.guestID != null) {
              return;
            }

            sendJSON(ws, { type: MessageType.VideoOffer, sdp: call.sdp });
            await updateCallGuestID(db, call, ws.id);
          } else {
            await createCall(db, ws.id, json.callID, json.sdp);
          }
          break;

        case MessageType.VideoAnswer:
          const call = await getCallById(db, json.callID);
          if (call == null) {
            return;
          }

          const hostWS = getClientWebSocketById(wss, call.hostID);
          sendJSON(hostWS, { type: MessageType.VideoAnswer, sdp: json.sdp });
          break;
      }
    });
  });
}
main();

function sendJSON(ws, obj) {
  ws.send(JSON.stringify(obj));
}

function getClientWebSocketById(wss, id) {
  const clients = Array.from(wss.clients.values());
  return clients.find(ws => ws.id === id);
}
