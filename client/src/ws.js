// Keep in sync with server side definition
export const MessageType = Object.freeze({
  VideoOffer: "video-offer",
  VideoAnswer: "video-answer",
  NewIceCandidate: "new-ice-candidate",
});

export async function openWSConnection(url) {
  const ws = new WebSocket(url);

  return new Promise(res => {
    ws.addEventListener("open", () => res(ws));
  });
}

export async function sendJSON(ws, msg) {
  const jsonString = JSON.stringify(msg);
  console.log("GOING TO SEND: ", jsonString);
  ws.send(jsonString);
}
