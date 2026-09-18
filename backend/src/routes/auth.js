import { Router } from "express";
import { nanoid } from "nanoid";
import { supabase } from "../supabase.js";
import { asyncHandler } from "../asyncHandler.js";
import { validateEmail, normalizeEmail, sendOtpEmail, isOtpDebugAllowed } from "../email.js";
import { issueOtp, verifyOtp, OTP_TTL_MS } from "../otp.js";

const router = Router();

// ─── Email + OTP auth ────────────────────────────────────────────────────────
// Rules enforced here:
//  1. Only syntactically valid emails whose domain accepts mail (MX check).
//     Random strings ("abc", "a@b", "user@fake") are rejected.
//  2. Login works ONLY for emails that already signed up. Unknown emails get
//     404 + "please create an account first" — no silent auto-creation.
//  3. Both signup and login require proving inbox ownership via a 6-digit OTP
//     (10-min expiry, 5 attempts, 60s resend cooldown) — like real websites.
//
// Flow:
//   Signup: POST /auth/signup/request-otp {name, email, role?}
//           → POST /auth/signup/verify-otp {name, email, otp, role?} → {token, user}
//   Login:  POST /auth/login/request-otp {email, role?}
//           → POST /auth/login/verify-otp {email, otp, role?} → {token, user}

function validName(name) {
  const n = String(name ?? "").trim();
  if (n.length < 2) return { ok: false, error: "Please enter your full name (at least 2 characters)." };
  if (n.length > 100) return { ok: false, error: "Name is too long (max 100 characters)." };
  return { ok: true, name: n };
}

function requestedRole(role) {
  return role === "authority" ? "authority" : "citizen";
}

async function findUserByEmail(email) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("contact", email)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ?? null;
}

/** Shared OTP-send step. Attaches debugOtp in non-production when SMTP is off. */
async function sendCode(email, purpose, res) {
  const issued = await issueOtp(supabase, email, purpose);
  if (!issued.ok) {
    const status = issued.retryAfterSec ? 429 : 400;
    return res.status(status).json({ error: issued.error, retryAfterSec: issued.retryAfterSec });
  }
  const delivery = await sendOtpEmail(email, issued.code, purpose);
  const payload = {
    ok: true,
    message: delivery.sent
      ? `Verification code sent to ${email}.`
      : `Verification code generated for ${email}. (Email delivery is not configured — see backend console.)`,
    emailSent: delivery.sent,
    expiresInSec: Math.floor(OTP_TTL_MS / 1000),
  };
  if (!delivery.sent && isOtpDebugAllowed()) payload.debugOtp = issued.code;
  return res.json(payload);
}

function publicUser(user) {
  return { id: user.id, name: user.name, role: user.role };
}

// ─── Signup ──────────────────────────────────────────────────────────────────

// POST /auth/signup/request-otp  { name, email, role? }
router.post("/signup/request-otp", asyncHandler(async (req, res) => {
  const nameCheck = validName(req.body?.name);
  if (!nameCheck.ok) return res.status(400).json({ error: nameCheck.error });

  const emailCheck = await validateEmail(req.body?.email);
  if (!emailCheck.ok) return res.status(400).json({ error: emailCheck.error });
  const email = emailCheck.email;

  const existing = await findUserByEmail(email);
  if (existing) {
    return res.status(409).json({
      error: "This email is already registered. Please Sign In instead.",
      code: "ALREADY_REGISTERED",
    });
  }

  return sendCode(email, "signup", res);
}));

// POST /auth/signup/verify-otp  { name, email, otp, role? } → { token, user }
router.post("/signup/verify-otp", asyncHandler(async (req, res) => {
  const nameCheck = validName(req.body?.name);
  if (!nameCheck.ok) return res.status(400).json({ error: nameCheck.error });

  const emailCheck = await validateEmail(req.body?.email);
  if (!emailCheck.ok) return res.status(400).json({ error: emailCheck.error });
  const email = emailCheck.email;

  const existing = await findUserByEmail(email);
  if (existing) {
    return res.status(409).json({
      error: "This email is already registered. Please Sign In instead.",
      code: "ALREADY_REGISTERED",
    });
  }

  const check = await verifyOtp(supabase, email, "signup", req.body?.otp);
  if (!check.ok) return res.status(400).json({ error: check.error });

  const role = requestedRole(req.body?.role);
  const id = nanoid();
  const { error: insertError } = await supabase.from("users").insert({
    id,
    name: nameCheck.name,
    contact: email,
    role,
    created_at: new Date().toISOString(),
  });
  if (insertError) {
    // Genuine race: same email verified twice concurrently.
    if (insertError.code === "23505") {
      return res.status(409).json({
        error: "This email is already registered. Please Sign In instead.",
        code: "ALREADY_REGISTERED",
      });
    }
    return res.status(500).json({ error: insertError.message });
  }

  const user = await findUserByEmail(email);
  if (!user) return res.status(500).json({ error: "Account created but could not be loaded. Please Sign In." });
  res.json({ token: user.id, user: publicUser(user) });
}));

// ─── Login (existing accounts only — never creates anyone) ──────────────────

// POST /auth/login/request-otp  { email, role? }
router.post("/login/request-otp", asyncHandler(async (req, res) => {
  const emailCheck = await validateEmail(req.body?.email);
  if (!emailCheck.ok) return res.status(400).json({ error: emailCheck.error });
  const email = emailCheck.email;

  const user = await findUserByEmail(email);
  if (!user) {
    return res.status(404).json({
      error: "No account found for this email. Please Create Account first.",
      code: "NOT_REGISTERED",
    });
  }
  const role = req.body?.role;
  if (role && user.role !== role) {
    return res.status(403).json({
      error:
        user.role === "authority"
          ? "This email is registered as an authority account. Please use Authority Login."
          : "This email is registered as a citizen account. Please use Citizen Sign In.",
      code: "ROLE_MISMATCH",
    });
  }

  return sendCode(email, "login", res);
}));

// POST /auth/login/verify-otp  { email, otp, role? } → { token, user }
router.post("/login/verify-otp", asyncHandler(async (req, res) => {
  const rawEmail = normalizeEmail(req.body?.email);
  if (!rawEmail) return res.status(400).json({ error: "Email address is required." });

  const user = await findUserByEmail(rawEmail);
  if (!user) {
    return res.status(404).json({
      error: "No account found for this email. Please Create Account first.",
      code: "NOT_REGISTERED",
    });
  }
  const role = req.body?.role;
  if (role && user.role !== role) {
    return res.status(403).json({
      error:
        user.role === "authority"
          ? "This email is registered as an authority account. Please use Authority Login."
          : "This email is registered as a citizen account. Please use Citizen Sign In.",
      code: "ROLE_MISMATCH",
    });
  }

  const check = await verifyOtp(supabase, rawEmail, "login", req.body?.otp);
  if (!check.ok) return res.status(400).json({ error: check.error });

  // "Token" is the user id for this prototype — swap for JWT/session before real deployment.
  res.json({ token: user.id, user: publicUser(user) });
}));

// ─── Legacy endpoint (pre-OTP demo auth) ─────────────────────────────────────
// Removed: it accepted any string and silently created accounts, which is
// exactly what the new OTP flow forbids. Upgrade the frontend instead.
router.post("/login", (req, res) => {
  res.status(410).json({
    error: "Password-less demo login is retired. Please request an OTP via /auth/login/request-otp and verify it.",
    code: "LEGACY_AUTH_RETIRED",
  });
});

export default router;
