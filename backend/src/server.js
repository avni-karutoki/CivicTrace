import "dotenv/config";
import express from "express";
import cors from "cors";
import { supabase } from "./supabase.js";
import { asyncHandler } from "./asyncHandler.js";
import authRoutes from "./routes/auth.js";
import complaintsRoutes from "./routes/complaints.js";
import leaderboardRoutes from "./routes/leaderboard.js";
import aiRoutes from "./routes/ai.js";
import { startEscalationCron, runEscalationSweep } from "./escalation.js";
import { isOnchainEnabled, explorerTxUrl } from "./onchain.js";

const app = express();
// CORS: allow local dev by default + any origins in FRONTEND_URL (comma-separated).
// Set FRONTEND_URL in backend .env to your deployed frontend URL to avoid CORS blocks.
const allowedOrigins = [
  "http://localhost:8443",
  "http://localhost:5173",
  "http://localhost:3000",
  ...(process.env.FRONTEND_URL ?? "").split(",").map((s) => s.trim()).filter(Boolean),
];
app.use(
  cors({
    origin: (origin, cb) => {
      // Allow non-browser clients (curl, mobile, no Origin header)
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS blocked for origin ${origin}`));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "x-user-id"],
  })
);
app.use(express.json({ limit: "15mb" })); // photos come in as base64 data URLs

// Seed departments if empty, so the leaderboard/dashboard aren't blank on first run.
async function ensureSeeded() {
  const { count, error } = await supabase
    .from("departments")
    .select("id", { count: "exact", head: true });
  if (error) {
    console.error("Seed check failed:", error.message);
    return;
  }
  if ((count ?? 0) === 0) {
    const seed = [
      { id: "dept_roads", name: "Roads & Infrastructure", category: "pothole" },
      { id: "dept_sanitation", name: "Sanitation", category: "garbage" },
      { id: "dept_parks", name: "Parks & Trees", category: "fallen_tree" },
      { id: "dept_water", name: "Water Supply", category: "water_leak" },
    ];
    const { error: insertError } = await supabase.from("departments").insert(seed);
    if (insertError) console.error("Seed failed:", insertError.message);
    else console.log("Seeded departments:", seed.map((s) => s.name).join(", "));
  }
}

app.get("/health", asyncHandler(async (req, res) => {
  // Diagnostic: reports which Supabase host the deployed instance is pointed
  // at (host only — never the key) plus a live minimal REST probe, so a
  // misconfigured URL/placeholder key shows up as a precise message instead
  // of a raw server-side "TypeError: fetch failed" on the first login.
  let supabaseUrlHost = "(missing)";
  try {
    if (process.env.SUPABASE_URL) supabaseUrlHost = new URL(process.env.SUPABASE_URL).host;
  } catch {
    supabaseUrlHost = "(unparseable — not a valid URL)";
  }

  let probe = { status: "skipped", detail: "no Supabase URL" };
  if (supabaseUrlHost && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const r = await fetch(`${process.env.SUPABASE_URL}/rest/v1/departments?select=id&limit=1`, {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        signal: AbortSignal.timeout(8000),
      });
      probe = r.ok
        ? { status: "ok", detail: `supabase responded ${r.status}` }
        : { status: "error", detail: `supabase responded ${r.status} ${r.statusText}` };
    } catch (e) {
      probe = { status: "error", detail: e?.cause?.code || e?.message?.slice(0, 120) || "fetch failed" };
    }
  }

  res.json({
    ok: true,
    time: new Date().toISOString(),
    db: "supabase",
    supabaseUrlHost,
    supabaseKeyConfigured: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    supabaseKeyType: (() => {
      const k = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
      if (!k) return "(missing)";
      if (k.startsWith("sb_secret_")) return "sb_secret (correct — server-role secret), length " + k.length;
      if (k.startsWith("sb_publishable")) return "sb_publishable (WRONG — public key, Supabase will 401)";
      if (k.startsWith("eyJ")) return "legacy JWT (check it is the service_role one, not anon)";
      if (/paste|your|example|placeholder|…/i.test(k)) return "(placeholder text — paste the real key)";
      return `unknown format (starts with "${k.slice(0, 6)}…", length ${k.length})`;
    })(),
    supabaseProbe: probe,
  });
}));

// Additive Web3 status — no effect on existing routes when disabled.
app.get("/onchain/status", (req, res) => {
  const enabled = isOnchainEnabled();
  res.json({
    enabled,
    chainId: enabled ? Number(process.env.CHAIN_ID || 0) || null : null,
    contract: enabled ? process.env.CONTRACT_ADDRESS : null,
    explorer: enabled ? (process.env.EXPLORER_URL || null) : null,
  });
});
app.get("/departments", asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from("departments").select("*");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data ?? []);
}));

app.use("/auth", authRoutes);
app.use("/complaints", complaintsRoutes);
app.use("/leaderboard", leaderboardRoutes);
app.use("/ai", aiRoutes);

// Manually trigger an escalation sweep (handy for demoing without waiting 30s)
app.post("/admin/run-escalation", asyncHandler(async (req, res) => {
  await runEscalationSweep();
  res.json({ ok: true });
}));

app.get("/notifications", asyncHandler(async (req, res) => {
  const { department_id } = req.query;
  let query = supabase.from("notifications").select("*").order("created_at", { ascending: false });
  if (department_id) query = query.eq("department_id", department_id);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data ?? []);
}));

// Must be last: catches async errors + CORS rejections as JSON instead of hangs/HTML.
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  const status = err.message?.startsWith("CORS blocked") ? 403 : 500;
  res.status(status).json({ error: err.message ?? "Internal server error" });
});

const PORT = process.env.PORT || 4000;
ensureSeeded().then(() => {
  app.listen(PORT, () => {
    console.log(`CivicTrace backend (Supabase) listening on http://localhost:${PORT}`);
    startEscalationCron();
  });
});
