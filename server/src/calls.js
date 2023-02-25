import { addHours } from "date-fns";

const CALL_LIFETIME_HOURS = 1;

export async function getCallById(db, callID) {
  const call = await db.get("SELECT * FROM calls where call_id = ?", [callID]);

  if (call == null) {
    return null;
  }

  return {
    hostID: call.host_id,
    callID: call.call_id,
    sdp: JSON.parse(call.sdp),
    expiresAt: new Date(call.expires_at),
  };
}

export async function createCall(db, hostID, callID, sdp) {
  const stringifiedSDP = JSON.stringify(sdp);
  const expiresAt = addHours(new Date(), CALL_LIFETIME_HOURS);

  await db.run(
    `
    INSERT INTO calls 
      (host_id, call_id, sdp, expires_at) 
      values 
      (?, ?, ?, ?);
  `,
    [hostID, callID, stringifiedSDP, expiresAt],
  );

  return {
    hostID,
    callID,
    sdp,
    expiresAt,
  };
}
