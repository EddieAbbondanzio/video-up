import React, { useEffect, useRef } from "react";
import styled from "styled-components";
import { MediaState } from "../peer";

export interface VideoProps {
  // participantID / remote are just for debugging right now...
  participantID: string;
  remote: boolean;
  media?: MediaState;
}

export function Video(props: VideoProps): JSX.Element {
  const { media } = props;
  const { video, audio } = media ?? {};

  // Listen for video changes
  useEffect(() => {
    console.log("=======================================================");
    console.log({ participantID: props.participantID, remote: props.remote });
    console.log("Audio change detected: ", {
      enabled: video?.enabled,
      muted: video?.muted,
      ready: video?.readyState,
    });
  }, [
    props.participantID,
    props.remote,
    video?.enabled,
    video?.muted,
    video?.readyState,
  ]);

  // Listen for audio changes
  useEffect(() => {
    console.log("=======================================================");
    console.log({ participantID: props.participantID, remote: props.remote });
    console.log("Audio change detected: ", {
      enabled: audio?.enabled,
      muted: audio?.muted,
      ready: audio?.readyState,
    });
  }, [
    props.participantID,
    props.remote,
    audio?.enabled,
    audio?.muted,
    audio?.readyState,
  ]);

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const videoElRef = useRef<HTMLVideoElement>(null!);

  // useEffect(() => {
  //   const videoEl = videoElRef.current;

  //   if (videoEl && media?.video) {
  //     videoEl.srcObject = media.stream;
  //   }
  // }, [media?.video, media?.stream]);

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
