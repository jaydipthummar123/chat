"use client";
import React, { useState, useEffect, useRef } from "react";
import { useSocket } from "@/context/SocketContext";
import { useAuth } from "@/context/AuthContext";
import {
  Send,
  Paperclip,
  Smile,
  MoreVertical,
  MessageSquare,
  Users,
  User,
  Clock,
  Check,
  CheckCheck,
  Plus,
  Video,
} from "lucide-react";
import toast from "react-hot-toast";
import AddUsersToRoom from "./AddUsersToRoom";

import { useRouter } from "next/navigation";
import EmojiPicker from "emoji-picker-react";
import Link from "next/link";

const ChatRoomClient = ({ roomId, roomName, user }) => {
  const { socket, joinRoom, leaveRoom, sendMessage, markAsRead } = useSocket();
  const { token } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);
  const [users, setUsers] = useState([]);
  const [incomingCall, setIncomingCall] = useState(null);
  const handleEmojiClick = (emojiData) => {
    const emoji = emojiData.emoji;
    const input = inputRef.current;
    if (input) {
      const start = input.selectionStart;
      const end = input.selectionEnd;
      const updatedText =
        newMessage.substring(0, start) + emoji + newMessage.substring(end);
      setNewMessage(updatedText);
    } else {
      setNewMessage((prev) => prev + emoji);
    }
    setShowEmojiPicker(false);
  };

  useEffect(() => {
    if (roomId) {
      fetchUsers();
      fetchMessages();
      joinRoom(roomId);
      markAsRead(roomId);
    }

    return () => {
      if (roomId) {
        leaveRoom(roomId);
      }
    };
  }, [roomId]);

  useEffect(() => {
    if (socket) {
      socket.on("new_message", handleNewMessage);
      socket.on("user_typing", handleUserTyping);
      socket.on("user_stopped_typing", handleUserStoppedTyping);
      socket.on("error", handleSocketError);
      const onCallOffer = ({ offer, video, caller }) => {
        setIncomingCall({ offer, video, caller });
      };
      socket.on("call-offer", onCallOffer);

      return () => {
        socket.off("new_message", handleNewMessage);
        socket.off("user_typing", handleUserTyping);
        socket.off("user_stopped_typing", handleUserStoppedTyping);
        socket.off("error", handleSocketError);
        socket.off("call-offer", onCallOffer);
      };
    }
  }, [socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/messages?roomId=${roomId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
      } else {
        toast.error("Failed to load messages");
      }
    } catch (error) {
      toast.error("Failed to load messages");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleNewMessage = (message) => {
    setMessages((prev) => [...prev, message]);
    if (message.room_id === parseInt(roomId)) {
      markAsRead(roomId);
    }
  };

  const handleUserTyping = ({ userId, userName }) => {
    setTypingUsers((prev) => {
      if (!prev.some((user) => user.id === userId)) {
        return [...prev, { id: userId, name: userName }];
      }
      return prev;
    });
  };

  const handleUserStoppedTyping = ({ userId }) => {
    setTypingUsers((prev) => prev.filter((user) => user.id !== userId));
  };

  const handleSocketError = (error) => {
    toast.error(error);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      await sendMessage(roomId, newMessage.trim());
      setNewMessage("");
      inputRef.current?.focus();
    } catch (error) {
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (socket) {
      socket.emit("typing", { roomId });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("stop_typing", { roomId });
      }, 1000);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isOwnMessage = (message) => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return message.user_id === payload.id;
      }
    } catch (error) {
      console.error("Error parsing token:", error);
    }
    return false;
  };

  const getInitials = (name) => {
    return (
      name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase() || "?"
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <div className="text-center">
          <div className="relative mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-slate-600 border-t-cyan-400 mx-auto"></div>
            <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 border border-cyan-400/30 mx-auto"></div>
          </div>
          <p className="text-slate-400 font-medium">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 ">
      {/* Chat Header */}
      <div className="bg-slate-800/80 backdrop-blur-md border-b border-slate-700 px-6 py-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100">{roomName}</h2>
              <div className="flex items-center space-x-3 text-sm">
                <div className="flex items-center space-x-1">
                  <MessageSquare className="h-3 w-3 text-slate-400" />
                  <span className="text-slate-400">
                    {messages.length} messages
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-slate-400">Active</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {/* Other button
            s */}

            {!["2", "3"].includes(roomId) ? (
              <AddUsersToRoom roomId={roomId} currentUserId={user.user.id} />
            ) : null}

            <Link href={`/video-call/${roomId}`}>
              <button
                className="p-2 cursor-pointer text-slate-400 hover:text-blue-400 hover:bg-slate-700/50 rounded-lg transition-all duration-200"
                title="Start Video Call"
              >
                <Video className="h-5 w-5" />
              </button>
            </Link>

            <button className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-700/50 rounded-lg transition-all duration-200">
              <MoreVertical className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-slate-700 rounded-2xl flex items-center justify-center mb-4">
              <MessageSquare className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-300 mb-2">
              No messages yet
            </h3>
            <p className="text-slate-400 max-w-sm">
              Start the conversation by sending the first message!
            </p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={message.id}
              className={`flex ${
                isOwnMessage(message) ? "justify-end" : "justify-start"
              } animate-in slide-in-from-bottom-2 duration-300`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-end space-x-2 max-w-xs lg:max-w-md">
                {!isOwnMessage(message) && (
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg">
                    {getInitials(message.sender_name)}
                  </div>
                )}

                <div
                  className={`relative px-4 py-3 rounded-2xl shadow-lg transition-all duration-200 hover:scale-105 ${
                    isOwnMessage(message)
                      ? "bg-gradient-to-br from-cyan-500 to-blue-500 text-white rounded-br-md"
                      : "bg-slate-700/80 backdrop-blur-sm text-slate-100 rounded-bl-md border border-slate-600/50"
                  }`}
                >
                  {!isOwnMessage(message) && (
                    <div className="text-xs font-semibold text-cyan-400 mb-2">
                      {message.sender_name}
                    </div>
                  )}

                  <div className="text-sm leading-relaxed break-words">
                    {message.content}
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <div
                      className={`text-xs flex items-center space-x-1 ${
                        isOwnMessage(message)
                          ? "text-cyan-100"
                          : "text-slate-400"
                      }`}
                    >
                      <Clock className="h-3 w-3" />
                      <span>{formatTime(message.created_at)}</span>
                    </div>

                    {isOwnMessage(message) && (
                      <div className="text-cyan-100">
                        <CheckCheck className="h-3 w-3" />
                      </div>
                    )}
                  </div>

                  {/* Message tail */}
                  <div
                    className={`absolute bottom-0 w-3 h-3 ${
                      isOwnMessage(message)
                        ? "right-0 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-bl-full translate-x-1 translate-y-1"
                        : "left-0 bg-slate-700/80 rounded-br-full -translate-x-1 translate-y-1"
                    }`}
                  ></div>
                </div>

                {isOwnMessage(message) && (
                  <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg">
                    {getInitials(message.sender_name)}
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="flex justify-start animate-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-end space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {getInitials(typingUsers[0].name)}
              </div>
              <div className="bg-slate-700/80 backdrop-blur-sm text-slate-300 px-4 py-3 rounded-2xl rounded-bl-md border border-slate-600/50 shadow-lg">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-cyan-400 font-medium">
                    {typingUsers[0].name} is typing
                  </span>
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-slate-800/80 backdrop-blur-md border-t border-slate-700 p-4 shadow-2xl">
        <form
          onSubmit={handleSendMessage}
          className="flex items-center space-x-3"
        >
          <button
            type="button"
            className="group  cursor-pointer p-3 text-slate-400 hover:text-cyan-400 hover:bg-slate-700/50 rounded-xl transition-all duration-200"
          >
            <Paperclip className="h-5 w-5 group-hover:rotate-12 transition-transform duration-200" />
          </button>

          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={handleTyping}
              placeholder="Type a message..."
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 focus:bg-slate-700 transition-all duration-200 pr-12"
              disabled={isSending}
            />
            <button
              type="button"
              onClick={() => setShowEmojiPicker((prev) => !prev)}
              className="absolute right-3 top-1/2 cursor-pointer -translate-y-1/2 p-1 text-slate-400 hover:text-yellow-400 transition-colors duration-200"
            >
              <Smile className="h-5 w-5" />
            </button>

            {/* Emoji Picker Popup */}
            {showEmojiPicker && (
              <div className="absolute bottom-12 right-0 z-50">
                <EmojiPicker onEmojiClick={handleEmojiClick} theme="dark" />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="group relative p-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl hover:from-cyan-400 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-cyan-500/25 disabled:hover:shadow-none transform hover:scale-105 disabled:hover:scale-100 cursor-pointer"
          >
            {isSending ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <Send className="h-5 w-5  group-hover:translate-x-0.5 transition-transform duration-200" />
            )}
          </button>
        </form>
      </div>
      {incomingCall && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm text-center">
            <h3 className="text-lg font-semibold mb-2">Incoming {incomingCall.video ? 'Video' : 'Voice'} Call</h3>
            <p className="text-gray-500 mb-4">From: {incomingCall.caller}</p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (socket) socket.emit('call-reject', { roomId, caller: incomingCall.caller });
                  setIncomingCall(null);
                }}
                className="flex-1 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white"
              >
                Decline
              </button>
              <button
                onClick={() => {
                  try {
                    sessionStorage.setItem('incomingOffer', JSON.stringify({ offer: incomingCall.offer, video: incomingCall.video, caller: incomingCall.caller }));
                  } catch {}
                  setIncomingCall(null);
                  router.push(`/video-call/${roomId}`);
                }}
                className="flex-1 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatRoomClient;
