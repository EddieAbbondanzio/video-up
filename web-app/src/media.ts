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

// https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Perfect_negotiation
export enum PeerType {
  // Polite peer can send out offers but if it receives an offer it'll abort the
  // offer it created and accept the remote one.
  Polite = 0,
  // Impolite peer can receive offers, but if it already has sent one it'll
  // ignore any incoming offers.
  Impolite = 1,
}

export class Peer {
  connection: RTCPeerConnection;
  makingOffer: boolean = false;
  ignoreOffer: boolean = false;

  // TODO: Group by track kind?
  localTracks: { track: MediaStreamTrack; stream: MediaStream }[] = [];
  remoteTracks: { track: MediaStreamTrack; streams: MediaStream[] }[] = [];

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

  addLocalTracks(
    video: MediaStreamTrack,
    audio: MediaStreamTrack,
    stream: MediaStream,
  ): void {
    this.connection.addTrack(video, stream);
    this.connection.addTrack(audio, stream);

    this.localTracks.push({ track: video, stream });
    this.localTracks.push({ track: audio, stream });
  }

  private onRemoteTrack({ track, streams }: RTCTrackEvent): void {
    this.remoteTracks.push({ track, streams: streams as MediaStream[] });
  }

  private async onNegotiationNeeded(): Promise<void> {
    try {
      this.makingOffer = true;
      await this.connection.setLocalDescription();

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
    if (this.ignoreOffer) {
      return;
    }

    await this.connection.setRemoteDescription(sdp);

    // If the incoming description was an offer, it means we need to return our
    // answer.
    if (sdp.type === "offer") {
      await this.connection.setLocalDescription();

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
    iceServers: STUN_SERVERS.map(s => ({ urls: s })),
  });
}

export async function startLocalVideoAndAudio() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "user" },
    audio: true,
  });

  const [video] = stream.getVideoTracks();
  const [audio] = stream.getAudioTracks();

  return { stream, video, audio };
}
