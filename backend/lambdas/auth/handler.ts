// ============================================
// TaskFlow — Auth Lambda Handler
// POST /auth/login | POST /auth/register
// ============================================

import { DynamoDBClient, GetItemCommand, PutItemCommand, QueryCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import * as crypto from "crypto";
import { SignJWT } from "jose";

const db = new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" });
const USERS_TABLE = process.env.USERS_TABLE || "taskflow-users";
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

// ── Helpers ─────────────────────────────────────────────────────
const ok = (body: unknown, statusCode = 200) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
  },
  body: JSON.stringify(body),
});

const err = (message: string, statusCode = 400) => ok({ error: message }, statusCode);

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
}

async function createToken(userId: string, email: string): Promise<string> {
  return new SignJWT({ sub: userId, email })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(JWT_SECRET);
}

// ── Register ────────────────────────────────────────────────────
async function register(body: { name: string; email: string; password: string }) {
  const { name, email, password } = body;

  if (!name || !email || !password) return err("name, email and password are required");
  if (password.length < 8) return err("Password must be at least 8 characters");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return err("Invalid email format");

  // Check if email already exists
  const existing = await db.send(new QueryCommand({
    TableName: USERS_TABLE,
    IndexName: "email-index",
    KeyConditionExpression: "email = :email",
    ExpressionAttributeValues: marshall({ ":email": email }),
    Limit: 1,
  }));

  if (existing.Count && existing.Count > 0) return err("Email already registered", 409);

  const userId = crypto.randomUUID();
  const salt = crypto.randomBytes(32).toString("hex");
  const passwordHash = hashPassword(password, salt);
  const now = new Date().toISOString();

  await db.send(new PutItemCommand({
    TableName: USERS_TABLE,
    Item: marshall({ id: userId, email, name, passwordHash, salt, createdAt: now }),
  }));

  const token = await createToken(userId, email);
  return ok({ token, user: { id: userId, email, name } }, 201);
}

// ── Login ────────────────────────────────────────────────────────
async function login(body: { email: string; password: string }) {
  const { email, password } = body;
  if (!email || !password) return err("email and password are required");

  const result = await db.send(new QueryCommand({
    TableName: USERS_TABLE,
    IndexName: "email-index",
    KeyConditionExpression: "email = :email",
    ExpressionAttributeValues: marshall({ ":email": email }),
    Limit: 1,
  }));

  if (!result.Items || result.Items.length === 0) return err("Invalid credentials", 401);

  const user = unmarshall(result.Items[0]);
  const hash = hashPassword(password, user.salt);

  if (hash !== user.passwordHash) return err("Invalid credentials", 401);

  const token = await createToken(user.id, user.email);
  return ok({ token, user: { id: user.id, email: user.email, name: user.name } });
}

// ── Handler ──────────────────────────────────────────────────────
export const handler = async (event: {
  httpMethod: string;
  path: string;
  body: string | null;
}) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const path = event.path;

    if (path.endsWith("/register")) return await register(body);
    if (path.endsWith("/login")) return await login(body);

    return err("Route not found", 404);
  } catch (e) {
    console.error("Auth handler error:", e);
    return err("Internal server error", 500);
  }
};
