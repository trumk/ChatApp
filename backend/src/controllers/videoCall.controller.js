import { getReceiverSocketId, io } from "../lib/socket.js";

export const initiateCall = (req, res) => {
  try {
    const { receiverId, signalData } = req.body;
    const senderId = req.user._id;

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("incomingCall", {
        from: senderId,
        signal: signalData,
      });
    }

    res.status(200).json({ success: true, message: "Call initiated" });
  } catch (error) {
    console.error("Error in initiateCall:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const acceptCall = (req, res) => {
  try {
    const { callerId, signal } = req.body;
    const receiverId = req.user._id;

    const callerSocketId = getReceiverSocketId(callerId);
    if (callerSocketId) {
      io.to(callerSocketId).emit("callAccepted", {
        signal,
        from: receiverId,
      });
    }

    res.status(200).json({ success: true, message: "Call accepted" });
  } catch (error) {
    console.error("Error in acceptCall:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const endCall = (req, res) => {
  try {
    const { receiverId } = req.body;
    const senderId = req.user._id;

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("callEnded");
    }

    res.status(200).json({ success: true, message: "Call ended" });
  } catch (error) {
    console.error("Error in endCall:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};