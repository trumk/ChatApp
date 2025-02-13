import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useVideoCallStore = create((set, get) => ({
  isCalling: false,
  isReceivingCall: false,
  callData: null,
  selectedUser: null,

  initiateCall: async (userId) => {
    if (get().isCalling) return; 
    set({ isCalling: true });
    try {
      const res = await axiosInstance.post(`/videocall/initiate/${userId}`);
      set({ callData: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Error in starting call");
    } finally {
      set({ isCalling: false });
    }
  },
  

  acceptCall: async (userId) => {
    try {
      const res = await axiosInstance.post(`/videocall/accept/${userId}`);
      set({ callData: res.data, isReceivingCall: false });
    } catch (error) {
      toast.error(error.response?.data?.message || "Error when accepting call");
    }
  },

  endCall: async (userId) => {
    try {
      await axiosInstance.post(`/videocall/end/${userId}`);
      set({ callData: null });
    } catch (error) {
      toast.error(error.response?.data?.message || "Error when ending call");
    }
  },

  subscribeToCallEvents: () => {
    const socket = useAuthStore.getState().socket;

    socket.on("incomingCall", (callInfo) => {
      set({ callData: callInfo, isReceivingCall: true });
    });

    socket.on("callEnded", () => {
      set({ callData: null, isReceivingCall: false });
    });
  },

  unsubscribeFromCallEvents: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("incomingCall");
    socket.off("callEnded");
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));