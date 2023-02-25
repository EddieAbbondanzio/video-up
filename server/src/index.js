import { WebSocketServer } from "ws";
import { getDB, initDB } from "./db.js";
import { nanoid } from "nanoid";
import { createCall, getCallById } from "./calls.js";

const PORT = 8080;
const WS_ID_LENGTH = 16;

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
    // Web sockets are assigned unique IDs so we can track hosts.
    ws.id = nanoid(WS_ID_LENGTH);

    ws.on("error", console.error);

    ws.on("message", async function message(data) {
      const json = JSON.parse(data);

      switch (json.type) {
        // Calls are registered in the database because the callee won't be listening
        // immediately as they don't have the link uet.
        case MessageType.VideoOffer:
          // If no sdp offer was received, it means the client is trying to join
          // a call.
          if (json.sdp == null) {
            const call = await getCallById(db, json.callID);
            if (call == null) {
              return;
            }

            ws.send(
              JSON.stringify({
                type: MessageType.VideoOffer,
                sdp: call.sdp,
              }),
            );
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
          hostWS.send(
            JSON.stringify({
              type: MessageType.VideoAnswer,
              sdp: json.sdp,
            }),
          );

          break;
      }
    });
  });
}
main();

function getClientWebSocketById(wss, id) {
  const clients = Array.from(wss.clients.values());
  return clients.find(ws => ws.id === id);
}
