import "dotenv/config";
import express from "express";
import cors from "cors";
import { supabase } from "./supabase.js";
import { asyncHandler } from "./asyncHandler.js";
import authRoutes from "./routes/auth.js";
import complaintsRoutes from "./routes/complaints.js";
import leaderboardRoutes from "./routes/leaderboard.js";
import { startEscalationCron, runEscalationSweep } from "./escalation.js";

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

app.get("/health", (req, res) => res.json({ ok: true, time: new Date().toISOString(), db: "supabase" }));
app.get("/departments", asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from("departments").select("*");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data ?? []);
}));

app.use("/auth", authRoutes);
app.use("/complaints", complaintsRoutes);
app.use("/leaderboard", leaderboardRoutes);

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
