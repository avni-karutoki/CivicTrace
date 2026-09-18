import crypto from "node:crypto";
import { nanoid } from "nanoid";

// ─── OTP lifecycle ───────────────────────────────────────────────────────────
// 6-digit code, SHA-256 hashed at rest, 10-min expiry, 5 attempts max,
// 60s resend cooldown, 5 sends/hour per email. Only the latest OTP per
// (email, purpose) stays valid — requesting a new one voids the old.
//
// Primary store: public.auth_otps (see backend/supabase/migration_auth_otps.sql).
// If that table hasn't been created in the Supabase project yet, the flow
// automatically falls back to a process-local in-memory store (dev-friendly)
// and logs a warning telling you to run the migration SQL in SQL Editor.

export const OTP_TTL_MS = 10 * 60 * 1000;
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
export const OTP_MAX_SENDS_PER_HOUR = 5;
export const OTP_MAX_ATTEMPTS = 5;

export function generateOtpCode() {
  return String(crypto.randomInt(100000, 1000000)); // 6 digits, no leading zero
}

export function hashOtp(code) {
  return crypto.createHash("sha256").update(String(code)).digest("hex");
}

function otpEquals(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

// ─── Store layer (Supabase table → memory fallback) ──────────────────────────

let memoryMode = false;
let warned = false;
/** email(lowercase) -> array of otp rows (newest last) */
const memDb = new Map();

function warnMemoryMode() {
  if (warned) return;
  warned = true;
  console.warn(
    "[auth] public.auth_otps table not found — using in-memory OTP store. " +
    "Run backend/supabase/migration_auth_otps.sql in Supabase Studio > SQL Editor " +
    "for persistent OTPs across restarts."
  );
}

async function ensureStore(supabase) {
  if (memoryMode) return "memory";
  // NOTE: must be a real (non-head) select — HEAD requests do not surface
  // PGRST205 for missing tables. limit(0) keeps it cheap.
  const { error } = await supabase.from("auth_otps").select("id").limit(0);
  if (error && (error.code === "PGRST205" || /schema cache/i.test(error.message))) {
    memoryMode = true;
    warnMemoryMode();
    return "memory";
  }
  if (error) throw new Error(error.message);
  return "supabase";
}

function memRows(email) {
  const key = String(email).toLowerCase();
  if (!memDb.has(key)) memDb.set(key, []);
  return memDb.get(key);
}

async function recentSends(supabase, mode, email, purpose, sinceIso) {
  if (mode === "memory") {
    return memRows(email)
      .filter((r) => r.created_at >= sinceIso)
      .map((r) => ({ id: r.id, purpose: r.purpose, created_at: r.created_at }))
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  }
  const { data, error } = await supabase
    .from("auth_otps")
    .select("id, purpose, created_at")
    .eq("email", email)
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

async function voidPrevious(supabase, mode, email, purpose, nowIso) {
  if (mode === "memory") {
    for (const r of memRows(email)) {
      if (r.purpose === purpose && !r.consumed && r.expires_at > nowIso) r.consumed = true;
    }
    return;
  }
  const { error } = await supabase
    .from("auth_otps")
    .update({ consumed: true })
    .eq("email", email)
    .eq("purpose", purpose)
    .eq("consumed", false)
    .gt("expires_at", nowIso);
  if (error) throw new Error(error.message);
}

async function insertRow(supabase, mode, row) {
  if (mode === "memory") {
    memRows(row.email).push(row);
    return;
  }
  const { error } = await supabase.from("auth_otps").insert(row);
  if (error) throw new Error(error.message);
}

async function latestActive(supabase, mode, email, purpose) {
  if (mode === "memory") {
    const rows = memRows(email).filter((r) => r.purpose === purpose && !r.consumed);
    return rows.length ? rows[rows.length - 1] : null;
  }
  const { data, error } = await supabase
    .from("auth_otps")
    .select("*")
    .eq("email", email)
    .eq("purpose", purpose)
    .eq("consumed", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ?? null;
}

async function updateRow(supabase, mode, id, patch) {
  if (mode === "memory") {
    for (const rows of memDb.values()) {
      const r = rows.find((x) => x.id === id);
      if (r) Object.assign(r, patch);
    }
    return;
  }
  const { error } = await supabase.from("auth_otps").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

// ─── Public API ──────────────────────────────────────────────────────────────

/** Issue a new OTP. Returns { ok, error?, retryAfterSec? } and the plain code. */
export async function issueOtp(supabase, email, purpose) {
  const mode = await ensureStore(supabase);
  const now = Date.now();
  const nowIso = new Date(now).toISOString();

  let sends;
  try {
    sends = await recentSends(supabase, mode, email, purpose, new Date(now - 60 * 60 * 1000).toISOString());
  } catch (e) {
    return { ok: false, error: e.message };
  }
  if (sends.length >= OTP_MAX_SENDS_PER_HOUR) {
    return { ok: false, error: "Too many codes sent. Please try again after an hour." };
  }
  // Resend cooldown applies per (email, purpose) — switching between signup
  // and login never blocks you, but hammering resend on one form does.
  const samePurpose = sends.filter((s) => s.purpose === purpose);
  if (samePurpose.length > 0) {
    const lastAt = new Date(samePurpose[0].created_at).getTime();
    const waitMs = OTP_RESEND_COOLDOWN_MS - (now - lastAt);
    if (waitMs > 0) {
      return {
        ok: false,
        error: `Please wait ${Math.ceil(waitMs / 1000)} seconds before requesting a new code.`,
        retryAfterSec: Math.ceil(waitMs / 1000),
      };
    }
  }

  // Void any still-valid OTPs for this email+purpose so only the newest works.
  try {
    await voidPrevious(supabase, mode, email, purpose, nowIso);
  } catch (e) {
    return { ok: false, error: e.message };
  }

  const code = generateOtpCode();
  try {
    await insertRow(supabase, mode, {
      id: nanoid(),
      email,
      code_hash: hashOtp(code),
      purpose,
      attempts: 0,
      consumed: false,
      expires_at: new Date(now + OTP_TTL_MS).toISOString(),
      created_at: nowIso,
    });
  } catch (e) {
    return { ok: false, error: e.message };
  }
  return { ok: true, code };
}

/** Verify a submitted OTP. Returns { ok, error? }. */
export async function verifyOtp(supabase, email, purpose, code) {
  const submitted = String(code ?? "").trim();
  if (!/^\d{6}$/.test(submitted)) {
    return { ok: false, error: "Please enter the 6-digit code." };
  }

  const mode = await ensureStore(supabase);
  let row;
  try {
    row = await latestActive(supabase, mode, email, purpose);
  } catch (e) {
    return { ok: false, error: e.message };
  }
  if (!row) {
    return { ok: false, error: "No active code found. Please request a new one." };
  }
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await updateRow(supabase, mode, row.id, { consumed: true });
    return { ok: false, error: "This code has expired. Please request a new one." };
  }
  if ((row.attempts ?? 0) >= OTP_MAX_ATTEMPTS) {
    await updateRow(supabase, mode, row.id, { consumed: true });
    return { ok: false, error: "Too many wrong attempts. Please request a new code." };
  }

  if (!otpEquals(hashOtp(submitted), row.code_hash)) {
    // NOTE: capture first — in memory mode `row` is a live reference that
    // updateRow mutates in place, so reading row.attempts afterwards lies.
    const attemptsBefore = row.attempts ?? 0;
    await updateRow(supabase, mode, row.id, { attempts: attemptsBefore + 1 });
    const left = OTP_MAX_ATTEMPTS - attemptsBefore - 1;
    return {
      ok: false,
      error:
        left > 0
          ? `Incorrect code. ${left} attempt${left === 1 ? "" : "s"} left.`
          : "Incorrect code. Please request a new one.",
    };
  }

  await updateRow(supabase, mode, row.id, { consumed: true });
  return { ok: true };
}
