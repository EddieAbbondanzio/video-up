import React from "react";
import styled from "styled-components";

export interface VideoToolbarButtonProps {
  icon: string;
  title: string;
  onClick: () => void;
}

export function VideoToolbarButton(
  props: VideoToolbarButtonProps,
): JSX.Element {
  const { icon, title, onClick } = props;

  return (
    <GrayButton
      className="button is-dark is-medium is-rounded mx-2"
      title={title}
      onClick={onClick}
    >
      <i className={icon}></i>
    </GrayButton>
  );
}
const BUTTON_COLOR = "#4f4f4f";
const ACTIVE_BUTTON_COLOR = "#454545";

// Need !important to beat bulma;
const GrayButton = styled.button`
  border-radius: 50%;
  width: 60px;
  height: 60px;

  background-color: ${BUTTON_COLOR} !important;
  &:hover {
    background-color: ${ACTIVE_BUTTON_COLOR} !important;
  }
`;
