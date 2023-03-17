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
  // const { media } = props;
  // const { video, audio } = media ?? {};

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  // const videoElRef = useRef<HTMLVideoElement>(null!);

  // console.log(
  //   `Video comp updating for  ${props.participantID}, remote? ${props.remote}`,
  // );
  // useEffect(() => {
  //   const videoEl = videoElRef.current;

  //   const ms = new MediaStream();
  //   if (video) {
  //     // console.log("Video added video track");
  //     ms.addTrack(video);
  //   }
  //   if (audio) {
  //     // console.log("Video added audio track");
  //     ms.addTrack(audio);
  //   }

  //   videoEl.srcObject = ms;
  // }, [video, audio]);

  // console.log("Video ", props.participantID);
  return (
    <Container>
      HI, {props.participantID}
      {/* <video ref={videoElRef} autoPlay={true} playsInline={true} /> */}
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
