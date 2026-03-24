// Video Call Bridge Service
// This service bridges the gap between room participants and VideoSDK meetings
import socketService from "../socket";
import { createMeeting } from "./videoSDKAPI";
import toast from "react-hot-toast";

class VideoCallBridge {
  constructor() {
    this.activeCalls = new Map(); // userId -> meetingId
    this.incomingCalls = new Map(); // userId -> meetingId
    this.callbacks = {};
  }

  // Set event callbacks
  on(event, callback) {
    this.callbacks[event] = callback;
  }

  // Initiate a video call using VideoSDK
  async initiateCall(caller, receiver) {
    try {
      // Create a new VideoSDK meeting
      const meetingId = await createMeeting({
        token: window.videoSDKAuthToken,
      });

      // Store the active call
      this.activeCalls.set(receiver.user_id, meetingId);

      // Send call invitation through socket
      socketService.sendVideoCallInvitation({
        toUserId: receiver.user_id,
        fromUser: caller,
        meetingId: meetingId,
        type: "videosdk",
      });

      console.log("VideoSDK call initiated:", {
        caller: caller.name,
        receiver: receiver.name,
        meetingId,
      });
      toast.success(`Calling ${receiver.name}...`);

      return meetingId;
    } catch (error) {
      console.error("Failed to initiate VideoSDK call:", error);
      toast.error("Failed to start video call");
      throw error;
    }
  }

  // Handle incoming video call invitation
  handleIncomingCall(data) {
    const { fromUser, meetingId, type } = data;

    if (type === "videosdk") {
      // Store incoming call
      this.incomingCalls.set(fromUser.id, meetingId);

      // Trigger incoming call callback
      this.callbacks.onIncomingCall?.({
        fromUser,
        meetingId,
        type: "videosdk",
      });

      // Show toast notification with action
      toast.success(`Incoming video call from ${fromUser.name}`, {
        duration: 10000,
        action: {
          label: "Join",
          onClick: () => {
            this.acceptCall(fromUser.id, meetingId);
          },
        },
      });

      console.log("Incoming VideoSDK call:", {
        fromUser: fromUser.name,
        meetingId,
      });
    }
  }

  // Accept incoming call
  acceptCall(fromUserId, meetingId) {
    // Remove from incoming calls
    this.incomingCalls.delete(fromUserId);

    // Add to active calls
    this.activeCalls.set(fromUserId, meetingId);

    // Trigger accept callback
    this.callbacks.onCallAccepted?.({
      fromUserId,
      meetingId,
    });

    toast.success("Call accepted");
  }

  // Reject incoming call
  rejectCall(fromUserId) {
    const meetingId = this.incomingCalls.get(fromUserId);

    // Remove from incoming calls
    this.incomingCalls.delete(fromUserId);

    // Notify caller that call was rejected
    socketService.sendVideoCallResponse({
      toUserId: fromUserId,
      response: "rejected",
      meetingId: meetingId,
    });

    // Trigger reject callback
    this.callbacks.onCallRejected?.({ fromUserId });

    toast.info("Call rejected");
  }

  // Handle call response
  handleCallResponse(data) {
    const { response, fromUserId, meetingId } = data;

    if (response === "rejected") {
      // Remove from active calls
      this.activeCalls.delete(fromUserId);

      // Trigger reject callback
      this.callbacks.onCallRejected?.({ fromUserId });

      toast.info("Call was rejected");
    } else if (response === "accepted") {
      // Call was accepted, proceed with joining meeting
      this.callbacks.onCallAccepted?.({
        fromUserId,
        meetingId,
      });

      toast.success("Call accepted!");
    }
  }

  // End call
  endCall(userId) {
    const meetingId = this.activeCalls.get(userId);

    // Remove from active calls
    this.activeCalls.delete(userId);
    this.incomingCalls.delete(userId);

    // Notify other user
    socketService.sendVideoCallResponse({
      toUserId: userId,
      response: "ended",
      meetingId: meetingId,
    });

    // Trigger end callback
    this.callbacks.onCallEnded?.({ userId });

    toast.info("Call ended");
  }

  // Get active calls
  getActiveCalls() {
    return this.activeCalls;
  }

  // Get incoming calls
  getIncomingCalls() {
    return this.incomingCalls;
  }

  // Check if user is in a call
  isInCall(userId) {
    return this.activeCalls.has(userId) || this.incomingCalls.has(userId);
  }

  // Cleanup
  cleanup() {
    this.activeCalls.clear();
    this.incomingCalls.clear();
    this.callbacks = {};
  }
}

// Create singleton instance
const videoCallBridge = new VideoCallBridge();

// Setup socket event listeners for video call bridging
export const setupVideoCallBridge = () => {
  if (!socketService.socket) {
    console.warn("Socket not initialized yet");
    return;
  }

  socketService.socket.off("video-call-invitation"); // prevent duplicates
  socketService.socket.off("video-call-response");

  socketService.socket.on("video-call-invitation", (data) => {
    console.log("📞 Incoming call event received:", data);
    videoCallBridge.handleIncomingCall(data);
  });

  socketService.socket.on("video-call-response", (data) => {
    videoCallBridge.handleCallResponse(data);
  });
};

export default videoCallBridge;
