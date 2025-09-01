"use client";
import React from "react";
import { useAuth } from "@/context/AuthContext";
import RoomsList from "@/components/RoomsList";
import Navbar from "@/components/Navbar";
import { MessageCircle, Plus } from "lucide-react";
import { Toaster } from "react-hot-toast";
import BacktoLogin from "@/components/Ui/BacktoLogin";

export default function ChatPage() {
  const { token } = useAuth();

  if (!token) {
    return <BacktoLogin/>
  }

  return (
    <div className="h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex overflow-hidden">
        <RoomsList />
        <div className="flex-1 flex items-center justify-center bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800">
          <div className="text-center">
            <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">
              Welcome to ChatApp
            </h2>
            <p className="text-gray-600 mb-6">
              Select a room from the sidebar or create a new one to start
              chatting
            </p>
            <div className="flex items-center justify-center space-x-2 text-gray-500">
              <Plus className="h-4 w-4" />
              <span className="text-sm">
                Create your first room to get started
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
