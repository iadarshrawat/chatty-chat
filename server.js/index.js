const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

const userSocketMap = {};

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  })
);

const getAllConnectedClients = (roomId) => {
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
    (socketId) => ({
      socketId,
      username: userSocketMap[socketId]?.username || "Unknown",
    })
  );
};

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("join", ({ roomId, username }) => {
    userSocketMap[socket.id] = { username, roomId };
    socket.join(roomId);

    const clients = getAllConnectedClients(roomId);
    clients.forEach(({ socketId }) => {
      io.to(socketId).emit("joined", {
        clients,
        username,
        socketId: socket.id,
      });
    });
  });

  socket.on("send-message", (message) => {
    console.log("Message:", message);
    socket.to(message.roomId).emit("received_message", message);
  });

  socket.on("leave", ({ roomId, username }) => {
    if (!userSocketMap[socket.id]) return;
    
    socket.leave(roomId);
    socket.to(roomId).emit("user-disconnected", { username });
    delete userSocketMap[socket.id];

    console.log(`User ${username} left Room ${roomId}`);
  });

  socket.on("disconnect", () => {
    const userData = userSocketMap[socket.id];
    if (userData) {
      const { username, roomId } = userData;
      socket.to(roomId).emit("user-disconnected", { username });
      delete userSocketMap[socket.id];

      console.log(`User ${username} disconnected from Room ${roomId}`);
    }
  });
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
