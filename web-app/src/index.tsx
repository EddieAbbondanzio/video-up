import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./components/App";
import { openWSConnection } from "./ws";

async function main(): Promise<void> {
  const container = document.getElementById("app");
  if (container == null) {
    throw new Error("No container to render React in.");
  }

  const ws = await openWSConnection("ws://localhost:8080");
  const root = createRoot(container);
  root.render(<App ws={ws} />);
}
main();
