import { addHours } from "date-fns";

const CALL_LIFETIME_HOURS = 1;

export async function getCallById(db, callID) {
  const call = await db.get("SELECT * FROM calls WHERE call_id = ?", [callID]);

  if (call == null) {
    return null;
  }

  return {
    hostID: call.host_id,
    guestID: call.guest_id,
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
    INSERT INTO calls (host_id, call_id, sdp, expires_at) 
    VALUES (?, ?, ?, ?);
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

export async function updateCallGuestID(db, call, guestID) {
  if (call.guestID != null) {
    throw new Error(
      `Call ${call.callID} already has guestID (${call.guestID}) set.`,
    );
  }

  await db.run(`UPDATE calls SET guest_id = ? WHERE call_id = ?`, [
    guestID,
    call.callID,
  ]);

  call.guestID = guestID;
  return call;
}
