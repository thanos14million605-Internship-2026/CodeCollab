import React from 'react';
import { useMeeting } from '@videosdk.live/react-sdk';
import { Phone, Mic, Video, Users } from 'lucide-react';

// Simple test component to verify VideoSDK is working
const VideoSDKTest = () => {
  const { 
    join, 
    leave, 
    toggleMic, 
    toggleWebcam, 
    micOn, 
    webcamOn, 
    participants 
  } = useMeeting({
    onMeetingJoined: () => {
      console.log('VideoSDK: Meeting joined successfully');
    },
    onMeetingLeft: () => {
      console.log('VideoSDK: Meeting left');
    },
    onError: (error) => {
      console.error('VideoSDK Error:', error);
    }
  });

  return (
    <div className="p-6 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Users className="w-5 h-5" />
        VideoSDK Status Test
      </h3>
      
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="font-medium">Participants:</span>
          <span className="text-blue-600">{participants?.size || 0}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="font-medium">Camera:</span>
          <span className={webcamOn ? "text-green-600" : "text-red-600"}>
            {webcamOn ? "On" : "Off"}
          </span>
          <Video className="w-4 h-4" />
        </div>
        
        <div className="flex items-center gap-2">
          <span className="font-medium">Microphone:</span>
          <span className={micOn ? "text-green-600" : "text-red-600"}>
            {micOn ? "On" : "Off"}
          </span>
          <Mic className="w-4 h-4" />
        </div>
        
        <div className="flex gap-2 mt-4">
          <button
            onClick={join}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Join Meeting
          </button>
          
          <button
            onClick={toggleWebcam}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Toggle Camera
          </button>
          
          <button
            onClick={toggleMic}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Toggle Mic
          </button>
          
          <button
            onClick={leave}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Leave
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoSDKTest;
