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
