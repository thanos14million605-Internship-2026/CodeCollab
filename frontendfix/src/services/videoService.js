class VideoService {
  constructor() {
    this.localStream = null;
    this.remoteStreams = new Map();
    this.peerConnections = new Map();
    this.isInitialized = false;
    this.callbacks = {};
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      this.isInitialized = true;
      console.log("Video service initialized successfully");
      return this.localStream;
    } catch (error) {
      console.error("Failed to initialize video service:", error);
      throw error;
    }
  }

  createPeerConnection(userId) {
    const configuration = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
        {
          urls: "turn:turn.relay.metered.ca:80",
          username: "test",
          credential: "test",
        },
        {
          urls: "turn:turn.relay.metered.ca:443",
          username: "test",
          credential: "test",
        },
      ],
      iceCandidatePoolSize: 10,
    };

    const pc = new RTCPeerConnection(configuration);

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.callbacks.onIceCandidate?.(userId, event.candidate);
      }
    };

    pc.ontrack = (event) => {
      console.log("Received remote stream from:", userId);
      this.remoteStreams.set(userId, event.streams[0]);
      this.callbacks.onRemoteStream?.(userId, event.streams[0]);
    };

    pc.onconnectionstatechange = () => {
      console.log("Connection state with", userId, ":", pc.connectionState);
      this.callbacks.onConnectionStateChange?.(userId, pc.connectionState);
    };

    pc.oniceconnectionstatechange = () => {
      console.log(
        "ICE connection state with",
        userId,
        ":",
        pc.iceConnectionState
      );
      this.callbacks.onIceConnectionStateChange?.(
        userId,
        pc.iceConnectionState
      );
    };

    this.peerConnections.set(userId, pc);
    return pc;
  }

  async createOffer(userId) {
    try {
      const pc = this.createPeerConnection(userId);
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await pc.setLocalDescription(offer);

      console.log("Created offer for:", userId);
      return offer;
    } catch (error) {
      console.error("Error creating offer:", error);
      throw error;
    }
  }

  async handleOffer(userId, offer) {
    try {
      const pc = this.createPeerConnection(userId);
      await pc.setRemoteDescription(offer);
      const answer = await pc.createAnswer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await pc.setLocalDescription(answer);

      console.log("Created answer for:", userId);
      return answer;
    } catch (error) {
      console.error("Error handling offer:", error);
      throw error;
    }
  }

  async handleAnswer(userId, answer) {
    try {
      const pc = this.peerConnections.get(userId);
      if (pc) {
        await pc.setRemoteDescription(answer);
        console.log("Set remote description for:", userId);
      }
    } catch (error) {
      console.error("Error handling answer:", error);
      throw error;
    }
  }

  async handleIceCandidate(userId, candidate) {
    try {
      const pc = this.peerConnections.get(userId);
      if (pc) {
        await pc.addIceCandidate(candidate);
        console.log("Added ICE candidate for:", userId);
      }
    } catch (error) {
      console.error("Error adding ICE candidate:", error);
    }
  }

  toggleVideo() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        return videoTrack.enabled;
      }
    }
    return false;
  }

  toggleAudio() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return audioTrack.enabled;
      }
    }
    return false;
  }

  async startScreenShare() {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: "always",
        },
        audio: true,
      });

      const videoTrack = screenStream.getVideoTracks()[0];

      this.peerConnections.forEach((pc) => {
        const sender = pc
          .getSenders()
          .find((s) => s.track && s.track.kind === "video");
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      });

      videoTrack.onended = () => {
        this.stopScreenShare();
      };

      console.log("Screen sharing started");
      return screenStream;
    } catch (error) {
      console.error("Error starting screen share:", error);
      throw error;
    }
  }

  async stopScreenShare() {
    try {
      if (this.localStream) {
        const videoTrack = this.localStream.getVideoTracks()[0];

        this.peerConnections.forEach((pc) => {
          const sender = pc
            .getSenders()
            .find((s) => s.track && s.track.kind === "video");
          if (sender) {
            sender.replaceTrack(videoTrack);
          }
        });
      }
      console.log("Screen sharing stopped");
    } catch (error) {
      console.error("Error stopping screen share:", error);
    }
  }

  endCall(userId) {
    const pc = this.peerConnections.get(userId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(userId);
      this.remoteStreams.delete(userId);
      console.log("Call ended with:", userId);
    }
  }

  endAllCalls() {
    this.peerConnections.forEach((pc, userId) => {
      pc.close();
    });
    this.peerConnections.clear();
    this.remoteStreams.clear();
    console.log("All calls ended");
  }

  getLocalStream() {
    return this.localStream;
  }

  getRemoteStream(userId) {
    return this.remoteStreams.get(userId);
  }

  isVideoEnabled() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      return videoTrack?.enabled || false;
    }
    return false;
  }

  isAudioEnabled() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      return audioTrack?.enabled || false;
    }
    return false;
  }

  on(event, callback) {
    this.callbacks[event] = callback;
  }

  cleanup() {
    this.endAllCalls();
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
    this.isInitialized = false;
    this.callbacks = {};
    console.log("Video service cleaned up");
  }
}

const videoService = new VideoService();
export default videoService;
