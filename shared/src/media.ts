// https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Perfect_negotiation
export enum PeerType {
  // Polite peer can send out offers but if it receives an offer it'll abort the
  // offer it created and accept the remote one.
  Polite = 0,
  // Impolite peer can receive offers, but if it already has sent one it'll
  // ignore any incoming offers.
  Impolite = 1,
}
