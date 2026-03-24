const Room = require("../models/Room");
const { asyncHandler } = require("../middleware/globalErrorHandler");

const createRoom = asyncHandler(async (req, res) => {
  const { name, description, max_participants } = req.body;

  const roomData = {
    name,
    description,
    created_by: req.user.id,
    max_participants,
  };

  const room = await Room.create(roomData);

  res.status(201).json({
    success: true,
    message: "Room created successfully",
    data: { room },
  });
});

const getRoomByCode = asyncHandler(async (req, res) => {
  const { room_code } = req.params;

  const room = await Room.findByCode(room_code);
  if (!room) {
    return res.status(404).json({
      success: false,
      message: "Room not found",
    });
  }

  res.status(200).json({
    success: true,
    data: { room },
  });
});

const joinRoom = asyncHandler(async (req, res) => {
  const { room_code } = req.params;
  const user_id = req.user.id;
  const is_teacher = req.user.role === "teacher";

  const room = await Room.findByCode(room_code);
  if (!room) {
    return res.status(404).json({
      success: false,
      message: "Room not found",
    });
  }

  if (!room.is_active) {
    return res.status(400).json({
      success: false,
      message: "Room is not active",
    });
  }

  const participants = await Room.getParticipants(room.id);
  if (participants.length >= room.max_participants) {
    return res.status(400).json({
      success: false,
      message: "Room is full",
    });
  }

  await Room.addParticipant(room.id, user_id, is_teacher);

  res.status(200).json({
    success: true,
    message: "Joined room successfully",
    data: { room },
  });
});

const leaveRoom = asyncHandler(async (req, res) => {
  const { room_id } = req.params;
  const user_id = req.user.id;

  await Room.removeParticipant(room_id, user_id);

  res.status(200).json({
    success: true,
    message: "Left room successfully",
  });
});

const getRoomParticipants = asyncHandler(async (req, res) => {
  const { room_id } = req.params;

  const participants = await Room.getParticipants(room_id);

  res.status(200).json({
    success: true,
    data: { participants },
  });
});

const getUserRooms = asyncHandler(async (req, res) => {
  const user_id = req.user.id;

  const rooms = await Room.findByCreator(user_id);

  res.status(200).json({
    success: true,
    data: { rooms },
  });
});

const updateRoomStatus = asyncHandler(async (req, res) => {
  const { room_id } = req.params;
  const { is_active } = req.body;

  const room = await Room.findById(room_id);
  if (!room || room.created_by !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: "Not authorized to update this room",
    });
  }

  const updatedRoom = await Room.updateStatus(room_id, is_active);

  res.status(200).json({
    success: true,
    message: "Room status updated successfully",
    data: { room: updatedRoom },
  });
});

module.exports = {
  createRoom,
  getRoomByCode,
  joinRoom,
  leaveRoom,
  getRoomParticipants,
  getUserRooms,
  updateRoomStatus,
};
