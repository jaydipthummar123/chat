export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { verifyToken } from "@/middleware/auth";
import db from "@/lib/db";

export const GET = async (req) => {
  // 🔹 Step 1: Verify JWT token
  const auth = verifyToken(req);
  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const userId = auth.user.id;

    // 🔹 Step 2: Get total unread count
    const [totalRows] = await db.query(
      `
      SELECT COUNT(*) AS total_unread
      FROM messages m
      INNER JOIN room_members rm ON m.room_id = rm.room_id
      WHERE rm.user_id = ?
        AND (rm.last_read_at IS NULL OR m.created_at > rm.last_read_at)
      `,
      [userId]
    );

    const totalUnread = totalRows?.[0]?.total_unread ?? 0;

    // 🔹 Step 3: Get unread count per room
    const [roomsResult] = await db.query(
      `
      SELECT r.id, r.name,
             COUNT(
               CASE 
                 WHEN rm.last_read_at IS NULL OR m.created_at > rm.last_read_at 
                 THEN 1 
               END
             ) AS unread_count
      FROM rooms r
      INNER JOIN room_members rm ON r.id = rm.room_id
      LEFT JOIN messages m ON r.id = m.room_id
      WHERE rm.user_id = ?
      GROUP BY r.id, r.name
      HAVING unread_count > 0
      `,
      [userId]
    );

    return Response.json({
      totalUnread,
      roomUnread: roomsResult || [],
    });
  } catch (error) {
    console.error("❌ Error fetching unread counts:", error);
    if (process.env.NODE_ENV === "production") {
      // Fail-soft in production to avoid breaking UI when DB is unreachable
      return Response.json({ totalUnread: 0, roomUnread: [] }, { status: 200 });
    }
    return Response.json(
      { error: "Failed to fetch unread counts" },
      { status: 500 }
    );
  }
};
