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
// Delivery providers, auto-selected in this order:
//   1. BREVO_API_KEY  — Brevo transactional email over HTTPS API (works on
//     Render's free tier, where outbound SMTP ports 25/465/587 are blocked).
//     Set BREVO_SENDER_EMAIL to your Brevo-verified sender address.
//   2. SMTP_*         — classic SMTP via nodemailer (works everywhere Except
//     Render free tier). kept as provider #2 for other hosts.
//   3. None           — OTPs logged to the backend console and (in
//     non-production or with OTP_DEBUG=true) returned as `debugOtp`.

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

async function sendViaBrevo(to, subject, text) {
  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": process.env.BREVO_API_KEY,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender: {
          email: process.env.BREVO_SENDER_EMAIL || process.env.SMTP_USER,
          name: "CivicTrace",
        },
        to: [{ email: to }],
        subject,
        textContent: text,
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (res.ok) return { sent: true };
    let detail = `Brevo responded ${res.status}`;
    try {
      const body = await res.json();
      detail = `Brevo ${res.status}: ${body?.message ?? JSON.stringify(body).slice(0, 140)}`;
    } catch { /* keep status-code detail */ }
    return { sent: false, error: detail };
  } catch (err) {
    return { sent: false, error: `Brevo request failed: ${String(err?.message ?? err).slice(0, 120)}` };
  }
}

async function sendViaSmtp(to, subject, text) {
  const tx = getTransporter();
  if (!tx) return { sent: false, error: "SMTP not configured" };
  try {
    await tx.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      text,
    });
    return { sent: true };
  } catch (err) {
    return { sent: false, error: `SMTP: ${err?.message ?? "send failed"}` };
  }
}

export function activeEmailProvider() {
  if (process.env.BREVO_API_KEY) return "brevo";
  if (isSmtpConfigured()) return "smtp";
  return "none";
}

export function isOtpDebugAllowed() {
  if (process.env.OTP_DEBUG === "true") return true;
  if (process.env.OTP_DEBUG === "false") return false;
  return process.env.NODE_ENV !== "production"; // dev default: on
}

/** Safe diagnostics for /health — never returns keys or passwords. */
export async function smtpStatus() {
  const provider = activeEmailProvider();
  if (provider === "none") return { configured: false, provider };
  if (provider === "brevo") return { configured: true, provider, verified: null };
  const tx = getTransporter();
  try {
    await tx.verify();
    return { configured: true, provider, verified: true };
  } catch (err) {
    return { configured: true, provider, verified: false, error: String(err?.message ?? err).slice(0, 160) };
  }
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

  const provider = activeEmailProvider();
  let delivery;
  if (provider === "brevo") {
    delivery = await sendViaBrevo(to, subject, text);
  } else if (provider === "smtp") {
    delivery = await sendViaSmtp(to, subject, text);
    // Some hosts (e.g. Render free tier) block outbound SMTP entirely — if a
    // Brevo key is configured as backup, use it before giving up.
    if (!delivery.sent && process.env.BREVO_API_KEY) {
      delivery = await sendViaBrevo(to, subject, text);
    }
  } else {
    console.log(`[auth] (no email provider) OTP for ${to} [${purpose}]: ${code}`);
    return { sent: false };
  }
  if (!delivery.sent) {
    console.error(`[auth] Email send failed (${provider}):`, delivery.error);
    console.log(`[auth] (send failed) OTP for ${to} [${purpose}]: ${code}`);
  }
  return delivery;
}
