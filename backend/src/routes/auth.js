import { Router } from "express";
import { nanoid } from "nanoid";
import { supabase } from "../supabase.js";
import { asyncHandler } from "../asyncHandler.js";

const router = Router();

// POST /auth/login  { name, contact, role }
// contact = phone or email. No password/OTP — hackathon-scope identity, not production auth.
router.post("/login", asyncHandler(async (req, res) => {
  const { name, contact, role } = req.body;
  if (!name || !contact) {
    return res.status(400).json({ error: "name and contact (phone/email) are required" });
  }

  const { data: existing, error: lookupError } = await supabase
    .from("users")
    .select("*")
    .eq("contact", contact)
    .maybeSingle();
  if (lookupError) return res.status(500).json({ error: lookupError.message });

  let user = existing;
  if (!user) {
    const id = nanoid();
    const { error: insertError } = await supabase.from("users").insert({
      id,
      name,
      contact,
      role: role === "authority" ? "authority" : "citizen",
      created_at: new Date().toISOString(),
    });
    // Race: two simultaneous first-logins with the same contact — unique
    // violation means the other request won; fall through to re-fetch below.
    if (insertError && insertError.code !== "23505") {
      return res.status(500).json({ error: insertError.message });
    }

    const { data: created, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("contact", contact)
      .single();
    if (fetchError) return res.status(500).json({ error: fetchError.message });
    user = created;
  }

  // "Token" is just the user id for this prototype — swap for real JWT/session before real deployment.
  res.json({ token: user.id, user: { id: user.id, name: user.name, role: user.role } });
}));

export default router;
