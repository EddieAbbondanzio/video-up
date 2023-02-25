import { useRef, useMemo } from "react";

export function Video(props) {
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

  return <video ref={elRef} autoPlay={true} playsInline={true} />;
}
