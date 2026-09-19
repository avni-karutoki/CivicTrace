import { Router } from "express";
import { supabase } from "../supabase.js";
import { asyncHandler } from "../asyncHandler.js";
import { describeComplaintPhoto } from "../ai.js";

const router = Router();

async function requireUser(req, res, next) {
  try {
    const userId = req.header("x-user-id");
    if (!userId) return res.status(401).json({ error: "missing x-user-id header (use token from /auth/login)" });
    const { data: user, error } = await supabase.from("users").select("*").eq("id", userId).maybeSingle();
    if (error) return res.status(500).json({ error: error.message });
    if (!user) return res.status(401).json({ error: "unknown user" });
    req.user = user;
    next();
  } catch (e) {
    next(e);
  }
}

// POST /ai/describe-photo  { photo: { dataUrl }, category?, categoryLabel? }
// → { ok: true, description } — fills the "Additional Note" box (still editable).
// 503 AI_DISABLED when GEMINI_API_KEY is unset; frontend then skips AI silently.
router.post("/describe-photo", requireUser, asyncHandler(async (req, res) => {
  const dataUrl = req.body?.photo?.dataUrl ?? req.body?.dataUrl;
  const categoryLabel = req.body?.categoryLabel ?? req.body?.category ?? "";
  const result = await describeComplaintPhoto({ dataUrl, categoryLabel });
  if (!result.ok) {
    const status = result.status ?? 502;
    return res.status(status).json({ error: result.error, code: result.code ?? "AI_ERROR" });
  }
  res.json({ ok: true, description: result.description });
}));

export default router;
