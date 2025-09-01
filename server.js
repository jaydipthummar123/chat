
import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import mysql from "mysql2/promise";
import { config } from "dotenv";

config({ path: ".env.local" });

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "chat_app",
};

let db;

// Initialize MySQL
async function initializeDatabase() {
  try {
    db = await mysql.createConnection(dbConfig);
    console.log("✅ Database connected successfully");
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    console.log("⚠️ Starting server without database connection...");
    db = null;
  }
}

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST","PUT","DELETE"],
  },
});


io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error("No token provided"));
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    socket.user = decoded; 
    next();
  } catch (err) {
    console.error("❌ Auth error:", err.message);
    next(new Error("Authentication error"));
  }
});

io.on("connection", (socket) => {
  console.log(`✅ User connected: ${socket.user.email}`);

  socket.on("join_room", ({ roomId }) => {
    socket.join(`room_${roomId}`);
    console.log(`➡️ ${socket.user.email} joined room ${roomId}`);
  });

  socket.on("leave_room", ({ roomId }) => {
    socket.leave(`room_${roomId}`);
    console.log(`⬅️ ${socket.user.email} left room ${roomId}`);
  });


  socket.on("send_message", async ({ roomId, content }) => {
    try {
      // If DB not available → emit temp message
      if (!db) {
        const message = {
          id: Date.now(),
          room_id: roomId,
          user_id: socket.user.id,
          content,
          created_at: new Date().toISOString(),
          sender_name: socket.user.name || socket.user.email,
          sender_email: socket.user.email,
        };
        io.to(`room_${roomId}`).emit("new_message", message);
        return;
      }

      // Ensure user is a room member
      const [membership] = await db.query(
        "SELECT * FROM room_members WHERE room_id = ? AND user_id = ?",
        [roomId, socket.user.id]
      );

      if (membership.length === 0) {
        socket.emit("error", "Not a member of this room");
        return;
      }

      // Insert into DB
      const [result] = await db.query(
        "INSERT INTO messages (room_id, user_id, content) VALUES (?, ?, ?)",
        [roomId, socket.user.id, content]
      );

      // Fetch message with sender details
      const [rows] = await db.query(
        `SELECT m.*, u.name AS sender_name, u.email AS sender_email
         FROM messages m 
         JOIN users u ON m.user_id = u.id 
         WHERE m.id = ?`,
        [result.insertId]
      );

      const message = rows[0];

      io.to(`room_${roomId}`).emit("new_message", message);
    } catch (error) {
      console.error("❌ Error sending message:", error.message);
      socket.emit("error", "Failed to send message");
    }
  });

  
  socket.on("typing", ({ roomId }) => {
    socket.to(`room_${roomId}`).emit("user_typing", {
      userId: socket.user.id,
      userName: socket.user.name || socket.user.email,
    });
  });

  socket.on("stop_typing", ({ roomId }) => {
    socket.to(`room_${roomId}`).emit("user_stopped_typing", {
      userId: socket.user.id,
    });
  });

 
  socket.on("mark_read", async ({ roomId }) => {
    try {
      if (!db) {
        socket.to(`room_${roomId}`).emit("messages_read", {
          roomId,
          userId: socket.user.id,
        });
        return;
      }

      await db.query(
        "UPDATE room_members SET last_read_at = NOW() WHERE room_id = ? AND user_id = ?",
        [roomId, socket.user.id]
      );

      socket.to(`room_${roomId}`).emit("messages_read", {
        roomId,
        userId: socket.user.id,
      });
    } catch (error) {
      console.error("❌ Error marking messages as read:", error.message);
    }
  });

  socket.on("disconnect", () => {
    console.log(`🔌 User disconnected: ${socket.user.email}`);
  });
});

const PORT = process.env.SOCKET_PORT || 3001;

async function startServer() {
  await initializeDatabase();
  httpServer.listen(PORT, () => {
    console.log(`🚀 Socket.IO server running on port ${PORT}`);
  });
}

startServer().catch((err) => console.error("❌ Fatal error:", err));
