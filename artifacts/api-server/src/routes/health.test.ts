import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import healthRouter from "./health";

function createTestApp() {
  const app = express();
  app.use("/api", healthRouter);
  return app;
}

describe("health API", () => {
  it("reports that the API process is healthy", async () => {
    const response = await request(createTestApp()).get("/api/healthz");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(/application\/json/);
    expect(response.body).toEqual({ status: "ok" });
  });

  it("returns 404 for an unknown health route", async () => {
    const response = await request(createTestApp()).get("/api/health");

    expect(response.status).toBe(404);
  });
});
