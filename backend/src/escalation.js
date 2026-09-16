import { nanoid } from "nanoid";
import { supabase } from "./supabase.js";
import { appendStatusEvent } from "./hashchain.js";
import { anchorStatusEvent, isOnchainEnabled } from "./onchain.js";
import { bumpPriority } from "./dedup.js";

// Stale thresholds, in ms. Kept short here (minutes) so it's demoable live;
// swap for the real 7-day / 1-2 day figures from the spec before shipping.
const THRESHOLDS_MS = {
  very_urgent: 2 * 60 * 1000, // demo: 2 min. spec: 1-2 days
  urgent: 4 * 60 * 1000,      // demo: 4 min. spec: ~1 week
  normal: 6 * 60 * 1000,      // demo: 6 min. spec: 7 days
};

export async function runEscalationSweep() {
  const now = Date.now();
  const { data: openComplaints, error } = await supabase
    .from("complaints")
    .select("*")
    .not("status", "in", "(RESOLVED,DISPUTED)");
  if (error) {
    console.error("Escalation sweep failed:", error.message);
    return;
  }

  for (const c of openComplaints ?? []) {
    try {
      const stalledMs = now - new Date(c.last_action_at).getTime();
      const threshold = THRESHOLDS_MS[c.priority] ?? THRESHOLDS_MS.normal;
      if (stalledMs < threshold) continue;

      const newPriority = c.priority === "very_urgent" ? "very_urgent" : bumpPriority(c.priority);
      const nowIso = new Date().toISOString();

      const { error: updateError } = await supabase
        .from("complaints")
        .update({ priority: newPriority, last_action_at: nowIso })
        .eq("id", c.id);
      if (updateError) {
        console.error("Escalation update failed:", updateError.message);
        continue;
      }

      const escEvent = await appendStatusEvent({
        complaintId: c.id,
        fromStatus: c.status,
        toStatus: c.status,
        actorId: null,
        actorRole: "system",
        note: `Auto-escalated: no action for ${Math.round(stalledMs / 60000)} min, priority ${c.priority} -> ${newPriority}`,
      });
      // Additive anchor, fire-and-forget — never blocks escalation.
      if (isOnchainEnabled()) {
        anchorStatusEvent({ complaintId: c.id, trackingCode: c.tracking_code, fromStatus: c.status, toStatus: c.status, thisHash: escEvent?.thisHash }).catch(() => {});
      }

      if (c.department_id) {
        await supabase.from("notifications").insert({
          id: nanoid(),
          department_id: c.department_id,
          complaint_id: c.id,
          message: `Complaint ${c.tracking_code} escalated to ${newPriority} — no action taken.`,
          created_at: nowIso,
        });
      }
    } catch (e) {
      // One bad row must not stop the sweep for the rest.
      console.error(`Escalation failed for complaint ${c.id}:`, e.message);
    }
  }
}

// Runs every 30s so the demo can visibly escalate mid-presentation.
export function startEscalationCron() {
  setInterval(() => {
    runEscalationSweep().catch((e) => console.error("Escalation sweep failed:", e.message));
  }, 30 * 1000);
  console.log("Escalation cron started (checks every 30s)");
}
