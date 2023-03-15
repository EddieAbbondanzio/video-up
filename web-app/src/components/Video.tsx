import React, { useEffect, useRef } from "react";
import styled from "styled-components";
import { MediaState } from "../peer";

export interface VideoProps {
  media?: MediaState;
}

export function Video(props: VideoProps): JSX.Element {
  const { media } = props;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const videoElRef = useRef<HTMLVideoElement>(null!);

  useEffect(() => {
    const videoEl = videoElRef.current;

    if (videoEl && media?.video) {
      videoEl.srcObject = media.stream;
    }
  }, [media?.video, media?.stream]);

  // Add them to video / audio elements no?

  return (
    <Container>
      <video ref={videoElRef} autoPlay={true} playsInline={true} />
    </Container>
  );
}

const Container = styled.div`
  height: 480px;
  width: 640px;

  display: flex;
  align-items: center;
  justify-content: center;

  video {
    height: 100%;
  }
`;
