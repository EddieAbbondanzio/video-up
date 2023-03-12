import React, { useEffect, useRef } from "react";
import styled from "styled-components";
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
    <Container>
      <video ref={videoElRef} autoPlay={true} playsInline={true} />
    </Container>
  );
}

const Container = styled.div`
  flex-basis: 50%;
  flex-grow: 1;
  max-height: 50%;

  display: flex;
  align-items: center;
  justify-content: center;

  video {
    height: 100%;
  }
`;
