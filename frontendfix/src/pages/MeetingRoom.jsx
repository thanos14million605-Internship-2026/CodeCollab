import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Users, 
  MessageSquare, 
  Video, 
  Code,
  LogOut,
  Copy,
  Monitor,
  Mic,
  MicOff,
  VideoOff,
  Phone
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useRoomStore } from '../store/roomStore';
import socketService from '../socket';
import VideoCall from '../components/VideoCall';
import Chat from '../components/Chat';
import toast from 'react-hot-toast';

const MeetingRoom = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('video');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const { user } = useAuthStore();
  const { 
    currentRoom, 
    participants, 
    joinRoom, 
    leaveRoom, 
    getRoomParticipants,
    clearCurrentRoom 
  } = useRoomStore();

  useEffect(() => {
    // Join room when component mounts
    const initializeRoom = async () => {
      const result = await joinRoom(roomCode);
      if (result.success) {
        socketService.joinRoom(roomCode);
        await getRoomParticipants(result.room.id);
      } else {
        toast.error('Failed to join meeting room');
        navigate('/dashboard');
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
    navigate('/dashboard');
  };

  const handleCopyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    toast.success('Meeting link copied to clipboard!');
  };

  if (!currentRoom) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Joining meeting room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors duration-200"
              >
                <ArrowLeft className="w-5 h-5 text-gray-300" />
              </button>
              
              <div>
                <h1 className="text-xl font-bold text-white">{currentRoom.name}</h1>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span className="flex items-center gap-1">
                    <Video className="w-4 h-4" />
                    Meeting: {roomCode}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {participants.length} participants
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    currentRoom.is_active 
                      ? 'bg-green-900 text-green-300' 
                      : 'bg-gray-700 text-gray-300'
                  }`}>
                    {currentRoom.is_active ? 'Live' : 'Ended'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyRoomCode}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors duration-200 text-gray-300"
                title="Copy meeting link"
              >
                <Copy className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors duration-200 text-gray-300"
                title="Toggle sidebar"
              >
                <Users className="w-5 h-5" />
              </button>
              
              <button
                onClick={handleLeaveRoom}
                className="p-2 hover:bg-red-900 rounded-lg transition-colors duration-200 text-red-400"
                title="Leave meeting"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1 mt-3">
            <button
              onClick={() => setActiveTab('video')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                activeTab === 'video'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4" />
                Video
              </div>
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                activeTab === 'chat'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Chat
              </div>
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                activeTab === 'code'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4" />
                Code Editor
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Primary Content */}
        <div className="flex-1 flex flex-col">
          {activeTab === 'video' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex-1"
            >
              <VideoCall roomCode={roomCode} participants={participants} />
            </motion.div>
          )}
          
          {activeTab === 'chat' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex-1 bg-white"
            >
              <Chat roomCode={roomCode} participants={participants} />
            </motion.div>
          )}
          
          {activeTab === 'code' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex-1 bg-white"
            >
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Code className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Code Editor</h3>
                  <p className="text-gray-500 mb-6">Collaborative code editing coming soon!</p>
                  <button
                    onClick={() => navigate(`/editor/${roomCode}`)}
                    className="btn-primary"
                  >
                    Open Code Editor
                  </button>
                </div>
              </div>
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
            className="bg-gray-800 border-l border-gray-700 flex flex-col"
          >
            {/* Participants List */}
            <div className="p-4 border-b border-gray-700">
              <h3 className="font-semibold text-white mb-3">Participants ({participants.length})</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {participants.map((participant) => (
                  <div
                    key={participant.user_id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700 transition-colors duration-200"
                  >
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium">
                          {participant.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-gray-800 rounded-full"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {participant.name}
                        {participant.user_id === user?.id && ' (You)'}
                      </p>
                      <p className="text-xs text-gray-400 capitalize">
                        {participant.role}
                        {participant.is_teacher && ' • Host'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${
                        participant.user_id === user?.id ? 'bg-green-500' : 'bg-gray-500'
                      }`}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Meeting Info */}
            <div className="p-4 border-b border-gray-700">
              <h3 className="font-semibold text-white mb-3">Meeting Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Meeting ID:</span>
                  <span className="font-mono font-medium text-white">{roomCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Host:</span>
                  <span className="font-medium text-white">{currentRoom.creator_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    currentRoom.is_active 
                      ? 'bg-green-900 text-green-300' 
                      : 'bg-gray-700 text-gray-300'
                  }`}>
                    {currentRoom.is_active ? 'Live' : 'Ended'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="p-4 flex-1">
              <h3 className="font-semibold text-white mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/meeting/${roomCode}`);
                    toast.success('Meeting link copied to clipboard!');
                  }}
                  className="w-full flex items-center gap-2 p-2 text-left hover:bg-gray-700 rounded-lg transition-colors duration-200 text-gray-300"
                >
                  <Copy className="w-4 h-4" />
                  <span className="text-sm">Copy meeting link</span>
                </button>
                <button
                  onClick={handleCopyRoomCode}
                  className="w-full flex items-center gap-2 p-2 text-left hover:bg-gray-700 rounded-lg transition-colors duration-200 text-gray-300"
                >
                  <Copy className="w-4 h-4" />
                  <span className="text-sm">Copy meeting ID</span>
                </button>
                <button
                  onClick={() => setActiveTab('code')}
                  className="w-full flex items-center gap-2 p-2 text-left hover:bg-gray-700 rounded-lg transition-colors duration-200 text-gray-300"
                >
                  <Code className="w-4 h-4" />
                  <span className="text-sm">Open code editor</span>
                </button>
              </div>
            </div>

            {/* Meeting Controls */}
            <div className="p-4 border-t border-gray-700">
              <div className="grid grid-cols-3 gap-2">
                <button className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors duration-200 text-gray-300">
                  <Mic className="w-5 h-5 mx-auto" />
                </button>
                <button className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors duration-200 text-gray-300">
                  <Video className="w-5 h-5 mx-auto" />
                </button>
                <button className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors duration-200 text-gray-300">
                  <Monitor className="w-5 h-5 mx-auto" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MeetingRoom;
