const Room = require("../models/Room");
const { socketAuth } = require("../middleware/authMiddleware");

// Store active rooms and their participants
const activeRooms = new Map();
const userSockets = new Map(); // userId -> socketId

const socketHandler = (io) => {
  // Authentication middleware for Socket.IO
  io.use(socketAuth);

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.user.name} (${socket.user.id})`);

    // Store user socket mapping
    userSockets.set(socket.user.id, socket.id);

    // Join room
    socket.on("join-room", async (data) => {
      try {
        const { room_code } = data;

        // Verify room exists and is active
        const room = await Room.findByCode(room_code);
        if (!room || !room.is_active) {
          socket.emit("error", { message: "Room not found or inactive" });
          return;
        }

        // Add participant to room
        await Room.addParticipant(
          room.id,
          socket.user.id,
          socket.user.role === "teacher"
        );

        // Join socket room
        socket.join(room.id);
        socket.currentRoom = room.id;

        // Track active room
        if (!activeRooms.has(room.id)) {
          activeRooms.set(room.id, new Set());
        }
        activeRooms.get(room.id).add(socket.user.id);

        // Get updated participants list
        const participants = await Room.getParticipants(room.id);

        // Notify others in the room
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

        // Send current room state to the joining user
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

    // Handle code changes
    socket.on("code-change", (data) => {
      const { code, language } = data;

      if (socket.currentRoom) {
        // Broadcast code change to other users in the room
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

    // Handle chat messages
    socket.on("chat-message", async (data) => {
      try {
        const { message } = data;

        if (socket.currentRoom) {
          const messageData = {
            id: require("uuid").v4(),
            room_id: socket.currentRoom,
            user_id: socket.user.id,
            content: message,
            message_type: "text",
            created_at: new Date(),
            user: {
              id: socket.user.id,
              name: socket.user.name,
              role: socket.user.role,
              avatar_url: socket.user.avatar_url,
            },
          };

          // Broadcast message to all users in the room
          io.to(socket.currentRoom).emit("chat-message", messageData);

          // Store message in database (optional - for message history)
          // await Message.create(messageData);
        }
      } catch (error) {
        console.error("Error sending chat message:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // Handle reactions
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

    // Handle WebRTC signaling
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

    // Handle screen sharing requests
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

    // Handle video call invitation
    socket.on("video-call-invitation", (data) => {
      const { toUserId, fromUser, meetingId, type } = data;
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

    // Handle video call response
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

    // Handle disconnection
    socket.on("disconnect", async () => {
      console.log(`User disconnected: ${socket.user.name} (${socket.user.id})`);

      // Remove from current room
      if (socket.currentRoom) {
        try {
          await Room.removeParticipant(socket.currentRoom, socket.user.id);

          // Remove from active room tracking
          if (activeRooms.has(socket.currentRoom)) {
            activeRooms.get(socket.currentRoom).delete(socket.user.id);

            // Clean up empty rooms
            if (activeRooms.get(socket.currentRoom).size === 0) {
              activeRooms.delete(socket.currentRoom);
            }
          }

          // Get updated participants list
          const participants = await Room.getParticipants(socket.currentRoom);

          // Notify others in the room
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

      // Remove from user sockets mapping
      userSockets.delete(socket.user.id);
    });
  });

  return io;
};

module.exports = socketHandler;
