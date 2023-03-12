import React, { useEffect, useRef } from "react";
import { MediaState, Peer } from "../peer";

export interface VideoProps {
  media?: MediaState;
}

export function Video(props: VideoProps): JSX.Element {
  const { media } = props;
  const videoElRef = useRef<HTMLVideoElement>(null!);

  useEffect(() => {
    const videoEl = videoElRef.current;

    if (videoEl && media?.video) {
      videoEl.srcObject = media.stream;
    }
  }, [media?.video]);

  // Add them to video / audio elements no?

  return (
    <div>
      <video ref={videoElRef} autoPlay={true} playsInline={true} />
    </div>
  );
}
