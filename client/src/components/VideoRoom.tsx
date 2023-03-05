export interface VideoRoomProps {
  ws: WebSocket;
  isHost: boolean;
  roomID: string | null;
}

export function VideoRoom(props: VideoRoomProps): JSX.Element {
  const { ws } = props;

  return <div>Hi, this is the video room.</div>;
}
