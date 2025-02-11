const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

const userSocketMap = {}; // { userId: { socketId, username, roomId } }

let activeUser = [];

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST"],
  credentials: true,
}));

const getAllConnectedClients = () => {
  return Object.keys(userSocketMap).map((userId) => ({
    userId,
    username: userSocketMap[userId].username,
    roomId: userSocketMap[userId].roomId,
    socketId: userSocketMap[userId].socketId,
  }));
};

io.on("connection", (socket) => {   
  console.log("Socket connected:", socket.id);

  socket.on("join", ({ roomId, username, userid }) => {
    console.log("User joined:", { roomId, username, userid });

    if(!activeUser.some((user)=>user.userId === userid)){
        activeUser.push({userId: userid, username, socketId: socket.id});
    }

    io.emit('online-users', activeUser);

    userSocketMap[userid] = { socketId: socket.id, username, roomId };
    socket.join(roomId);

    io.emit("all-clients", getAllConnectedClients());

    io.to(roomId).emit("joined", {
      clients: getAllConnectedClients().filter(client => client.roomId === roomId),
      username,
      userid,
    });
  });

  socket.on("send-message", (message) => {
    console.log("Message:", message);
    io.to(message.roomId).emit("received_message", message);
  });

 socket.on("privateMessage", ({ recipientId, message, senderId }) => {
  const recipientSocketId = userSocketMap[recipientId]?.socketId;
  
  if (recipientSocketId) {
    io.to(recipientSocketId).emit("newPrivateMessage", { senderId, message });
  } else {
    console.warn(`User ${recipientId} is not connected.`);
  }
});


socket.on("typing", ({ roomId, username }) => {
    socket.to(roomId).emit("userTyping", { username });
  });
  
  socket.on("stopTyping", ({ roomId, username }) => {
    socket.to(roomId).emit("userStoppedTyping", { username });
  });

  socket.on("leave", ({ roomId, username, userid }) => {
    if (!userSocketMap[userid]) return;

    socket.leave(roomId);
    socket.to(roomId).emit("user-disconnected", { username });
    delete userSocketMap[userid];

    io.emit("all-clients", getAllConnectedClients());

    console.log(`User ${username} left Room ${roomId}`);
  });

  socket.on("disconnect", () => {
    const userId = Object.keys(userSocketMap).find((id) => userSocketMap[id].socketId === socket.id);
    
    if (userId) {
      const { username, roomId } = userSocketMap[userId];

      socket.to(roomId).emit("user-disconnected", { username });
      delete userSocketMap[userId];

      io.emit("all-clients", getAllConnectedClients());

      console.log(`User ${username} disconnected from Room ${roomId}`);
    }
  });
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
