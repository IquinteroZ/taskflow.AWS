// ============================================
// TaskFlow — Tasks Lambda Handler
// GET/POST /tasks | PUT/DELETE /tasks/:id
// ============================================

import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  UpdateItemCommand,
  DeleteItemCommand,
  QueryCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import * as crypto from "crypto";
import { jwtVerify } from "jose";

const db = new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" });
const TASKS_TABLE = process.env.TASKS_TABLE || "taskflow-tasks";
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

async function getUserId(authHeader?: string): Promise<string | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const { payload } = await jwtVerify(authHeader.slice(7), JWT_SECRET);
    return payload.sub as string;
  } catch {
    return null;
  }
}

// ── Get all tasks ────────────────────────────────────────────────
async function getTasks(userId: string, qs: Record<string, string>) {
  const result = await db.send(new QueryCommand({
    TableName: TASKS_TABLE,
    IndexName: "userId-createdAt-index",
    KeyConditionExpression: "userId = :uid",
    ExpressionAttributeValues: marshall({ ":uid": userId }),
    ScanIndexForward: false, // newest first
  }));

  let tasks = (result.Items || []).map(i => unmarshall(i));

  // Filter by priority
  if (qs.priority) tasks = tasks.filter(t => t.priority === qs.priority);
  // Filter by status
  if (qs.status) tasks = tasks.filter(t => t.status === qs.status);

  return ok({ data: tasks });
}

// ── Create task ──────────────────────────────────────────────────
async function createTask(userId: string, body: {
  title: string;
  description?: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  labels?: { id: string; name: string; color: string }[];
  dueDate?: string;
}) {
  const { title, description, priority, labels = [], dueDate } = body;
  if (!title?.trim()) return err("title is required");
  if (!["HIGH", "MEDIUM", "LOW"].includes(priority)) return err("priority must be HIGH, MEDIUM or LOW");

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const task = {
    id,
    userId,
    title: title.trim(),
    description: description?.trim() || "",
    status: "TODO",
    priority,
    labels,
    dueDate: dueDate || null,
    createdAt: now,
    updatedAt: now,
  };

  await db.send(new PutItemCommand({
    TableName: TASKS_TABLE,
    Item: marshall(task, { removeUndefinedValues: true }),
  }));

  return ok({ data: task }, 201);
}

// ── Update task ──────────────────────────────────────────────────
async function updateTask(userId: string, taskId: string, body: Record<string, unknown>) {
  const allowed = ["title", "description", "status", "priority", "labels", "dueDate"];
  const validStatus = ["TODO", "IN_PROGRESS", "DONE"];
  const validPriority = ["HIGH", "MEDIUM", "LOW"];

  if (body.status && !validStatus.includes(body.status as string)) return err("Invalid status");
  if (body.priority && !validPriority.includes(body.priority as string)) return err("Invalid priority");

  const updates = Object.entries(body)
    .filter(([k]) => allowed.includes(k))
    .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});

  if (Object.keys(updates).length === 0) return err("No valid fields to update");

  const expr = Object.keys(updates).map(k => `#${k} = :${k}`).join(", ");
  const names = Object.keys(updates).reduce((a, k) => ({ ...a, [`#${k}`]: k }), {} as Record<string, string>);
  const values = Object.entries(updates).reduce(
    (a, [k, v]) => ({ ...a, [`:${k}`]: v }),
    { ":uid": userId, ":now": new Date().toISOString() }
  );

  const result = await db.send(new UpdateItemCommand({
    TableName: TASKS_TABLE,
    Key: marshall({ id: taskId }),
    UpdateExpression: `SET ${expr}, updatedAt = :now`,
    ConditionExpression: "userId = :uid",
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: marshall(values, { removeUndefinedValues: true }),
    ReturnValues: "ALL_NEW",
  }));

  return ok({ data: unmarshall(result.Attributes!) });
}

// ── Delete task ──────────────────────────────────────────────────
async function deleteTask(userId: string, taskId: string) {
  await db.send(new DeleteItemCommand({
    TableName: TASKS_TABLE,
    Key: marshall({ id: taskId }),
    ConditionExpression: "userId = :uid",
    ExpressionAttributeValues: marshall({ ":uid": userId }),
  }));
  return ok({ message: "Task deleted" });
}

// ── Handler ──────────────────────────────────────────────────────
export const handler = async (event: {
  httpMethod: string;
  path: string;
  headers: Record<string, string>;
  queryStringParameters?: Record<string, string>;
  pathParameters?: Record<string, string>;
  body: string | null;
}) => {
  try {
    const userId = await getUserId(event.headers?.Authorization || event.headers?.authorization);
    if (!userId) return err("Unauthorized", 401);

    const method = event.httpMethod;
    const taskId = event.pathParameters?.id;
    const qs = event.queryStringParameters || {};
    const body = JSON.parse(event.body || "{}");

    if (method === "GET" && !taskId) return getTasks(userId, qs);
    if (method === "POST" && !taskId) return createTask(userId, body);
    if (method === "PUT" && taskId) return updateTask(userId, taskId, body);
    if (method === "DELETE" && taskId) return deleteTask(userId, taskId);

    return err("Route not found", 404);
  } catch (e) {
    console.error("Tasks handler error:", e);
    return err("Internal server error", 500);
  }
};
