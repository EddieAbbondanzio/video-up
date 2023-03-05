import React, { useState } from "react";
import styled from "styled-components";
import { VideoToolbarButton } from "./VideoToolbarButton";

export interface ShareButtonProps {
  domain: string;
  roomID?: string;
  isHost: boolean;
}

export function ShareButton(props: ShareButtonProps) {
  const { domain, roomID, isHost } = props;
  let link = "";
  let disabled = roomID == null;
  if (!disabled && roomID) {
    link = `${domain}${roomID}`;
  }

  // Only show share link by default to the host.
  const [isActive, setIsActive] = useState(!disabled && isHost);
  const onShareButtonClick = () => {
    if (disabled) {
      return;
    }

    setIsActive(!isActive);
  };

  const dropdownClasses = ["dropdown", "is-up"];
  if (isActive && !disabled) {
    dropdownClasses.push("is-active");
  }

  const onClickToCopy = () => {
    navigator.clipboard.writeText(link);
  };

  return (
    <div className={dropdownClasses.join(" ")}>
      <div className="dropdown-trigger">
        <VideoToolbarButton
          icon="fas fa-share-alt"
          title="Get link to share"
          onClick={onShareButtonClick}
          state={isActive && !disabled ? "is-active" : undefined}
          disabled={true}
        />
      </div>
      <div className="dropdown-menu mb-4" role="menu">
        <WideDropdownContent className="dropdown-content">
          <div className="dropdown-item">
            <p className="mb-2">
              Send this link to your friends so they can join:
            </p>

            <div className="is-flex is-flex-row">
              <input className="input is-small" value={link} readOnly={true} />
              <button
                className="button is-small ml-2"
                title="Click to copy link"
                onClick={onClickToCopy}
              >
                <i className="fas fa-copy"></i>
              </button>
            </div>
          </div>
        </WideDropdownContent>
      </div>
    </div>
  );
}

// TODO: Add better mobile support
const WideDropdownContent = styled.div`
  min-width: 360px;
`;
