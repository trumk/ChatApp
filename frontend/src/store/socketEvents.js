import { useAuthStore } from "./useAuthStore";
import { useVideoCallStore } from "./useVideoCallStore";

export const setupSocketEvents = () => {
  const socket = useAuthStore.getState().socket;

  if (!socket) return;

  socket.on("incomingCall", ({ from, signal }) => {
    console.log("Nhận cuộc gọi từ:", from, "Signal:", signal);
    useVideoCallStore.setState({ incomingCall: { callerId: from, signal } });
  });

  socket.on("callAccepted", ({ signal }) => {
    console.log("Cuộc gọi được chấp nhận:", signal);
    const peer = useVideoCallStore.getState().peerConnection;
    if (peer) {
      peer.setRemoteDescription(new RTCSessionDescription(signal));
      useVideoCallStore.setState({ callAccepted: true });
    }
  });

  socket.on("callEnded", () => {
    console.log("Cuộc gọi đã kết thúc");
    useVideoCallStore.getState().endCall();
  });

  socket.on("ice-candidate", ({ candidate }) => {
    const peer = useVideoCallStore.getState().peerConnection;
    if (peer) {
      peer.addIceCandidate(new RTCIceCandidate(candidate));
    }
  });  
};