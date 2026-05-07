import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  MeetingProvider,
  MeetingConsumer,
  useMeeting,
  useParticipant,
} from "@videosdk.live/react-sdk";
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
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Users,
} from "lucide-react";

function JoinScreen({ getMeetingAndToken }) {
  const [meetingId, setMeetingId] = useState("");
  const [joining, setJoining] = useState(false);

  if (!isAuthTokenConfigured()) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-900 text-white p-8">
        <div className="max-w-md w-full space-y-6 text-center">
          <div className="w-16 h-16 bg-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Phone className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-yellow-400">
            VideoSDK Not Configured
          </h2>
          <p className="text-gray-400 mb-6">
            Please configure your VideoSDK auth token in{" "}
            <code className="bg-gray-800 px-2 py-1 rounded">
              src/services/videoSDKAPI.js
            </code>
          </p>
          <div className="bg-gray-800 p-4 rounded-lg text-sm">
            <p className="text-gray-300 mb-2">Steps to configure:</p>
            <ol className="text-left text-gray-400 space-y-1">
              <li>
                1. Sign up at{" "}
                <a
                  href="https://dashboard.videosdk.live/"
                  target="_blank"
                  className="text-blue-400 hover:underline"
                >
                  VideoSDK.live
                </a>
              </li>
              <li>2. Get your auth token from dashboard</li>
              <li>
                3. Replace "YOUR_VIDEOSDK_AUTH_TOKEN_HERE" with your actual
                token
              </li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  const onClick = async () => {
    setJoining(true);
    try {
      await getMeetingAndToken(meetingId || null);
    } catch (error) {
      toast.error("Failed to join/create meeting");
      console.error("Meeting join error:", error);
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-900 text-white p-8">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Video Meeting</h2>
          <p className="text-gray-400">
            Join an existing meeting or create a new one
          </p>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Enter Meeting ID (optional)"
            value={meetingId}
            onChange={(e) => setMeetingId(e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="space-y-3">
            <button
              onClick={onClick}
              disabled={joining}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors duration-200"
            >
              {joining ? "Joining..." : "Join Meeting"}
            </button>

            <div className="text-center text-gray-500">or</div>

            <button
              onClick={() => getMeetingAndToken(null)}
              disabled={joining}
              className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors duration-200"
            >
              {joining ? "Creating..." : "Create New Meeting"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ParticipantView({ participantId }) {
  const micRef = useRef(null);
  const { micStream, webcamOn, micOn, isLocal, displayName } =
    useParticipant(participantId);

  useEffect(() => {
    if (micRef.current) {
      if (micOn && micStream) {
        const mediaStream = new MediaStream();
        mediaStream.addTrack(micStream.track);

        micRef.current.srcObject = mediaStream;
        micRef.current
          .play()
          .catch((error) =>
            console.error("micRef.current.play() failed", error)
          );
      } else {
        micRef.current.srcObject = null;
      }
    }
  }, [micStream, micOn]);

  return (
    <div className="relative bg-gray-800 rounded-lg overflow-hidden">
      <div className="aspect-video">
        {webcamOn ? (
          <div className="h-full w-full flex items-center justify-center bg-gray-700">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-400 text-sm">Video Connected</p>
            </div>
          </div>
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gray-700">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-400 text-sm">
                {displayName || "Participant"}
              </p>
            </div>
          </div>
        )}
      </div>

      <audio ref={micRef} autoPlay playsInline muted={isLocal} />

      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
        <div className="flex items-center gap-2 bg-black bg-opacity-50 px-2 py-1 rounded">
          <span className="text-white text-sm">
            {displayName || "Anonymous"}
          </span>
          {isLocal && <span className="text-xs text-gray-300">(You)</span>}
        </div>

        <div className="flex items-center gap-1">
          {!webcamOn && (
            <div className="bg-red-600 p-1 rounded">
              <VideoOff className="w-3 h-3 text-white" />
            </div>
          )}
          {!micOn && (
            <div className="bg-red-600 p-1 rounded">
              <MicOff className="w-3 h-3 text-white" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Controls() {
  const { leave, toggleMic, toggleWebcam, micOn, webcamOn } = useMeeting();

  return (
    <div className="flex items-center justify-center gap-4 p-4 bg-gray-800">
      <button
        onClick={() => toggleWebcam()}
        className={`p-3 rounded-full transition-colors duration-200 ${
          webcamOn
            ? "bg-gray-700 hover:bg-gray-600 text-white"
            : "bg-red-600 hover:bg-red-700 text-white"
        }`}
        title={webcamOn ? "Turn off camera" : "Turn on camera"}
      >
        {webcamOn ? (
          <Video className="w-6 h-6" />
        ) : (
          <VideoOff className="w-6 h-6" />
        )}
      </button>

      <button
        onClick={() => toggleMic()}
        className={`p-3 rounded-full transition-colors duration-200 ${
          micOn
            ? "bg-gray-700 hover:bg-gray-600 text-white"
            : "bg-red-600 hover:bg-red-700 text-white"
        }`}
        title={micOn ? "Mute" : "Unmute"}
      >
        {micOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
      </button>

      <button
        onClick={() => leave()}
        className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors duration-200"
        title="Leave meeting"
      >
        <PhoneOff className="w-6 h-6" />
      </button>
    </div>
  );
}

function MeetingView({ meetingId, onMeetingLeave }) {
  const [joined, setJoined] = useState(null);

  const { join, participants } = useMeeting({
    onMeetingJoined: () => {
      setJoined("JOINED");
      toast.success("Joined meeting successfully!");
    },
    onMeetingLeft: () => {
      setJoined("LEFT");
      onMeetingLeave();
    },
    onError: (error) => {
      console.error("Meeting error:", error);
      toast.error("Meeting error occurred");
      setJoined("ERROR");
    },
  });

  const joinMeeting = () => {
    setJoined("JOINING");
    join();
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      <div className="bg-gray-800 px-4 py-3 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-medium">Meeting ID: {meetingId}</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">
              {joined === "JOINED" &&
                `${participants.size} participant${
                  participants.size > 1 ? "s" : ""
                }`}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {joined && joined === "JOINED" ? (
          <div className="flex-1 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full">
              {[...participants.keys()].map((participantId) => (
                <ParticipantView
                  participantId={participantId}
                  key={participantId}
                />
              ))}
            </div>

            <Controls />
          </div>
        ) : joined && joined === "JOINING" ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p>Joining meeting...</p>
            </div>
          </div>
        ) : joined === "ERROR" ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <PhoneOff className="w-8 h-8 text-white" />
              </div>
              <p className="text-red-400 mb-4">Failed to join meeting</p>
              <button
                onClick={joinMeeting}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <button
              onClick={joinMeeting}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200"
            >
              Join Meeting
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function VideoSDKCall({ roomCode, participants }) {
  const [meetingId, setMeetingId] = useState(null);
  const { user } = useAuthStore();

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

  const onMeetingLeave = () => {
    setMeetingId(null);
    toast.info("You left the meeting");
  };

  const effectiveMeetingId = meetingId || roomCode;

  if (!isAuthTokenConfigured()) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900">
        <div className="text-center text-white p-8">
          <div className="w-16 h-16 bg-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Phone className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold mb-2">VideoSDK Required</h2>
          <p className="text-gray-400 mb-4">
            Configure VideoSDK to enable professional video calling
          </p>
          <div className="bg-gray-800 p-4 rounded-lg text-sm text-left">
            <p className="text-yellow-400 font-medium mb-2">
              Configuration Required:
            </p>
            <p>
              Edit{" "}
              <code className="bg-gray-700 px-2 py-1 rounded">
                src/services/videoSDKAPI.js
              </code>
            </p>
            <p className="text-gray-300 mt-2">
              Replace "YOUR_VIDEOSDK_AUTH_TOKEN_HERE" with your VideoSDK auth
              token
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
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
        <JoinScreen getMeetingAndToken={getMeetingAndToken} />
      )}
    </div>
  );
}

export default VideoSDKCall;
