import React, { useState } from "react";
import styled from "styled-components";
import { VideoToolbarButton } from "./VideoToolbarButton";

export interface VideoToolbarProps {
  isHost: boolean;
}

export function VideoToolbar(props: VideoToolbarProps): JSX.Element {
  const [isCameraStopped, setIsCameraStopped] = useState(true);
  const [isMicMuted, setIsMicMuted] = useState(true);

  const onCameraButtonClick = () => {
    setIsCameraStopped(!isCameraStopped);
  };

  const onMicButtonClick = () => {
    setIsMicMuted(!isMicMuted);
  };

  let leaveButtonTitle = "";
  if (props.isHost) {
    leaveButtonTitle =
      "Leaving room will end the call for every participant. (You are host)";
  }

  return (
    <FixedOnBottom className="has-background-dark has-text-white is-flex is-align-items-center is-justify-content-space-between">
      <div>
        <VideoToolbarButton
          icon={isCameraStopped ? "fas fa-video-slash" : "fas fa-video"}
          title={isCameraStopped ? "Start video" : "Stop video"}
          onClick={onCameraButtonClick}
        />
        <VideoToolbarButton
          icon={isMicMuted ? "fas fa-microphone-slash" : "fas fa-microphone"}
          title={isMicMuted ? "Unmute mic" : "Mute mic"}
          onClick={onMicButtonClick}
        />
      </div>

      <button className="button is-danger mx-2" title={leaveButtonTitle}>
        Leave call
      </button>
    </FixedOnBottom>
  );
}

const FixedOnBottom = styled.div`
  height: 80px;
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
`;
