import crypto from "crypto";

// ─── Exact-location helpers (Round 3: Web3 for Transparent Cities) ──────────
// Canonicalization rounds coords to 6 decimals (~11 cm) so the same spot
// always hashes identically no matter how many decimals the browser sent.

const EARTH_RADIUS_M = 6371000;
const VALID_SOURCES = new Set(["gps", "map_search", "manual_adjustment"]);

export function haversineMeters(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a));
}

function isFiniteNumber(v) {
  return typeof v === "number" && Number.isFinite(v);
}

/**
 * Validate a complaint location payload. Never trusts the frontend blindly.
 * Returns { ok, error? , clean? } where clean has canonicalized fields.
 * Pass { requireConfirmed: true } on complaint creation.
 */
export function validateLocation(input, { requireConfirmed = false } = {}) {
  const loc = input ?? {};
  const { lat, lng, accuracy, address, source, confirmed, timestamp } = loc;

  if (!isFiniteNumber(lat) || lat < -90 || lat > 90) {
    return { ok: false, error: "Invalid latitude (must be between -90 and 90)." };
  }
  if (!isFiniteNumber(lng) || lng < -180 || lng > 180) {
    return { ok: false, error: "Invalid longitude (must be between -180 and 180)." };
  }
  let cleanAccuracy = null;
  if (accuracy !== undefined && accuracy !== null) {
    if (!isFiniteNumber(accuracy) || accuracy < 0 || accuracy > 100000) {
      return { ok: false, error: "Invalid GPS accuracy (must be 0–100000 meters)." };
    }
    cleanAccuracy = accuracy;
  }
  let cleanSource = null;
  if (source !== undefined && source !== null && source !== "") {
    if (!VALID_SOURCES.has(source)) {
      return { ok: false, error: "Invalid location_source (gps | map_search | manual_adjustment)." };
    }
    cleanSource = source;
  }
  let cleanTimestamp = null;
  if (timestamp !== undefined && timestamp !== null && timestamp !== "") {
    const t = new Date(timestamp);
    if (Number.isNaN(t.getTime())) return { ok: false, error: "Invalid location timestamp." };
    cleanTimestamp = t.toISOString();
  }
  const isConfirmed = confirmed === true;
  if (requireConfirmed && !isConfirmed) {
    return { ok: false, error: "A confirmed location is required — please confirm the complaint location on the map." };
  }

  return {
    ok: true,
    clean: {
      lat,
      lng,
      accuracy: cleanAccuracy,
      address: typeof address === "string" && address.length ? address.slice(0, 500) : null,
      source: cleanSource,
      confirmed: isConfirmed,
      timestamp: cleanTimestamp,
    },
  };
}

/** Canonical location hash — committed into the SHA-256 complaint hash chain. */
export function locationHash({ lat, lng, accuracy, address, timestamp }) {
  const canonical = [
    Number(lat).toFixed(6),
    Number(lng).toFixed(6),
    accuracy ?? "",
    (address ?? "").trim(),
    timestamp ?? "",
  ].join("|");
  return crypto.createHash("sha256").update(canonical).digest("hex");
}

/** Human-readable distance for UI ("18 m away" / "1.2 km away"). */
export function formatDistance(meters) {
  if (meters == null || !Number.isFinite(meters)) return "—";
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}
