import { io } from 'socket.io-client';
import { SOCKET_URL } from './utils/constants';
import { useAuthStore } from './store/authStore';
import { useRoomStore } from './store/roomStore';
import toast from 'react-hot-toast';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  // Store the current token for reconnection
  _currentToken = null;

  // Initialize socket connection
  connect(token) {
    if (this.socket?.connected) {
      return this.socket;
    }

    this._currentToken = token;
    
    // Close existing socket if any
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.socket = io(SOCKET_URL, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Set up all event listeners immediately
    this.setupEventListeners();

    return this.socket;
  }

  // Setup all event listeners
  setupEventListeners() {
    // Connection events
    this.socket.on('connect', () => {
      this.isConnected = true;
      console.log('Connected to server');
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.log('Disconnected from server:', reason);
      
      if (reason === 'io server disconnect') {
        // Server disconnected us, try to reconnect
        this.connect(this._currentToken);
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      toast.error('Failed to connect to server');
    });

    // Room events
    this.socket.on('room-joined', (data) => {
      const { room, participants } = data;
      useRoomStore.getState().setParticipants(participants);
      toast.success(`Joined room: ${room.name}`);
    });

    this.socket.on('user-joined', (data) => {
      const { user, participants } = data;
      useRoomStore.getState().setParticipants(participants);
      toast.success(`${user.name} joined the room`);
    });

    this.socket.on('user-left', (data) => {
      const { user, participants } = data;
      useRoomStore.getState().setParticipants(participants);
      toast(`${user.name} left the room`, {
        icon: '👋',
      });
    });

    // Code collaboration events
    this.socket.on('receive-code', (data) => {
      // This will be handled by the editor component
      window.dispatchEvent(new CustomEvent('code-change', { detail: data }));
    });

    // Chat events
    this.socket.on('chat-message', (message) => {
      // This will be handled by the chat component
      window.dispatchEvent(new CustomEvent('chat-message', { detail: message }));
    });

    // Reaction events
    this.socket.on('reaction', (data) => {
      // This will be handled by the reaction component
      window.dispatchEvent(new CustomEvent('reaction', { detail: data }));
    });

    // WebRTC events - CRITICAL for video calling
    this.socket.on('webrtc-offer', (data) => {
      console.log('Socket received webrtc-offer:', data);
      window.dispatchEvent(new CustomEvent('webrtc-offer', { detail: data }));
    });

    this.socket.on('webrtc-answer', (data) => {
      console.log('Socket received webrtc-answer:', data);
      window.dispatchEvent(new CustomEvent('webrtc-answer', { detail: data }));
    });

    this.socket.on('ice-candidate', (data) => {
      console.log('Socket received ice-candidate:', data);
      window.dispatchEvent(new CustomEvent('ice-candidate', { detail: data }));
    });

    // Screen sharing events
    this.socket.on('screen-share-request', (data) => {
      window.dispatchEvent(new CustomEvent('screen-share-request', { detail: data }));
    });

    this.socket.on('screen-share-response', (data) => {
      window.dispatchEvent(new CustomEvent('screen-share-response', { detail: data }));
    });

    // Error handling
    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      toast.error(error.message || 'Socket error occurred');
    });
  }

  // Send video call invitation
  sendVideoCallInvitation(data) {
    if (this.socket?.connected) {
      this.socket.emit('video-call-invitation', data);
    }
  }

  // Send video call response
  sendVideoCallResponse(data) {
    if (this.socket?.connected) {
      this.socket.emit('video-call-response', data);
    }
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Join room
  joinRoom(roomCode) {
    if (this.socket?.connected) {
      this.socket.emit('join-room', { room_code: roomCode });
    }
  }

  // Send code change
  sendCodeChange(code, language) {
    if (this.socket?.connected) {
      this.socket.emit('code-change', { code, language });
    }
  }

  // Send chat message
  sendChatMessage(message) {
    if (this.socket?.connected) {
      this.socket.emit('chat-message', { message });
    }
  }

  // Send reaction
  sendReaction(emoji) {
    if (this.socket?.connected) {
      this.socket.emit('reaction', { emoji });
    }
  }

  // WebRTC signaling
  sendWebRTCOffer(targetUserId, offer) {
    if (this.socket?.connected) {
      this.socket.emit('webrtc-offer', { targetUserId, offer });
    }
  }

  sendWebRTCAnswer(targetUserId, answer) {
    if (this.socket?.connected) {
      this.socket.emit('webrtc-answer', { targetUserId, answer });
    }
  }

  sendICECandidate(targetUserId, candidate) {
    if (this.socket?.connected) {
      this.socket.emit('ice-candidate', { targetUserId, candidate });
    }
  }

  // Screen sharing
  requestScreenShare(targetUserId) {
    if (this.socket?.connected) {
      this.socket.emit('screen-share-request', { targetUserId });
    }
  }

  respondScreenShare(targetUserId, accepted) {
    if (this.socket?.connected) {
      this.socket.emit('screen-share-response', { targetUserId, accepted });
    }
  }

  // Get connection status
  isSocketConnected() {
    return this.socket?.connected || false;
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;
