// ============================================
// shared/response.ts — HTTP response builders
// Consistent API responses across all Lambdas
// ============================================

const CORS_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
};

export const ok = (data: unknown, statusCode = 200) => ({
  statusCode,
  headers: CORS_HEADERS,
  body: JSON.stringify(data),
});

export const created = (data: unknown) => ok(data, 201);

export const err = (message: string, statusCode = 400) =>
  ok({ error: message }, statusCode);

export const unauthorized = () => err("Unauthorized", 401);
export const notFound = (resource = "Resource") => err(`${resource} not found`, 404);
export const serverError = () => err("Internal server error", 500);
