import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import { io } from "socket.io-client";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5001" : "/";
const socket = io(BASE_URL);

export const useVideoCallStore = create((set, get) => ({
  isCalling: false,
  isReceivingCall: false,
  incomingCall: null,
  callAccepted: false,
  myStream: null,
  peerConnection: null,

  startCall: async (receiverId) => {
    console.log("📞 Starting call with:", receiverId);
    set({ isCalling: true });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      console.log("✅ Obtained caller's stream", stream);
      set({ myStream: stream });

      const peer = new RTCPeerConnection();
      set({ peerConnection: peer });

      stream.getTracks().forEach((track) => peer.addTrack(track, stream));
      console.log("🎥 Added tracks to peerConnection");

      peer.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice-candidate", {
            candidate: event.candidate,
            to: receiverId,
          });
        }
      };

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      console.log("📨 Sending offer SDP:", offer);

      await axiosInstance.post("/call/initiate", {
        receiverId,
        signalData: offer,
      });

      window.open("/call", "_blank", "width=800,height=600");
    } catch (error) {
      console.error("❌ Error starting call:", error);
      set({ isCalling: false });
    }
  },

  receiveCall: (callerId, signal) => {
    console.log("📞 Incoming call from:", callerId);
    console.log("📡 Signal data:", signal);
    set({ incomingCall: { callerId, signal }, isReceivingCall: true });
  },

  acceptCall: async () => {
    const { incomingCall } = get();
    if (!incomingCall) {
      console.warn("⚠️ No incoming call!");
      return;
    }

    console.log("✅ Accepting call from:", incomingCall.callerId);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      console.log("✅ Obtained receiver's stream", stream);
      set({ myStream: stream });

      const peer = new RTCPeerConnection();
      set({ peerConnection: peer });

      stream.getTracks().forEach((track) => peer.addTrack(track, stream));
      console.log("🎥 Added tracks to peerConnection");

      peer.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice-candidate", {
            candidate: event.candidate,
            to: incomingCall.callerId,
          });
        }
      };

      console.log("📩 Setting Remote Description", incomingCall.signal);
      await peer.setRemoteDescription(
        new RTCSessionDescription(incomingCall.signal)
      );

      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      console.log("📨 Sending answer SDP:", answer);

      await axiosInstance.post("/call/accept", {
        callerId: incomingCall.callerId,
        signal: answer,
      });

      set({ callAccepted: true, isReceivingCall: false, incomingCall: null });
    } catch (error) {
      console.error("❌ Error accepting call:", error);
    }
  },

  rejectCall: () => {
    console.log("❌ Rejecting call");
    set({ isReceivingCall: false, incomingCall: null });
  },

  endCall: async () => {
    const { peerConnection, myStream, incomingCall } = get();
    const authUser = useAuthStore.getState().user;

    console.log("📴 Ending call");

    try {
      if (peerConnection) {
        console.log("🛑 Closing peerConnection");
        peerConnection.close();
        set({ peerConnection: null });
      }

      if (myStream) {
        console.log("🛑 Stopping stream");
        myStream.getTracks().forEach((track) => track.stop());
        set({ myStream: null });
      }

      set({
        isCalling: false,
        callAccepted: false,
        isReceivingCall: false,
        incomingCall: null,
      });

      const callId = incomingCall?.callerId || authUser?._id;
      if (callId) {
        console.log("📡 Sending end call request to server:", callId);
        await axiosInstance.post("/call/end", { callId });
      }

      socket.emit("end-call", { callId });

      if (peerConnection) {
        peerConnection.onicecandidate = null;
        peerConnection.ontrack = null;
        peerConnection.close();
        set({ peerConnection: null });
      }

      socket.off("ice-candidate");
      socket.off("callAccepted");
      socket.off("callEnded");
    } catch (error) {
      console.error("❌ Error ending call:", error);
    }
  },
}));

// Lắng nghe sự kiện từ server
socket.on("ice-candidate", async ({ candidate }) => {
  const { peerConnection } = useVideoCallStore.getState();
  if (peerConnection) {
    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  }
});

socket.on("callAccepted", async ({ signal }) => {
  const { peerConnection } = useVideoCallStore.getState();
  if (peerConnection) {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(signal));
    console.log("✅ Call accepted, remote description set.");
  }
});

socket.on("callEnded", () => {
  console.log("📴 Call ended by peer");
  useVideoCallStore.getState().endCall();
});