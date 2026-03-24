import React, { useEffect, useState } from "react";
import { MeetingProvider } from "@videosdk.live/react-sdk";
import {
  authToken,
  createMeeting,
  isAuthTokenConfigured,
} from "../services/videoSDKAPI";
import { useAuthStore } from "../store/authStore";
import videoCallBridge, {
  setupVideoCallBridge,
} from "../services/videoCallBridge";
import toast from "react-hot-toast";

import MeetingView from "./MeetingView"; // keep your existing component
import JoinScreen from "./JoinScreen"; // keep your existing component
import IncomingCallModal from "./IncomingCallModal"; // keep your existing component

function VideoSDKCallEnhanced({ roomCode, participants }) {
  const [meetingId, setMeetingId] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const { user } = useAuthStore();

  // ✅ Setup bridge
  useEffect(() => {
    setupVideoCallBridge();

    // Incoming call
    videoCallBridge.on("onIncomingCall", (call) => {
      setIncomingCall(call);
    });

    // ✅ MOST IMPORTANT FIX: join ONLY after accept
    videoCallBridge.on("onCallAccepted", ({ meetingId }) => {
      setMeetingId(meetingId);
      setIncomingCall(null);
    });

    videoCallBridge.on("onCallRejected", () => {
      setIncomingCall(null);
    });

    videoCallBridge.on("onCallEnded", () => {
      setMeetingId(null);
      toast.info("Call ended");
    });

    return () => {
      videoCallBridge.cleanup();
    };
  }, []);

  // Create or join meeting manually
  const getMeetingAndToken = async (id) => {
    try {
      const newMeetingId =
        id == null ? await createMeeting({ token: authToken }) : id;

      setMeetingId(newMeetingId);
    } catch (error) {
      console.error("Failed to get meeting:", error);
      throw error;
    }
  };

  // ❌ OLD BUG: joining immediately
  // ✅ FIXED: ONLY send invite
  const handleInitiateCall = async (caller, receiver) => {
    try {
      await videoCallBridge.initiateCall(caller, receiver);

      // ❌ DO NOT DO THIS:
      // setMeetingId(...)
    } catch (error) {
      console.error("Failed to initiate call:", error);
    }
  };

  // Accept call
  const handleAcceptCall = (fromUserId, meetingId) => {
    videoCallBridge.acceptCall(fromUserId, meetingId);
  };

  // Reject call
  const handleRejectCall = (fromUserId) => {
    videoCallBridge.rejectCall(fromUserId);
    setIncomingCall(null);
  };

  const onMeetingLeave = () => {
    setMeetingId(null);
    toast.info("You left the meeting");
  };

  const effectiveMeetingId = meetingId || roomCode;

  if (!isAuthTokenConfigured()) {
    return <div>VideoSDK not configured</div>;
  }

  return (
    <div className="h-full relative">
      {/* Incoming Call UI */}
      {incomingCall && (
        <IncomingCallModal
          call={incomingCall}
          onAccept={handleAcceptCall}
          onReject={handleRejectCall}
        />
      )}

      {/* Meeting UI */}
      {authToken && effectiveMeetingId ? (
        <MeetingProvider
          config={{
            meetingId: effectiveMeetingId,
            micEnabled: true,
            webcamEnabled: true,
            name: user?.name || "User",
          }}
          token={authToken}
        >
          <MeetingView
            meetingId={effectiveMeetingId}
            onMeetingLeave={onMeetingLeave}
          />
        </MeetingProvider>
      ) : (
        <JoinScreen
          getMeetingAndToken={getMeetingAndToken}
          participants={participants}
          onInitiateCall={handleInitiateCall}
        />
      )}
    </div>
  );
}

export default VideoSDKCallEnhanced;
