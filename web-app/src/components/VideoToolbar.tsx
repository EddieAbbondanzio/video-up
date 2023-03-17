import React, { useState } from "react";
import styled from "styled-components";
import { ShareButton } from "./ShareLinkButton";
import { VideoToolbarButton } from "./VideoToolbarButton";

export interface VideoToolbarProps {
  domain: string;
  isHost: boolean;
  roomID?: string;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  onVideoToggled: (isEnabled: boolean) => void;
  onAudioToggled: (isEnabled: boolean) => void;
}

export function VideoToolbar(props: VideoToolbarProps): JSX.Element {
  const {
    domain,
    isHost,
    roomID,
    isVideoEnabled,
    isAudioEnabled,
    onVideoToggled,
    onAudioToggled,
  } = props;

  const onCameraButtonClick = () => {
    onVideoToggled(!isVideoEnabled);
  };

  const onMicButtonClick = () => {
    onAudioToggled(!isAudioEnabled);
  };

  const onLeaveRoomClick = () => {
    // Changing window location will trigger websocket to close so we don't need
    // to worry about notifying server we left.
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
          icon={isVideoEnabled ? "fas fa-video" : "fas fa-video-slash"}
          title={isVideoEnabled ? "Stop video" : "Start video"}
          onClick={onCameraButtonClick}
        />
        <VideoToolbarButton
          icon={
            isAudioEnabled ? "fas fa-microphone" : "fas fa-microphone-slash"
          }
          title={isAudioEnabled ? "Mute mic" : "Unmute mic"}
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
  width: 100%;
`;
