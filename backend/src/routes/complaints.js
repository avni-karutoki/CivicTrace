import { Router } from "express";
import { nanoid } from "nanoid";
import { supabase } from "../supabase.js";
import { asyncHandler } from "../asyncHandler.js";
import { findLikelyDuplicate, findRepeatSignal, bumpPriority } from "../dedup.js";
import { appendStatusEvent, verifyChain, sha256Hex } from "../hashchain.js";
import { validateLocation, locationHash, haversineMeters, formatDistance } from "../location.js";

// Insert helper that tolerates databases where migration_location.sql hasn't
// run yet (drops unknown location columns and retries once). Keeps pre-
// migration deployments working per backward-compatibility requirements.
const LOCATION_COLUMNS = new Set([
  "location_accuracy", "location_address", "location_source",
  "location_confirmed", "location_timestamp", "location_hash",
  "resolution_lat", "resolution_lng", "resolution_location_accuracy",
  "resolution_timestamp", "proof_distance_m",
]);

async function insertComplaintRow(row) {
  let { error } = await supabase.from("complaints").insert(row);
  if (error && /could not find|does not exist|unknown column|no such column/i.test(error.message ?? "")) {
    const legacy = Object.fromEntries(
      Object.entries(row).filter(([k]) => !LOCATION_COLUMNS.has(k))
    );
    ({ error } = await supabase.from("complaints").insert(legacy));
  }
  return error;
}

async function updateComplaintRow(id, patch) {
  let { error } = await supabase.from("complaints").update(patch).eq("id", id);
  if (error && /could not find|does not exist|unknown column|no such column/i.test(error.message ?? "")) {
    const legacy = Object.fromEntries(
      Object.entries(patch).filter(([k]) => !LOCATION_COLUMNS.has(k))
    );
    if (Object.keys(legacy).length) {
      ({ error } = await supabase.from("complaints").update(legacy).eq("id", id));
    }
  }
  return error;
}

/** Shape a repeat signal for API responses (never includes complainant data). */
function publicRepeatSignal(repeat) {
  if (!repeat) return null;
  const c = repeat.complaint;
  return {
    tracking_code: c.tracking_code,
    status: c.status,
    resolved_at: c.resolved_at ?? null,
    distance_m: repeat.distanceM,
    proof_available: repeat.proofAvailable,
    confidence: repeat.confidence,
  };
}
import { anchorStatusEvent, verifyOnchain, explorerTxUrl, isOnchainEnabled } from "../onchain.js";

// Best-effort anchor saver: ignores missing-column errors so old DBs keep working.
async function trySaveAnchor({ eventId, complaintId, txHash, chainId }) {
  if (!txHash) return;
  try {
    await supabase.from("status_events").update({ tx_hash: txHash, chain_id: chainId ?? null }).eq("id", eventId);
  } catch { /* column may not exist yet — run migration_add_anchor.sql */ }
  try {
    await supabase.from("complaints").update({ anchor_tx: txHash, anchor_chain_id: chainId ?? null }).eq("id", complaintId);
  } catch { /* ignore */ }
}

// Fire-and-forget so API latency is unchanged when chain is slow/off.
function anchorInBackground({ event, complaintId, trackingCode, fromStatus, toStatus }) {
  if (!isOnchainEnabled()) return;
  anchorStatusEvent({ complaintId, trackingCode, fromStatus, toStatus, thisHash: event?.thisHash })
    .then((r) => { if (r?.txHash) trySaveAnchor({ eventId: event?.id, complaintId, txHash: r.txHash, chainId: r.chainId }); })
    .catch(() => {});
}

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

// POST /complaints  { category, description, lat, lng, priority?,
//   photo:{ dataUrl, capturedAt },
//   location: { lat, lng, accuracy?, address?, source?, confirmed, timestamp? } }
// Runs location-aware dedup + repeat/recurrence detection before creating.
// New clients send a confirmed `location`; legacy lat/lng-only payloads are
// still accepted (stored unconfirmed) so old app versions keep working.
router.post("/", requireUser, async (req, res) => {
  try {
    const { category, description, priority, photo } = req.body;

    let loc = null;
    if (req.body?.location && typeof req.body.location === "object") {
      const check = validateLocation(req.body.location, { requireConfirmed: true });
      if (!check.ok) return res.status(400).json({ error: check.error });
      loc = check.clean;
    } else {
      // Legacy payload (pre-location frontend): accept raw lat/lng, unconfirmed.
      const { lat, lng } = req.body;
      const check = validateLocation({ lat, lng }, { requireConfirmed: false });
      if (!check.ok) {
        if (!category) return res.status(400).json({ error: "category, lat, lng are required" });
        return res.status(400).json({ error: check.error });
      }
      loc = check.clean;
    }
    if (!category) return res.status(400).json({ error: "category is required" });
    const { lat, lng } = loc;
    const locHash = locationHash(loc);

    const dedup = await findLikelyDuplicate({ category, lat, lng, description });
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

      const mergeEvent = await appendStatusEvent({
        complaintId: complaint.id,
        fromStatus: complaint.status,
        toStatus: complaint.status,
        actorId: req.user.id,
        actorRole: "citizen",
        note: `Duplicate report merged (support_count -> ${newSupportCount}), priority -> ${newPriority}`,
      });
      anchorInBackground({ event: mergeEvent, complaintId: complaint.id, trackingCode: complaint.tracking_code, fromStatus: complaint.status, toStatus: complaint.status });

      const { data: updated, error: fetchError } = await supabase
        .from("complaints")
        .select("*")
        .eq("id", complaint.id)
        .single();
      if (fetchError) throw fetchError;

      let repeat = null;
      try {
        repeat = await findRepeatSignal({ category, lat, lng, description });
      } catch { /* repeat signal is advisory — merge still succeeds */ }
      return res.status(200).json({
        merged: true,
        dedup_score: dedup.score,
        distance_m: dedup.distanceM,
        repeat: publicRepeatSignal(repeat),
        complaint: toAuthorityView(updated),
      });
    }

    // No match — create a genuinely new complaint.
    const id = nanoid();
    const trackingCode = genTrackingCode();
    const insertError = await insertComplaintRow({
      id,
      tracking_code: trackingCode,
      category,
      description: description ?? null,
      lat,
      lng,
      location_accuracy: loc.accuracy,
      location_address: loc.address,
      location_source: loc.source,
      location_confirmed: loc.confirmed,
      location_timestamp: loc.timestamp,
      location_hash: locHash,
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

    // Round 3 repeat signal: same-category RESOLVED complaint nearby. The new
    // complaint is still created — this is evidence, not an accusation — and
    // the linkage is recorded in the tamper-evident chain note.
    let repeat = null;
    try {
      repeat = await findRepeatSignal({ category, lat, lng, description });
    } catch { /* advisory only */ }
    const filedNote = repeat
      ? `Complaint filed. Possible repeat of ${repeat.complaint.tracking_code} (${repeat.distanceM}m away, confidence ${repeat.confidence}).`
      : "Complaint filed";

    const filedEvent = await appendStatusEvent({
      complaintId: id,
      fromStatus: null,
      toStatus: "REPORTED",
      actorId: req.user.id,
      actorRole: "citizen",
      note: filedNote,
      locHash,
    });
    anchorInBackground({ event: filedEvent, complaintId: id, trackingCode, fromStatus: "", toStatus: "REPORTED" });

    const { data: created, error: fetchError } = await supabase
      .from("complaints")
      .select("*")
      .eq("id", id)
      .single();
    if (fetchError) throw fetchError;

    res.status(201).json({
      merged: false,
      complaint: toAuthorityView(created),
      tracking_code: trackingCode,
      repeat: publicRepeatSignal(repeat),
    });
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
    anchorInBackground({ event, complaintId: complaint.id, trackingCode: complaint.tracking_code, fromStatus: complaint.status, toStatus });

    res.json({ ok: true, event });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /complaints/:id/location  { location: {...}, reason? }  (authority only)
// Corrects a complaint's location WITHOUT silently overwriting history: the
// original location stays in the chain and a LOCATION_UPDATED audit event
// (old hash → new hash, actor, reason, timestamp) is appended.
router.post("/:id/location", requireUser, async (req, res) => {
  try {
    if (req.user.role !== "authority") {
      return res.status(403).json({ error: "Only authorities can update a complaint location." });
    }
    const { data: complaint, error } = await supabase
      .from("complaints")
      .select("*")
      .eq("id", req.params.id)
      .maybeSingle();
    if (error) throw error;
    if (!complaint) return res.status(404).json({ error: "not found" });

    const check = validateLocation(req.body?.location, { requireConfirmed: true });
    if (!check.ok) return res.status(400).json({ error: check.error });
    const loc = check.clean;
    const newLocHash = locationHash(loc);
    const now = new Date().toISOString();

    const oldLoc = {
      lat: complaint.lat,
      lng: complaint.lng,
      hash: complaint.location_hash ?? null,
    };
    const updateError = await updateComplaintRow(complaint.id, {
      lat: loc.lat,
      lng: loc.lng,
      location_accuracy: loc.accuracy,
      location_address: loc.address,
      location_source: loc.source,
      location_confirmed: true,
      location_timestamp: loc.timestamp ?? now,
      location_hash: newLocHash,
      last_action_at: now,
    });
    if (updateError) throw updateError;

    const movedM = (oldLoc.lat != null && oldLoc.lng != null)
      ? Math.round(haversineMeters(oldLoc.lat, oldLoc.lng, loc.lat, loc.lng))
      : null;
    const auditNote = JSON.stringify({
      type: "LOCATION_UPDATED",
      old: oldLoc,
      new: { lat: loc.lat, lng: loc.lng, hash: newLocHash },
      moved_m: movedM,
      reason: typeof req.body?.reason === "string" ? req.body.reason.slice(0, 500) : null,
    });
    const event = await appendStatusEvent({
      complaintId: complaint.id,
      fromStatus: complaint.status,
      toStatus: complaint.status,
      actorId: req.user.id,
      actorRole: "authority",
      note: auditNote,
      locHash: newLocHash,
    });
    anchorInBackground({ event, complaintId: complaint.id, trackingCode: complaint.tracking_code, fromStatus: complaint.status, toStatus: complaint.status });

    res.json({ ok: true, event, moved_m: movedM });
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
    const { photo, resolution } = req.body;
    if (!photo?.dataUrl) return res.status(400).json({ error: "photo required" });
    const now = new Date().toISOString();

    // Optional authority coordinates (browser geolocation, permission-gated).
    // Supporting evidence only — never treated as absolute proof of repair.
    let resolutionLoc = null;
    let proofDistanceM = null;
    if (resolution && typeof resolution === "object") {
      const check = validateLocation(resolution, { requireConfirmed: false });
      if (!check.ok) return res.status(400).json({ error: `Invalid resolution location: ${check.error}` });
      resolutionLoc = check.clean;
      if (complaint.lat != null && complaint.lng != null) {
        proofDistanceM = Math.round(haversineMeters(complaint.lat, complaint.lng, resolutionLoc.lat, resolutionLoc.lng));
      }
    }

    const { error: evError } = await supabase.from("evidence").insert({
      id: nanoid(),
      complaint_id: complaint.id,
      uploaded_by: req.user.id,
      kind: "proof_of_fix",
      photo_ref: photo.dataUrl.slice(0, 64),
      photo_hash: sha256Hex(photo.dataUrl),
      lat: resolutionLoc?.lat ?? complaint.lat,
      lng: resolutionLoc?.lng ?? complaint.lng,
      captured_at: photo.capturedAt ?? now,
    });
    if (evError) throw evError;

    const updateError = await updateComplaintRow(complaint.id, {
      status: "RESOLVED",
      resolved_at: now,
      last_action_at: now,
      ...(resolutionLoc ? {
        resolution_lat: resolutionLoc.lat,
        resolution_lng: resolutionLoc.lng,
        resolution_location_accuracy: resolutionLoc.accuracy,
        resolution_timestamp: resolutionLoc.timestamp ?? now,
        proof_distance_m: proofDistanceM,
      } : {}),
    });
    if (updateError) throw updateError;

    const proofNote = proofDistanceM != null
      ? `Proof of fix uploaded (${formatDistance(proofDistanceM)} from reported location)`
      : "Proof of fix uploaded";
    const event = await appendStatusEvent({
      complaintId: complaint.id,
      fromStatus: complaint.status,
      toStatus: "RESOLVED",
      actorId: req.user.id,
      actorRole: req.user.role,
      note: proofNote,
    });
    anchorInBackground({ event, complaintId: complaint.id, trackingCode: complaint.tracking_code, fromStatus: complaint.status, toStatus: "RESOLVED" });

    res.json({ ok: true, event, proof_distance_m: proofDistanceM });
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
    anchorInBackground({ event, complaintId: complaint.id, trackingCode: complaint.tracking_code, fromStatus: complaint.status, toStatus: "DISPUTED" });

    res.json({ ok: true, event });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /complaints/:id/verification — full hash-chain history for the judge-facing page
// Additive: includes `onchain` only when ONCHAIN_ENABLED; old clients ignore it.
router.get("/:id/verification", asyncHandler(async (req, res) => {
  const { data: complaint, error } = await supabase
    .from("complaints")
    .select("*")
    .eq("id", req.params.id)
    .maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!complaint) return res.status(404).json({ error: "not found" });
  const chain = await verifyChain(req.params.id);
  let onchain = { enabled: false };
  try {
    if (isOnchainEnabled() && chain.events?.length) {
      const latest = chain.events[chain.events.length - 1];
      const v = await verifyOnchain(req.params.id, latest.this_hash);
      onchain = {
        ...v,
        txUrl: latest.tx_hash ? explorerTxUrl(latest.tx_hash) : (complaint.anchor_tx ? explorerTxUrl(complaint.anchor_tx) : null),
        anchorTx: latest.tx_hash || complaint.anchor_tx || null,
      };
    } else if (complaint.anchor_tx) {
      onchain = { enabled: true, anchorTx: complaint.anchor_tx, txUrl: explorerTxUrl(complaint.anchor_tx) };
    }
  } catch { /* keep off-chain verification authoritative */ }
  res.json({ complaint: toAuthorityView(complaint), chain_valid: chain.valid, events: chain.events, onchain });
}));

// POST /complaints/:id/anchor — manually anchor latest event (demo helper, no-op when disabled)
router.post("/:id/anchor", requireUser, asyncHandler(async (req, res) => {
  if (!isOnchainEnabled()) return res.json({ enabled: false, message: "ONCHAIN_ENABLED != true; off-chain record unchanged" });
  const chain = await verifyChain(req.params.id);
  if (!chain.events?.length) return res.status(404).json({ error: "no events to anchor" });
  const latest = chain.events[chain.events.length - 1];
  const { data: complaint } = await supabase.from("complaints").select("tracking_code").eq("id", req.params.id).maybeSingle();
  const r = await anchorStatusEvent({ complaintId: req.params.id, trackingCode: complaint?.tracking_code || "", fromStatus: latest.from_status || "", toStatus: latest.to_status, thisHash: latest.this_hash });
  if (r?.txHash) await trySaveAnchor({ eventId: latest.id, complaintId: req.params.id, txHash: r.txHash, chainId: r.chainId });
  res.json({ enabled: true, txHash: r?.txHash || null, txUrl: r?.txHash ? explorerTxUrl(r.txHash) : null });
}));

export default router;
