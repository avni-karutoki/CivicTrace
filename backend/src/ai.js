// ─── Gemini photo description (additive, optional) ───────────────────────────
// Turns a complaint photo into 1–2 factual sentences for the
// "Additional Note" box. The frontend always keeps the box editable.
//
// Setup: set GEMINI_API_KEY (https://aistudio.google.com/apikey).
// Optional: GEMINI_MODEL (default "gemini-2.5-flash").
// Without a key the endpoint answers 503 and the UI just skips AI.

const DEFAULT_MODEL = "gemini-3.5-flash";
const MAX_B64_CHARS = 6_000_000; // ~4.5MB of image bytes; Gemini inline limit is 20MB total
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

export function isAiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY);
}

function parseDataUrl(dataUrl) {
  if (typeof dataUrl !== "string") return null;
  const m = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/);
  if (!m) return null;
  return { mimeType: m[1].toLowerCase(), b64: m[2] };
}

function extractText(resp) {
  const parts = resp?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return "";
  return parts
    .map((p) => (typeof p?.text === "string" ? p.text : ""))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Describe a civic-issue photo. Never throws — returns { ok, description? , error? }.
 */
export async function describeComplaintPhoto({ dataUrl, categoryLabel }) {
  if (!isAiConfigured()) {
    return { ok: false, status: 503, code: "AI_DISABLED", error: "Photo description is not configured (missing GEMINI_API_KEY)." };
  }
  const parsed = parseDataUrl(dataUrl);
  if (!parsed) {
    return { ok: false, status: 400, error: "Photo must be a base64 data URL (jpeg/png/webp)." };
  }
  if (!ALLOWED_MIME.has(parsed.mimeType)) {
    return { ok: false, status: 400, error: `Unsupported photo type "${parsed.mimeType}". Use jpeg, png or webp.` };
  }
  if (parsed.b64.length > MAX_B64_CHARS) {
    return { ok: false, status: 413, error: "Photo is too large for AI description. Please use a smaller image." };
  }

  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const hint = categoryLabel ? ` Category hint: ${categoryLabel}.` : "";
  // NOTE: keep this prompt short — long instructions make Gemini 3.x "think"
  // much longer (thoughtsTokenCount eats time AND output budget).
  const prompt =
    "Describe the civic issue in this photo in 1-2 short sentences (what and where)." +
    " If none is visible, briefly describe the scene instead. Max 40 words." +
    hint;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000);
  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { inline_data: { mime_type: parsed.mimeType, data: parsed.b64 } },
                { text: prompt },
              ],
            },
          ],
          // NOTE: Gemini 3.x spends "thinking" tokens from the same output
          // budget (thoughtsTokenCount counts toward maxOutputTokens), so keep
          // this generous or descriptions get cut mid-sentence (MAX_TOKENS).
          generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
        }),
      }
    );
    const body = await r.json().catch(() => null);
    if (!r.ok) {
      const msg = body?.error?.message || `Gemini request failed (${r.status})`;
      const status = r.status === 400 || r.status === 401 || r.status === 403 ? 502 : 502;
      return { ok: false, status, code: "AI_UPSTREAM", error: msg.slice(0, 300) };
    }
    const text = extractText(body);
    if (!text) {
      return { ok: false, status: 502, code: "AI_EMPTY", error: "The AI returned no description. Please type the note yourself." };
    }
    return { ok: true, description: text.slice(0, 500) };
  } catch (e) {
    const msg = e?.name === "AbortError" ? "The AI took too long. Please type the note yourself." : (e?.message || "AI request failed");
    return { ok: false, status: 502, code: "AI_UPSTREAM", error: String(msg).slice(0, 300) };
  } finally {
    clearTimeout(timer);
  }
}
