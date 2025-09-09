import db from "@/lib/db";
import { verifyToken } from "@/middleware/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = async (req, { params }) => {
  const auth = verifyToken(req);
  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const roomId = parseInt(params.id, 10);
    if (!roomId || Number.isNaN(roomId)) {
      return Response.json({ error: "Valid room id is required" }, { status: 400 });
    }

    // Ensure room exists
    const [rooms] = await db.query("SELECT id FROM rooms WHERE id = ?", [roomId]);
    if (!rooms.length) {
      return Response.json({ error: "Room not found" }, { status: 404 });
    }

    // Upsert membership
    await db.query(
      "INSERT IGNORE INTO room_members (room_id, user_id, role) VALUES (?, ?, 'member')",
      [roomId, auth.user.id]
    );

    return Response.json({ message: "Joined room" }, { status: 200 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
};


