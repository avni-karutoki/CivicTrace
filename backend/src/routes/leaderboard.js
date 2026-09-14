import { Router } from "express";
import { supabase } from "../supabase.js";
import { asyncHandler } from "../asyncHandler.js";

const router = Router();

// GET /leaderboard
// Ranks departments by: avg resolution time (created -> resolved_at) and reopened-case count
// (a "reopen" = any complaint that has a DISPUTED status_event in its history).
router.get("/", asyncHandler(async (req, res) => {
  const { data: departments, error } = await supabase.from("departments").select("*");
  if (error) return res.status(500).json({ error: error.message });

  const rows = [];
  for (const dept of departments ?? []) {
    const { data: complaints, error: cError } = await supabase
      .from("complaints")
      .select("id, created_at, resolved_at")
      .eq("department_id", dept.id);
    if (cError) return res.status(500).json({ error: cError.message });

    const resolved = (complaints ?? []).filter((c) => c.resolved_at);
    const avgResolutionHours =
      resolved.length === 0
        ? null
        : resolved.reduce((sum, c) => {
            const ms = new Date(c.resolved_at) - new Date(c.created_at);
            return sum + ms / 36e5;
          }, 0) / resolved.length;

    const complaintIds = (complaints ?? []).map((c) => c.id);
    let reopenedCount = 0;
    let escalatedCount = 0;
    if (complaintIds.length > 0) {
      const { data: disputed, error: dError } = await supabase
        .from("status_events")
        .select("complaint_id")
        .in("complaint_id", complaintIds)
        .eq("to_status", "DISPUTED");
      if (dError) return res.status(500).json({ error: dError.message });
      reopenedCount = new Set((disputed ?? []).map((e) => e.complaint_id)).size;

      const { data: escalated, error: eError } = await supabase
        .from("status_events")
        .select("complaint_id")
        .in("complaint_id", complaintIds)
        .like("note", "Auto-escalated%");
      if (eError) return res.status(500).json({ error: eError.message });
      escalatedCount = new Set((escalated ?? []).map((e) => e.complaint_id)).size;
    }

    rows.push({
      department_id: dept.id,
      department_name: dept.name,
      total_complaints: (complaints ?? []).length,
      resolved_count: resolved.length,
      avg_resolution_hours: avgResolutionHours === null ? null : Math.round(avgResolutionHours * 10) / 10,
      reopened_count: reopenedCount,
      escalated_count: escalatedCount,
    });
  }

  // Rank: fastest avg resolution first, fewer reopens as tiebreak/penalty.
  rows.sort((a, b) => {
    const aScore = (a.avg_resolution_hours ?? 9999) + a.reopened_count * 24;
    const bScore = (b.avg_resolution_hours ?? 9999) + b.reopened_count * 24;
    return aScore - bScore;
  });

  res.json(rows.map((r, i) => ({ rank: i + 1, ...r })));
}));

export default router;
