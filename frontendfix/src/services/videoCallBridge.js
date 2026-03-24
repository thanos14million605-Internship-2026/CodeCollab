import socketService from "../socket";
import { createMeeting } from "./videoSDKAPI";
import toast from "react-hot-toast";

class VideoCallBridge {
  constructor() {
    this.activeCalls = new Map(); // userId -> meetingId
    this.incomingCalls = new Map(); // userId -> meetingId
    this.callbacks = {};
  }

  on(event, callback) {
    this.callbacks[event] = callback;
  }

  async initiateCall(caller, receiver) {
    try {
      const meetingId = await createMeeting({
        token: window.videoSDKAuthToken,
      });

      this.activeCalls.set(receiver.user_id, meetingId);

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

  handleIncomingCall(data) {
    const { fromUser, meetingId, type } = data;

    if (type === "videosdk") {
      this.incomingCalls.set(fromUser.id, meetingId);

      this.callbacks.onIncomingCall?.({
        fromUser,
        meetingId,
        type: "videosdk",
      });

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

  acceptCall(fromUserId, meetingId) {
    this.incomingCalls.delete(fromUserId);

    this.activeCalls.set(fromUserId, meetingId);

    this.callbacks.onCallAccepted?.({
      fromUserId,
      meetingId,
    });

    toast.success("Call accepted");
  }

  rejectCall(fromUserId) {
    const meetingId = this.incomingCalls.get(fromUserId);

    this.incomingCalls.delete(fromUserId);

    socketService.sendVideoCallResponse({
      toUserId: fromUserId,
      response: "rejected",
      meetingId: meetingId,
    });

    this.callbacks.onCallRejected?.({ fromUserId });

    toast.info("Call rejected");
  }

  handleCallResponse(data) {
    const { response, fromUserId, meetingId } = data;

    if (response === "rejected") {
      this.activeCalls.delete(fromUserId);

      this.callbacks.onCallRejected?.({ fromUserId });

      toast.info("Call was rejected");
    } else if (response === "accepted") {
      this.callbacks.onCallAccepted?.({
        fromUserId,
        meetingId,
      });

      toast.success("Call accepted!");
    }
  }

  endCall(userId) {
    const meetingId = this.activeCalls.get(userId);

    this.activeCalls.delete(userId);
    this.incomingCalls.delete(userId);

    socketService.sendVideoCallResponse({
      toUserId: userId,
      response: "ended",
      meetingId: meetingId,
    });

    this.callbacks.onCallEnded?.({ userId });

    toast.info("Call ended");
  }

  getActiveCalls() {
    return this.activeCalls;
  }

  getIncomingCalls() {
    return this.incomingCalls;
  }

  isInCall(userId) {
    return this.activeCalls.has(userId) || this.incomingCalls.has(userId);
  }

  cleanup() {
    this.activeCalls.clear();
    this.incomingCalls.clear();
    this.callbacks = {};
  }
}

const videoCallBridge = new VideoCallBridge();

export const setupVideoCallBridge = () => {
  if (!socketService.socket) {
    console.warn("Socket not initialized yet");
    return;
  }

  socketService.socket.off("video-call-invitation");
  socketService.socket.off("video-call-response");

  socketService.socket.on("video-call-invitation", (data) => {
    console.log("Incoming call event received:", data);
    videoCallBridge.handleIncomingCall(data);
  });

  socketService.socket.on("video-call-response", (data) => {
    videoCallBridge.handleCallResponse(data);
  });
};

export default videoCallBridge;
