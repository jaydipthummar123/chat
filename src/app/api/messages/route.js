import { verifyToken } from "@/middleware/auth";
import db from "@/lib/db";

export const GET = async (req) => {
  const auth = verifyToken(req);

  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get("roomId");

  if (!roomId) {
    return Response.json({ error: "Room ID is required" }, { status: 400 });
  }

  try {
    // Check if room exists
    const [roomRows] = await db.query("SELECT * FROM rooms WHERE id = ?", [roomId]);
    if (!roomRows.length) {
      return Response.json({ error: "Room not found" }, { status: 404 });
    }
    const room = roomRows[0];

    // If room is private, enforce membership check
    if (room.created_by !== null) {
      const [membership] = await db.query(
        "SELECT * FROM room_members WHERE room_id = ? AND user_id = ?",
        [roomId, auth.user.id]
      );

      if (!membership.length) {
        return Response.json({ error: "Not a member of this room" }, { status: 403 });
      }
    }

    // Fetch messages with sender info
    const [messages] = await db.query(
      `
        SELECT m.*, u.name as sender_name, u.email as sender_email
        FROM messages m
        JOIN users u ON m.user_id = u.id
        WHERE m.room_id = ?
        ORDER BY m.created_at ASC
      `,
      [roomId]
    );

    // Mark messages as read only if user is a member
    if (room.created_by !== null) {
      await db.query(
        "UPDATE room_members SET last_read_at = NOW() WHERE room_id = ? AND user_id = ?",
        [roomId, auth.user.id]
      );
    }

    return Response.json({ messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return Response.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
};
