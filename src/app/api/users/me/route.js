export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { verifyToken } from "@/lib/auth";

export const GET = async (req) => {
  try {
    // 1. Get the Authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return Response.json(
        { error: "Authorization token missing" },
        { status: 401 }
      );
    }

    // 2. Extract token
    const token = authHeader.split(" ")[1];

    // 3. Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      return Response.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    // 4. Return success
    return Response.json(
      {
        success: true,
        message: "Token verified successfully",
        user: decoded,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Auth error:", err);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};
