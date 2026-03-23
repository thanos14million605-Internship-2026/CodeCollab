const http = require("http");
const path = require("path");
const { Server } = require("socket.io");
require("dotenv").config();
const express = require("express");

// Import app and socket handler
const app = require("./app");
const socketHandler = require("./socket/socketHandler");

// Create HTTP server
const server = http.createServer(app);

// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Initialize socket handler
socketHandler(io);

console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "/frontendfix/distfix")));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "frontendfix", "dist", "index.html"));
  });
}

// Start server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`📡 Socket.IO server ready`);
  console.log(`🔗 API URL: http://localhost:${PORT}/api`);
  console.log(`💻 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("Process terminated");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  server.close(() => {
    console.log("Process terminated");
    process.exit(0);
  });
});

module.exports = server;
