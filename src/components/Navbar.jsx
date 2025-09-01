
"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { useRouter } from "next/navigation";
import {
  MessageCircle,
  Plus,
  LogOut,
  User,
  Bell,
  Settings,
  Search,
  Menu,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

const Navbar = () => {
  const { token, logout, user } = useAuth();
  const { isConnected } = useSocket();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [roomUnread, setRoomUnread] = useState([]);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    if (token) {
      fetchUnreadCounts();
      const interval = setInterval(fetchUnreadCounts, 10000);
      return () => clearInterval(interval);
    }
  }, [token]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchUnreadCounts = async () => {
    try {
      const response = await fetch("/api/unread", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.totalUnread);
        setRoomUnread(data.roomUnread);
      }
    } catch (error) {
      console.error("Error fetching unread counts:", error);
    }
  };

  const createRoom = async (e) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newRoomName.trim() }),
      });

      if (response.ok) {
        const { room } = await response.json();
        toast.success(`Room "${room.name}" created successfully!`);
        setNewRoomName("");
        setShowCreateRoom(false);
        router.push(`/chat/${room.id}`);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to create room");
      }
    } catch (error) {
      toast.error("Failed to create room");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  if (!token) return null;

  return (
    <>
      <nav 
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled 
            ? 'bg-slate-900/95 backdrop-blur-md shadow-xl' 
            : 'bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo + Status */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <MessageCircle className="h-8 w-8 text-cyan-400 animate-pulse" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-ping"></div>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                ChatApp
              </span>
              <div className="hidden sm:flex items-center space-x-2 ml-4">
                <div
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    isConnected 
                      ? "bg-green-400 shadow-lg shadow-green-400/50 animate-pulse" 
                      : "bg-red-400 shadow-lg shadow-red-400/50"
                  }`}
                ></div>
                <span className="text-sm text-slate-300 font-medium">
                  {isConnected ? "Connected" : "Disconnected"}
                </span>
              </div>
            </div>

            {/* Desktop Center Section */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-hover:text-cyan-400 transition-colors duration-200" />
                <input
                  type="text"
                  placeholder="Search rooms..."
                  className="pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-xl text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 focus:bg-slate-700 transition-all duration-200 w-64"
                />
              </div>
              <button
                onClick={() => setShowCreateRoom(true)}
                className="group cursor-pointer flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-2 rounded-xl hover:from-cyan-400 hover:to-blue-400 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-cyan-500/25"
              >
                <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-200" />
                <span className="font-medium">New Room</span>
              </button>
            </div>

            {/* Desktop Right Section */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="relative group">
                <Bell className="h-6 w-6 text-slate-300 hover:text-cyan-400 cursor-pointer transition-all duration-200 group-hover:animate-bounce" />
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium animate-pulse shadow-lg">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-3 bg-slate-700/50 rounded-xl px-3 py-2 hover:bg-slate-700 transition-all duration-200">
                <User className="h-5 w-5 text-cyan-400" />
                <span className="text-slate-200 font-medium text-sm">
                  {user?.user.name || user?.user.email}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="group flex cursor-pointer items-center space-x-2 text-slate-300 hover:text-red-400 bg-slate-700/30 hover:bg-red-500/20 px-3 py-2 rounded-xl transition-all duration-200"
              >
                <LogOut className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
                <span className="font-medium">Logout</span>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button 
                onClick={toggleMobileMenu}
                className="relative p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-all duration-200"
              >
                <div className="relative w-6 h-6">
                  <span className={`absolute top-1 left-0 w-6 h-0.5 bg-slate-300 transition-all duration-300 ${mobileMenuOpen ? 'rotate-45 top-3' : ''}`}></span>
                  <span className={`absolute top-3 left-0 w-6 h-0.5 bg-slate-300 transition-all duration-300 ${mobileMenuOpen ? 'opacity-0' : ''}`}></span>
                  <span className={`absolute top-5 left-0 w-6 h-0.5 bg-slate-300 transition-all duration-300 ${mobileMenuOpen ? '-rotate-45 top-3' : ''}`}></span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        <div 
          className={`md:hidden bg-slate-800/95 backdrop-blur-md border-t border-slate-700 transition-all duration-300 ease-in-out overflow-hidden ${
            mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="px-4 py-4 space-y-4">
            {/* Search */}
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-hover:text-cyan-400 transition-colors duration-200" />
              <input
                type="text"
                placeholder="Search rooms..."
                className="pl-10 pr-4 py-3 w-full bg-slate-700/50 border border-slate-600 rounded-xl text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 focus:bg-slate-700 transition-all duration-200"
              />
            </div>

            {/* New Room */}
            <button
              onClick={() => {
                setShowCreateRoom(true);
                setMobileMenuOpen(false);
              }}
              className="flex items-center justify-center space-x-3 w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-3 rounded-xl hover:from-cyan-400 hover:to-blue-400 transition-all duration-200 font-medium shadow-lg"
            >
              <Plus className="h-5 w-5" />
              <span>New Room</span>
            </button>

            {/* Notifications */}
            <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl hover:bg-slate-700/50 transition-all duration-200">
              <span className="flex items-center space-x-3 text-slate-200">
                <Bell className="h-5 w-5 text-cyan-400" />
                <span className="font-medium">Notifications</span>
              </span>
              {unreadCount > 0 && (
                <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-medium animate-pulse">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </div>

            {/* Profile */}
            <div className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-xl">
              <User className="h-5 w-5 text-cyan-400" />
              <span className="text-slate-200 font-medium">
                {user?.user.name || user?.user.email}
              </span>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center cursor-pointer space-x-3 text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 p-3 rounded-xl w-full transition-all duration-200 font-medium"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Spacer to prevent content from hiding behind fixed navbar */}
      <div className="h-16"></div>

      {/* Create Room Modal */}
      {showCreateRoom && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-96 mx-4 animate-in zoom-in-95 duration-200 shadow-2xl">
            <h3 className="text-xl font-bold mb-6 text-slate-100">Create New Room</h3>
            <form onSubmit={createRoom} className="space-y-4">
              <input
                type="text"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="Enter room name..."
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 focus:bg-slate-700 transition-all duration-200"
                autoFocus
              />
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={isLoading || !newRoomName.trim()}
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3 px-4 rounded-xl hover:from-cyan-400 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Creating...</span>
                    </span>
                  ) : (
                    "Create Room"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateRoom(false);
                    setNewRoomName("");
                  }}
                  className="flex-1 bg-slate-600 text-slate-200 py-3 px-4 rounded-xl hover:bg-slate-500 transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;