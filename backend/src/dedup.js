import { supabase } from "./supabase.js";

const EARTH_RADIUS_M = 6371000;

function haversineMeters(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a));
}

const PROXIMITY_METERS = 100; // spec said ~50-100m
const MATCH_THRESHOLD = 0.6; // weighted score above this = likely duplicate

/**
 * Look for an existing OPEN complaint that likely matches this new report.
 * Returns { match: complaint | null, score, distanceM }
 */
export async function findLikelyDuplicate({ category, lat, lng }) {
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

    // Weighted score: category match is already guaranteed (0.4 fixed),
    // proximity contributes up to 0.6, decaying linearly with distance.
    const proximityScore = 0.6 * (1 - distanceM / PROXIMITY_METERS);
    const score = 0.4 + proximityScore;

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

export function bumpPriority(priority) {
  if (priority === "normal") return "urgent";
  if (priority === "urgent") return "very_urgent";
  return "very_urgent";
}
