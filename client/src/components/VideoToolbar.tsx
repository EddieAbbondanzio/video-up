import React from "react";
import styled from "styled-components";

export function VideoToolbar(): JSX.Element {
  return (
    <FixedOnBottom className="has-background-dark has-text-white">
      <button className="button ">Start Camera</button>
    </FixedOnBottom>
  );
}

const FixedOnBottom = styled.div`
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
`;
