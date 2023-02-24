// Keep in sync with server side definition
export const MessageType = Object.freeze({
  RegisterCall: "register-call",
  JoinCall: "join-call",
});

export async function openWSConnection(url) {
  const ws = new WebSocket(url);

  return new Promise(res => {
    const wrapper = {
      sendMessage(msg) {
        ws.send(JSON.stringify(msg));

        return {
          onResponse(cb) {
            const onMessage = response => {
              const json = JSON.parse(response.data);

              if (json.type === msg.type) {
                cb(json);
                ws.removeEventListener("message", onMessage);
              }
            };

            ws.addEventListener("message", onMessage);
          },
        };
      },
    };

    ws.addEventListener("open", () => res(wrapper));
  });
}
