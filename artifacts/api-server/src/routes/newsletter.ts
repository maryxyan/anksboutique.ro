import { Router, type IRouter } from "express";
import { db, newsletterSubscriptionsTable } from "@workspace/db";
import { SubscribeNewsletterBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/newsletter/subscribe", async (req, res): Promise<void> => {
  const parsed = SubscribeNewsletterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    await db.insert(newsletterSubscriptionsTable).values({
      email: parsed.data.email,
      name: parsed.data.name,
    });
    res.status(201).json({ success: true, message: "Subscribed successfully!" });
  } catch {
    // Likely unique constraint violation (already subscribed)
    res.status(200).json({ success: true, message: "Already subscribed!" });
  }
});

export default router;
