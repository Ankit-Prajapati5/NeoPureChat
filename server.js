require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const mongoose = require("mongoose");
const connectDB = require("./config/db");

// Models
const Message = require("./models/Message");

// Routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const messageRoutes = require("./routes/messages");

// Connect Database
connectDB();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
  path: "/socket.io",
});

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);

app.get("/", (req, res) => {
  res.send("🚀 NeoPureChat Backend API is Running!");
});

// Socket.IO Auth
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("Authentication error: No token provided"));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded.user;
    next();
  } catch (err) {
    next(new Error("Authentication error: Invalid token"));
  }
});

// Socket.IO Connection
io.on("connection", (socket) => {
  console.log(`🔌 User connected: ${socket.user.username} (${socket.id})`);

  // Join user-specific room
  socket.join(socket.user.id);

  // Handle sendMessage
  socket.on("sendMessage", async (data, callback) => {
    const { recipientId, content } = data;
    const senderId = socket.user.id;

    if (!senderId || !recipientId || !content)
      return callback({ status: "error", error: "Invalid message data" });

    try {
      const newMessage = new Message({
        sender: senderId,
        recipient: recipientId,
        content,
      });
      await newMessage.save();

      await newMessage.populate("sender", "username");
      await newMessage.populate("recipient", "username");

      io.to(recipientId).emit("message", newMessage);
      io.to(senderId).emit("message", newMessage);

      callback({ status: "ok", message: newMessage });
    } catch (err) {
      callback({ status: "error", error: "Failed to send message" });
    }
  });
  // ---------------- Middleware for req.io ----------------
app.use((req, res, next) => {
  req.io = io; // make Socket.IO instance available in routes
  next();
});


  // Handle deleteMessage
  socket.on("deleteMessage", async (messageId) => {
    if (!messageId) return;

    try {
      const message = await Message.findById(messageId);
      if (!message) return;

      // Sirf sender hi delete kar sakta hai
      if (message.sender.toString() !== socket.user.id) return;

      await Message.findByIdAndDelete(messageId);

      // BOTH sender & recipient ko notify karo
      io.to(message.sender.toString()).emit("deleteMessage", messageId);
      io.to(message.recipient.toString()).emit("deleteMessage", messageId); // ✅ Recipient ke liye add kiya
    } catch (err) {
      console.error("⚠️ Error deleting message:", err.message);
    }
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log(`❎ User disconnected: ${socket.user.username} (${socket.id})`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
