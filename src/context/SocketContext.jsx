
"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    if (!token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    console.log("Creating socket connection with token:", token);
    const newSocket = io("http://localhost:3001", {
      auth: { token },
    });

    newSocket.on("connect", () => {
      console.log("✅ Connected to Socket.IO server");
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("❌ Disconnected from Socket.IO server");
      setIsConnected(false);
    });

    newSocket.on("error", (error) => {
      console.error("⚠️ Socket error:", error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token]);

  const joinRoom = (roomId) => {
    if (socket && isConnected) {
      socket.emit("join_room", { roomId });
    }
  };

  const leaveRoom = (roomId) => {
    if (socket && isConnected) {
      socket.emit("leave_room", { roomId });
    }
  };

  const sendMessage = (roomId, content) => {
    if (socket && isConnected) {
      socket.emit("send_message", { roomId, content });
    }
  };

  const markAsRead = (roomId) => {
    if (socket && isConnected) {
      socket.emit("mark_read", { roomId });
    }
  };
 
    
  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        joinRoom,
        leaveRoom,
        sendMessage,
        markAsRead,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
