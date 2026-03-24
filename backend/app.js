const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const roomRoutes = require("./routes/room");
const messageRoutes = require("./routes/message");
const codeRoutes = require("./routes/codeFile");
const submittedWorkRoutes = require("./routes/submittedWork");

const { globalErrorHandler } = require("./middleware/globalErrorHandler");

const app = express();

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

app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_URL
        : "http://localhost:5173",
    credentials: true,
  })
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
});
app.use("/api/", limiter);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/codes/", codeRoutes);
app.use("/api/submitted-work", submittedWorkRoutes);

app.use(globalErrorHandler);

module.exports = app;
