import React from "react";
import styled from "styled-components";

export interface VideoToolbarButtonProps {
  icon: string;
  title: string;
  color?: "is-gray" | "is-danger";
  state?: "is-hovered" | "is-active";
  disabled?: boolean;
  onClick: () => void;
}

export function VideoToolbarButton(
  props: VideoToolbarButtonProps,
): JSX.Element {
  const { icon, title, onClick, color = "is-gray", state, disabled } = props;

  const classes = ["button", "is-medium", "is-rounded", "mx-2"];
  if (color === "is-gray") {
    classes.push("is-dark", "is-gray");
  } else {
    classes.push("is-danger");
  }

  if (state) {
    classes.push(state);
  }

  return (
    <BigRoundButton
      className={classes.join(" ")}
      title={title}
      onClick={onClick}
      disabled={disabled}
    >
      <i className={icon}></i>
    </BigRoundButton>
  );
}
const BUTTON_COLOR = "#4f4f4f";
const HOVER_BUTTON_COLOR = "#454545";
const ACTIVE_BUTTON_COLOR = "#3b3b3b";

// Need !important to beat bulma.
const BigRoundButton = styled.button`
  border-radius: 50%;
  width: 60px;
  height: 60px;

  &.is-gray {
    background-color: ${BUTTON_COLOR} !important;

    &:hover,
    &.is-hovered {
      background-color: ${HOVER_BUTTON_COLOR} !important;
    }

    &:active,
    &.is-active {
      background-color: ${ACTIVE_BUTTON_COLOR} !important;
    }
  }
`;
