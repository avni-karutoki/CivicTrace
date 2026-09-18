import dns from "node:dns/promises";
import nodemailer from "nodemailer";

// ─── Email validation ────────────────────────────────────────────────────────
// Layer 1: strict format check (no random strings like "abc" or "a@b").
// Layer 2: MX-record check — the domain must actually accept email.
// Layer 3 (in routes): OTP must be entered from the inbox — this is what
// proves the address really belongs to the user, like real websites do.

const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

// Obviously fake / non-routable domains — rejected without a DNS lookup.
const BLOCKED_DOMAINS = new Set([
  "example.com",
  "example.org",
  "example.net",
  "test.com",
  "fake.com",
  "invalid.com",
  "localhost",
]);

export function normalizeEmail(input) {
  return String(input ?? "").trim().toLowerCase();
}

export function isValidEmailFormat(email) {
  if (!email || email.length > 254) return false;
  if (!EMAIL_RE.test(email)) return false;
  const [local, domain] = email.split("@");
  if (!local || !domain || local.length > 64) return false;
  if (email.includes("..")) return false;
  if (domain.startsWith("-") || domain.startsWith(".") || domain.endsWith(".")) return false;
  return true;
}

/**
 * Check the domain can receive email (has MX records).
 * Returns true | false | "unknown" (network failure — caller decides).
 */
async function hasMxRecord(domain) {
  try {
    const records = await dns.resolveMx(domain);
    return Array.isArray(records) && records.length > 0;
  } catch (err) {
    // ENOTFOUND / ENODATA / ENOTIMP / ESERVFAIL = domain has no mail setup.
    // EAI_AGAIN / ETIMEDOUT / ECONNREFUSED = our network/DNS is down.
    if (err?.code === "EAI_AGAIN" || err?.code === "ETIMEDOUT" || err?.code === "ECONNREFUSED") {
      return "unknown";
    }
    return false;
  }
}

export async function validateEmail(raw) {
  const email = normalizeEmail(raw);
  if (!email) return { ok: false, error: "Email address is required." };
  if (!isValidEmailFormat(email)) {
    return { ok: false, error: "Please enter a valid email address (e.g. you@example.com)." };
  }
  const domain = email.split("@")[1];
  if (BLOCKED_DOMAINS.has(domain)) {
    return { ok: false, error: "This email domain is not allowed. Please use your real email address." };
  }
  const mx = await hasMxRecord(domain);
  if (mx === false) {
    return { ok: false, error: `No mail server found for "${domain}". Please check the email address.` };
  }
  // mx === "unknown": DNS unreachable from the server — allow and let the
  // OTP step prove ownership instead of hard-blocking.
  return { ok: true, email };
}

// ─── OTP email delivery ──────────────────────────────────────────────────────
// Configure real delivery with SMTP env vars (Gmail App Password works):
//   SMTP_HOST=smtp.gmail.com SMTP_PORT=587 SMTP_USER=you@gmail.com
//   SMTP_PASS=<16-char app password> SMTP_FROM="CivicTrace <you@gmail.com>"
// Without SMTP, OTPs are logged to the backend console and (in non-production)
// returned as `debugOtp` so the demo still works end-to-end.

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

export function isSmtpConfigured() {
  const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env;
  return Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);
}

export function isOtpDebugAllowed() {
  if (process.env.OTP_DEBUG === "true") return true;
  if (process.env.OTP_DEBUG === "false") return false;
  return process.env.NODE_ENV !== "production"; // dev default: on
}

export async function sendOtpEmail(to, code, purpose) {
  const subject =
    purpose === "signup"
      ? `Your CivicTrace verification code: ${code}`
      : `Your CivicTrace login code: ${code}`;
  const text =
    `Your CivicTrace ${purpose === "signup" ? "account verification" : "login"} code is:\n\n` +
    `  ${code}\n\n` +
    `It expires in 10 minutes. If you did not request this, please ignore this email.`;

  const tx = getTransporter();
  if (!tx) {
    console.log(`[auth] (no SMTP) OTP for ${to} [${purpose}]: ${code}`);
    return { sent: false };
  }
  try {
    await tx.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      text,
    });
    return { sent: true };
  } catch (err) {
    console.error("[auth] SMTP send failed:", err?.message);
    console.log(`[auth] (smtp failed) OTP for ${to} [${purpose}]: ${code}`);
    return { sent: false, error: err?.message };
  }
}
