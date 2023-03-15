import React from "react";

export interface JoinModal {
  onJoin: () => void;
}

// N.B. Chrome has a strict auto play policy that won't let us start the video
// / audio of other participants unless the user has interacted with the webpage
// so we get them to click before showing anything.

export function JoinModal(props: JoinModal): JSX.Element {
  const { onJoin } = props;

  return (
    <div className="modal is-active">
      <div className="modal-background"></div>
      <div className="modal-content">
        <div className="card">
          <div className="card-content">
            <p className="mb-2">
              You{"'"}ve been invited to join a video call! Click below to join:
            </p>
            <button className="button is-success" onClick={onJoin}>
              Join
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
