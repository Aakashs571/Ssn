import { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, "../../skillpath.db");

// Initialize SQLite database instance
const db = new DatabaseSync(dbPath);

// Enable WAL mode and foreign keys for performance and data integrity
db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    career TEXT DEFAULT 'fullstack',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

// Seed default demo user if users table is empty
const countStmt = db.prepare("SELECT COUNT(*) AS count FROM users;");
const countResult = countStmt.get();
if (!countResult || countResult.count === 0) {
  const seedStmt = db.prepare(`
    INSERT INTO users (id, name, email, password, career, created_at)
    VALUES (?, ?, ?, ?, ?, ?);
  `);
  seedStmt.run(
    "user_demo_alex",
    "Alex Rivers",
    "alex@example.com",
    "password123",
    "fullstack",
    new Date().toISOString()
  );
}

export function findUserByEmail(email) {
  const stmt = db.prepare("SELECT * FROM users WHERE email = ? COLLATE NOCASE;");
  return stmt.get(email.trim());
}

export function findUserById(id) {
  const stmt = db.prepare("SELECT id, name, email, career, created_at FROM users WHERE id = ?;");
  return stmt.get(id);
}

export function createUser({ name, email, password, career = "fullstack" }) {
  const id = `usr_${randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO users (id, name, email, password, career, created_at)
    VALUES (?, ?, ?, ?, ?, ?);
  `);
  stmt.run(id, name.trim(), email.trim().toLowerCase(), password, career, now);
  return { id, name: name.trim(), email: email.trim().toLowerCase(), career, created_at: now };
}

export function createSession(userId) {
  const token = `s_${randomUUID().replace(/-/g, "")}`;
  const now = new Date().toISOString();
  const stmt = db.prepare("INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?);");
  stmt.run(token, userId, now);
  return token;
}

export function getSession(token) {
  if (!token) return null;
  const stmt = db.prepare(`
    SELECT u.id, u.name, u.email, u.career, u.created_at
    FROM users u
    JOIN sessions s ON u.id = s.user_id
    WHERE s.token = ?;
  `);
  return stmt.get(token);
}

export function deleteSession(token) {
  if (!token) return false;
  const stmt = db.prepare("DELETE FROM sessions WHERE token = ?;");
  stmt.run(token);
  return true;
}

export default db;
