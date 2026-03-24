const Message = require("../models/Message");
const { v4: uuidv4 } = require("uuid");
const { asyncHandler } = require("../middleware/globalErrorHandler");

const createMessage = asyncHandler(async (req, res) => {
  const { room_id, message } = req.body;
  console.log("Room Id", room_id, "Message", message);

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
  const newMessage = await Message.create(messageData);
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

const getAllMessages = asyncHandler(async (req, res) => {
  const { roomId } = req.params;

  console.log("Room Id In Get All Messages", roomId);
  if (!roomId) {
    return res.status(400).json({
      success: false,
      message: "room_id is required",
    });
  }

  const messages = await Message.getMessages(roomId);

  res.status(200).json({
    success: true,
    data: messages,
  });
});

module.exports = {
  createMessage,
  getAllMessages,
};
