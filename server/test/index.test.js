import { getClientWebSocketById, sendJSON } from "../src/index.js";
import { jest } from "@jest/globals";

test("sendJSON", () => {
  expect(() => sendJSON(null, {})).toThrow(/ws is null/);

  const ws = {
    send: jest.fn(),
  };

  sendJSON(ws, { foo: "bar" });
  expect(ws.send).toHaveBeenCalledWith(JSON.stringify({ foo: "bar" }));
});

test("getClientWebSocketById", () => {
  const wss = {
    clients: new Set([{ id: "1" }, { id: "2" }, { id: "3" }]),
  };

  expect(() =>
    getClientWebSocketById(wss, "4").toThrow(/No websocket with ID 4/),
  );

  expect(() =>
    getClientWebSocketById(wss, "4", true).not.toThrow(
      /No websocket with ID 4/,
    ),
  );

  const ws1 = getClientWebSocketById(wss, "1");
  expect(ws1.id).toBe("1");
});
