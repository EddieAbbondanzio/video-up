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
  video?: MediaStreamTrack;
  audio?: MediaStreamTrack;
  stream: MediaStream;
}

export class Peer {
  connection: RTCPeerConnection;
  makingOffer: boolean = false;
  ignoreOffer: boolean = false;

  // Ice Candidates can't be added to an RTC connection until after the SDP description
  // has been received so we temporary hold any candidates we received prior to
  // the offer.
  pendingIceCandidates: RTCIceCandidateInit[] = [];

  localMedia?: MediaState;
  remoteMedia?: MediaState;

  constructor(
    public ws: WebSocket,
    public remoteParticipantID: string,
    public peerType: PeerType,
  ) {
    this.onNegotiationNeeded = this.onNegotiationNeeded.bind(this);
    this.onIceCandidateCreated = this.onIceCandidateCreated.bind(this);
    this.onRemoteTrack = this.onRemoteTrack.bind(this);
    this.onSignal = this.onSignal.bind(this);

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

    if (video) {
      this.connection.addTrack(video, stream);
    }
    if (audio) {
      this.connection.addTrack(audio, stream);
    }

    this.localMedia = media;
  }

  private onRemoteTrack({ track, streams }: RTCTrackEvent): void {
    const [stream] = streams;
    this.remoteMedia = { stream };

    console.log("on remote track: ", { track, stream });

    switch (track.kind) {
      case "video":
      case "audio":
        this.remoteMedia[track.kind] = track;
        break;

      default:
        console.warn(
          `onRemoteTrack received unknown track kind: ${track.kind}. Ignoring.`,
        );
    }
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

    // TODO: Is there a race here?
    if (this.pendingIceCandidates) {
      for (const iceCandidate of this.pendingIceCandidates) {
        await this.connection.addIceCandidate(iceCandidate);
        this.pendingIceCandidates = [];
      }
    }

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
      if (this.connection.remoteDescription) {
        await this.connection.addIceCandidate(candidate);
      } else {
        this.pendingIceCandidates.push(candidate);
      }
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
    video: true,
    // TODO: Re-add audio
    audio: false,
  });

  const [video] = stream.getVideoTracks();
  const [audio] = stream.getAudioTracks();

  return { stream, video, audio };
}
