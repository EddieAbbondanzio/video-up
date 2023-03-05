import React, { useState } from "react";
import styled from "styled-components";
import { ShareButton } from "./ShareLinkButton";
import { VideoToolbarButton } from "./VideoToolbarButton";

export interface VideoToolbarProps {
  domain: string;
  isHost: boolean;
  roomID?: string;
}

export function VideoToolbar(props: VideoToolbarProps): JSX.Element {
  const { domain, isHost, roomID } = props;

  const [isCameraStopped, setIsCameraStopped] = useState(true);
  const [isMicMuted, setIsMicMuted] = useState(true);

  const onCameraButtonClick = () => {
    setIsCameraStopped(!isCameraStopped);
  };

  const onMicButtonClick = () => {
    setIsMicMuted(!isMicMuted);
  };

  const onLeaveRoomClick = () => {
    window.location.replace("/");
  };

  let leaveButtonTitle = "";
  if (isHost) {
    leaveButtonTitle =
      "Leaving room will end the call for every participant. (You are host)";
  }

  return (
    <FixedOnBottom className="has-background-dark has-text-white is-flex is-align-items-center is-justify-content-center">
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

        <ShareButton domain={domain} roomID={roomID} isHost={isHost} />

        <VideoToolbarButton
          color="is-danger"
          icon="fas fa-sign-out-alt"
          title={leaveButtonTitle}
          onClick={onLeaveRoomClick}
        />
      </div>
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
