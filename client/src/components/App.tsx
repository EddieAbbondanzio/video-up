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

  const [roomID, setRoomID] = useState<string | null>(null);
  const [isHost, setIsHost] = useState<boolean>(false);

  useEffect(() => {
    let url = new URL(window.location.href);
    if (url.pathname !== "/") {
      setRoomID(url.pathname.slice(1));
    }
  }, [window.location.href]);

  const [isInRoom, setIsInRoom] = useState(roomID != null);
  const hostRoom = () => {
    setIsInRoom(true);
    setIsHost(true);
  };

  return (
    <>
      <NavBar />
      {!isInRoom && <Welcome onHost={hostRoom} />}
      {isInRoom && <VideoRoom ws={ws} isHost={isHost} roomID={roomID} />}
    </>
  );
}
