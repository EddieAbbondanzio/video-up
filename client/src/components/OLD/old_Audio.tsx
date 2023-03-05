// @ts-nocheck

import React from "react";
import { useRef, useMemo } from "react";

export function Audio(props) {
  const { track } = props;

  const stream = useMemo(() => {
    if (track == null) {
      return null;
    }

    const ms = new MediaStream([track]);
    return ms;
  }, [track]);

  const elRef = useRef(null);
  if (elRef.current != null) {
    elRef.current.srcObject = stream;
  }

  return <audio ref={elRef} autoPlay={true} />;
}
