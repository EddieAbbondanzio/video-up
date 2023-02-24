import { createRoot } from "react-dom/client";
import { App } from "./App";
import { openWSConnection } from "./ws.js";

async function main() {
  const ws = await openWSConnection("ws://localhost:8080");

  const container = document.getElementById("app");
  const root = createRoot(container);
  root.render(<App ws={ws} />);
}
main();
