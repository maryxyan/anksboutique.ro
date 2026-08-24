import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createHealthRouter } from "./health";

function createTestApp(databaseCheck: () => Promise<void> = async () => {}) {
  const app = express();
  app.use("/api", createHealthRouter(databaseCheck));
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

  it("reports readiness when the database is reachable", async () => {
    const response = await request(createTestApp()).get("/api/readyz");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ready" });
  });

  it("reports unavailability when the database check fails", async () => {
    const response = await request(
      createTestApp(async () => {
        throw new Error("database unavailable");
      }),
    ).get("/api/readyz");

    expect(response.status).toBe(503);
    expect(response.body).toEqual({ status: "unavailable" });
  });
});
