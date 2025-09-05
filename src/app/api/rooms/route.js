// Add users to a room (room admin only)
import { verifyToken } from "@/middleware/auth";
import db from "@/lib/db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const PUT = async (req) => {
  const auth = verifyToken(req);
  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }
  try {
    const { roomId, userIds } = await req.json();
    if (!roomId || !Array.isArray(userIds) || userIds.length === 0) {
      return Response.json({ error: "roomId and userIds are required" }, { status: 400 });
    }
    const [adminCheck] = await db.query(
      "SELECT role FROM room_members WHERE room_id = ? AND user_id = ?",
      [roomId, auth.user.id]
    );
    if (!adminCheck.length || adminCheck[0].role !== "admin") {
      return Response.json({ error: "Only room admin can add users" }, { status: 403 });
    }
    for (const uid of userIds) {
      await db.query(
        "INSERT IGNORE INTO room_members (room_id, user_id, role) VALUES (?, ?, 'member')",
        [roomId, uid]
      );
    }
    return Response.json({ message: "Users added to room" }, { status: 200 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
};

export const GET = async (req) => {
  const auth = verifyToken(req);

  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const [rooms] = await db.query(
      `
      SELECT 
        r.*, 
        COUNT(DISTINCT m.id) AS message_count,
        MAX(m.created_at) AS last_message_at,
        COUNT(
          CASE 
            WHEN m.created_at > rm.last_read_at OR rm.last_read_at IS NULL THEN 1 
          END
        ) AS unread_count
      FROM rooms r
      LEFT JOIN room_members rm 
        ON r.id = rm.room_id AND rm.user_id = ?
      LEFT JOIN messages m 
        ON r.id = m.room_id
      WHERE 
        (r.created_by IS NULL OR r.id IN (SELECT room_id FROM room_members WHERE user_id = ?))
      GROUP BY r.id
      ORDER BY last_message_at DESC, r.id DESC
      `,
      [auth.user.id, auth.user.id]
    );

    return Response.json({ rooms });
  } catch (error) {
    console.error("Error fetching rooms:", error);
    return Response.json({ error: "Failed to fetch rooms" }, { status: 500 });
  }
};

export const POST = async (req) => {
  const auth = verifyToken(req);

  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { name } = await req.json();

    if (!name || name.trim().length === 0) {
      return Response.json({ error: "Room name is required" }, { status: 400 });
    }

    // Create room
    const [roomResult] = await db.query(
      "INSERT INTO rooms (name, created_by) VALUES (?, ?)",
      [name.trim(), auth.user.id]
    );

    const roomId = roomResult.insertId;

    // Add creator as memb
    await db.query(
      "INSERT INTO room_members (room_id, user_id, role) VALUES (?, ?, ?)",
      [roomId, auth.user.id, "admin"]
    );

    // Fetch the created room
    const [rooms] = await db.query("SELECT * FROM rooms WHERE id = ?", [roomId]);

    return Response.json({ room: rooms[0] }, { status: 201 });
  } catch (error) {
    console.error("Error creating room:", error);
    return Response.json({ error: "Failed to create room" }, { status: 500 });
  }
};

export const DELETE = async (req) => {
  const auth = verifyToken(req);

  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get("roomId");

    if (!roomId) {
      return Response.json({ error: "Room ID is required" }, { status: 400 });
    }

    // Check if it's a default room (cannot be deleted)
    const defaultRooms = [1, 2, 3]; // General Chat, Welcome, Random
    if (defaultRooms.includes(parseInt(roomId))) {
      return Response.json(
        { error: "Default rooms cannot be deleted" },
        { status: 403 }
      );
    }

    // Check if user is admin of the room
    const [membership] = await db.query(
      "SELECT role FROM room_members WHERE room_id = ? AND user_id = ?",
      [roomId, auth.user.id]
    );

    if (membership.length === 0) {
      return Response.json(
        { error: "You are not a member of this room" },
        { status: 403 }
      );
    }

    if (membership[0].role !== "admin") {
      return Response.json(
        { error: "Only room admins can delete rooms" },
        { status: 403 }
      );
    }

    // Delete the room (cascade will handle related records)
    await db.query("DELETE FROM rooms WHERE id = ?", [roomId]);

    return Response.json({ message: "Room deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting room:", error);
    return Response.json({ error: "Failed to delete room" }, { status: 500 });
  }
};
