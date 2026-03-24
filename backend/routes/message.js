const express = require("express");
const router = express.Router();

const {
  createMessage,
  getAllMessages,
} = require("../controllers/messageController");

const { authenticate } = require("../middleware/authMiddleware");

router.post("/", authenticate, createMessage);

router.get("/:roomId", authenticate, getAllMessages);

module.exports = router;
