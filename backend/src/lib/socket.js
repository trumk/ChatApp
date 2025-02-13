import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
  },
});

const userSocketMap = {}; // Lưu danh sách user online

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) {
    userSocketMap[userId] = socket.id;
    console.log("📌 User online:", userSocketMap);
  }

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("offer", ({ targetUserId, offer }) => {
    const senderId = Object.keys(userSocketMap).find(key => userSocketMap[key] === socket.id);
    if (!senderId) return;

    const targetSocketId = userSocketMap[targetUserId];
    if (targetSocketId) {
      console.log(`📩 Sending offer from ${senderId} to ${targetUserId}`);
      io.to(targetSocketId).emit("offer", { senderId, offer });
    }
  });

  socket.on("call-user", ({ targetUserId }) => {
    const callerId = Object.keys(userSocketMap).find(key => userSocketMap[key] === socket.id);
    if (!callerId) return;

    const targetSocketId = userSocketMap[targetUserId];
    if (targetSocketId) {
      console.log(`📞 Incoming call from ${callerId} to ${targetUserId}`);
      io.to(targetSocketId).emit("incoming-call", { callerId });
    }
  });

  socket.on("answer", ({ targetUserId, answer }) => {
    const senderId = Object.keys(userSocketMap).find(key => userSocketMap[key] === socket.id);
    if (!senderId) return;

    const targetSocketId = userSocketMap[targetUserId];
    if (targetSocketId) {
      console.log(`📩 Sending answer from ${senderId} to ${targetUserId}`);
      io.to(targetSocketId).emit("answer", { senderId, answer });
    }
  });

  socket.on("ice-candidate", ({ targetUserId, candidate }) => {
    const senderId = Object.keys(userSocketMap).find(key => userSocketMap[key] === socket.id);
    if (!senderId) return;

    const targetSocketId = userSocketMap[targetUserId];
    if (targetSocketId) {
      console.log(`📡 Sending ICE candidate from ${senderId} to ${targetUserId}`);
      io.to(targetSocketId).emit("ice-candidate", { senderId, candidate });
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);

    const userId = Object.keys(userSocketMap).find(key => userSocketMap[key] === socket.id);
    if (userId) {
      delete userSocketMap[userId];
      console.log("📌 User offline:", userSocketMap);
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    }
  });
});

export { io, app, server };