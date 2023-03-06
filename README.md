# Video Up

Video Up let's anyone host live video calls amongst themselves and up to 3 friends. Video calls are joined via magic links, and video data is transmitted via P2P and supports most modern browsers.

## Why I Built It

I thought this would be a fun little experiment to dive further into WebRTC with.

## Future Improvements

Some things that could be improved on later on include

- Ability to change video / audio sources while on a call.
- Ability to leave room without having to close the tab.

In terms of approach there's some refactoring that should be done to change how call participants are tracked. It seems odd to track them under `hostID`, `guestID`, and a more scalable approach such as a `call_participants` table should be explored.

## Dev

The project is divided into three parts:

- `web-app`: React based front end
- `server`: Signaling server that let's participants communicate with each other while initializing RTC connections.
- `shared`: Code shared between the server and front end.

The workspace can be initialized using `yarn` and after that both the front end / server can be started by running `yarn start`.

```
# In root directory:
yarn

cd web-app
yarn start

cd server
yarn start
```

The client will be live on `http://localhost:1234` and the server will be at `http:localhost:8080`.

## Resources

- [MDN signaling and video calling tutorial](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Signaling_and_video_calling)
- [WebRTC for the curious](https://webrtcforthecurious.com/)
- [Manage Dynamic Multi-Peer Connections in WebRTC](https://medium.com/swlh/manage-dynamic-multi-peer-connections-in-webrtc-3ff4e10f75b7)
