export async function getIceCandidatesForCall(db, callID, senderID) {
  const candidates = await db.all(
    "SELECT * FROM ice_candidates WHERE call_id = ? AND sender_id = ?",
    [callID, senderID],
  );

  return candidates.map(c => ({
    senderID: c.sender_id,
    callID: c.call_id,
    candidate: JSON.parse(c.candidate),
  }));
}

export async function createIceCandidate(db, callID, senderID, candidate) {
  const stringifiedCandidate = JSON.stringify(candidate);

  await db.run(
    `
    INSERT INTO ice_candidates
    (call_id, sender_id, candidate)
    VALUES
    (?, ?, ?)
    `,
    [callID, senderID, stringifiedCandidate],
  );

  return {
    callID,
    senderID,
    stringifiedCandidate,
  };
}
