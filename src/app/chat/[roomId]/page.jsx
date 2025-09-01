"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import ChatRoomClient from "@/components/ChatRoomClient";
import RoomsList from "@/components/RoomsList";
import Navbar from "@/components/Navbar";
import { Toaster } from "react-hot-toast";
import BacktoLogin from "@/components/Ui/BacktoLogin";

export default function ChatRoom({ params }) {
  const resolvedParams = React.use(params);
  const { roomId } = resolvedParams;
  const { token ,user} = useAuth();
  const [roomName, setRoomName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token && roomId) {
      fetchRoomDetails();
    }
  }, [token, roomId]);

  const fetchRoomDetails = async () => {
    try {
      const response = await fetch("/api/rooms", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const room = data.rooms.find((r) => r.id === parseInt(roomId));
        if (room) {
          setRoomName(room.name);
        }
      }
    } catch (error) {
      console.error("Error fetching room details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return <BacktoLogin/>
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex overflow-hidden">
        <RoomsList />
        <div className="flex-1 flex flex-col">
          <ChatRoomClient roomId={roomId} roomName={roomName} user={user} />
        </div>
      </div>
    </div>
  );
}
