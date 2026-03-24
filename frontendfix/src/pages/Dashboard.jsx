import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Plus,
  Users,
  Calendar,
  Clock,
  Video,
  Code,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useRoomStore } from "../store/roomStore";
import socketService from "../socket";
import toast from "react-hot-toast";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("my-rooms");
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const navigate = useNavigate();

  const { user } = useAuthStore();
  const {
    rooms,
    currentRoom,
    participants,
    isLoading,
    createRoom,
    joinRoom,
    getUserRooms,
    updateRoomStatus,
  } = useRoomStore();

  const [roomForm, setRoomForm] = useState({
    name: "",
    description: "",
    max_participants: 50,
  });

  useEffect(() => {
    if (user?.role === "teacher") {
      getUserRooms();
    }
  }, [user, getUserRooms]);

  const handleCreateRoom = async (e) => {
    e.preventDefault();

    if (!roomForm.name.trim()) {
      toast.error("Room name is required");
      return;
    }

    const result = await createRoom(roomForm);

    if (result.success) {
      setShowCreateRoom(false);
      setRoomForm({ name: "", description: "", max_participants: 50 });
      getUserRooms();
    }
  };

  const handleJoinRoom = async () => {
    if (!joinCode.trim()) {
      toast.error("Room code is required");
      return;
    }

    const result = await joinRoom(joinCode.trim().toUpperCase());

    if (result.success) {
      setJoinCode("");
      navigate(`/editor/${joinCode.trim().toUpperCase()}`);
    }
  };

  const handleToggleRoomStatus = async (roomId, currentStatus) => {
    const result = await updateRoomStatus(roomId, !currentStatus);
    if (result.success) {
      getUserRooms();
    }
  };

  const handleCopyRoomCode = (roomCode) => {
    navigator.clipboard.writeText(roomCode);
    toast.success("Room code copied to clipboard!");
  };

  const handleEnterRoom = (roomCode) => {
    navigate(`/editor/${roomCode}`);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-gray-600">
            {user?.role === "teacher"
              ? "Manage your coding rooms and monitor student progress"
              : "Join coding rooms and collaborate with your classmates"}
          </p>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid md:grid-cols-3 gap-6 mb-8"
        >
          <motion.div variants={itemVariants}>
            <div className="card p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Plus className="w-6 h-6 text-blue-600" />
                </div>
                {user?.role === "teacher" && (
                  <button
                    onClick={() => setShowCreateRoom(true)}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Create
                  </button>
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {user?.role === "teacher" ? "Create Room" : "Join Room"}
              </h3>
              <p className="text-gray-600 text-sm">
                {user?.role === "teacher"
                  ? "Start a new coding session"
                  : "Enter a room with a code"}
              </p>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="card p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-2xl font-bold text-gray-900">
                  {participants.length || 0}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Active Participants
              </h3>
              <p className="text-gray-600 text-sm">Currently in your room</p>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="card p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
                <span className="text-sm text-gray-500">Today</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Session Time
              </h3>
              <p className="text-gray-600 text-sm">
                Track your learning progress
              </p>
            </div>
          </motion.div>
        </motion.div>

        {/* Join Room Section */}
        {user?.role === "student" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6 mb-8"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Join a Room
            </h2>
            <div className="flex gap-4">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Enter room code"
                className="input-field flex-1"
                maxLength={6}
              />
              <button
                onClick={handleJoinRoom}
                disabled={!joinCode.trim() || isLoading}
                className="btn-primary px-6"
              >
                Join
              </button>
            </div>
          </motion.div>
        )}

        {/* Teacher Rooms List */}
        {user?.role === "teacher" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">My Rooms</h2>
              <button
                onClick={() => navigate("/submitted-work")}
                className="mt-4 btn-primary flex items-center gap-2"
              >
                View Submitted Work
              </button>

              <button
                onClick={() => setShowCreateRoom(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create Room
              </button>
            </div>

            {rooms.length === 0 ? (
              <div className="card p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Code className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No rooms yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Create your first coding room to get started
                </p>
                <button
                  onClick={() => setShowCreateRoom(true)}
                  className="btn-primary"
                >
                  Create Your First Room
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rooms.map((room) => (
                  <motion.div
                    key={room.id}
                    whileHover={{ scale: 1.02 }}
                    className="card p-6 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {room.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {room.description || "No description"}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {room.participant_count || 0}/
                            {room.max_participants}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              room.is_active
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {room.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-gray-100 px-3 py-1 rounded-lg">
                        <span className="text-sm font-mono font-semibold text-gray-700">
                          {room.room_code}
                        </span>
                      </div>
                      <button
                        onClick={() => handleCopyRoomCode(room.room_code)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEnterRoom(room.room_code)}
                        className="flex-1 btn-primary text-sm py-2"
                      >
                        Enter Room
                      </button>
                      <button
                        onClick={() =>
                          handleToggleRoomStatus(room.id, room.is_active)
                        }
                        className={`p-2 rounded-lg text-sm ${
                          room.is_active
                            ? "bg-gray-100 hover:bg-gray-200 text-gray-700"
                            : "bg-green-100 hover:bg-green-200 text-green-700"
                        }`}
                      >
                        {room.is_active ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Create Room Modal */}
        {showCreateRoom && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl p-6 max-w-md w-full"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Create New Room
              </h2>
              <form onSubmit={handleCreateRoom} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Room Name
                  </label>
                  <input
                    type="text"
                    value={roomForm.name}
                    onChange={(e) =>
                      setRoomForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="input-field"
                    placeholder="Enter room name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={roomForm.description}
                    onChange={(e) =>
                      setRoomForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="input-field"
                    placeholder="Describe what this room is for"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Participants
                  </label>
                  <input
                    type="number"
                    value={roomForm.max_participants}
                    onChange={(e) =>
                      setRoomForm((prev) => ({
                        ...prev,
                        max_participants: parseInt(e.target.value),
                      }))
                    }
                    className="input-field"
                    min="2"
                    max="100"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateRoom(false)}
                    className="flex-1 btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 btn-primary"
                  >
                    {isLoading ? "Creating..." : "Create Room"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
