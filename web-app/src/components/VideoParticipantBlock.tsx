import React, { useEffect, useReducer, useRef } from "react";
import { MessageType, WebSocketResponse } from "../../../shared/src/ws";
import { createNewRtcPeerConnection, Peer } from "../media";
import { sendRequest } from "../ws";

export interface VideoParticipantBlockProps {
  peer: Peer;
}

export function VideoParticipantBlock(
  props: VideoParticipantBlockProps,
): JSX.Element {
  const { peer } = props;

  // Grab remote tracks.
  // Add them to video / audio elements no?

  return <div>{peer.remoteParticipantID}</div>;
}
