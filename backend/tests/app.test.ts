import type { Express } from "express";
import request from "supertest";
import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("pdf-parse", () => ({
  default: vi.fn(async () => ({ text: "" })),
}));

let app: Express;

beforeAll(async () => {
  process.env.NODE_ENV = "test";
  process.env.PORT = "5000";
  process.env.MONGODB_URI = "mongodb://localhost:27017/test-db";
  process.env.JWT_SECRET = "test-secret-at-least-16";
  process.env.GEMINI_API_KEY = "test-gemini-key";
  process.env.CORS_ORIGIN = "http://localhost:3000";
  process.env.TRUST_PROXY = "0";
  process.env.RATE_LIMIT_WINDOW_MS = "60000";
  process.env.RATE_LIMIT_MAX_REQUESTS = "200";
  process.env.AUTH_RATE_LIMIT_MAX_ATTEMPTS = "10";

  const appModule = await import("../src/app");
  app = appModule.app;
});

describe("API app", () => {
  it("returns 200 for health endpoint", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: "Backend is healthy",
    });
  });

  it("blocks unsafe query payloads", async () => {
    const response = await request(app).get("/api/health?$bad=1");

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.code).toBe("UNSAFE_INPUT");
  });

  it("returns 404 for unknown API routes", async () => {
    const response = await request(app).get("/api/does-not-exist");

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });
});
