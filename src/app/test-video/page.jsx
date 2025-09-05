"use client";
import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import VideoCall from "@/components/VideoCall";
import ProtectedRoute from "@/components/ProtectedRoute";

const TestVideoPage = () => {
  const { user } = useAuth();
  const [roomId, setRoomId] = useState("test-room");
  const [showVideoCall, setShowVideoCall] = useState(false);

  const handleStartCall = () => {
    setShowVideoCall(true);
  };

  const handleEndCall = () => {
    setShowVideoCall(false);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Please login first</h2>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (showVideoCall) {
    return (
      <div className="h-screen w-full">
        <VideoCall 
          roomId={roomId} 
          onEndCall={handleEndCall}
        />
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-6">Video Call Test</h1>
            
            <div className="mb-6">
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Room ID
              </label>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter room ID"
              />
            </div>

            <div className="space-y-4">
              <button
                onClick={handleStartCall}
                className="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors"
              >
                Start Video Call
              </button>
              
              <p className="text-gray-300 text-sm">
                Open this page in another browser/tab with a different user to test the call
              </p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default TestVideoPage;
