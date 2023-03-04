// @ts-nocheck

import { createRoot } from "react-dom/client";
import { App } from "./components/App";
import { openWSConnection } from "./ws";

async function main() {
  const ws = await openWSConnection("ws://localhost:8080");

  const container = document.getElementById("app");
  const root = createRoot(container);
  root.render(<App ws={ws} />);
}
main();
