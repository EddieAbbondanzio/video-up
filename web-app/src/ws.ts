import { WebSocketRequest } from "../../shared/src/ws";

export async function openWSConnection(url: string): Promise<WebSocket> {
  const ws = new WebSocket(url);

  return new Promise(res => {
    ws.addEventListener("open", () => res(ws));
  });
}

export function sendRequest(ws: WebSocket, req: WebSocketRequest): void {
  console.log("SENDING REQUEST: ", req);
  const jsonString = JSON.stringify(req);
  ws.send(jsonString);
}
