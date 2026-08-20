import { Router, type IRouter } from "express";
import { listOohLocations } from "../lib/sameday";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.get("/shipping/ooh-locations", async (req, res): Promise<void> => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const countPerPage = Math.max(1, Math.min(500, Number(req.query.countPerPage) || 100));
    const result = await listOohLocations({
      county: typeof req.query.county === "string" ? req.query.county.trim() : undefined,
      city: typeof req.query.city === "string" ? req.query.city.trim() : undefined,
      search: typeof req.query.search === "string" ? req.query.search.trim() : undefined,
      page,
      countPerPage,
    });
    res.json(result);
  } catch (error) {
    logger.error({ err: error }, "Failed to load Sameday OOH locations");
    res.status(502).json({ error: error instanceof Error ? error.message : "Sameday nu este disponibil." });
  }
});

export default router;
