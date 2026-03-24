const Message = require("../models/Message");
const { v4: uuidv4 } = require("uuid");
const { asyncHandler } = require("../middleware/globalErrorHandler");

// ✅ Create new message
const createMessage = asyncHandler(async (req, res) => {
  const { room_id, message } = req.body;
  console.log("Room Id", id, "Message", message);

  if (!room_id || !message) {
    return res.status(400).json({
      success: false,
      message: "room_id and message are required",
    });
  }

  const messageData = {
    id: uuidv4(),
    room_id,
    user_id: req.user.id,
    content: message,
    message_type: "text",
    created_at: new Date(),
  };

  // 1. Save to DB
  const newMessage = await Message.create(messageData);

  // 2. Emit to room via socket
  const io = req.app.get("io");

  io.to(room_id).emit("chat-message", {
    ...newMessage,
    user: {
      id: req.user.id,
      name: req.user.name,
      role: req.user.role,
      avatar_url: req.user.avatar_url,
    },
  });

  // 3. Send response
  res.status(201).json({
    success: true,
    message: "Message created successfully",
    data: {
      ...newMessage,
      user: {
        id: req.user.id,
        name: req.user.name,
        role: req.user.role,
        avatar_url: req.user.avatar_url,
      },
    },
  });
});

// ✅ Get all messages for a room
const getAllMessages = asyncHandler(async (req, res) => {
  const { room_id } = req.params;

  if (!room_id) {
    return res.status(400).json({
      success: false,
      message: "room_id is required",
    });
  }

  const messages = await Message.getMessages(room_id);

  res.status(200).json({
    success: true,
    data: messages,
  });
});

module.exports = {
  createMessage,
  getAllMessages,
};
