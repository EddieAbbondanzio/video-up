import { WebSocketServer } from "ws";
import { addHours } from "date-fns";
import { getDB, initDB } from "./db.js";

const PORT = 8080;

const MessageType = Object.freeze({
  RegisterCall: "register-call",
  JoinCall: "join-call",
  VideoOffer: "video-offer",
});

async function main() {
  const db = await getDB();
  await initDB(db);
  console.log(await db.get("select * from calls"));

  const wss = new WebSocketServer({ port: PORT });
  console.log(`Listening on ${PORT}`);

  wss.on("connection", function connection(ws) {
    ws.on("error", console.error);

    ws.on("message", async function message(data) {
      const json = JSON.parse(data);

      switch (json.type) {
        // Calls are registered in the database because the callee won't be listening
        // immediately as they don't have the link uet.
        case MessageType.RegisterCall:
          console.log("REGISTER CALL: ", json);
          const { callID, sdp } = json;
          const expiresAt = addHours(new Date(), 1);

          await insertCall(db, {
            callID,
            sdp,
            expiresAt,
            wasConnected: false,
          });
          break;

        case MessageType.VideoOffer:
          console.log("Video offer");
          break;

        case MessageType.JoinCall:
          const requestedCallID = json.callID;
          ws.send(
            JSON.stringify({
              type: MessageType.JoinCall,
              sdp: "LOL",
            }),
          );

          // const foundSDP = await getSDP(db, requestedCallID);
          // console.log({ foundSDP });

          // if (foundSDP) {
          //   ws.send(
          //     JSON.stringify({
          //       type: MessageType.JoinCall,
          //       sdp: foundSDP.sdp,
          //     }),
          //   );
          // }
          break;
      }
    });
  });
}
main();

// TODO: Wrap db in promises instead of this...

async function getSDP(db, callID) {
  return new Promise((res, rej) => {
    db.get(`SELECT * from calls where call_id = ?`, [callID], (err, row) => {
      if (err) {
        rej(err);
      } else {
        res(row);
      }
    });
  });
}

async function insertCall(db, call) {
  return new Promise((res, rej) => {
    const { callID, sdp, expiresAt, wasConnected } = call;

    db.run(
      `
      INSERT INTO calls 
        (call_id, sdp, expires_at, link_was_opened) 
        values 
        (?, ?, ?, ?);
    `,
      [callID, sdp, expiresAt, wasConnected],
      err => {
        if (err) {
          rej(err);
        } else {
          res();
        }
      },
    );
  });
}
