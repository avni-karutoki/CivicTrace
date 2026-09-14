import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Copy .env.example to .env and fill in values from Supabase Studio > Project Settings > API."
  );
  process.exit(1);
}

// Backend client: service_role bypasses RLS. Hidden identity
// (complainant_id stripping) is still enforced in route code,
// exactly as it was with SQLite.
export const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false },
});
