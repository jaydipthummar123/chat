export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import db from "@/lib/db";
import { userSchema } from "@/validation/joivalidation/usersSchema";
import bcrypt from "bcryptjs";

export const POST = async (req) => {
  try {
    const body = await req.json();

    const { error, value } = userSchema.validate(body, { abortEarly: false });
    if (error) {
      return Response.json(
        { error: error.details.map((err) => err.message) },
        { status: 400 }
      );
    }

    const { name, email, password } = value;
    const [existingUser] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existingUser.length > 0) {
      return Response.json(
        { error: "User already exists with this email" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const [userResult] = await db.query(
      "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
      [name, email, hashedPassword]
    );

    const userId = userResult.insertId;

    // Create default rooms if they don't exist
    await db.query(`
      INSERT IGNORE INTO rooms (id, name, created_by) VALUES 
      (1, 'General Chat', NULL),
      (2, 'Welcome', NULL),
      (3, 'Random', NULL)
    `);

    // Add new user to all default rooms
    await db.query(
      `
      INSERT IGNORE INTO room_members (room_id, user_id, role) VALUES 
      (1, ?, 'member'),
      (2, ?, 'member'),
      (3, ?, 'member')
    `,
      [userId, userId, userId]
    );

    // Create a personal room for the new user
    const [personalRoomResult] = await db.query(
      "INSERT INTO rooms (name, created_by) VALUES (?, ?)",
      [`${name}'s Room`, userId]
    );
    const personalRoomId = personalRoomResult.insertId;
    // Add the new user as a member of their personal room
    await db.query(
      "INSERT INTO room_members (room_id, user_id, role) VALUES (?, ?, 'admin')",
      [personalRoomId, userId]
    );
    return Response.json(
      { message: "User registered successfully" },
      { status: 201 }
    );
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
};

export const GET = async () => {
  try {
    const [rows] = await db.query(
      "SELECT id, name, email, created_at FROM users"
    );

    return Response.json({ users: rows }, { status: 200 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
};
