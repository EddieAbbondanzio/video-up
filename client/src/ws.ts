// Keep in sync with server side definition
export enum MessageType {
  CreateRoom = "create-room",
  ParticipantJoined = "participant-joined",
  ParticipantLeft = "participant-left",
  RoomClosed = "room-closed",
}

// TODO: Add message types!

export async function openWSConnection(url: string): Promise<WebSocket> {
  const ws = new WebSocket(url);

  return new Promise(res => {
    ws.addEventListener("open", () => res(ws));
  });
}

export function sendJSON(ws: WebSocket, msg: any): void {
  const jsonString = JSON.stringify(msg);
  ws.send(jsonString);
}
