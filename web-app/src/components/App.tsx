import React from "react";
import { useEffect, useState } from "react";
import { NavBar } from "./NavBar";
import { VideoRoom } from "./VideoRoom";
import { Welcome } from "./Welcome";

export interface AppProps {
  ws: WebSocket;
}

export function App(props: AppProps) {
  const { ws } = props;

  const [showWelcome, setShowWelcome] = useState(true);
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.pathname !== "/") {
      setShowWelcome(false);
    }
  }, []);

  const onHost = () => {
    setShowWelcome(false);
  };

  return (
    <>
      <NavBar />
      {showWelcome && <Welcome onHost={onHost} />}
      {!showWelcome && <VideoRoom ws={ws} />}
    </>
  );
}
