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

    console.log("🔌 Connecting socket with token:", token);

    // Prefer explicit public URL in production; fallback to same origin in production, localhost in dev
    const socketUrl =process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
       
    if (!socketUrl) {
      console.warn("Socket URL not configured. Set NEXT_PUBLIC_SOCKET_URL for production.");
      return;
    }

    const newSocket = io(socketUrl, {
      path: "/api/socket",
      auth: { token },
      // Prefer polling first to avoid websocket proxy/upgrade issues, then upgrade
      transports: ["polling", "websocket"],
      upgrade: true,
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 30000,
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

    // Extra diagnostics for production issues (CORS/auth/upgrade)
    newSocket.on("connect_error", (err) => {
      console.error("⚠️ Socket connect_error:", {
        message: err?.message,
        data: err?.data,
        name: err?.name,
        description: err?.description,
        context: err?.context,
      });
    });
    newSocket.io?.on?.("error", (err) => {
      console.error("⚠️ Transport error:", err?.message || err);
    });
    newSocket.io?.on?.("reconnect_error", (err) => {
      console.error("⚠️ Reconnect error:", err?.message || err);
    });
    newSocket.io?.on?.("upgradeError", (err) => {
      console.error("⚠️ Upgrade error (websocket):", err?.message || err);
    });

    // Listen for incoming messages
    newSocket.on("receive_message", (message) => {
      console.log("📩 New message:", message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token]);

  // --- Actions ---
  const joinRoom = (roomId) => {
    if (socket && isConnected) {
      console.log(`➡️ Joining room ${roomId}`);
      socket.emit("join_room", { roomId });
    }
  };

  const leaveRoom = (roomId) => {
    if (socket && isConnected) {
      console.log(`⬅️ Leaving room ${roomId}`);
      socket.emit("leave_room", { roomId });
    }
  };

  const sendMessage = (roomId, content) => {
    if (socket && isConnected) {
      console.log(`✉️ Sending message to ${roomId}:`, content);
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
