// src/app/api/socket/route.js
import { Server as IOServer } from "socket.io";
import jwt from "jsonwebtoken";
import db from "@/lib/db";

let io; // Prevent multiple instances
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return new Response("Socket disabled in production route; use external server.", { status: 200 });
  }

  if (!io) {
    console.log("🚀 Starting Socket.IO server (dev only)...");

    io = new IOServer(3001, {
      cors: { origin: "*" },
      path: "/api/socket",
    });

    /**
     * 🔑 Middleware for JWT authentication
     */
    io.use((socket, next) => {
      try {
        const token = socket.handshake.auth?.token;
        if (!token) return next(new Error("No token provided"));

        const decoded = jwt.verify(token, JWT_SECRET);
        socket.user = decoded; // attach user to socket
        next();
      } catch (err) {
        console.error("❌ Auth error:", err.message);
        next(new Error("Authentication failed"));
      }
    });

    /**
     * 📡 Socket connection
     */
    io.on("connection", (socket) => {
      console.log(`✅ User connected: ${socket.user.email}`);

      /**
       * JOIN ROOM
       */
      socket.on("join_room", async ({ roomId }) => {
        try {
          const [membership] = await db.query(
            "SELECT 1 FROM room_members WHERE room_id = ? AND user_id = ?",
            [roomId, socket.user.id]
          );

          if (!membership.length) {
            return socket.emit("error", "Not a member of this room");
          }

          socket.join(`room_${roomId}`);
          console.log(`➡️ ${socket.user.email} joined room ${roomId}`);
        } catch (error) {
          console.error("❌ Error joining room:", error.message);
          socket.emit("error", "Failed to join room");
        }
      });

      /**
       * SEND MESSAGE
       */
      socket.on("send_message", async ({ roomId, content }) => {
        try {
          const [membership] = await db.query(
            "SELECT 1 FROM room_members WHERE room_id = ? AND user_id = ?",
            [roomId, socket.user.id]
          );

          if (!membership.length) {
            return socket.emit("error", "Not a member of this room");
          }

          const [result] = await db.query(
            "INSERT INTO messages (room_id, user_id, content) VALUES (?, ?, ?)",
            [roomId, socket.user.id, content]
          );

          const [[message]] = await db.query(
            `SELECT m.*, u.name as sender_name, u.email as sender_email
             FROM messages m
             JOIN users u ON m.user_id = u.id
             WHERE m.id = ?`,
            [result.insertId]
          );

          io.to(`room_${roomId}`).emit("new_message", message);

          // 🔔 Notify other members
          const [members] = await db.query(
            "SELECT user_id FROM room_members WHERE room_id = ? AND user_id != ?",
            [roomId, socket.user.id]
          );

          members.forEach(({ user_id }) => {
            socket.to(`user_${user_id}`).emit("message_received", {
              roomId,
              message,
            });
          });
        } catch (error) {
          console.error("❌ Error sending message:", error.message);
          socket.emit("error", "Failed to send message");
        }
      });

      /**
       * MARK MESSAGES AS READ
       */
      socket.on("mark_read", async ({ roomId }) => {
        try {
          await db.query(
            "UPDATE room_members SET last_read_at = NOW() WHERE room_id = ? AND user_id = ?",
            [roomId, socket.user.id]
          );

          socket.to(`room_${roomId}`).emit("messages_read", {
            roomId,
            userId: socket.user.id,
          });
        } catch (error) {
          console.error("❌ Error marking read:", error.message);
        }
      });

      /**
       * DISCONNECT
       */
      socket.on("disconnect", () => {
        console.log(`🔌 User disconnected: ${socket.user.email}`);
      });
    });
  }

  return new Response("✅ Socket.IO server running", { status: 200 });
}
