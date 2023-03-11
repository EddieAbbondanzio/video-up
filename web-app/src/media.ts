import { PeerType } from "../../shared/src/media";
import { MessageType, WebSocketResponse } from "../../shared/src/ws";
import { sendRequest } from "./ws";

// https://gist.github.com/zziuni/3741933
export const STUN_SERVERS = [
  "stun.l.google.com:19302",
  "stun1.l.google.com:19302",
  "stun2.l.google.com:19302",
  "stun3.l.google.com:19302",
  "stun4.l.google.com:19302",
];

export interface MediaState {
  video: MediaStreamTrack;
  audio: MediaStreamTrack;
  stream: MediaStream;
}

export class Peer {
  connection: RTCPeerConnection;
  makingOffer: boolean = false;
  ignoreOffer: boolean = false;

  localMedia?: MediaState;
  remoteMedia?: MediaState;

  constructor(
    public ws: WebSocket,
    public remoteParticipantID: string,
    public peerType: PeerType,
  ) {
    this.connection = createNewRtcPeerConnection();

    this.connection.addEventListener("track", this.onRemoteTrack);
    this.connection.addEventListener(
      "negotiationneeded",
      this.onNegotiationNeeded,
    );
    this.connection.addEventListener(
      "icecandidate",
      this.onIceCandidateCreated,
    );

    ws.addEventListener("message", this.onSignal);
  }

  destroy(): void {
    this.connection.removeEventListener("track", this.onRemoteTrack);
    this.connection.removeEventListener(
      "negotiationneeded",
      this.onNegotiationNeeded,
    );
    this.connection.removeEventListener(
      "icecandidate",
      this.onIceCandidateCreated,
    );

    this.ws.removeEventListener("message", this.onSignal);
  }

  addLocalMedia(media: MediaState): void {
    const { video, audio, stream } = media;
    console.log("Added local media!", media);

    this.connection.addTrack(video, stream);
    this.connection.addTrack(audio, stream);

    this.localMedia = media;
  }

  private onRemoteTrack({ track, streams }: RTCTrackEvent): void {
    console.log("TODO: Hook up remote media!");
  }

  private async onNegotiationNeeded(): Promise<void> {
    console.log("onNegotiationNeeded");
    try {
      this.makingOffer = true;
      await this.connection.setLocalDescription();

      console.log("Made offer");
      await sendRequest(this.ws, {
        type: MessageType.SDPDescription,
        destinationID: this.remoteParticipantID,
        sdp: this.connection.localDescription!,
      });
    } catch (err) {
      console.error(
        `onNegotiationNeeded failed for remoteParticipantID: ${this.remoteParticipantID}`,
        err,
      );
    } finally {
      this.makingOffer = false;
    }
  }

  private async onIceCandidateCreated(
    ev: RTCPeerConnectionIceEvent,
  ): Promise<void> {
    console.log("onIceCandidateCreated");
    await sendRequest(this.ws, {
      type: MessageType.IceCandidate,
      destinationID: this.remoteParticipantID,
      candidate: ev.candidate!,
    });
  }

  private async onSignal(ev: MessageEvent): Promise<void> {
    const response: WebSocketResponse = JSON.parse(ev.data);

    switch (response.type) {
      case MessageType.SDPDescription:
        if (response.senderID !== this.remoteParticipantID) {
          return;
        }

        await this.onDescriptionReceived(response.sdp);
        break;

      case MessageType.IceCandidate:
        if (response.senderID !== this.remoteParticipantID) {
          return;
        }

        await this.onIceCandidateReceived(response.candidate);
        break;
    }
  }

  // Triggered by web socket receiving an offer
  private async onDescriptionReceived(
    sdp: RTCSessionDescription,
  ): Promise<void> {
    const collisionDetected =
      sdp.type === "offer" &&
      (this.makingOffer || this.connection.signalingState !== "stable");

    this.ignoreOffer = this.peerType === PeerType.Impolite && collisionDetected;
    console.log("onDescriptionReceived", {
      collisionDetected,
      ignoreOffer: this.ignoreOffer,
    });
    if (this.ignoreOffer) {
      return;
    }

    await this.connection.setRemoteDescription(sdp);

    // If the incoming description was an offer, it means we need to return our
    // answer.
    if (sdp.type === "offer") {
      await this.connection.setLocalDescription();

      console.log("Send response!");
      await sendRequest(this.ws, {
        type: MessageType.SDPDescription,
        destinationID: this.remoteParticipantID,
        sdp: this.connection.localDescription!,
      });
    }
  }

  // Triggered by web socket receiving ice candidate
  private async onIceCandidateReceived(
    candidate: RTCIceCandidateInit,
  ): Promise<void> {
    try {
      console.log("onIceCandidateReceived");
      await this.connection.addIceCandidate(candidate);
    } catch (err) {
      if (!this.ignoreOffer) {
        console.error(
          `Failed to add ice candidate for remoteParticipantID: ${this.remoteParticipantID}`,
          err,
        );
      }
    }
  }
}

export function createNewRtcPeerConnection(): RTCPeerConnection {
  return new RTCPeerConnection({
    //@ts-ignore
    iceservers: STUN_SERVERS.map(s => ({ urls: s })),
  });
}

export async function startLocalVideoAndAudio(): Promise<MediaState> {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "user" },
    audio: true,
  });

  const [video] = stream.getVideoTracks();
  const [audio] = stream.getAudioTracks();

  return { stream, video, audio };
}
