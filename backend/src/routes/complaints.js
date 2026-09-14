import { Router } from "express";
import { nanoid } from "nanoid";
import { supabase } from "../supabase.js";
import { asyncHandler } from "../asyncHandler.js";
import { findLikelyDuplicate, bumpPriority } from "../dedup.js";
import { appendStatusEvent, verifyChain, sha256Hex } from "../hashchain.js";

const router = Router();

function genTrackingCode() {
  const num = Math.floor(10000 + Math.random() * 89999);
  const suffix = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  return `CTY-${num}-${suffix}`;
}

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

// Strip complainant_id from anything authority-facing. This is the "hidden identity" guarantee.
function toAuthorityView(complaint) {
  const { complainant_id, ...rest } = complaint;
  return rest;
}

// POST /complaints  { category, description, lat, lng, priority?, photo:{ dataUrl, capturedAt } }
// Runs AI Spatial Dedup before creating a new record.
router.post("/", requireUser, async (req, res) => {
  try {
    const { category, description, lat, lng, priority, photo } = req.body;
    if (!category || lat == null || lng == null) {
      return res.status(400).json({ error: "category, lat, lng are required" });
    }

    const dedup = await findLikelyDuplicate({ category, lat, lng });
    const now = new Date().toISOString();

    if (dedup.match) {
      // Merge as a supporting report instead of a new complaint.
      const complaint = dedup.match;
      const { error: reportError } = await supabase.from("complaint_reports").insert({
        id: nanoid(),
        complaint_id: complaint.id,
        reporter_id: req.user.id,
        lat,
        lng,
        note: description ?? null,
        created_at: now,
      });
      if (reportError) throw reportError;

      const newSupportCount = complaint.support_count + 1;
      const newPriority = newSupportCount >= 3 ? "very_urgent" : bumpPriority(complaint.priority);

      const { error: updateError } = await supabase
        .from("complaints")
        .update({ support_count: newSupportCount, priority: newPriority, last_action_at: now })
        .eq("id", complaint.id);
      if (updateError) throw updateError;

      if (photo?.dataUrl) {
        const { error: evError } = await supabase.from("evidence").insert({
          id: nanoid(),
          complaint_id: complaint.id,
          uploaded_by: req.user.id,
          kind: "report",
          photo_ref: photo.dataUrl.slice(0, 64),
          photo_hash: sha256Hex(photo.dataUrl),
          lat,
          lng,
          captured_at: photo.capturedAt ?? now,
        });
        if (evError) throw evError;
      }

      await appendStatusEvent({
        complaintId: complaint.id,
        fromStatus: complaint.status,
        toStatus: complaint.status,
        actorId: req.user.id,
        actorRole: "citizen",
        note: `Duplicate report merged (support_count -> ${newSupportCount}), priority -> ${newPriority}`,
      });

      const { data: updated, error: fetchError } = await supabase
        .from("complaints")
        .select("*")
        .eq("id", complaint.id)
        .single();
      if (fetchError) throw fetchError;

      return res.status(200).json({
        merged: true,
        dedup_score: dedup.score,
        distance_m: dedup.distanceM,
        complaint: toAuthorityView(updated),
      });
    }

    // No match — create a genuinely new complaint.
    const id = nanoid();
    const trackingCode = genTrackingCode();
    const { error: insertError } = await supabase.from("complaints").insert({
      id,
      tracking_code: trackingCode,
      category,
      description: description ?? null,
      lat,
      lng,
      priority: priority ?? "normal",
      status: "REPORTED",
      department_id: null,
      complainant_id: req.user.id,
      support_count: 1,
      last_action_at: now,
      created_at: now,
    });
    if (insertError) throw insertError;

    if (photo?.dataUrl) {
      const { error: evError } = await supabase.from("evidence").insert({
        id: nanoid(),
        complaint_id: id,
        uploaded_by: req.user.id,
        kind: "report",
        photo_ref: photo.dataUrl.slice(0, 64),
        photo_hash: sha256Hex(photo.dataUrl),
        lat,
        lng,
        captured_at: photo.capturedAt ?? now,
      });
      if (evError) throw evError;
    }

    await appendStatusEvent({
      complaintId: id,
      fromStatus: null,
      toStatus: "REPORTED",
      actorId: req.user.id,
      actorRole: "citizen",
      note: "Complaint filed",
    });

    const { data: created, error: fetchError } = await supabase
      .from("complaints")
      .select("*")
      .eq("id", id)
      .single();
    if (fetchError) throw fetchError;

    res.status(201).json({ merged: false, complaint: toAuthorityView(created), tracking_code: trackingCode });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /complaints/track/:code  — public status lookup, no auth needed
router.get("/track/:code", asyncHandler(async (req, res) => {
  const { data: complaint, error } = await supabase
    .from("complaints")
    .select("*")
    .eq("tracking_code", req.params.code)
    .maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!complaint) return res.status(404).json({ error: "not found" });
  res.json(toAuthorityView(complaint));
}));

// GET /complaints  — authority dashboard list. Never includes complainant_id.
router.get("/", asyncHandler(async (req, res) => {
  const { status, department_id } = req.query;
  let query = supabase.from("complaints").select("*");
  if (status) query = query.eq("status", status);
  if (department_id) query = query.eq("department_id", department_id);
  const { data: rows, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  const list = rows ?? [];
  const rank = { very_urgent: 0, urgent: 1 };
  list.sort((a, b) => {
    const pa = rank[a.priority] ?? 2;
    const pb = rank[b.priority] ?? 2;
    if (pa !== pb) return pa - pb;
    return new Date(a.last_action_at) - new Date(b.last_action_at);
  });
  res.json(list.map(toAuthorityView));
}));

// GET /complaints/mine  — the logged-in citizen's own records (auth required):
// complaints they filed + complaints they supported + recent activity events.
router.get("/mine", requireUser, asyncHandler(async (req, res) => {
  const { data: filed, error: filedError } = await supabase
    .from("complaints")
    .select("*")
    .eq("complainant_id", req.user.id);
  if (filedError) return res.status(500).json({ error: filedError.message });

  const { data: supportRows, error: supportError } = await supabase
    .from("complaint_reports")
    .select("complaint_id")
    .eq("reporter_id", req.user.id);
  if (supportError) return res.status(500).json({ error: supportError.message });

  const supportedIds = [...new Set((supportRows ?? []).map((r) => r.complaint_id))];
  let supported = [];
  if (supportedIds.length) {
    const { data: supRows, error: supError } = await supabase
      .from("complaints")
      .select("*")
      .in("id", supportedIds);
    if (supError) return res.status(500).json({ error: supError.message });
    supported = supRows ?? [];
  }

  const relatedIds = [...new Set([...(filed ?? []).map((c) => c.id), ...supportedIds])];
  let activity = [];
  if (relatedIds.length) {
    const { data: events, error: evError } = await supabase
      .from("status_events")
      .select("*")
      .in("complaint_id", relatedIds)
      .order("created_at", { ascending: false })
      .limit(30);
    if (evError) return res.status(500).json({ error: evError.message });
    activity = events ?? [];
  }

  const sortByRecent = (a, b) => new Date(b.last_action_at) - new Date(a.last_action_at);
  res.json({
    filed: (filed ?? []).sort(sortByRecent),
    supported: supported.sort(sortByRecent),
    activity,
  });
}));

const VALID_STATUSES = ["REPORTED", "ASSESSED", "IN_PROGRESS", "RESOLVED", "DISPUTED"];

// POST /complaints/:id/status  { toStatus, note, departmentId? }  (authority action)
router.post("/:id/status", requireUser, async (req, res) => {
  try {
    const { data: complaint, error } = await supabase
      .from("complaints")
      .select("*")
      .eq("id", req.params.id)
      .maybeSingle();
    if (error) throw error;
    if (!complaint) return res.status(404).json({ error: "not found" });
    const { toStatus, note, departmentId } = req.body;
    if (!VALID_STATUSES.includes(toStatus)) {
      return res.status(400).json({ error: `toStatus must be one of ${VALID_STATUSES.join(", ")}` });
    }
    const now = new Date().toISOString();

    const { error: updateError } = await supabase
      .from("complaints")
      .update({
        status: toStatus,
        department_id: departmentId ?? complaint.department_id,
        last_action_at: now,
      })
      .eq("id", complaint.id);
    if (updateError) throw updateError;

    const event = await appendStatusEvent({
      complaintId: complaint.id,
      fromStatus: complaint.status,
      toStatus,
      actorId: req.user.id,
      actorRole: req.user.role,
      note,
    });

    res.json({ ok: true, event });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /complaints/:id/proof-of-fix  { photo: { dataUrl, capturedAt } }  (authority action)
router.post("/:id/proof-of-fix", requireUser, async (req, res) => {
  try {
    const { data: complaint, error } = await supabase
      .from("complaints")
      .select("*")
      .eq("id", req.params.id)
      .maybeSingle();
    if (error) throw error;
    if (!complaint) return res.status(404).json({ error: "not found" });
    const { photo } = req.body;
    if (!photo?.dataUrl) return res.status(400).json({ error: "photo required" });
    const now = new Date().toISOString();

    const { error: evError } = await supabase.from("evidence").insert({
      id: nanoid(),
      complaint_id: complaint.id,
      uploaded_by: req.user.id,
      kind: "proof_of_fix",
      photo_ref: photo.dataUrl.slice(0, 64),
      photo_hash: sha256Hex(photo.dataUrl),
      lat: complaint.lat,
      lng: complaint.lng,
      captured_at: photo.capturedAt ?? now,
    });
    if (evError) throw evError;

    const { error: updateError } = await supabase
      .from("complaints")
      .update({ status: "RESOLVED", resolved_at: now, last_action_at: now })
      .eq("id", complaint.id);
    if (updateError) throw updateError;

    const event = await appendStatusEvent({
      complaintId: complaint.id,
      fromStatus: complaint.status,
      toStatus: "RESOLVED",
      actorId: req.user.id,
      actorRole: req.user.role,
      note: "Proof of fix uploaded",
    });

    res.json({ ok: true, event });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /complaints/:id/accept  (citizen confirms fix)
router.post("/:id/accept", requireUser, async (req, res) => {
  res.json({ ok: true, message: "Fix accepted, no status change needed (already RESOLVED)" });
});

// POST /complaints/:id/dispute  { reason }  (citizen: one-tap reopen)
router.post("/:id/dispute", requireUser, async (req, res) => {
  try {
    const { data: complaint, error } = await supabase
      .from("complaints")
      .select("*")
      .eq("id", req.params.id)
      .maybeSingle();
    if (error) throw error;
    if (!complaint) return res.status(404).json({ error: "not found" });
    const now = new Date().toISOString();

    const { error: updateError } = await supabase
      .from("complaints")
      .update({ status: "DISPUTED", last_action_at: now })
      .eq("id", complaint.id);
    if (updateError) throw updateError;

    const event = await appendStatusEvent({
      complaintId: complaint.id,
      fromStatus: complaint.status,
      toStatus: "DISPUTED",
      actorId: req.user.id,
      actorRole: "citizen",
      note: req.body?.reason || "Citizen reports issue not actually fixed",
    });

    res.json({ ok: true, event });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /complaints/:id/verification — full hash-chain history for the judge-facing page
router.get("/:id/verification", asyncHandler(async (req, res) => {
  const { data: complaint, error } = await supabase
    .from("complaints")
    .select("*")
    .eq("id", req.params.id)
    .maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!complaint) return res.status(404).json({ error: "not found" });
  const chain = await verifyChain(req.params.id);
  res.json({ complaint: toAuthorityView(complaint), chain_valid: chain.valid, events: chain.events });
}));

export default router;
