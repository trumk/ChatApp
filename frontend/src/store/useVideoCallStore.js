import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useVideoCallStore = create((set, get) => ({
  isCalling: false,
  incomingCall: null,
  callAccepted: false,
  myStream: null,
  peerConnection: null,

  startCall: async (receiverId) => {
    set({ isCalling: true });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      set({ myStream: stream });

      const peer = new RTCPeerConnection();
      set({ peerConnection: peer });

      stream.getTracks().forEach((track) => peer.addTrack(track, stream));

      peer.onicecandidate = async (event) => {
        if (event.candidate) {
          await axiosInstance.post(`/videocall/initiate/${receiverId}`, {
            signalData: event.candidate,
          });
        }
      };

      await axiosInstance.post(`/videocall/initiate/${receiverId}`);

      window.open("/call", "_blank", "width=800,height=600");
    } catch (error) {
      console.error("Lỗi khi bắt đầu cuộc gọi:", error);
    }
  },

  receiveCall: (callerId, signal) => {
    set({ incomingCall: { callerId, signal } });
  },

  acceptCall: async () => {
    const { incomingCall } = get();
    if (!incomingCall) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      set({ myStream: stream });

      const peer = new RTCPeerConnection();
      set({ peerConnection: peer });

      stream.getTracks().forEach((track) => peer.addTrack(track, stream));

      peer.onicecandidate = async (event) => {
        if (event.candidate) {
          await axiosInstance.post(`/videocall/accept/${incomingCall.callerId}`, {
            signal: event.candidate,
          });
        }
      };

      set({ callAccepted: true });
    } catch (error) {
      console.error("Lỗi khi chấp nhận cuộc gọi:", error);
    }
  },

  endCall: async () => {
    const { peerConnection, myStream, incomingCall } = get();
    const authUser = useAuthStore.getState().user;

    try {
      if (peerConnection) {
        peerConnection.close();
        set({ peerConnection: null });
      }

      if (myStream) {
        myStream.getTracks().forEach((track) => track.stop());
        set({ myStream: null });
      }

      set({ isCalling: false, callAccepted: false, incomingCall: null });

      // Gửi yêu cầu kết thúc cuộc gọi đến backend
      const callId = incomingCall?.callerId || authUser?._id;
      if (callId) {
        await axiosInstance.post(`/videocall/end/${callId}`);
      }
    } catch (error) {
      console.error("Lỗi khi kết thúc cuộc gọi:", error);
    }
  },
}));