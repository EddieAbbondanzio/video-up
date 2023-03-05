import React from "react";
import { VideoToolbar } from "./VideoToolbar";

export interface VideoRoomProps {
  ws: WebSocket;
  isHost: boolean;
  roomID: string | null;
}

export function VideoRoom(props: VideoRoomProps): JSX.Element {
  const { ws } = props;

  // TODO:
  // Send request to join room on server side
  // See if it sends us back 200, or throws error

  // Handle incoming participants that join
  // Need to send them our SDP, and accept theirs

  // Need to handle forwarding ICE candidates to each other participant

  // Need to handle participants leaving.

  // Use video participant! <VideoParticipant />

  return (
    <div>
      <i className="fas fa-user"></i>
      Hi, this is the video room.
      <VideoToolbar />
    </div>
  );
}
