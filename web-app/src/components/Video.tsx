import React from "react";
import { Peer } from "../media";

export interface VideoProps {
  video?: MediaStreamTrack;
  audio?: MediaStreamTrack;
  // TODO: Do we need this?
  stream?: MediaStream;
}

export function Video(props: VideoProps): JSX.Element {
  // Grab remote tracks.
  // Add them to video / audio elements no?

  return <div>VIDEO BLOCK!</div>;
}
