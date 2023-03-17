import React, { useEffect, useRef } from "react";
import styled from "styled-components";
import { MediaState } from "../peer";

export interface VideoProps {
  participantID: string;
  remote: boolean;
  media?: MediaState;
}

export function Video(props: VideoProps): JSX.Element {
  const { media, remote } = props;
  const { video, audio } = media ?? {};

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const videoElRef = useRef<HTMLVideoElement>(null!);

  useEffect(() => {
    const videoEl = videoElRef.current;

    const ms = new MediaStream();
    if (video) {
      ms.addTrack(video);
    }
    // Only add audio track if it's a remote participant.
    if (audio && remote) {
      ms.addTrack(audio);
    }

    videoEl.srcObject = ms;
  }, [video, audio, remote]);

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
