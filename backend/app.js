const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

// Import routes
const authRoutes = require("./routes/auth");
const roomRoutes = require("./routes/room");

// Import middleware
const { globalErrorHandler } = require("./middleware/globalErrorHandler");

// Create Express app
const app = express();

// Security middleware
import helmet from "helmet";

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],

        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
          "https://cdn.jsdelivr.net",
          "blob:",
        ],

        styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],

        imgSrc: ["'self'", "data:", "https:"],

        fontSrc: ["'self'", "data:"],

        connectSrc: ["'self'", "wss:", "https://cdn.jsdelivr.net"],

        workerSrc: ["'self'", "blob:"],
      },
    },
  })
);

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
});
app.use("/api/", limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);

// Global error handler
app.use(globalErrorHandler);

module.exports = app;
