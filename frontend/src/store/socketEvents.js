import { useAuthStore } from "./useAuthStore";
import { useVideoCallStore } from "./useVideoCallStore";

export const setupSocketEvents = () => {
  const socket = useAuthStore.getState().socket;

  if (!socket) return;

  socket.on("incomingCall", ({ from, signal }) => {
    useVideoCallStore.setState({ incomingCall: { callerId: from, signal } });
  });

  socket.on("callAccepted", ({ signal }) => {
    const peer = useVideoCallStore.getState().peerConnection;
    if (peer) {
      peer.setRemoteDescription(new RTCSessionDescription(signal));
      useVideoCallStore.setState({ callAccepted: true });
    }
  });

  socket.on("callEnded", () => {
    useVideoCallStore.getState().endCall();
  });
};
