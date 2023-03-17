# Video Up

Video Up let's anyone host live video calls amongst themselves and up to 3 friends. Video calls are joined via magic links, and video data is transmitted via P2P and supports most modern browsers.

Tech wise it's built using vanilla WebRTC, React, TypeScript, WebSockets and SQLite.

<p align="center">
<img src="https://raw.githubusercontent.com/EddieAbbondanzio/video-up/main/docs/demo.png">
</p>

<p align="center">
<img src="https://raw.githubusercontent.com/EddieAbbondanzio/video-up/main/docs/flow.gif">
</p>

## Why I Built It

I thought this would be a fun little experiment to dive further into WebRTC with.

## Future Improvements

Some potential ideas for features / improvements

- Better mobile UI
- Dynamically resize videos based on # of participants in the room
- Allow changing active camera / microphone
- Private video calls that require a password to join.
- participant names
- Chat title + description that will be displayed when someone opens a link
- Video preview that lets user setup their camera / mic before joining.
- Extra permissions for hosts that let's them kick or mute users.
- Screen sharing

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
- [MDN The perfect negotiation](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Perfect_negotiation)
- [WebRTC for the curious](https://webrtcforthecurious.com/)
- [Manage Dynamic Multi-Peer Connections in WebRTC](https://medium.com/swlh/manage-dynamic-multi-peer-connections-in-webrtc-3ff4e10f75b7)
