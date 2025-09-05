"use client";
import React, { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import VideoCall from "@/components/VideoCall";
import ProtectedRoute from "@/components/ProtectedRoute";
import BacktoLogin from "@/components/Ui/BacktoLogin";

const VideoCallPage = () => {
  const  params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [isCallActive, setIsCallActive] = useState(false);
  const search = useSearchParams();
  const roomId = params.roomId;
  console.log("Room ID from params: thiscomponent mount",  roomId);

  const handleEndCall = () => {
    setIsCallActive(false);
    
  };

  if (!user) {
    return <BacktoLogin/>
  }

  return (
    <ProtectedRoute>
      <div className="h-screen w-full">
        <VideoCall 
          roomId={roomId} 
          onEndCall={handleEndCall}
        />
      </div>
    </ProtectedRoute>
  );
};

export default VideoCallPage;
