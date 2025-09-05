"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  MessageCircle,
  Hash,
  Trash2,
  Menu,
  X,
  Clock,
  Users,
  MessageSquare,
} from "lucide-react";
import toast from "react-hot-toast";

const RoomsList = () => {
  const { token } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoveredRoom, setHoveredRoom] = useState(null);

  useEffect(() => {
    if (token) {
      fetchRooms();
      const interval = setInterval(fetchRooms, 10000);
      return () => clearInterval(interval);
    }
  }, [token]);

  const fetchRooms = async () => {
    try {
      const response = await fetch("/api/rooms", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRooms(data.rooms);
      } else {
        toast.error("Failed to load rooms");
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRooms = rooms.filter((room) =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatLastMessageTime = (timestamp) => {
    if (!timestamp) return "No messages";
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInHours = (now - messageTime) / (1000 * 60 * 60);
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    return messageTime.toLocaleDateString();
  };

  const handleRoomClick = (roomId) => {
    router.push(`/chat/${roomId}`);
    setMobileOpen(false);
  };

  const handleDeleteRoom = async (roomId, roomName) => {
    try {
      const response = await fetch(`/api/rooms?roomId=${roomId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success(`Room "${roomName}" deleted successfully`);
        setRooms(rooms.filter((room) => room.id !== roomId));
        setShowDeleteConfirm(null);
        if (params.roomId === roomId.toString()) {
          router.push("/chat");
        }
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete room");
      }
    } catch (error) {
      console.error("Error deleting room:", error);
      toast.error("Failed to delete room");
    }
  };

  const isDefaultRoom = (roomId) => [1, 2, 3].includes(roomId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-800">
        <div className="relative">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-600 border-t-cyan-400"></div>
          <div className="absolute inset-0 animate-ping rounded-full h-8 w-8 border border-cyan-400/30"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile toggle button */}
      <div className="md:hidden p-4 border-b border-slate-700 flex flex-col justify-between items-center bg-slate-800">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-all duration-200"
        >
          <div className="relative w-5 h-5">
            <span
              className={`absolute top-1 left-0 w-5 h-0.5 bg-slate-300 transition-all duration-300 ${
                mobileOpen ? "rotate-45 top-2" : ""
              }`}
            ></span>
            <span
              className={`absolute top-2 left-0 w-5 h-0.5 bg-slate-300 transition-all duration-300 ${
                mobileOpen ? "opacity-0" : ""
              }`}
            ></span>
            <span
              className={`absolute top-3 left-0 w-5 h-0.5 bg-slate-300 transition-all duration-300 ${
                mobileOpen ? "-rotate-45 top-2" : ""
              }`}
            ></span>
          </div>
        </button>
      
      </div>

      {/* Backdrop for mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed md:static top-0 left-0 h-full md:h-auto z-40 transform ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition-transform duration-300 ease-in-out bg-slate-800 border-r border-slate-700 w-80 flex flex-col shadow-2xl md:shadow-none`}
      >
        {/* Header - Desktop Only */}
        <div className="p-6 border-b border-slate-700 hidden md:block">
          <div className="flex items-center space-x-3 mb-3">
            <div className="relative">
              <MessageSquare className="h-8 w-8 text-cyan-400" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
            </div>
            <h2 className="text-xl font-bold text-slate-100">Chat Rooms</h2>
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-slate-400" />
              <span className="text-slate-300">
                {rooms.length} room{rooms.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-slate-400">Active</span>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-700">
          <div className="relative group">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-hover:text-cyan-400 transition-colors duration-200" />
            <input
              type="text"
              placeholder="Search rooms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 focus:bg-slate-700 transition-all duration-200"
            />
          </div>
        </div>

        {/* Rooms list */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
          {filteredRooms.length === 0 ? (
            <div className="p-6 text-center">
              <MessageCircle className="h-12 w-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">
                {searchTerm ? "No rooms found" : "No rooms yet"}
              </p>
              <p className="text-slate-500 text-sm mt-1">
                {searchTerm
                  ? "Try a different search term"
                  : "Create your first room to get started"}
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {filteredRooms.map((room, index) => (
                <div
                  key={room.id}
                  className={`group relative overflow-hidden rounded-xl transition-all duration-300 ${
                    params.roomId === room.id.toString()
                      ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-l-4 border-cyan-400 shadow-lg shadow-cyan-500/10"
                      : "hover:bg-slate-700/50"
                  }`}
                  style={{
                    animationDelay: `${index * 50}ms`,
                  }}
                  onMouseEnter={() => setHoveredRoom(room.id)}
                  onMouseLeave={() => setHoveredRoom(null)}
                >
                  <div className="flex items-center justify-between p-4">
                    <div
                      onClick={() => handleRoomClick(room.id)}
                      className="flex items-center space-x-3 flex-1 min-w-0 cursor-pointer"
                    >
                      <div className="relative flex-shrink-0">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                            params.roomId === room.id.toString()
                              ? "bg-cyan-500 shadow-lg shadow-cyan-500/30"
                              : "bg-slate-700 group-hover:bg-slate-600"
                          }`}
                        >
                          <MessageCircle
                            className={`h-5 w-5 transition-colors duration-200 ${
                              params.roomId === room.id.toString()
                                ? "text-white"
                                : "text-slate-300 group-hover:text-cyan-400"
                            }`}
                          />
                        </div>
                        {room.unread_count > 0 && (
                          <div className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold animate-pulse shadow-lg">
                            {room.unread_count > 99 ? "99+" : room.unread_count}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3
                            className={`text-sm font-semibold truncate transition-colors duration-200 ${
                              params.roomId === room.id.toString()
                                ? "text-cyan-100"
                                : "text-slate-200 group-hover:text-white"
                            }`}
                          >
                            {room.name}
                          </h3>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 text-xs">
                            <div className="flex items-center space-x-1">
                              <MessageSquare className="h-3 w-3 text-slate-400" />
                              <span className="text-slate-400">
                                {room.message_count} msg
                                {room.message_count !== 1 ? "s" : ""}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3 text-slate-500" />
                            <span className="text-xs text-slate-400 font-medium">
                              {formatLastMessageTime(room.last_message_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {!isDefaultRoom(room.id) && (
                      <div
                        className={`flex-shrink-0 ml-3 transition-all duration-200 ${
                          hoveredRoom === room.id
                            ? "opacity-100 translate-x-0"
                            : "opacity-0 translate-x-2"
                        }`}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDeleteConfirm(room.id);
                          }}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200 group/delete"
                          title="Delete room"
                        >
                          <Trash2 className="h-4 w-4 group-hover/delete:animate-bounce" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Hover gradient effect */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none ${
                      params.roomId === room.id.toString() ? "hidden" : ""
                    }`}
                  ></div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Stats */}
        <div className="p-4 border-t border-slate-700 bg-slate-800/50">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Online</span>
            </div>
            <span>{filteredRooms.length} visible</span>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4 animate-in fade-in duration-200">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full animate-in zoom-in-95 duration-200 shadow-2xl">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-100">Delete Room</h3>
            </div>
            <p className="text-slate-300 mb-6 leading-relaxed">
              Are you sure you want to delete this room? This action cannot be
              undone and will remove all messages in this room permanently.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-3 text-slate-300 hover:text-slate-100 bg-slate-700 hover:bg-slate-600 rounded-xl transition-all duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const room = rooms.find((r) => r.id === showDeleteConfirm);
                  if (room) {
                    handleDeleteRoom(room.id, room.name);
                  }
                }}
                className="flex-1 px-4 py-3 cursor-pointer bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-400 hover:to-red-500 transition-all duration-200 font-medium shadow-lg hover:shadow-red-500/25"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RoomsList;
