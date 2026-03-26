import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

// POST /api/bot/webhook — Telegram bot webhook endpoint
// The actual bot logic is in apps/bot, this route just forwards
router.post('/webhook', asyncHandler(async (req: Request, res: Response) => {
  // In production, the bot app handles webhooks directly
  // This endpoint exists as a fallback/proxy if needed
  console.log('Bot webhook received:', JSON.stringify(req.body).slice(0, 200));
  res.json({ ok: true });
}));

export { router as botRouter };
