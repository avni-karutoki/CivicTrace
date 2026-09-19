import { supabase } from "./supabase.js";
import { haversineMeters } from "./location.js";

const PROXIMITY_METERS = 100; // open-complaint merge radius (~50-100m)
const REPEAT_METERS = 150; // repeat/recurrence signal radius (slightly wider)
const REPEAT_MAX_AGE_DAYS = 90; // only RESOLVED complaints newer than this count
const MATCH_THRESHOLD = 0.6; // weighted score above this = likely duplicate

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "of", "at", "near", "in", "on", "is", "it",
  "this", "that", "please", "very", "with", "for", "from", "road", "street",
]);

function tokens(text) {
  const words = String(text ?? "").toLowerCase().match(/[a-z0-9]{3,}/g) ?? [];
  return new Set(words.filter((w) => !STOPWORDS.has(w)));
}

/** Jaccard similarity of meaningful tokens (0 when either side is empty). */
export function textSimilarity(a, b) {
  const ta = tokens(a);
  const tb = tokens(b);
  if (!ta.size || !tb.size) return 0;
  let inter = 0;
  for (const w of ta) if (tb.has(w)) inter++;
  return inter / (ta.size + tb.size - inter);
}

/**
 * Look for an existing OPEN complaint that likely matches this new report.
 * Location-aware score: category (0.35) + proximity (0.40, linear decay with
 * distance) + description text similarity (0.25).
 * Returns { match: complaint | null, score, distanceM }
 */
export async function findLikelyDuplicate({ category, lat, lng, description }) {
  const { data: openComplaints, error } = await supabase
    .from("complaints")
    .select("*")
    .eq("category", category)
    .not("status", "in", "(RESOLVED,DISPUTED)");
  if (error) throw error;

  let best = null;
  let bestScore = 0;
  let bestDistance = null;

  for (const c of openComplaints ?? []) {
    const distanceM = haversineMeters(lat, lng, c.lat, c.lng);
    if (distanceM > PROXIMITY_METERS) continue;

    const proximityScore = 0.4 * (1 - distanceM / PROXIMITY_METERS);
    const score = 0.35 + proximityScore + 0.25 * textSimilarity(description, c.description);

    if (score > bestScore) {
      bestScore = score;
      best = c;
      bestDistance = distanceM;
    }
  }

  if (best && bestScore >= MATCH_THRESHOLD) {
    return { match: best, score: bestScore, distanceM: bestDistance };
  }
  return { match: null, score: bestScore, distanceM: bestDistance };
}

/**
 * Round 3 repeat/recurrence signal: same category + RESOLVED within
 * REPEAT_MAX_AGE_DAYS + nearby. Presented as evidence ("Possible recurring
 * issue"), NEVER as an accusation — the new complaint is still created.
 * Returns null or { complaint, distanceM, confidence, proofAvailable }.
 */
export async function findRepeatSignal({ category, lat, lng, description }) {
  const cutoff = new Date(Date.now() - REPEAT_MAX_AGE_DAYS * 86400000).toISOString();
  const { data: resolved, error } = await supabase
    .from("complaints")
    .select("*")
    .eq("category", category)
    .eq("status", "RESOLVED")
    .gte("resolved_at", cutoff);
  if (error) throw error;

  let best = null;
  let bestScore = 0;
  let bestDistance = null;

  for (const c of resolved ?? []) {
    if (c.lat == null || c.lng == null) continue; // pre-location complaint: no signal
    const distanceM = haversineMeters(lat, lng, c.lat, c.lng);
    if (distanceM > REPEAT_METERS) continue;

    const proximityScore = 1 - distanceM / REPEAT_METERS;
    const ageDays = Math.max(0, (Date.now() - new Date(c.resolved_at).getTime()) / 86400000);
    const recencyScore = Math.max(0, 1 - ageDays / REPEAT_MAX_AGE_DAYS);
    const score = 0.55 * proximityScore + 0.25 * textSimilarity(description, c.description) + 0.2 * recencyScore;

    if (score > bestScore) {
      bestScore = score;
      best = c;
      bestDistance = distanceM;
    }
  }

  if (!best) return null;

  // Was proof-of-fix submitted for the previous complaint?
  let proofAvailable = false;
  try {
    const { count } = await supabase
      .from("evidence")
      .select("id", { count: "exact", head: true })
      .eq("complaint_id", best.id)
      .eq("kind", "proof_of_fix");
    proofAvailable = (count ?? 0) > 0;
  } catch { /* evidence table issue — signal still valid */ }

  return {
    complaint: best,
    distanceM: Math.round(bestDistance),
    confidence: Math.round(Math.min(0.99, Math.max(0.35, bestScore)) * 100) / 100,
    proofAvailable,
  };
}

export function bumpPriority(priority) {
  if (priority === "normal") return "urgent";
  if (priority === "urgent") return "very_urgent";
  return "very_urgent";
}
