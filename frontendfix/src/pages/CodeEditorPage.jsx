import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Users,
  MessageSquare,
  Video,
  Code,
  Settings,
  LogOut,
  Copy,
  ExternalLink,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useRoomStore } from "../store/roomStore";
import socketService from "../socket";
import CodeEditor from "../components/Editor";
import Chat from "../components/Chat";
import VideoCall from "../components/VideoCall";
import VideoSDKCallEnhanced from "../components/VideoSDKCallEnhanced";
import toast from "react-hot-toast";

const CodeEditorPage = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("editor");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [useVideoSDK, setUseVideoSDK] = useState(false);

  const { user } = useAuthStore();
  const {
    currentRoom,
    participants,
    joinRoom,
    leaveRoom,
    getRoomParticipants,
    clearCurrentRoom,
  } = useRoomStore();

  useEffect(() => {
    // Join room when component mounts
    const initializeRoom = async () => {
      const result = await joinRoom(roomCode);
      if (result.success) {
        socketService.joinRoom(roomCode);
        await getRoomParticipants(result.room.id);
      } else {
        toast.error("Failed to join room");
        navigate("/dashboard");
      }
    };

    initializeRoom();

    // Cleanup when component unmounts
    return () => {
      if (currentRoom) {
        leaveRoom(currentRoom.id);
      }
      clearCurrentRoom();
    };
  }, [roomCode]);

  const handleLeaveRoom = async () => {
    if (currentRoom) {
      await leaveRoom(currentRoom.id);
    }
    navigate("/dashboard");
  };

  const handleCopyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    toast.success("Room code copied to clipboard!");
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  if (!currentRoom) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Joining room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/dashboard")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>

              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {currentRoom.name}
                </h1>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Code className="w-4 h-4" />
                    Room: {roomCode}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {participants.length} participants
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      currentRoom.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {currentRoom.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyRoomCode}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                title="Copy room code"
              >
                <Copy className="w-5 h-5 text-gray-600" />
              </button>

              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                title="Toggle sidebar"
              >
                <Settings className="w-5 h-5 text-gray-600" />
              </button>

              <button
                onClick={handleLeaveRoom}
                className="p-2 hover:bg-red-100 rounded-lg transition-colors duration-200 text-red-600"
                title="Leave room"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1 mt-3">
            <button
              onClick={() => handleTabChange("editor")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                activeTab === "editor"
                  ? "bg-primary-100 text-primary-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              Code Editor
            </button>
            <button
              onClick={() => handleTabChange("chat")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                activeTab === "chat"
                  ? "bg-primary-100 text-primary-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Chat
              </div>
            </button>
            <button
              onClick={() => handleTabChange("video")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                activeTab === "video"
                  ? "bg-primary-100 text-primary-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4" />
                Video Call
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Primary Content */}
        <div className="flex-1 flex flex-col">
          {activeTab === "editor" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex-1"
            >
              <CodeEditor roomCode={roomCode} />
            </motion.div>
          )}

          {activeTab === "chat" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex-1"
            >
              <Chat roomCode={roomCode} participants={participants} />
            </motion.div>
          )}

          {activeTab === "video" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex-1"
            >
              {useVideoSDK ? (
                <VideoSDKCallEnhanced
                  roomCode={roomCode}
                  participants={participants}
                />
              ) : (
                <VideoCall roomCode={roomCode} participants={participants} />
              )}
            </motion.div>
          )}
        </div>

        {/* Sidebar */}
        {sidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white border-l border-gray-200 flex flex-col"
          >
            {/* Participants List */}
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">Participants</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {participants.map((participant) => (
                  <div
                    key={participant.user_id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium">
                          {participant.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {participant.name}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {participant.role}
                        {participant.is_teacher && " • Teacher"}
                      </p>
                    </div>
                    {user?.role === "teacher" &&
                      participant.role === "student" && (
                        <button
                          onClick={() => handleTabChange("video")}
                          className="p-1 hover:bg-gray-100 rounded transition-colors duration-200"
                          title="Start video call"
                        >
                          <Video className="w-4 h-4 text-gray-600" />
                        </button>
                      )}
                  </div>
                ))}
              </div>
            </div>

            {/* Room Info */}
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">Room Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Room Code:</span>
                  <span className="font-mono font-medium">{roomCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Created by:</span>
                  <span className="font-medium">
                    {currentRoom.creator_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Max participants:</span>
                  <span className="font-medium">
                    {currentRoom.max_participants}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      currentRoom.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {currentRoom.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="p-4 flex-1">
              <h3 className="font-semibold text-gray-900 mb-3">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${window.location.origin}/join/${roomCode}`
                    );
                    toast.success("Room link copied to clipboard!");
                  }}
                  className="w-full flex items-center gap-2 p-2 text-left hover:bg-gray-50 rounded-lg transition-colors duration-200"
                >
                  <ExternalLink className="w-4 h-4 text-gray-600" />
                  <span className="text-sm">Share room link</span>
                </button>
                <button
                  onClick={handleCopyRoomCode}
                  className="w-full flex items-center gap-2 p-2 text-left hover:bg-gray-50 rounded-lg transition-colors duration-200"
                >
                  <Copy className="w-4 h-4 text-gray-600" />
                  <span className="text-sm">Copy room code</span>
                </button>

                {/* Video SDK Toggle */}
                <div className="pt-2 border-t border-gray-200">
                  <label className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useVideoSDK}
                      onChange={(e) => setUseVideoSDK(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium">
                      Use VideoSDK (Professional)
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CodeEditorPage;
