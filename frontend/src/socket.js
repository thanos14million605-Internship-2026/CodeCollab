import { io } from "socket.io-client";
import { SOCKET_URL } from "./utils/constants";
import { useRoomStore } from "./store/roomStore";
import toast from "react-hot-toast";

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  _currentToken = null;

  connect(token) {
    if (this.socket?.connected) {
      return this.socket;
    }

    this._currentToken = token;

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.socket = io(SOCKET_URL, {
      auth: {
        token,
      },
      transports: ["websocket", "polling"],
      timeout: 20000,
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.setupEventListeners();

    return this.socket;
  }

  setupEventListeners() {
    this.socket.on("connect", () => {
      this.isConnected = true;
      console.log("Connected to server");
    });

    this.socket.on("disconnect", (reason) => {
      this.isConnected = false;
      console.log("Disconnected from server:", reason);

      if (reason === "io server disconnect") {
        this.connect(this._currentToken);
      }
    });

    this.socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
      toast.error("Failed to connect to server");
    });

    this.socket.on("room-joined", (data) => {
      const { room, participants } = data;
      useRoomStore.getState().setParticipants(participants);
      toast.success(`Joined room: ${room.name}`);
    });

    this.socket.on("user-joined", (data) => {
      const { user, participants } = data;
      useRoomStore.getState().setParticipants(participants);
      toast.success(`${user.name} joined the room`);
    });

    this.socket.on("user-left", (data) => {
      const { user, participants } = data;
      useRoomStore.getState().setParticipants(participants);
      toast(`${user.name} left the room`, {
        icon: "👋",
      });
    });

    this.socket.on("receive-code", (data) => {
      window.dispatchEvent(new CustomEvent("code-change", { detail: data }));
    });

    this.socket.on("chat-message", (message) => {
      window.dispatchEvent(
        new CustomEvent("chat-message", { detail: message })
      );
    });

    this.socket.on("reaction", (data) => {
      window.dispatchEvent(new CustomEvent("reaction", { detail: data }));
    });

    this.socket.on("webrtc-offer", (data) => {
      console.log("Socket received webrtc-offer:", data);
      window.dispatchEvent(new CustomEvent("webrtc-offer", { detail: data }));
    });

    this.socket.on("webrtc-answer", (data) => {
      console.log("Socket received webrtc-answer:", data);
      window.dispatchEvent(new CustomEvent("webrtc-answer", { detail: data }));
    });

    this.socket.on("ice-candidate", (data) => {
      console.log("Socket received ice-candidate:", data);
      window.dispatchEvent(new CustomEvent("ice-candidate", { detail: data }));
    });

    this.socket.on("screen-share-request", (data) => {
      window.dispatchEvent(
        new CustomEvent("screen-share-request", { detail: data })
      );
    });

    this.socket.on("screen-share-response", (data) => {
      window.dispatchEvent(
        new CustomEvent("screen-share-response", { detail: data })
      );
    });

    this.socket.on("error", (error) => {
      console.error("Socket error:", error);
      toast.error(error.message || "Socket error occurred");
    });
  }

  sendVideoCallInvitation(data) {
    if (this.socket?.connected) {
      this.socket.emit("video-call-invitation", data);
    }
  }

  sendVideoCallResponse(data) {
    if (this.socket?.connected) {
      this.socket.emit("video-call-response", data);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  joinRoom(roomCode) {
    if (this.socket?.connected) {
      this.socket.emit("join-room", { room_code: roomCode });
    }
  }

  sendCodeChange(code, language) {
    if (this.socket?.connected) {
      this.socket.emit("code-change", { code, language });
    }
  }

  sendChatMessage(message) {
    if (this.socket?.connected) {
      this.socket.emit("chat-message", { message });
    }
  }

  sendReaction(emoji) {
    if (this.socket?.connected) {
      this.socket.emit("reaction", { emoji });
    }
  }

  sendWebRTCOffer(targetUserId, offer) {
    if (this.socket?.connected) {
      this.socket.emit("webrtc-offer", { targetUserId, offer });
    }
  }

  sendWebRTCAnswer(targetUserId, answer) {
    if (this.socket?.connected) {
      this.socket.emit("webrtc-answer", { targetUserId, answer });
    }
  }

  sendICECandidate(targetUserId, candidate) {
    if (this.socket?.connected) {
      this.socket.emit("ice-candidate", { targetUserId, candidate });
    }
  }

  requestScreenShare(targetUserId) {
    if (this.socket?.connected) {
      this.socket.emit("screen-share-request", { targetUserId });
    }
  }

  respondScreenShare(targetUserId, accepted) {
    if (this.socket?.connected) {
      this.socket.emit("screen-share-response", { targetUserId, accepted });
    }
  }

  isSocketConnected() {
    return this.socket?.connected || false;
  }
}

const socketService = new SocketService();

export default socketService;
