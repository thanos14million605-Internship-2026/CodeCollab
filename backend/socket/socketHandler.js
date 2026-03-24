const Room = require("../models/Room");

const { socketAuth } = require("../middleware/authMiddleware");

const activeRooms = new Map();
const userSockets = new Map(); // userId -> socketId

const socketHandler = (io) => {
  io.use(socketAuth);

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.user.name} (${socket.user.id})`);

    userSockets.set(socket.user.id, socket.id);

    socket.on("join-room", async (data) => {
      try {
        const { room_code } = data;

        const room = await Room.findByCode(room_code);
        if (!room || !room.is_active) {
          socket.emit("error", { message: "Room not found or inactive" });
          return;
        }

        await Room.addParticipant(
          room.id,
          socket.user.id,
          socket.user.role === "teacher"
        );

        socket.join(room.id);
        socket.currentRoom = room.id;

        if (!activeRooms.has(room.id)) {
          activeRooms.set(room.id, new Set());
        }
        activeRooms.get(room.id).add(socket.user.id);

        const participants = await Room.getParticipants(room.id);

        socket.to(room.id).emit("user-joined", {
          user: {
            id: socket.user.id,
            name: socket.user.name,
            email: socket.user.email,
            role: socket.user.role,
            avatar_url: socket.user.avatar_url,
          },
          participants,
        });

        socket.emit("room-joined", {
          room,
          participants,
          users: Array.from(activeRooms.get(room.id) || []),
        });

        console.log(`User ${socket.user.name} joined room ${room_code}`);
      } catch (error) {
        console.error("Error joining room:", error);
        socket.emit("error", { message: "Failed to join room" });
      }
    });

    socket.on("code-change", (data) => {
      const { code, language } = data;

      if (socket.currentRoom) {
        socket.to(socket.currentRoom).emit("receive-code", {
          code,
          language,
          user: {
            id: socket.user.id,
            name: socket.user.name,
          },
        });
      }
    });

    socket.on("reaction", (data) => {
      const { emoji } = data;

      if (socket.currentRoom) {
        socket.to(socket.currentRoom).emit("reaction", {
          emoji,
          user: {
            id: socket.user.id,
            name: socket.user.name,
          },
        });
      }
    });

    socket.on("webrtc-offer", (data) => {
      const { targetUserId, offer } = data;
      const targetSocketId = userSockets.get(targetUserId);

      if (targetSocketId) {
        io.to(targetSocketId).emit("webrtc-offer", {
          offer,
          fromUserId: socket.user.id,
          fromUserName: socket.user.name,
        });
      }
    });

    socket.on("webrtc-answer", (data) => {
      const { targetUserId, answer } = data;
      const targetSocketId = userSockets.get(targetUserId);

      if (targetSocketId) {
        io.to(targetSocketId).emit("webrtc-answer", {
          answer,
          fromUserId: socket.user.id,
        });
      }
    });

    socket.on("ice-candidate", (data) => {
      const { targetUserId, candidate } = data;
      const targetSocketId = userSockets.get(targetUserId);

      if (targetSocketId) {
        io.to(targetSocketId).emit("ice-candidate", {
          candidate,
          fromUserId: socket.user.id,
        });
      }
    });

    socket.on("screen-share-request", (data) => {
      const { targetUserId } = data;
      const targetSocketId = userSockets.get(targetUserId);

      if (targetSocketId) {
        io.to(targetSocketId).emit("screen-share-request", {
          fromUserId: socket.user.id,
          fromUserName: socket.user.name,
        });
      }
    });

    // Handle screen share response
    socket.on("screen-share-response", (data) => {
      const { targetUserId, accepted } = data;
      const targetSocketId = userSockets.get(targetUserId);

      if (targetSocketId) {
        io.to(targetSocketId).emit("screen-share-response", {
          accepted,
          fromUserId: socket.user.id,
        });
      }
    });

    socket.on("video-call-invitation", (data) => {
      const { toUserId, meetingId, type } = data;
      const targetSocketId = userSockets.get(toUserId);

      if (targetSocketId) {
        io.to(targetSocketId).emit("video-call-invitation", {
          fromUser: {
            id: socket.user.id,
            name: socket.user.name,
            avatar_url: socket.user.avatar_url,
          },
          meetingId,
          type,
        });
      }
    });

    socket.on("video-call-response", (data) => {
      const { toUserId, response, meetingId } = data;
      const targetSocketId = userSockets.get(toUserId);

      if (targetSocketId) {
        io.to(targetSocketId).emit("video-call-response", {
          response,
          fromUserId: socket.user.id,
          meetingId,
        });
      }
    });

    socket.on("disconnect", async () => {
      console.log(`User disconnected: ${socket.user.name} (${socket.user.id})`);

      if (socket.currentRoom) {
        try {
          await Room.removeParticipant(socket.currentRoom, socket.user.id);

          if (activeRooms.has(socket.currentRoom)) {
            activeRooms.get(socket.currentRoom).delete(socket.user.id);

            if (activeRooms.get(socket.currentRoom).size === 0) {
              activeRooms.delete(socket.currentRoom);
            }
          }

          const participants = await Room.getParticipants(socket.currentRoom);

          socket.to(socket.currentRoom).emit("user-left", {
            user: {
              id: socket.user.id,
              name: socket.user.name,
              role: socket.user.role,
            },
            participants,
          });
        } catch (error) {
          console.error("Error handling disconnect:", error);
        }
      }

      userSockets.delete(socket.user.id);
    });
  });

  return io;
};

module.exports = socketHandler;
