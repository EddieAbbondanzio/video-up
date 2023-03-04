// @ts-nocheck

// Keep in sync with server side definition
export enum MessageType {
  CreateRoom = "create-room",
  ParticipantJoined = "participant-joined",
  ParticipantLeft = "participant-left",
  RoomClosed = "room-closed",
}

export async function openWSConnection(url) {
  const ws = new WebSocket(url);

  return new Promise(res => {
    ws.addEventListener("open", () => res(ws));
  });
}

export async function sendJSON(ws, msg) {
  const jsonString = JSON.stringify(msg);
  ws.send(jsonString);
}
