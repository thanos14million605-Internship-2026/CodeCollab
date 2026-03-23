import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Monitor, 
  MonitorOff,
  Phone,
  PhoneOff,
  Users,
  Share,
  Volume2,
  Settings
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import socketService from '../socket';
import videoService from '../services/videoService';
import toast from 'react-hot-toast';

const VideoCall = ({ roomCode, participants }) => {
  const [remoteStreams, setRemoteStreams] = useState(new Map());
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [connectionStates, setConnectionStates] = useState(new Map());
  
  const localVideoRef = useRef(null);
  const remoteVideoRefs = useRef(new Map());
  const { user } = useAuthStore();

  // Initialize video service
  useEffect(() => {
    const initializeVideo = async () => {
      try {
        const stream = await videoService.initialize();
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        
        // Set initial states
        setIsVideoEnabled(videoService.isVideoEnabled());
        setIsAudioEnabled(videoService.isAudioEnabled());
      } catch (error) {
        console.error('Failed to initialize video:', error);
        toast.error('Failed to access camera/microphone');
      }
    };

    initializeVideo();

    // Setup video service callbacks
    videoService.on('onRemoteStream', (userId, stream) => {
      setRemoteStreams(prev => new Map(prev.set(userId, stream)));
      
      // Set remote video source
      const videoRef = remoteVideoRefs.current.get(userId);
      if (videoRef) {
        videoRef.srcObject = stream;
      }
    });

    videoService.on('onConnectionStateChange', (userId, state) => {
      setConnectionStates(prev => new Map(prev.set(userId, state)));
      
      if (state === 'connected') {
        toast.success('Call connected successfully!');
      } else if (state === 'failed' || state === 'disconnected') {
        toast.error('Call connection failed');
        setIsInCall(false);
        setSelectedUser(null);
      }
    });

    videoService.on('onIceCandidate', (userId, candidate) => {
      socketService.sendICECandidate(userId, candidate);
    });

    return () => {
      videoService.cleanup();
    };
  }, []);

  // Handle WebRTC events
  useEffect(() => {
    const handleOffer = async (event) => {
      const { offer, fromUserId, fromUserName } = event.detail;
      
      console.log('Received WebRTC offer from:', fromUserId, fromUserName);
      
      // Don't handle offer if already in a call with this user
      if (selectedUser?.id === fromUserId) {
        console.log('Already in call with this user, ignoring offer');
        return;
      }
      
      try {
        const answer = await videoService.handleOffer(fromUserId, offer);
        socketService.sendWebRTCAnswer(fromUserId, answer);
        
        setSelectedUser({ id: fromUserId, name: fromUserName });
        setIsInCall(true);
        
        toast.success(`Incoming call from ${fromUserName}`, {
          duration: 5000,
          action: {
            label: 'Answer',
            onClick: () => {
              console.log('Call answered');
            }
          }
        });
      } catch (error) {
        console.error('Error handling offer:', error);
        toast.error('Failed to handle incoming call');
      }
    };

    const handleAnswer = async (event) => {
      const { answer, fromUserId } = event.detail;
      
      console.log('Received WebRTC answer from:', fromUserId);
      
      try {
        await videoService.handleAnswer(fromUserId, answer);
        console.log('WebRTC connection established successfully');
      } catch (error) {
        console.error('Error handling answer:', error);
        toast.error('Failed to establish connection');
      }
    };

    const handleICECandidate = async (event) => {
      const { candidate, fromUserId } = event.detail;
      
      try {
        await videoService.handleIceCandidate(fromUserId, candidate);
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    };

    // Add event listeners
    window.addEventListener('webrtc-offer', handleOffer);
    window.addEventListener('webrtc-answer', handleAnswer);
    window.addEventListener('ice-candidate', handleICECandidate);

    // Cleanup function
    return () => {
      window.removeEventListener('webrtc-offer', handleOffer);
      window.removeEventListener('webrtc-answer', handleAnswer);
      window.removeEventListener('ice-candidate', handleICECandidate);
    };
  }, [selectedUser]);

  // Start call with user
  const startCall = async (targetUser) => {
    console.log('Starting call with:', targetUser);
    
    try {
      setSelectedUser(targetUser);
      setIsInCall(true);

      const offer = await videoService.createOffer(targetUser.id);
      socketService.sendWebRTCOffer(targetUser.id, offer);
      console.log('WebRTC offer sent to:', targetUser.id);
      
      toast.success(`Calling ${targetUser.name}...`);
    } catch (error) {
      console.error('Error starting call:', error);
      toast.error('Failed to start call');
      setIsInCall(false);
      setSelectedUser(null);
    }
  };

  // Toggle video
  const toggleVideo = () => {
    const enabled = videoService.toggleVideo();
    setIsVideoEnabled(enabled);
  };

  // Toggle audio
  const toggleAudio = () => {
    const enabled = videoService.toggleAudio();
    setIsAudioEnabled(enabled);
  };

  // Toggle screen sharing
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      await videoService.stopScreenShare();
      setIsScreenSharing(false);
      toast.success('Screen sharing stopped');
    } else {
      try {
        await videoService.startScreenShare();
        setIsScreenSharing(true);
        toast.success('Screen sharing started');
      } catch (error) {
        console.error('Error starting screen share:', error);
        toast.error('Failed to start screen sharing');
      }
    }
  };

  // End call
  const endCall = () => {
    if (selectedUser) {
      videoService.endCall(selectedUser.id);
      setRemoteStreams(prev => {
        const newMap = new Map(prev);
        newMap.delete(selectedUser.id);
        return newMap;
      });
    }
    setSelectedUser(null);
    setIsInCall(false);
    
    toast.success('Call ended');
  };

  // Setup remote video refs
  const setupRemoteVideoRef = (userId) => (element) => {
    if (element) {
      remoteVideoRefs.current.set(userId, element);
      const stream = remoteStreams.get(userId);
      if (stream) {
        element.srcObject = stream;
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Video Area */}
      <div className="flex-1 relative">
        {isInCall ? (
          <div className="grid grid-cols-2 gap-4 p-4 h-full">
            {/* Local Video */}
            <div className="video-container relative">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="video-element"
              />
              <div className="video-overlay absolute bottom-4 left-4 text-white">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">You</span>
                  {!isVideoEnabled && <VideoOff className="w-4 h-4" />}
                  {!isAudioEnabled && <MicOff className="w-4 h-4" />}
                </div>
              </div>
            </div>

            {/* Remote Video */}
            {Array.from(remoteStreams.entries()).map(([userId, stream]) => (
              <div key={userId} className="video-container relative">
                <video
                  ref={setupRemoteVideoRef(userId)}
                  autoPlay
                  playsInline
                  className="video-element"
                />
                <div className="video-overlay absolute bottom-4 left-4 text-white">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">{selectedUser?.name || 'Remote User'}</span>
                    <span className="text-xs text-gray-300">
                      {connectionStates.get(userId) || 'connecting...'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-white">
              <Video className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">Start a Video Call</h3>
              <p className="text-gray-400 mb-6">Select a participant to start calling</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-4">
        {isInCall ? (
          // In-call controls
          <div className="flex items-center justify-center gap-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleVideo}
              className={`p-3 rounded-full transition-colors duration-200 ${
                isVideoEnabled 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
              title={isVideoEnabled ? 'Turn off video' : 'Turn on video'}
            >
              {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleAudio}
              className={`p-3 rounded-full transition-colors duration-200 ${
                isAudioEnabled 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
              title={isAudioEnabled ? 'Mute' : 'Unmute'}
            >
              {isAudioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleScreenShare}
              className={`p-3 rounded-full transition-colors duration-200 ${
                isScreenSharing 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
              title={isScreenSharing ? 'Stop screen share' : 'Share screen'}
            >
              {isScreenSharing ? <MonitorOff className="w-6 h-6" /> : <Monitor className="w-6 h-6" />}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={endCall}
              className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors duration-200"
              title="End call"
            >
              <PhoneOff className="w-6 h-6" />
            </motion.button>
          </div>
        ) : (
          // Pre-call controls - participant list
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-gray-400" />
              <span className="text-white font-medium">Participants</span>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {participants
                .filter(p => p.user_id !== user?.id)
                .map((participant) => (
                  <div
                    key={participant.user_id}
                    className="flex items-center justify-between p-2 bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {participant.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-white text-sm">{participant.name}</span>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => startCall(participant)}
                      className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200"
                      title={`Call ${participant.name}`}
                    >
                      <Phone className="w-4 h-4" />
                    </motion.button>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoCall;
