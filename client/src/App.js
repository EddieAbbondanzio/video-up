import { nanoid } from "nanoid";
import { useEffect, useState } from "react";
import { VideoChat } from "./VideoChat.js";
import { MessageType } from "./ws.js";

const CALL_ID_LENGTH = 8;
const CALL_ID_SEARCH_PARAM = "callID";

export function App(props) {
  const { ws } = props;
  let url = new URL(window.location.href);

  let [callID, setCallID] = useState(
    url.searchParams.get(CALL_ID_SEARCH_PARAM),
  );
  let [isHost] = useState(callID == null);
  let [remoteSDP, setRemoteSDP] = useState(null);

  if (isHost && callID == null) {
    setCallID(nanoid(CALL_ID_LENGTH));
  }

  useEffect(() => {
    if (isHost) {
      // Notify signaling server of the call we want to host
      ws.sendMessage({ type: MessageType.RegisterCall, callID });
    } else {
      // Ask signaling server for the host's SDP
      ws.sendMessage({ type: MessageType.JoinCall, callID }).onResponse(
        ({ sdp }) => setRemoteSDP(sdp),
      );
    }
  }, [isHost, callID]);

  let content = null;
  if (remoteSDP == null) {
    if (isHost) {
      const inviteURL = `${url.href}?${CALL_ID_SEARCH_PARAM}=${callID}`;
      content = <div>{inviteURL}</div>;
    }
  } else {
    content = <VideoChat ws={ws} callID={callID} remoteSDP={remoteSDP} />;
  }

  return (
    <div className="fc fg1">
      <h1 className="asc">VideoUp</h1>
      <div className="fc fg1">{content}</div>
    </div>
  );
}
