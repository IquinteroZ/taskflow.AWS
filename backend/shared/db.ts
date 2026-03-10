// ============================================
// shared/db.ts — DynamoDB client singleton
// Reused across all Lambda functions
// ============================================

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

// Singleton — Lambda reuses this across warm invocations
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
});

export const db = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertEmptyValues: false,
  },
});

export const TASKS_TABLE = process.env.TASKS_TABLE || "taskflow-tasks-dev";
export const USERS_TABLE = process.env.USERS_TABLE || "taskflow-users-dev";
