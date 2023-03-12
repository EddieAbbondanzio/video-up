import { JoinRoomRequest, MessageType } from "../../shared/src/ws";
import { sendResponse } from "../src";
import { WebSocket } from "ws";

test("sendResponse", () => {
  const ws = {
    send: jest.fn(),
  } as unknown as WebSocket;

  const req: JoinRoomRequest = {
    type: MessageType.JoinRoom,
    roomID: "1",
  };

  sendResponse(ws, req);
  expect(ws.send).toHaveBeenCalledWith(JSON.stringify(req));
});
