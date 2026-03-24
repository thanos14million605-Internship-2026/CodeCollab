const http = require("http");
const path = require("path");
const { Server } = require("socket.io");
require("dotenv").config();
const express = require("express");
const pool = require("./config/db");
// Import app and socket handler
const app = require("./app");

// Create HTTP server
const server = http.createServer(app);

pool
  .query("SELECT NOW()")
  .then((result) => console.log(`DB connection made at ${result.rows[0].now}`))
  .catch((err) => console.log("Error in DB connection", err));

// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.set("io", io);

// Initialize socket handler
socketHandler(io);

console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === "production") {
  const frontendPath = path.join(__dirname, "..", "frontendfix", "dist");

  app.use(express.static(frontendPath));

  app.get("*", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
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
