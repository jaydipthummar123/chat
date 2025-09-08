import mysql from "mysql2/promise";


const enableSsl = process.env.DB_SSL === "true";

const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD  || "",
  database: process.env.DB_NAME || "chat_app",
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : undefined,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: enableSsl ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false" } : undefined,
});

export default db;
