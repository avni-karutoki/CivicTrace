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
function chainPayload({ complaintId, fromStatus, toStatus, actorId, actorRole, note, createdAtMs, prevHash }) {
  return JSON.stringify({
    complaintId,
    fromStatus: norm(fromStatus),
    toStatus,
    actorId: norm(actorId),
    actorRole: norm(actorRole),
    note: norm(note),
    createdAtMs,
    prevHash,
  });
}
export async function appendStatusEvent({
  complaintId,
  fromStatus,
  toStatus,
  actorId,
  actorRole,
  note,
}) {
  const prevHash = await getLastHash(complaintId);
  const createdAt = new Date().toISOString();
  // NOTE: hashed as epoch millis, not string — Postgres returns timestamptz
  // as +00:00 while we insert Z format, so raw strings would never match.
  const thisHash = sha256(chainPayload({
    complaintId,
    fromStatus,
    toStatus,
    actorId,
    actorRole,
    note,
    createdAtMs: new Date(createdAt).getTime(),
    prevHash,
  }));
  const id = nanoid();

  const { error } = await supabase.from("status_events").insert({
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
  });
  if (error) throw error;

  return { id, complaintId, fromStatus, toStatus, actorId, actorRole, note, prevHash, thisHash, createdAt };
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
