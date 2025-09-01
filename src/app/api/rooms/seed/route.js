import db from "@/lib/db";

// This endpoint creates default rooms and adds all existing users to them
export const POST = async () => {
  try {
    // Create default rooms if they don't exist
    await db.query(`
      INSERT IGNORE INTO rooms (id, name, created_by) VALUES 
      (2, 'Welcome', NULL),
      (3, 'Random', NULL)
    `);

    // Get all users
    const [users] = await db.query("SELECT id FROM users");

    // Add all users to all default rooms
    for (const user of users) {
      await db.query(
        `
        INSERT IGNORE INTO room_members (room_id, user_id, role) VALUES 
        (1, ?, 'member'),
        (2, ?, 'member'),
        (3, ?, 'member')
      `,
        [user.id, user.id, user.id]
      );
    }

    return Response.json(
      {
        message: "Default rooms created and all users added successfully",
        usersAdded: users.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error seeding default rooms:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
};
