import { NavBar } from "./NavBar";
import { Welcome } from "./Welcome";

// const CALL_ID_LENGTH = 8;
// const CALL_ID_SEARCH_PARAM = "callID";

export interface AppProps {
  ws: WebSocket;
}

export function App(props: AppProps) {
  // const { ws } = props;
  // let url = new URL(window.location.href);

  // let [callID, setCallID] = useState(
  //   url.searchParams.get(CALL_ID_SEARCH_PARAM),
  // );
  // let [isHost] = useState(callID == null);
  // let [inviteURL, setInviteURL] = useState(null);
  // console.log("Is host: ", isHost);

  // if (isHost && callID == null) {
  //   const cID = nanoid(CALL_ID_LENGTH);

  //   setCallID(cID);
  //   setInviteURL(`${url.href}?${CALL_ID_SEARCH_PARAM}=${cID}`);
  // }

  // N.B. Because of browser auto play policies we have to get the guest to
  // interact with the page before we can play video so we add a join button to
  // get them to click.
  // let [userClickedJoin, setUserClickedJoin] = useState(isHost);

  return (
    <>
      <NavBar />
      <Welcome />
    </>
  );
}

// {/* <div className="fc fg1">{inviteURL}</div> */}
// {/* {userClickedJoin && <VideoChat ws={ws} callID={callID} isHost={isHost} />} */}
// {/* {!userClickedJoin && (
//   <div>
//     Click to start the video chat:
//     <button onClick={() => setUserClickedJoin(true)}>Join</button>
//   </div>
// )} */}
