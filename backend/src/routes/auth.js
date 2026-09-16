import { Router } from "express";
import crypto from "node:crypto";
import { nanoid } from "nanoid";
import { supabase } from "../supabase.js";
import { asyncHandler } from "../asyncHandler.js";

const router = Router();

// scrypt password hashing (stdlib only, no new deps). Stored as "scrypt$salt$hash".
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

function verifyPassword(password, stored) {
  try {
    if (!stored || typeof stored !== "string") return false;
    const [algo, salt, hash] = stored.split("$");
    if (algo !== "scrypt" || !salt || !hash) return false;
    const derived = crypto.scryptSync(password, salt, 64).toString("hex");
    return crypto.timingSafeEqual(Buffer.from(derived, "hex"), Buffer.from(hash, "hex"));
  } catch {
    return false;
  }
}

// POST /auth/login  { name, contact, role?, password }
// Password-verified auth. New contacts sign up (name + password required);
// returning users must present the correct password. Legacy rows created
// before passwords existed have password_hash NULL — the first login with a
// password claims the account by setting its hash (one-time).
router.post("/login", asyncHandler(async (req, res) => {
  const { name, contact, role, password } = req.body;
  if (!contact) {
    return res.status(400).json({ error: "contact (email) is required" });
  }
  if (!password || String(password).length < 6) {
    return res.status(400).json({ error: "password of at least 6 characters is required" });
  }

  const { data: existing, error: lookupError } = await supabase
    .from("users")
    .select("*")
    .eq("contact", contact)
    .maybeSingle();
  if (lookupError) return res.status(500).json({ error: lookupError.message });

  let user = existing;
  if (!user) {
    if (!name) {
      return res.status(400).json({ error: "name is required to create an account" });
    }
    const id = nanoid();
    const { error: insertError } = await supabase.from("users").insert({
      id,
      name,
      contact,
      role: role === "authority" ? "authority" : "citizen",
      password_hash: hashPassword(String(password)),
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

  if (existing) {
    if (!user.password_hash) {
      // Legacy account (created before passwords): claim it by setting the
      // hash from this login's password. One-time — verified after this.
      const { error: claimError } = await supabase
        .from("users")
        .update({ password_hash: hashPassword(String(password)) })
        .eq("id", user.id);
      if (claimError) return res.status(500).json({ error: claimError.message });
      user = { ...user, password_hash: "set" };
    } else if (!verifyPassword(String(password), user.password_hash)) {
      return res.status(401).json({ error: "Incorrect password for this email." });
    }
  }

  // Returning user: refresh the stored display name ONLY when a real name was
  // typed (signup form). The citizen login form sends contact as name — that
  // must NEVER overwrite the stored name, otherwise every login corrupts the
  // greeting to show the email/phone instead of the citizen's name.
  // Role is intentionally NOT touched here — the citizen form always sends
  // role "citizen" and must never demote authorities.
  if (existing && name && name !== user.name && name !== contact) {
    const { error: renameError } = await supabase
      .from("users")
      .update({ name })
      .eq("id", user.id);
    if (!renameError) user = { ...user, name };
  }

  // "Token" is just the user id for this prototype — swap for real JWT/session before real deployment.
  res.json({ token: user.id, user: { id: user.id, name: user.name, role: user.role } });
}));

export default router;
