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
          await axiosInstance.post(`/call/initiate/${receiverId}`, {
            signalData: event.candidate,  // Gửi luôn signalData vào initiate
          });
        }
      };
  
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
  
      await axiosInstance.post(`/call/initiate/${receiverId}`, {
        signalData: offer,  // Gửi offer ngay khi bắt đầu cuộc gọi
      });
  
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
          await axiosInstance.post(`/call/accept/${incomingCall.callerId}`, {
            signal: event.candidate,  // Gửi signal khi nhận được ICE candidate
          });
        }
      };
  
      await peer.setRemoteDescription(new RTCSessionDescription(incomingCall.signal));
  
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
  
      await axiosInstance.post(`/call/accept/${incomingCall.callerId}`, {
        signal: answer,  // Gửi answer để hoàn thành kết nối
      });
  
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
  
      const callId = incomingCall?.callerId || authUser?._id;
      if (callId) {
        await axiosInstance.post(`/call/end/${callId}`);
      }
    } catch (error) {
      console.error("Lỗi khi kết thúc cuộc gọi:", error);
    }
  },
  
}));