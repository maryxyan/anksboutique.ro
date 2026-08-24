import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";

type DatabaseCheck = () => Promise<void>;

async function checkDatabase(): Promise<void> {
  const { pool } = await import("@workspace/db");
  await pool.query("select 1");
}

export function createHealthRouter(
  databaseCheck: DatabaseCheck = checkDatabase,
): IRouter {
  const router: IRouter = Router();

  router.get("/healthz", (_req, res) => {
    const data = HealthCheckResponse.parse({ status: "ok" });
    res.json(data);
  });

  router.get("/readyz", async (_req, res) => {
    try {
      await databaseCheck();
      const data = HealthCheckResponse.parse({ status: "ready" });
      res.json(data);
    } catch {
      const data = HealthCheckResponse.parse({ status: "unavailable" });
      res.status(503).json(data);
    }
  });

  return router;
}

export default createHealthRouter();
