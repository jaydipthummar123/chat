import { Server as IOServer } from "socket.io";
import jwt from "jsonwebtoken";
import db from "@/lib/db";

let io; 
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

export const GET = async () => {
  if (!io) {
    console.log("🚀 Starting Socket.IO server...");

    io = new IOServer(3001, {
      cors: { origin: "*" },
      path: "/api/socket",
    });

    // Middleware for JWT authentication
    io.use((socket, next) => {
      try {
        const token = socket.handshake.auth?.token;
        if (!token) return next(new Error("No token provided"));

        const decoded = jwt.verify(token, JWT_SECRET);
        socket.user = decoded;
        next();
      } catch (err) {
        console.error("Auth error:", err.message);
        next(new Error("Authentication failed"));
      }
    });

    io.on("connection", (socket) => {
      console.log(`✅ User connected: ${socket.user.email}`);

      /**
       * JOIN ROOM
       */
        socket.on("join_room", async ({ roomId }) => {
          try {
            // Check if user belongs to the room
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
            console.error("❌ Error joining room:", error);
            socket.emit("error", "Failed to join room");
          }
        });

      /**
       * SEND MESSAGE
       */
      socket.on("send_message", async ({ roomId, content }) => {
        try {
          // Check if user belongs to the room
          const [membership] = await db.query(
            "SELECT 1 FROM room_members WHERE room_id = ? AND user_id = ?",
            [roomId, socket.user.id]
          );

          if (!membership.length) {
            return socket.emit("error", "Not a member of this room");
          }

          // Save message
          const [result] = await db.query(
            "INSERT INTO messages (room_id, user_id, content) VALUES (?, ?, ?)",
            [roomId, socket.user.id, content]
          );

          // Get message with sender info
          const [[message]] = await db.query(
            `SELECT m.*, u.name as sender_name, u.email as sender_email
             FROM messages m 
             JOIN users u ON m.user_id = u.id 
             WHERE m.id = ?`,
            [result.insertId]
          );

          // Emit to everyone in the room
          io.to(`room_${roomId}`).emit("new_message", message);

          // Notify other members (unread)
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
          console.error("❌ Error sending message:", error);
          socket.emit("error", "Failed to send message");
        }
      });

      /**
       * MARK READ
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
          console.error("❌ Error marking read:", error);
        }
      });

      /**
       * DISCONNECT
       */
      socket.on("disconnect", () => {
        console.log(`❌ User disconnected: ${socket.user.email}`);
      });
    });
  }

  return new Response("✅ Socket.IO server running", { status: 200 });
};
