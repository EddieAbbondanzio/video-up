import { nanoid } from "nanoid";
import { useState } from "react";
import { VideoChat } from "./VideoChat.js";

const CALL_ID_LENGTH = 8;
const CALL_ID_SEARCH_PARAM = "callID";

export function App(props) {
  const { ws } = props;
  let url = new URL(window.location.href);

  let [callID, setCallID] = useState(
    url.searchParams.get(CALL_ID_SEARCH_PARAM),
  );
  let [isHost] = useState(callID == null);
  let [inviteURL, setInviteURL] = useState(null);
  console.log("Is host: ", isHost);

  if (isHost && callID == null) {
    const cID = nanoid(CALL_ID_LENGTH);

    setCallID(cID);
    setInviteURL(`${url.href}?${CALL_ID_SEARCH_PARAM}=${cID}`);
  }

  let [userClickedJoin, setUserClickedJoin] = useState(isHost);

  return (
    <div className="fc fg1">
      <h1 className="asc">VideoUp</h1>
      <div className="fc fg1">{inviteURL}</div>
      {userClickedJoin && <VideoChat ws={ws} callID={callID} isHost={isHost} />}
      {!userClickedJoin && (
        <div>
          Click to start the video chat:
          <button onClick={() => setUserClickedJoin(true)}>Join</button>
        </div>
      )}
    </div>
  );
}
