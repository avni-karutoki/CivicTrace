import crypto from "crypto";
import { nanoid } from "nanoid";
import { supabase } from "./supabase.js";

const GENESIS_HASH = "0".repeat(64);

function sha256(input) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

// Get the last hash in this complaint's chain (or genesis if none yet)
async function getLastHash(complaintId) {
  const { data, error } = await supabase
    .from("status_events")
    .select("this_hash")
    .eq("complaint_id", complaintId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? data.this_hash : GENESIS_HASH;
}

// Append a new status event, chaining it to the previous hash.
// Returns the inserted event.
const norm = (v) => v ?? null;

// Canonical payload: all nullable fields normalized to null so the keys
// hashed at insert time exactly match what verifyChain reconstructs
// (JSON.stringify drops `undefined` keys but keeps `null`).
//
// Round 3: `locHash` (canonical location hash) is included ONLY when present.
// Pre-location events hash exactly as before, so existing chains keep verifying.
function chainPayload({ complaintId, fromStatus, toStatus, actorId, actorRole, note, createdAtMs, prevHash, locHash }) {
  return JSON.stringify({
    complaintId,
    fromStatus: norm(fromStatus),
    toStatus,
    actorId: norm(actorId),
    actorRole: norm(actorRole),
    note: norm(note),
    createdAtMs,
    prevHash,
    ...(locHash != null ? { locHash } : {}),
  });
}
export async function appendStatusEvent({
  complaintId,
  fromStatus,
  toStatus,
  actorId,
  actorRole,
  note,
  locHash,
}) {
  const prevHash = await getLastHash(complaintId);
  const createdAt = new Date().toISOString();
  // NOTE: hashed as epoch millis, not string — Postgres returns timestamptz
  // as +00:00 while we insert Z format, so raw strings would never match.
  const hashWith = (lh) => sha256(chainPayload({
    complaintId,
    fromStatus,
    toStatus,
    actorId,
    actorRole,
    note,
    createdAtMs: new Date(createdAt).getTime(),
    prevHash,
    locHash: lh ?? null,
  }));
  const id = nanoid();

  // location_hash column comes from migration_location.sql; fall back to a
  // legacy column-less insert (with the legacy hash recomputed to match) on
  // databases where the migration hasn't run yet.
  let thisHash = hashWith(locHash ?? null);
  const row = {
    id,
    complaint_id: complaintId,
    from_status: fromStatus ?? null,
    to_status: toStatus,
    actor_id: actorId ?? null,
    actor_role: actorRole ?? null,
    note: note ?? null,
    prev_hash: prevHash,
    this_hash: thisHash,
    created_at: createdAt,
    ...(locHash != null ? { location_hash: locHash } : {}),
  };
  let { error } = await supabase.from("status_events").insert(row);
  if (error && /location_hash|could not find|column .* does not exist/i.test(error.message ?? "")) {
    thisHash = hashWith(null);
    const legacyRow = {
      id,
      complaint_id: complaintId,
      from_status: fromStatus ?? null,
      to_status: toStatus,
      actor_id: actorId ?? null,
      actor_role: actorRole ?? null,
      note: note ?? null,
      prev_hash: prevHash,
      this_hash: thisHash,
      created_at: createdAt,
    };
    ({ error } = await supabase.from("status_events").insert(legacyRow));
  }
  if (error) throw error;

  return { id, complaintId, fromStatus, toStatus, actorId, actorRole, note, prevHash, thisHash, createdAt, locHash: locHash ?? null };
}

// Walk the chain for a complaint and verify it's unbroken.
// This is what the judge-facing verification page calls.
export async function verifyChain(complaintId) {
  const { data: events, error } = await supabase
    .from("status_events")
    .select("*")
    .eq("complaint_id", complaintId)
    .order("created_at", { ascending: true });
  if (error) throw error;

  let expectedPrev = GENESIS_HASH;
  const results = [];
  let valid = true;

  for (const ev of events ?? []) {
    const recomputed = sha256(chainPayload({
      complaintId: ev.complaint_id,
      fromStatus: ev.from_status,
      toStatus: ev.to_status,
      actorId: ev.actor_id,
      actorRole: ev.actor_role,
      note: ev.note,
      createdAtMs: new Date(ev.created_at).getTime(),
      prevHash: ev.prev_hash,
      // Pre-migration rows have no location_hash key at all → omitted,
      // exactly reproducing the legacy payload they were hashed with.
      locHash: ev.location_hash ?? null,
    }));
    const linkOk = ev.prev_hash === expectedPrev;
    const hashOk = recomputed === ev.this_hash;
    if (!linkOk || !hashOk) valid = false;
    results.push({ ...ev, link_ok: linkOk, hash_ok: hashOk });
    expectedPrev = ev.this_hash;
  }

  return { valid, events: results };
}

export function sha256Hex(input) {
  return sha256(input);
}
