# Video Up

Video Up is a website that lets users share a link with someone else that will let them join a one on one video chat with the other user.

It's built using WebRTC and sends video / audio data via P2P (peer to peer). There is a signaling server that helps the caller and callee initialize connections with each other, and the front end communicates with it via web sockets.

## Why I Built It

I thought this would be a fun little experiment to dive further into WebRTC with.

## Future Improvements

Some things that could be improved on later on include

- Ability to change video / audio sources while on a call.
- Ability to leave room without having to close the tab.

In terms of approach there's some refactoring that should be done to change how call participants are tracked. It seems odd to track them under `hostID`, `guestID`, and a more scalable approach such as a `call_participants` table should be explored.

## Dev

The project is divided into two parts:

- client (front end)
- server (signaling server)

Both can be initialized using `yarn` and then `yarn start` to begin running them.

The client will be live on `http://localhost:1234` and the server will be at `http:localhost:8080`.

## Resources

- [MDN signaling and video calling tutorial](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Signaling_and_video_calling)
- [WebRTC for the curious](https://webrtcforthecurious.com/)
