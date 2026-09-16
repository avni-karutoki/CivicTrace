import { useState, useEffect, useRef } from "react";
import { useCivic, useLiveComplaints, useLiveLeaderboard, useLiveMyComplaints, useLiveNotifications, useLiveVerification } from "./store";
import { PageTransition, Reveal, AnimatedNumber } from "./motion";
import { api, CATEGORY_LABELS, PRIORITY_UI, STATUS_UI, timeAgo, daysOpen, toCardComplaint } from "./api/civictrace";
import { getOnchainStatus } from "./api/onchain";
import type { BackendComplaint } from "./api/civictrace";

// ─── Page Router ─────────────────────────────────────────────────────────────
type Page = "home" | "auth" | "dashboard" | "report-category" | "report-evidence" | "report-details" | "complaint-submitted" | "my-complaints" | "complaint-detail" | "proof-of-fix" | "civic-map" | "public-record" | "verification" | "leaderboard" | "dept-trust" | "impact-dashboard" | "about" | "how-it-works" | "authority-login" | "authority-dashboard" | "authority-complaint-queue" | "authority-complaint-detail" | "authority-escalations";

// ─── Civic Illustration (Left Panel) ─────────────────────────────────────────
function CivicIllustration() {
  return (
    <svg width="100%" viewBox="0 0 480 560" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ maxWidth: 420 }}>
      {/* Parchment ground */}
      <rect width="480" height="560" fill="#EDE5D4" rx="2"/>

      {/* Outer decorative border */}
      <rect x="12" y="12" width="456" height="536" rx="1" stroke="#C8B89A" strokeWidth="1" fill="none"/>
      <rect x="18" y="18" width="444" height="524" rx="1" stroke="#C8B89A" strokeWidth="0.5" strokeDasharray="6,4" fill="none"/>

      {/* Street / ground */}
      <rect x="0" y="380" width="480" height="180" fill="#D6C9B0" opacity="0.6"/>
      <line x1="0" y1="380" x2="480" y2="380" stroke="#C8B89A" strokeWidth="1"/>

      {/* Road lane markings */}
      <line x1="240" y1="385" x2="240" y2="560" stroke="#F5F0E8" strokeWidth="2" strokeDasharray="14,10"/>

      {/* Building left */}
      <rect x="30" y="220" width="120" height="160" fill="#CBBC9F" stroke="#C8B89A" strokeWidth="1"/>
      <rect x="40" y="230" width="30" height="40" fill="#EDE5D4" stroke="#C8B89A" strokeWidth="0.75"/>
      <rect x="80" y="230" width="30" height="40" fill="#EDE5D4" stroke="#C8B89A" strokeWidth="0.75"/>
      <rect x="40" y="280" width="30" height="40" fill="#EDE5D4" stroke="#C8B89A" strokeWidth="0.75"/>
      <rect x="80" y="280" width="30" height="40" fill="#EDE5D4" stroke="#C8B89A" strokeWidth="0.75"/>
      <rect x="60" y="330" width="30" height="50" fill="#D6C9B0" stroke="#C8B89A" strokeWidth="0.75"/>
      {/* Building sign */}
      <rect x="36" y="345" width="78" height="14" rx="1" fill="#EDE5D4" stroke="#C8B89A" strokeWidth="0.5"/>
      <line x1="46" y1="351" x2="106" y2="351" stroke="#C8B89A" strokeWidth="1"/>

      {/* Building right */}
      <rect x="330" y="240" width="110" height="140" fill="#C9BDA2" stroke="#C8B89A" strokeWidth="1"/>
      <rect x="340" y="250" width="25" height="35" fill="#EDE5D4" stroke="#C8B89A" strokeWidth="0.75"/>
      <rect x="375" y="250" width="25" height="35" fill="#EDE5D4" stroke="#C8B89A" strokeWidth="0.75"/>
      <rect x="340" y="295" width="25" height="35" fill="#EDE5D4" stroke="#C8B89A" strokeWidth="0.75"/>
      <rect x="375" y="295" width="25" height="35" fill="#EDE5D4" stroke="#C8B89A" strokeWidth="0.75"/>
      <rect x="358" y="340" width="26" height="40" fill="#D6C9B0" stroke="#C8B89A" strokeWidth="0.75"/>

      {/* Streetlight */}
      <rect x="290" y="310" width="4" height="70" fill="#5C4A32"/>
      <path d="M294 316 Q310 308 310 322" stroke="#5C4A32" strokeWidth="3" fill="none"/>
      <circle cx="310" cy="323" r="4" fill="#B8872A" opacity="0.8"/>

      {/* Pothole on road */}
      <ellipse cx="340" cy="430" rx="28" ry="12" fill="#C8B89A" opacity="0.6" stroke="#A09070" strokeWidth="1"/>
      <ellipse cx="340" cy="430" rx="18" ry="7" fill="#B8A888" opacity="0.5"/>

      {/* Citizen figure */}
      {/* Body */}
      <ellipse cx="220" cy="345" rx="22" ry="30" fill="#D6C9B0" stroke="#5C4A32" strokeWidth="1.5"/>
      {/* Head */}
      <circle cx="220" cy="308" r="18" fill="#E8D8C0" stroke="#5C4A32" strokeWidth="1.5"/>
      {/* Hat */}
      <ellipse cx="220" cy="294" rx="22" ry="5" fill="#5C4A32"/>
      <rect x="208" y="279" width="24" height="16" rx="2" fill="#5C4A32"/>
      {/* Arms */}
      <path d="M198 330 Q185 320 178 315" stroke="#5C4A32" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      <path d="M242 328 Q255 325 262 320" stroke="#5C4A32" strokeWidth="2.5" strokeLinecap="round" fill="none"/>

      {/* Phone/device in hand */}
      <rect x="258" y="310" width="18" height="28" rx="2" fill="#EDE5D4" stroke="#1C0A00" strokeWidth="1.5"/>
      <rect x="261" y="314" width="12" height="16" fill="#D6C9B0" opacity="0.8"/>
      {/* Camera icon on phone */}
      <circle cx="267" cy="322" r="3" stroke="#9B3A3A" strokeWidth="1" fill="none"/>
      <circle cx="267" cy="322" r="1.2" fill="#9B3A3A" opacity="0.6"/>

      {/* Legs */}
      <rect x="208" y="372" width="10" height="20" rx="2" fill="#5C4A32"/>
      <rect x="222" y="372" width="10" height="20" rx="2" fill="#5C4A32"/>
      <rect x="206" y="390" width="14" height="8" rx="1" fill="#3D1F00"/>
      <rect x="220" y="390" width="14" height="8" rx="1" fill="#3D1F00"/>

      {/* Report bubble floating up */}
      <rect x="268" y="265" width="130" height="72" rx="3" fill="#FAF7F2" stroke="#C8B89A" strokeWidth="1"/>
      <path d="M268 290 L255 295 L268 300" fill="#FAF7F2" stroke="#C8B89A" strokeWidth="1"/>
      {/* Record content in bubble */}
      <rect x="278" y="275" width="40" height="5" rx="1" fill="#C8B89A"/>
      <rect x="278" y="285" width="110" height="3" rx="1" fill="#EDE5D4"/>
      <rect x="278" y="292" width="90" height="3" rx="1" fill="#EDE5D4"/>
      <rect x="278" y="299" width="100" height="3" rx="1" fill="#EDE5D4"/>
      {/* Status indicator */}
      <circle cx="284" cy="322" r="4" fill="#9B3A3A"/>
      <rect x="293" y="319" width="50" height="3" rx="1" fill="#EDE5D4"/>
      <rect x="293" y="325" width="36" height="3" rx="1" fill="#EDE5D4"/>

      {/* Chain/hash links floating */}
      <rect x="60" y="180" width="36" height="16" rx="8" stroke="#3A6B9B" strokeWidth="1.5" fill="none"/>
      <rect x="84" y="180" width="36" height="16" rx="8" stroke="#4A7C5F" strokeWidth="1.5" fill="none"/>
      <text x="68" y="191" fontFamily="monospace" fontSize="7" fill="#3A6B9B" opacity="0.7">0x4f</text>
      <text x="92" y="191" fontFamily="monospace" fontSize="7" fill="#4A7C5F" opacity="0.7">a7c2</text>

      {/* Floating record document */}
      <rect x="340" y="155" width="90" height="110" rx="1" fill="#FAF7F2" stroke="#C8B89A" strokeWidth="1" style={{ filter: "drop-shadow(2px 3px 6px rgba(28,10,0,0.1))" }}/>
      <rect x="340" y="155" width="90" height="18" rx="1" fill="#EDE5D4" stroke="#C8B89A" strokeWidth="1"/>
      <text x="385" y="167" textAnchor="middle" fontFamily="monospace" fontSize="7" fill="#5C4A32" letterSpacing="1">RECORD</text>
      <rect x="350" y="183" width="50" height="3" rx="1" fill="#C8B89A"/>
      <rect x="350" y="191" width="70" height="2" rx="1" fill="#EDE5D4"/>
      <rect x="350" y="197" width="60" height="2" rx="1" fill="#EDE5D4"/>
      <rect x="350" y="203" width="68" height="2" rx="1" fill="#EDE5D4"/>
      <rect x="350" y="209" width="55" height="2" rx="1" fill="#EDE5D4"/>
      <rect x="350" y="218" width="30" height="8" rx="1" fill="#4A7C5F" opacity="0.2"/>
      <rect x="350" y="218" width="30" height="8" rx="1" fill="none" stroke="#4A7C5F" strokeWidth="0.75"/>
      <text x="365" y="225" textAnchor="middle" fontFamily="monospace" fontSize="6" fill="#4A7C5F">VERIFIED</text>
      <rect x="350" y="232" width="70" height="2" rx="1" fill="#EDE5D4"/>
      <rect x="350" y="238" width="60" height="2" rx="1" fill="#EDE5D4"/>
      {/* Checkmark seal */}
      <circle cx="405" cy="248" r="10" fill="#EDE5D4" stroke="#C8B89A" strokeWidth="1"/>
      <path d="M400 248 L403 251 L410 244" stroke="#4A7C5F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>

      {/* Decorative corner ornaments */}
      <path d="M30 30 L30 42 M30 30 L42 30" stroke="#C8B89A" strokeWidth="1"/>
      <path d="M450 30 L450 42 M450 30 L438 30" stroke="#C8B89A" strokeWidth="1"/>
      <path d="M30 530 L30 518 M30 530 L42 530" stroke="#C8B89A" strokeWidth="1"/>
      <path d="M450 530 L450 518 M450 530 L438 530" stroke="#C8B89A" strokeWidth="1"/>

      {/* Bottom caption */}
      <text x="240" y="548" textAnchor="middle" fontFamily="monospace" fontSize="8" fill="#5C4A32" opacity="0.5" letterSpacing="2">EVERY COMPLAINT · A VERIFIED RECORD</text>
    </svg>
  );
}

// ─── Auth Page ────────────────────────────────────────────────────────────────
function AuthPage({ onBack, onSuccess }: { onBack: () => void; onSuccess?: () => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [method, setMethod] = useState<"email" | "phone">("email");
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [showPass, setShowPass] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [loginErr, setLoginErr] = useState("");
  const civic = useCivic();
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  function handleOtpChange(val: string, i: number) {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    if (val && i < 5) otpRefs.current[i + 1]?.focus();
  }

  function handleOtpKey(e: React.KeyboardEvent, i: number) {
    if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  }

  async function handleContinue() {
    if (method === "phone" && step === "credentials") {
      setLoading(true);
      setTimeout(() => { setLoading(false); setStep("otp"); setSent(true); }, 900);
      return;
    }
    setLoading(true);
    setLoginErr("");
    const contact = method === "email" ? email.trim() : phone.trim();
    if (mode === "signup" && !name.trim()) {
      setLoading(false);
      setLoginErr("Please enter your full name to create an account.");
      return;
    }
    // Signup sends the typed name (stored once); login sends contact as name
    // which the backend ignores for existing users, preserving stored names.
    const displayName = mode === "signup" ? name.trim() : contact || "Citizen";
    // Best-effort backend login (demo auth, no OTP server-side). Always
    // continue so the demo works even when the backend is unreachable.
    const ok = await civic.login(displayName, contact || "guest@civictrace.local", "citizen").catch(() => false);
    setLoading(false);
    if (!ok) setLoginErr("Backend unreachable — continuing offline. Reports will not be saved.");
    onSuccess?.();
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    border: "1px solid #C8B89A",
    borderRadius: "1px",
    background: "#FAF7F2",
    color: "#1C0A00",
    fontFamily: "var(--font-body)",
    fontSize: "0.875rem",
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontFamily: "var(--font-mono)",
    fontSize: "0.65rem",
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
    color: "#5C4A32",
    opacity: 0.6,
    marginBottom: "6px",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F5F0E8", fontFamily: "var(--font-body)" }}>
      {/* Top bar */}
      <div className="border-b px-6 py-4 flex items-center justify-between" style={{ borderColor: "#C8B89A", background: "rgba(245,240,232,0.97)" }}>
        <button onClick={onBack} className="flex items-center gap-2 transition-opacity hover:opacity-70"
          style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#5C4A32" }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2 L4 7 L9 12" stroke="#5C4A32" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to CivicTrace
        </button>
        <div className="flex items-center gap-2">
          <CivicTraceLogo size={24}/>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.95rem", color: "#1C0A00" }}>CivicTrace</span>
        </div>
        <div style={{ width: 140 }}/>
      </div>

      {/* Two-column layout */}
      <div className="flex min-h-[calc(100vh-57px)]">

        {/* LEFT — Illustration panel */}
        <div className="hidden lg:flex flex-col items-center justify-center flex-1 relative overflow-hidden border-r px-12 py-16"
          style={{ borderColor: "#C8B89A", background: "#EDE5D4" }}>

          {/* Decorative header text */}
          <div className="absolute top-8 left-0 right-0 text-center">
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.4 }}>
              Civic Record Office · Est. 2026
            </div>
          </div>

          {/* Thin decorative rule */}
          <div className="absolute top-14 left-12 right-12 flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: "#C8B89A" }}/>
            <div className="w-1 h-1 rotate-45" style={{ background: "#C8B89A" }}/>
            <div className="flex-1 h-px" style={{ background: "#C8B89A" }}/>
          </div>

          <CivicIllustration/>

          {/* Caption below illustration */}
          <div className="text-center mt-8 max-w-xs">
            <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "1.1rem", color: "#1C0A00", lineHeight: 1.5 }}>
              "A complaint can be ignored.<br/>A verified record cannot."
            </div>
            <div className="flex items-center gap-3 mt-4">
              <div className="flex-1 h-px" style={{ background: "#C8B89A" }}/>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.5 }}>CivicTrace</div>
              <div className="flex-1 h-px" style={{ background: "#C8B89A" }}/>
            </div>
          </div>

          {/* Status strip */}
          <div className="absolute bottom-8 left-12 right-12 flex justify-center gap-6">
            {[["14,280", "Reports Filed"], ["91%", "Resolved"], ["On-chain", "Verified"]].map(([val, label]) => (
              <div key={label} className="text-center">
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", color: "#1C0A00" }}>{val}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.5 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — Auth card */}
        <div className="flex flex-col items-center justify-center flex-1 px-6 py-12">
          <div className="w-full" style={{ maxWidth: 420 }}>

            {/* Card */}
            <div className="border relative" style={{ background: "#FAF7F2", borderColor: "#C8B89A", borderRadius: "2px" }}>
              {/* Corner notch */}
              <div className="absolute top-0 right-0 w-8 h-8 border-l border-b" style={{ borderColor: "#C8B89A" }}/>

              <div className="p-8">
                {/* Logo + heading */}
                <div className="flex items-center gap-3 mb-6">
                  <CivicTraceLogo size={32}/>
                  <div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.5 }}>
                      Citizen Portal
                    </div>
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.1rem", color: "#1C0A00" }}>
                      Welcome to CivicTrace
                    </div>
                  </div>
                </div>

                {/* Thin rule */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex-1 h-px" style={{ background: "#C8B89A" }}/>
                  <div className="w-1 h-1 rotate-45" style={{ background: "#C8B89A" }}/>
                  <div className="flex-1 h-px" style={{ background: "#C8B89A" }}/>
                </div>

                {/* Subheading */}
                <p className="mb-6" style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "#5C4A32", lineHeight: 1.6 }}>
                  Report civic issues. Track what happens next. Verify the outcome.
                </p>

                {/* Mode toggle */}
                <div className="flex border mb-6" style={{ borderColor: "#C8B89A", borderRadius: "1px" }}>
                  {(["login", "signup"] as const).map(m => (
                    <button key={m} onClick={() => { setMode(m); setStep("credentials"); setOtp(["","","","","",""]); }}
                      className="flex-1 py-2 transition-colors"
                      style={{
                        fontFamily: "var(--font-mono)", fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase",
                        background: mode === m ? "#1C0A00" : "transparent",
                        color: mode === m ? "#F5F0E8" : "#5C4A32",
                        borderRadius: "0px",
                      }}>
                      {m === "login" ? "Sign In" : "Create Account"}
                    </button>
                  ))}
                </div>

                {/* Method selector */}
                <div className="flex gap-2 mb-5">
                  {(["email", "phone"] as const).map(m => (
                    <button key={m} onClick={() => { setMethod(m); setStep("credentials"); setOtp(["","","","","",""]); setSent(false); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 border transition-colors"
                      style={{
                        fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase",
                        borderColor: method === m ? "#1C0A00" : "#C8B89A",
                        background: method === m ? "#F5F0E8" : "transparent",
                        color: method === m ? "#1C0A00" : "#5C4A32",
                        borderRadius: "1px",
                      }}>
                      {m === "email" ? (
                        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                          <rect x="1" y="2.5" width="9" height="6" rx="1" stroke="currentColor" strokeWidth="1"/>
                          <path d="M1 3.5 L5.5 6.5 L10 3.5" stroke="currentColor" strokeWidth="1"/>
                        </svg>
                      ) : (
                        <svg width="10" height="11" viewBox="0 0 10 11" fill="none">
                          <rect x="1.5" y="1" width="7" height="9" rx="1.5" stroke="currentColor" strokeWidth="1"/>
                          <circle cx="5" cy="8.5" r="0.75" fill="currentColor"/>
                        </svg>
                      )}
                      {m === "email" ? "Email" : "Phone"}
                    </button>
                  ))}
                </div>

                {/* Fields */}
                <div className="space-y-4">
                  {mode === "signup" && (
                    <div>
                      <label style={labelStyle}>Full Name</label>
                      <input style={inputStyle} placeholder="Your name" value={name} onChange={e => setName(e.target.value)}/>
                    </div>
                  )}

                  {step === "credentials" && (
                    <>
                      <div>
                        <label style={labelStyle}>{method === "email" ? "Email Address" : "Phone Number"}</label>
                        {method === "email" ? (
                          <input type="email" style={inputStyle} placeholder="you@example.com"
                            value={email} onChange={e => setEmail(e.target.value)}/>
                        ) : (
                          <div className="flex gap-2">
                            <div className="flex items-center px-3 border" style={{ borderColor: "#C8B89A", background: "#F0E8D8", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "#5C4A32" }}>
                              +91
                            </div>
                            <input type="tel" style={{ ...inputStyle, flex: 1 }} placeholder="98765 43210"
                              value={phone} onChange={e => setPhone(e.target.value)}/>
                          </div>
                        )}
                      </div>

                      {method === "email" && (
                        <div>
                          <label style={labelStyle}>Password</label>
                          <div className="relative">
                            <input type={showPass ? "text" : "password"} style={{ ...inputStyle, paddingRight: "40px" }}
                              placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}/>
                            <button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-70 transition-opacity">
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                {showPass
                                  ? <><path d="M1 8 C3 4 13 4 15 8 C13 12 3 12 1 8" stroke="#1C0A00" strokeWidth="1.2"/><circle cx="8" cy="8" r="2" stroke="#1C0A00" strokeWidth="1.2"/></>
                                  : <><path d="M1 8 C3 4 13 4 15 8 C13 12 3 12 1 8" stroke="#1C0A00" strokeWidth="1.2"/><circle cx="8" cy="8" r="2" stroke="#1C0A00" strokeWidth="1.2"/><path d="M2 2 L14 14" stroke="#1C0A00" strokeWidth="1.2"/></>
                                }
                              </svg>
                            </button>
                          </div>
                          {mode === "login" && (
                            <button className="mt-1.5 opacity-50 hover:opacity-80 transition-opacity"
                              style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.08em", color: "#3A6B9B", display: "block", marginLeft: "auto" }}>
                              Forgot password?
                            </button>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {/* OTP Step */}
                  {step === "otp" && (
                    <div>
                      <label style={labelStyle}>Verification Code</label>
                      <div style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", color: "#5C4A32", marginBottom: "12px", opacity: 0.7 }}>
                        We sent a 6-digit code to {phone || "your phone"}
                      </div>
                      <div className="flex gap-2">
                        {otp.map((digit, i) => (
                          <input key={i}
                            ref={el => { otpRefs.current[i] = el; }}
                            type="text" inputMode="numeric" maxLength={1}
                            value={digit}
                            onChange={e => handleOtpChange(e.target.value, i)}
                            onKeyDown={e => handleOtpKey(e, i)}
                            style={{
                              width: "100%", maxWidth: 52, height: 52, textAlign: "center",
                              border: "1px solid #C8B89A", borderRadius: "1px", background: "#FAF7F2",
                              color: "#1C0A00", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.2rem",
                              outline: "none",
                            }}
                          />
                        ))}
                      </div>
                      <button className="mt-2 opacity-50 hover:opacity-80 transition-opacity"
                        style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.08em", color: "#3A6B9B" }}>
                        Resend code
                      </button>
                    </div>
                  )}
                </div>

                {/* Continue button */}
                <button onClick={handleContinue} disabled={loading}
                  className="w-full mt-6 py-3 flex items-center justify-center gap-2 transition-opacity"
                  style={{
                    background: "#1C0A00", color: "#F5F0E8", borderRadius: "1px",
                    fontFamily: "var(--font-mono)", fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase",
                    opacity: loading ? 0.7 : 1,
                  }}>
                  {loading ? (
                    <svg className="spinner" width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <circle cx="7" cy="7" r="5" stroke="#F5F0E8" strokeWidth="1.5" strokeDasharray="20 12"/>
                    </svg>
                  ) : (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#9B3A3A" }}/>
                      {step === "otp" ? "Verify & Continue" : mode === "login" ? "Continue" : "Create Account"}
                    </>
                  )}
                </button>
                {loginErr && (
                  <div className="mt-3 text-center" style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: "#9B3A3A" }}>
                    {loginErr}
                  </div>
                )}

                {/* Divider */}
                <div className="flex items-center gap-3 my-5">
                  <div className="flex-1 h-px" style={{ background: "#EDE5D4" }}/>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "#5C4A32", opacity: 0.5 }}>or</span>
                  <div className="flex-1 h-px" style={{ background: "#EDE5D4" }}/>
                </div>

                {/* Toggle mode */}
                <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setStep("credentials"); setOtp(["","","","","",""]); }}
                  className="w-full py-2.5 border transition-colors hover:bg-[#EDE5D4]"
                  style={{
                    borderColor: "#C8B89A", color: "#1C0A00", borderRadius: "1px",
                    fontFamily: "var(--font-mono)", fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase",
                  }}>
                  {mode === "login" ? "Create an Account" : "Already have an account? Sign In"}
                </button>

                {/* Privacy note */}
                <div className="mt-5 p-4 border flex gap-3" style={{ borderColor: "#C8B89A", background: "#F0E8D8", borderRadius: "1px" }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 mt-0.5">
                    <path d="M8 1.5 L13.5 4 L13.5 8 C13.5 11.5 8 14.5 8 14.5 C8 14.5 2.5 11.5 2.5 8 L2.5 4 Z" stroke="#5C4A32" strokeWidth="1" fill="none" opacity="0.6"/>
                    <path d="M5.5 8 L7 9.5 L10.5 6" stroke="#4A7C5F" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "#5C4A32", lineHeight: 1.6, opacity: 0.8 }}>
                    Your identity is protected. Departments handling your complaint will not see your personal details.
                  </p>
                </div>
              </div>
            </div>

            {/* Below card — terms */}
            <p className="text-center mt-5" style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.06em", color: "#5C4A32", opacity: 0.45 }}>
              By continuing you agree to the{" "}
              <a href="#" style={{ textDecoration: "underline", color: "#5C4A32" }}>Terms of Use</a>
              {" & "}
              <a href="#" style={{ textDecoration: "underline", color: "#5C4A32" }}>Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Logo ───────────────────────────────────────────────────────────────────
function CivicTraceLogo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="32" height="32" rx="2" stroke="#1C0A00" strokeWidth="1.5" fill="none"/>
      <rect x="5" y="5" width="26" height="26" rx="1" stroke="#1C0A00" strokeWidth="0.5" fill="none"/>
      <circle cx="18" cy="14" r="4" stroke="#1C0A00" strokeWidth="1.5" fill="none"/>
      <path d="M18 18 L18 26" stroke="#1C0A00" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M12 26 Q18 20 24 26" stroke="#1C0A00" strokeWidth="1" fill="none"/>
      <circle cx="10" cy="14" r="1.5" fill="#9B3A3A"/>
      <circle cx="26" cy="18" r="1.5" fill="#4A7C5F"/>
      <path d="M10 14 L14 14 M22 14 L26 18" stroke="#C8B89A" strokeWidth="0.75" strokeDasharray="2,1"/>
    </svg>
  );
}

// ─── Illustrated Civic Map (SVG) ────────────────────────────────────────────
function CivicMap({ compact = false }: { compact?: boolean }) {
  const h = compact ? 280 : 380;
  const markers = [
    { x: 180, y: 95, color: "#9B3A3A", label: "Pothole", type: "urgent" },
    { x: 310, y: 140, color: "#C4622D", label: "Water Leak", type: "urgent" },
    { x: 245, y: 200, color: "#3A6B9B", label: "Streetlight", type: "progress" },
    { x: 140, y: 175, color: "#4A7C5F", label: "Garbage", type: "resolved" },
    { x: 390, y: 105, color: "#B8872A", label: "Fallen Tree", type: "disputed" },
    { x: 420, y: 200, color: "#9B3A3A", label: "Pothole", type: "reported" },
    { x: 90, y: 130, color: "#4A7C5F", label: "Fixed Drain", type: "resolved" },
    { x: 330, y: 245, color: "#3A6B9B", label: "Road Work", type: "progress" },
    { x: 200, y: 245, color: "#C4622D", label: "Flooding", type: "urgent" },
    { x: 460, y: 155, color: "#B8872A", label: "Sign Down", type: "disputed" },
    { x: 265, y: 145, color: "#9B3A3A", label: "Crack", type: "reported" },
    { x: 370, y: 280, color: "#4A7C5F", label: "Cleaned", type: "resolved" },
  ];

  return (
    <svg width="100%" viewBox={`0 0 560 ${h}`} xmlns="http://www.w3.org/2000/svg" className="w-full" style={{ maxHeight: h }}>
      {/* Background */}
      <rect width="560" height={h} fill="#EDE5D4" rx="2"/>

      {/* City blocks - irregular grid */}
      <rect x="60" y="40" width="120" height="80" rx="1" fill="#D6C9B0" stroke="#C8B89A" strokeWidth="0.75"/>
      <rect x="190" y="40" width="90" height="60" rx="1" fill="#CBBC9F" stroke="#C8B89A" strokeWidth="0.75"/>
      <rect x="290" y="40" width="110" height="50" rx="1" fill="#D0C5A8" stroke="#C8B89A" strokeWidth="0.75"/>
      <rect x="410" y="40" width="100" height="70" rx="1" fill="#C9BDA2" stroke="#C8B89A" strokeWidth="0.75"/>
      <rect x="60" y="130" width="80" height="100" rx="1" fill="#CBBC9F" stroke="#C8B89A" strokeWidth="0.75"/>
      <rect x="150" y="130" width="100" height="70" rx="1" fill="#D6C9B0" stroke="#C8B89A" strokeWidth="0.75"/>
      <rect x="260" y="100" width="130" height="85" rx="1" fill="#C5BAA0" stroke="#C8B89A" strokeWidth="0.75"/>
      <rect x="400" y="120" width="110" height="90" rx="1" fill="#D0C5A8" stroke="#C8B89A" strokeWidth="0.75"/>
      <rect x="60" y="240" width="150" height="70" rx="1" fill="#CBBC9F" stroke="#C8B89A" strokeWidth="0.75"/>
      <rect x="220" y="220" width="120" height="80" rx="1" fill="#D6C9B0" stroke="#C8B89A" strokeWidth="0.75"/>
      <rect x="350" y="220" width="160" height="90" rx="1" fill="#C9BDA2" stroke="#C8B89A" strokeWidth="0.75"/>

      {/* Park / green area */}
      <ellipse cx="160" cy="220" rx="40" ry="25" fill="#B8C9A3" opacity="0.6"/>
      <ellipse cx="470" cy="90" rx="35" ry="20" fill="#B8C9A3" opacity="0.5"/>

      {/* Roads */}
      <line x1="0" y1="120" x2="560" y2="120" stroke="#F5F0E8" strokeWidth="8"/>
      <line x1="0" y1="215" x2="560" y2="215" stroke="#F5F0E8" strokeWidth="6"/>
      <line x1="230" y1="0" x2="230" y2={h} stroke="#F5F0E8" strokeWidth="8"/>
      <line x1="400" y1="0" x2="400" y2={h} stroke="#F5F0E8" strokeWidth="6"/>
      <line x1="100" y1="0" x2="100" y2={h} stroke="#F5F0E8" strokeWidth="5"/>
      <line x1="0" y1="310" x2="560" y2="310" stroke="#F5F0E8" strokeWidth="5"/>

      {/* Road center lines */}
      <line x1="0" y1="120" x2="560" y2="120" stroke="#D6C9B0" strokeWidth="1" strokeDasharray="12,8"/>
      <line x1="230" y1="0" x2="230" y2={h} stroke="#D6C9B0" strokeWidth="1" strokeDasharray="12,8"/>

      {/* Complaint lifecycle connector */}
      <path d="M 180 95 Q 230 115 245 200" stroke="#9B3A3A" strokeWidth="1.5" fill="none" strokeDasharray="4,3" opacity="0.7"/>
      <path d="M 245 200 Q 290 225 330 245" stroke="#3A6B9B" strokeWidth="1.5" fill="none" strokeDasharray="4,3" opacity="0.7"/>
      <path d="M 310 140 Q 320 170 245 200" stroke="#C4622D" strokeWidth="1" fill="none" strokeDasharray="3,3" opacity="0.5"/>

      {/* Map markers */}
      {markers.map((m, i) => (
        <g key={i} className="pin-drop" style={{ animationDelay: `${i * 70}ms` }}>
          <circle cx={m.x} cy={m.y} r="10" fill={m.color} opacity="0.15" className={i < 3 ? "pulse" : ""}/>
          <circle cx={m.x} cy={m.y} r="6" fill={m.color} stroke="white" strokeWidth="1.5"/>
          <circle cx={m.x} cy={m.y} r="2.5" fill="white"/>
        </g>
      ))}

      {/* Watercolor overlay wash */}
      <rect width="560" height={h} fill="url(#wash)" opacity="0.12"/>
      <defs>
        <linearGradient id="wash" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#C8A96E"/>
          <stop offset="100%" stopColor="#8BA88B"/>
        </linearGradient>
      </defs>

      {/* Frame border */}
      <rect x="1" y="1" width="558" height={h - 2} rx="2" fill="none" stroke="#C8B89A" strokeWidth="1.5"/>
      <rect x="4" y="4" width="552" height={h - 8} rx="1" fill="none" stroke="#C8B89A" strokeWidth="0.5" strokeDasharray="6,4"/>
    </svg>
  );
}

// ─── Map Legend ──────────────────────────────────────────────────────────────
function MapLegend() {
  const items = [
    { color: "#9B3A3A", label: "Very Urgent" },
    { color: "#C4622D", label: "Urgent" },
    { color: "#3A6B9B", label: "In Progress" },
    { color: "#4A7C5F", label: "Resolved" },
    { color: "#B8872A", label: "Disputed" },
  ];
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2">
      {items.map(({ color, label }) => (
        <div key={label} className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full border border-white/60" style={{ background: color }}/>
          <span className="font-mono text-xs" style={{ color: "#5C4A32" }}>{label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Feature Card ────────────────────────────────────────────────────────────
function FeatureCard({ icon, title, desc, tag }: { icon: React.ReactNode; title: string; desc: string; tag: string }) {
  return (
    <div className="card-lift relative p-5 border" style={{ background: "#FAF7F2", borderColor: "#C8B89A", borderRadius: "2px" }}>
      <div className="absolute top-0 right-0 w-8 h-8 border-l border-b" style={{ borderColor: "#C8B89A" }}/>
      <div className="mb-4 flex items-center justify-center w-14 h-14 border" style={{ borderColor: "#C8B89A", borderRadius: "1px", background: "#F0E8D8" }}>
        {icon}
      </div>
      <div className="font-mono text-xs tracking-widest uppercase mb-2 opacity-50" style={{ color: "#5C4A32" }}>{tag}</div>
      <h3 className="font-display font-bold text-base mb-2 leading-tight" style={{ color: "#1C0A00" }}>{title}</h3>
      <p className="text-sm leading-relaxed" style={{ color: "#5C4A32", fontFamily: "var(--font-body)" }}>{desc}</p>
    </div>
  );
}

// ─── Feature Icons (SVG) ─────────────────────────────────────────────────────
const icons = {
  shield: (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <path d="M14 3 L24 7 L24 14 C24 20 14 25 14 25 C14 25 4 20 4 14 L4 7 Z" stroke="#1C0A00" strokeWidth="1.5" fill="none"/>
      <path d="M10 14 L13 17 L18 11" stroke="#4A7C5F" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="14" cy="11" r="2" stroke="#1C0A00" strokeWidth="1" fill="none"/>
    </svg>
  ),
  ai: (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="4" stroke="#3A6B9B" strokeWidth="1.5" fill="none"/>
      <circle cx="6" cy="10" r="2.5" stroke="#1C0A00" strokeWidth="1" fill="none"/>
      <circle cx="22" cy="10" r="2.5" stroke="#1C0A00" strokeWidth="1" fill="none"/>
      <circle cx="14" cy="24" r="2.5" stroke="#1C0A00" strokeWidth="1" fill="none"/>
      <path d="M8.5 11.5 L11 12.5 M17 12.5 L19.5 11.5 M14 18 L14 21.5" stroke="#C8B89A" strokeWidth="1"/>
      <path d="M6 10 L22 10" stroke="#C8B89A" strokeWidth="0.75" strokeDasharray="2,2"/>
    </svg>
  ),
  score: (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <path d="M14 4 L16.5 10 L23 10 L18 14 L20 21 L14 17 L8 21 L10 14 L5 10 L11.5 10 Z" stroke="#B8872A" strokeWidth="1.5" fill="none"/>
      <circle cx="14" cy="13" r="2" fill="#B8872A" opacity="0.4"/>
    </svg>
  ),
  proof: (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect x="6" y="4" width="16" height="20" rx="1" stroke="#1C0A00" strokeWidth="1.5" fill="none"/>
      <path d="M10 10 L18 10 M10 14 L18 14 M10 18 L15 18" stroke="#C8B89A" strokeWidth="1"/>
      <circle cx="18" cy="19" r="4" fill="#4A7C5F" opacity="0.15" stroke="#4A7C5F" strokeWidth="1.5"/>
      <path d="M16 19 L17.5 20.5 L20 18" stroke="#4A7C5F" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  escalate: (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <path d="M14 22 L14 8 M14 8 L10 12 M14 8 L18 12" stroke="#9B3A3A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8 18 L14 22 L20 18" stroke="#C8B89A" strokeWidth="1" strokeDasharray="2,2"/>
      <circle cx="14" cy="6" r="2" fill="#9B3A3A" opacity="0.6"/>
    </svg>
  ),
  chain: (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect x="4" y="11" width="8" height="6" rx="3" stroke="#1C0A00" strokeWidth="1.5" fill="none"/>
      <rect x="16" y="11" width="8" height="6" rx="3" stroke="#3A6B9B" strokeWidth="1.5" fill="none"/>
      <path d="M12 14 L16 14" stroke="#C8B89A" strokeWidth="1.5"/>
      <path d="M8 11 L8 7 M20 11 L20 7" stroke="#C8B89A" strokeWidth="1" strokeDasharray="2,1"/>
      <circle cx="8" cy="6" r="1.5" fill="#4A7C5F"/>
      <circle cx="20" cy="6" r="1.5" fill="#4A7C5F"/>
    </svg>
  ),
};

// ─── Process Step ────────────────────────────────────────────────────────────
function ProcessStep({ num, title, desc, isLast = false }: { num: string; title: string; desc: string; isLast?: boolean }) {
  return (
    <div className="flex flex-col items-center text-center relative">
      <div className="w-16 h-16 border-2 flex items-center justify-center mb-4 relative" style={{ borderColor: "#C8B89A", background: "#FAF7F2", borderRadius: "1px" }}>
        <span className="font-display font-bold text-xl" style={{ color: "#1C0A00" }}>{num}</span>
      </div>
      {!isLast && (
        <div className="hidden md:block absolute top-8 left-[calc(50%+32px)] right-0 h-px" style={{ background: "linear-gradient(to right, #C8B89A, transparent)" }}/>
      )}
      <div className="font-mono text-xs tracking-widest uppercase mb-2" style={{ color: "#5C4A32" }}>0{num}</div>
      <h3 className="font-display font-bold text-lg mb-2" style={{ color: "#1C0A00" }}>{title}</h3>
      <p className="text-sm leading-relaxed max-w-[180px]" style={{ color: "#5C4A32", fontFamily: "var(--font-body)" }}>{desc}</p>
    </div>
  );
}

// ─── Status Badge ────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; border: string }> = {
    "IN PROGRESS": { bg: "#EEF3F8", text: "#3A6B9B", border: "#3A6B9B" },
    "URGENT": { bg: "#FBF0EA", text: "#C4622D", border: "#C4622D" },
    "RESOLVED": { bg: "#EEF4F0", text: "#4A7C5F", border: "#4A7C5F" },
    "DISPUTED": { bg: "#FBF6EB", text: "#B8872A", border: "#B8872A" },
    "REPORTED": { bg: "#F8EEEE", text: "#9B3A3A", border: "#9B3A3A" },
    "VERY URGENT": { bg: "#F8EEEE", text: "#9B3A3A", border: "#9B3A3A" },
  };
  const s = map[status] || map["REPORTED"];
  return (
    <span className="badge-in font-mono text-xs px-2 py-0.5 border" style={{ background: s.bg, color: s.text, borderColor: s.border, letterSpacing: "0.08em" }}>
      {status}
    </span>
  );
}

// ─── Complaint Card ──────────────────────────────────────────────────────────
function ComplaintCard({ id, issue, location, priority, status, score, onNavigate, backendId, code }: {
  id: string; issue: string; location: string; priority: string; status: string; score: number;
  onNavigate?: (p: Page) => void;
  backendId?: string; code?: string;
}) {
  const civic = useCivic();
  return (
    <div className="card-lift p-5 border" style={{ background: "#FAF7F2", borderColor: "#C8B89A", borderRadius: "2px" }}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="font-mono text-xs opacity-50 mb-1" style={{ color: "#5C4A32" }}>{id}</div>
          <h4 className="font-display font-bold text-base" style={{ color: "#1C0A00" }}>{issue}</h4>
          <div className="font-mono text-xs mt-1 opacity-60" style={{ color: "#5C4A32" }}>{location}</div>
        </div>
        <div className="text-right">
          <div className="font-display font-bold text-2xl" style={{ color: "#1C0A00" }}>{score}</div>
          <div className="font-mono text-xs opacity-50" style={{ color: "#5C4A32" }}>/ 100</div>
        </div>
      </div>
      <div className="flex items-center gap-2 mb-4">
        <StatusBadge status={priority}/>
        <StatusBadge status={status}/>
      </div>
      <button onClick={() => { civic.select(backendId ?? id, code ?? id); onNavigate?.("complaint-detail"); }} className="w-full py-2 border font-mono text-xs tracking-widest uppercase transition-colors hover:bg-espresso hover:text-parchment" style={{ borderColor: "#1C0A00", color: "#1C0A00", borderRadius: "1px" }}>
        View Complaint
      </button>
    </div>
  );
}

// ─── Blockchain Record ───────────────────────────────────────────────────────
function BlockchainRecord({ onNavigate }: { onNavigate?: (p: Page) => void }) {
  const events = [
    { label: "CREATED", date: "13 SEP 2026 · 10:42", verified: true },
    { label: "ACKNOWLEDGED", date: "13 SEP 2026 · 11:08", verified: true },
    { label: "ASSIGNED", date: "13 SEP 2026 · 12:17", verified: true },
    { label: "EVIDENCE ADDED", date: "14 SEP 2026 · 16:31", verified: true },
    { label: "RESOLVED", date: "15 SEP 2026 · 09:12", verified: true },
  ];
  return (
    <div className="border" style={{ background: "#FAF7F2", borderColor: "#C8B89A", borderRadius: "2px", maxWidth: 420 }}>
      <div className="p-5 border-b" style={{ borderColor: "#C8B89A" }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="font-mono text-xs tracking-widest uppercase opacity-50 mb-1" style={{ color: "#5C4A32" }}>Complaint</div>
            <div className="font-display font-bold text-xl" style={{ color: "#1C0A00" }}>CTY-48291-X</div>
          </div>
          <div className="verify-glow px-3 py-1.5 border flex items-center gap-1.5" style={{ borderColor: "#4A7C5F", background: "#EEF4F0", borderRadius: "1px" }}>
            <div className="w-2 h-2 rounded-full" style={{ background: "#4A7C5F" }}/>
            <span className="font-mono text-xs" style={{ color: "#4A7C5F" }}>VERIFIED</span>
          </div>
        </div>
      </div>
      <div className="p-5 space-y-4">
        {events.map((e, i) => (
          <div key={i} className={`flex items-start gap-3 ${i < events.length - 1 ? "timeline-line" : ""}`}>
            <div className="w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5" style={{ borderColor: "#4A7C5F", background: "#EEF4F0" }}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 5 L4 7 L8 3" stroke="#4A7C5F" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="flex-1 pb-4">
              <div className="font-mono text-xs tracking-wider uppercase mb-0.5" style={{ color: "#1C0A00" }}>{e.label}</div>
              <div className="font-mono text-xs opacity-50" style={{ color: "#5C4A32" }}>{e.date}</div>
            </div>
          </div>
        ))}
        <div className="pt-2 border-t" style={{ borderColor: "#C8B89A" }}>
          <div className="font-mono text-xs opacity-50 mb-1" style={{ color: "#5C4A32" }}>Evidence Hash</div>
          <div className="font-mono text-sm" style={{ color: "#3A6B9B" }}>0x7a91...4bc2</div>
        </div>
        <button onClick={() => onNavigate?.("verification")} className="w-full py-2.5 font-mono text-xs tracking-widest uppercase transition-colors" style={{ background: "#1C0A00", color: "#F5F0E8", borderRadius: "1px" }}>
          Verify Record
        </button>
      </div>
    </div>
  );
}

// ─── Dept Row ────────────────────────────────────────────────────────────────
function DeptRow({ rank, name, rate, time, reopen, trust, active }: {
  rank: string; name: string; rate: string; time: string; reopen: string; trust: number; active?: boolean;
}) {
  return (
    <div className={`grid items-center py-4 px-5 border-b transition-colors ${active ? "border-l-2" : ""}`}
      style={{
        gridTemplateColumns: "2.5rem 1fr 1fr 1fr 1fr 3rem",
        gap: "1rem",
        borderColor: "#C8B89A",
        borderLeftColor: active ? "#1C0A00" : undefined,
        background: active ? "#F5F0E8" : "transparent",
      }}>
      <span className="font-display font-bold text-2xl opacity-20" style={{ color: "#1C0A00" }}>{rank}</span>
      <div>
        <div className="font-display font-semibold text-base" style={{ color: "#1C0A00" }}>{name}</div>
        <div className="font-mono text-xs opacity-40" style={{ color: "#5C4A32" }}>Department</div>
      </div>
      <div>
        <div className="font-body font-semibold text-sm" style={{ color: "#1C0A00" }}>{rate}</div>
        <div className="font-mono text-xs opacity-40" style={{ color: "#5C4A32" }}>Resolution Rate</div>
      </div>
      <div>
        <div className="font-body font-semibold text-sm" style={{ color: "#1C0A00" }}>{time}</div>
        <div className="font-mono text-xs opacity-40" style={{ color: "#5C4A32" }}>Avg. Time</div>
      </div>
      <div>
        <div className="font-body font-semibold text-sm" style={{ color: "#1C0A00" }}>{reopen}</div>
        <div className="font-mono text-xs opacity-40" style={{ color: "#5C4A32" }}>Reopen Rate</div>
      </div>
      <div className="flex flex-col items-end">
        <div className="font-display font-bold text-xl" style={{ color: trust >= 90 ? "#4A7C5F" : trust >= 80 ? "#B8872A" : "#9B3A3A" }}><AnimatedNumber value={trust} duration={800} /></div>
        <div className="font-mono text-xs opacity-40" style={{ color: "#5C4A32" }}>Trust</div>
      </div>
    </div>
  );
}

// ─── Civic Impact Score ───────────────────────────────────────────────────────
function CivicImpactCard() {
  const [score, setScore] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => {
      let v = 0;
      const interval = setInterval(() => {
        v += 3;
        setScore(Math.min(v, 87));
        if (v >= 87) clearInterval(interval);
      }, 20);
    }, 400);
    return () => clearTimeout(t);
  }, []);

  const rows = [
    { label: "Supporting Reports", value: "17", color: "#3A6B9B" },
    { label: "Priority", value: "Very Urgent", color: "#9B3A3A" },
    { label: "Time Unresolved", value: "3 days", color: "#C4622D" },
    { label: "Affected Area", value: "High Traffic Zone", color: "#5C4A32" },
    { label: "Escalation History", value: "1", color: "#B8872A" },
  ];

  return (
    <div className="border" style={{ background: "#FAF7F2", borderColor: "#C8B89A", borderRadius: "2px", maxWidth: 360 }}>
      <div className="p-6 border-b text-center" style={{ borderColor: "#C8B89A" }}>
        <div className="font-mono text-xs tracking-widest uppercase opacity-50 mb-3" style={{ color: "#5C4A32" }}>Civic Impact Assessment</div>
        <div className="font-display font-bold" style={{ fontSize: "5rem", lineHeight: 1, color: "#1C0A00" }}>{score}</div>
        <div className="font-body text-sm opacity-50 mt-1" style={{ color: "#5C4A32" }}>/ 100</div>
        <div className="mt-4 w-full h-2 rounded-full overflow-hidden" style={{ background: "#EDE5D4" }}>
          <div className="h-full bar-fill" style={{ width: `${score}%`, background: "linear-gradient(to right, #9B3A3A, #C4622D)" }}/>
        </div>
      </div>
      <div className="p-5 space-y-3">
        {rows.map(({ label, value, color }) => (
          <div key={label} className="flex items-center justify-between py-2 border-b" style={{ borderColor: "#EDE5D4" }}>
            <span className="font-mono text-xs opacity-60" style={{ color: "#5C4A32" }}>{label}</span>
            <span className="font-body font-semibold text-sm" style={{ color }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Decorative Rule ───────────────────────────────────────────────────────────

// ─── Decorative Rule ─────────────────────────────────────────────────────────
function Rule({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div className="flex-1 h-px" style={{ background: "#C8B89A" }}/>
      <div className="w-1.5 h-1.5 rotate-45" style={{ background: "#C8B89A" }}/>
      <div className="flex-1 h-px" style={{ background: "#C8B89A" }}/>
    </div>
  );
}

// ─── Section Label ───────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono text-xs tracking-widest uppercase mb-4 opacity-50" style={{ color: "#5C4A32" }}>{children}</div>
  );
}

// ─── Dashboard Shared Navbar ──────────────────────────────────────────────────
function DashNav({ onNavigate, active }: { onNavigate: (p: Page) => void; active: Page }) {
  const [open, setOpen] = useState(false);
  return (
    <nav className="sticky top-0 z-50 border-b" style={{ background: "rgba(245,240,232,0.97)", borderColor: "#C8B89A", backdropFilter: "blur(8px)" }}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <button onClick={() => onNavigate("home")} className="flex items-center gap-3">
          <CivicTraceLogo size={30}/>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", color: "#1C0A00" }}>CivicTrace</span>
        </button>
        <div className="hidden md:flex items-center gap-6">
          {[
            { label: "Dashboard", page: "dashboard" },
            { label: "Civic Map", page: "civic-map" },
            { label: "Leaderboard", page: "leaderboard" },
          ].map(({ label, page: p }) => (
            <button key={label} onClick={() => onNavigate(p as Page)}
              className="transition-opacity"
              style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#1C0A00", opacity: active === p && label === "Dashboard" ? 1 : 0.5 }}>
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {/* Notification bell */}
          <button className="relative p-2 hover:opacity-70 transition-opacity">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 2 C6 2 4 4.5 4 7 L4 11 L2 13 L16 13 L14 11 L14 7 C14 4.5 12 2 9 2Z" stroke="#1C0A00" strokeWidth="1.2" fill="none"/>
              <path d="M7 13 C7 14.1 7.9 15 9 15 C10.1 15 11 14.1 11 13" stroke="#1C0A00" strokeWidth="1.2"/>
            </svg>
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ background: "#9B3A3A" }}/>
          </button>
          {/* Avatar */}
          <div className="w-8 h-8 border flex items-center justify-center" style={{ borderColor: "#C8B89A", background: "#EDE5D4", borderRadius: "1px" }}>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.75rem", color: "#1C0A00" }}>A</span>
          </div>
          <button onClick={() => onNavigate("auth")} className="hidden md:flex items-center gap-2 px-3 py-1.5 border hover:bg-[#1C0A00] hover:text-[#F5F0E8] transition-colors"
            style={{ borderColor: "#1C0A00", color: "#1C0A00", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#9B3A3A" }}/>
            Report Issue
          </button>
        </div>
      </div>
    </nav>
  );
}

// ─── Citizen Dashboard ────────────────────────────────────────────────────────
function CitizenDashboard({ onNavigate }: { onNavigate: (p: Page) => void }) {
  // Live data for the logged-in citizen ONLY — no demo fallback.
  const civic = useCivic();
  const user = civic.user;
  const liveMine = useLiveMyComplaints();
  const mine = liveMine.data;

  const filed = mine?.filed ?? [];
  const supportedRaw = mine?.supported ?? [];
  const activity = mine?.activity ?? [];

  const complaints = filed.map(toCardComplaint).map(c => ({ ...c, timeline: ["Reported"], activeStep: 0 }));
  const supported = supportedRaw.map(b => {
    const c = toCardComplaint(b);
    return { id: c.id, issue: c.issue, location: c.location, status: c.status };
  });

  const codeById = new Map<string, string>();
  [...filed, ...supportedRaw].forEach(b => codeById.set(b.id, b.tracking_code));

  const escalatedIds = new Set<string>();
  activity.forEach(ev => {
    if (/escalat/i.test(ev.note ?? "")) escalatedIds.add(ev.complaint_id);
  });

  const notifications = activity.map(ev => {
    const code = codeById.get(ev.complaint_id) ?? ev.complaint_id;
    const cfg = STATUS_CONFIG[ev.to_status] ?? STATUS_CONFIG["REPORTED"];
    const isEscalation = /escalat/i.test(ev.note ?? "");
    return {
      icon: ev.to_status === "RESOLVED" ? "✓" : isEscalation ? "↑" : "•",
      color: cfg.color,
      message: `${code} — ${ev.note || `status updated to ${ev.to_status}`}`,
      time: timeAgo(ev.created_at),
    };
  });

  const digest = activity.slice(0, 3).map(ev => ({
    hash: `${ev.this_hash.slice(0, 6)}…${ev.this_hash.slice(-4)}`,
    label: `${codeById.get(ev.complaint_id) ?? ev.complaint_id} · ${ev.note || ev.to_status}`,
    time: new Date(ev.created_at).toLocaleDateString("en-US", { month: "short", day: "2-digit" }),
  }));

  const counts = [
    filed.filter(c => c.status === "REPORTED").length,
    filed.filter(c => c.status === "ASSESSED" || c.status === "IN_PROGRESS").length,
    filed.filter(c => c.status === "RESOLVED").length,
    filed.filter(c => c.status === "DISPUTED").length,
    escalatedIds.size,
  ];

  const firstName = (user?.name || "Citizen").split(" ")[0];
  const initials = ((user?.name || "C").trim().charAt(0) || "C").toUpperCase();
  const civicScore = Math.min(99, 50 + filed.length * 3 + filed.filter(c => c.status === "RESOLVED").length * 6);
  const citizenId = user?.id ? `CID-${user.id.slice(0, 6).toUpperCase()}` : "Not signed in";
  const today = new Date().toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });

  const statColor: Record<string, string> = {
    "URGENT": "#C4622D", "VERY URGENT": "#9B3A3A", "IN PROGRESS": "#3A6B9B",
    "RESOLVED": "#4A7C5F", "ESCALATED": "#9B3A3A", "DISPUTED": "#B8872A", "NORMAL": "#5C4A32",
    "REPORTED": "#9B3A3A",
  };

  const quickActions = [
    { label: "Report an Issue", sub: "Document a new civic problem", icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="9" stroke="#9B3A3A" strokeWidth="1.5" fill="none"/>
        <path d="M11 7 L11 15 M7 11 L15 11" stroke="#9B3A3A" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ), accent: "#9B3A3A", onClick: () => onNavigate("report-category") },
    { label: "Track Complaints", sub: "View all active reports", icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="3" y="4" width="16" height="14" rx="1" stroke="#3A6B9B" strokeWidth="1.5" fill="none"/>
        <path d="M7 9 L10 12 L15 7" stroke="#3A6B9B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ), accent: "#3A6B9B", onClick: () => onNavigate("my-complaints") },
    { label: "Civic Map", sub: "Explore issues near you", icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="10" r="4" stroke="#4A7C5F" strokeWidth="1.5" fill="none"/>
        <path d="M11 14 L11 19" stroke="#4A7C5F" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M7 18 Q11 15 15 18" stroke="#4A7C5F" strokeWidth="1" fill="none"/>
        <circle cx="11" cy="10" r="1.5" fill="#4A7C5F" opacity="0.5"/>
      </svg>
    ), accent: "#4A7C5F", onClick: () => onNavigate("civic-map") },
    { label: "My Impact", sub: "Civic contribution score", icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M11 3 L13 8 L18.5 8 L14 11.5 L15.5 17 L11 13.5 L6.5 17 L8 11.5 L3.5 8 L9 8 Z" stroke="#B8872A" strokeWidth="1.5" fill="none"/>
      </svg>
    ), accent: "#B8872A", onClick: () => onNavigate("impact-dashboard") },
  ];

  const stats = [
    { label: "Active", val: counts[0], color: "#9B3A3A", bg: "#F8EEEE" },
    { label: "In Progress", val: counts[1], color: "#3A6B9B", bg: "#EEF3F8" },
    { label: "Resolved", val: counts[2], color: "#4A7C5F", bg: "#EEF4F0" },
    { label: "Disputed", val: counts[3], color: "#B8872A", bg: "#FBF6EB" },
    { label: "Escalated", val: counts[4], color: "#9B3A3A", bg: "#F8EEEE" },
  ];

  function PriorityPip({ priority }: { priority: string }) {
    const c = statColor[priority] || "#5C4A32";
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 border"
        style={{ borderColor: c, background: c + "18", borderRadius: "1px",
          fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.08em", color: c }}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: c }}/>
        {priority}
      </span>
    );
  }

  function MiniTimeline({ steps, active }: { steps: string[]; active: number }) {
    return (
      <div className="flex items-center gap-0 mt-3">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className="w-2 h-2 rounded-full border" style={{
                background: i <= active ? "#1C0A00" : "transparent",
                borderColor: i <= active ? "#1C0A00" : "#C8B89A",
              }}/>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", color: i <= active ? "#1C0A00" : "#C8B89A",
                marginTop: 3, whiteSpace: "nowrap", letterSpacing: "0.06em" }}>
                {s}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="w-8 h-px mb-3 mx-0.5" style={{ background: i < active ? "#1C0A00" : "#C8B89A" }}/>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ background: "#F5F0E8", minHeight: "100vh", fontFamily: "var(--font-body)" }}>
      <DashNav onNavigate={onNavigate} active="dashboard"/>

      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* ── HEADER ── */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.5, marginBottom: 6 }}>
              {`Citizen Portal · ${today}`}
            </div>
            <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "clamp(2rem, 4vw, 3rem)", color: "#1C0A00", lineHeight: 1.1 }}>
              {`Good ${new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, ${firstName}.`}
            </h1>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.9rem", color: "#5C4A32", opacity: 0.7, marginTop: 6 }}>
              Here's what's happening with your civic reports.
            </p>
          </div>
          <button onClick={() => onNavigate("report-category")}
            className="self-start md:self-auto flex items-center gap-2 px-5 py-3 transition-opacity hover:opacity-90"
            style={{ background: "#1C0A00", color: "#F5F0E8", borderRadius: "1px",
              fontFamily: "var(--font-mono)", fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            <span style={{ fontSize: "1rem", lineHeight: 1 }}>+</span>
            Report an Issue
          </button>
        </div>

        {/* ── DECORATIVE RULE ── */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 h-px" style={{ background: "#C8B89A" }}/>
          <div className="w-1.5 h-1.5 rotate-45" style={{ background: "#C8B89A" }}/>
          <div className="flex-1 h-px" style={{ background: "#C8B89A" }}/>
        </div>

        {/* ── QUICK ACTIONS ── */}
        <section className="mb-10">
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.5, marginBottom: 14 }}>
            Quick Actions
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map(({ label, sub, icon, accent, onClick }) => (
              <button key={label} onClick={onClick}
                className="group text-left p-5 border transition-all hover:-translate-y-0.5 hover:shadow-md"
                style={{ background: "#FAF7F2", borderColor: "#C8B89A", borderRadius: "2px", transition: "transform 0.15s, box-shadow 0.15s" }}>
                <div className="w-11 h-11 border flex items-center justify-center mb-4"
                  style={{ borderColor: accent + "40", background: accent + "10", borderRadius: "1px" }}>
                  {icon}
                </div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.95rem", color: "#1C0A00", marginBottom: 3 }}>
                  {label}
                </div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "#5C4A32", opacity: 0.6 }}>{sub}</div>
                <div className="mt-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.1em", color: accent }}>
                  Open <span style={{ fontSize: "0.7rem" }}>→</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* ── COMPLAINT SUMMARY STATS ── */}
        <section className="mb-10">
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.5, marginBottom: 14 }}>
            Complaint Summary
          </div>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            {stats.map(({ label, val, color, bg }) => (
              <div key={label} className="p-4 border text-center"
                style={{ background: bg, borderColor: color + "40", borderRadius: "2px" }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "2.2rem", color, lineHeight: 1 }}>{val}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.6, marginTop: 6 }}>{label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── MAIN GRID: complaints + sidebar ── */}
        <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">

          {/* LEFT — My Complaints */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.5 }}>
                My Complaints
              </div>
              <button onClick={() => onNavigate("my-complaints")} style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#3A6B9B", opacity: 0.8 }}>
                View All →
              </button>
            </div>

            <div className="space-y-4">
              {complaints.length === 0 && (
                <div className="border flex flex-col items-center justify-center text-center py-16 px-8"
                  style={{ background: "#FAF7F2", borderColor: "#C8B89A", borderRadius: "2px" }}>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "1.15rem", color: "#1C0A00", marginBottom: 8 }}>
                    {user ? "No complaints filed yet." : "Sign in to view your dashboard."}
                  </div>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", color: "#5C4A32", opacity: 0.65, maxWidth: 300, lineHeight: 1.6, marginBottom: 18 }}>
                    {user ? "Report an issue and it will appear here with its full verified lifecycle." : "Log in as a citizen to see your reports, support, and civic identity."}
                  </p>
                  <button onClick={() => user ? onNavigate("report-category") : onNavigate("auth")}
                    className="px-5 py-3" style={{ background: "#1C0A00", color: "#F5F0E8", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    {user ? "+ Report an Issue" : "Sign In"}
                  </button>
                </div>
              )}
              {complaints.map((c) => (
                <div key={c.id} className="border overflow-hidden"
                  style={{ background: "#FAF7F2", borderColor: "#C8B89A", borderRadius: "2px" }}>

                  {/* Status stripe */}
                  <div className="h-0.5" style={{ background: statColor[c.status] || "#C8B89A" }}/>

                  <div className="p-5">
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.08em", color: "#5C4A32", opacity: 0.5 }}>
                            {c.id}
                          </span>
                          {c.days > 0 && (
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", color: c.days >= 5 ? "#9B3A3A" : "#C4622D" }}>
                              · {c.days} days unresolved
                            </span>
                          )}
                        </div>
                        <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.1rem", color: "#1C0A00", marginBottom: 2 }}>
                          {c.issue}
                        </h3>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "#5C4A32", opacity: 0.55 }}>
                          📍 {c.location}
                        </div>
                      </div>

                      {/* Impact score */}
                      <div className="text-right border px-3 py-2" style={{ borderColor: "#C8B89A", background: "#F5F0E8", borderRadius: "1px" }}>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.5 }}>
                          Civic Impact
                        </div>
                        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.5rem", color: "#1C0A00", lineHeight: 1.1 }}>
                          {c.score}
                        </div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", color: "#5C4A32", opacity: 0.4 }}>/ 100</div>
                      </div>
                    </div>

                    {/* Tags row */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <PriorityPip priority={c.priority}/>
                      <PriorityPip priority={c.status}/>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", color: "#5C4A32", opacity: 0.5 }}>
                        {c.supporters} supporters
                      </span>
                    </div>

                    {/* Mini timeline */}
                    <div className="border-t pt-3 mb-4" style={{ borderColor: "#EDE5D4" }}>
                      <MiniTimeline steps={c.timeline} active={c.activeStep}/>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button onClick={() => { const b = c as typeof c & { backendId?: string }; civic.select(b.backendId ?? c.id, c.id); onNavigate("complaint-detail"); }} className="flex-1 py-2 border text-center hover:bg-[#1C0A00] hover:text-[#F5F0E8] transition-colors"
                        style={{ borderColor: "#1C0A00", color: "#1C0A00", borderRadius: "1px",
                          fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                        View Complaint
                      </button>
                      {c.status === "RESOLVED" && (
                        <button className="px-3 py-2 border hover:opacity-80 transition-opacity"
                          style={{ borderColor: "#9B3A3A", color: "#9B3A3A", borderRadius: "1px",
                            fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                          Dispute
                        </button>
                      )}
                      {c.status !== "RESOLVED" && (
                        <div className="flex items-center gap-1 px-3 py-2 border"
                          style={{ borderColor: "#C8B89A", borderRadius: "1px" }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: statColor[c.status] }}/>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "#5C4A32", opacity: 0.6 }}>
                            On-chain
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── SUPPORTING REPORTS ── */}
            <section className="mt-10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.5, marginBottom: 4 }}>
                    Community Support
                  </div>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "1.1rem", color: "#1C0A00" }}>
                    Issues You've Supported
                  </div>
                </div>
                <div className="border px-3 py-2 text-center" style={{ borderColor: "#C8B89A", background: "#FAF7F2", borderRadius: "1px" }}>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.6rem", color: "#3A6B9B" }}>{supported.length}</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.5 }}>Reports</div>
                </div>
              </div>

              <div className="border" style={{ background: "#FAF7F2", borderColor: "#C8B89A", borderRadius: "2px" }}>
                {supported.length === 0 && (
                  <div className="px-5 py-6 text-center" style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "#5C4A32", opacity: 0.6 }}>
                    You haven't supported any community reports yet. Supporting nearby issues amplifies their priority.
                  </div>
                )}
                {supported.map((s, i) => (
                  <div key={s.id}
                    className={`flex items-center justify-between px-5 py-3.5 ${i < supported.length - 1 ? "border-b" : ""}`}
                    style={{ borderColor: "#EDE5D4" }}>
                    <div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", color: "#5C4A32", opacity: 0.45, marginBottom: 2 }}>{s.id}</div>
                      <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.9rem", color: "#1C0A00" }}>{s.issue}</div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", color: "#5C4A32", opacity: 0.5 }}>📍 {s.location}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <PriorityPip priority={s.status}/>
                      <button onClick={() => { civic.select(null, s.id); onNavigate("complaint-detail"); }} style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#3A6B9B", opacity: 0.7 }}>
                        View →
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Impact summary strip */}
              <div className="mt-4 p-4 border flex items-center justify-between"
                style={{ background: "#EDE5D4", borderColor: "#C8B89A", borderRadius: "2px" }}>
                <div style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", color: "#5C4A32", opacity: 0.8, fontStyle: "italic" }}>
                  Your support has contributed to <strong style={{ color: "#1C0A00" }}>{supported.length} community record{supported.length === 1 ? "" : "s"}</strong> — amplifying their civic priority.
                </div>
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="flex-shrink-0 ml-4">
                  <path d="M14 3 L16.5 10 L23 10 L18 14 L20 21 L14 17 L8 21 L10 14 L5 10 L11.5 10 Z" stroke="#B8872A" strokeWidth="1.5" fill="none"/>
                </svg>
              </div>
            </section>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="space-y-6">

            {/* ── NOTIFICATIONS ── */}
            <div className="border" style={{ background: "#FAF7F2", borderColor: "#C8B89A", borderRadius: "2px" }}>
              {/* Corner notch */}
              <div className="relative">
                <div className="absolute top-0 right-0 w-6 h-6 border-l border-b" style={{ borderColor: "#C8B89A" }}/>
              </div>
              <div className="px-5 pt-5 pb-3 border-b flex items-center justify-between" style={{ borderColor: "#C8B89A" }}>
                <div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.5, marginBottom: 2 }}>
                    Recent Activity
                  </div>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.95rem", color: "#1C0A00" }}>
                    Notifications
                  </div>
                </div>
                <span className="w-5 h-5 flex items-center justify-center rounded-full" style={{ background: "#9B3A3A" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "#F5F0E8", fontWeight: 700 }}>{notifications.length}</span>
                </span>
              </div>
              <div className="divide-y" style={{ borderColor: "#EDE5D4" }}>
                {notifications.map((n, i) => (
                  <div key={i} className="flex gap-3 px-5 py-3.5 hover:bg-[#EDE5D4] transition-colors cursor-pointer">
                    <div className="w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ borderColor: n.color + "40", background: n.color + "15" }}>
                      <span style={{ fontSize: "0.6rem", color: n.color, fontWeight: 700 }}>{n.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "#1C0A00", lineHeight: 1.5 }}>{n.message}</p>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "#5C4A32", opacity: 0.45, marginTop: 3 }}>{n.time}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-5 py-3 border-t" style={{ borderColor: "#C8B89A" }}>
                <button onClick={() => onNavigate("my-complaints")} style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#3A6B9B", opacity: 0.7 }}>
                  View all activity →
                </button>
              </div>
            </div>

            {/* ── MY CIVIC IDENTITY ── */}
            <div className="border" style={{ background: "#FAF7F2", borderColor: "#C8B89A", borderRadius: "2px" }}>
              <div className="px-5 pt-5 pb-3 border-b" style={{ borderColor: "#C8B89A" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.5, marginBottom: 2 }}>Citizen Record</div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.95rem", color: "#1C0A00" }}>My Civic Identity</div>
              </div>
              <div className="p-5">
                {/* Avatar row */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 border-2 flex items-center justify-center"
                    style={{ borderColor: "#C8B89A", background: "#EDE5D4", borderRadius: "1px" }}>
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.2rem", color: "#1C0A00" }}>{initials}</span>
                  </div>
                  <div>
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", color: "#1C0A00" }}>{user?.name ?? "Citizen"}</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", color: "#5C4A32", opacity: 0.5 }}>{citizenId}</div>
                  </div>
                </div>
                {/* Identity metrics */}
                {[
                  { label: "Complaints Filed", val: String(filed.length), color: "#1C0A00" },
                  { label: "Reports Supported", val: String(supported.length), color: "#3A6B9B" },
                  { label: "Civic Score", val: `${civicScore} / 100`, color: "#4A7C5F" },
                  { label: "Account Role", val: (user?.role ?? "guest").toUpperCase(), color: "#5C4A32" },
                ].map(({ label, val, color }) => (
                  <div key={label} className="flex justify-between items-center py-2.5 border-b" style={{ borderColor: "#EDE5D4" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.06em", color: "#5C4A32", opacity: 0.6 }}>{label}</span>
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.9rem", color }}>{val}</span>
                  </div>
                ))}
                {/* Verified badge */}
                <div className="mt-4 flex items-center gap-2 px-3 py-2 border" style={{ borderColor: "#4A7C5F", background: "#EEF4F0", borderRadius: "1px" }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M6 1 L10 3 L10 6 C10 9 6 11 6 11 C6 11 2 9 2 6 L2 3 Z" stroke="#4A7C5F" strokeWidth="1" fill="none"/>
                    <path d="M4 6 L5.5 7.5 L8.5 4.5" stroke="#4A7C5F" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.08em", color: "#4A7C5F" }}>
                    Identity Verified · Complaints Protected
                  </span>
                </div>
              </div>
            </div>

            {/* ── BLOCKCHAIN DIGEST ── */}
            <div className="border p-5" style={{ background: "#FAF7F2", borderColor: "#C8B89A", borderRadius: "2px" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.5, marginBottom: 10 }}>
                On-Chain Digest
              </div>
              <div className="space-y-3">
                {digest.length === 0 && (
                  <div style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "#5C4A32", opacity: 0.6 }}>
                    No on-chain activity yet. Your first report will create a verifiable record.
                  </div>
                )}
                {digest.map(({ hash, label, time }, i) => (
                  <div key={`${hash}-${i}`} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: "#4A7C5F" }}/>
                    <div className="flex-1">
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "#3A6B9B" }}>{hash}</div>
                      <div style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "#5C4A32", opacity: 0.7 }}>{label}</div>
                    </div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "#5C4A32", opacity: 0.4 }}>{time}</div>
                  </div>
                ))}
              </div>
              <button onClick={() => {
                // Always verify THIS citizen's own latest complaint, not a stale selection
                // from another account. Fixes "same record on each citizen account".
                const mineIds = new Set([...filed.map(f => f.id), ...supportedRaw.map(s => s.id)]);
                if ((!civic.selectedId || !mineIds.has(civic.selectedId)) && filed.length) {
                  civic.select(filed[0].id, filed[0].tracking_code);
                }
                onNavigate("verification");
              }} className="mt-4 w-full py-2 border hover:bg-[#EDE5D4] transition-colors"
                style={{ borderColor: "#C8B89A", color: "#1C0A00", borderRadius: "1px",
                  fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Verify Records →
              </button>
            </div>

          </div>{/* end sidebar */}
        </div>{/* end main grid */}

        {/* ── FOOTER STRIP ── */}
        <div className="mt-12 pt-6 border-t flex flex-wrap items-center justify-between gap-4" style={{ borderColor: "#C8B89A" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.06em", color: "#5C4A32", opacity: 0.4 }}>
            © 2026 CivicTrace · All civic records preserved.
          </div>
          <div className="flex items-center gap-2" style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", color: "#5C4A32", opacity: 0.4 }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#4A7C5F" }}/>
            On-chain · Verified · Open
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Report Flow: Step Progress Bar ──────────────────────────────────────────
function ReportProgress({ step }: { step: number }) {
  const steps = ["Category", "Evidence", "Details", "Submitted"];
  return (
    <div className="flex items-center justify-center gap-0">
      {steps.map((label, i) => {
        const num = i + 1;
        const active = num === step;
        const done = num < step;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center w-8 h-8 border transition-all"
                style={{
                  borderColor: active ? "#1C0A00" : done ? "#4A7C5F" : "#C8B89A",
                  background: active ? "#1C0A00" : done ? "#EEF4F0" : "#FAF7F2",
                  borderRadius: "1px",
                }}>
                {done ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6 L5 8.5 L9.5 3.5" stroke="#4A7C5F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <span style={{
                    fontFamily: "var(--font-mono)", fontSize: "0.6rem", fontWeight: 700,
                    color: active ? "#F5F0E8" : "#C8B89A",
                  }}>
                    {String(num).padStart(2, "0")}
                  </span>
                )}
              </div>
              <span style={{
                fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.12em",
                textTransform: "uppercase", marginTop: 5,
                color: active ? "#1C0A00" : done ? "#4A7C5F" : "#C8B89A",
              }}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="w-12 md:w-20 h-px mb-5 mx-1"
                style={{ background: done ? "#4A7C5F" : "#C8B89A", opacity: done ? 1 : 0.5 }}/>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Category Illustrations (inline SVG) ─────────────────────────────────────
function RoadsIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <rect x="4" y="26" width="28" height="6" rx="1" fill="#D6C9B0" stroke="#5C4A32" strokeWidth="1"/>
      <path d="M16 26 L16 32 M20 26 L20 32" stroke="#F5F0E8" strokeWidth="1.5" strokeDasharray="3,2"/>
      <ellipse cx="18" cy="24" rx="6" ry="3" fill="#9B3A3A" opacity="0.3" stroke="#9B3A3A" strokeWidth="1"/>
      <ellipse cx="18" cy="24" rx="3" ry="1.5" fill="#9B3A3A" opacity="0.5"/>
      <rect x="6" y="10" width="10" height="16" rx="1" fill="#CBBC9F" stroke="#5C4A32" strokeWidth="1"/>
      <rect x="20" y="13" width="10" height="13" rx="1" fill="#C9BDA2" stroke="#5C4A32" strokeWidth="1"/>
      <rect x="8" y="12" width="4" height="4" fill="#EDE5D4" stroke="#C8B89A" strokeWidth="0.5"/>
      <rect x="22" y="16" width="4" height="4" fill="#EDE5D4" stroke="#C8B89A" strokeWidth="0.5"/>
      <line x1="8" y1="32" x2="28" y2="32" stroke="#5C4A32" strokeWidth="0.5" opacity="0.3"/>
    </svg>
  );
}

function WaterIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <path d="M18 6 C18 6 10 16 10 22 C10 26.4 13.6 30 18 30 C22.4 30 26 26.4 26 22 C26 16 18 6 18 6Z" fill="#C8D8E8" opacity="0.5" stroke="#3A6B9B" strokeWidth="1.2" fillRule="nonzero"/>
      <path d="M13 24 Q15 21 18 24 Q21 27 23 24" stroke="#3A6B9B" strokeWidth="1" fill="none"/>
      <path d="M6 20 Q8 17 10 20" stroke="#3A6B9B" strokeWidth="1" fill="none" opacity="0.5"/>
      <path d="M26 28 Q28 25 30 28" stroke="#3A6B9B" strokeWidth="1" fill="none" opacity="0.4"/>
      <path d="M4 32 L32 32" stroke="#C8B89A" strokeWidth="0.75" strokeDasharray="3,2"/>
    </svg>
  );
}

function SanitationIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <rect x="11" y="14" width="14" height="16" rx="1" fill="#D6C9B0" stroke="#5C4A32" strokeWidth="1.2"/>
      <path d="M9 14 L27 14" stroke="#5C4A32" strokeWidth="1.2" strokeLinecap="round"/>
      <rect x="14" y="10" width="8" height="4" rx="1" fill="#CBBC9F" stroke="#5C4A32" strokeWidth="1"/>
      <path d="M15 18 L15 26 M18 18 L18 26 M21 18 L21 26" stroke="#5C4A32" strokeWidth="0.75" opacity="0.5"/>
      <path d="M8 30 Q14 25 18 28 Q22 31 28 27" stroke="#4A7C5F" strokeWidth="1" fill="none" opacity="0.5"/>
    </svg>
  );
}

function SafetyIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <path d="M18 4 L30 9 L30 20 C30 27 18 32 18 32 C18 32 6 27 6 20 L6 9 Z" fill="#F8EEEE" stroke="#9B3A3A" strokeWidth="1.2" opacity="0.8"/>
      <path d="M18 13 L18 20" stroke="#9B3A3A" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="18" cy="24" r="1.5" fill="#9B3A3A"/>
    </svg>
  );
}

function ParksIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <ellipse cx="18" cy="14" rx="10" ry="8" fill="#B8C9A3" opacity="0.6" stroke="#4A7C5F" strokeWidth="1"/>
      <ellipse cx="11" cy="16" rx="6" ry="5" fill="#C4D4A8" opacity="0.5" stroke="#4A7C5F" strokeWidth="0.75"/>
      <ellipse cx="25" cy="17" rx="6" ry="5" fill="#B8C9A3" opacity="0.5" stroke="#4A7C5F" strokeWidth="0.75"/>
      <rect x="16.5" y="20" width="3" height="10" fill="#5C4A32"/>
      <rect x="4" y="30" width="28" height="2" rx="1" fill="#C8B89A" opacity="0.5"/>
      <rect x="8" y="26" width="6" height="4" rx="0.5" fill="#D6C9B0" stroke="#C8B89A" strokeWidth="0.75"/>
    </svg>
  );
}

function EnvIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="16" r="10" fill="#C8D8C0" opacity="0.4" stroke="#4A7C5F" strokeWidth="1"/>
      <path d="M18 8 Q22 12 18 16 Q14 20 18 24" stroke="#4A7C5F" strokeWidth="1.2" fill="none"/>
      <path d="M12 12 Q16 10 18 16" stroke="#4A7C5F" strokeWidth="1" fill="none" opacity="0.6"/>
      <path d="M24 12 Q20 10 18 16" stroke="#4A7C5F" strokeWidth="1" fill="none" opacity="0.6"/>
      <path d="M8 30 Q13 27 18 29 Q23 31 28 28" stroke="#B8872A" strokeWidth="1.2" fill="none" opacity="0.7"/>
      <path d="M26 24 Q28 22 30 24 Q28 27 26 24Z" fill="#B8872A" opacity="0.4"/>
    </svg>
  );
}

// ─── PAGE 04 — Report: Category & Priority ────────────────────────────────────
function ReportCategoryPage({ onBack, onContinue }: { onBack: () => void; onContinue: () => void }) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<string | null>(null);
  const canContinue = selectedCategory !== null && selectedPriority !== null;
  const civic = useCivic();

  function pickCategory(id: string, label: string) {
    const next = selectedCategory === id ? null : id;
    setSelectedCategory(next);
    if (next) civic.setDraft({ category: id, categoryLabel: label });
  }

  function pickPriority(id: string, label: string) {
    setSelectedPriority(id);
    civic.setDraft({ priority: id.replace("-", "_"), priorityLabel: label });
  }

  const categories = [
    { id: "roads", label: "Roads & Infrastructure", desc: "Potholes, damaged roads, broken sidewalks and streetlights.", Icon: RoadsIcon, accent: "#C4622D" },
    { id: "water", label: "Water & Drainage", desc: "Leaks, flooding, blocked drains and water supply issues.", Icon: WaterIcon, accent: "#3A6B9B" },
    { id: "sanitation", label: "Sanitation", desc: "Overflowing bins, garbage, waste disposal and cleanliness.", Icon: SanitationIcon, accent: "#4A7C5F" },
    { id: "safety", label: "Public Safety", desc: "Unsafe roads, fallen trees, hazards and other public safety concerns.", Icon: SafetyIcon, accent: "#9B3A3A" },
    { id: "parks", label: "Parks & Public Spaces", desc: "Damaged playgrounds, parks, benches and public facilities.", Icon: ParksIcon, accent: "#4A7C5F" },
    { id: "environment", label: "Environment", desc: "Pollution, illegal dumping, noise and environmental concerns.", Icon: EnvIcon, accent: "#B8872A" },
  ];

  const priorities = [
    {
      id: "normal", label: "Normal", sub: "Minor issue with limited disruption.",
      color: "#3A6B9B", bg: "#EEF3F8", border: "#3A6B9B",
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <circle cx="9" cy="9" r="7" stroke="#3A6B9B" strokeWidth="1.2"/>
          <path d="M6 9 L12 9" stroke="#3A6B9B" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      id: "urgent", label: "Urgent", sub: "Significant disruption or growing public impact.",
      color: "#C4622D", bg: "#FBF0EA", border: "#C4622D",
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M9 2 L16 15 L2 15 Z" stroke="#C4622D" strokeWidth="1.2" fill="none"/>
          <path d="M9 7 L9 11" stroke="#C4622D" strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="9" cy="13" r="0.75" fill="#C4622D"/>
        </svg>
      ),
    },
    {
      id: "very-urgent", label: "Very Urgent", sub: "Immediate danger or major disruption requiring rapid attention.",
      color: "#9B3A3A", bg: "#F8EEEE", border: "#9B3A3A",
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M9 1.5 L16.5 15 L1.5 15 Z" stroke="#9B3A3A" strokeWidth="1.4" fill="#F8EEEE"/>
          <path d="M9 6 L9 11" stroke="#9B3A3A" strokeWidth="1.8" strokeLinecap="round"/>
          <circle cx="9" cy="13.5" r="1" fill="#9B3A3A"/>
        </svg>
      ),
    },
  ];

  return (
    <div style={{ background: "#F5F0E8", minHeight: "100vh", fontFamily: "var(--font-body)" }}>

      {/* ── Top bar ── */}
      <div className="sticky top-0 z-40 border-b" style={{ background: "rgba(245,240,232,0.97)", borderColor: "#C8B89A", backdropFilter: "blur(8px)" }}>
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 hover:opacity-60 transition-opacity"
            style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#5C4A32" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 2 L4 7 L9 12" stroke="#5C4A32" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to Dashboard
          </button>
          <div className="flex items-center gap-2">
            <CivicTraceLogo size={22}/>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.9rem", color: "#1C0A00" }}>CivicTrace</span>
          </div>
          <button onClick={onBack} className="hover:opacity-60 transition-opacity p-1">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 3 L13 13 M13 3 L3 13" stroke="#5C4A32" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* ── Page header ── */}
        <div className="text-center mb-8">
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.45, marginBottom: 8 }}>
            Citizen Report · Page 04 of 06
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "clamp(1.6rem, 3vw, 2.4rem)", color: "#1C0A00", lineHeight: 1.15, marginBottom: 8 }}>
            Report a Municipal Issue
          </h1>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.88rem", color: "#5C4A32", opacity: 0.65 }}>
            Tell us what needs attention in your city.
          </p>
        </div>

        {/* ── Progress ── */}
        <div className="mb-10">
          <ReportProgress step={1}/>
        </div>

        {/* ── Decorative rule ── */}
        <div className="flex items-center gap-4 mb-10">
          <div className="flex-1 h-px" style={{ background: "#C8B89A" }}/>
          <div className="w-1.5 h-1.5 rotate-45" style={{ background: "#C8B89A" }}/>
          <div className="flex-1 h-px" style={{ background: "#C8B89A" }}/>
        </div>

        {/* ── SECTION 1: Categories ── */}
        <section className="mb-12">
          <div className="mb-5">
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.5, marginBottom: 6 }}>
              Step 01 of 04
            </div>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.35rem", color: "#1C0A00" }}>
              What needs attention?
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {categories.map(({ id, label, desc, Icon, accent }) => {
              const selected = selectedCategory === id;
              return (
                <button key={id} onClick={() => pickCategory(id, label)}
                  className="relative text-left p-4 border transition-all"
                  style={{
                    background: selected ? "#FAF7F2" : "#FAF7F2",
                    borderColor: selected ? "#1C0A00" : "#C8B89A",
                    borderRadius: "2px",
                    borderWidth: selected ? "1.5px" : "1px",
                    boxShadow: selected ? "0 2px 12px rgba(28,10,0,0.08)" : "none",
                    transform: selected ? "translateY(-1px)" : "none",
                    transition: "all 0.15s ease",
                  }}>

                  {/* Corner notch — shows only when selected */}
                  {selected && (
                    <div className="absolute top-0 right-0 w-6 h-6 border-l border-b" style={{ borderColor: "#1C0A00" }}/>
                  )}

                  {/* Selection tick */}
                  <div className="absolute top-2.5 left-2.5 w-4 h-4 border flex items-center justify-center transition-all"
                    style={{
                      borderColor: selected ? "#1C0A00" : "#C8B89A",
                      background: selected ? "#1C0A00" : "transparent",
                      borderRadius: "1px",
                    }}>
                    {selected && (
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path d="M1.5 4 L3.5 6 L6.5 2" stroke="#F5F0E8" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>

                  {/* Icon */}
                  <div className="mb-3 mt-1 flex justify-center">
                    <div className="w-14 h-14 border flex items-center justify-center"
                      style={{ borderColor: selected ? accent + "60" : "#EDE5D4", background: selected ? accent + "10" : "#F5F0E8", borderRadius: "1px" }}>
                      <Icon/>
                    </div>
                  </div>

                  {/* Label */}
                  <div style={{
                    fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.82rem",
                    color: selected ? "#1C0A00" : "#3D1F00", marginBottom: 4, lineHeight: 1.2,
                  }}>
                    {label}
                  </div>

                  {/* Desc */}
                  <div style={{
                    fontFamily: "var(--font-body)", fontSize: "0.72rem",
                    color: "#5C4A32", opacity: selected ? 0.75 : 0.55,
                    lineHeight: 1.45,
                  }}>
                    {desc}
                  </div>

                  {/* Selected accent line */}
                  {selected && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: accent }}/>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Thin rule ── */}
        <div className="flex items-center gap-4 mb-10">
          <div className="flex-1 h-px" style={{ background: "#EDE5D4" }}/>
          <div className="w-1 h-1 rotate-45" style={{ background: "#C8B89A" }}/>
          <div className="flex-1 h-px" style={{ background: "#EDE5D4" }}/>
        </div>

        {/* ── SECTION 2: Priority ── */}
        <section className="mb-10">
          <div className="mb-5">
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.5, marginBottom: 6 }}>
              Priority Level
            </div>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.35rem", color: "#1C0A00" }}>
              How urgent is the issue?
            </h2>
          </div>

          <div className="flex flex-col md:flex-row gap-3 mb-4">
            {priorities.map(({ id, label, sub, color, bg, border, icon }) => {
              const selected = selectedPriority === id;
              return (
                <button key={id} onClick={() => pickPriority(id, label)}
                  className="flex-1 relative text-left p-4 border transition-all"
                  style={{
                    borderColor: selected ? color : "#C8B89A",
                    background: selected ? bg : "#FAF7F2",
                    borderRadius: "2px",
                    borderWidth: selected ? "1.5px" : "1px",
                    transform: selected ? "translateY(-1px)" : "none",
                    boxShadow: selected ? `0 3px 14px ${color}22` : "none",
                    transition: "all 0.15s ease",
                  }}>

                  {/* Top accent line */}
                  {selected && <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: color }}/>}

                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">{icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.95rem", color: selected ? color : "#1C0A00" }}>
                          {label}
                        </span>
                        {/* Radio indicator */}
                        <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center"
                          style={{ borderColor: selected ? color : "#C8B89A" }}>
                          {selected && <div className="w-2 h-2 rounded-full" style={{ background: color }}/>}
                        </div>
                      </div>
                      <div style={{ fontFamily: "var(--font-body)", fontSize: "0.76rem", color: "#5C4A32", opacity: 0.7, lineHeight: 1.4 }}>
                        {sub}
                      </div>
                      {/* Response window chip */}
                      <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 border"
                        style={{ borderColor: color + "40", background: color + "10", borderRadius: "1px" }}>
                        <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                          <circle cx="4.5" cy="4.5" r="3.5" stroke={color} strokeWidth="1"/>
                          <path d="M4.5 2.5 L4.5 4.5 L6 5.5" stroke={color} strokeWidth="0.8" strokeLinecap="round"/>
                        </svg>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.06em", color }}>
                          {id === "normal" ? "Response: 7–14 days" : id === "urgent" ? "Response: 3–7 days" : "Response: 24–72 hrs"}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Info note */}
          <div className="flex items-start gap-3 p-4 border"
            style={{ background: "#F0E8D8", borderColor: "#C8B89A", borderRadius: "2px" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0 mt-0.5">
              <circle cx="7" cy="7" r="5.5" stroke="#5C4A32" strokeWidth="1" opacity="0.5"/>
              <path d="M7 6 L7 10" stroke="#5C4A32" strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>
              <circle cx="7" cy="4.5" r="0.75" fill="#5C4A32" opacity="0.7"/>
            </svg>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.76rem", color: "#5C4A32", opacity: 0.75, lineHeight: 1.55 }}>
              Priority helps CivicTrace determine the appropriate response window and escalation threshold. AI may adjust this based on supporting reports.
            </p>
          </div>
        </section>

        {/* ── Selection summary chip (appears when both are chosen) ── */}
        {canContinue && (
          <div className="mb-6 flex items-center gap-3 p-4 border"
            style={{ background: "#EEF4F0", borderColor: "#4A7C5F", borderRadius: "2px" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 7 L6 10 L11 4" stroke="#4A7C5F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", color: "#1C0A00" }}>
              Reporting <strong>{categories.find(c => c.id === selectedCategory)?.label}</strong> ·{" "}
              <strong>{priorities.find(p => p.id === selectedPriority)?.label}</strong> priority
            </span>
          </div>
        )}

        {/* ── Bottom actions ── */}
        <div className="flex items-center justify-between pt-6 border-t" style={{ borderColor: "#C8B89A" }}>
          <button onClick={onBack}
            className="flex items-center gap-2 px-5 py-3 border hover:bg-[#EDE5D4] transition-colors"
            style={{ borderColor: "#C8B89A", color: "#5C4A32", borderRadius: "1px",
              fontFamily: "var(--font-mono)", fontSize: "0.62rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M8 2 L4 6 L8 10" stroke="#5C4A32" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </button>

          <div className="flex items-center gap-3">
            {/* Step indicator text */}
            {!canContinue && (
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", color: "#5C4A32", opacity: 0.5, letterSpacing: "0.06em" }}>
                {!selectedCategory ? "Select a category to continue" : "Select a priority to continue"}
              </span>
            )}
            <button onClick={canContinue ? onContinue : undefined}
              className="flex items-center gap-2 px-6 py-3 transition-all"
              style={{
                background: canContinue ? "#1C0A00" : "#C8B89A",
                color: canContinue ? "#F5F0E8" : "#FAF7F2",
                borderRadius: "1px", cursor: canContinue ? "pointer" : "default",
                fontFamily: "var(--font-mono)", fontSize: "0.62rem", letterSpacing: "0.12em", textTransform: "uppercase",
                opacity: canContinue ? 1 : 0.55,
                transition: "all 0.2s ease",
              }}>
              Continue
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M4 2 L8 6 L4 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PAGE 05 — Report: Evidence Capture ──────────────────────────────────────
function ReportEvidencePage({ onBack, onContinue }: { onBack: () => void; onContinue: () => void }) {
  const [captured, setCaptured] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [method, setMethod] = useState<"camera" | "upload" | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [camActive, setCamActive] = useState(false);
  const [camErr, setCamErr] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [captureTimestamp, setCaptureTimestamp] = useState<Date | null>(null);
  const civic = useCivic();

  function stopCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCamActive(false);
  }

  // Attach the live stream once the video element is rendered.
  useEffect(() => {
    if (camActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [camActive]);

  // Never leave the camera running when leaving this step.
  useEffect(() => () => { streamRef.current?.getTracks().forEach(t => t.stop()); }, []);

  async function startCamera() {
    setCamErr("");
    setMethod("camera");
    if (!navigator.mediaDevices?.getUserMedia) {
      setMethod(null);
      setCamErr("This browser cannot access the camera. Use Upload File instead.");
      return;
    }
    setUploading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      streamRef.current = stream;
      setCamActive(true);
    } catch {
      setMethod(null);
      setCamErr("Camera blocked — allow camera permission in the browser, or use Upload File.");
    } finally {
      setUploading(false);
    }
  }

  function capturePhoto() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const scale = Math.min(1, 1280 / video.videoWidth);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
    const now = new Date();
    setPreview(dataUrl);
    setCaptureTimestamp(now);
    civic.setDraft({ photoDataUrl: dataUrl, photoNote: `Captured at ${now.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}` });
    setCaptured(true);
    stopCamera();
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = ev => {
      setTimeout(() => {
        setUploading(false);
        setCaptured(true);
        const now = new Date();
        const dataUrl = ev.target?.result as string;
        setPreview(dataUrl);
        setCaptureTimestamp(now);
        civic.setDraft({ photoDataUrl: dataUrl, photoNote: `Uploaded at ${now.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}` });
      }, 800);
    };
    reader.readAsDataURL(file);
  }

  // Keep draft note in sync for submit.
  useEffect(() => { civic.setDraft({ photoNote: note }); }, [note]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ background: "#F5F0E8", minHeight: "100vh", fontFamily: "var(--font-body)" }}>

      {/* Top bar */}
      <div className="sticky top-0 z-40 border-b" style={{ background: "rgba(245,240,232,0.97)", borderColor: "#C8B89A", backdropFilter: "blur(8px)" }}>
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 hover:opacity-60 transition-opacity"
            style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#5C4A32" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 2 L4 7 L9 12" stroke="#5C4A32" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </button>
          <div className="flex items-center gap-2">
            <CivicTraceLogo size={22}/>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.9rem", color: "#1C0A00" }}>CivicTrace</span>
          </div>
          <button onClick={() => onBack()} className="hover:opacity-60 transition-opacity p-1">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 3 L13 13 M13 3 L3 13" stroke="#5C4A32" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* Page header */}
        <div className="text-center mb-8">
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.45, marginBottom: 8 }}>
            Citizen Report · Page 05 of 06
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "clamp(1.6rem, 3vw, 2.4rem)", color: "#1C0A00", lineHeight: 1.15, marginBottom: 8 }}>
            Capture Evidence
          </h1>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.88rem", color: "#5C4A32", opacity: 0.65 }}>
            Photographic evidence strengthens your complaint and is required for resolution.
          </p>
        </div>

        <div className="mb-10"><ReportProgress step={2}/></div>

        <div className="flex items-center gap-4 mb-10">
          <div className="flex-1 h-px" style={{ background: "#C8B89A" }}/>
          <div className="w-1.5 h-1.5 rotate-45" style={{ background: "#C8B89A" }}/>
          <div className="flex-1 h-px" style={{ background: "#C8B89A" }}/>
        </div>

        <div className="grid md:grid-cols-[1fr_300px] gap-8 items-start">

          {/* Main capture area */}
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.5, marginBottom: 6 }}>
              Step 02 of 04
            </div>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.35rem", color: "#1C0A00", marginBottom: 16 }}>
              Add photographic evidence
            </h2>

            {/* Capture zone */}
            {!captured ? (
              <div>
                <div className="border-2 border-dashed flex flex-col items-center justify-center text-center p-12 mb-4"
                  style={{ borderColor: "#C8B89A", background: "#FAF7F2", borderRadius: "2px", minHeight: 280, position: "relative" }}>

                  {uploading ? (
                    <div className="flex flex-col items-center gap-4">
                      <svg className="animate-spin" width="32" height="32" viewBox="0 0 32 32" fill="none">
                        <circle cx="16" cy="16" r="12" stroke="#C8B89A" strokeWidth="2"/>
                        <path d="M16 4 A12 12 0 0 1 28 16" stroke="#1C0A00" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", letterSpacing: "0.1em", color: "#5C4A32", opacity: 0.6 }}>
                        {method === "camera" ? "Accessing camera…" : "Processing image…"}
                      </div>
                    </div>
                  ) : method === "camera" && camActive ? (
                    <>
                      {/* Live camera viewfinder */}
                      <video ref={videoRef} autoPlay playsInline muted className="w-full"
                        style={{ maxHeight: 320, background: "#1C0A00", borderRadius: "2px", marginBottom: 16 }}/>
                      <button onClick={capturePhoto}
                        className="flex items-center justify-center gap-2 px-8 py-3 transition-colors hover:opacity-90"
                        style={{ background: "#1C0A00", color: "#F5F0E8", borderRadius: "1px",
                          fontFamily: "var(--font-mono)", fontSize: "0.62rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2"/>
                          <circle cx="7" cy="7" r="2" fill="currentColor"/>
                        </svg>
                        Capture Photo
                      </button>
                      <div style={{ fontFamily: "var(--font-body)", fontSize: "0.74rem", color: "#5C4A32", opacity: 0.6, maxWidth: 280, lineHeight: 1.5, marginTop: 10 }}>
                        Live camera — frame the issue and capture. The photo is time-stamped and sent with your report.
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Camera illustration */}
                      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" style={{ marginBottom: 16, opacity: 0.4 }}>
                        <rect x="8" y="18" width="48" height="36" rx="3" stroke="#1C0A00" strokeWidth="1.5" fill="none"/>
                        <path d="M22 18 L26 10 L38 10 L42 18" stroke="#1C0A00" strokeWidth="1.5" fill="none"/>
                        <circle cx="32" cy="36" r="10" stroke="#1C0A00" strokeWidth="1.5" fill="none"/>
                        <circle cx="32" cy="36" r="6" stroke="#1C0A00" strokeWidth="1" fill="none"/>
                        <circle cx="32" cy="36" r="2.5" fill="#1C0A00" opacity="0.3"/>
                        <rect x="46" y="22" width="6" height="4" rx="1" fill="#1C0A00" opacity="0.2"/>
                      </svg>
                      <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "1rem", color: "#1C0A00", marginBottom: 6 }}>
                        No evidence captured yet
                      </div>
                      <div style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "#5C4A32", opacity: 0.6, maxWidth: 280, lineHeight: 1.5 }}>
                        Use your camera or upload a file. Evidence is time-stamped and hash-verified before submission.
                      </div>
                    </>
                  )}
                </div>

                {/* Capture options */}
                <div className="flex gap-3">
                  <button onClick={startCamera}
                    className="flex-1 flex items-center justify-center gap-2 py-3 border hover:bg-[#1C0A00] hover:text-[#F5F0E8] group transition-colors"
                    style={{ borderColor: "#1C0A00", color: "#1C0A00", borderRadius: "1px",
                      fontFamily: "var(--font-mono)", fontSize: "0.62rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <rect x="1" y="3" width="12" height="9" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                      <path d="M5 3 L5.8 1.5 L8.2 1.5 L9 3" stroke="currentColor" strokeWidth="1" fill="none"/>
                      <circle cx="7" cy="7.5" r="2.5" stroke="currentColor" strokeWidth="1"/>
                    </svg>
                    Take Photo
                  </button>
                  <button onClick={() => fileRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-2 py-3 border hover:bg-[#EDE5D4] transition-colors"
                    style={{ borderColor: "#C8B89A", color: "#5C4A32", borderRadius: "1px",
                      fontFamily: "var(--font-mono)", fontSize: "0.62rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <rect x="2" y="3" width="10" height="8" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                      <path d="M7 1.5 L7 7 M5 4 L7 1.5 L9 4" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                    </svg>
                    Upload File
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile}/>
                </div>
                {camErr && (
                  <div className="mt-3 px-4 py-3 border"
                    style={{ background: "#F8EEEE", borderColor: "#9B3A3A", borderRadius: "1px",
                      fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "#9B3A3A", lineHeight: 1.5 }}>
                    {camErr}
                  </div>
                )}
              </div>
            ) : (
              /* Preview state */
              <div>
                <div className="border relative overflow-hidden mb-4"
                  style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#EDE5D4", minHeight: 280 }}>
                  {preview ? (
                    <img src={preview} alt="Captured evidence" className="w-full object-cover" style={{ maxHeight: 360 }}/>
                  ) : (
                    /* Simulated photo placeholder */
                    <div className="flex flex-col items-center justify-center" style={{ minHeight: 280 }}>
                      <svg width="72" height="72" viewBox="0 0 72 72" fill="none" style={{ opacity: 0.25 }}>
                        <rect width="72" height="72" fill="#C8B89A" rx="2"/>
                        <path d="M20 50 L28 38 L36 46 L46 32 L58 50Z" fill="#5C4A32" opacity="0.4"/>
                        <circle cx="24" cy="26" r="6" fill="#5C4A32" opacity="0.3"/>
                      </svg>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "#5C4A32", opacity: 0.4, marginTop: 8 }}>
                        SIMULATED CAPTURE
                      </div>
                    </div>
                  )}

                  {/* Overlay badges */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1.5 border"
                    style={{ background: "rgba(245,240,232,0.92)", borderColor: "#C8B89A", borderRadius: "1px" }}>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#4A7C5F" }}/>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.08em", color: "#1C0A00" }}>
                      {(captureTimestamp || new Date()).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" }).replace(",", " ·")} IST
                    </span>
                  </div>
                  <div className="absolute top-3 right-3 px-2.5 py-1.5 border"
                    style={{ background: "rgba(245,240,232,0.92)", borderColor: "#C8B89A", borderRadius: "1px" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.06em", color: "#3A6B9B" }}>
                      0x4f91…a3c7
                    </span>
                  </div>
                  <div className="absolute bottom-3 right-3 px-2.5 py-1.5 border flex items-center gap-1.5"
                    style={{ background: "rgba(238,244,240,0.95)", borderColor: "#4A7C5F", borderRadius: "1px" }}>
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                      <path d="M2 4.5 L3.8 6.3 L7 3" stroke="#4A7C5F" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", color: "#4A7C5F" }}>Hash verified</span>
                  </div>
                </div>

                <div className="flex gap-3 mb-4">
                  <button onClick={() => { stopCamera(); setCaptured(false); setPreview(null); setMethod(null); setCamErr(""); setCaptureTimestamp(null); civic.setDraft({ photoDataUrl: null }); }}
                    className="flex items-center gap-1.5 px-4 py-2.5 border hover:bg-[#EDE5D4] transition-colors"
                    style={{ borderColor: "#C8B89A", color: "#5C4A32", borderRadius: "1px",
                      fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                      <path d="M2 5.5 C2 3.6 3.6 2 5.5 2 C6.5 2 7.4 2.4 8 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                      <path d="M8 1.5 L8 3.5 L6 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9 5.5 C9 7.4 7.4 9 5.5 9 C4.5 9 3.6 8.6 3 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                    Retake
                  </button>
                  <div className="flex-1 flex items-center gap-2 px-3 border"
                    style={{ borderColor: "#4A7C5F", background: "#EEF4F0", borderRadius: "1px" }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M3 6 L5 8 L9 4" stroke="#4A7C5F" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.06em", color: "#4A7C5F" }}>
                      Evidence accepted · Time-stamped and hash-verified
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Additional note */}
            <div className="mt-4">
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.5, marginBottom: 6 }}>
                Additional Note <span style={{ opacity: 0.5 }}>(Optional)</span>
              </div>
              <textarea rows={3} value={note} onChange={e => setNote(e.target.value)}
                placeholder="Describe the issue in a few words — e.g. 'Large pothole causing vehicle damage near junction.'"
                style={{
                  width: "100%", padding: "10px 14px", border: "1px solid #C8B89A", borderRadius: "1px",
                  background: "#FAF7F2", color: "#1C0A00", fontFamily: "var(--font-body)", fontSize: "0.85rem",
                  resize: "vertical", outline: "none", lineHeight: 1.55,
                }}/>
            </div>
          </div>

          {/* Right: info panel */}
          <div className="space-y-4">
            {/* Evidence policy card */}
            <div className="border p-5" style={{ background: "#FAF7F2", borderColor: "#C8B89A", borderRadius: "2px" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.5, marginBottom: 10 }}>
                Evidence Policy
              </div>
              {[
                { icon: "📸", text: "Photo must be taken at the time of reporting." },
                { icon: "🔒", text: "Evidence is hash-verified and time-stamped before submission." },
                { icon: "✓", text: "Authorities must provide counter-evidence before resolving." },
                { icon: "🔍", text: "Evidence is publicly accessible for verification." },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-start gap-3 py-2.5 border-b last:border-0" style={{ borderColor: "#EDE5D4" }}>
                  <span style={{ fontSize: "0.85rem" }}>{icon}</span>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "0.76rem", color: "#5C4A32", opacity: 0.75, lineHeight: 1.5 }}>{text}</p>
                </div>
              ))}
            </div>

            {/* Blockchain hash preview */}
            <div className="border p-4" style={{ background: "#EDE5D4", borderColor: "#C8B89A", borderRadius: "2px" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.5, marginBottom: 8 }}>
                On-Chain Record Preview
              </div>
              <div className="space-y-2">
                {[
                  { label: "Complaint ID", val: "CTY-PENDING" },
                  { label: "Timestamp", val: "13 SEP 2026 · 10:42" },
                  { label: "Evidence Hash", val: captured ? "0x4f91…a3c7" : "—" },
                  { label: "Status", val: captured ? "Ready" : "Awaiting evidence" },
                ].map(({ label, val }) => (
                  <div key={label} className="flex justify-between items-center">
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.57rem", color: "#5C4A32", opacity: 0.55 }}>{label}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: captured && label === "Evidence Hash" ? "#3A6B9B" : "#1C0A00", fontWeight: label === "Evidence Hash" && captured ? 400 : 600 }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom actions */}
        <div className="flex items-center justify-between pt-8 mt-4 border-t" style={{ borderColor: "#C8B89A" }}>
          <button onClick={onBack}
            className="flex items-center gap-2 px-5 py-3 border hover:bg-[#EDE5D4] transition-colors"
            style={{ borderColor: "#C8B89A", color: "#5C4A32", borderRadius: "1px",
              fontFamily: "var(--font-mono)", fontSize: "0.62rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M8 2 L4 6 L8 10" stroke="#5C4A32" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </button>
          <div className="flex items-center gap-3">
            {!captured && (
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", color: "#5C4A32", opacity: 0.5 }}>
                Evidence required to continue
              </span>
            )}
            <button onClick={captured ? onContinue : undefined}
              className="flex items-center gap-2 px-6 py-3 transition-all"
              style={{
                background: captured ? "#1C0A00" : "#C8B89A",
                color: captured ? "#F5F0E8" : "#FAF7F2",
                borderRadius: "1px", cursor: captured ? "pointer" : "default",
                fontFamily: "var(--font-mono)", fontSize: "0.62rem", letterSpacing: "0.12em", textTransform: "uppercase",
                opacity: captured ? 1 : 0.5,
                transition: "all 0.2s ease",
              }}>
              Continue
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M4 2 L8 6 L4 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PAGE 06 — Report Details (Step 3 of 4) ──────────────────────────────────
function ReportDetailsPage({ onBack, onContinue }: { onBack: () => void; onContinue: () => void }) {
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [aiVisible, setAiVisible] = useState(false);
  const [aiDismissed, setAiDismissed] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [photoTaken, setPhotoTaken] = useState(false);
  const [flash, setFlash] = useState(false);
  const [duplicateChoice, setDuplicateChoice] = useState<"combine" | "separate" | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [scanning, setScanning] = useState(false);
  const scanLineRef = useRef<number>(0);
  const [scanY, setScanY] = useState(0);

  // Trigger AI match after typing in summary
  useEffect(() => {
    if (summary.length > 6 && !aiVisible && !aiDismissed) {
      const t = setTimeout(() => { setAiVisible(true); }, 900);
      return () => clearTimeout(t);
    }
  }, [summary, aiVisible, aiDismissed]);

  // Scan animation
  useEffect(() => {
    if (!cameraActive || photoTaken) return;
    setScanning(true);
    let dir = 1;
    let y = 0;
    const id = setInterval(() => {
      y += dir * 1.5;
      if (y >= 100) dir = -1;
      if (y <= 0) dir = 1;
      setScanY(y);
    }, 16);
    return () => clearInterval(id);
  }, [cameraActive, photoTaken]);

  function handleTakePhoto() {
    setFlash(true);
    setTimeout(() => { setFlash(false); setPhotoTaken(true); setScanning(false); }, 300);
  }

  function handleDuplicateChoice(c: "combine" | "separate") {
    setDuplicateChoice(c);
    setToastVisible(true);
  }

  const canContinue = summary.trim().length > 0 && photoTaken;
  const civic = useCivic();
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState("");

  async function handleSubmit() {
    if (!canContinue || submitting) return;
    setSubmitting(true);
    setSubmitErr("");
    civic.setDraft({ summary: summary.trim(), description: description.trim() });
    // Submit against the live backend. Only advance on success — a failed save
    // stays on this page with the error shown, and never shows a demo code.
    const result = await civic.submitReport().catch(() => null);
    setSubmitting(false);
    if (!result || !result.ok) {
      setSubmitErr(result?.error || "Could not save your report. Check your connection and try again.");
      return;
    }
    onContinue();
  }

  const inputBase: React.CSSProperties = {
    width: "100%", padding: "10px 14px",
    border: "1px solid #C8B89A", borderRadius: "1px",
    background: "#FAF7F2", color: "#1C0A00",
    fontFamily: "var(--font-body)", fontSize: "0.875rem",
    outline: "none", transition: "border-color 0.15s",
  };

  return (
    <div style={{ background: "#F5F0E8", minHeight: "100vh", fontFamily: "var(--font-body)", paddingBottom: 100 }}>

      {/* ── Top bar ── */}
      <div className="sticky top-0 z-40 border-b" style={{ background: "rgba(245,240,232,0.97)", borderColor: "#C8B89A", backdropFilter: "blur(8px)" }}>
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5" style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.08em", color: "#5C4A32", opacity: 0.6 }}>
            <button onClick={() => {}} className="hover:opacity-100 transition-opacity">Dashboard</button>
            <span>›</span>
            <button onClick={onBack} className="hover:opacity-100 transition-opacity">Report</button>
            <span>›</span>
            <button onClick={onBack} className="hover:opacity-100 transition-opacity">Evidence</button>
            <span>›</span>
            <span style={{ color: "#1C0A00", opacity: 1, fontWeight: 700 }}>Add Details</span>
          </div>
          <div className="flex items-center gap-2">
            <CivicTraceLogo size={22}/>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.9rem", color: "#1C0A00" }}>CivicTrace</span>
          </div>
          <button onClick={onBack} className="hover:opacity-60 transition-opacity p-1">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 3 L13 13 M13 3 L3 13" stroke="#5C4A32" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* ── Page title row ── */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.45, marginBottom: 6 }}>
              Citizen Report · Step 3 of 4
            </div>
            <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "clamp(1.5rem, 3vw, 2.1rem)", color: "#1C0A00", lineHeight: 1.15 }}>
              Report Details: Parks &amp; Public Spaces
            </h1>
          </div>
          {/* Add Text Details pill */}
          <button className="self-start flex items-center gap-2 px-4 py-2 border hover:bg-[#EDE5D4] transition-colors"
            style={{ borderColor: "#C8B89A", color: "#5C4A32", borderRadius: "1px",
              fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <rect x="1" y="1" width="9" height="9" rx="1" stroke="currentColor" strokeWidth="1"/>
              <path d="M5.5 3.5 L5.5 7.5 M3.5 5.5 L7.5 5.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
            </svg>
            Add Text Details
          </button>
        </div>

        {/* ── Progress ── */}
        <div className="mb-8"><ReportProgress step={3}/></div>

        {/* ── Decorative rule ── */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 h-px" style={{ background: "#C8B89A" }}/>
          <div className="w-1.5 h-1.5 rotate-45" style={{ background: "#C8B89A" }}/>
          <div className="flex-1 h-px" style={{ background: "#C8B89A" }}/>
        </div>

        {/* ── Main two-column grid ── */}
        <div className="grid lg:grid-cols-[1fr_340px] gap-8 items-start">

          {/* LEFT — form */}
          <div className="space-y-6">

            {/* Issue Summary */}
            <div>
              <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.6, marginBottom: 6 }}>
                Issue Summary
              </label>
              <div className="relative">
                <input
                  value={summary}
                  onChange={e => setSummary(e.target.value)}
                  placeholder="e.g., Broken swing in central park play area"
                  style={{ ...inputBase, paddingRight: aiVisible && !aiDismissed ? "120px" : "14px" }}
                />
                {/* AI scanning pulse on the input */}
                {summary.length > 0 && summary.length <= 6 && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5" style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", color: "#5C4A32", opacity: 0.4 }}>
                    <svg className="animate-spin" width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <circle cx="5" cy="5" r="3.5" stroke="#C8B89A" strokeWidth="1"/>
                      <path d="M5 1.5 A3.5 3.5 0 0 1 8.5 5" stroke="#3A6B9B" strokeWidth="1" strokeLinecap="round"/>
                    </svg>
                    Scanning…
                  </div>
                )}
              </div>

              {/* AI Match alert — floats below the field */}
              {aiVisible && !aiDismissed && (
                <div className="mt-2 flex items-start gap-3 p-4 border"
                  style={{ background: "#1C0A00", borderColor: "#1C0A00", borderRadius: "2px", position: "relative" }}>
                  {/* Arrow up */}
                  <div style={{ position: "absolute", top: -6, left: 24, width: 0, height: 0,
                    borderLeft: "6px solid transparent", borderRight: "6px solid transparent",
                    borderBottom: "6px solid #1C0A00" }}/>
                  <div className="flex-shrink-0 w-9 h-9 border flex items-center justify-center"
                    style={{ borderColor: "#3A6B9B", background: "#3A6B9B22", borderRadius: "1px" }}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <rect x="2" y="2" width="16" height="16" rx="2" stroke="#3A6B9B" strokeWidth="1.2"/>
                      <path d="M6 10 Q10 6 14 10 Q10 14 6 10Z" stroke="#3A6B9B" strokeWidth="1" fill="none"/>
                      <circle cx="10" cy="10" r="2" fill="#3A6B9B" opacity="0.5"/>
                      <path d="M5 5 L7 7 M15 5 L13 7 M5 15 L7 13 M15 15 L13 13" stroke="#3A6B9B" strokeWidth="0.8"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#F5F0E8", marginBottom: 3 }}>
                      AI Match Detected:
                    </div>
                    <div style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "#F5F0E8", lineHeight: 1.5 }}>
                      Similar report{" "}
                      <span style={{ fontFamily: "var(--font-mono)", color: "#3A6B9B", fontWeight: 700 }}>#CTY-9876</span>{" "}
                      found. Review before submitting.
                    </div>
                  </div>
                  <button onClick={() => setAiDismissed(true)} className="flex-shrink-0 hover:opacity-60 transition-opacity">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M3 3 L11 11 M11 3 L3 11" stroke="#F5F0E8" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Detailed Description */}
            <div>
              <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.6, marginBottom: 6 }}>
                Detailed Description
              </label>
              <textarea rows={4} value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Describe the exact condition — extent of damage, who is at risk, how long this has been an issue…"
                style={{ ...inputBase, resize: "vertical", lineHeight: 1.6 }}/>
            </div>

            {/* ── Evidence & Verification Photo ── */}
            <div>
              <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.6, marginBottom: 10 }}>
                Add Evidence and Verification Photo
              </label>

              <div className="grid grid-cols-2 gap-3">
                {/* Slot 1 — uploaded evidence (from previous step, shown as filled) */}
                <div className="border relative overflow-hidden"
                  style={{ borderColor: "#C8B89A", background: "#EDE5D4", borderRadius: "2px", aspectRatio: "4/3" }}>
                  {/* Simulated uploaded photo */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center"
                    style={{ background: "#D6C9B0" }}>
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ opacity: 0.3 }}>
                      <rect width="48" height="48" fill="#C8B89A" rx="1"/>
                      <path d="M10 36 L18 24 L26 32 L34 20 L42 36Z" fill="#5C4A32" opacity="0.4"/>
                      <circle cx="16" cy="16" r="5" fill="#5C4A32" opacity="0.25"/>
                    </svg>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", color: "#5C4A32", opacity: 0.4, marginTop: 6, letterSpacing: "0.08em" }}>
                      EVIDENCE UPLOADED
                    </div>
                  </div>
                  {/* Timestamp badge */}
                  <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 border"
                    style={{ background: "rgba(245,240,232,0.9)", borderColor: "#C8B89A", borderRadius: "1px" }}>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#4A7C5F" }}/>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.48rem", color: "#1C0A00", letterSpacing: "0.06em" }}>13 SEP · 10:42</span>
                  </div>
                  {/* Hash */}
                  <div className="absolute bottom-2 right-2 px-2 py-1 border"
                    style={{ background: "rgba(245,240,232,0.9)", borderColor: "#C8B89A", borderRadius: "1px" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.47rem", color: "#3A6B9B" }}>0x4f91…a3c7</span>
                  </div>
                </div>

                {/* Slot 2 — Camera / Verification shot */}
                <div className="border relative overflow-hidden"
                  style={{ borderColor: cameraActive ? "#1C0A00" : "#C8B89A", background: "#1A1008", borderRadius: "2px", aspectRatio: "4/3", cursor: !cameraActive ? "pointer" : "default" }}
                  onClick={() => !cameraActive && !photoTaken && setCameraActive(true)}>

                  {!cameraActive && !photoTaken && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2"
                      style={{ background: "#EDE5D4" }}>
                      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" style={{ opacity: 0.35 }}>
                        <rect x="3" y="8" width="30" height="22" rx="2" stroke="#1C0A00" strokeWidth="1.2"/>
                        <path d="M12 8 L14 4 L22 4 L24 8" stroke="#1C0A00" strokeWidth="1.2" fill="none"/>
                        <circle cx="18" cy="19" r="7" stroke="#1C0A00" strokeWidth="1.2"/>
                        <circle cx="18" cy="19" r="3.5" stroke="#1C0A00" strokeWidth="1"/>
                      </svg>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.5 }}>
                        Tap to activate camera
                      </span>
                    </div>
                  )}

                  {cameraActive && !photoTaken && (
                    <>
                      {/* Camera viewfinder */}
                      <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #2A2010 0%, #1A0E00 100%)" }}>
                        {/* Scene content */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg width="90%" height="90%" viewBox="0 0 200 150" style={{ opacity: 0.55 }}>
                            {/* Ground */}
                            <rect x="0" y="100" width="200" height="50" fill="#3D2E10" opacity="0.6"/>
                            {/* Swing frame */}
                            <line x1="70" y1="20" x2="130" y2="20" stroke="#8B7355" strokeWidth="3"/>
                            <line x1="80" y1="20" x2="80" y2="120" stroke="#6B5535" strokeWidth="2"/>
                            <line x1="120" y1="20" x2="120" y2="120" stroke="#6B5535" strokeWidth="2"/>
                            {/* Hanging chains */}
                            <line x1="90" y1="20" x2="90" y2="60" stroke="#5C4A32" strokeWidth="1" strokeDasharray="3,2"/>
                            <line x1="110" y1="20" x2="110" y2="60" stroke="#5C4A32" strokeWidth="1" strokeDasharray="3,2"/>
                            {/* Broken seat */}
                            <path d="M88 62 L100 64 L112 62" stroke="#C8B89A" strokeWidth="2" fill="none"/>
                            <path d="M100 64 L102 80" stroke="#C8B89A" strokeWidth="1.5"/>
                            {/* Fallen piece */}
                            <rect x="85" y="95" width="20" height="5" rx="1" fill="#A09070" opacity="0.7" transform="rotate(-15 95 97)"/>
                          </svg>
                        </div>
                        {/* Scan line */}
                        <div className="absolute left-0 right-0" style={{ top: `${scanY}%`, height: "2px", background: "rgba(58,107,155,0.6)", boxShadow: "0 0 8px rgba(58,107,155,0.8)" }}/>
                        {/* Corner brackets — target reticle */}
                        {[["top-[20%] left-[15%]", "border-t-2 border-l-2"],
                          ["top-[20%] right-[15%]", "border-t-2 border-r-2"],
                          ["bottom-[20%] left-[15%]", "border-b-2 border-l-2"],
                          ["bottom-[20%] right-[15%]", "border-b-2 border-r-2"],
                        ].map(([pos, border], i) => (
                          <div key={i} className={`absolute w-5 h-5 ${pos} ${border}`}
                            style={{ borderColor: "#3A6B9B" }}/>
                        ))}
                        {/* Crosshair centre */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" style={{ opacity: 0.7 }}>
                            <path d="M11 4 L11 8 M11 14 L11 18 M4 11 L8 11 M14 11 L18 11" stroke="#3A6B9B" strokeWidth="1.5" strokeLinecap="round"/>
                            <circle cx="11" cy="11" r="3" stroke="#3A6B9B" strokeWidth="1"/>
                          </svg>
                        </div>
                        {/* Instruction */}
                        <div className="absolute bottom-8 left-0 right-0 text-center"
                          style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.1em", color: "#F5F0E8", opacity: 0.7 }}>
                          Align damage within target
                        </div>
                        {/* Flash overlay */}
                        {flash && <div className="absolute inset-0" style={{ background: "white" }}/>}
                      </div>
                      {/* Camera controls */}
                      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-center gap-2">
                        <button onClick={handleTakePhoto}
                          className="flex items-center gap-1.5 px-3 py-1.5 border transition-colors hover:bg-[#F5F0E8]"
                          style={{ background: "rgba(245,240,232,0.92)", borderColor: "#C8B89A", borderRadius: "1px",
                            fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.08em", color: "#1C0A00" }}>
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <circle cx="5" cy="5" r="4" stroke="#1C0A00" strokeWidth="1"/>
                            <circle cx="5" cy="5" r="2" fill="#9B3A3A"/>
                          </svg>
                          Take Verification Photo
                        </button>
                        <button onClick={() => setFlash(v => !v)}
                          className="px-2.5 py-1.5 border"
                          style={{ background: "rgba(245,240,232,0.85)", borderColor: "#C8B89A", borderRadius: "1px",
                            fontFamily: "var(--font-mono)", fontSize: "0.5rem", color: "#1C0A00" }}>
                          Flash: Auto
                        </button>
                        <button onClick={() => setCameraActive(false)}
                          className="px-2.5 py-1.5 border"
                          style={{ background: "rgba(245,240,232,0.85)", borderColor: "#C8B89A", borderRadius: "1px",
                            fontFamily: "var(--font-mono)", fontSize: "0.5rem", color: "#1C0A00" }}>
                          Cancel
                        </button>
                      </div>
                    </>
                  )}

                  {photoTaken && (
                    <div className="absolute inset-0" style={{ background: "#2A1A08" }}>
                      {/* Captured frame */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg width="90%" height="90%" viewBox="0 0 200 150" style={{ opacity: 0.6 }}>
                          <rect x="0" y="100" width="200" height="50" fill="#3D2E10" opacity="0.6"/>
                          <line x1="70" y1="20" x2="130" y2="20" stroke="#8B7355" strokeWidth="3"/>
                          <line x1="80" y1="20" x2="80" y2="120" stroke="#6B5535" strokeWidth="2"/>
                          <line x1="120" y1="20" x2="120" y2="120" stroke="#6B5535" strokeWidth="2"/>
                          <line x1="90" y1="20" x2="90" y2="60" stroke="#5C4A32" strokeWidth="1" strokeDasharray="3,2"/>
                          <line x1="110" y1="20" x2="110" y2="60" stroke="#5C4A32" strokeWidth="1" strokeDasharray="3,2"/>
                          <path d="M88 62 L100 64 L112 62" stroke="#C8B89A" strokeWidth="2" fill="none"/>
                          <path d="M100 64 L102 80" stroke="#C8B89A" strokeWidth="1.5"/>
                          <rect x="85" y="95" width="20" height="5" rx="1" fill="#A09070" opacity="0.7" transform="rotate(-15 95 97)"/>
                        </svg>
                      </div>
                      {/* Verified overlay */}
                      <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 border"
                        style={{ background: "rgba(238,244,240,0.95)", borderColor: "#4A7C5F", borderRadius: "1px" }}>
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                          <path d="M1.5 4 L3.2 5.8 L6.5 2.5" stroke="#4A7C5F" strokeWidth="1.2" strokeLinecap="round"/>
                        </svg>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.47rem", color: "#4A7C5F" }}>Verified</span>
                      </div>
                      <div className="absolute bottom-2 right-2 px-2 py-1 border"
                        style={{ background: "rgba(245,240,232,0.9)", borderColor: "#C8B89A", borderRadius: "1px" }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.47rem", color: "#3A6B9B" }}>0xb3f2…91dc</span>
                      </div>
                      <button onClick={() => { setPhotoTaken(false); setCameraActive(true); }}
                        className="absolute bottom-2 left-2 px-2 py-1 border hover:opacity-80 transition-opacity"
                        style={{ background: "rgba(245,240,232,0.9)", borderColor: "#C8B89A", borderRadius: "1px",
                          fontFamily: "var(--font-mono)", fontSize: "0.47rem", color: "#1C0A00" }}>
                        Retake
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — Duplication Handling */}
          <div className="space-y-4">
            {/* Panel header */}
            <div className="border" style={{ background: "#FAF7F2", borderColor: "#C8B89A", borderRadius: "2px" }}>
              <div className="relative">
                <div className="absolute top-0 right-0 w-6 h-6 border-l border-b" style={{ borderColor: "#C8B89A" }}/>
              </div>
              <div className="px-5 pt-5 pb-4 border-b" style={{ borderColor: "#C8B89A" }}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: "#B8872A" }}/>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#B8872A" }}>
                    AI — Duplicate Detected
                  </span>
                </div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", color: "#1C0A00" }}>
                  Duplication Handling
                </div>
              </div>

              {/* Similar report card */}
              <div className="p-5 border-b" style={{ borderColor: "#C8B89A" }}>
                <div className="flex gap-3">
                  {/* Thumbnail */}
                  <div className="w-16 h-14 flex-shrink-0 border overflow-hidden"
                    style={{ borderColor: "#C8B89A", background: "#2A1A08", borderRadius: "1px" }}>
                    <svg width="100%" height="100%" viewBox="0 0 64 56" fill="none" style={{ opacity: 0.5 }}>
                      <rect width="64" height="56" fill="#3D2E10"/>
                      <line x1="22" y1="5" x2="42" y2="5" stroke="#8B7355" strokeWidth="2"/>
                      <line x1="26" y1="5" x2="26" y2="40" stroke="#6B5535" strokeWidth="1.5"/>
                      <line x1="38" y1="5" x2="38" y2="40" stroke="#6B5535" strokeWidth="1.5"/>
                      <path d="M28 22 L32 23 L36 22" stroke="#C8B89A" strokeWidth="1.5" fill="none"/>
                      <rect x="27" y="40" width="10" height="3" rx="0.5" fill="#A09070" opacity="0.6" transform="rotate(-10 32 42)"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", color: "#3A6B9B", marginBottom: 2 }}>
                      Report ID: #CTY-9876
                    </div>
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.82rem", color: "#1C0A00", lineHeight: 1.3 }}>
                      Parks &amp; Rec · Broken Swing
                    </div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "#5C4A32", opacity: 0.55, marginTop: 2 }}>
                      Reported 3 days ago
                    </div>
                  </div>
                </div>

                {/* Status chip */}
                <div className="mt-3 flex items-center gap-2">
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.57rem", color: "#5C4A32", opacity: 0.6 }}>Status:</span>
                  <span className="px-2 py-0.5 border"
                    style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.06em",
                      borderColor: "#B8872A", background: "#FBF6EB", color: "#B8872A", borderRadius: "1px" }}>
                    Open · Awaiting Repair
                  </span>
                </div>

                {/* Similarity bar */}
                <div className="mt-3">
                  <div className="flex justify-between mb-1">
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", color: "#5C4A32", opacity: 0.5 }}>AI similarity match</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", color: "#B8872A", fontWeight: 700 }}>87%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full" style={{ background: "#EDE5D4" }}>
                    <div className="h-full rounded-full" style={{ width: "87%", background: "linear-gradient(to right, #C4622D, #B8872A)" }}/>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="p-4 space-y-2.5">
                <button onClick={() => handleDuplicateChoice("combine")}
                  className="w-full py-3 px-4 border text-left flex items-center gap-3 transition-all"
                  style={{
                    borderColor: duplicateChoice === "combine" ? "#1C0A00" : "#C8B89A",
                    background: duplicateChoice === "combine" ? "#1C0A00" : "#FAF7F2",
                    color: duplicateChoice === "combine" ? "#F5F0E8" : "#1C0A00",
                    borderRadius: "1px",
                    transform: duplicateChoice === "combine" ? "translateY(-1px)" : "none",
                    boxShadow: duplicateChoice === "combine" ? "0 3px 10px rgba(28,10,0,0.15)" : "none",
                    transition: "all 0.15s ease",
                  }}>
                  <div className="w-5 h-5 border-2 flex items-center justify-center flex-shrink-0"
                    style={{ borderColor: duplicateChoice === "combine" ? "#F5F0E8" : "#C8B89A", borderRadius: "50%" }}>
                    {duplicateChoice === "combine" && <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#F5F0E8" }}/>}
                  </div>
                  <div className="flex-1">
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.82rem" }}>
                      Combine and Upvote Existing Report
                    </div>
                    <div style={{ fontFamily: "var(--font-body)", fontSize: "0.7rem", opacity: 0.65, marginTop: 1 }}>
                      Merge with #CTY-9876 · Increases civic impact score
                    </div>
                  </div>
                </button>

                <button onClick={() => handleDuplicateChoice("separate")}
                  className="w-full py-3 px-4 border text-left flex items-center gap-3 transition-all"
                  style={{
                    borderColor: duplicateChoice === "separate" ? "#1C0A00" : "#C8B89A",
                    background: duplicateChoice === "separate" ? "#F5F0E8" : "#FAF7F2",
                    color: "#1C0A00",
                    borderRadius: "1px",
                    transition: "all 0.15s ease",
                  }}>
                  <div className="w-5 h-5 border-2 flex items-center justify-center flex-shrink-0"
                    style={{ borderColor: duplicateChoice === "separate" ? "#1C0A00" : "#C8B89A", borderRadius: "50%" }}>
                    {duplicateChoice === "separate" && <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#1C0A00" }}/>}
                  </div>
                  <div className="flex-1">
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.82rem" }}>
                      Keep Separate and Submit New
                    </div>
                    <div style={{ fontFamily: "var(--font-body)", fontSize: "0.7rem", opacity: 0.65, marginTop: 1 }}>
                      Creates a new independent record on-chain
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* On-chain note */}
            <div className="flex items-start gap-3 p-4 border"
              style={{ background: "#F0E8D8", borderColor: "#C8B89A", borderRadius: "2px" }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0 mt-0.5">
                <circle cx="7" cy="7" r="5.5" stroke="#5C4A32" strokeWidth="1" opacity="0.5"/>
                <path d="M7 6 L7 10" stroke="#5C4A32" strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>
                <circle cx="7" cy="4.5" r="0.75" fill="#5C4A32" opacity="0.7"/>
              </svg>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.74rem", color: "#5C4A32", opacity: 0.75, lineHeight: 1.55 }}>
                Combining reports increases the civic impact score and escalation priority of the existing record.
              </p>
            </div>
          </div>
        </div>

        {/* ── Bottom actions ── */}
        <div className="flex items-center justify-between pt-7 mt-6 border-t" style={{ borderColor: "#C8B89A" }}>
          <button onClick={onBack}
            className="flex items-center gap-2 px-5 py-3 border hover:bg-[#EDE5D4] transition-colors"
            style={{ borderColor: "#C8B89A", color: "#5C4A32", borderRadius: "1px",
              fontFamily: "var(--font-mono)", fontSize: "0.62rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M8 2 L4 6 L8 10" stroke="#5C4A32" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </button>
          <div className="flex items-center gap-3">
            {!canContinue && !submitErr && (
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.57rem", color: "#5C4A32", opacity: 0.45 }}>
                {!summary.trim() ? "Add an issue summary" : "Capture verification photo"}
              </span>
            )}
            {submitErr && (
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.57rem", color: "#9B3A3A" }}>
                {submitErr}
              </span>
            )}
            <button onClick={canContinue && !submitting ? handleSubmit : undefined}
              className="flex items-center gap-2 px-6 py-3"
              style={{
                background: canContinue ? "#1C0A00" : "#C8B89A",
                color: canContinue ? "#F5F0E8" : "#FAF7F2",
                borderRadius: "1px", cursor: canContinue && !submitting ? "pointer" : "default",
                fontFamily: "var(--font-mono)", fontSize: "0.62rem", letterSpacing: "0.12em", textTransform: "uppercase",
                opacity: canContinue ? 1 : 0.5, transition: "all 0.2s ease",
              }}>
              {submitting ? "Saving…" : "Review & Submit"}
              {!submitting && (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M4 2 L8 6 L4 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Toast — Verify Duplicate and Combine ── */}
      {toastVisible && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-5 py-4 border shadow-lg"
          style={{
            background: "#1C0A00", borderColor: "#3D1F00", borderRadius: "2px",
            minWidth: 340, animation: "count-up 0.25s ease-out",
          }}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#4A7C5F" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 7 L5.5 9.5 L11 4" stroke="#F5F0E8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="flex-1">
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.88rem", color: "#F5F0E8" }}>
              {duplicateChoice === "combine" ? "Verify Duplicate and Combine" : "New Report Record Created"}
            </div>
            <div style={{ fontFamily: "var(--font-body)", fontSize: "0.74rem", color: "#F5F0E8", opacity: 0.65, marginTop: 2 }}>
              {duplicateChoice === "combine" ? "Next Step: Review & Send" : "Next Step: Add details and submit"}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-1.5 hover:opacity-70 transition-opacity">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 3 L7 2 M7 12 L7 11 M3 7 L2 7 M12 7 L11 7" stroke="#F5F0E8" strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
                <circle cx="7" cy="7" r="3" stroke="#F5F0E8" strokeWidth="1" opacity="0.5"/>
              </svg>
            </button>
            <button className="p-1.5 hover:opacity-70 transition-opacity">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 10 L5 7 L2 4 M6 10 L9 7 L6 4" stroke="#F5F0E8" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
              </svg>
            </button>
            <button onClick={() => setToastVisible(false)} className="p-1.5 hover:opacity-70 transition-opacity">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 3 L11 11 M11 3 L3 11" stroke="#F5F0E8" strokeWidth="1.2" strokeLinecap="round" opacity="0.6"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PAGE 08 — Complaint Submitted ───────────────────────────────────────────
function ComplaintSubmittedPage({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const [copied, setCopied] = useState(false);
  const [scoreCount, setScoreCount] = useState(0);
  const civic = useCivic();
  const result = civic.lastResult;
  const COMPLAINT_ID = result?.trackingCode || "";

  // Animate civic impact score on mount
  useEffect(() => {
    let v = 0;
    const iv = setInterval(() => {
      v += 2;
      setScoreCount(Math.min(v, 87));
      if (v >= 87) clearInterval(iv);
    }, 18);
    return () => clearInterval(iv);
  }, []);

  function handleCopy() {
    navigator.clipboard?.writeText(COMPLAINT_ID).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Unreachable in the normal flow (the details page only advances on a
  // successful save) — but a missing/failed result must show an error panel,
  // never a demo ID.
  if (!result || !result.ok || !COMPLAINT_ID) {
    return (
      <div style={{ background: "#F5F0E8", minHeight: "100vh", fontFamily: "var(--font-body)" }}>
        <div className="max-w-3xl mx-auto px-6 py-14">
          <div className="border text-center px-8 py-14" style={{ background: "#FAF7F2", borderColor: "#C8B89A", borderRadius: "2px" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#9B3A3A", marginBottom: 10 }}>
              Report Not Saved
            </div>
            <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)", color: "#1C0A00", lineHeight: 1.15, marginBottom: 14 }}>
              Your report did not reach the server.
            </h1>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.9rem", color: "#5C4A32", opacity: 0.75, maxWidth: 440, margin: "0 auto", lineHeight: 1.7, marginBottom: 26 }}>
              {result?.error || "Nothing was saved. Go back, check your connection, and submit again — your details are kept."}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => onNavigate("report-details")} className="px-6 py-3" style={{ background: "#1C0A00", color: "#F5F0E8", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.62rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                Try Again
              </button>
              <button onClick={() => onNavigate("dashboard")} className="px-6 py-3 border" style={{ borderColor: "#C8B89A", color: "#5C4A32", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.62rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Full 6-step lifecycle
  const lifecycle = [
    { label: "Reported",       active: true,  current: true  },
    { label: "Assessed",       active: false, current: false },
    { label: "Assigned",       active: false, current: false },
    { label: "In Progress",    active: false, current: false },
    { label: "Proof Submitted",active: false, current: false },
    { label: "Resolved",       active: false, current: false },
  ];

  // Verification checklist
  const checks = [
    "Evidence captured",
    "Location recorded",
    "Timestamp recorded",
    "Digital evidence fingerprint generated",
  ];

  // Summary rows — correct complaint data per brief
  const now = new Date();
  const summaryRows: { label: string; value: string; valueStyle: React.CSSProperties }[] = [
    { label: "Issue",     value: civic.draft.summary || "Major Pothole",              valueStyle: {} },
    { label: "Category",  value: civic.draft.categoryLabel || "Roads & Infrastructure",     valueStyle: {} },
    { label: "Priority",  value: civic.draft.priorityLabel?.toUpperCase() || "URGENT",                     valueStyle: { color: "#C4622D", fontFamily: "var(--font-mono)", fontSize: "0.7rem", letterSpacing: "0.08em" } },
    { label: "Location",  value: "Sector X, New Delhi",        valueStyle: {} },
    { label: "Submitted", value: now.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" }).replace(",", " ·") + " IST",   valueStyle: { fontFamily: "var(--font-mono)", fontSize: "0.74rem" } },
  ];

  return (
    <div style={{ background: "#F5F0E8", minHeight: "100vh", fontFamily: "var(--font-body)" }}>

      {/* ── Top bar ── */}
      <div className="sticky top-0 z-40 border-b" style={{ background: "rgba(245,240,232,0.97)", borderColor: "#C8B89A", backdropFilter: "blur(8px)" }}>
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <button onClick={() => onNavigate("dashboard")} className="flex items-center gap-2 hover:opacity-60 transition-opacity"
            style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#5C4A32" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 2 L4 7 L9 12" stroke="#5C4A32" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to Dashboard
          </button>
          <div className="flex items-center gap-2">
            <CivicTraceLogo size={22}/>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.9rem", color: "#1C0A00" }}>CivicTrace</span>
          </div>
          {/* All 4 steps complete */}
          <div className="hidden md:block">
            <ReportProgress step={5}/>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-3xl mx-auto px-6 py-14">

        {/* ── 1. SUCCESS HEADER ── */}
        <div className="text-center mb-12">

          {/* Archival seal illustration */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              {/* Outer ring */}
              <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                {/* Outer decorative ring */}
                <circle cx="60" cy="60" r="56" stroke="#C8B89A" strokeWidth="1" strokeDasharray="4 3"/>
                {/* Middle ring */}
                <circle cx="60" cy="60" r="48" stroke="#C8B89A" strokeWidth="0.75"/>
                {/* Inner filled disc */}
                <circle cx="60" cy="60" r="40" fill="#EDE5D4" stroke="#C8B89A" strokeWidth="1"/>
                {/* Radial ticks */}
                {Array.from({ length: 24 }).map((_, i) => {
                  const a = (i * 15 * Math.PI) / 180;
                  const r1 = 42, r2 = 47;
                  return (
                    <line key={i}
                      x1={60 + r1 * Math.cos(a)} y1={60 + r1 * Math.sin(a)}
                      x2={60 + r2 * Math.cos(a)} y2={60 + r2 * Math.sin(a)}
                      stroke="#C8B89A" strokeWidth="0.75"/>
                  );
                })}
                {/* Checkmark */}
                <path d="M40 62 L53 75 L80 46" stroke="#4A7C5F" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
                {/* Corner ornament lines */}
                <path d="M60 16 L60 20 M60 100 L60 104 M16 60 L20 60 M100 60 L104 60" stroke="#C8B89A" strokeWidth="1" strokeLinecap="round"/>
              </svg>
            </div>
          </div>

          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.5, marginBottom: 10 }}>
            Civic Record · 13 Sep 2026
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "clamp(1.8rem, 4vw, 2.8rem)", color: "#1C0A00", lineHeight: 1.15, marginBottom: 14 }}>
            Your Complaint Has Been Recorded.
          </h1>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.95rem", color: "#5C4A32", opacity: 0.75, maxWidth: 480, margin: "0 auto", lineHeight: 1.7 }}>
            Your civic issue has been successfully submitted and added to a verifiable public record. Authorities have been notified and a response window has been assigned.
          </p>
        </div>

        {/* ── Decorative rule ── */}
        <div className="flex items-center gap-4 mb-10">
          <div className="flex-1 h-px" style={{ background: "#C8B89A" }}/>
          <div className="w-1.5 h-1.5 rotate-45" style={{ background: "#C8B89A" }}/>
          <div className="flex-1 h-px" style={{ background: "#C8B89A" }}/>
        </div>

        {/* ── 2. COMPLAINT ID — focal element ── */}
        {result?.merged && (
          <div className="border mb-5 px-5 py-3" style={{ background: "#FBF6EB", borderColor: "#B8872A", borderRadius: "2px" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#B8872A" }}>
              Duplicate merged — support count increased
            </div>
          </div>
        )}
        <div className="border mb-8" style={{ background: "#FAF7F2", borderColor: "#C8B89A", borderRadius: "2px" }}>
          {/* Top accent line */}
          <div className="h-0.5" style={{ background: "#4A7C5F" }}/>
          <div className="relative p-8 text-center">
            {/* Corner notch */}
            <div className="absolute top-0 right-0 w-8 h-8 border-l border-b" style={{ borderColor: "#C8B89A" }}/>
            <div className="absolute top-0 left-0 w-8 h-8 border-r border-b" style={{ borderColor: "#C8B89A" }}/>

            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.5, marginBottom: 14 }}>
              Complaint ID
            </div>

            {/* The ID itself */}
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(2rem, 5vw, 3.2rem)", color: "#1C0A00", letterSpacing: "0.04em", lineHeight: 1 }}>
              {COMPLAINT_ID}
            </div>

            {/* Copy button */}
            <div className="flex items-center justify-center gap-3 mt-5">
              <button onClick={handleCopy}
                className="flex items-center gap-2 px-4 py-2 border transition-all"
                style={{
                  borderColor: copied ? "#4A7C5F" : "#C8B89A",
                  background: copied ? "#EEF4F0" : "#F5F0E8",
                  color: copied ? "#4A7C5F" : "#5C4A32",
                  borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.6rem",
                  letterSpacing: "0.1em", textTransform: "uppercase",
                }}>
                {copied ? (
                  <>
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                      <path d="M2 5.5 L4.5 8 L9 3" stroke="#4A7C5F" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Copied
                  </>
                ) : (
                  <>
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                      <rect x="3.5" y="1" width="6.5" height="7.5" rx="1" stroke="currentColor" strokeWidth="1"/>
                      <rect x="1" y="3.5" width="6.5" height="7.5" rx="1" stroke="currentColor" strokeWidth="1" fill="#F5F0E8"/>
                    </svg>
                    Copy ID
                  </>
                )}
              </button>
            </div>

            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "#5C4A32", opacity: 0.55, marginTop: 10 }}>
              Use this ID to track your complaint at any time.
            </p>
          </div>
        </div>

        {/* ── 3 & 4. Two-column: Summary + Verification ── */}
        <div className="grid md:grid-cols-2 gap-5 mb-8">

          {/* ── 3. COMPLAINT SUMMARY ── */}
          <div className="border" style={{ background: "#FAF7F2", borderColor: "#C8B89A", borderRadius: "2px" }}>
            <div className="px-5 pt-5 pb-3 border-b" style={{ borderColor: "#C8B89A" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.5, marginBottom: 2 }}>
                Complaint Summary
              </div>
            </div>
            <div className="p-5 space-y-0">
              {summaryRows.map(({ label, value, valueStyle }, i) => (
                <div key={label}
                  className="flex items-start justify-between gap-4 py-3"
                  style={{ borderBottom: i < summaryRows.length - 1 ? "1px solid #EDE5D4" : "none" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.5, flexShrink: 0 }}>
                    {label}
                  </span>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", color: "#1C0A00", textAlign: "right", lineHeight: 1.4, ...valueStyle }}>
                    {value}
                  </span>
                </div>
              ))}
              {/* Identity protection note */}
              <div className="pt-3 flex items-center gap-2">
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <path d="M5.5 1 L9.5 2.8 L9.5 5.5 C9.5 8 5.5 10 5.5 10 C5.5 10 1.5 8 1.5 5.5 L1.5 2.8 Z" stroke="#5C4A32" strokeWidth="0.9" fill="none" opacity="0.4"/>
                  <path d="M3.5 5.5 L5 7 L7.5 4" stroke="#4A7C5F" strokeWidth="1" strokeLinecap="round" opacity="0.8"/>
                </svg>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.54rem", color: "#5C4A32", opacity: 0.45, letterSpacing: "0.06em" }}>
                  Your identity is not disclosed to departments.
                </span>
              </div>
            </div>
          </div>

          {/* ── 4. VERIFICATION RECORD ── */}
          <div className="border" style={{ background: "#FAF7F2", borderColor: "#C8B89A", borderRadius: "2px" }}>
            <div className="px-5 pt-5 pb-3 border-b" style={{ borderColor: "#C8B89A" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.5, marginBottom: 2 }}>
                Verification Record
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.92rem", color: "#1C0A00" }}>
                Record Created
              </div>
            </div>
            <div className="p-5">
              <div className="space-y-3 mb-5">
                {checks.map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0"
                      style={{ borderColor: "#4A7C5F", background: "#EEF4F0" }}>
                      <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                        <path d="M2 4.5 L3.8 6.3 L7 3" stroke="#4A7C5F" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", color: "#1C0A00" }}>{item}</span>
                  </div>
                ))}
              </div>

              {/* Prototype hash — clearly labelled */}
              <div className="py-3 px-4 border mb-4" style={{ background: "#EDE5D4", borderColor: "#C8B89A", borderRadius: "1px" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.5, marginBottom: 4 }}>
                  Demo — Evidence Fingerprint
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "#3A6B9B", wordBreak: "break-all" }}>
                  0x4f91…a3c7
                </div>
              </div>

              {/* Web3 note */}
              <div className="flex items-start gap-2.5">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="flex-shrink-0 mt-0.5">
                  <rect x="2" y="5" width="5" height="2.5" rx="1.25" stroke="#5C4A32" strokeWidth="0.9" fill="none" opacity="0.5"/>
                  <rect x="6" y="5" width="5" height="2.5" rx="1.25" stroke="#3A6B9B" strokeWidth="0.9" fill="none" opacity="0.7"/>
                  <line x1="7" y1="6.25" x2="6" y2="6.25" stroke="#C8B89A" strokeWidth="0.9"/>
                  <line x1="5" y1="4" x2="5" y2="2.5" stroke="#C8B89A" strokeWidth="0.8"/>
                  <line x1="8" y1="4" x2="8" y2="2.5" stroke="#C8B89A" strokeWidth="0.8"/>
                  <circle cx="5" cy="2" r="1" fill="#4A7C5F" opacity="0.7"/>
                  <circle cx="8" cy="2" r="1" fill="#4A7C5F" opacity="0.7"/>
                </svg>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.73rem", color: "#5C4A32", opacity: 0.7, lineHeight: 1.55 }}>
                  Lifecycle events will be recorded as verifiable blockchain-backed records.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── 5. CURRENT STATUS ── */}
        <div className="border mb-8" style={{ background: "#FAF7F2", borderColor: "#C8B89A", borderRadius: "2px" }}>
          <div className="px-6 pt-5 pb-4 border-b flex items-center justify-between" style={{ borderColor: "#C8B89A" }}>
            <div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.57rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.5, marginBottom: 3 }}>
                Complaint Lifecycle
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.95rem", color: "#1C0A00" }}>
                Current Status
              </div>
            </div>
            {/* Live status chip */}
            <div className="flex items-center gap-2 px-3 py-1.5 border"
              style={{ borderColor: "#C4622D", background: "#FBF0EA", borderRadius: "1px" }}>
              <span className="w-2 h-2 rounded-full" style={{ background: "#C4622D" }}/>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.56rem", letterSpacing: "0.08em", color: "#C4622D" }}>
                REPORTED · Awaiting Assessment
              </span>
            </div>
          </div>

          <div className="px-6 pt-7 pb-6">
            {/* ── Six-step rail ── */}
            <div className="relative">
              {/* Connector track underneath nodes */}
              <div className="absolute" style={{
                top: 7, left: 7, right: 7, height: 1,
                background: "#C8B89A", opacity: 0.4,
              }}/>

              {/* Nodes row */}
              <div className="relative flex justify-between mb-3">
                {lifecycle.map(({ label, active, current }, i) => (
                  <div key={label} className="flex flex-col items-center" style={{ flex: 1, minWidth: 0 }}>
                    {/* Node */}
                    <div className="relative flex items-center justify-center"
                      style={{ width: 16, height: 16, zIndex: 1 }}>
                      <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center"
                        style={{
                          borderColor: current ? "#1C0A00" : "#C8B89A",
                          background: current ? "#1C0A00" : "#FAF7F2",
                          boxShadow: current ? "0 0 0 3px #F5F0E8" : "none",
                        }}>
                        {current && (
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#F5F0E8" }}/>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Labels row */}
              <div className="flex justify-between">
                {lifecycle.map(({ label, active, current }) => (
                  <div key={label} style={{ flex: 1, minWidth: 0, textAlign: "center", padding: "0 2px" }}>
                    <div style={{
                      fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.06em",
                      textTransform: "uppercase", lineHeight: 1.4,
                      color: current ? "#1C0A00" : "#C8B89A",
                      fontWeight: current ? 700 : 400,
                    }}>
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Estimated timeline note */}
            <div className="mt-6 flex items-center gap-2.5 px-4 py-3 border"
              style={{ background: "#F0E8D8", borderColor: "#C8B89A", borderRadius: "1px" }}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="flex-shrink-0">
                <circle cx="6.5" cy="6.5" r="5" stroke="#5C4A32" strokeWidth="1" opacity="0.5"/>
                <path d="M6.5 4 L6.5 6.5 L8 7.8" stroke="#5C4A32" strokeWidth="1.1" strokeLinecap="round" opacity="0.7"/>
              </svg>
              <span style={{ fontFamily: "var(--font-body)", fontSize: "0.76rem", color: "#5C4A32", opacity: 0.75 }}>
                Expected assessment within <strong style={{ color: "#1C0A00" }}>24–72 hours.</strong> You will be notified at each stage.
              </span>
            </div>

            {/* Later states footnote */}
            <div className="mt-4 flex items-center gap-2">
              <div className="flex-1 h-px" style={{ background: "#EDE5D4" }}/>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", color: "#5C4A32", opacity: 0.38, letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
                Possible later states: Disputed · Escalated · Unresolved
              </span>
              <div className="flex-1 h-px" style={{ background: "#EDE5D4" }}/>
            </div>
          </div>
        </div>

        {/* ── 6. CIVIC IMPACT PREVIEW ── */}
        <div className="border mb-10 flex items-center justify-between px-6 py-5"
          style={{ background: "#FAF7F2", borderColor: "#C8B89A", borderRadius: "2px" }}>
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.56rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.5, marginBottom: 4 }}>
              Civic Impact Score
            </div>
            <div className="flex items-baseline gap-1.5">
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "2.4rem", color: "#1C0A00", lineHeight: 1 }}>
                {scoreCount}
              </span>
              <span style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", color: "#5C4A32", opacity: 0.45 }}> / 100</span>
            </div>
            <div style={{ fontFamily: "var(--font-body)", fontSize: "0.74rem", color: "#5C4A32", opacity: 0.6, marginTop: 4 }}>
              Score increases as more citizens support your report.
            </div>
          </div>
          <div className="text-right border-l pl-6" style={{ borderColor: "#EDE5D4" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.56rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.5, marginBottom: 4 }}>
              Supporting Reports
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "2rem", color: "#3A6B9B", lineHeight: 1 }}>
              1
            </div>
            <div style={{ fontFamily: "var(--font-body)", fontSize: "0.7rem", color: "#5C4A32", opacity: 0.5, marginTop: 4 }}>
              Your report
            </div>
          </div>
        </div>

        {/* ── Thin rule ── */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 h-px" style={{ background: "#C8B89A" }}/>
          <div className="w-1.5 h-1.5 rotate-45" style={{ background: "#C8B89A" }}/>
          <div className="flex-1 h-px" style={{ background: "#C8B89A" }}/>
        </div>

        {/* ── 7. NEXT ACTIONS ── */}
        <div className="space-y-3 mb-10">

          {/* Primary CTA */}
          <button onClick={() => onNavigate("my-complaints")}
            className="w-full flex items-center justify-between px-6 py-4 group transition-opacity hover:opacity-90"
            style={{ background: "#1C0A00", color: "#F5F0E8", borderRadius: "1px" }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 border flex items-center justify-center"
                style={{ borderColor: "rgba(245,240,232,0.2)", borderRadius: "1px" }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="5.5" stroke="#F5F0E8" strokeWidth="1.2"/>
                  <path d="M8 5 L8 8 L10 9.5" stroke="#F5F0E8" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="text-left">
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.95rem" }}>
                  Track My Complaint
                </div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", opacity: 0.6, marginTop: 1 }}>
                  Follow the lifecycle from assessment to resolution
                </div>
              </div>
            </div>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M4 2 L9 7 L4 12" stroke="#F5F0E8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Secondary — Verification */}
          <button onClick={() => onNavigate("dashboard")}
            className="w-full flex items-center justify-between px-6 py-4 border transition-colors hover:bg-[#EDE5D4]"
            style={{ borderColor: "#C8B89A", color: "#1C0A00", borderRadius: "1px", background: "#FAF7F2" }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 border flex items-center justify-center"
                style={{ borderColor: "#C8B89A", borderRadius: "1px" }}>
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <rect x="2" y="2" width="11" height="13" rx="1" stroke="#1C0A00" strokeWidth="1.1"/>
                  <path d="M5 6 L10 6 M5 8.5 L10 8.5 M5 11 L8 11" stroke="#C8B89A" strokeWidth="1"/>
                  <circle cx="11" cy="12" r="3" fill="#EEF4F0" stroke="#4A7C5F" strokeWidth="1"/>
                  <path d="M9.8 12 L10.8 13 L12.5 11" stroke="#4A7C5F" strokeWidth="0.9" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="text-left">
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.92rem" }}>
                  View Verification Record
                </div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", color: "#5C4A32", opacity: 0.6, marginTop: 1 }}>
                  Inspect the blockchain-backed evidence record
                </div>
              </div>
            </div>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M4 2 L9 7 L4 12" stroke="#5C4A32" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
            </svg>
          </button>

          {/* Tertiary row */}
          <div className="flex gap-3">
            <button onClick={() => onNavigate("dashboard")}
              className="flex-1 py-3 border transition-colors hover:bg-[#EDE5D4]"
              style={{ borderColor: "#C8B89A", color: "#5C4A32", borderRadius: "1px",
                fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Back to Dashboard
            </button>
            <button onClick={() => onNavigate("report-category")}
              className="flex-1 py-3 border transition-colors hover:bg-[#EDE5D4] flex items-center justify-center gap-1.5"
              style={{ borderColor: "#C8B89A", color: "#5C4A32", borderRadius: "1px",
                fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              <span style={{ fontSize: "0.9rem", lineHeight: 1 }}>+</span>
              Report Another Issue
            </button>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="pt-6 border-t flex items-center justify-between flex-wrap gap-3" style={{ borderColor: "#C8B89A" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.06em", color: "#5C4A32", opacity: 0.4 }}>
            © 2026 CivicTrace · Civic records preserved.
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#4A7C5F" }}/>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.06em", color: "#5C4A32", opacity: 0.4 }}>
              On-chain · Verified · Open
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Status config ───────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; dot: string }> = {
  "REPORTED":        { color: "#9B3A3A", bg: "#F8EEEE", border: "#9B3A3A", dot: "#9B3A3A" },
  "ASSESSED":        { color: "#C4622D", bg: "#FBF0EA", border: "#C4622D", dot: "#C4622D" },
  "ASSIGNED":        { color: "#5C4A32", bg: "#F0EAE0", border: "#C8B89A", dot: "#5C4A32" },
  "IN PROGRESS":     { color: "#3A6B9B", bg: "#EEF3F8", border: "#3A6B9B", dot: "#3A6B9B" },
  "PROOF SUBMITTED": { color: "#6A5C8A", bg: "#F2EFF8", border: "#6A5C8A", dot: "#6A5C8A" },
  "RESOLVED":        { color: "#4A7C5F", bg: "#EEF4F0", border: "#4A7C5F", dot: "#4A7C5F" },
  "DISPUTED":        { color: "#B8872A", bg: "#FBF6EB", border: "#B8872A", dot: "#B8872A" },
  "ESCALATED":       { color: "#9B3A3A", bg: "#F8EEEE", border: "#9B3A3A", dot: "#9B3A3A" },
  "UNRESOLVED":      { color: "#9B3A3A", bg: "#F8EEEE", border: "#9B3A3A", dot: "#9B3A3A" },
};

// ─── Shared status badge ──────────────────────────────────────────────────────
function StatusBadge2({ status, size = "md" }: { status: string; size?: "sm" | "md" }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG["REPORTED"];
  return (
    <span className="inline-flex items-center gap-1.5"
      style={{
        padding: size === "sm" ? "2px 7px" : "3px 9px",
        border: `1px solid ${cfg.border}`,
        background: cfg.bg, borderRadius: "1px",
        fontFamily: "var(--font-mono)",
        fontSize: size === "sm" ? "0.52rem" : "0.57rem",
        letterSpacing: "0.08em", color: cfg.color,
      }}>
      <span className="rounded-full flex-shrink-0" style={{ width: 6, height: 6, background: cfg.dot }}/>
      {status}
    </span>
  );
}

// ─── Priority badge ───────────────────────────────────────────────────────────
function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, { color: string; bg: string }> = {
    "NORMAL":      { color: "#5C4A32", bg: "#F0EAE0" },
    "URGENT":      { color: "#C4622D", bg: "#FBF0EA" },
    "VERY URGENT": { color: "#9B3A3A", bg: "#F8EEEE" },
  };
  const s = map[priority] || map["NORMAL"];
  return (
    <span style={{
      fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.08em",
      padding: "2px 7px", border: `1px solid ${s.color}40`,
      background: s.bg, color: s.color, borderRadius: "1px",
    }}>
      {priority}
    </span>
  );
}

// ─── Compact lifecycle mini-rail ──────────────────────────────────────────────
const LIFECYCLE_STEPS = ["Reported", "Assessed", "Assigned", "In Progress", "Proof Submitted", "Resolved"];

function MiniLifecyleRail({ currentStatus }: { currentStatus: string }) {
  const normalised = currentStatus.replace(/_/g, " ");
  // Map status to step index
  const stepMap: Record<string, number> = {
    "REPORTED": 0, "ASSESSED": 1, "ASSIGNED": 2,
    "IN PROGRESS": 3, "PROOF SUBMITTED": 4, "RESOLVED": 5,
    "DISPUTED": 3, "ESCALATED": 1, "UNRESOLVED": 2,
  };
  const activeIdx = stepMap[normalised] ?? stepMap[currentStatus] ?? 0;
  const isSpecial = ["DISPUTED", "ESCALATED", "UNRESOLVED"].includes(currentStatus);

  return (
    <div className="relative">
      {/* Track */}
      <div className="absolute" style={{ top: 5, left: 4, right: 4, height: 1, background: "#C8B89A", opacity: 0.35 }}/>
      <div className="flex justify-between relative">
        {LIFECYCLE_STEPS.map((step, i) => {
          const done = i < activeIdx;
          const cur  = i === activeIdx && !isSpecial;
          return (
            <div key={step} className="flex flex-col items-center" style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                width: 10, height: 10, borderRadius: "50%", border: `1.5px solid`,
                borderColor: cur ? "#1C0A00" : done ? "#4A7C5F" : "#C8B89A",
                background: cur ? "#1C0A00" : done ? "#4A7C5F" : "#FAF7F2",
                zIndex: 1, position: "relative",
              }}/>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Complaint shape (fed from the logged-in citizen's records) ───────────────
interface Complaint {
  id: string; issue: string; category: string; categoryShort: string;
  location: string; priority: "NORMAL" | "URGENT" | "VERY URGENT";
  status: string; submitted: string; daysOpen: number;
  score: number; supporters: number; resolved?: boolean;
}

// ─── PAGE 09 — My Complaints ──────────────────────────────────────────────────
function MyComplaintsPage({ onNavigate, openDetail = false }: { onNavigate: (p: Page) => void; openDetail?: boolean }) {
  const [filter, setFilter] = useState<string>("ALL");
  const [sort, setSort] = useState<"recent" | "score" | "priority">("recent");
  const [search, setSearch] = useState("");
  const civic = useCivic();
  const liveMine = useLiveMyComplaints();
  const filed = liveMine.data?.filed ?? [];
  const list: Complaint[] = filed.map(toCardComplaint).map(c => ({ id: c.id, issue: c.issue, category: c.issue, categoryShort: c.issue, location: c.location, priority: c.priority, status: c.status, submitted: c.submitted, daysOpen: c.days, score: c.score, supporters: c.supporters, resolved: c.resolved }));
  const [detailId, setDetailId] = useState<string | null>(openDetail ? list[0]?.id ?? null : null);
  const [showEmpty] = useState(false);
  useEffect(() => { if (detailId) civic.select(null, detailId); }, [detailId]);

  const filters = ["ALL", "ACTIVE", "IN PROGRESS", "RESOLVED", "DISPUTED", "ESCALATED"];

  // Filter logic
  const filtered = list.filter(c => {
    const matchSearch = !search || [c.id, c.issue, c.location].some(v =>
      v.toLowerCase().includes(search.toLowerCase()));
    const matchFilter = filter === "ALL"
      ? true
      : filter === "ACTIVE"
        ? !["RESOLVED"].includes(c.status)
        : c.status === filter;
    return matchSearch && matchFilter;
  }).sort((a, b) => {
    if (sort === "score") return b.score - a.score;
    if (sort === "priority") {
      const p = { "VERY URGENT": 3, "URGENT": 2, "NORMAL": 1 };
      return (p[b.priority] || 0) - (p[a.priority] || 0);
    }
    return 0; // recent — keep original order
  });

  const selectedComplaint = detailId ? list.find(c => c.id === detailId) ?? null : null;

  return (
    <div style={{ background: "#F5F0E8", minHeight: "100vh", fontFamily: "var(--font-body)" }}>

      {/* ── Top bar ── */}
      <div className="sticky top-0 z-40 border-b" style={{ background: "rgba(245,240,232,0.97)", borderColor: "#C8B89A", backdropFilter: "blur(8px)" }}>
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between gap-4">

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 min-w-0" style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.08em", color: "#5C4A32" }}>
            <button onClick={() => onNavigate("dashboard")} className="hover:opacity-80 transition-opacity opacity-50">Dashboard</button>
            <span className="opacity-40">›</span>
            <span style={{ color: "#1C0A00", opacity: 1 }}>My Complaints</span>
          </div>

          <div className="flex items-center gap-2">
            <CivicTraceLogo size={22}/>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.9rem", color: "#1C0A00" }}>CivicTrace</span>
          </div>

          <button onClick={() => onNavigate("report-category")}
            className="flex items-center gap-2 px-4 py-2 hover:opacity-90 transition-opacity"
            style={{ background: "#1C0A00", color: "#F5F0E8", borderRadius: "1px",
              fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            <span style={{ fontSize: "0.9rem" }}>+</span>
            Report an Issue
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* ── Page header ── */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.45, marginBottom: 6 }}>
              Citizen Archive · {list.length} Records
            </div>
            <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)", color: "#1C0A00", lineHeight: 1.1 }}>
              Your Civic Records
            </h1>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.88rem", color: "#5C4A32", opacity: 0.65, marginTop: 6 }}>
              Track every issue you've reported and see what happens next.
            </p>
          </div>

          {/* Summary stats */}
          <div className="flex items-center gap-0 border divide-x" style={{ borderColor: "#C8B89A", borderRadius: "2px", overflow: "hidden" }}>
            {[
              { n: list.filter(c => !["RESOLVED"].includes(c.status)).length, label: "Active",   color: "#9B3A3A" },
              { n: list.filter(c => c.status === "RESOLVED").length, label: "Resolved", color: "#4A7C5F" },
              { n: list.filter(c => c.status === "DISPUTED").length, label: "Disputed", color: "#B8872A" },
            ].map(({ n, label, color }) => (
              <div key={label} className="px-5 py-3 text-center" style={{ background: "#FAF7F2", borderColor: "#C8B89A" }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.4rem", color, lineHeight: 1 }}>{n}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.5, marginTop: 3 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Decorative rule ── */}
        <div className="flex items-center gap-4 mb-7">
          <div className="flex-1 h-px" style={{ background: "#C8B89A" }}/>
          <div className="w-1.5 h-1.5 rotate-45" style={{ background: "#C8B89A" }}/>
          <div className="flex-1 h-px" style={{ background: "#C8B89A" }}/>
        </div>

        {/* ── Search + filters ── */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ opacity: 0.35 }}>
              <circle cx="6" cy="6" r="4.5" stroke="#1C0A00" strokeWidth="1.2"/>
              <path d="M9.5 9.5 L12.5 12.5" stroke="#1C0A00" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by complaint ID, issue or location…"
              style={{
                width: "100%", padding: "9px 14px 9px 36px",
                border: "1px solid #C8B89A", borderRadius: "1px",
                background: "#FAF7F2", color: "#1C0A00",
                fontFamily: "var(--font-body)", fontSize: "0.84rem", outline: "none",
              }}/>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2 border px-3" style={{ borderColor: "#C8B89A", background: "#FAF7F2", borderRadius: "1px" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.56rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.5, whiteSpace: "nowrap" }}>
              Sort by:
            </span>
            <select value={sort} onChange={e => setSort(e.target.value as typeof sort)}
              style={{ border: "none", background: "transparent", fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "#1C0A00", outline: "none", cursor: "pointer", padding: "8px 0" }}>
              <option value="recent">Recent</option>
              <option value="score">Civic Impact</option>
              <option value="priority">Priority</option>
            </select>
          </div>
        </div>

        {/* ── Filter tabs ── */}
        <div className="flex items-center gap-2 mb-7 flex-wrap">
          {filters.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 border transition-all"
              style={{
                borderColor: filter === f ? "#1C0A00" : "#C8B89A",
                background: filter === f ? "#1C0A00" : "#FAF7F2",
                color: filter === f ? "#F5F0E8" : "#5C4A32",
                borderRadius: "1px",
                fontFamily: "var(--font-mono)", fontSize: "0.57rem", letterSpacing: "0.1em", textTransform: "uppercase",
              }}>
              {f}
            </button>
          ))}
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "#5C4A32", opacity: 0.4, marginLeft: "auto" }}>
            {filtered.length} of {list.length} records
          </span>
        </div>

        {/* ── Two-panel layout: cards + detail ── */}
        <div className={`grid gap-6 ${selectedComplaint ? "lg:grid-cols-[1fr_420px]" : "grid-cols-1"}`}>

          {/* LEFT — card list */}
          <div>
            {showEmpty || filtered.length === 0 ? (

              /* ── Empty state ── */
              <div className="border flex flex-col items-center justify-center text-center py-20 px-8"
                style={{ background: "#FAF7F2", borderColor: "#C8B89A", borderRadius: "2px" }}>
                <svg width="56" height="56" viewBox="0 0 56 56" fill="none" style={{ marginBottom: 16, opacity: 0.25 }}>
                  <rect x="8" y="6" width="40" height="44" rx="2" stroke="#1C0A00" strokeWidth="1.5"/>
                  <path d="M16 18 L40 18 M16 26 L40 26 M16 34 L30 34" stroke="#C8B89A" strokeWidth="1.5"/>
                  <circle cx="42" cy="42" r="10" fill="#EDE5D4" stroke="#C8B89A" strokeWidth="1"/>
                  <path d="M42 38 L42 42 L44 44" stroke="#C8B89A" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "1.3rem", color: "#1C0A00", marginBottom: 8 }}>
                  No civic records yet.
                </div>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.84rem", color: "#5C4A32", opacity: 0.65, maxWidth: 280, lineHeight: 1.6, marginBottom: 20 }}>
                  Your first report will appear here once you submit an issue.
                </p>
                <button onClick={() => onNavigate("report-category")}
                  className="flex items-center gap-2 px-5 py-3"
                  style={{ background: "#1C0A00", color: "#F5F0E8", borderRadius: "1px",
                    fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  <span>+</span> Report an Issue
                </button>
              </div>

            ) : (
              <div className="space-y-4">
                {filtered.map(c => {
                  const isSelected = selectedComplaint?.id === c.id;
                  const cfg = STATUS_CONFIG[c.status] || STATUS_CONFIG["REPORTED"];
                  return (
                    <div key={c.id}
                      className="border overflow-hidden transition-all"
                      style={{
                        background: "#FAF7F2",
                        borderColor: isSelected ? "#1C0A00" : "#C8B89A",
                        borderRadius: "2px",
                        borderWidth: isSelected ? "1.5px" : "1px",
                        boxShadow: isSelected ? "0 4px 20px rgba(28,10,0,0.08)" : "none",
                        transform: isSelected ? "translateY(-1px)" : "none",
                      }}>

                      {/* Status stripe */}
                      <div className="h-0.5" style={{ background: cfg.color }}/>

                      <div className="p-5">
                        <div className="flex items-start justify-between gap-4">

                          {/* Left content */}
                          <div className="flex-1 min-w-0">
                            {/* ID + date row */}
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <button onClick={() => setDetailId(c.id)}
                                className="hover:opacity-70 transition-opacity"
                                style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.08em", color: "#3A6B9B", textDecoration: "underline", textDecorationStyle: "dotted", textUnderlineOffset: "2px" }}>
                                {c.id}
                              </button>
                              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.54rem", color: "#5C4A32", opacity: 0.4 }}>
                                {c.submitted}
                              </span>
                              {c.daysOpen > 0 && (
                                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.54rem", color: c.daysOpen > 7 ? "#9B3A3A" : "#C4622D" }}>
                                  · {c.daysOpen}d unresolved
                                </span>
                              )}
                            </div>

                            {/* Issue title */}
                            <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.1rem", color: "#1C0A00", marginBottom: 4, lineHeight: 1.2 }}>
                              {c.issue}
                            </h3>

                            {/* Category + location */}
                            <div className="flex items-center gap-3 mb-3 flex-wrap">
                              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "#5C4A32", opacity: 0.55, letterSpacing: "0.06em" }}>
                                {c.category}
                              </span>
                              <span style={{ color: "#C8B89A" }}>·</span>
                              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "#5C4A32", opacity: 0.55 }}>
                                📍 {c.location}
                              </span>
                            </div>

                            {/* Badges */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <PriorityBadge priority={c.priority}/>
                              <StatusBadge2 status={c.status}/>
                              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", color: "#5C4A32", opacity: 0.45 }}>
                                {c.supporters} supporters
                              </span>
                            </div>

                            {/* Mini lifecycle rail */}
                            <div className="mt-4 pt-3 border-t" style={{ borderColor: "#EDE5D4", maxWidth: 380 }}>
                              <MiniLifecyleRail currentStatus={c.status}/>
                            </div>
                          </div>

                          {/* Right — score + action */}
                          <div className="flex flex-col items-end gap-3 flex-shrink-0">
                            {/* Score block */}
                            <div className="border px-4 py-3 text-center"
                              style={{ borderColor: "#C8B89A", background: "#F5F0E8", borderRadius: "1px", minWidth: 80 }}>
                              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.48rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.45, marginBottom: 4 }}>
                                Civic Impact
                              </div>
                              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.7rem", color: "#1C0A00", lineHeight: 1 }}>
                                {c.score}
                              </div>
                              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.48rem", color: "#5C4A32", opacity: 0.35, marginTop: 2 }}>
                                / 100
                              </div>
                            </div>

                            {/* View button */}
                            <button onClick={() => setDetailId(isSelected ? null : c.id)}
                              className="flex items-center gap-1.5 px-4 py-2 border transition-all hover:bg-[#1C0A00] hover:text-[#F5F0E8] hover:border-[#1C0A00]"
                              style={{
                                borderColor: isSelected ? "#1C0A00" : "#C8B89A",
                                background: isSelected ? "#1C0A00" : "transparent",
                                color: isSelected ? "#F5F0E8" : "#1C0A00",
                                borderRadius: "1px",
                                fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.08em", textTransform: "uppercase",
                              }}>
                              {isSelected ? "Close" : "View Complaint"}
                              {!isSelected && (
                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                  <path d="M3 2 L7 5 L3 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT — Detail panel (slides in when card selected) */}
          {selectedComplaint && (
            <div className="border sticky top-20" style={{ background: "#FAF7F2", borderColor: "#C8B89A", borderRadius: "2px", alignSelf: "start" }}>
              {/* Status accent top */}
              <div className="h-0.5" style={{ background: (STATUS_CONFIG[selectedComplaint.status] || STATUS_CONFIG["REPORTED"]).color }}/>

              {/* Panel header */}
              <div className="relative px-5 pt-5 pb-4 border-b" style={{ borderColor: "#C8B89A" }}>
                <div className="absolute top-0 right-0 w-7 h-7 border-l border-b" style={{ borderColor: "#C8B89A" }}/>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <button onClick={() => setDetailId(null)} className="flex items-center gap-1.5 mb-2 hover:opacity-60 transition-opacity"
                      style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.5 }}>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M7 2 L3 5 L7 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                      </svg>
                      Close
                    </button>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", color: "#3A6B9B", marginBottom: 3 }}>
                      {selectedComplaint.id}
                    </div>
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.05rem", color: "#1C0A00", lineHeight: 1.25 }}>
                      {selectedComplaint.issue}
                    </div>
                  </div>
                  <StatusBadge2 status={selectedComplaint.status} size="sm"/>
                </div>
              </div>

              {/* Detail rows */}
              <div className="px-5 py-4 space-y-0 border-b" style={{ borderColor: "#C8B89A" }}>
                {[
                  { label: "Category",  value: selectedComplaint.category },
                  { label: "Location",  value: selectedComplaint.location },
                  { label: "Priority",  value: selectedComplaint.priority },
                  { label: "Submitted", value: selectedComplaint.submitted },
                  { label: "Unresolved",value: selectedComplaint.daysOpen > 0 ? `${selectedComplaint.daysOpen} days` : "Resolved" },
                  { label: "Supporters",value: `${selectedComplaint.supporters} citizens` },
                ].map(({ label, value }, i, arr) => (
                  <div key={label} className="flex items-start justify-between gap-3 py-2.5"
                    style={{ borderBottom: i < arr.length - 1 ? "1px solid #EDE5D4" : "none" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.56rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.45, flexShrink: 0 }}>
                      {label}
                    </span>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", color: "#1C0A00", textAlign: "right", lineHeight: 1.35 }}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Civic impact */}
              <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "#C8B89A" }}>
                <div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.54rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.45, marginBottom: 4 }}>
                    Civic Impact Score
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "2.2rem", color: "#1C0A00", lineHeight: 1 }}>
                      {selectedComplaint.score}
                    </span>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "#5C4A32", opacity: 0.4 }}> / 100</span>
                  </div>
                </div>
                {/* Score ring */}
                <svg width="56" height="56" viewBox="0 0 56 56">
                  <circle cx="28" cy="28" r="22" fill="none" stroke="#EDE5D4" strokeWidth="4"/>
                  <circle cx="28" cy="28" r="22" fill="none"
                    stroke={(STATUS_CONFIG[selectedComplaint.status] || STATUS_CONFIG["REPORTED"]).color}
                    strokeWidth="4"
                    strokeDasharray={`${2 * Math.PI * 22 * selectedComplaint.score / 100} ${2 * Math.PI * 22}`}
                    strokeDashoffset={2 * Math.PI * 22 * 0.25}
                    strokeLinecap="round"
                    style={{ transform: "rotate(-90deg)", transformOrigin: "28px 28px" }}/>
                  <text x="28" y="32" textAnchor="middle" fontFamily="var(--font-display)" fontSize="11" fontWeight="700" fill="#1C0A00">
                    {selectedComplaint.score}
                  </text>
                </svg>
              </div>

              {/* Lifecycle in detail */}
              <div className="px-5 py-4 border-b" style={{ borderColor: "#C8B89A" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.54rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.45, marginBottom: 12 }}>
                  Lifecycle
                </div>
                <div className="space-y-3">
                  {LIFECYCLE_STEPS.map((step, i) => {
                    const stepMap: Record<string, number> = {
                      "REPORTED": 0, "ASSESSED": 1, "ASSIGNED": 2,
                      "IN PROGRESS": 3, "PROOF SUBMITTED": 4, "RESOLVED": 5,
                      "DISPUTED": 3, "ESCALATED": 1, "UNRESOLVED": 2,
                    };
                    const cur = stepMap[selectedComplaint.status] ?? 0;
                    const done = i < cur;
                    const active = i === cur;
                    return (
                      <div key={step} className="flex items-center gap-3">
                        <div style={{
                          width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                          background: done ? "#4A7C5F" : active ? "#1C0A00" : "#C8B89A",
                          border: active ? "2px solid #1C0A00" : "none",
                          boxShadow: active ? "0 0 0 2px #F5F0E8, 0 0 0 3px #1C0A00" : "none",
                        }}/>
                        <span style={{
                          fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.07em",
                          color: done ? "#4A7C5F" : active ? "#1C0A00" : "#C8B89A",
                          fontWeight: active ? 700 : 400,
                        }}>
                          {step}
                        </span>
                        {done && (
                          <svg width="9" height="9" viewBox="0 0 9 9" fill="none" style={{ marginLeft: "auto" }}>
                            <path d="M1.5 4.5 L3.5 6.5 L7.5 2.5" stroke="#4A7C5F" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Verification hash */}
              <div className="px-5 py-4 border-b" style={{ borderColor: "#C8B89A", background: "#EDE5D4" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.5, marginBottom: 4 }}>
                  Demo — Evidence Fingerprint
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "#3A6B9B" }}>
                  0x4f91…a3c7
                </div>
              </div>

              {/* Panel actions */}
              <div className="p-5 space-y-2.5">
                <button onClick={() => onNavigate("complaint-detail")} className="w-full py-2.5 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                  style={{ background: "#1C0A00", color: "#F5F0E8", borderRadius: "1px",
                    fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <circle cx="6" cy="6" r="4.5" stroke="#F5F0E8" strokeWidth="1"/>
                    <path d="M6 3.5 L6 6 L7.5 7" stroke="#F5F0E8" strokeWidth="1" strokeLinecap="round"/>
                  </svg>
                  Full Complaint Detail
                </button>
                {selectedComplaint.status === "RESOLVED" && (
                  <button onClick={() => onNavigate("proof-of-fix")} className="w-full py-2.5 border hover:opacity-80 transition-opacity"
                    style={{ borderColor: "#B8872A", color: "#B8872A", borderRadius: "1px",
                      fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    Dispute Resolution
                  </button>
                )}
                <button onClick={() => onNavigate("verification")} className="w-full py-2.5 border hover:bg-[#EDE5D4] transition-colors"
                  style={{ borderColor: "#C8B89A", color: "#5C4A32", borderRadius: "1px",
                    fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  Verify Record →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="mt-12 pt-6 border-t flex flex-wrap items-center justify-between gap-3" style={{ borderColor: "#C8B89A" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "#5C4A32", opacity: 0.4 }}>
            © 2026 CivicTrace · Your civic records are private and protected.
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#4A7C5F" }}/>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "#5C4A32", opacity: 0.4 }}>On-chain · Verified · Open</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Collapse raw hash-chain events into a readable lifecycle timeline: one entry
// per stage change. Dedup-merge / support noise (one event per nearby duplicate
// report) rolls into a single community-support entry instead of flooding the UI.
interface LifecycleRow {
  label: string; time: string; note: string | null;
  done: boolean; current: boolean; hash: string; supportCount: number;
}

function buildLifecycleTimeline(events: { from_status: string | null; to_status: string; created_at: string; note: string | null; this_hash: string }[]): { rows: LifecycleRow[]; mergeCount: number } {
  if (!events.length) return { rows: [], mergeCount: 0 };
  const SUPPORT_RE = /merg|support/i;
  const merges = events.filter(ev => SUPPORT_RE.test(ev.note ?? ""));
  const stages = events.filter((ev, i) => i === 0 || ev.to_status !== events[i - 1].to_status);
  const rows: LifecycleRow[] = stages.map(ev => ({
    label: STATUS_UI[ev.to_status] ?? ev.to_status,
    time: timeAgo(ev.created_at),
    note: ev.note,
    done: true,
    current: false,
    hash: ev.this_hash,
    supportCount: 0,
  }));
  if (merges.length) {
    const latest = merges[merges.length - 1];
    rows.splice(1, 0, {
      label: "COMMUNITY SUPPORT",
      time: timeAgo(latest.created_at),
      note: null,
      done: true,
      current: false,
      hash: latest.this_hash,
      supportCount: merges.length,
    });
  }
  rows.forEach((r, i) => { r.current = i === rows.length - 1; });
  return { rows, mergeCount: merges.length };
}

// ─── PAGE 10 — Complaint Detail ───────────────────────────────────────────────
function ComplaintDetailPage({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const [supported, setSupported] = useState(false);
  const civic = useCivic();
  const live = useLiveVerification(civic.selectedId);

  // Use live data or fallback
  const complaint = live?.complaint;
  const events = live?.events ?? [];
  const onchain = live?.onchain;
  const chainValid = live?.valid;

  // Format complaint data for display
  const displayComplaint = complaint ? {
    trackingCode: complaint.tracking_code,
    category: CATEGORY_LABELS[complaint.category] || complaint.category,
    description: complaint.description || CATEGORY_LABELS[complaint.category] || complaint.category,
    priority: PRIORITY_UI[complaint.priority] ?? "NORMAL",
    status: STATUS_UI[complaint.status] ?? complaint.status,
    lat: complaint.lat,
    lng: complaint.lng,
    supportCount: complaint.support_count,
    createdAt: complaint.created_at,
    lastActionAt: complaint.last_action_at,
    departmentId: complaint.department_id,
  } : null;

  // Build timeline from actual events (collapsed: one entry per stage change,
  // duplicate-report noise rolled into a single community-support entry).
  const { rows: lifecycleRows } = buildLifecycleTimeline(events);
  const timelineEvents = lifecycleRows.length > 0 ? lifecycleRows.map(r => ({
    status: r.label,
    date: r.time,
    desc: r.label === "COMMUNITY SUPPORT"
      ? `${r.supportCount} nearby citizen report${r.supportCount === 1 ? "" : "s"} merged into this verified record`
      : (r.note || `Status updated to ${r.label}`),
    done: true,
    current: r.current,
    hash: r.hash,
    txHash: null as string | null,
  })) : [
    { status: "REPORTED", date: displayComplaint ? timeAgo(displayComplaint.createdAt) : "Just now", desc: "Complaint filed", done: true, current: false, hash: "", txHash: null as string | null },
  ];

  const currentStatus = displayComplaint?.status || "REPORTED";
  const statusCfg = STATUS_CONFIG[currentStatus] || STATUS_CONFIG["REPORTED"];

  const handleViewVerification = (expand = false) => {
    civic.setExpandProof(expand);
    onNavigate("verification");
  };

  return (
    <div style={{ background: "#F5F0E8", minHeight: "100vh", fontFamily: "var(--font-body)" }}>

      {/* ── Top bar ── */}
      <div className="sticky top-0 z-40 border-b" style={{ background: "rgba(245,240,232,0.97)", borderColor: "#C8B89A", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 min-w-0" style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.08em", color: "#5C4A32" }}>
            <button onClick={() => onNavigate("dashboard")} className="hover:opacity-80 transition-opacity opacity-50">Dashboard</button>
            <span className="opacity-40">›</span>
            <button onClick={() => onNavigate("my-complaints")} className="hover:opacity-80 transition-opacity opacity-50">My Complaints</button>
            <span className="opacity-40">›</span>
            <span style={{ color: "#1C0A00" }}>{(displayComplaint?.trackingCode || civic.selectedCode) ?? "CTY-48291-X"}</span>
          </div>
          <div className="flex items-center gap-2">
            <CivicTraceLogo size={22}/>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.9rem", color: "#1C0A00" }}>CivicTrace</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => onNavigate("my-complaints")}
              className="flex items-center gap-1.5 px-3 py-2 border hover:bg-[#EDE5D4] transition-colors"
              style={{ borderColor: "#C8B89A", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.56rem", letterSpacing: "0.08em", color: "#5C4A32", textTransform: "uppercase" }}>
              ← Back
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* ── Case file header ── */}
        <div className="mb-8">
          {/* Top label */}
          <div className="flex items-center gap-4 mb-4">
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.45 }}>
              Civic Case File
            </div>
            <div className="h-px flex-1" style={{ background: "#C8B89A", opacity: 0.35 }}/>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.1em", color: "#3A6B9B", opacity: 0.7 }}>
              {displayComplaint?.trackingCode || "CTY-48291-X"}
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", letterSpacing: "0.1em", color: "#3A6B9B", marginBottom: 4 }}>
                Complaint #{displayComplaint?.trackingCode || "CTY-48291-X"}
              </div>
              <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "clamp(2rem, 4vw, 3rem)", color: "#1C0A00", lineHeight: 1.05 }}>
                {displayComplaint?.description || "Major Pothole"}
              </h1>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <PriorityBadge priority={displayComplaint?.priority || "URGENT"}/>
                <StatusBadge2 status={currentStatus}/>
                {displayComplaint && (
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", color: "#5C4A32", opacity: 0.4 }}>
                    · {daysOpen(displayComplaint.createdAt)} days unresolved
                  </span>
                )}
              </div>
            </div>

            {/* Actions top-right */}
            <div className="flex flex-col gap-2 md:items-end">
              <button onClick={() => handleViewVerification(false)}
                className="px-5 py-2.5 hover:opacity-90 transition-opacity"
                style={{ background: "#1C0A00", color: "#F5F0E8", borderRadius: "1px",
                  fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                View Verification Record
              </button>
              <button onClick={() => {
                if (complaint && !supported) {
                  api.createComplaint({ category: complaint.category, lat: complaint.lat, lng: complaint.lng, description: "Supporting this report" }).catch(() => {});
                }
                setSupported(s => !s);
              }}
                className="px-5 py-2.5 border transition-all"
                style={{ borderColor: supported ? "#4A7C5F" : "#C8B89A",
                  background: supported ? "#EEF4F0" : "transparent",
                  color: supported ? "#4A7C5F" : "#5C4A32",
                  borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                {supported ? "✓ Supporting" : "Support This Complaint"}
              </button>
            </div>
          </div>
        </div>

        {/* ── Decorative rule ── */}
        <div className="flex items-center gap-4 mb-9">
          <div className="flex-1 h-px" style={{ background: "#C8B89A" }}/>
          <div className="w-1.5 h-1.5 rotate-45" style={{ background: "#C8B89A" }}/>
          <div className="flex-1 h-px" style={{ background: "#C8B89A" }}/>
        </div>

        {/* ── MAIN GRID: left col (wide) + right sidebar ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">

          {/* ────── LEFT COLUMN ────── */}
          <div className="space-y-8">

            {/* ── ORIGINAL EVIDENCE ── */}
            <section className="border" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#FAF7F2", overflow: "hidden" }}>
              <div className="px-6 py-3 border-b flex items-center justify-between" style={{ borderColor: "#C8B89A" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.56rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.55 }}>
                  Original Evidence
                </span>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#4A7C5F" }}/>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.07em", color: "#4A7C5F" }}>
                    Integrity Recorded
                  </span>
                </div>
              </div>

              {/* Illustrated evidence "photo" */}
              <div className="relative" style={{ background: "#2A2018", minHeight: 260 }}>
                <svg width="100%" height="260" viewBox="0 0 800 260" preserveAspectRatio="xMidYMid slice">
                  {/* Road surface */}
                  <rect width="800" height="260" fill="#3A3028"/>
                  {/* Road markings */}
                  <rect x="390" y="0" width="20" height="50" fill="#C8A840" opacity="0.6"/>
                  <rect x="390" y="70" width="20" height="50" fill="#C8A840" opacity="0.6"/>
                  <rect x="390" y="140" width="20" height="50" fill="#C8A840" opacity="0.6"/>
                  <rect x="390" y="210" width="20" height="50" fill="#C8A840" opacity="0.6"/>
                  {/* Pavement */}
                  <rect x="0" y="0" width="120" height="260" fill="#4A4035"/>
                  <rect x="680" y="0" width="120" height="260" fill="#4A4035"/>
                  {/* Pothole — main */}
                  <ellipse cx="400" cy="140" rx="90" ry="55" fill="#1A1210"/>
                  <ellipse cx="400" cy="140" rx="85" ry="50" fill="#0E0A08"/>
                  {/* Pothole edge cracking */}
                  <path d="M315 130 Q290 120 280 135 Q285 145 310 140" fill="none" stroke="#2A2018" strokeWidth="3"/>
                  <path d="M480 140 Q510 125 520 145 Q510 155 488 148" fill="none" stroke="#2A2018" strokeWidth="3"/>
                  <path d="M350 90 Q330 70 310 80" fill="none" stroke="#2A2018" strokeWidth="2"/>
                  <path d="M450 90 Q470 75 490 82" fill="none" stroke="#2A2018" strokeWidth="2"/>
                  {/* Water pooling in pothole */}
                  <ellipse cx="400" cy="148" rx="60" ry="28" fill="#1C3048" opacity="0.7"/>
                  <ellipse cx="385" cy="143" rx="20" ry="8" fill="#2A4A68" opacity="0.5"/>
                  {/* Asphalt crack lines */}
                  <path d="M320 135 L295 115 L280 110" stroke="#1A1210" strokeWidth="2" fill="none"/>
                  <path d="M480 135 L505 118 L525 108" stroke="#1A1210" strokeWidth="2" fill="none"/>
                  <path d="M400 90 L410 72 L405 58" stroke="#1A1210" strokeWidth="1.5" fill="none"/>
                  {/* Measurement tape illustration */}
                  <rect x="430" y="165" width="80" height="12" rx="2" fill="#F5C842" opacity="0.85"/>
                  <text x="470" y="175" textAnchor="middle" fill="#1C0A00" fontSize="8" fontFamily="monospace" fontWeight="bold">1.8m</text>
                  {/* Timestamp overlay - use live data */}
                  <rect x="12" y="12" width="200" height="22" fill="rgba(0,0,0,0.65)" rx="1"/>
                  <text x="22" y="27" fill="#F5F0E8" fontSize="9" fontFamily="monospace" opacity="0.9">
                    {displayComplaint
                      ? new Date(displayComplaint.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Asia/Kolkata" }).replace(",", " ·")
                      : "13 SEP 2026 · 14:32:04"}
                  </text>
                  {/* GPS overlay - use live data */}
                  <rect x="12" y="38" width="180" height="18" fill="rgba(0,0,0,0.55)" rx="1"/>
                  <text x="22" y="51" fill="#9BD49B" fontSize="9" fontFamily="monospace" opacity="0.85">
                    GPS {displayComplaint?.lat?.toFixed(4) || "28.6139"}°N {displayComplaint?.lng?.toFixed(4) || "77.2090"}°E
                  </text>
                  {/* CivicTrace watermark */}
                  <text x="790" y="252" textAnchor="end" fill="white" fontSize="9" fontFamily="monospace" opacity="0.3">CivicTrace · Evidence Record</text>
                  {/* Corner notch decoration */}
                  <path d="M0 0 L40 0 L0 40 Z" fill="rgba(28,10,0,0.4)"/>
                </svg>

                {/* Hash overlay bottom - use live data */}
                <div className="absolute bottom-0 left-0 right-0 px-4 py-2 flex items-center justify-between"
                  style={{ background: "rgba(28,10,0,0.75)", backdropFilter: "blur(4px)" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "#C8B89A", letterSpacing: "0.07em" }}>
                    SHA-256 Fingerprint
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "#6AABDB", letterSpacing: "0.05em" }}>
                    {events.length > 0 && events[events.length - 1].this_hash
                      ? `0x${events[events.length - 1].this_hash.slice(0, 6)}…${events[events.length - 1].this_hash.slice(-6)}`
                      : "0x4f91a2…d8c3e7b1"}
                  </div>
                </div>
              </div>

              {/* Evidence metadata - use live data */}
              <div className="px-6 py-4 grid grid-cols-3 gap-4">
                {[
                  { label: "Captured", value: displayComplaint ? new Date(displayComplaint.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" }).replace(",", " ·") : "13 Sep 2026 · 14:32" },
                  { label: "Location", value: displayComplaint ? `${displayComplaint.lat.toFixed(4)}°N ${displayComplaint.lng.toFixed(4)}°E` : "Sector X, New Delhi" },
                  { label: "Evidence Integrity", value: chainValid ? "✓ Verified" : "✓ Recorded" },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.45, marginBottom: 3 }}>
                      {label}
                    </div>
                    <div style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", color: "#1C0A00", lineHeight: 1.3 }}>
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ── COMPLAINT TIMELINE ── */}
            <section className="border" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#FAF7F2", overflow: "hidden" }}>
              <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "#C8B89A" }}>
                <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "1.15rem", color: "#1C0A00" }}>
                  Complaint Timeline
                </h2>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.4 }}>
                  {timelineEvents.filter(e => e.done).length} of {timelineEvents.length} stages complete
                </span>
              </div>

              <div className="px-6 py-5">
                <div className="relative">
                  {/* Vertical track */}
                  <div className="absolute" style={{ left: 11, top: 12, bottom: 12, width: 1, background: "linear-gradient(to bottom, #4A7C5F 55%, #C8B89A 55%)", opacity: 0.5 }}/>

                  <div className="space-y-0">
                    {timelineEvents.map((ev, i) => {
                      const cfg = STATUS_CONFIG[ev.status] || STATUS_CONFIG["REPORTED"];
                      const isLast = i === timelineEvents.length - 1;
                      return (
                        <div key={ev.status} className="flex gap-5" style={{ paddingBottom: isLast ? 0 : 28 }}>
                          {/* Node */}
                          <div className="flex-shrink-0 relative z-10 mt-0.5">
                            {ev.done ? (
                              <div style={{
                                width: 22, height: 22, borderRadius: "50%",
                                background: ev.current ? "#1C0A00" : "#4A7C5F",
                                border: `2px solid ${ev.current ? "#1C0A00" : "#4A7C5F"}`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                boxShadow: ev.current ? "0 0 0 3px #F5F0E8, 0 0 0 5px #1C0A00" : "none",
                              }}>
                                {ev.current ? (
                                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#F5F0E8" }}/>
                                ) : (
                                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                    <path d="M2 5 L4 7 L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                )}
                              </div>
                            ) : (
                              <div style={{
                                width: 22, height: 22, borderRadius: "50%",
                                background: "#FAF7F2", border: "1.5px dashed #C8B89A",
                                display: "flex", alignItems: "center", justifyContent: "center",
                              }}>
                                <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#C8B89A", opacity: 0.4 }}/>
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0 pt-0.5">
                            <div className="flex items-center flex-wrap gap-2 mb-1">
                              <span style={{
                                fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.1em",
                                textTransform: "uppercase",
                                color: ev.done ? (ev.current ? "#1C0A00" : cfg.color) : "#C8B89A",
                                fontWeight: ev.current ? 700 : 400,
                              }}>
                                {ev.status}
                              </span>
                              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: ev.done ? "#5C4A32" : "#C8B89A", opacity: ev.done ? 0.6 : 0.5 }}>
                                {ev.date}
                              </span>
                              {ev.done && !ev.current && (
                                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", color: "#4A7C5F", opacity: 0.7 }}>
                                  · Recorded
                                </span>
                              )}
                            </div>
                            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.83rem", color: ev.done ? "#1C0A00" : "#C8B89A", lineHeight: 1.5, opacity: ev.done ? 0.75 : 0.5 }}>
                              {ev.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>

            {/* ── COMMUNITY REPORTS ── */}
            <section className="border" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#FAF7F2", overflow: "hidden" }}>
              <div className="px-6 py-4 border-b" style={{ borderColor: "#C8B89A" }}>
                <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "1.15rem", color: "#1C0A00" }}>
                  Community Reports
                </h2>
              </div>
              <div className="px-6 py-5">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  {/* Large number - use live support count */}
                  <div className="flex-shrink-0 border px-6 py-5 text-center" style={{ borderColor: "#C8B89A", background: "#F5F0E8", borderRadius: "1px" }}>
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "3.5rem", color: "#1C0A00", lineHeight: 1 }}>
                      {displayComplaint?.supportCount ?? 17}
                    </div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.45, marginTop: 4 }}>Citizens</div>
                  </div>

                  <div className="flex-1">
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "0.9rem", color: "#1C0A00", lineHeight: 1.65, marginBottom: 12 }}>
                      {displayComplaint?.supportCount ?? 17} citizens reported the same civic issue near {displayComplaint ? `${displayComplaint.lat.toFixed(2)}°N ${displayComplaint.lng.toFixed(2)}°E` : "Sector X"}. AI spatial deduplication identified nearby reports and combined them into one verified civic record.
                    </p>

                    {/* Dot clusters (visual) */}
                    <div className="flex items-center gap-1 mb-4 flex-wrap">
                      {Array.from({ length: displayComplaint?.supportCount || 17 }).map((_, i) => (
                        <div key={i} style={{
                          width: 10, height: 10, borderRadius: "50%",
                          background: i < 4 ? "#9B3A3A" : i < 10 ? "#C4622D" : "#3A6B9B",
                          opacity: 0.6 + (i % 3) * 0.1,
                        }}/>
                      ))}
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", color: "#5C4A32", opacity: 0.45, marginLeft: 6 }}>
                        {displayComplaint?.supportCount ?? 17} supporting reports
                      </span>
                    </div>

                    <button onClick={() => onNavigate("public-record")} className="flex items-center gap-2 px-5 py-2 border hover:bg-[#EDE5D4] transition-colors"
                      style={{ borderColor: "#C8B89A", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#1C0A00" }}>
                      View Supporting Reports
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M3 2 L7 5 L3 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* ── LOCATION MAP ── */}
            <section className="border" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#FAF7F2", overflow: "hidden" }}>
              <div className="px-6 py-3 border-b flex items-center justify-between" style={{ borderColor: "#C8B89A" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.56rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.55 }}>
                  Reported Location
                </span>
                <span style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "#5C4A32" }}>
                  {displayComplaint ? `${displayComplaint.lat.toFixed(4)}°N ${displayComplaint.lng.toFixed(4)}°E` : "Sector X, New Delhi"}
                </span>
              </div>
              {/* Illustrated map */}
              <div style={{ background: "#E8E0D0", height: 200, position: "relative", overflow: "hidden" }}>
                <svg width="100%" height="200" viewBox="0 0 600 200" preserveAspectRatio="xMidYMid slice">
                  <rect width="600" height="200" fill="#E8E0D0"/>
                  {/* Grid of roads */}
                  <line x1="0" y1="100" x2="600" y2="100" stroke="#D4C9B0" strokeWidth="20"/>
                  <line x1="300" y1="0" x2="300" y2="200" stroke="#D4C9B0" strokeWidth="16"/>
                  <line x1="0" y1="50" x2="600" y2="50" stroke="#D4C9B0" strokeWidth="8"/>
                  <line x1="0" y1="155" x2="600" y2="155" stroke="#D4C9B0" strokeWidth="8"/>
                  <line x1="150" y1="0" x2="150" y2="200" stroke="#D4C9B0" strokeWidth="8"/>
                  <line x1="450" y1="0" x2="450" y2="200" stroke="#D4C9B0" strokeWidth="8"/>
                  {/* Road centrelines */}
                  <line x1="0" y1="100" x2="600" y2="100" stroke="#C8B89A" strokeWidth="1" strokeDasharray="12 10"/>
                  <line x1="300" y1="0" x2="300" y2="200" stroke="#C8B89A" strokeWidth="1" strokeDasharray="12 10"/>
                  {/* City blocks */}
                  {[
                    [160, 60, 130, 30], [305, 60, 130, 30],
                    [160, 115, 130, 30],[305, 115, 130, 30],
                    [10, 60, 130, 30],  [10, 115, 130, 30],
                    [460, 60, 130, 30], [460, 115, 130, 30],
                  ].map(([x, y, w, h], i) => (
                    <rect key={i} x={x} y={y} width={w} height={h} fill="#DAD1BE" stroke="#C8B89A" strokeWidth="0.5"/>
                  ))}
                  {/* Complaint marker */}
                  <circle cx="300" cy="100" r="18" fill="#9B3A3A" opacity="0.2"/>
                  <circle cx="300" cy="100" r="10" fill="#9B3A3A"/>
                  <circle cx="300" cy="100" r="4" fill="white"/>
                  {/* Label */}
                  <rect x="215" y="70" width="170" height="22" rx="1" fill="rgba(28,10,0,0.75)"/>
                  <text x="300" y="85" textAnchor="middle" fill="#F5F0E8" fontSize="9" fontFamily="monospace">{displayComplaint ? `${displayComplaint.trackingCode} · ${displayComplaint.description.slice(0, 28)}` : "Select a complaint"}</text>
                </svg>
              </div>
              <div className="px-6 py-3 border-t flex items-center justify-between" style={{ borderColor: "#C8B89A" }}>
                <span style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "#5C4A32", opacity: 0.65 }}>
                  {displayComplaint ? `${displayComplaint.lat.toFixed(4)}°N ${displayComplaint.lng.toFixed(4)}°E` : "—"}
                </span>
                <button onClick={() => onNavigate("civic-map")} className="flex items-center gap-1.5 hover:opacity-70 transition-opacity"
                  style={{ fontFamily: "var(--font-mono)", fontSize: "0.56rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#3A6B9B" }}>
                  View on Civic Map →
                </button>
              </div>
            </section>

          </div>

          {/* ────── RIGHT SIDEBAR ────── */}
          <div className="space-y-5">

            {/* ── Complaint info card ── */}
            <div className="border" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#FAF7F2", overflow: "hidden" }}>
              <div className="h-0.5" style={{ background: statusCfg.color }}/>
              <div className="px-5 py-4 border-b" style={{ borderColor: "#C8B89A" }}>
                <h3 style={{ fontFamily: "var(--font-mono)", fontSize: "0.56rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.55 }}>
                  Complaint Information
                </h3>
              </div>
              <div className="px-5 py-2">
                {[
                  { label: "Category",  value: displayComplaint?.category || "—" },
                  { label: "Priority",  value: displayComplaint?.priority || "—" },
                  { label: "Location",  value: displayComplaint ? `${displayComplaint.lat.toFixed(4)}°N ${displayComplaint.lng.toFixed(4)}°E` : "—" },
                  { label: "Submitted", value: displayComplaint ? new Date(displayComplaint.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—" },
                  { label: "Supporting", value: displayComplaint ? `${displayComplaint.supportCount} Citizens` : "—" },
                ].map(({ label, value }, i, arr) => (
                  <div key={label} className="flex items-start justify-between gap-3 py-3"
                    style={{ borderBottom: i < arr.length - 1 ? "1px solid #EDE5D4" : "none" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.54rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.45, flexShrink: 0 }}>
                      {label}
                    </span>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", color: "#1C0A00", textAlign: "right" }}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Civic Impact Score ── */}
            <div className="border" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#FAF7F2", overflow: "hidden" }}>
              <div className="px-5 py-4 border-b" style={{ borderColor: "#C8B89A" }}>
                <h3 style={{ fontFamily: "var(--font-mono)", fontSize: "0.56rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.55 }}>
                  Civic Impact Score
                </h3>
              </div>
              <div className="px-5 py-5">
                {/* Score ring */}
                <div className="flex items-center gap-4 mb-5">
                  <svg width="72" height="72" viewBox="0 0 72 72">
                    <circle cx="36" cy="36" r="28" fill="none" stroke="#EDE5D4" strokeWidth="5"/>
                    <circle cx="36" cy="36" r="28" fill="none" stroke="#9B3A3A" strokeWidth="5"
                      strokeDasharray={`${2 * Math.PI * 28 * 0.87} ${2 * Math.PI * 28}`}
                      strokeDashoffset={2 * Math.PI * 28 * 0.25}
                      strokeLinecap="round"
                      style={{ transform: "rotate(-90deg)", transformOrigin: "36px 36px" }}/>
                    <text x="36" y="40" textAnchor="middle" fontFamily="var(--font-display)" fontSize="16" fontWeight="700" fill="#1C0A00">{displayComplaint ? Math.min(99, 50 + displayComplaint.supportCount * 8) : 87}</text>
                  </svg>
                  <div>
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "2rem", color: "#1C0A00", lineHeight: 1 }}>
                      {displayComplaint ? Math.min(99, 50 + displayComplaint.supportCount * 8) : 87}<span style={{ fontSize: "1rem", opacity: 0.3 }}> / 100</span>
                    </div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", color: "#5C4A32", opacity: 0.45, marginTop: 3 }}>
                      High civic concern
                    </div>
                  </div>
                </div>
                {/* Breakdown */}
                {[
                  { label: "Supporting Citizens", value: String(displayComplaint?.supportCount ?? "—") },
                  { label: "Priority",            value: displayComplaint?.priority || "—" },
                  { label: "Time Unresolved",     value: displayComplaint ? `${daysOpen(displayComplaint.createdAt)} days` : "—" },
                  { label: "Affected Area",        value: "High" },
                  { label: "Escalation History",   value: "0" },
                ].map(({ label, value }, i, arr) => (
                  <div key={label} className="flex items-center justify-between py-2"
                    style={{ borderBottom: i < arr.length - 1 ? "1px solid #EDE5D4" : "none" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.53rem", textTransform: "uppercase", letterSpacing: "0.07em", color: "#5C4A32", opacity: 0.45 }}>
                      {label}
                    </span>
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.92rem", color: "#1C0A00" }}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Blockchain Verification preview ── */}
            <div className="border" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#EDE5D4", overflow: "hidden" }}>
              <div className="px-5 py-4 border-b" style={{ borderColor: "#C8B89A" }}>
                <h3 style={{ fontFamily: "var(--font-mono)", fontSize: "0.56rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.55 }}>
                  Verifiable Record
                </h3>
              </div>
              <div className="px-5 py-4 space-y-2.5">
                {[
                  "Complaint creation recorded",
                  "Evidence fingerprint recorded",
                  "Status changes recorded",
                ].map(line => (
                  <div key={line} className="flex items-center gap-2.5">
                    <div className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: "#4A7C5F" }}>
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path d="M1.5 4 L3.5 6 L6.5 2" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", color: "#1C0A00", opacity: 0.8 }}>
                      {line}
                    </span>
                  </div>
                ))}
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.53rem", color: "#5C4A32", opacity: 0.5, lineHeight: 1.5, marginTop: 12, letterSpacing: "0.04em" }}>
                  Important lifecycle events are backed by verifiable blockchain records.
                </p>
                <button onClick={() => handleViewVerification(true)}
                  className="w-full py-2.5 mt-2 flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity"
                  style={{ background: "#1C0A00", color: "#F5F0E8", borderRadius: "1px",
                    fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  View Blockchain Proof →
                </button>
              </div>
            </div>

            {/* ── Privacy note ── */}
            <div className="border px-5 py-4 flex items-start gap-3" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#FAF7F2" }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 2, opacity: 0.4 }}>
                <path d="M7 1 L12 3.5 L12 7 C12 10 9.5 12.5 7 13.5 C4.5 12.5 2 10 2 7 L2 3.5 Z" stroke="#1C0A00" strokeWidth="1.1" fill="none"/>
                <circle cx="7" cy="7" r="1.5" fill="#1C0A00" opacity="0.5"/>
              </svg>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "#5C4A32", opacity: 0.55, lineHeight: 1.6 }}>
                Citizen identity is protected. Personal information is never displayed on the public complaint record.
              </p>
            </div>

            {/* ── Escalation note ── */}
            <div className="border px-5 py-3 flex items-center gap-3" style={{ borderColor: "#C4622D40", borderRadius: "2px", background: "#FBF0EA" }}>
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#C4622D" }}/>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.54rem", color: "#C4622D", lineHeight: 1.5, letterSpacing: "0.05em" }}>
                Escalation threshold: 7 days. Auto-escalation in 4 days if unresolved.
              </p>
            </div>

          </div>
        </div>

        {/* ── Footer ── */}
        <div className="mt-12 pt-6 border-t flex flex-wrap items-center justify-between gap-3" style={{ borderColor: "#C8B89A" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "#5C4A32", opacity: 0.4 }}>
            © 2026 CivicTrace · This complaint record is transparent and verifiable.
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#4A7C5F" }}/>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "#5C4A32", opacity: 0.4 }}>Open · On-chain · Verifiable</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PAGE 11 — Proof of Fix & Citizen Verification ───────────────────────────
function ProofOfFixPage({ onNavigate }: { onNavigate: (p: Page) => void }) {
  // "before/after" slider state
  const [sliderX, setSliderX] = useState(50); // percent
  const [dragging, setDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Citizen decision state: null | "yes" | "no" | "reopened"
  const [decision, setDecision] = useState<null | "yes" | "no" | "reopened">(null);
  const [reopenReason, setReopenReason] = useState("");
  const [reopenNote, setReopenNote] = useState("");
  const [hasNewEvidence, setHasNewEvidence] = useState(false);
  const civic = useCivic();

  const handleSliderMove = (clientX: number) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const pct = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
    setSliderX(pct);
  };

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!dragging) return;
      const x = "touches" in e ? e.touches[0].clientX : e.clientX;
      handleSliderMove(x);
    };
    const onUp = () => setDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove);
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [dragging]);

  const reopenReasons = [
    "Issue still exists",
    "Partially fixed",
    "Fix does not match the reported issue",
    "New problem remains",
    "Other",
  ];

  return (
    <div style={{ background: "#F5F0E8", minHeight: "100vh", fontFamily: "var(--font-body)" }}>

      {/* ── Top bar ── */}
      <div className="sticky top-0 z-40 border-b" style={{ background: "rgba(245,240,232,0.97)", borderColor: "#C8B89A", backdropFilter: "blur(8px)" }}>
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5" style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.08em", color: "#5C4A32" }}>
            <button onClick={() => onNavigate("dashboard")} className="hover:opacity-80 transition-opacity opacity-50">Dashboard</button>
            <span className="opacity-40">›</span>
            <button onClick={() => onNavigate("my-complaints")} className="hover:opacity-80 transition-opacity opacity-50">My Complaints</button>
            <span className="opacity-40">›</span>
            <button onClick={() => onNavigate("complaint-detail")} className="hover:opacity-80 transition-opacity opacity-50">Complaint</button>
            <span className="opacity-40">›</span>
            <span style={{ color: "#1C0A00" }}>Verify Fix</span>
          </div>
          <div className="flex items-center gap-2">
            <CivicTraceLogo size={22}/>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.9rem", color: "#1C0A00" }}>CivicTrace</span>
          </div>
          <button onClick={() => onNavigate("complaint-detail")}
            className="px-3 py-2 border hover:bg-[#EDE5D4] transition-colors"
            style={{ borderColor: "#C8B89A", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.56rem", letterSpacing: "0.08em", color: "#5C4A32", textTransform: "uppercase" }}>
            ← Complaint
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* ── Page header ── */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-5">
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.56rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.4 }}>
              Proof of Fix · Citizen Verification
            </div>
            <div className="h-px flex-1" style={{ background: "#C8B89A", opacity: 0.4 }}/>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.56rem", color: "#3A6B9B", opacity: 0.7 }}>CTY-48291-X</span>
          </div>

          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "clamp(2rem, 4vw, 3rem)", color: "#1C0A00", lineHeight: 1.05, marginBottom: 10 }}>
            Is the Issue Actually Fixed?
          </h1>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.95rem", color: "#5C4A32", opacity: 0.7, lineHeight: 1.6, maxWidth: 600, marginBottom: 20 }}>
            The authority has submitted evidence of resolution. Review the proof before confirming the complaint as resolved.
          </p>

          {/* Complaint identity bar */}
          <div className="flex flex-wrap items-center gap-0 border overflow-hidden inline-flex" style={{ borderColor: "#C8B89A", borderRadius: "2px" }}>
            {[
              { label: "Complaint", value: "#CTY-48291-X" },
              { label: "Issue", value: "Major Pothole" },
              { label: "Category", value: "Roads & Infrastructure" },
              { label: "Status", value: "PROOF SUBMITTED" },
            ].map(({ label, value }, i) => (
              <div key={label} className="px-5 py-3 border-r last:border-r-0" style={{ background: "#FAF7F2", borderColor: "#C8B89A" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.4, marginBottom: 2 }}>
                  {label}
                </div>
                <div style={{
                  fontFamily: i === 3 ? "var(--font-mono)" : "var(--font-body)",
                  fontSize: i === 3 ? "0.6rem" : "0.83rem",
                  color: i === 3 ? "#6A5C8A" : "#1C0A00",
                  letterSpacing: i === 3 ? "0.08em" : 0,
                  fontWeight: i === 3 ? 700 : 400,
                }}>
                  {i === 3 ? (
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: "#6A5C8A" }}/>
                      {value}
                    </span>
                  ) : value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Decorative rule ── */}
        <div className="flex items-center gap-4 mb-9">
          <div className="flex-1 h-px" style={{ background: "#C8B89A" }}/>
          <div className="w-1.5 h-1.5 rotate-45" style={{ background: "#C8B89A" }}/>
          <div className="flex-1 h-px" style={{ background: "#C8B89A" }}/>
        </div>

        {/* ── BEFORE / AFTER SLIDER ── */}
        <section className="border mb-8" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#FAF7F2", overflow: "hidden" }}>
          <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "#C8B89A" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "1.25rem", color: "#1C0A00" }}>
              Before → After
            </h2>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.54rem", letterSpacing: "0.08em", color: "#5C4A32", opacity: 0.45 }}>
              Drag to compare
            </span>
          </div>

          {/* Slider canvas */}
          <div
            ref={sliderRef}
            className="relative select-none"
            style={{ height: 340, cursor: "ew-resize", overflow: "hidden" }}
            onMouseDown={e => { setDragging(true); handleSliderMove(e.clientX); }}
            onTouchStart={e => { setDragging(true); handleSliderMove(e.touches[0].clientX); }}>

            {/* AFTER (right / authority fix) — full width base layer */}
            <div className="absolute inset-0">
              <svg width="100%" height="340" viewBox="0 0 900 340" preserveAspectRatio="xMidYMid slice">
                <rect width="900" height="340" fill="#3A3830"/>
                {/* Repaired road surface — smoother, lighter */}
                <rect width="900" height="340" fill="#4A4840"/>
                {/* Road markings */}
                <rect x="440" y="0" width="20" height="55" fill="#C8A840" opacity="0.7"/>
                <rect x="440" y="80" width="20" height="55" fill="#C8A840" opacity="0.7"/>
                <rect x="440" y="160" width="20" height="55" fill="#C8A840" opacity="0.7"/>
                <rect x="440" y="240" width="20" height="55" fill="#C8A840" opacity="0.7"/>
                <rect x="440" y="300" width="20" height="55" fill="#C8A840" opacity="0.7"/>
                {/* Pavement */}
                <rect x="0" y="0" width="110" height="340" fill="#524E46"/>
                <rect x="790" y="0" width="110" height="340" fill="#524E46"/>
                {/* Patch — repaired area, slightly different tone */}
                <ellipse cx="450" cy="170" rx="105" ry="68" fill="#3E3C36" opacity="0.9"/>
                <ellipse cx="450" cy="170" rx="95" ry="58" fill="#46443E"/>
                {/* Patch edge marks */}
                <ellipse cx="450" cy="170" rx="100" ry="63" fill="none" stroke="#5A5850" strokeWidth="2" strokeDasharray="6 4"/>
                {/* Smooth surface texture */}
                <line x1="330" y1="140" x2="570" y2="140" stroke="#525048" strokeWidth="1" opacity="0.4"/>
                <line x1="330" y1="160" x2="570" y2="160" stroke="#525048" strokeWidth="1" opacity="0.3"/>
                <line x1="330" y1="180" x2="570" y2="180" stroke="#525048" strokeWidth="1" opacity="0.3"/>
                <line x1="330" y1="200" x2="570" y2="200" stroke="#525048" strokeWidth="1" opacity="0.4"/>
                {/* Authority timestamp */}
                <rect x="12" y="12" width="195" height="22" fill="rgba(0,0,0,0.65)" rx="1"/>
                <text x="22" y="27" fill="#F5F0E8" fontSize="9" fontFamily="monospace" opacity="0.9">16 SEP 2026 · 09:42:11</text>
                <rect x="12" y="38" width="185" height="18" fill="rgba(0,0,0,0.55)" rx="1"/>
                <text x="22" y="51" fill="#9BD49B" fontSize="9" fontFamily="monospace" opacity="0.85">AUTHORITY · ROADS DEPT WARD 7</text>
                <text x="888" y="332" textAnchor="end" fill="white" fontSize="9" fontFamily="monospace" opacity="0.3">CivicTrace · Authority Evidence</text>
              </svg>
            </div>

            {/* BEFORE (left / citizen original) — clipped */}
            <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - sliderX}% 0 0)` }}>
              <svg width="100%" height="340" viewBox="0 0 900 340" preserveAspectRatio="xMidYMid slice">
                <rect width="900" height="340" fill="#3A3028"/>
                <rect x="0" y="0" width="110" height="340" fill="#4A4035"/>
                <rect x="790" y="0" width="110" height="340" fill="#4A4035"/>
                <rect x="440" y="0" width="20" height="50" fill="#C8A840" opacity="0.6"/>
                <rect x="440" y="70" width="20" height="50" fill="#C8A840" opacity="0.6"/>
                <rect x="440" y="140" width="20" height="50" fill="#C8A840" opacity="0.6"/>
                <rect x="440" y="210" width="20" height="50" fill="#C8A840" opacity="0.6"/>
                {/* Pothole */}
                <ellipse cx="450" cy="170" rx="95" ry="58" fill="#1A1210"/>
                <ellipse cx="450" cy="170" rx="88" ry="52" fill="#0E0A08"/>
                <ellipse cx="450" cy="178" rx="62" ry="30" fill="#1C3048" opacity="0.7"/>
                <path d="M360 158 Q335 145 322 162 Q328 174 356 167" fill="none" stroke="#2A2018" strokeWidth="3"/>
                <path d="M535 160 Q562 145 576 165 Q565 176 538 170" fill="none" stroke="#2A2018" strokeWidth="3"/>
                <path d="M360 158 L330 135 L312 128" stroke="#1A1210" strokeWidth="2"/>
                <path d="M535 158 L565 138 L582 130" stroke="#1A1210" strokeWidth="2"/>
                <rect x="480" y="192" width="80" height="12" rx="2" fill="#F5C842" opacity="0.85"/>
                <text x="520" y="202" textAnchor="middle" fill="#1C0A00" fontSize="8" fontFamily="monospace" fontWeight="bold">1.8m</text>
                <rect x="12" y="12" width="185" height="22" fill="rgba(0,0,0,0.65)" rx="1"/>
                <text x="22" y="27" fill="#F5F0E8" fontSize="9" fontFamily="monospace" opacity="0.9">13 SEP 2026 · 14:32:04</text>
                <rect x="12" y="38" width="162" height="18" fill="rgba(0,0,0,0.55)" rx="1"/>
                <text x="22" y="51" fill="#9BD49B" fontSize="9" fontFamily="monospace" opacity="0.85">GPS 28.6139°N 77.2090°E</text>
              </svg>
            </div>

            {/* Divider handle */}
            <div className="absolute top-0 bottom-0 flex items-center justify-center"
              style={{ left: `${sliderX}%`, transform: "translateX(-50%)", zIndex: 10, pointerEvents: "none" }}>
              <div style={{ width: 2, background: "rgba(255,255,255,0.9)", height: "100%" }}/>
              <div className="absolute flex flex-col items-center gap-1" style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "#F5F0E8", border: "2px solid #1C0A00",
                boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M5 8 L2 8 M5 8 L3.5 6 M5 8 L3.5 10" stroke="#1C0A00" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M11 8 L14 8 M11 8 L12.5 6 M11 8 L12.5 10" stroke="#1C0A00" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="8" y1="4" x2="8" y2="12" stroke="#C8B89A" strokeWidth="1" strokeDasharray="2 2"/>
                </svg>
              </div>
            </div>

            {/* Corner labels */}
            <div className="absolute bottom-3 left-4 px-2 py-1" style={{ background: "rgba(28,10,0,0.7)", borderRadius: "1px" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "#F5F0E8", letterSpacing: "0.1em" }}>BEFORE · Citizen Report</span>
            </div>
            <div className="absolute bottom-3 right-4 px-2 py-1" style={{ background: "rgba(74,124,95,0.8)", borderRadius: "1px" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "#F5F0E8", letterSpacing: "0.1em" }}>AFTER · Authority Fix</span>
            </div>
          </div>
        </section>

        {/* ── AUTHORITY PROOF DETAILS ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Authority proof card */}
          <section className="border" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#FAF7F2", overflow: "hidden" }}>
            <div className="px-5 py-3 border-b" style={{ borderColor: "#C8B89A" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.56rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.55 }}>
                Authority's Proof of Fix
              </span>
            </div>
            <div className="px-5 py-4 space-y-0">
              {[
                { label: "Submitted",    value: "16 Sep 2026 · 09:42" },
                { label: "Location",     value: "Sector X, New Delhi" },
                { label: "Integrity",    value: "✓ Digital fingerprint recorded" },
              ].map(({ label, value }, i, arr) => (
                <div key={label} className="flex items-start justify-between gap-4 py-3"
                  style={{ borderBottom: i < arr.length - 1 ? "1px solid #EDE5D4" : "none" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.53rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.45, flexShrink: 0 }}>
                    {label}
                  </span>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", color: "#1C0A00", textAlign: "right" }}>
                    {value}
                  </span>
                </div>
              ))}
              <div className="pt-3 mt-1 border-t" style={{ borderColor: "#EDE5D4" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.4, marginBottom: 5 }}>
                  Resolution Note
                </div>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.83rem", color: "#1C0A00", lineHeight: 1.6, fontStyle: "italic", opacity: 0.8 }}>
                  "Road surface repaired and damaged section restored."
                </p>
              </div>
            </div>
          </section>

          {/* Verification checklist */}
          <section className="border" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#EDE5D4", overflow: "hidden" }}>
            <div className="px-5 py-3 border-b" style={{ borderColor: "#C8B89A" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.56rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.55 }}>
                Resolution Evidence
              </span>
            </div>
            <div className="px-5 py-4 space-y-3">
              {[
                "Evidence submitted by authority",
                "Location matches original report",
                "Timestamp recorded",
                "Evidence fingerprint recorded",
                "Resolution event recorded",
              ].map(item => (
                <div key={item} className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: "#4A7C5F" }}>
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path d="M1.5 4 L3.5 6 L6.5 2" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", color: "#1C0A00", opacity: 0.8 }}>{item}</span>
                </div>
              ))}
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", color: "#5C4A32", opacity: 0.5, lineHeight: 1.5, paddingTop: 8, letterSpacing: "0.04em" }}>
                Important resolution events are backed by a verifiable record.
              </p>
              <button onClick={() => onNavigate("verification")} className="flex items-center gap-1.5 text-left hover:opacity-70 transition-opacity pt-1"
                style={{ fontFamily: "var(--font-mono)", fontSize: "0.57rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#3A6B9B" }}>
                View Verification Record →
              </button>
            </div>
          </section>
        </div>

        {/* ── CITIZEN DECISION ── */}
        <section className="border mb-8" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#FAF7F2", overflow: "hidden" }}>
          <div className="px-6 py-5 border-b" style={{ borderColor: "#C8B89A" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "1.35rem", color: "#1C0A00", marginBottom: 4 }}>
              Does this fix resolve the issue?
            </h2>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "#5C4A32", opacity: 0.65, lineHeight: 1.5 }}>
              Your decision is recorded. A resolution is only considered successful when you confirm the evidence supports the fix.
            </p>
          </div>

          {/* ── UNRESOLVED: show two choices ── */}
          {decision === null && (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* YES */}
              <button onClick={() => { setDecision("yes"); const id = civic.selectedId; if (id) { try { civic.acceptFix(id).catch(() => {}); } catch { /* best-effort, UI flow unchanged */ } } }}
                className="group flex flex-col items-center gap-4 p-8 border-2 transition-all hover:shadow-lg"
                style={{ borderColor: "#4A7C5F", borderRadius: "2px", background: "#EEF4F0" }}>
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "#4A7C5F" }}>
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <path d="M5 14 L11 20 L23 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="text-center">
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#4A7C5F", fontWeight: 700, marginBottom: 6 }}>
                    ✓ Yes, Issue is Fixed
                  </div>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", color: "#5C4A32", opacity: 0.7, lineHeight: 1.5 }}>
                    The authority's evidence confirms the issue has been genuinely resolved.
                  </p>
                </div>
              </button>

              {/* NO */}
              <button onClick={() => { setDecision("no"); const id = civic.selectedId; if (id) { try { civic.disputeComplaint(id, reopenReason || reopenNote || undefined).catch(() => {}); } catch { /* best-effort, UI flow unchanged */ } } }}
                className="group flex flex-col items-center gap-4 p-8 border-2 transition-all hover:shadow-lg"
                style={{ borderColor: "#B8872A", borderRadius: "2px", background: "#FBF6EB" }}>
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "#B8872A" }}>
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <path d="M14 8 L14 16 M14 20 L14 21" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="text-center">
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#B8872A", fontWeight: 700, marginBottom: 6 }}>
                    ⚠ No, Issue is Not Fixed
                  </div>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", color: "#5C4A32", opacity: 0.7, lineHeight: 1.5 }}>
                    The evidence does not demonstrate a genuine resolution. You can dispute and reopen.
                  </p>
                </div>
              </button>
            </div>
          )}

          {/* ── YES: confirmed resolved ── */}
          {decision === "yes" && (
            <div className="p-8 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5" style={{ background: "#4A7C5F" }}>
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                  <path d="M6 18 L14 26 L30 10" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "1.6rem", color: "#4A7C5F", marginBottom: 8 }}>
                Resolution Confirmed
              </div>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.9rem", color: "#5C4A32", opacity: 0.75, lineHeight: 1.6, maxWidth: 420, marginBottom: 16 }}>
                You've confirmed that the reported issue has been fixed.
              </p>

              {/* Status transition */}
              <div className="flex items-center gap-3 mb-6">
                <span className="px-3 py-1.5 border" style={{ borderColor: "#6A5C8A40", background: "#F2EFF8", color: "#6A5C8A", fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.08em", borderRadius: "1px" }}>
                  PROOF SUBMITTED
                </span>
                <svg width="20" height="12" viewBox="0 0 20 12" fill="none">
                  <path d="M0 6 L16 6 M12 2 L16 6 L12 10" stroke="#4A7C5F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="px-3 py-1.5 border" style={{ borderColor: "#4A7C5F", background: "#EEF4F0", color: "#4A7C5F", fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.08em", borderRadius: "1px" }}>
                  RESOLVED
                </span>
              </div>

              <div className="flex items-center gap-2 mb-6">
                <div className="w-3 h-3 rounded-full" style={{ background: "#4A7C5F" }}/>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.56rem", letterSpacing: "0.08em", color: "#4A7C5F" }}>
                  Citizen confirmation recorded
                </span>
              </div>

              <button onClick={() => onNavigate("complaint-detail")}
                className="px-8 py-3 hover:opacity-90 transition-opacity"
                style={{ background: "#1C0A00", color: "#F5F0E8", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.62rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                View Complaint Record →
              </button>
            </div>
          )}

          {/* ── NO: dispute panel ── */}
          {decision === "no" && (
            <div className="p-6 border-t" style={{ borderColor: "#C8B89A" }}>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "1.1rem", color: "#1C0A00", marginBottom: 4 }}>
                Tell us what remains unresolved.
              </h3>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.83rem", color: "#5C4A32", opacity: 0.65, lineHeight: 1.5, marginBottom: 18 }}>
                Select the reason and optionally add new evidence. The complaint will return to the active lifecycle.
              </p>

              {/* Reason list */}
              <div className="space-y-2 mb-5">
                {reopenReasons.map(r => (
                  <label key={r} className="flex items-center gap-3 cursor-pointer group">
                    <div className="w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center transition-all"
                      style={{
                        borderColor: reopenReason === r ? "#B8872A" : "#C8B89A",
                        background: reopenReason === r ? "#B8872A" : "transparent",
                      }}
                      onClick={() => setReopenReason(r)}>
                      {reopenReason === r && <div className="w-1.5 h-1.5 rounded-full" style={{ background: "white" }}/>}
                    </div>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "#1C0A00", opacity: reopenReason === r ? 1 : 0.65 }}>
                      {r}
                    </span>
                  </label>
                ))}
              </div>

              {/* Description */}
              <div className="mb-5">
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.54rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.5, marginBottom: 6 }}>
                  What did you find? (optional)
                </div>
                <textarea value={reopenNote} onChange={e => setReopenNote(e.target.value)} rows={3}
                  placeholder="Describe what remains unfixed…"
                  style={{
                    width: "100%", padding: "10px 14px",
                    border: "1px solid #C8B89A", borderRadius: "1px",
                    background: "#F5F0E8", color: "#1C0A00",
                    fontFamily: "var(--font-body)", fontSize: "0.84rem", outline: "none", resize: "vertical",
                  }}/>
              </div>

              {/* New evidence upload */}
              <div className="mb-6">
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.54rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.5, marginBottom: 6 }}>
                  New Citizen Evidence (optional)
                </div>
                {hasNewEvidence ? (
                  <div className="flex items-center gap-3 p-3 border" style={{ borderColor: "#4A7C5F40", background: "#EEF4F0", borderRadius: "1px" }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <rect x="1" y="1" width="12" height="12" rx="1" stroke="#4A7C5F" strokeWidth="1"/>
                      <circle cx="4.5" cy="4.5" r="1.5" fill="#4A7C5F"/>
                      <path d="M1 10 L4 7 L6 9 L9 6 L13 10" stroke="#4A7C5F" strokeWidth="1" strokeLinejoin="round"/>
                    </svg>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", color: "#4A7C5F" }}>New evidence attached</span>
                    <button onClick={() => setHasNewEvidence(false)} className="ml-auto hover:opacity-60 transition-opacity"
                      style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", color: "#9B3A3A" }}>Remove</button>
                  </div>
                ) : (
                  <button onClick={() => setHasNewEvidence(true)}
                    className="w-full py-4 border-2 border-dashed flex flex-col items-center gap-2 hover:bg-[#EDE5D4] transition-colors"
                    style={{ borderColor: "#C8B89A", borderRadius: "1px" }}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ opacity: 0.35 }}>
                      <rect x="1" y="1" width="18" height="18" rx="2" stroke="#1C0A00" strokeWidth="1.2"/>
                      <circle cx="6.5" cy="6.5" r="2" stroke="#1C0A00" strokeWidth="1"/>
                      <path d="M1 14 L6 9 L9 12 L13 8 L19 14" stroke="#1C0A00" strokeWidth="1.2" strokeLinejoin="round"/>
                    </svg>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.56rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.5 }}>
                      Add New Evidence
                    </span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <button onClick={() => { setDecision("reopened"); const id = civic.selectedId; if (id) { try { civic.disputeComplaint(id, reopenReason || reopenNote || undefined).catch(() => {}); } catch { /* best-effort, UI flow unchanged */ } } }}
                  className="px-7 py-3 hover:opacity-90 transition-opacity"
                  style={{ background: "#9B3A3A", color: "#F5F0E8", borderRadius: "1px",
                    fontFamily: "var(--font-mono)", fontSize: "0.62rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  Reopen Complaint
                </button>
                <button onClick={() => setDecision(null)} className="px-5 py-3 border hover:bg-[#EDE5D4] transition-colors"
                  style={{ borderColor: "#C8B89A", borderRadius: "1px",
                    fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#5C4A32" }}>
                  Go Back
                </button>
              </div>
            </div>
          )}

          {/* ── REOPENED: confirmation state ── */}
          {decision === "reopened" && (
            <div className="p-8 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5" style={{ background: "#B8872A" }}>
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <path d="M16 6 C10 6 5 11 5 17 C5 22 8.5 26 13 27.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                  <path d="M12 6 L16 6 L16 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="22" cy="22" r="7" stroke="white" strokeWidth="2"/>
                  <path d="M22 18 L22 22 L25 24" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "1.6rem", color: "#B8872A", marginBottom: 8 }}>
                Complaint Reopened
              </div>

              {/* Status flow */}
              <div className="flex items-center gap-3 mb-5 flex-wrap justify-center">
                <span className="px-3 py-1.5 border" style={{ borderColor: "#4A7C5F40", background: "#EEF4F0", color: "#4A7C5F", fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.08em", borderRadius: "1px" }}>
                  RESOLVED
                </span>
                <svg width="20" height="12" viewBox="0 0 20 12" fill="none">
                  <path d="M0 6 L16 6 M12 2 L16 6 L12 10" stroke="#B8872A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="px-3 py-1.5 border" style={{ borderColor: "#B8872A", background: "#FBF6EB", color: "#B8872A", fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.08em", borderRadius: "1px" }}>
                  DISPUTED / REOPENED
                </span>
              </div>

              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.9rem", color: "#5C4A32", opacity: 0.75, lineHeight: 1.6, maxWidth: 440, marginBottom: 16 }}>
                Your report has been returned to the active complaint lifecycle.
              </p>

              <div className="space-y-2 mb-7">
                {["Reopen event recorded", "Authority notified", "Complaint remains publicly traceable"].map(note => (
                  <div key={note} className="flex items-center gap-2.5 justify-center">
                    <div className="w-3 h-3 rounded-full" style={{ background: "#B8872A" }}/>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.56rem", letterSpacing: "0.07em", color: "#B8872A" }}>
                      {note}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 flex-wrap justify-center">
                <button onClick={() => onNavigate("complaint-detail")}
                  className="px-7 py-3 hover:opacity-90 transition-opacity"
                  style={{ background: "#1C0A00", color: "#F5F0E8", borderRadius: "1px",
                    fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  View Complaint
                </button>
                <button onClick={() => onNavigate("verification")} className="px-7 py-3 border hover:bg-[#EDE5D4] transition-colors"
                  style={{ borderColor: "#C8B89A", color: "#1C0A00", borderRadius: "1px",
                    fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  View Verification Record
                </button>
              </div>
            </div>
          )}
        </section>

        {/* ── ACCOUNTABILITY ── */}
        <section className="border mb-8" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#FAF7F2", overflow: "hidden" }}>
          <div className="px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.4, marginBottom: 6 }}>
                Why This Matters
              </div>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.88rem", color: "#1C0A00", lineHeight: 1.65, opacity: 0.8, maxWidth: 560 }}>
                "A resolution is only considered successful when the evidence supports the fix and the citizen has an opportunity to dispute it."
              </p>
            </div>
            <div className="flex items-center gap-3 border px-5 py-3 flex-shrink-0" style={{ borderColor: "#C8B89A", background: "#F5F0E8", borderRadius: "1px" }}>
              <div className="w-2 h-2 rounded-full" style={{ background: "#4A7C5F" }}/>
              <div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.45, marginBottom: 2 }}>
                  Citizen Verification
                </div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", color: "#4A7C5F" }}>
                  ● Recorded
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <div className="pt-6 border-t flex flex-wrap items-center justify-between gap-3" style={{ borderColor: "#C8B89A" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "#5C4A32", opacity: 0.4 }}>
            © 2026 CivicTrace · The authority cannot simply mark a complaint resolved without verifiable evidence.
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#4A7C5F" }}/>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "#5C4A32", opacity: 0.4 }}>Open · On-chain · Verifiable</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAP DATA ────────────────────────────────────────────────────────────────
interface MapIssue {
  id: string; issue: string; category: string; location: string;
  priority: "NORMAL" | "URGENT" | "VERY URGENT";
  status: string; score: number; supporters: number; submitted: string;
  x: number; y: number; // percent coords on SVG canvas
  verified: boolean;
}

const MAP_ISSUES: MapIssue[] = [
  { id: "CTY-48291-X", issue: "Major Pothole",                    category: "Roads & Infrastructure", location: "Sector X, Central Road",      priority: "URGENT",      status: "IN PROGRESS",     score: 87, supporters: 17, submitted: "13 Sep 2026", x: 52, y: 44, verified: true  },
  { id: "CTY-73921-A", issue: "Fallen Tree Blocking Road",        category: "Public Safety",          location: "Sector A, Park Lane",         priority: "VERY URGENT", status: "ESCALATED",       score: 94, supporters: 31, submitted: "07 Sep 2026", x: 28, y: 30, verified: true  },
  { id: "CTY-29104-R", issue: "Overflowing Garbage Bin",          category: "Sanitation",             location: "Sector R, Market Road",       priority: "NORMAL",      status: "RESOLVED",        score: 64, supporters:  8, submitted: "02 Sep 2026", x: 73, y: 62, verified: true  },
  { id: "CTY-55017-M", issue: "Broken Streetlight",               category: "Roads & Infrastructure", location: "Sector M, Park Avenue",       priority: "URGENT",      status: "DISPUTED",        score: 71, supporters: 12, submitted: "29 Aug 2026", x: 38, y: 68, verified: false },
  { id: "CTY-11432-B", issue: "Burst Water Main",                 category: "Water & Drainage",       location: "Sector B, Grove Street",      priority: "VERY URGENT", status: "IN PROGRESS",     score: 91, supporters: 24, submitted: "10 Sep 2026", x: 64, y: 24, verified: true  },
  { id: "CTY-82341-C", issue: "Overflowing Drain",                category: "Water & Drainage",       location: "Sector C, Canal Road",        priority: "URGENT",      status: "ASSESSED",        score: 76, supporters: 14, submitted: "11 Sep 2026", x: 82, y: 38, verified: false },
  { id: "CTY-60218-D", issue: "Damaged Footpath",                 category: "Roads & Infrastructure", location: "Sector D, East Avenue",       priority: "NORMAL",      status: "REPORTED",        score: 55, supporters:  6, submitted: "12 Sep 2026", x: 17, y: 52, verified: false },
  { id: "CTY-39027-E", issue: "Open Manhole",                     category: "Public Safety",          location: "Sector E, High Street",       priority: "VERY URGENT", status: "ASSIGNED",        score: 88, supporters: 19, submitted: "09 Sep 2026", x: 44, y: 78, verified: true  },
  { id: "CTY-74510-F", issue: "Illegal Dumping",                  category: "Sanitation",             location: "Sector F, Riverside",         priority: "NORMAL",      status: "RESOLVED",        score: 60, supporters:  5, submitted: "01 Sep 2026", x: 89, y: 72, verified: true  },
  { id: "CTY-20193-G", issue: "Dead Trees in Park",               category: "Parks & Public Spaces",  location: "Sector G, Green Park",        priority: "NORMAL",      status: "REPORTED",        score: 48, supporters:  4, submitted: "13 Sep 2026", x: 60, y: 82, verified: false },
  { id: "CTY-91047-H", issue: "Air Quality Alert",                category: "Environment",            location: "Sector H, Industrial Zone",   priority: "URGENT",      status: "ESCALATED",       score: 83, supporters: 22, submitted: "05 Sep 2026", x: 10, y: 22, verified: true  },
  { id: "CTY-35682-J", issue: "Noise Pollution",                  category: "Environment",            location: "Sector J, Near Highway",      priority: "NORMAL",      status: "IN PROGRESS",     score: 57, supporters:  9, submitted: "08 Sep 2026", x: 77, y: 18, verified: false },
  { id: "CTY-19482-P", issue: "Road Crack Near School Zone",      category: "Roads & Infrastructure", location: "Sector P, School Corridor",   priority: "VERY URGENT", status: "UNRESOLVED",      score: 84, supporters: 19, submitted: "04 Sep 2026", x: 34, y: 58, verified: true  },
  { id: "CTY-38124-K", issue: "Drainage Flooding Residential Area",category: "Water & Drainage",      location: "Sector K, North Zone",        priority: "URGENT",      status: "PROOF SUBMITTED", score: 79, supporters: 15, submitted: "06 Sep 2026", x: 68, y: 48, verified: true  },
  { id: "CTY-61503-Q", issue: "Blocked Storm Drain",              category: "Water & Drainage",       location: "Sector Q, South Road",        priority: "NORMAL",      status: "ASSIGNED",        score: 58, supporters:  7, submitted: "11 Sep 2026", x: 22, y: 72, verified: false },
  { id: "CTY-72910-L", issue: "Vandalism of Public Bench",        category: "Parks & Public Spaces",  location: "Sector L, Lakeside Walk",     priority: "NORMAL",      status: "REPORTED",        score: 42, supporters:  3, submitted: "12 Sep 2026", x: 56, y: 70, verified: false },
  { id: "CTY-44821-N", issue: "Chemical Spill Near River",        category: "Environment",            location: "Sector N, Riverside",         priority: "VERY URGENT", status: "ESCALATED",       score: 92, supporters: 28, submitted: "08 Sep 2026", x: 84, y: 82, verified: true  },
  { id: "CTY-56039-S", issue: "Streetlight Outage — Long Route",  category: "Roads & Infrastructure", location: "Sector S, West Boulevard",    priority: "URGENT",      status: "IN PROGRESS",     score: 74, supporters: 11, submitted: "10 Sep 2026", x: 46, y: 20, verified: true  },
  { id: "CTY-33471-T", issue: "Rubbish Accumulation at Bus Stop", category: "Sanitation",             location: "Sector T, Transit Hub",       priority: "NORMAL",      status: "ASSESSED",        score: 51, supporters:  6, submitted: "12 Sep 2026", x: 70, y: 35, verified: false },
  { id: "CTY-28104-V", issue: "Loose Paving Causing Trip Hazard", category: "Public Safety",          location: "Sector V, Market Square",     priority: "URGENT",      status: "REPORTED",        score: 68, supporters: 10, submitted: "13 Sep 2026", x: 20, y: 40, verified: false },
];

function markerColor(issue: MapIssue): string {
  if (issue.status === "RESOLVED") return "#4A7C5F";
  if (issue.status === "DISPUTED") return "#B8872A";
  if (issue.status === "ESCALATED" || issue.status === "UNRESOLVED") return "#9B3A3A";
  if (issue.priority === "VERY URGENT") return "#9B3A3A";
  if (issue.priority === "URGENT") return "#C4622D";
  if (issue.status === "IN PROGRESS" || issue.status === "PROOF SUBMITTED") return "#3A6B9B";
  return "#5C4A32";
}

// ─── PAGE 12 — Public Civic Map ───────────────────────────────────────────────
function PublicCivicMapPage({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [selected, setSelected] = useState<MapIssue | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [legendEnabled, setLegendEnabled] = useState<Record<string, boolean>>({
    "Reported / Active": true, "Urgent": true, "In Progress": true,
    "Resolved": true, "Disputed": true, "Escalated": true,
  });

  const categories = ["All", "Roads & Infrastructure", "Water & Drainage", "Sanitation", "Public Safety", "Parks & Public Spaces", "Environment"];
  const statuses    = ["All", "Reported", "Assessed", "Assigned", "In Progress", "Proof Submitted", "Resolved", "Disputed", "Unresolved", "Escalated"];
  const priorities  = ["All", "Normal", "Urgent", "Very Urgent"];

  function legendKeyForColor(color: string): string {
    if (color === "#4A7C5F") return "Resolved";
    if (color === "#B8872A") return "Disputed";
    if (color === "#9B3A3A") return "Escalated";
    if (color === "#C4622D") return "Urgent";
    if (color === "#3A6B9B") return "In Progress";
    return "Reported / Active";
  }

  const insightRows = [
    { label: "Public Safety",       score: 91, color: "#9B3A3A" },
    { label: "Roads",               score: 87, color: "#C4622D" },
    { label: "Water",               score: 79, color: "#3A6B9B" },
    { label: "Sanitation",          score: 71, color: "#B8872A" },
    { label: "Environment",         score: 65, color: "#5C4A32" },
  ];

  const filteredIssues = MAP_ISSUES.filter(m => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      m.id.toLowerCase().includes(q) ||
      m.issue.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q) ||
      m.location.toLowerCase().includes(q);
    const matchCat  = catFilter === "All" || m.category === catFilter;
    const matchStat = statusFilter === "All" || m.status.toLowerCase() === statusFilter.toLowerCase();
    const matchPri  = priorityFilter === "All" || m.priority.toLowerCase().replace(/_/g, " ") === priorityFilter.toLowerCase();
    const color = markerColor(m);
    const matchLegend = legendEnabled[legendKeyForColor(color)];
    return matchSearch && matchCat && matchStat && matchPri && matchLegend;
  });

  const resetFilters = () => {
    setSearch(""); setCatFilter("All"); setStatusFilter("All"); setPriorityFilter("All"); setSelected(null);
    setLegendEnabled({ "Reported / Active": true, "Urgent": true, "In Progress": true, "Resolved": true, "Disputed": true, "Escalated": true });
  };
  const filtersActive = search || catFilter !== "All" || statusFilter !== "All" || priorityFilter !== "All";

  const legendItems = [
    { label: "Reported / Active", color: "#5C4A32" },
    { label: "Urgent",            color: "#C4622D" },
    { label: "In Progress",       color: "#3A6B9B" },
    { label: "Resolved",          color: "#4A7C5F" },
    { label: "Disputed",          color: "#B8872A" },
    { label: "Escalated",         color: "#9B3A3A" },
  ];

  return (
    <div style={{ background: "#F5F0E8", minHeight: "100vh", fontFamily: "var(--font-body)" }}>

      {/* ── Navbar (public-facing, matches homepage style) ── */}
      <nav className="sticky top-0 z-50 border-b" style={{ background: "rgba(245,240,232,0.97)", borderColor: "#C8B89A", backdropFilter: "blur(8px)" }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <button onClick={() => onNavigate("home")} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <CivicTraceLogo size={32}/>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.05rem", color: "#1C0A00" }}>CivicTrace</span>
          </button>

          <div className="hidden md:flex items-center gap-7">
            {[
              { l: "Leaderboard", p: "leaderboard" },
              { l: "Trust Scores", p: "dept-trust" },
              { l: "Impact", p: "impact-dashboard" },
            ].map(({ l, p }) => (
              <button key={p} onClick={() => onNavigate(p as Page)} className="hover:opacity-60 transition-opacity"
                style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5C4A32" }}>
                {l}
              </button>
            ))}
            <button className="hover:opacity-60 transition-opacity"
              style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#3A6B9B", borderBottom: "1px solid #3A6B9B", paddingBottom: "1px" }}>
              Civic Map
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => onNavigate("auth")}
              className="px-3 py-2 border hover:bg-[#EDE5D4] transition-colors"
              style={{ borderColor: "#C8B89A", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.08em", color: "#5C4A32", textTransform: "uppercase" }}>
              Sign In
            </button>
            <button onClick={() => onNavigate("report-category")}
              className="px-4 py-2 hover:opacity-90 transition-opacity"
              style={{ background: "#1C0A00", color: "#F5F0E8", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Report an Issue
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero header ── */}
      <div className="border-b" style={{ borderColor: "#C8B89A", background: "#FAF7F2" }}>
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.56rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.45, marginBottom: 10 }}>
            Public Civic Record · Live
          </div>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", color: "#1C0A00", lineHeight: 1.05 }}>
                See What Your City<br/>Is Dealing With.
              </h1>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.92rem", color: "#5C4A32", opacity: 0.65, lineHeight: 1.65, marginTop: 10, maxWidth: 500 }}>
                Explore publicly visible civic issues and follow their verified journey from report to resolution.
              </p>
            </div>

            {/* City stats strip */}
            <div className="flex items-stretch border divide-x overflow-hidden" style={{ borderColor: "#C8B89A", borderRadius: "2px" }}>
              {[
                { n: "128", label: "Active",    color: "#9B3A3A" },
                { n: "64",  label: "In Progress",color: "#3A6B9B" },
                { n: "342", label: "Resolved",  color: "#4A7C5F" },
                { n: "12",  label: "Disputed",  color: "#B8872A" },
                { n: "7",   label: "Escalated", color: "#9B3A3A" },
              ].map(({ n, label, color }) => (
                <div key={label} className="px-5 py-3 text-center" style={{ background: "#FAF7F2", borderColor: "#C8B89A" }}>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.5rem", color, lineHeight: 1 }}>{n}</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.48rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.45, marginTop: 3 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main layout: sidebar + map ── */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">

          {/* ── LEFT SIDEBAR: filters ── */}
          <aside className="space-y-4">

            {/* Search */}
            <div className="relative">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ opacity: 0.35 }}>
                <circle cx="5.5" cy="5.5" r="4" stroke="#1C0A00" strokeWidth="1.2"/>
                <path d="M8.5 8.5 L11.5 11.5" stroke="#1C0A00" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search ID, issue, category, area…"
                style={{
                  width: "100%", padding: "9px 30px 9px 32px",
                  border: "1px solid #C8B89A", borderRadius: "1px",
                  background: "#FAF7F2", color: "#1C0A00",
                  fontFamily: "var(--font-body)", fontSize: "0.83rem", outline: "none",
                }}/>
              {search && (
                <button onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-60 transition-opacity"
                  style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "#5C4A32", lineHeight: 1 }}>×</button>
              )}
            </div>

            {/* Category filter */}
            <div className="border" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#FAF7F2", overflow: "hidden" }}>
              <div className="px-4 py-2.5 border-b" style={{ borderColor: "#C8B89A" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.54rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.5 }}>Category</span>
              </div>
              <div className="py-1">
                {categories.map(c => (
                  <button key={c} onClick={() => setCatFilter(c)}
                    className="w-full text-left px-4 py-2 transition-colors hover:bg-[#EDE5D4]"
                    style={{
                      background: catFilter === c ? "#EDE5D4" : "transparent",
                      fontFamily: catFilter === c ? "var(--font-mono)" : "var(--font-body)",
                      fontSize: catFilter === c ? "0.58rem" : "0.82rem",
                      letterSpacing: catFilter === c ? "0.06em" : 0,
                      color: catFilter === c ? "#1C0A00" : "#5C4A32",
                      fontWeight: catFilter === c ? 700 : 400,
                    }}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Status filter */}
            <div className="border" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#FAF7F2", overflow: "hidden" }}>
              <div className="px-4 py-2.5 border-b" style={{ borderColor: "#C8B89A" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.54rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.5 }}>Status</span>
              </div>
              <div className="py-1">
                {statuses.map(s => {
                  const key = s.toUpperCase().replace(/ /g, " ");
                  const cfg = STATUS_CONFIG[key];
                  return (
                    <button key={s} onClick={() => setStatusFilter(s)}
                      className="w-full text-left px-4 py-2 flex items-center gap-2 transition-colors hover:bg-[#EDE5D4]"
                      style={{ background: statusFilter === s ? "#EDE5D4" : "transparent" }}>
                      {cfg && <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.color }}/>}
                      <span style={{
                        fontFamily: statusFilter === s ? "var(--font-mono)" : "var(--font-body)",
                        fontSize: statusFilter === s ? "0.56rem" : "0.82rem",
                        letterSpacing: statusFilter === s ? "0.06em" : 0,
                        color: statusFilter === s ? "#1C0A00" : "#5C4A32",
                        fontWeight: statusFilter === s ? 700 : 400,
                      }}>
                        {s}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Priority filter */}
            <div className="border" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#FAF7F2", overflow: "hidden" }}>
              <div className="px-4 py-2.5 border-b" style={{ borderColor: "#C8B89A" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.54rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.5 }}>Priority</span>
              </div>
              <div className="py-1">
                {priorities.map(p => (
                  <button key={p} onClick={() => setPriorityFilter(p)}
                    className="w-full text-left px-4 py-2 transition-colors hover:bg-[#EDE5D4]"
                    style={{
                      background: priorityFilter === p ? "#EDE5D4" : "transparent",
                      fontFamily: priorityFilter === p ? "var(--font-mono)" : "var(--font-body)",
                      fontSize: priorityFilter === p ? "0.58rem" : "0.82rem",
                      letterSpacing: priorityFilter === p ? "0.06em" : 0,
                      color: priorityFilter === p ? "#1C0A00" : "#5C4A32",
                      fontWeight: priorityFilter === p ? 700 : 400,
                    }}>
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {filtersActive && (
              <button onClick={resetFilters} className="w-full py-2 border hover:bg-[#EDE5D4] transition-colors text-center"
                style={{ borderColor: "#C8B89A", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.57rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#9B3A3A" }}>
                Reset Filters
              </button>
            )}

            {/* Insight block */}
            <div className="border" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#FAF7F2", overflow: "hidden" }}>
              <div className="px-4 py-3 border-b" style={{ borderColor: "#C8B89A" }}>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "0.92rem", color: "#1C0A00" }}>Where Attention Is Needed</span>
              </div>
              <div className="px-4 py-3 space-y-3">
                {insightRows.map(({ label, score, color }) => (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-1">
                      <span style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "#1C0A00", opacity: 0.75 }}>{label}</span>
                      <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.9rem", color }}>{score}</span>
                    </div>
                    <div className="h-1 rounded-full" style={{ background: "#EDE5D4" }}>
                      <div className="h-1 rounded-full" style={{ width: `${score}%`, background: color, opacity: 0.7, transition: "width 0.4s ease" }}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Privacy note */}
            <div className="border px-4 py-3 flex items-start gap-2.5" style={{ borderColor: "#C8B89A40", borderRadius: "2px", background: "#FAF7F2" }}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0, marginTop: 2, opacity: 0.35 }}>
                <path d="M6.5 1 L11.5 3.5 L11.5 7C11.5 9.5 9.5 11.5 6.5 12.5 C3.5 11.5 1.5 9.5 1.5 7 L1.5 3.5 Z" stroke="#1C0A00" strokeWidth="1"/>
              </svg>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", color: "#5C4A32", opacity: 0.55, lineHeight: 1.55 }}>
                Citizen identities remain private. Only public-safe complaint information is shown.
              </p>
            </div>
          </aside>

          {/* ── RIGHT: MAP ── */}
          <div>
            {/* Map container */}
            <div className="border relative" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#E8E0CE", overflow: "hidden" }}>

              {/* Map header bar */}
              <div className="absolute top-0 left-0 right-0 z-20 px-4 py-2 flex items-center justify-between border-b"
                style={{ background: "rgba(245,240,232,0.95)", borderColor: "#C8B89A", backdropFilter: "blur(4px)" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.54rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.5 }}>
                  Civic Atlas · {filteredIssues.length} issues visible
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                  {legendItems.map(({ label, color }) => {
                    const on = legendEnabled[label] !== false;
                    return (
                      <button key={label}
                        onClick={() => setLegendEnabled(prev => ({ ...prev, [label]: !prev[label] }))}
                        className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                        title={on ? `Hide ${label}` : `Show ${label}`}
                        style={{ opacity: on ? 1 : 0.35 }}>
                        <div className="w-2 h-2 rounded-full" style={{ background: color }}/>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", color: "#5C4A32", textDecoration: on ? "none" : "line-through" }}>{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SVG illustrated map */}
              <div style={{ paddingTop: 38 }}>
                <svg
                  viewBox="0 0 900 580"
                  style={{ display: "block", width: "100%", height: "auto", minHeight: 460 }}
                  onClick={() => setSelected(null)}>

                  {/* Map background */}
                  <rect width="900" height="580" fill="#E8E0CE"/>

                  {/* Paper grain-like subtle lines */}
                  {[50, 110, 170, 230, 290, 350, 410, 470, 530].map(y =>
                    <line key={y} x1="0" y1={y} x2="900" y2={y} stroke="#D4C9B0" strokeWidth="0.4" opacity="0.5"/>
                  )}
                  {[80, 180, 280, 380, 480, 580, 680, 780, 880].map(x =>
                    <line key={x} x1={x} y1="0" x2={x} y2="580" stroke="#D4C9B0" strokeWidth="0.4" opacity="0.5"/>
                  )}

                  {/* ── City blocks — coloured background patches ── */}
                  {/* Parks */}
                  <rect x="200" y="300" width="130" height="90" fill="#D4DEAD" opacity="0.6" rx="1"/>
                  <rect x="580" y="420" width="110" height="80" fill="#D4DEAD" opacity="0.6" rx="1"/>
                  <rect x="50" y="100" width="100" height="70" fill="#D4DEAD" opacity="0.55" rx="1"/>
                  {/* Water body */}
                  <path d="M0 520 Q100 490 220 510 Q340 530 420 510 Q500 490 600 520 L600 580 L0 580 Z" fill="#BFCEDA" opacity="0.55"/>
                  <text x="150" y="565" textAnchor="middle" fill="#5C7A8A" fontSize="9" fontFamily="var(--font-mono)" opacity="0.6" letterSpacing="2">CIVIC LAKE</text>
                  {/* Industrial zone */}
                  <rect x="750" y="80" width="150" height="140" fill="#C8C0AA" opacity="0.5"/>

                  {/* ── Major roads ── */}
                  {/* Horizontals */}
                  <rect x="0" y="156" width="900" height="22" fill="#D4C9B0"/>
                  <rect x="0" y="350" width="900" height="22" fill="#D4C9B0"/>
                  <rect x="0" y="490" width="900" height="16" fill="#D4C9B0"/>
                  {/* Verticals */}
                  <rect x="148" y="0" width="20" height="580" fill="#D4C9B0"/>
                  <rect x="380" y="0" width="22" height="580" fill="#D4C9B0"/>
                  <rect x="640" y="0" width="18" height="580" fill="#D4C9B0"/>
                  <rect x="820" y="0" width="14" height="580" fill="#D4C9B0"/>
                  {/* Diagonal road */}
                  <path d="M0 240 L200 156" stroke="#D4C9B0" strokeWidth="14" fill="none"/>
                  <path d="M640 350 L900 460" stroke="#D4C9B0" strokeWidth="12" fill="none"/>

                  {/* Road centrelines */}
                  {[167, 361, 499].map(y =>
                    <line key={y} x1="0" y1={y} x2="900" y2={y} stroke="#C8B89A" strokeWidth="0.8" strokeDasharray="14 10"/>
                  )}
                  {[158, 391, 649].map(x =>
                    <line key={x} x1={x} y1="0" x2={x} y2="580" stroke="#C8B89A" strokeWidth="0.8" strokeDasharray="14 10"/>
                  )}

                  {/* ── Secondary roads ── */}
                  {[260, 430].map(y =>
                    <line key={`h${y}`} x1="0" y1={y} x2="900" y2={y} stroke="#D4C9B0" strokeWidth="9"/>
                  )}
                  {[280, 520, 720].map(x =>
                    <line key={`v${x}`} x1={x} y1="0" x2={x} y2="580" stroke="#D4C9B0" strokeWidth="9"/>
                  )}

                  {/* ── City blocks (buildings) ── */}
                  {[
                    [20,20,120,125], [180,20,185,125], [420,20,200,125], [670,20,135,125],
                    [20,195,110,50], [180,195,185,50], [420,195,200,50], [670,195,135,50],
                    [20,265,110,70], [340,265,30,70], [420,265,200,70], [670,265,135,70],
                    [20,390,110,90], [180,390,185,90], [420,390,200,90], [670,390,135,90],
                    [20,495,110,75], [420,495,200,75], [670,495,145,75],
                  ].map(([x, y, w, h], i) => (
                    <rect key={i} x={x} y={y} width={w} height={h} fill="#D9D1BE" stroke="#C8B89A" strokeWidth="0.5"/>
                  ))}

                  {/* Zone labels */}
                  {[
                    { x: 75, y: 82, t: "SECTOR A" }, { x: 270, y: 82, t: "SECTOR B" },
                    { x: 515, y: 82, t: "SECTOR X" },{ x: 736, y: 82, t: "SECTOR H" },
                    { x: 75, y: 320, t: "SECTOR D" },{ x: 515, y: 420, t: "SECTOR R" },
                    { x: 736, y: 320, t: "SECTOR C" },{ x: 270, y: 420, t: "SECTOR M" },
                  ].map(({ x, y, t }) => (
                    <text key={t} x={x} y={y} textAnchor="middle" fill="#5C4A32" fontSize="7.5" fontFamily="var(--font-mono)" opacity="0.4" letterSpacing="1.5">{t}</text>
                  ))}

                  {/* Compass rose */}
                  <g transform="translate(850, 50)">
                    <circle cx="0" cy="0" r="18" fill="#FAF7F2" stroke="#C8B89A" strokeWidth="1"/>
                    <text x="0" y="-6" textAnchor="middle" fill="#1C0A00" fontSize="9" fontFamily="var(--font-mono)" fontWeight="700">N</text>
                    <path d="M0 -3 L-4 8 L0 5 L4 8 Z" fill="#1C0A00" opacity="0.6"/>
                  </g>

                  {/* Scale bar */}
                  <g transform="translate(30, 555)">
                    <line x1="0" y1="0" x2="60" y2="0" stroke="#5C4A32" strokeWidth="1.5"/>
                    <line x1="0" y1="-4" x2="0" y2="4" stroke="#5C4A32" strokeWidth="1.5"/>
                    <line x1="60" y1="-4" x2="60" y2="4" stroke="#5C4A32" strokeWidth="1.5"/>
                    <text x="30" y="-6" textAnchor="middle" fill="#5C4A32" fontSize="7" fontFamily="var(--font-mono)" opacity="0.55">500m</text>
                  </g>

                  {/* ── Complaint markers ── */}
                  {filteredIssues.map(issue => {
                    const cx = (issue.x / 100) * 900;
                    const cy = (issue.y / 100) * 580;
                    const color = markerColor(issue);
                    const isSelected = selected?.id === issue.id;
                    const isHovered = hoveredId === issue.id;

                    return (
                      <g key={issue.id} style={{ cursor: "pointer" }}
                        onClick={e => { e.stopPropagation(); setSelected(isSelected ? null : issue); }}
                        onMouseEnter={() => setHoveredId(issue.id)}
                        onMouseLeave={() => setHoveredId(null)}>
                        {/* Pulse ring */}
                        {(isSelected || isHovered) && (
                          <circle cx={cx} cy={cy} r="20" fill={color} opacity={isSelected ? 0.2 : 0.1}/>
                        )}
                        {/* Shadow */}
                        <circle cx={cx + 1} cy={cy + 2} r="10" fill="rgba(28,10,0,0.15)"/>
                        {/* Main pin body */}
                        <circle cx={cx} cy={cy} r={isSelected ? 12 : isHovered ? 11 : 9} fill={color}
                          stroke={isSelected ? "#1C0A00" : "#FAF7F2"} strokeWidth={isSelected ? 2 : 1.5}
                          style={{ transition: "r 0.15s ease" }}/>
                        {/* Inner dot */}
                        <circle cx={cx} cy={cy} r={isSelected ? 4 : 3} fill="white" opacity="0.85"/>
                        {/* Verified badge */}
                        {issue.verified && (
                          <g transform={`translate(${cx + 6}, ${cy - 9})`}>
                            <circle cx="0" cy="0" r="5" fill="#4A7C5F" stroke="#FAF7F2" strokeWidth="1"/>
                            <path d="M-2 0 L-0.5 1.5 L2.5 -1.5" stroke="white" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
                          </g>
                        )}
                        {/* Hover tooltip */}
                        {isHovered && !isSelected && (() => {
                          const tipW = 160, tipH = 56;
                          const tx = cx > 750 ? cx - tipW - 8 : cx + 18;
                          const ty = cy > 500 ? cy - tipH - 8 : cy - tipH / 2;
                          return (
                            <g pointerEvents="none">
                              <rect x={tx} y={ty} width={tipW} height={tipH} fill="rgba(28,10,0,0.87)" rx="1"/>
                              <text x={tx + 8} y={ty + 15} fill="#F5F0E8" fontSize="8.5" fontFamily="var(--font-display)" fontWeight="700">{issue.issue}</text>
                              <text x={tx + 8} y={ty + 28} fill="#C8B89A" fontSize="7" fontFamily="var(--font-mono)">{issue.priority} · {issue.status}</text>
                              <text x={tx + 8} y={ty + 40} fill="#C8B89A" fontSize="7" fontFamily="var(--font-mono)" opacity="0.7">Impact Score: {issue.score} · {issue.supporters} supporting</text>
                              <text x={tx + 8} y={ty + 52} fill="#C8B89A" fontSize="6.5" fontFamily="var(--font-mono)" opacity="0.5">{issue.id}</text>
                            </g>
                          );
                        })()}
                      </g>
                    );
                  })}

                  {/* ── Floating popup card ── */}
                  {selected && (() => {
                    const cx = (selected.x / 100) * 900;
                    const cy = (selected.y / 100) * 580;
                    const flipX = cx > 650;
                    const flipY = cy > 380;
                    const px = flipX ? cx - 200 : cx + 20;
                    const py = flipY ? cy - 230 : cy + 20;
                    const color = markerColor(selected);
                    const cfg = STATUS_CONFIG[selected.status] || STATUS_CONFIG["REPORTED"];

                    return (
                      <g onClick={e => e.stopPropagation()}>
                        {/* Card bg */}
                        <rect x={px} y={py} width="185" height="215" fill="#FAF7F2" stroke="#C8B89A" strokeWidth="1" rx="1"/>
                        {/* Status stripe */}
                        <rect x={px} y={py} width="185" height="3" fill={color} rx="0"/>
                        {/* ID */}
                        <text x={px + 10} y={py + 18} fill="#3A6B9B" fontSize="7.5" fontFamily="var(--font-mono)" letterSpacing="0.5">{selected.id}</text>
                        {/* Issue */}
                        <text x={px + 10} y={py + 32} fill="#1C0A00" fontSize="11" fontFamily="var(--font-display)" fontWeight="700">{selected.issue}</text>
                        {/* Category */}
                        <text x={px + 10} y={py + 46} fill="#5C4A32" fontSize="7.5" fontFamily="var(--font-body)" opacity="0.65">{selected.category}</text>
                        {/* Location */}
                        <text x={px + 10} y={py + 60} fill="#5C4A32" fontSize="7.5" fontFamily="var(--font-mono)" opacity="0.55">📍 {selected.location.split(",")[0]}</text>
                        {/* Divider */}
                        <line x1={px + 10} y1={py + 70} x2={px + 175} y2={py + 70} stroke="#EDE5D4" strokeWidth="1"/>
                        {/* Priority badge bg */}
                        <rect x={px + 10} y={py + 78} width="55" height="14" fill={selected.priority === "VERY URGENT" ? "#F8EEEE" : selected.priority === "URGENT" ? "#FBF0EA" : "#F0EAE0"} rx="1"/>
                        <text x={px + 37} y={py + 89} textAnchor="middle" fill={selected.priority === "VERY URGENT" ? "#9B3A3A" : selected.priority === "URGENT" ? "#C4622D" : "#5C4A32"} fontSize="6.5" fontFamily="var(--font-mono)" fontWeight="700" letterSpacing="0.5">
                          {selected.priority}
                        </text>
                        {/* Status */}
                        <circle cx={px + 76} cy={py + 85} r="3" fill={cfg.color}/>
                        <text x={px + 82} y={py + 89} fill={cfg.color} fontSize="6.5" fontFamily="var(--font-mono)" fontWeight="700" letterSpacing="0.5">{selected.status}</text>
                        {/* Divider */}
                        <line x1={px + 10} y1={py + 100} x2={px + 175} y2={py + 100} stroke="#EDE5D4" strokeWidth="1"/>
                        {/* Score label */}
                        <text x={px + 10} y={py + 113} fill="#5C4A32" fontSize="7" fontFamily="var(--font-mono)" opacity="0.45" letterSpacing="0.5">CIVIC IMPACT</text>
                        <text x={px + 175} y={py + 113} textAnchor="end" fill="#1C0A00" fontSize="12" fontFamily="var(--font-display)" fontWeight="700">{selected.score}</text>
                        {/* Score bar */}
                        <rect x={px + 10} y={py + 118} width="165" height="3" fill="#EDE5D4" rx="1.5"/>
                        <rect x={px + 10} y={py + 118} width={165 * selected.score / 100} height="3" fill={color} rx="1.5" opacity="0.7"/>
                        {/* Supporters */}
                        <text x={px + 10} y={py + 135} fill="#5C4A32" fontSize="7" fontFamily="var(--font-mono)" opacity="0.45" letterSpacing="0.5">SUPPORTING</text>
                        <text x={px + 175} y={py + 135} textAnchor="end" fill="#1C0A00" fontSize="10" fontFamily="var(--font-display)" fontWeight="700">{selected.supporters} citizens</text>
                        {/* Submitted */}
                        <text x={px + 10} y={py + 150} fill="#5C4A32" fontSize="7" fontFamily="var(--font-mono)" opacity="0.45" letterSpacing="0.5">SUBMITTED</text>
                        <text x={px + 175} y={py + 150} textAnchor="end" fill="#5C4A32" fontSize="8" fontFamily="var(--font-mono)" opacity="0.65">{selected.submitted}</text>
                        {/* Verified */}
                        {selected.verified && (
                          <>
                            <circle cx={px + 14} cy={py + 164} r="5" fill="#4A7C5F"/>
                            <path d={`M${px + 11} ${py + 164} L${px + 13} ${py + 166} L${px + 17} ${py + 162}`} stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                            <text x={px + 22} y={py + 168} fill="#4A7C5F" fontSize="6.5" fontFamily="var(--font-mono)" fontWeight="700" letterSpacing="0.5">VERIFIED RECORD</text>
                          </>
                        )}
                        {/* CTA button */}
                        <rect x={px + 10} y={py + 178} width="165" height="26" fill="#1C0A00" rx="1"/>
                        <text x={px + 92} y={py + 195} textAnchor="middle" fill="#F5F0E8" fontSize="7.5" fontFamily="var(--font-mono)" fontWeight="700" letterSpacing="1">VIEW PUBLIC RECORD →</text>
                        {/* Invisible click area for CTA */}
                        <rect x={px + 10} y={py + 178} width="165" height="26" fill="transparent" style={{ cursor: "pointer" }}
                          onClick={() => onNavigate("public-record")}/>
                      </g>
                    );
                  })()}
                </svg>
              </div>
            </div>

            {/* ── Issue list below map ── */}
            {filteredIssues.length === 0 && (
              <div className="mt-5 border py-10 text-center" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#FAF7F2" }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "1.1rem", color: "#5C4A32", opacity: 0.5, marginBottom: 6 }}>No complaints found</div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", color: "#5C4A32", opacity: 0.4 }}>Try adjusting your search or filters.</div>
                <button onClick={resetFilters} className="mt-4 px-5 py-2 border hover:bg-[#EDE5D4] transition-colors"
                  style={{ borderColor: "#C8B89A", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.56rem", letterSpacing: "0.1em", color: "#9B3A3A", textTransform: "uppercase" }}>
                  Reset Filters
                </button>
              </div>
            )}
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredIssues.map(issue => {
                const color = markerColor(issue);
                const cfg = STATUS_CONFIG[issue.status] || STATUS_CONFIG["REPORTED"];
                return (
                  <button key={issue.id}
                    onClick={() => setSelected(issue)}
                    className="border text-left flex items-start gap-3 p-4 transition-all hover:shadow-md"
                    style={{
                      borderColor: selected?.id === issue.id ? "#1C0A00" : "#C8B89A",
                      background: "#FAF7F2", borderRadius: "2px",
                      borderWidth: selected?.id === issue.id ? "1.5px" : "1px",
                    }}>
                    {/* Color strip */}
                    <div className="w-1 self-stretch flex-shrink-0 rounded-full" style={{ background: color, opacity: 0.8 }}/>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.54rem", color: "#3A6B9B", letterSpacing: "0.06em" }}>{issue.id}</span>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", color: "#5C4A32", opacity: 0.4 }}>·</span>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", color: cfg.color, letterSpacing: "0.06em" }}>{issue.status}</span>
                      </div>
                      <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.9rem", color: "#1C0A00", lineHeight: 1.2 }}>{issue.issue}</div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", color: "#5C4A32", opacity: 0.5, marginTop: 2 }}>📍 {issue.location}</div>
                    </div>
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.1rem", color, flexShrink: 0 }}>{issue.score}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Decorative rule ── */}
        <div className="flex items-center gap-4 my-12">
          <div className="flex-1 h-px" style={{ background: "#C8B89A" }}/>
          <div className="w-1.5 h-1.5 rotate-45" style={{ background: "#C8B89A" }}/>
          <div className="flex-1 h-px" style={{ background: "#C8B89A" }}/>
        </div>

        {/* ── City at a Glance ── */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 items-start mb-12">
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.56rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.4, marginBottom: 8 }}>
              City at a Glance
            </div>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "1.6rem", color: "#1C0A00", marginBottom: 16 }}>
              The civic record in numbers.
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { n: "553",  label: "Total Reports", color: "#1C0A00" },
                { n: "128",  label: "Active Issues",  color: "#9B3A3A" },
                { n: "342",  label: "Resolved",       color: "#4A7C5F" },
                { n: "64",   label: "In Progress",    color: "#3A6B9B" },
                { n: "12",   label: "Disputed",       color: "#B8872A" },
                { n: "7",    label: "Escalated",      color: "#9B3A3A" },
              ].map(({ n, label, color }) => (
                <div key={label} className="border px-5 py-4" style={{ borderColor: "#C8B89A", background: "#FAF7F2", borderRadius: "2px" }}>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "2rem", color, lineHeight: 1 }}>{n}</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.45, marginTop: 4 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Highest impact */}
          <div className="border" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#FAF7F2", overflow: "hidden", minWidth: 220 }}>
            <div className="h-0.5" style={{ background: "#9B3A3A" }}/>
            <div className="px-5 pt-4 pb-2 border-b" style={{ borderColor: "#C8B89A" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.45, marginBottom: 3 }}>
                Highest Impact Issue
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "#3A6B9B" }}>CTY-48291-X</div>
            </div>
            <div className="px-5 py-4">
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "1rem", color: "#1C0A00", marginBottom: 6 }}>Major Pothole</div>
              <div className="flex items-baseline gap-1">
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "2.5rem", color: "#9B3A3A", lineHeight: 1 }}>87</span>
                <span style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", color: "#5C4A32", opacity: 0.4 }}> / 100</span>
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.4, marginTop: 3 }}>
                Civic Impact Score
              </div>
            </div>
          </div>
        </div>

        {/* ── CTA ── */}
        <div className="border" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#1C0A00", overflow: "hidden" }}>
          <div className="px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "1.6rem", color: "#F5F0E8", lineHeight: 1.1, marginBottom: 8 }}>
                Have you found an issue?
              </h2>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.9rem", color: "#C8B89A", opacity: 0.75, lineHeight: 1.6 }}>
                Report it and add a verified civic record to the map.
              </p>
            </div>
            <button onClick={() => onNavigate("report-category")}
              className="flex items-center gap-2 px-8 py-4 border hover:opacity-90 transition-opacity flex-shrink-0"
              style={{ borderColor: "#C8B89A", color: "#F5F0E8", borderRadius: "1px",
                fontFamily: "var(--font-mono)", fontSize: "0.64rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Report an Issue →
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 pt-6 border-t flex flex-wrap items-center justify-between gap-3" style={{ borderColor: "#C8B89A" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "#5C4A32", opacity: 0.4 }}>
            © 2026 CivicTrace · Public Civic Map · All records are openly verifiable.
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#4A7C5F" }}/>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "#5C4A32", opacity: 0.4 }}>Open · On-chain · Verifiable</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PAGE 13 — Public Complaint Record ───────────────────────────────────────
function PublicComplaintRecordPage({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const [supported, setSupported] = useState(false);
  const civic = useCivic();
  const live = useLiveVerification(civic.selectedId);

  const mockTimelineEvents = [
    { status: "REPORTED",        date: "13 Sep · 14:32", desc: "Complaint submitted with evidence.", done: true,  current: false },
    { status: "ASSESSED",        date: "13 Sep · 15:10", desc: "Issue assessed by department.",       done: true,  current: false },
    { status: "ASSIGNED",        date: "13 Sep · 16:02", desc: "Assigned to Roads Department.",       done: true,  current: false },
    { status: "IN PROGRESS",     date: "14 Sep · 09:20", desc: "Work has started.",                   done: true,  current: true  },
    { status: "PROOF SUBMITTED", date: "Awaiting",       desc: "Awaiting resolution evidence.",       done: false, current: false },
    { status: "RESOLVED",        date: "Awaiting",       desc: "Awaiting successful verification.",   done: false, current: false },
  ];

  const timelineEvents = live && live.events.length
    ? live.events.map((ev, i, arr) => ({
        status: ev.to_status,
        date: timeAgo(ev.created_at),
        desc: ev.note || ev.to_status,
        done: true,
        current: i === arr.length - 1,
      }))
    : mockTimelineEvents;

  const mockAccountabilityRows = [
    { label: "Response Time",       value: "Within expected window", ok: true },
    { label: "Current State",       value: "Work in progress",       ok: true },
    { label: "Escalation",          value: "Not currently escalated",ok: true },
    { label: "Resolution Evidence", value: "Not yet submitted",      ok: false },
  ];

  const accountabilityRows = live && live.complaint
    ? [
        { label: "Response Time", value: "Within expected window", ok: true },
        { label: "Current State", value: live.complaint.status, ok: live.valid },
        { label: "Escalation", value: "See escalations", ok: true },
        { label: "Resolution Evidence", value: live.complaint.status === "RESOLVED" ? "Submitted" : "Not yet submitted", ok: live.complaint.status === "RESOLVED" },
      ]
    : mockAccountabilityRows;

  return (
    <div style={{ background: "#F5F0E8", minHeight: "100vh", fontFamily: "var(--font-body)" }}>

      {/* ── Public navbar ── */}
      <nav className="sticky top-0 z-50 border-b" style={{ background: "rgba(245,240,232,0.97)", borderColor: "#C8B89A", backdropFilter: "blur(8px)" }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <button onClick={() => onNavigate("home")} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <CivicTraceLogo size={30}/>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", color: "#1C0A00" }}>CivicTrace</span>
          </button>
          <div className="hidden md:flex items-center gap-6">
            <button onClick={() => onNavigate("civic-map")}
              className="hover:opacity-60 transition-opacity"
              style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#3A6B9B", borderBottom: "1px solid #3A6B9B", paddingBottom: "1px" }}>
              Civic Map
            </button>
            {["About", "Leaderboard"].map(n => (
              <button key={n} className="hover:opacity-60 transition-opacity"
                style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5C4A32" }}>
                {n}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => onNavigate("auth")} className="px-3 py-2 border hover:bg-[#EDE5D4] transition-colors"
              style={{ borderColor: "#C8B89A", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.08em", color: "#5C4A32", textTransform: "uppercase" }}>
              Sign In
            </button>
            <button onClick={() => onNavigate("report-category")} className="px-4 py-2 hover:opacity-90 transition-opacity"
              style={{ background: "#1C0A00", color: "#F5F0E8", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Report an Issue
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* ── Breadcrumb ── */}
        <div className="flex items-center gap-1.5 mb-7" style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.08em", color: "#5C4A32" }}>
          <button onClick={() => onNavigate("civic-map")} className="hover:opacity-80 transition-opacity opacity-50">Public Civic Map</button>
          <span className="opacity-40">›</span>
          <span style={{ color: "#1C0A00" }}>Public Record</span>
        </div>

        {/* ── Case file header ── */}
        <div className="border mb-8 overflow-hidden" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#FAF7F2" }}>
          {/* Status accent */}
          <div className="h-1" style={{ background: "linear-gradient(to right, #C4622D, #3A6B9B)" }}/>
          <div className="px-8 py-7">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="flex-1">
                {/* Public label + verified */}
                <div className="flex items-center gap-3 mb-5 flex-wrap">
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.4 }}>
                    Public Civic Record
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 border" style={{ borderColor: "#4A7C5F40", background: "#EEF4F0", borderRadius: "1px" }}>
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                      <path d="M1.5 4.5 L3.5 6.5 L7.5 2.5" stroke="#4A7C5F" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.1em", color: "#4A7C5F" }}>VERIFIED RECORD</span>
                  </div>
                </div>

                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", letterSpacing: "0.1em", color: "#3A6B9B", marginBottom: 6 }}>#CTY-48291-X</div>
                <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "clamp(2rem, 4vw, 3rem)", color: "#1C0A00", lineHeight: 1.05, marginBottom: 14 }}>
                  Major Pothole
                </h1>
                <div className="flex items-center gap-2 flex-wrap">
                  <PriorityBadge priority="URGENT"/>
                  <StatusBadge2 status="IN PROGRESS"/>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.53rem", color: "#5C4A32", opacity: 0.4 }}>· 3 days unresolved</span>
                </div>
              </div>

              {/* Right — quick meta + actions */}
              <div className="flex flex-col gap-3 md:items-end md:min-w-[200px]">
                <div className="border px-5 py-4 w-full md:w-auto" style={{ borderColor: "#C8B89A", background: "#F5F0E8", borderRadius: "1px" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.4, marginBottom: 6 }}>Civic Impact</div>
                  <div className="flex items-baseline gap-1">
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "2.4rem", color: "#1C0A00", lineHeight: 1 }}>87</span>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", color: "#5C4A32", opacity: 0.35 }}> / 100</span>
                  </div>
                  <div className="mt-2 h-1 rounded-full" style={{ background: "#EDE5D4" }}>
                    <div className="h-1 rounded-full" style={{ width: "87%", background: "#C4622D", opacity: 0.7 }}/>
                  </div>
                </div>
              <button onClick={() => setSupported(s => !s)}
                  className="w-full md:w-auto px-5 py-2.5 border transition-all"
                  style={{ borderColor: supported ? "#4A7C5F" : "#C8B89A", background: supported ? "#EEF4F0" : "transparent",
                    color: supported ? "#4A7C5F" : "#5C4A32", borderRadius: "1px",
                    fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  {supported ? "✓ Supporting" : "Support This Issue"}
                </button>
                <button onClick={() => onNavigate("verification")} className="w-full md:w-auto px-5 py-2.5 hover:opacity-90 transition-opacity"
                  style={{ background: "#1C0A00", color: "#F5F0E8", borderRadius: "1px",
                    fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  View Verification Record →
                </button>
              </div>
            </div>
          </div>

          {/* Meta strip */}
          <div className="border-t grid grid-cols-2 md:grid-cols-4 divide-x" style={{ borderColor: "#C8B89A" }}>
            {[
              { label: "Category",  value: "Roads & Infrastructure" },
              { label: "Location",  value: "Sector X, New Delhi" },
              { label: "Submitted", value: "13 Sep 2026 · 14:32" },
              { label: "Reported By",value: "Citizen identity protected" },
            ].map(({ label, value }, i) => (
              <div key={label} className="px-6 py-3" style={{ borderColor: "#C8B89A" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.4, marginBottom: 3 }}>{label}</div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", color: i === 3 ? "#5C4A32" : "#1C0A00", fontStyle: i === 3 ? "italic" : "normal", opacity: i === 3 ? 0.55 : 1 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── MAIN GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-7">

          {/* LEFT */}
          <div className="space-y-7">

            {/* ── ORIGINAL EVIDENCE ── */}
            <section className="border overflow-hidden" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#FAF7F2" }}>
              <div className="px-6 py-3 border-b flex items-center justify-between" style={{ borderColor: "#C8B89A" }}>
                <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "1.1rem", color: "#1C0A00" }}>Original Evidence</h2>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#4A7C5F" }}/>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", color: "#4A7C5F", letterSpacing: "0.07em" }}>Integrity Recorded</span>
                </div>
              </div>

              {/* Pothole illustration */}
              <div className="relative" style={{ background: "#2A2018" }}>
                <svg width="100%" height="240" viewBox="0 0 800 240" preserveAspectRatio="xMidYMid slice">
                  <rect width="800" height="240" fill="#3A3028"/>
                  <rect x="0" y="0" width="120" height="240" fill="#4A4035"/>
                  <rect x="680" y="0" width="120" height="240" fill="#4A4035"/>
                  <rect x="390" y="0" width="20" height="45" fill="#C8A840" opacity="0.6"/>
                  <rect x="390" y="65" width="20" height="45" fill="#C8A840" opacity="0.6"/>
                  <rect x="390" y="130" width="20" height="45" fill="#C8A840" opacity="0.6"/>
                  <rect x="390" y="195" width="20" height="45" fill="#C8A840" opacity="0.6"/>
                  <ellipse cx="400" cy="128" rx="88" ry="52" fill="#1A1210"/>
                  <ellipse cx="400" cy="128" rx="82" ry="47" fill="#0E0A08"/>
                  <ellipse cx="400" cy="135" rx="58" ry="27" fill="#1C3048" opacity="0.7"/>
                  <ellipse cx="385" cy="130" rx="18" ry="7" fill="#2A4A68" opacity="0.5"/>
                  <path d="M318 120 Q295 108 282 125" fill="none" stroke="#2A2018" strokeWidth="3"/>
                  <path d="M478 120 Q503 108 518 126" fill="none" stroke="#2A2018" strokeWidth="3"/>
                  <path d="M318 120 L292 102 L278 96" stroke="#1A1210" strokeWidth="2" fill="none"/>
                  <path d="M478 120 L504 105 L522 97" stroke="#1A1210" strokeWidth="2" fill="none"/>
                  <rect x="428" y="152" width="76" height="11" rx="2" fill="#F5C842" opacity="0.85"/>
                  <text x="466" y="162" textAnchor="middle" fill="#1C0A00" fontSize="8" fontFamily="monospace" fontWeight="bold">1.8m</text>
                  <rect x="12" y="12" width="180" height="20" fill="rgba(0,0,0,0.65)" rx="1"/>
                  <text x="22" y="26" fill="#F5F0E8" fontSize="9" fontFamily="monospace" opacity="0.9">13 SEP 2026 · 14:32:04</text>
                  <rect x="12" y="36" width="160" height="16" fill="rgba(0,0,0,0.55)" rx="1"/>
                  <text x="22" y="48" fill="#9BD49B" fontSize="8.5" fontFamily="monospace" opacity="0.85">GPS 28.6139°N 77.2090°E</text>
                  <text x="788" y="232" textAnchor="end" fill="white" fontSize="8" fontFamily="monospace" opacity="0.25">CivicTrace · Public Evidence Record</text>
                </svg>
                <div className="absolute bottom-0 left-0 right-0 px-4 py-2 flex items-center justify-between"
                  style={{ background: "rgba(28,10,0,0.75)", backdropFilter: "blur(4px)" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.54rem", color: "#C8B89A", letterSpacing: "0.07em" }}>SHA-256 Fingerprint</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "#6AABDB" }}>0x4f91a2…d8c3e7b1</span>
                </div>
              </div>

              <div className="px-6 py-4 grid grid-cols-3 gap-4 border-t" style={{ borderColor: "#C8B89A" }}>
                {[
                  { label: "Captured",            value: "13 Sep 2026 · 14:32" },
                  { label: "Location",             value: "Sector X, New Delhi" },
                  { label: "Evidence Integrity",   value: "✓ Digital fingerprint recorded" },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.4, marginBottom: 3 }}>{label}</div>
                    <div style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", color: "#1C0A00", lineHeight: 1.35 }}>{value}</div>
                  </div>
                ))}
              </div>
              <div className="px-6 pb-5">
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "#5C4A32", opacity: 0.55, lineHeight: 1.6, fontStyle: "italic" }}>
                  "The original evidence is securely stored. Its digital fingerprint helps establish the integrity of the submitted record."
                </p>
              </div>
            </section>

            {/* ── VERIFIED TIMELINE (hero section) ── */}
            <section className="border overflow-hidden" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#FAF7F2" }}>
              <div className="px-6 py-5 border-b flex items-center justify-between" style={{ borderColor: "#C8B89A" }}>
                <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "1.25rem", color: "#1C0A00" }}>Verified Complaint Timeline</h2>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.4 }}>4 of 6 stages complete</span>
              </div>

              <div className="px-6 py-6">
                <div className="relative">
                  {/* Track */}
                  <div className="absolute" style={{ left: 11, top: 14, bottom: 14, width: 1, background: "linear-gradient(to bottom, #4A7C5F 58%, #C8B89A 58%)", opacity: 0.45 }}/>

                  <div className="space-y-0">
                    {timelineEvents.map((ev, i) => {
                      const cfg = STATUS_CONFIG[ev.status] || STATUS_CONFIG["REPORTED"];
                      const isLast = i === timelineEvents.length - 1;
                      return (
                        <div key={ev.status} className="flex gap-5" style={{ paddingBottom: isLast ? 0 : 30 }}>
                          {/* Node */}
                          <div className="flex-shrink-0 relative z-10 mt-0.5">
                            {ev.done ? (
                              <div style={{
                                width: 22, height: 22, borderRadius: "50%",
                                background: ev.current ? "#1C0A00" : "#4A7C5F",
                                border: `2px solid ${ev.current ? "#1C0A00" : "#4A7C5F"}`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                boxShadow: ev.current ? "0 0 0 3px #F5F0E8, 0 0 0 5px #1C0A00" : "none",
                              }}>
                                {ev.current
                                  ? <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#F5F0E8" }}/>
                                  : <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5 L4 7 L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                }
                              </div>
                            ) : (
                              <div style={{
                                width: 22, height: 22, borderRadius: "50%",
                                background: "#FAF7F2", border: "1.5px dashed #C8B89A",
                                display: "flex", alignItems: "center", justifyContent: "center",
                              }}>
                                <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#C8B89A", opacity: 0.4 }}/>
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 pt-0.5">
                            <div className="flex items-center flex-wrap gap-2 mb-1">
                              <span style={{
                                fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase",
                                color: ev.done ? (ev.current ? "#1C0A00" : cfg.color) : "#C8B89A",
                                fontWeight: ev.current ? 700 : 400,
                              }}>{ev.status}</span>
                              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.54rem", color: ev.done ? "#5C4A32" : "#C8B89A", opacity: 0.6 }}>{ev.date}</span>
                              {ev.done && !ev.current && (
                                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", color: "#4A7C5F", opacity: 0.65 }}>· ✓ Recorded</span>
                              )}
                            </div>
                            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.83rem", color: ev.done ? "#1C0A00" : "#C8B89A", lineHeight: 1.5, opacity: ev.done ? 0.72 : 0.45 }}>
                              {ev.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>

            {/* ── COMMUNITY SUPPORT ── */}
            <section className="border overflow-hidden" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#FAF7F2" }}>
              <div className="px-6 py-4 border-b" style={{ borderColor: "#C8B89A" }}>
                <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "1.1rem", color: "#1C0A00" }}>17 Citizens Reported This Issue</h2>
              </div>
              <div className="px-6 py-5 flex flex-col md:flex-row gap-6 items-start">
                {/* Large number */}
                <div className="border px-7 py-5 text-center flex-shrink-0" style={{ borderColor: "#C8B89A", background: "#F5F0E8", borderRadius: "1px" }}>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "3.5rem", color: "#1C0A00", lineHeight: 1 }}>17</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.4, marginTop: 4 }}>Supporting Reports</div>
                </div>
                <div className="flex-1">
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "0.88rem", color: "#1C0A00", lineHeight: 1.65, marginBottom: 14 }}>
                    Nearby reports identified by CivicTrace's AI spatial deduplication system were grouped into this civic record.
                  </p>
                  {/* Anonymous dot cluster */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-5">
                    {Array.from({ length: 17 }).map((_, i) => (
                      <div key={i} className="flex flex-col items-center gap-0.5">
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: i < 4 ? "#9B3A3A" : i < 9 ? "#C4622D" : "#3A6B9B", opacity: 0.55 + (i % 3) * 0.1 }}/>
                      </div>
                    ))}
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", color: "#5C4A32", opacity: 0.4, marginLeft: 4 }}>17 anonymous reports</span>
                  </div>
                  <button onClick={() => onNavigate("civic-map")} className="flex items-center gap-1.5 px-5 py-2 border hover:bg-[#EDE5D4] transition-colors"
                    style={{ borderColor: "#C8B89A", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.57rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#1C0A00" }}>
                    View Supporting Activity
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M2.5 2 L6.5 4.5 L2.5 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </div>
              </div>
            </section>

            {/* ── ACCOUNTABILITY STATUS ── */}
            <section className="border overflow-hidden" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#FAF7F2" }}>
              <div className="px-6 py-4 border-b" style={{ borderColor: "#C8B89A" }}>
                <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "1.1rem", color: "#1C0A00" }}>Accountability Status</h2>
              </div>
              <div className="px-6 py-2">
                {accountabilityRows.map(({ label, value, ok }, i, arr) => (
                  <div key={label} className="flex items-center justify-between py-3.5"
                    style={{ borderBottom: i < arr.length - 1 ? "1px solid #EDE5D4" : "none" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.56rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.45 }}>{label}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: ok ? "#4A7C5F" : "#B8872A" }}/>
                      <span style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", color: ok ? "#1C0A00" : "#B8872A" }}>{value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="space-y-5">

            {/* ── Civic Impact Score ── */}
            <div className="border overflow-hidden" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#FAF7F2" }}>
              <div className="h-0.5" style={{ background: "#C4622D" }}/>
              <div className="px-5 py-4 border-b" style={{ borderColor: "#C8B89A" }}>
                <h3 style={{ fontFamily: "var(--font-mono)", fontSize: "0.56rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.55 }}>Civic Impact Score</h3>
              </div>
              <div className="px-5 py-5">
                <div className="flex items-center gap-4 mb-5">
                  <svg width="68" height="68" viewBox="0 0 68 68">
                    <circle cx="34" cy="34" r="26" fill="none" stroke="#EDE5D4" strokeWidth="5"/>
                    <circle cx="34" cy="34" r="26" fill="none" stroke="#C4622D" strokeWidth="5"
                      strokeDasharray={`${2 * Math.PI * 26 * 0.87} ${2 * Math.PI * 26}`}
                      strokeDashoffset={2 * Math.PI * 26 * 0.25}
                      strokeLinecap="round"
                      style={{ transform: "rotate(-90deg)", transformOrigin: "34px 34px" }}/>
                    <text x="34" y="39" textAnchor="middle" fontFamily="var(--font-display)" fontSize="15" fontWeight="700" fill="#1C0A00">87</text>
                  </svg>
                  <div>
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "1.9rem", color: "#1C0A00", lineHeight: 1 }}>
                      87<span style={{ fontSize: "1rem", opacity: 0.3 }}> / 100</span>
                    </div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", color: "#5C4A32", opacity: 0.4, marginTop: 4 }}>High civic concern</div>
                  </div>
                </div>
                {[
                  { label: "Supporting Citizens", value: "17" },
                  { label: "Priority",            value: "Urgent" },
                  { label: "Time Unresolved",     value: "3 days" },
                  { label: "Affected Area",        value: "High" },
                  { label: "Escalation History",   value: "0" },
                ].map(({ label, value }, i, arr) => (
                  <div key={label} className="flex items-center justify-between py-2.5"
                    style={{ borderBottom: i < arr.length - 1 ? "1px solid #EDE5D4" : "none" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.07em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.4 }}>{label}</span>
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.92rem", color: "#1C0A00" }}>{value}</span>
                  </div>
                ))}
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", color: "#5C4A32", opacity: 0.45, lineHeight: 1.5, marginTop: 12, letterSpacing: "0.04em" }}>
                  The Civic Impact Score estimates how strongly an unresolved issue affects the community.
                </p>
                <button className="mt-3 hover:opacity-60 transition-opacity"
                  style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#3A6B9B" }}>
                  How is this calculated? →
                </button>
              </div>
            </div>

            {/* ── Blockchain Verification ── */}
            <div className="border overflow-hidden" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#EDE5D4" }}>
              <div className="px-5 py-4 border-b" style={{ borderColor: "#C8B89A" }}>
                <h3 style={{ fontFamily: "var(--font-mono)", fontSize: "0.56rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.55 }}>Blockchain-Backed Verification</h3>
              </div>
              <div className="px-5 py-4">
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", color: "#1C0A00", opacity: 0.7, lineHeight: 1.6, marginBottom: 14 }}>
                  Key events in this complaint lifecycle are recorded as verifiable blockchain-backed records.
                </p>
                <div className="space-y-2.5 mb-4">
                  {["Complaint creation", "Evidence fingerprint", "Status history"].map(item => (
                    <div key={item} className="flex items-center gap-2.5">
                      <div className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: "#4A7C5F" }}>
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4 L3.5 6 L6.5 2" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                      <span style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", color: "#1C0A00", opacity: 0.8 }}>{item}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => onNavigate("verification")} className="w-full py-2.5 flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity"
                  style={{ background: "#1C0A00", color: "#F5F0E8", borderRadius: "1px",
                    fontFamily: "var(--font-mono)", fontSize: "0.57rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  View Full Verification →
                </button>
              </div>
            </div>

            {/* ── Location map ── */}
            <div className="border overflow-hidden" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#FAF7F2" }}>
              <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: "#C8B89A" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.54rem", letterSpacing: "0.13em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.5 }}>Reported Location</span>
                <span style={{ fontFamily: "var(--font-body)", fontSize: "0.76rem", color: "#5C4A32" }}>Sector X, New Delhi</span>
              </div>
              <div style={{ background: "#E8E0D0", height: 150, position: "relative" }}>
                <svg width="100%" height="150" viewBox="0 0 400 150" preserveAspectRatio="xMidYMid slice">
                  <rect width="400" height="150" fill="#E8E0D0"/>
                  <line x1="0" y1="75" x2="400" y2="75" stroke="#D4C9B0" strokeWidth="18"/>
                  <line x1="200" y1="0" x2="200" y2="150" stroke="#D4C9B0" strokeWidth="14"/>
                  <line x1="0" y1="35" x2="400" y2="35" stroke="#D4C9B0" strokeWidth="7"/>
                  <line x1="0" y1="120" x2="400" y2="120" stroke="#D4C9B0" strokeWidth="7"/>
                  <line x1="100" y1="0" x2="100" y2="150" stroke="#D4C9B0" strokeWidth="7"/>
                  <line x1="300" y1="0" x2="300" y2="150" stroke="#D4C9B0" strokeWidth="7"/>
                  <line x1="0" y1="75" x2="400" y2="75" stroke="#C8B89A" strokeWidth="0.8" strokeDasharray="12 9"/>
                  <line x1="200" y1="0" x2="200" y2="150" stroke="#C8B89A" strokeWidth="0.8" strokeDasharray="12 9"/>
                  {[[110,42,80,25],[215,42,75,25],[110,88,80,24],[215,88,75,24]].map(([x,y,w,h],i) => (
                    <rect key={i} x={x} y={y} width={w} height={h} fill="#DAD1BE" stroke="#C8B89A" strokeWidth="0.5"/>
                  ))}
                  <circle cx="200" cy="75" r="14" fill="#9B3A3A" opacity="0.18"/>
                  <circle cx="200" cy="75" r="8" fill="#9B3A3A"/>
                  <circle cx="200" cy="75" r="3" fill="white"/>
                  <rect x="118" y="52" width="164" height="16" rx="1" fill="rgba(28,10,0,0.72)"/>
                  <text x="200" y="64" textAnchor="middle" fill="#F5F0E8" fontSize="8" fontFamily="monospace">Sector X · Major Pothole</text>
                </svg>
              </div>
              <div className="px-5 py-2.5 border-t flex items-center justify-between" style={{ borderColor: "#C8B89A" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", color: "#5C4A32", opacity: 0.5 }}>28.6139°N 77.2090°E</span>
                <button onClick={() => onNavigate("civic-map")}
                  className="hover:opacity-70 transition-opacity"
                  style={{ fontFamily: "var(--font-mono)", fontSize: "0.54rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#3A6B9B" }}>
                  View on Civic Map →
                </button>
              </div>
            </div>

            {/* ── Privacy notice ── */}
            <div className="border px-5 py-4 flex items-start gap-3" style={{ borderColor: "#C8B89A40", borderRadius: "2px", background: "#FAF7F2" }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 2, opacity: 0.35 }}>
                <path d="M7 1 L12 3.5 L12 7 C12 10 9.5 12.5 7 13.5 C4.5 12.5 2 10 2 7 L2 3.5 Z" stroke="#1C0A00" strokeWidth="1.1" fill="none"/>
                <circle cx="7" cy="7" r="1.5" fill="#1C0A00" opacity="0.5"/>
              </svg>
              <div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.54rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.5, marginBottom: 4 }}>
                  Citizen Privacy Protected
                </div>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "#5C4A32", opacity: 0.55, lineHeight: 1.55 }}>
                  Personal information about the reporting citizen is never displayed on this public record.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t flex flex-wrap items-center justify-between gap-3" style={{ borderColor: "#C8B89A" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "#5C4A32", opacity: 0.4 }}>
            © 2026 CivicTrace · This is a publicly verifiable civic record.
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#4A7C5F" }}/>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "#5C4A32", opacity: 0.4 }}>Open · On-chain · Verifiable</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PAGE 14 — Blockchain Verification ───────────────────────────────────────
function VerificationPage({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const [copied, setCopied] = useState(false);
  const [proofOpen, setProofOpen] = useState(false);
  const [expandedEvent, setExpandedEvent] = useState<number | null>(null);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const civic = useCivic();
  const live = useLiveVerification(civic.selectedId);
  const [chainStatus, setChainStatus] = useState<{ enabled: boolean; chainId: number | null; contract: string | null; explorer: string | null } | null>(null);
  useEffect(() => {
    getOnchainStatus().then(setChainStatus).catch(() => setChainStatus(null));
  }, []);
  // When arriving via "View Blockchain Proof", auto-expand the technical
  // proof so the blockchain verification is actually visible.
  const [autoExpand] = useState(civic.expandProof);
  useEffect(() => {
    if (civic.expandProof) {
      setProofOpen(true);
      civic.setExpandProof(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const networkLabel = chainStatus?.enabled
    ? chainStatus.chainId === 84532 ? "Base Sepolia (84532)" : chainStatus.chainId === 80002 ? "Polygon Amoy (80002)" : `Chain ID ${chainStatus.chainId}`
    : "Off-chain hashchain (Web3 anchoring off)";

  const mockEvents = [
    {
      n: "01", label: "Complaint Created",   date: "13 Sep 2026 · 14:32",
      desc: "Complaint submitted with original evidence.",
      ref: "0x7a3f…91c2", color: "#9B3A3A",
    },
    {
      n: "02", label: "Complaint Assessed",  date: "13 Sep 2026 · 15:10",
      desc: "Issue assessed by the responsible authority.",
      ref: "0x91d2…4ab7", color: "#C4622D",
    },
    {
      n: "03", label: "Complaint Assigned",  date: "13 Sep 2026 · 16:02",
      desc: "Complaint assigned to Roads Department.",
      ref: "0x42ef…8c11", color: "#5C4A32",
    },
    {
      n: "04", label: "Work Started",        date: "14 Sep 2026 · 09:20",
      desc: "Complaint moved to In Progress.",
      ref: "0x83bc…12fa", color: "#3A6B9B",
    },
  ];

  const events = live && live.events.length
    ? live.events.map((ev, i) => ({
        n: String(i + 1).padStart(2, "0"),
        label: `${ev.from_status || "—"} → ${ev.to_status}`,
        date: new Date(ev.created_at).toLocaleString(),
        desc: ev.note || ev.to_status,
        ref: `${ev.this_hash.slice(0, 6)}…${ev.this_hash.slice(-4)}`,
        color: ev.hash_ok && ev.link_ok ? "#4A7C5F" : "#9B3A3A",
        txHash: (ev as unknown as { tx_hash?: string | null }).tx_hash ?? null,
      }))
    : mockEvents;

  // Auto-expand the latest event's proof when arriving from "View Blockchain Proof".
  useEffect(() => {
    if (autoExpand && events.length) {
      setExpandedEvent(events.length - 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoExpand, live?.events?.length]);

  const recorded = [
    "Complaint creation",
    "Important status changes",
    "Evidence fingerprints",
    "Resolution event",
    "Reopen / dispute event",
    "Escalation event",
  ];

  const notRecorded = [
    "Citizen's personal information",
    "Full photographs",
    "Phone numbers",
    "Email addresses",
    "Private complaint details",
  ];

  return (
    <div style={{ background: "#F5F0E8", minHeight: "100vh", fontFamily: "var(--font-body)" }}>

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 border-b" style={{ background: "rgba(245,240,232,0.97)", borderColor: "#C8B89A", backdropFilter: "blur(8px)" }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <button onClick={() => onNavigate("home")} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <CivicTraceLogo size={30}/>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", color: "#1C0A00" }}>CivicTrace</span>
          </button>
          <div className="hidden md:flex items-center gap-6">
            <button onClick={() => onNavigate("civic-map")} className="hover:opacity-60 transition-opacity"
              style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5C4A32" }}>
              Civic Map
            </button>
            <button onClick={() => onNavigate("public-record")} className="hover:opacity-60 transition-opacity"
              style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5C4A32" }}>
              Public Record
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => onNavigate("auth")} className="px-3 py-2 border hover:bg-[#EDE5D4] transition-colors"
              style={{ borderColor: "#C8B89A", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.08em", color: "#5C4A32", textTransform: "uppercase" }}>
              Sign In
            </button>
            <button onClick={() => onNavigate("report-category")} className="px-4 py-2 hover:opacity-90 transition-opacity"
              style={{ background: "#1C0A00", color: "#F5F0E8", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Report an Issue
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* ── Breadcrumb ── */}
        <div className="flex items-center gap-1.5 mb-7" style={{ fontFamily: "var(--font-mono)", fontSize: "0.57rem", letterSpacing: "0.08em", color: "#5C4A32" }}>
          <button onClick={() => onNavigate("civic-map")} className="hover:opacity-70 transition-opacity opacity-45">Public Civic Map</button>
          <span className="opacity-30">›</span>
          <button onClick={() => onNavigate("public-record")} className="hover:opacity-70 transition-opacity opacity-45">Public Record</button>
          <span className="opacity-30">›</span>
          <span style={{ color: "#1C0A00" }}>Verification</span>
        </div>

        {/* ── Page header ── */}
        <div className="mb-9">
          <div className="flex items-center gap-4 mb-5">
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.4 }}>
              Blockchain-Backed Civic Verification
            </div>
            <div className="h-px flex-1" style={{ background: "#C8B89A", opacity: 0.4 }}/>
            {/* Verifiable badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 border" style={{ borderColor: "#4A7C5F50", background: "#EEF4F0", borderRadius: "1px" }}>
              <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                <path d="M1.5 4.5 L3.5 6.5 L7.5 2.5" stroke="#4A7C5F" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.1em", color: "#4A7C5F" }}>VERIFIABLE RECORD</span>
            </div>
          </div>

          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "clamp(2rem, 4vw, 2.8rem)", color: "#1C0A00", lineHeight: 1.05, marginBottom: 10 }}>
            Verify This Civic Record
          </h1>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.93rem", color: "#5C4A32", opacity: 0.65, lineHeight: 1.65, maxWidth: 560, marginBottom: 20 }}>
            An independently verifiable history of the important events recorded for this complaint.
          </p>

          {/* Complaint identity strip */}
          <div className="flex flex-wrap items-stretch border overflow-hidden" style={{ borderColor: "#C8B89A", borderRadius: "2px", display: "inline-flex" }}>
            {[
              { label: "Complaint", value: `#${live?.complaint?.tracking_code || civic.selectedCode || "CTY-48291-X"}`, mono: true, accent: "#3A6B9B" },
              { label: "Issue",     value: live?.complaint ? (live.complaint.description || CATEGORY_LABELS[live.complaint.category] || live.complaint.category) : "Major Pothole", mono: false, accent: "#1C0A00" },
              { label: "Status",    value: live?.complaint ? (STATUS_UI[live.complaint.status] ?? live.complaint.status) : "IN PROGRESS",   mono: true,  accent: "#3A6B9B" },
            ].map(({ label, value, mono, accent }, i) => (
              <div key={label} className="px-6 py-3 border-r last:border-r-0" style={{ background: "#FAF7F2", borderColor: "#C8B89A" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.48rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.4, marginBottom: 3 }}>{label}</div>
                <div style={{ fontFamily: mono ? "var(--font-mono)" : "var(--font-display)", fontWeight: mono ? 700 : 700, fontStyle: mono ? "normal" : "italic", fontSize: mono ? "0.65rem" : "0.95rem", color: accent, letterSpacing: mono ? "0.08em" : 0 }}>{value}</div>
              </div>
            ))}
          </div>
          {live && (
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.1em", textTransform: "uppercase", color: live.valid ? "#4A7C5F" : "#9B3A3A", marginTop: 12 }}>
              Chain valid: {live.valid ? "YES" : "NO"} · {live.events.length} event{live.events.length === 1 ? "" : "s"}
              {live.onchain?.enabled && live.onchain?.txUrl ? (
                <> · <a href={live.onchain.txUrl} target="_blank" rel="noreferrer" style={{ color: "#3A6B9B", textDecoration: "underline" }}>Anchored on-chain: {live.onchain.anchorTx?.slice(0, 6)}…{live.onchain.anchorTx?.slice(-4)} ↗</a></>
              ) : null}
            </div>
          )}
        </div>

        {/* ── Decorative rule ── */}
        <div className="flex items-center gap-4 mb-9">
          <div className="flex-1 h-px" style={{ background: "#C8B89A" }}/>
          <div className="w-1.5 h-1.5 rotate-45" style={{ background: "#C8B89A" }}/>
          <div className="flex-1 h-px" style={{ background: "#C8B89A" }}/>
        </div>

        {/* ── VERIFICATION SUMMARY CARD ── */}
        <div className="border mb-8 overflow-hidden" style={{ borderColor: "#4A7C5F60", borderRadius: "2px", background: "#FAF7F2" }}>
          <div className="h-1" style={{ background: "linear-gradient(to right, #4A7C5F, #3A6B9B)" }}/>
          <div className="px-8 py-7 flex flex-col md:flex-row gap-8 items-center md:items-start">
            {/* Status symbol */}
            <div className="flex flex-col items-center gap-2 flex-shrink-0">
              <div className="relative">
                <svg width="88" height="88" viewBox="0 0 88 88">
                  <circle cx="44" cy="44" r="40" fill="#EEF4F0" stroke="#4A7C5F" strokeWidth="1.5"/>
                  {/* Seal ring */}
                  <circle cx="44" cy="44" r="34" fill="none" stroke="#4A7C5F" strokeWidth="0.5" strokeDasharray="3 3"/>
                  {/* Big tick */}
                  <path d="M24 44 L37 57 L64 30" stroke="#4A7C5F" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: live ? (live.valid ? "#4A7C5F" : "#9B3A3A") : "#4A7C5F", fontWeight: 700 }}>{live ? (live.valid ? "VERIFIED" : "CHAIN BROKEN") : "VERIFIED"}</div>
            </div>

            <div className="flex-1">
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.45, marginBottom: 6 }}>Record Status</div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "1.4rem", color: "#4A7C5F", lineHeight: 1.1, marginBottom: 8 }}>
                Key complaint events have been recorded and can be independently verified.
              </div>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.84rem", color: "#5C4A32", opacity: 0.65, lineHeight: 1.6 }}>
                Important lifecycle milestones for complaint {live?.complaint?.tracking_code || civic.selectedCode || "CTY-48291-X"} are stored in a tamper-resistant record. Anyone can independently confirm that these events occurred as stated.
              </p>
            </div>

            {/* Stats */}
            <div className="flex md:flex-col gap-0 border overflow-hidden flex-shrink-0" style={{ borderColor: "#C8B89A", borderRadius: "1px" }}>
              {[
                { label: "Events Recorded",    value: String(events.length || 4) },
                { label: "Evidence Records",   value: "1" },
                { label: "Verification Status",value: live ? (live.valid ? "VALID" : "BROKEN") : "VALID" },
              ].map(({ label, value }, i, arr) => (
                <div key={label} className="px-5 py-3 text-center border-b last:border-b-0" style={{ borderColor: "#C8B89A", background: i === 2 ? "#EEF4F0" : "#FAF7F2" }}>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: i === 2 ? "0.75rem" : "1.8rem", color: i === 2 ? "#4A7C5F" : "#1C0A00", lineHeight: 1, letterSpacing: i === 2 ? "0.05em" : 0 }}>{value}</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.48rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.4, marginTop: 3 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── MAIN GRID: timeline + sidebar ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-7">

          {/* LEFT */}
          <div className="space-y-7">

            {/* ── VERIFIED EVENT HISTORY ── */}
            <section className="border overflow-hidden" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#FAF7F2" }}>
              <div className="px-6 py-5 border-b flex items-center justify-between" style={{ borderColor: "#C8B89A" }}>
                <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "1.2rem", color: "#1C0A00" }}>Verified Event History</h2>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.4 }}>{events.length || 4} recorded events</span>
              </div>

              <div className="px-6 py-6">
                <div className="relative">
                  {/* Vertical connector track */}
                  <div className="absolute" style={{ left: 19, top: 20, bottom: 20, width: 1, background: "linear-gradient(to bottom, #4A7C5F, #3A6B9B)", opacity: 0.25 }}/>

                  <div className="space-y-0">
                    {events.map((ev, i) => {
                      const isLast = i === events.length - 1;
                      const isExpanded = expandedEvent === i;
                      return (
                        <div key={ev.n} style={{ paddingBottom: isLast ? 0 : 32 }}>
                          <div className="flex gap-5">
                            {/* Node */}
                            <div className="flex-shrink-0 relative z-10">
                              <div style={{
                                width: 38, height: 38, borderRadius: "50%",
                                background: "#FAF7F2", border: `1.5px solid ${ev.color}`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                boxShadow: `0 0 0 4px ${ev.color}10`,
                              }}>
                                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", fontWeight: 700, color: ev.color }}>{ev.n}</span>
                              </div>
                              {/* Connector dot */}
                              {!isLast && (
                                <div className="absolute" style={{ left: "50%", transform: "translateX(-50%)", top: 42, width: 1, height: 24, background: ev.color, opacity: 0.2 }}/>
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0 pt-1.5">
                              <div className="flex items-start justify-between gap-3 mb-1">
                                <div>
                                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", letterSpacing: "0.12em", textTransform: "uppercase", color: ev.color, fontWeight: 700 }}>
                                    {ev.label}
                                  </div>
                                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "#5C4A32", opacity: 0.55, marginTop: 2 }}>{ev.date}</div>
                                </div>
                                {/* Recorded badge */}
                                <div className="flex items-center gap-1.5 flex-shrink-0 px-2 py-1 border" style={{ borderColor: "#4A7C5F40", background: "#EEF4F0", borderRadius: "1px" }}>
                                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                                    <path d="M1.5 4 L3.5 6 L6.5 2" stroke="#4A7C5F" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.08em", color: "#4A7C5F" }}>Recorded</span>
                                </div>
                              </div>

                              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.84rem", color: "#1C0A00", opacity: 0.7, lineHeight: 1.55, marginBottom: 10 }}>
                                {ev.desc}
                              </p>

                              {/* Reference + view proof */}
                              <div className="flex items-center gap-3 flex-wrap">
                                <div className="flex items-center gap-2 px-3 py-1.5 border" style={{ borderColor: "#C8B89A", background: "#EDE5D4", borderRadius: "1px" }}>
                                  {/* Chain link icon */}
                                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ opacity: 0.5 }}>
                                    <path d="M3.5 6.5 C2.5 7.5 2.5 9 3.5 9 L4.5 9 C5.5 9 6 8 5.5 7 M6.5 3.5 C7.5 2.5 7.5 1 6.5 1 L5.5 1 C4.5 1 4 2 4.5 3" stroke="#5C4A32" strokeWidth="1" strokeLinecap="round"/>
                                    <line x1="4.5" y1="5.5" x2="5.5" y2="4.5" stroke="#5C4A32" strokeWidth="1" strokeLinecap="round"/>
                                  </svg>
                                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", color: "#3A6B9B", letterSpacing: "0.05em" }}>{ev.ref}</span>
                                </div>
                                {(ev as { txHash?: string | null }).txHash && chainStatus?.explorer ? (
                                  <a href={`${chainStatus.explorer}/tx/${(ev as { txHash?: string | null }).txHash}`} target="_blank" rel="noreferrer"
                                    style={{ fontFamily: "var(--font-mono)", fontSize: "0.56rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#4A7C5F", textDecoration: "underline" }}>
                                    View tx ↗
                                  </a>
                                ) : null}
                                <button onClick={() => setExpandedEvent(isExpanded ? null : i)}
                                  className="hover:opacity-70 transition-opacity"
                                  style={{ fontFamily: "var(--font-mono)", fontSize: "0.56rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.55 }}>
                                  {isExpanded ? "Hide Proof ▲" : "View Proof ▼"}
                                </button>
                              </div>

                              {/* Expanded proof */}
                              {isExpanded && (
                                <div className="mt-3 p-4 border" style={{ borderColor: "#C8B89A", background: "#EDE5D4", borderRadius: "1px" }}>
                                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.5, marginBottom: 8 }}>
                                    Proof Details
                                  </div>
                                  <div className="space-y-2">
                                    {[
                                      { k: "Event",      v: ev.label },
                                      { k: "Timestamp",  v: ev.date },
                                      { k: "Reference",  v: ev.ref },
                                      { k: "Record ID",  v: live?.complaint?.tracking_code || civic.selectedCode || "CTY-48291-X" },
                                    ].map(({ k, v }) => (
                                      <div key={k} className="flex gap-4">
                                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.54rem", letterSpacing: "0.06em", color: "#5C4A32", opacity: 0.45, minWidth: 80 }}>{k}</span>
                                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", color: "#1C0A00" }}>{v}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>

            {/* ── EVIDENCE INTEGRITY ── */}
            <section className="border overflow-hidden" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#FAF7F2" }}>
              <div className="px-6 py-4 border-b" style={{ borderColor: "#C8B89A" }}>
                <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "1.1rem", color: "#1C0A00" }}>Evidence Integrity</h2>
              </div>
              <div className="px-6 py-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left — metadata */}
                  <div className="space-y-0">
                    {[
                      { label: "Type",     value: "Citizen-submitted photograph" },
                      { label: "Captured", value: live?.complaint ? new Date(live.complaint.created_at).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" }) : "13 Sep 2026 · 14:32" },
                      { label: "Location", value: live?.complaint ? `${live.complaint.lat.toFixed(4)}°N ${live.complaint.lng.toFixed(4)}°E` : "Sector X, New Delhi" },
                    ].map(({ label, value }, i, arr) => (
                      <div key={label} className="flex justify-between items-start gap-4 py-3"
                        style={{ borderBottom: i < arr.length - 1 ? "1px solid #EDE5D4" : "none" }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.4, flexShrink: 0 }}>{label}</span>
                        <span style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", color: "#1C0A00", textAlign: "right" }}>{value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Right — fingerprint */}
                  <div className="border px-5 py-4" style={{ borderColor: "#C8B89A", background: "#EDE5D4", borderRadius: "1px" }}>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.5, marginBottom: 10 }}>
                      Digital Fingerprint
                    </div>
                    <div className="mb-2">
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", color: "#5C4A32", opacity: 0.4, marginBottom: 4 }}>sha256:</div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "#3A6B9B", letterSpacing: "0.03em", wordBreak: "break-all" }}>
                        7f4c9a2b…e831a921
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-4">
                      <div className="w-3 h-3 rounded-full flex items-center justify-center" style={{ background: "#4A7C5F" }}>
                        <svg width="7" height="7" viewBox="0 0 7 7" fill="none"><path d="M1.2 3.5 L3 5 L5.8 2" stroke="white" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.56rem", letterSpacing: "0.08em", color: "#4A7C5F" }}>Fingerprint recorded</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-5 border-t flex items-start gap-3" style={{ borderColor: "#EDE5D4" }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 2, opacity: 0.35 }}>
                    <circle cx="7" cy="7" r="6" stroke="#1C0A00" strokeWidth="1"/>
                    <path d="M7 5 L7 7.5 M7 9 L7 9.5" stroke="#1C0A00" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", color: "#5C4A32", opacity: 0.6, lineHeight: 1.6, fontStyle: "italic" }}>
                    "The full photograph remains securely stored off-chain. Only its digital fingerprint is used for verification."
                  </p>
                </div>
              </div>
            </section>

            {/* ── WHAT IS STORED ON-CHAIN ── */}
            <section className="border overflow-hidden" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#FAF7F2" }}>
              <div className="px-6 py-4 border-b" style={{ borderColor: "#C8B89A" }}>
                <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "1.1rem", color: "#1C0A00" }}>What's Recorded On-Chain?</h2>
              </div>
              <div className="px-6 py-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Recorded */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-2 h-2 rounded-full" style={{ background: "#4A7C5F" }}/>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.56rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#4A7C5F" }}>Recorded</span>
                    </div>
                    <div className="space-y-2.5">
                      {recorded.map(item => (
                        <div key={item} className="flex items-center gap-2.5">
                          <div className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: "#EEF4F0", border: "1px solid #4A7C5F50" }}>
                            <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4 L3.5 6 L6.5 2" stroke="#4A7C5F" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </div>
                          <span style={{ fontFamily: "var(--font-body)", fontSize: "0.83rem", color: "#1C0A00", opacity: 0.8 }}>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Not recorded */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-2 h-2 rounded-full" style={{ background: "#9B3A3A" }}/>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.56rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#9B3A3A" }}>Not Recorded</span>
                    </div>
                    <div className="space-y-2.5">
                      {notRecorded.map(item => (
                        <div key={item} className="flex items-center gap-2.5">
                          <div className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: "#F8EEEE", border: "1px solid #9B3A3A30" }}>
                            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                              <path d="M2.5 2.5 L5.5 5.5 M5.5 2.5 L2.5 5.5" stroke="#9B3A3A" strokeWidth="1.2" strokeLinecap="round"/>
                            </svg>
                          </div>
                          <span style={{ fontFamily: "var(--font-body)", fontSize: "0.83rem", color: "#1C0A00", opacity: 0.55 }}>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Explanation callout */}
                <div className="border-l-2 pl-4 py-1" style={{ borderColor: "#3A6B9B" }}>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "#1C0A00", opacity: 0.7, lineHeight: 1.65, fontStyle: "italic" }}>
                    "CivicTrace uses blockchain as a trust layer — not as a storage system for private information."
                  </p>
                </div>
              </div>
            </section>

            {/* ── TECHNICAL PROOF DETAILS (collapsible) ── */}
            <section className="border overflow-hidden" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#FAF7F2" }}>
              <button className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#EDE5D4] transition-colors"
                onClick={() => setProofOpen(o => !o)}>
                <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "1.05rem", color: "#1C0A00" }}>Technical Proof Details</h2>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ transform: proofOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s ease", opacity: 0.4 }}>
                  <path d="M3 5 L7 9 L11 5" stroke="#1C0A00" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {proofOpen && (
                <div className="px-6 pb-5 border-t" style={{ borderColor: "#C8B89A" }}>
                  <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { label: "Complaint ID",     value: live?.complaint?.tracking_code ?? "CTY-48291-X" },
                      { label: "Evidence Hash",    value: live?.events?.length ? `${live.events[live.events.length - 1].this_hash.slice(0, 6)}…${live.events[live.events.length - 1].this_hash.slice(-4)}` : "7f4c…a921" },
                      { label: "Previous Event",   value: live?.events?.length ? `${live.events[live.events.length - 1].prev_hash.slice(0, 6)}…${live.events[live.events.length - 1].prev_hash.slice(-4)}` : "0x91d2…4ab7" },
                      { label: "Current Event",    value: live?.events?.length ? `${live.events[live.events.length - 1].this_hash.slice(0, 6)}…${live.events[live.events.length - 1].this_hash.slice(-4)}` : "0x83bc…12fa" },
                      { label: "Timestamp",        value: live?.events?.length ? new Date(live.events[live.events.length - 1].created_at).toLocaleString() : "13 Sep 2026 · 14:32" },
                      { label: "Network",          value: networkLabel },
                      { label: "Contract",         value: chainStatus?.contract ? `${chainStatus.contract.slice(0, 6)}…${chainStatus.contract.slice(-4)}` : "not deployed yet" },
                      { label: "Anchor Tx",        value: live?.onchain?.anchorTx ? `${live.onchain.anchorTx.slice(0, 6)}…${live.onchain.anchorTx.slice(-4)}` : "pending / off" },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex gap-4 items-start py-2 border-b" style={{ borderColor: "#EDE5D4" }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.4, flexShrink: 0, minWidth: 110 }}>{label}</span>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "#3A6B9B", wordBreak: "break-all" }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="space-y-5">

            {/* ── Independent Verification card ── */}
            <div className="border overflow-hidden" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#FAF7F2" }}>
              <div className="h-0.5" style={{ background: chainStatus?.enabled ? "#4A7C5F" : "#B8872A" }}/>
              <div className="px-5 py-4 border-b" style={{ borderColor: "#C8B89A" }}>
                <h3 style={{ fontFamily: "var(--font-mono)", fontSize: "0.56rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.55 }}>Independent Verification · Web3</h3>
              </div>
              <div className="px-5 py-2" style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.06em", color: chainStatus?.enabled ? "#4A7C5F" : "#B8872A" }}>
                {chainStatus == null ? "Checking on-chain status…" : chainStatus.enabled ? `● ANCHORED · ${networkLabel}` : "○ OFF-CHAIN ONLY · anchoring disabled"}
              </div>
              <div className="px-5 py-4 space-y-0">
                {[
                  { label: "Network",            value: networkLabel },
                  { label: "Record ID",          value: live?.complaint?.tracking_code ?? "CTY-48291-X" },
                  { label: "Contract / Registry",value: chainStatus?.contract ?? "not deployed yet" },
                  { label: "Record State",       value: live ? (live.valid ? "Valid" : "CHAIN BROKEN") : "Valid (demo)" },
                  { label: "On-chain match",     value: live?.onchain?.enabled ? (live.onchain.match ? "MATCH ✓" : live.onchain.error ?? "MISMATCH / PENDING") : "n/a (off)" },
                ].map(({ label, value }, i, arr) => (
                  <div key={label} className="flex flex-col gap-0.5 py-3"
                    style={{ borderBottom: i < arr.length - 1 ? "1px solid #EDE5D4" : "none" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.4 }}>{label}</span>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", color: label === "Record State" ? "#4A7C5F" : "#1C0A00", wordBreak: "break-all" }}>{value}</span>
                  </div>
                ))}
              </div>
              <div className="px-5 pb-5 space-y-2.5">
                <button onClick={handleCopy}
                  className="w-full py-2.5 border flex items-center justify-center gap-2 hover:bg-[#EDE5D4] transition-colors"
                  style={{ borderColor: "#C8B89A", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#1C0A00" }}>
                  {copied ? (
                    <><svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M1.5 5.5 L4.5 8.5 L9.5 2.5" stroke="#4A7C5F" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> Copied!</>
                  ) : (
                    <><svg width="11" height="11" viewBox="0 0 11 11" fill="none"><rect x="1" y="3" width="7" height="7" rx="0.5" stroke="#1C0A00" strokeWidth="1"/><path d="M3 3 L3 1.5 L9.5 1.5 L9.5 8 L8 8" stroke="#1C0A00" strokeWidth="1"/></svg> Copy Record ID</>
                  )}
                </button>
                {live?.onchain?.txUrl ? (
                  <a href={live.onchain.txUrl} target="_blank" rel="noreferrer"
                    className="w-full py-2.5 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                    style={{ background: "#4A7C5F", color: "#F5F0E8", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    View anchor tx ↗
                  </a>
                ) : null}
                {chainStatus?.explorer && chainStatus?.contract ? (
                  <a href={`${chainStatus.explorer}/address/${chainStatus.contract}`} target="_blank" rel="noreferrer"
                    className="w-full py-2.5 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity border"
                    style={{ borderColor: "#1C0A00", color: "#1C0A00", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    View contract ↗
                  </a>
                ) : (
                  <button className="w-full py-2.5 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                    style={{ background: "#1C0A00", color: "#F5F0E8", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M5 1 L9 5 L5 9 M9 5 L1 5" stroke="#F5F0E8" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Demo Explorer ↗
                  </button>
                )}
              </div>
            </div>

            {/* ── Civic Record Identity (dynamic badge) ── */}
            <div className="border overflow-hidden" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#EDE5D4" }}>
              <div className="px-5 py-4 border-b" style={{ borderColor: "#C8B89A" }}>
                <h3 style={{ fontFamily: "var(--font-mono)", fontSize: "0.56rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.55 }}>Civic Record Identity</h3>
              </div>
              <div className="px-5 py-5 flex flex-col items-center text-center">
                {/* Badge illustration */}
                <div className="relative mb-4">
                  <svg width="110" height="110" viewBox="0 0 110 110">
                    {/* Outer octagon frame */}
                    <path d="M55 5 L95 25 L105 65 L85 100 L55 108 L25 100 L5 65 L15 25 Z"
                      fill="#FAF7F2" stroke="#C8B89A" strokeWidth="1.5"/>
                    {/* Inner ring */}
                    <path d="M55 15 L88 31 L96 62 L79 92 L55 99 L31 92 L14 62 L22 31 Z"
                      fill="none" stroke="#3A6B9B" strokeWidth="0.8" opacity="0.4"/>
                    {/* Status colour fill */}
                    <circle cx="55" cy="56" r="26" fill="#3A6B9B" opacity="0.12"/>
                    <circle cx="55" cy="56" r="20" fill="#3A6B9B" opacity="0.18"/>
                    {/* Status dot */}
                    <circle cx="55" cy="56" r="10" fill="#3A6B9B"/>
                    <circle cx="55" cy="56" r="4" fill="white" opacity="0.9"/>
                    {/* ID text */}
                    <text x="55" y="24" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="6.5" fill="#1C0A00" opacity="0.5" letterSpacing="1">CTY-48291-X</text>
                    {/* Status label bottom arc (approximated as text) */}
                    <text x="55" y="88" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="7.5" fill="#3A6B9B" fontWeight="700" letterSpacing="1.5">IN PROGRESS</text>
                  </svg>
                  {/* Verified tick overlay */}
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center border-2 border-[#EDE5D4]" style={{ background: "#4A7C5F" }}>
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2 5.5 L4.5 8 L9 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                </div>

                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.54rem", letterSpacing: "0.06em", color: "#5C4A32", opacity: 0.55, lineHeight: 1.55, maxWidth: 210 }}>
                  This visual identity changes as the verified complaint lifecycle changes.
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.35, marginTop: 8 }}>
                  Dynamic on-chain complaint identity
                </div>
              </div>
            </div>

            {/* ── Navigation actions ── */}
            <div className="space-y-2.5">
              <button onClick={() => onNavigate("public-record")}
                className="w-full py-3 border flex items-center justify-center gap-2 hover:bg-[#EDE5D4] transition-colors"
                style={{ borderColor: "#C8B89A", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#1C0A00" }}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M7 2 L3 5 L7 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Back to Public Record
              </button>
              <button onClick={() => onNavigate("civic-map")}
                className="w-full py-3 border hover:bg-[#EDE5D4] transition-colors"
                style={{ borderColor: "#C8B89A", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#5C4A32" }}>
                View Civic Map
              </button>
              <button className="w-full py-3 border flex items-center justify-center gap-2 hover:bg-[#EDE5D4] transition-colors"
                style={{ borderColor: "#C8B89A", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#5C4A32" }}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 5 L5 1 L9 5 M5 1 L5 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Share Verification Record
              </button>
            </div>
          </div>
        </div>

        {/* ── Editorial statement ── */}
        <div className="mt-12 border" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#1C0A00", overflow: "hidden" }}>
          <div className="px-10 py-10 text-center">
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.54rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#C8B89A", opacity: 0.4, marginBottom: 16 }}>
              The CivicTrace Principle
            </div>
            <blockquote style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "clamp(1.4rem, 3vw, 2rem)", color: "#F5F0E8", lineHeight: 1.3, marginBottom: 16, maxWidth: 600, margin: "0 auto 16px" }}>
              "A complaint can be ignored.<br/>A verified record cannot."
            </blockquote>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.88rem", color: "#C8B89A", opacity: 0.6, lineHeight: 1.65, maxWidth: 520, margin: "0 auto" }}>
              CivicTrace preserves the history of what was reported, what happened next, and whether the issue was actually resolved.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 pt-6 border-t flex flex-wrap items-center justify-between gap-3" style={{ borderColor: "#C8B89A" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "#5C4A32", opacity: 0.4 }}>
            © 2026 CivicTrace · Verification records are publicly accessible and independently verifiable.
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#4A7C5F" }}/>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "#5C4A32", opacity: 0.4 }}>Open · On-chain · Verifiable</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Leaderboard data ─────────────────────────────────────────────────────────
interface Department {
  rank: number; name: string; resolved: number;
  resolutionRate: number; avgDays: number;
  reopenRate: number; evidenceCompliance: number; trust: number;
  icon: React.ReactNode;
}

// ─── PAGE 15 — Department Leaderboard ────────────────────────────────────────
function LeaderboardPage({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const [period, setPeriod] = useState("Last 30 days");
  const [sortBy, setSortBy] = useState<"trust" | "rate" | "time" | "reopen">("trust");
  const [selected, setSelected] = useState<number | null>(null);

  const liveL = useLiveLeaderboard();

  const mockDepts: Department[] = [
    { rank: 1, name: "Roads & Infrastructure", resolved: 312, resolutionRate: 91, avgDays: 3.1, reopenRate: 6,  evidenceCompliance: 98, trust: 91,
      icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="1" y="8" width="16" height="3" fill="none" stroke="currentColor" strokeWidth="1.2"/><rect x="3" y="5" width="2" height="8" fill="currentColor" opacity="0.4"/><rect x="13" y="5" width="2" height="8" fill="currentColor" opacity="0.4"/><line x1="8" y1="1" x2="8" y2="17" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 2" opacity="0.5"/></svg> },
    { rank: 2, name: "Water & Drainage",        resolved: 248, resolutionRate: 87, avgDays: 4.0, reopenRate: 8,  evidenceCompliance: 94, trust: 88,
      icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2 C9 2 4 8 4 12 C4 15 6.5 17 9 17 C11.5 17 14 15 14 12 C14 8 9 2 9 2Z" stroke="currentColor" strokeWidth="1.2" fill="none"/><path d="M6.5 13 C7 14.5 8 15 9.5 15" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5"/></svg> },
    { rank: 3, name: "Sanitation",              resolved: 421, resolutionRate: 85, avgDays: 4.3, reopenRate: 9,  evidenceCompliance: 92, trust: 86,
      icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="5" y="5" width="8" height="10" rx="1" stroke="currentColor" strokeWidth="1.2"/><path d="M7 5 L7 3.5 C7 3 7.5 3 9 3 C10.5 3 11 3 11 3.5 L11 5" stroke="currentColor" strokeWidth="1"/><line x1="7" y1="8" x2="11" y2="8" stroke="currentColor" strokeWidth="0.8" opacity="0.5"/><line x1="7" y1="10.5" x2="11" y2="10.5" stroke="currentColor" strokeWidth="0.8" opacity="0.5"/></svg> },
    { rank: 4, name: "Public Safety",           resolved: 156, resolutionRate: 82, avgDays: 3.8, reopenRate: 11, evidenceCompliance: 95, trust: 84,
      icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 1.5 L15.5 4.5 L15.5 9 C15.5 13 12.5 16 9 17 C5.5 16 2.5 13 2.5 9 L2.5 4.5 Z" stroke="currentColor" strokeWidth="1.2" fill="none"/><path d="M6.5 9 L8.5 11 L11.5 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/></svg> },
    { rank: 5, name: "Parks & Public Spaces",   resolved: 193, resolutionRate: 79, avgDays: 5.1, reopenRate: 12, evidenceCompliance: 89, trust: 81,
      icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2 C6 2 4 5 5 8 L9 8 L13 8 C14 5 12 2 9 2Z" stroke="currentColor" strokeWidth="1.2" fill="none"/><line x1="9" y1="8" x2="9" y2="16" stroke="currentColor" strokeWidth="1.2"/><path d="M6 12 C7 11 11 11 12 12" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" opacity="0.5"/></svg> },
    { rank: 6, name: "Environment",             resolved: 117, resolutionRate: 76, avgDays: 5.8, reopenRate: 14, evidenceCompliance: 87, trust: 78,
      icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.2"/><path d="M9 2 C9 2 13 6 9 9 C5 12 9 16 9 16" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" opacity="0.5"/><line x1="2" y1="9" x2="16" y2="9" stroke="currentColor" strokeWidth="0.8" opacity="0.4"/></svg> },
  ];

  const liveDepts: Department[] | null = liveL.data && liveL.data.length
    ? liveL.data.map((row, i) => {
        const total = row.total_complaints;
        const resolved = row.resolved_count;
        const resolutionRate = total ? Math.round(resolved / total * 100) : 0;
        const avgDays = row.avg_resolution_hours == null ? 0 : Math.round(row.avg_resolution_hours / 24 * 10) / 10;
        const reopenRate = total ? Math.round(row.reopened_count / total * 100) : 0;
        return {
          rank: row.rank,
          name: row.department_name,
          resolved,
          resolutionRate,
          avgDays,
          reopenRate,
          evidenceCompliance: 100,
          trust: Math.max(1, Math.min(99, resolutionRate - reopenRate * 2 + Math.min(10, total))),
          icon: mockDepts[i % mockDepts.length].icon,
        };
      })
    : null;
  const depts: Department[] = liveDepts ?? mockDepts;

  const sorted = [...depts].sort((a, b) => {
    if (sortBy === "rate")   return b.resolutionRate - a.resolutionRate;
    if (sortBy === "time")   return a.avgDays - b.avgDays;
    if (sortBy === "reopen") return a.reopenRate - b.reopenRate;
    return b.trust - a.trust;
  });

  const periods = ["Last 30 days", "Last 90 days", "This year"];
  const sortOptions: { key: typeof sortBy; label: string }[] = [
    { key: "trust",  label: "Trust Score" },
    { key: "rate",   label: "Resolution Rate" },
    { key: "time",   label: "Resolution Time" },
    { key: "reopen", label: "Reopened Rate" },
  ];

  const medals = ["#C8A840", "#9AACB8", "#C4622D"];

  const highlights = [
    { label: "Fastest Response",          value: "3.1 days", dept: "Roads & Infrastructure",
      icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.2"/><path d="M10 5 L10 10 L13.5 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> },
    { label: "Highest Resolution Rate",   value: "91%",      dept: "Roads & Infrastructure",
      icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 14 L7 9 L11 12 L17 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 5 L17 5 L17 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg> },
    { label: "Lowest Reopen Rate",        value: "6%",       dept: "Roads & Infrastructure",
      icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 10 C5 7 7.5 5 10 5 C12.5 5 15 7 15 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none"/><path d="M4 8 L5 10 L7 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M6 13 L10 15 L14 13" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5"/></svg> },
    { label: "Best Evidence Compliance",  value: "98%",      dept: "Roads & Infrastructure",
      icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="4" y="3" width="12" height="14" rx="1" stroke="currentColor" strokeWidth="1.2"/><path d="M7 8 L9.5 10.5 L13 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  ];

  const selectedDept = selected !== null ? sorted[selected] : null;

  return (
    <div style={{ background: "#F5F0E8", minHeight: "100vh", fontFamily: "var(--font-body)" }}>

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 border-b" style={{ background: "rgba(245,240,232,0.97)", borderColor: "#C8B89A", backdropFilter: "blur(8px)" }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <button onClick={() => onNavigate("home")} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <CivicTraceLogo size={30}/>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", color: "#1C0A00" }}>CivicTrace</span>
          </button>
          <div className="hidden md:flex items-center gap-6">
            {[
              { label: "Civic Map",   page: "civic-map" as Page },
              { label: "Leaderboard",page: "leaderboard" as Page },
            ].map(({ label, page }) => (
              <button key={label} onClick={() => onNavigate(page)}
                className="hover:opacity-60 transition-opacity"
                style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase",
                  color: page === "leaderboard" ? "#1C0A00" : "#5C4A32",
                  borderBottom: page === "leaderboard" ? "1px solid #1C0A00" : "none", paddingBottom: "1px" }}>
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => onNavigate("auth")} className="px-3 py-2 border hover:bg-[#EDE5D4] transition-colors"
              style={{ borderColor: "#C8B89A", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.08em", color: "#5C4A32", textTransform: "uppercase" }}>Sign In</button>
            <button onClick={() => onNavigate("report-category")} className="px-4 py-2 hover:opacity-90 transition-opacity"
              style={{ background: "#1C0A00", color: "#F5F0E8", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>Report an Issue</button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* ── Breadcrumb ── */}
        <div className="flex items-center gap-1.5 mb-7" style={{ fontFamily: "var(--font-mono)", fontSize: "0.57rem", letterSpacing: "0.08em", color: "#5C4A32" }}>
          <button onClick={() => onNavigate("home")} className="hover:opacity-70 transition-opacity opacity-45">Home</button>
          <span className="opacity-30">›</span>
          <span style={{ color: "#1C0A00" }}>Leaderboard</span>
        </div>

        {/* ── Hero header ── */}
        <div className="mb-10">
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.4, marginBottom: 10 }}>
            Public Accountability · Department Performance
          </div>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
            <div>
              <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "clamp(2rem, 4vw, 3rem)", color: "#1C0A00", lineHeight: 1.05, marginBottom: 10 }}>
                Who Is Keeping the<br/>City Moving?
              </h1>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.93rem", color: "#5C4A32", opacity: 0.65, lineHeight: 1.65, maxWidth: 520 }}>
                Compare departments by how quickly, consistently and transparently they resolve civic issues.
              </p>
            </div>
            {/* Summary stats */}
            <div className="flex items-stretch border divide-x overflow-hidden flex-shrink-0" style={{ borderColor: "#C8B89A", borderRadius: "2px" }}>
              {[
                { label: "Departments",         value: "6" },
                { label: "Avg Resolution Rate", value: "84%" },
                { label: "Avg Resolution Time", value: "4.2 days" },
                { label: "City Trust Score",    value: "86 / 100" },
              ].map(({ label, value }) => (
                <div key={label} className="px-5 py-3 text-center" style={{ background: "#FAF7F2", borderColor: "#C8B89A" }}>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.3rem", color: "#1C0A00", lineHeight: 1 }}>{value}</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.46rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.4, marginTop: 4 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Decorative rule ── */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 h-px" style={{ background: "#C8B89A" }}/>
          <div className="w-1.5 h-1.5 rotate-45" style={{ background: "#C8B89A" }}/>
          <div className="flex-1 h-px" style={{ background: "#C8B89A" }}/>
        </div>

        {/* ── Highlight cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          {highlights.map(({ label, value, dept, icon }) => (
            <div key={label} className="border px-5 py-4" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#FAF7F2" }}>
              <div className="mb-3" style={{ color: "#5C4A32", opacity: 0.5 }}>{icon}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.4, marginBottom: 4 }}>{label}</div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.5rem", color: "#1C0A00", lineHeight: 1, marginBottom: 3 }}>{value}</div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", color: "#5C4A32", opacity: 0.5 }}>{dept}</div>
            </div>
          ))}
        </div>

        {/* ── Filters + leaderboard grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-7">

          {/* Left — filters */}
          <aside className="space-y-4">
            {/* Time period */}
            <div className="border overflow-hidden" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#FAF7F2" }}>
              <div className="px-4 py-2.5 border-b" style={{ borderColor: "#C8B89A" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.54rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.5 }}>Time Period</span>
              </div>
              <div className="py-1">
                {periods.map(p => (
                  <button key={p} onClick={() => setPeriod(p)}
                    className="w-full text-left px-4 py-2.5 transition-colors hover:bg-[#EDE5D4]"
                    style={{ background: period === p ? "#EDE5D4" : "transparent",
                      fontFamily: period === p ? "var(--font-mono)" : "var(--font-body)",
                      fontSize: period === p ? "0.58rem" : "0.82rem",
                      letterSpacing: period === p ? "0.06em" : 0,
                      color: "#1C0A00", fontWeight: period === p ? 700 : 400 }}>
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort by */}
            <div className="border overflow-hidden" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#FAF7F2" }}>
              <div className="px-4 py-2.5 border-b" style={{ borderColor: "#C8B89A" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.54rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.5 }}>Sort By</span>
              </div>
              <div className="py-1">
                {sortOptions.map(({ key, label }) => (
                  <button key={key} onClick={() => setSortBy(key)}
                    className="w-full text-left px-4 py-2.5 flex items-center justify-between transition-colors hover:bg-[#EDE5D4]"
                    style={{ background: sortBy === key ? "#EDE5D4" : "transparent" }}>
                    <span style={{ fontFamily: sortBy === key ? "var(--font-mono)" : "var(--font-body)", fontSize: sortBy === key ? "0.58rem" : "0.82rem", letterSpacing: sortBy === key ? "0.06em" : 0, color: "#1C0A00", fontWeight: sortBy === key ? 700 : 400 }}>{label}</span>
                    {sortBy === key && <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#1C0A00" }}/>}
                  </button>
                ))}
              </div>
            </div>

            {/* Insight callout */}
            <div className="border px-4 py-4" style={{ borderColor: "#C8B89A40", borderRadius: "2px", background: "#EDE5D4" }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "0.92rem", color: "#1C0A00", marginBottom: 8, lineHeight: 1.3 }}>
                "Speed isn't the whole story."
              </div>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "#5C4A32", opacity: 0.65, lineHeight: 1.6, marginBottom: 12 }}>
                CivicTrace also considers whether issues stay fixed, whether evidence is submitted, and whether citizens reopen complaints.
              </p>
              <button onClick={() => onNavigate("dept-trust")} className="flex items-center gap-1 hover:opacity-70 transition-opacity"
                style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#3A6B9B" }}>
                See Dept. Trust Score →
              </button>
            </div>
          </aside>

          {/* Right — ranked table */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "1.3rem", color: "#1C0A00" }}>Department Performance</h2>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.4 }}>{period}</span>
            </div>

            {/* Column headers */}
            <div className="hidden md:grid border-b pb-2 mb-1 px-4" style={{ borderColor: "#C8B89A", gridTemplateColumns: "40px 1fr 80px 90px 90px 80px 100px 90px" }}>
              {["#", "Department", "Resolved", "Rate", "Avg. Time", "Reopened", "Evidence", "Trust"].map(h => (
                <div key={h} style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.4 }}>{h}</div>
              ))}
            </div>

            <div className="space-y-2">
              {sorted.map((dept, i) => {
                const isSel = selected === i;
                const isTop3 = i < 3;
                const medal = isTop3 ? medals[i] : null;

                return (
                  <div key={dept.name}>
                    {/* Main row */}
                    <button
                      className="w-full text-left border transition-all hover:shadow-md"
                      onClick={() => setSelected(isSel ? null : i)}
                      style={{
                        borderColor: isSel ? "#1C0A00" : "#C8B89A",
                        borderWidth: isSel ? "1.5px" : "1px",
                        background: isSel ? "#FAF7F2" : "#FAF7F2",
                        borderRadius: "2px",
                        display: "block",
                      }}>
                      {/* Top-3 accent stripe */}
                      {medal && <div className="h-0.5" style={{ background: medal }}/>}

                      <div className="px-4 py-4 grid items-center gap-3" style={{ gridTemplateColumns: "40px 1fr 80px 90px 90px 80px 100px 90px" }}>
                        {/* Rank */}
                        <div className="flex items-center justify-center" style={{ width: 32, height: 32, borderRadius: "50%", border: `1.5px solid ${medal || "#C8B89A"}`, background: medal ? `${medal}18` : "transparent" }}>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", fontWeight: 700, color: medal || "#5C4A32" }}>{String(i + 1).padStart(2, "0")}</span>
                        </div>

                        {/* Name + icon */}
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span style={{ color: "#5C4A32", opacity: 0.55, flexShrink: 0 }}>{dept.icon}</span>
                          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.97rem", color: "#1C0A00", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{dept.name}</span>
                        </div>

                        {/* Resolved */}
                        <div>
                          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", color: "#1C0A00", lineHeight: 1 }}>{dept.resolved}</div>
                          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.46rem", color: "#5C4A32", opacity: 0.4, marginTop: 1 }}>issues</div>
                        </div>

                        {/* Rate */}
                        <div>
                          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", color: dept.resolutionRate >= 88 ? "#4A7C5F" : dept.resolutionRate >= 82 ? "#1C0A00" : "#B8872A", lineHeight: 1 }}>{dept.resolutionRate}%</div>
                          <div className="mt-1.5 h-1 rounded-full" style={{ background: "#EDE5D4", width: 60 }}>
                            <div className="h-1 rounded-full" style={{ width: `${dept.resolutionRate}%`, background: dept.resolutionRate >= 88 ? "#4A7C5F" : "#C4622D", opacity: 0.7 }}/>
                          </div>
                        </div>

                        {/* Avg time */}
                        <div>
                          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", color: dept.avgDays <= 4 ? "#4A7C5F" : dept.avgDays <= 5 ? "#C4622D" : "#9B3A3A", lineHeight: 1 }}>{dept.avgDays}d</div>
                          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.46rem", color: "#5C4A32", opacity: 0.4, marginTop: 1 }}>avg</div>
                        </div>

                        {/* Reopen */}
                        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", color: dept.reopenRate <= 8 ? "#4A7C5F" : dept.reopenRate <= 11 ? "#C4622D" : "#9B3A3A", lineHeight: 1 }}>
                          {dept.reopenRate}%
                        </div>

                        {/* Evidence */}
                        <div>
                          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", color: dept.evidenceCompliance >= 94 ? "#4A7C5F" : "#1C0A00", lineHeight: 1 }}>{dept.evidenceCompliance}%</div>
                          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.46rem", color: "#5C4A32", opacity: 0.4, marginTop: 1 }}>compliance</div>
                        </div>

                        {/* Trust score */}
                        <div className="flex items-center gap-2.5">
                          <svg width="32" height="32" viewBox="0 0 32 32" style={{ flexShrink: 0 }}>
                            <circle cx="16" cy="16" r="13" fill="none" stroke="#EDE5D4" strokeWidth="3"/>
                            <circle cx="16" cy="16" r="13" fill="none"
                              stroke={dept.trust >= 88 ? "#4A7C5F" : dept.trust >= 83 ? "#3A6B9B" : "#B8872A"}
                              strokeWidth="3"
                              strokeDasharray={`${2 * Math.PI * 13 * dept.trust / 100} ${2 * Math.PI * 13}`}
                              strokeDashoffset={2 * Math.PI * 13 * 0.25}
                              strokeLinecap="round"
                              style={{ transform: "rotate(-90deg)", transformOrigin: "16px 16px" }}/>
                            <text x="16" y="20" textAnchor="middle" fontFamily="var(--font-display)" fontSize="9" fontWeight="700" fill="#1C0A00">{dept.trust}</text>
                          </svg>
                          <div>
                            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.46rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.4 }}>Trust</div>
                            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.85rem", color: "#1C0A00" }}>{dept.trust}<span style={{ fontSize: "0.6rem", opacity: 0.35 }}>/100</span></div>
                          </div>
                        </div>
                      </div>
                    </button>

                    {/* Expanded dept preview */}
                    {isSel && (
                      <div className="border border-t-0 px-6 py-5 bg-[#EDE5D4]" style={{ borderColor: "#1C0A00", borderRadius: "0 0 2px 2px" }}>
                        <div className="flex flex-col md:flex-row md:items-start gap-6">
                          <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4">
                            {[
                              { label: "Trust Score",        value: `${dept.trust} / 100` },
                              { label: "Resolution Rate",    value: `${dept.resolutionRate}%` },
                              { label: "Avg. Resolution",    value: `${dept.avgDays} days` },
                              { label: "Reopened Rate",      value: `${dept.reopenRate}%` },
                              { label: "Evidence Compliance",value: `${dept.evidenceCompliance}%` },
                              { label: "Issues Resolved",    value: String(dept.resolved) },
                            ].map(({ label, value }) => (
                              <div key={label} className="border px-4 py-3" style={{ borderColor: "#C8B89A", background: "#FAF7F2", borderRadius: "1px" }}>
                                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.48rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.4, marginBottom: 3 }}>{label}</div>
                                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.1rem", color: "#1C0A00" }}>{value}</div>
                              </div>
                            ))}
                          </div>
                          <button onClick={() => onNavigate("dept-trust")} className="flex items-center gap-2 px-5 py-3 flex-shrink-0 hover:opacity-90 transition-opacity"
                            style={{ background: "#1C0A00", color: "#F5F0E8", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", alignSelf: "flex-start" }}>
                            View Department Details →
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Transparency note */}
            <div className="mt-5 pt-4 border-t flex items-center gap-3" style={{ borderColor: "#C8B89A" }}>
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#4A7C5F" }}/>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.53rem", color: "#5C4A32", opacity: 0.5, letterSpacing: "0.04em", lineHeight: 1.5 }}>
                These scores are calculated from publicly verifiable complaint activity, resolution evidence and citizen outcomes.
              </p>
            </div>
          </div>
        </div>

        {/* ── Decorative rule ── */}
        <div className="flex items-center gap-4 my-12">
          <div className="flex-1 h-px" style={{ background: "#C8B89A" }}/>
          <div className="w-1.5 h-1.5 rotate-45" style={{ background: "#C8B89A" }}/>
          <div className="flex-1 h-px" style={{ background: "#C8B89A" }}/>
        </div>

        {/* ── Bottom CTA ── */}
        <div className="border overflow-hidden" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#1C0A00" }}>
          <div className="px-8 py-9 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "1.5rem", color: "#F5F0E8", lineHeight: 1.15, marginBottom: 6 }}>
                See the issues behind the numbers.
              </h2>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.88rem", color: "#C8B89A", opacity: 0.65, lineHeight: 1.55 }}>
                Every score is built from individual verified complaint records — open to anyone.
              </p>
            </div>
            <button onClick={() => onNavigate("civic-map")}
              className="flex items-center gap-2 px-7 py-3.5 border hover:opacity-90 transition-opacity flex-shrink-0"
              style={{ borderColor: "#C8B89A", color: "#F5F0E8", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.62rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Explore Civic Map →
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 pt-6 border-t flex flex-wrap items-center justify-between gap-3" style={{ borderColor: "#C8B89A" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "#5C4A32", opacity: 0.4 }}>
            © 2026 CivicTrace · Department performance is publicly comparable and verifiably sourced.
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#4A7C5F" }}/>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "#5C4A32", opacity: 0.4 }}>Open · On-chain · Verifiable</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PAGE 16 — Department Trust Score ────────────────────────────────────────
function DeptTrustPage({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const factors = [
    { label: "Resolution Speed",     score: 92, desc: "How consistently complaints are resolved within their expected response windows." },
    { label: "Successful Fixes",     score: 94, desc: "How often resolved complaints remain resolved without being reopened." },
    { label: "Evidence Compliance",  score: 96, desc: "How consistently authorities provide required proof of resolution." },
    { label: "Reopen Rate",          score: 88, desc: "How often citizens report that a supposedly resolved issue remains unresolved." },
    { label: "Escalation Rate",      score: 85, desc: "How often complaints remain unresolved long enough to require escalation." },
    { label: "Consistency",          score: 91, desc: "How stable the department's performance remains over time." },
  ];

  const trend = [
    { month: "APR", score: 84 },
    { month: "MAY", score: 86 },
    { month: "JUN", score: 87 },
    { month: "JUL", score: 89 },
    { month: "AUG", score: 90 },
    { month: "SEP", score: 91 },
  ];

  const snapshot = [
    { label: "Complaints Received", value: "347", color: "#1C0A00" },
    { label: "Resolved",            value: "312", color: "#4A7C5F" },
    { label: "In Progress",         value: "21",  color: "#3A6B9B" },
    { label: "Unresolved",          value: "7",   color: "#9B3A3A" },
    { label: "Escalated",           value: "4",   color: "#9B3A3A" },
    { label: "Reopened",            value: "19",  color: "#B8872A" },
    { label: "Avg Resolution",      value: "3.1d",color: "#1C0A00" },
    { label: "Evidence Compliance", value: "98%", color: "#4A7C5F" },
  ];

  const comparison = [
    { name: "Roads & Infrastructure", score: 91, current: true },
    { name: "Water & Drainage",       score: 88 },
    { name: "Sanitation",             score: 86 },
    { name: "Public Safety",          score: 84 },
    { name: "Parks & Public Spaces",  score: 81 },
    { name: "Environment",            score: 78 },
  ];

  const trustStages = [
    { label: "Report",          desc: "Citizen submits issue" },
    { label: "Response",        desc: "Department acknowledges and begins work" },
    { label: "Evidence",        desc: "Resolution requires proof" },
    { label: "Outcome",         desc: "Citizen can confirm or reopen" },
    { label: "Accountability",  desc: "Escalations and reopened cases affect the score" },
  ];

  // SVG trend line chart
  const chartW = 420, chartH = 90;
  const minScore = 82, maxScore = 93;
  const pts = trend.map((t, i) => ({
    x: 30 + (i / (trend.length - 1)) * (chartW - 60),
    y: chartH - 15 - ((t.score - minScore) / (maxScore - minScore)) * (chartH - 30),
  }));
  const polyline = pts.map(p => `${p.x},${p.y}`).join(" ");
  const area = `M ${pts[0].x} ${chartH - 15} ` + pts.map(p => `L ${p.x} ${p.y}`).join(" ") + ` L ${pts[pts.length - 1].x} ${chartH - 15} Z`;

  return (
    <div style={{ background: "#F5F0E8", minHeight: "100vh", fontFamily: "var(--font-body)" }}>

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 border-b" style={{ background: "rgba(245,240,232,0.97)", borderColor: "#C8B89A", backdropFilter: "blur(8px)" }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <button onClick={() => onNavigate("home")} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <CivicTraceLogo size={30}/>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", color: "#1C0A00" }}>CivicTrace</span>
          </button>
          <div className="hidden md:flex items-center gap-6">
            {(["civic-map", "leaderboard"] as Page[]).map(p => (
              <button key={p} onClick={() => onNavigate(p)} className="hover:opacity-60 transition-opacity capitalize"
                style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5C4A32" }}>
                {p === "civic-map" ? "Civic Map" : "Leaderboard"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => onNavigate("auth")} className="px-3 py-2 border hover:bg-[#EDE5D4] transition-colors"
              style={{ borderColor: "#C8B89A", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.08em", color: "#5C4A32", textTransform: "uppercase" }}>Sign In</button>
            <button onClick={() => onNavigate("report-category")} className="px-4 py-2 hover:opacity-90 transition-opacity"
              style={{ background: "#1C0A00", color: "#F5F0E8", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>Report an Issue</button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* ── Breadcrumb ── */}
        <div className="flex items-center gap-1.5 mb-7" style={{ fontFamily: "var(--font-mono)", fontSize: "0.57rem", letterSpacing: "0.08em", color: "#5C4A32" }}>
          <button onClick={() => onNavigate("home")} className="opacity-45 hover:opacity-70 transition-opacity">Home</button>
          <span className="opacity-30">›</span>
          <button onClick={() => onNavigate("leaderboard")} className="opacity-45 hover:opacity-70 transition-opacity">Leaderboard</button>
          <span className="opacity-30">›</span>
          <span style={{ color: "#1C0A00" }}>Department Trust Score</span>
        </div>

        {/* ══════════════════════════════════════════════════════
            DEPARTMENT IDENTITY HERO
        ══════════════════════════════════════════════════════ */}
        <div className="border mb-9 overflow-hidden" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#FAF7F2" }}>
          <div className="h-1" style={{ background: "linear-gradient(to right, #4A7C5F, #3A6B9B, #C4622D)" }}/>
          <div className="px-8 py-8 flex flex-col md:flex-row gap-8 items-center md:items-start">

            {/* Score ring — centrepiece */}
            <div className="flex flex-col items-center gap-3 flex-shrink-0">
              <svg width="160" height="160" viewBox="0 0 160 160">
                {/* Outer decorative ring */}
                <circle cx="80" cy="80" r="74" fill="none" stroke="#EDE5D4" strokeWidth="1" strokeDasharray="3 4"/>
                {/* Track */}
                <circle cx="80" cy="80" r="62" fill="none" stroke="#EDE5D4" strokeWidth="10"/>
                {/* Score arc */}
                <circle cx="80" cy="80" r="62" fill="none" stroke="#4A7C5F" strokeWidth="10"
                  strokeDasharray={`${2 * Math.PI * 62 * 0.91} ${2 * Math.PI * 62}`}
                  strokeDashoffset={2 * Math.PI * 62 * 0.25}
                  strokeLinecap="round"
                  style={{ transform: "rotate(-90deg)", transformOrigin: "80px 80px" }}/>
                {/* Inner ring detail */}
                <circle cx="80" cy="80" r="50" fill="none" stroke="#EDE5D4" strokeWidth="0.5"/>
                {/* Score number */}
                <text x="80" y="74" textAnchor="middle" fontFamily="var(--font-display)" fontSize="32" fontWeight="700" fill="#1C0A00">91</text>
                <text x="80" y="92" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="8" fill="#5C4A32" opacity="0.5" letterSpacing="1">/ 100</text>
                {/* Star tick */}
                <circle cx="80" cy="114" r="10" fill="#4A7C5F"/>
                <path d="M75 114 L78.5 117.5 L85 111" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: "#4A7C5F" }}/>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.54rem", letterSpacing: "0.1em", color: "#4A7C5F" }}>Strong Performance</span>
              </div>
            </div>

            {/* Department identity */}
            <div className="flex-1">
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.4, marginBottom: 6 }}>
                Department Accountability
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.5, marginBottom: 6 }}>
                City Civic Department
              </div>
              <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)", color: "#1C0A00", lineHeight: 1.1, marginBottom: 6 }}>
                Roads &amp; Infrastructure
              </h1>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.54rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.45, marginBottom: 16 }}>
                Trust &amp; Accountability Score
              </div>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.9rem", color: "#5C4A32", opacity: 0.65, lineHeight: 1.65, maxWidth: 480, marginBottom: 16 }}>
                CivicTrace measures whether departments resolve issues quickly, provide evidence, and keep problems resolved.
              </p>

              {/* Formula strip */}
              <div className="flex items-center gap-2 flex-wrap">
                {["Fast", "Genuine", "Verifiable", "Lasting"].map((word, i, arr) => (
                  <div key={word} className="flex items-center gap-2">
                    <div className="px-3 py-1.5 border" style={{ borderColor: "#C8B89A", background: "#EDE5D4", borderRadius: "1px" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#1C0A00" }}>{word}</span>
                    </div>
                    {i < arr.length - 1 && <span style={{ color: "#C8B89A", fontSize: "0.8rem" }}>+</span>}
                  </div>
                ))}
                <span style={{ color: "#C8B89A" }}>=</span>
                <div className="px-3 py-1.5 border" style={{ borderColor: "#4A7C5F", background: "#EEF4F0", borderRadius: "1px" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#4A7C5F", fontWeight: 700 }}>Trust</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Decorative rule ── */}
        <div className="flex items-center gap-4 mb-9">
          <div className="flex-1 h-px" style={{ background: "#C8B89A" }}/>
          <div className="w-1.5 h-1.5 rotate-45" style={{ background: "#C8B89A" }}/>
          <div className="flex-1 h-px" style={{ background: "#C8B89A" }}/>
        </div>

        {/* ══════════════════════════════════════════════════════
            MAIN GRID
        ══════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">

          {/* ── LEFT ── */}
          <div className="space-y-8">

            {/* SCORE BREAKDOWN */}
            <section className="border overflow-hidden" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#FAF7F2" }}>
              <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "#C8B89A" }}>
                <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "1.15rem", color: "#1C0A00" }}>Score Breakdown</h2>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.4 }}>6 weighted factors</span>
              </div>
              <div className="divide-y" style={{ borderColor: "#EDE5D4" }}>
                {factors.map(({ label, score, desc }) => {
                  const barColor = score >= 92 ? "#4A7C5F" : score >= 88 ? "#3A6B9B" : "#B8872A";
                  return (
                    <div key={label} className="px-6 py-5 grid grid-cols-[1fr_auto] gap-6 items-center">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#1C0A00", fontWeight: 700 }}>{label}</span>
                        </div>
                        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", color: "#5C4A32", opacity: 0.6, lineHeight: 1.55, marginBottom: 10 }}>{desc}</p>
                        {/* Bar */}
                        <div className="h-1.5 rounded-full" style={{ background: "#EDE5D4", maxWidth: 320 }}>
                          <div className="h-1.5 rounded-full transition-all" style={{ width: `${score}%`, background: barColor, opacity: 0.8 }}/>
                        </div>
                      </div>
                      {/* Score ring */}
                      <div className="flex-shrink-0">
                        <svg width="54" height="54" viewBox="0 0 54 54">
                          <circle cx="27" cy="27" r="22" fill="none" stroke="#EDE5D4" strokeWidth="4"/>
                          <circle cx="27" cy="27" r="22" fill="none" stroke={barColor} strokeWidth="4"
                            strokeDasharray={`${2 * Math.PI * 22 * score / 100} ${2 * Math.PI * 22}`}
                            strokeDashoffset={2 * Math.PI * 22 * 0.25}
                            strokeLinecap="round"
                            style={{ transform: "rotate(-90deg)", transformOrigin: "27px 27px" }}/>
                          <text x="27" y="32" textAnchor="middle" fontFamily="var(--font-display)" fontSize="13" fontWeight="700" fill="#1C0A00">{score}</text>
                        </svg>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* WHY THIS SCORE */}
            <section className="border overflow-hidden" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#EDE5D4" }}>
              <div className="px-6 py-6">
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.54rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.45, marginBottom: 10 }}>
                  Why doesn't speed decide everything?
                </div>
                <blockquote style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "1.2rem", color: "#1C0A00", lineHeight: 1.35, borderLeft: "3px solid #C4622D", paddingLeft: 18, marginBottom: 18 }}>
                  "A department can close complaints quickly while still failing citizens if issues are reopened or resolution evidence is missing."
                </blockquote>

                {/* Formula */}
                <div className="flex items-center flex-wrap gap-2 mt-2">
                  {["Responding", "Fixing", "Proving", "Maintaining"].map((w, i, arr) => (
                    <div key={w} className="flex items-center gap-2">
                      <div className="border px-4 py-2" style={{ borderColor: "#C8B89A", background: "#FAF7F2", borderRadius: "1px" }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#1C0A00" }}>{w}</span>
                      </div>
                      {i < arr.length - 1 && <span style={{ fontFamily: "var(--font-mono)", color: "#C8B89A", fontSize: "0.9rem" }}>+</span>}
                    </div>
                  ))}
                  <span style={{ fontFamily: "var(--font-mono)", color: "#C8B89A" }}>=</span>
                  <div className="border-2 px-4 py-2" style={{ borderColor: "#4A7C5F", background: "#EEF4F0", borderRadius: "1px" }}>
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "1rem", color: "#4A7C5F" }}>Trust</span>
                  </div>
                </div>
              </div>
            </section>

            {/* HOW CIVICTRACE CALCULATES TRUST */}
            <section className="border overflow-hidden" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#FAF7F2" }}>
              <div className="px-6 py-4 border-b" style={{ borderColor: "#C8B89A" }}>
                <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "1.15rem", color: "#1C0A00" }}>How CivicTrace Calculates Trust</h2>
              </div>
              <div className="px-6 py-6">
                <div className="relative">
                  {/* Track */}
                  <div className="absolute" style={{ left: 11, top: 14, bottom: 14, width: 1, background: "linear-gradient(to bottom, #C8B89A, #4A7C5F)", opacity: 0.3 }}/>
                  <div className="space-y-0">
                    {trustStages.map((s, i) => {
                      const isLast = i === trustStages.length - 1;
                      const clr = ["#9B3A3A", "#C4622D", "#5C4A32", "#3A6B9B", "#4A7C5F"][i];
                      return (
                        <div key={s.label} className="flex gap-5" style={{ paddingBottom: isLast ? 0 : 26 }}>
                          <div className="flex-shrink-0 z-10 mt-0.5">
                            <div style={{ width: 22, height: 22, borderRadius: "50%", background: `${clr}18`, border: `1.5px solid ${clr}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", fontWeight: 700, color: clr }}>{i + 1}</span>
                            </div>
                          </div>
                          <div className="flex-1 pt-0.5">
                            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", color: clr, fontWeight: 700, marginBottom: 3 }}>{s.label}</div>
                            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.83rem", color: "#1C0A00", opacity: 0.65, lineHeight: 1.5 }}>{s.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>

            {/* TREND CHART */}
            <section className="border overflow-hidden" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#FAF7F2" }}>
              <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "#C8B89A" }}>
                <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "1.15rem", color: "#1C0A00" }}>Accountability Over Time</h2>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#4A7C5F", opacity: 0.7 }}>↑ Improving</span>
              </div>
              <div className="px-6 py-5">
                <svg width="100%" viewBox={`0 0 ${chartW} ${chartH + 24}`} style={{ display: "block", overflow: "visible" }}>
                  {/* Gridlines */}
                  {[84, 87, 90].map(v => {
                    const y = chartH - 15 - ((v - minScore) / (maxScore - minScore)) * (chartH - 30);
                    return (
                      <g key={v}>
                        <line x1="30" y1={y} x2={chartW - 30} y2={y} stroke="#EDE5D4" strokeWidth="1"/>
                        <text x="20" y={y + 4} textAnchor="end" fontFamily="var(--font-mono)" fontSize="7" fill="#5C4A32" opacity="0.4">{v}</text>
                      </g>
                    );
                  })}
                  {/* Area fill */}
                  <path d={area} fill="#4A7C5F" opacity="0.07"/>
                  {/* Line */}
                  <polyline points={polyline} fill="none" stroke="#4A7C5F" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round"/>
                  {/* Points + labels */}
                  {pts.map((p, i) => (
                    <g key={i}>
                      <circle cx={p.x} cy={p.y} r="4" fill="#FAF7F2" stroke="#4A7C5F" strokeWidth="1.5"/>
                      <text x={p.x} y={p.y - 8} textAnchor="middle" fontFamily="var(--font-display)" fontSize="9" fontWeight="700" fill="#1C0A00">{trend[i].score}</text>
                      <text x={p.x} y={chartH + 10} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="8" fill="#5C4A32" opacity="0.5">{trend[i].month}</text>
                    </g>
                  ))}
                </svg>
              </div>
            </section>

            {/* STRENGTHS / ATTENTION */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Doing well */}
              <div className="border overflow-hidden" style={{ borderColor: "#4A7C5F40", borderRadius: "2px", background: "#FAF7F2" }}>
                <div className="h-0.5" style={{ background: "#4A7C5F" }}/>
                <div className="px-5 py-4 border-b" style={{ borderColor: "#EDE5D4" }}>
                  <h3 style={{ fontFamily: "var(--font-mono)", fontSize: "0.56rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#4A7C5F" }}>Doing Well</h3>
                </div>
                <div className="px-5 py-4 space-y-3">
                  {["Fast response", "High evidence compliance", "Low unresolved backlog"].map(item => (
                    <div key={item} className="flex items-center gap-2.5">
                      <div className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: "#EEF4F0", border: "1px solid #4A7C5F50" }}>
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4 L3.5 6 L6.5 2" stroke="#4A7C5F" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                      <span style={{ fontFamily: "var(--font-body)", fontSize: "0.83rem", color: "#1C0A00", opacity: 0.8 }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Needs attention */}
              <div className="border overflow-hidden" style={{ borderColor: "#B8872A40", borderRadius: "2px", background: "#FAF7F2" }}>
                <div className="h-0.5" style={{ background: "#B8872A" }}/>
                <div className="px-5 py-4 border-b" style={{ borderColor: "#EDE5D4" }}>
                  <h3 style={{ fontFamily: "var(--font-mono)", fontSize: "0.56rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#B8872A" }}>Needs Attention</h3>
                </div>
                <div className="px-5 py-4 space-y-3">
                  {["Reopened complaints", "Escalated cases", "Consistency in high-priority issues"].map(item => (
                    <div key={item} className="flex items-center gap-2.5">
                      <div className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: "#FBF6EB", border: "1px solid #B8872A40" }}>
                        <span style={{ fontSize: "0.55rem", color: "#B8872A", fontWeight: 700 }}>⚠</span>
                      </div>
                      <span style={{ fontFamily: "var(--font-body)", fontSize: "0.83rem", color: "#1C0A00", opacity: 0.7 }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <div className="space-y-5">

            {/* Snapshot */}
            <div className="border overflow-hidden" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#FAF7F2" }}>
              <div className="px-5 py-3 border-b" style={{ borderColor: "#C8B89A" }}>
                <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "1rem", color: "#1C0A00" }}>Department at a Glance</h3>
              </div>
              <div className="grid grid-cols-2 divide-x divide-y" style={{ borderColor: "#EDE5D4" }}>
                {snapshot.map(({ label, value, color }) => (
                  <div key={label} className="px-4 py-3">
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.48rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.4, marginBottom: 3 }}>{label}</div>
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.3rem", color, lineHeight: 1 }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Comparison */}
            <div className="border overflow-hidden" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#FAF7F2" }}>
              <div className="px-5 py-3 border-b" style={{ borderColor: "#C8B89A" }}>
                <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "1rem", color: "#1C0A00" }}>Compared with Others</h3>
              </div>
              <div className="px-5 py-3 space-y-2.5">
                {comparison.map(({ name, score, current }) => (
                  <div key={name}>
                    <div className="flex items-center justify-between mb-1">
                      <span style={{ fontFamily: "var(--font-body)", fontSize: current ? "0.83rem" : "0.78rem", color: current ? "#1C0A00" : "#5C4A32", opacity: current ? 1 : 0.65, fontWeight: current ? 600 : 400 }}>{name}</span>
                      <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.95rem", color: current ? "#4A7C5F" : "#1C0A00" }}>{score}</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: "#EDE5D4" }}>
                      <div className="h-1.5 rounded-full" style={{ width: `${score}%`, background: current ? "#4A7C5F" : "#C8B89A", opacity: current ? 0.9 : 0.5, transition: "width 0.4s ease" }}/>
                    </div>
                    {current && <div className="mt-1" style={{ fontFamily: "var(--font-mono)", fontSize: "0.48rem", color: "#4A7C5F", letterSpacing: "0.06em" }}>← This department</div>}
                  </div>
                ))}
              </div>
              <div className="px-5 pb-4">
                <button onClick={() => onNavigate("leaderboard")}
                  className="w-full py-2.5 border flex items-center justify-center gap-1.5 hover:bg-[#EDE5D4] transition-colors mt-2"
                  style={{ borderColor: "#C8B89A", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#1C0A00" }}>
                  View Full Leaderboard →
                </button>
              </div>
            </div>

            {/* Verification note */}
            <div className="border overflow-hidden" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#EDE5D4" }}>
              <div className="px-5 py-4">
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.45, marginBottom: 8 }}>Verification</div>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "#1C0A00", opacity: 0.7, lineHeight: 1.6, marginBottom: 6 }}>
                  Score based on CivicTrace complaint activity, resolution evidence, citizen outcomes and escalation history.
                </p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "#5C4A32", opacity: 0.55, lineHeight: 1.55, marginBottom: 14, fontStyle: "italic" }}>
                  Important complaint events are backed by verifiable records.
                </p>
                <button onClick={() => onNavigate("verification")}
                  className="flex items-center gap-1.5 hover:opacity-70 transition-opacity"
                  style={{ fontFamily: "var(--font-mono)", fontSize: "0.56rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#3A6B9B" }}>
                  Explore Verification System →
                </button>
              </div>
            </div>

            {/* Back nav */}
            <button onClick={() => onNavigate("leaderboard")}
              className="w-full py-2.5 border flex items-center justify-center gap-2 hover:bg-[#EDE5D4] transition-colors"
              style={{ borderColor: "#C8B89A", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#5C4A32" }}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M7 2 L3 5 L7 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Back to Leaderboard
            </button>
          </div>
        </div>

        {/* ── Bottom CTA ── */}
        <div className="mt-12 border overflow-hidden" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#1C0A00" }}>
          <div className="px-8 py-9 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "1.5rem", color: "#F5F0E8", lineHeight: 1.15, marginBottom: 6 }}>
                See what is happening on the ground.
              </h2>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.88rem", color: "#C8B89A", opacity: 0.65, lineHeight: 1.55 }}>
                Every trust score is built from individual, verified complaint records — open to anyone.
              </p>
            </div>
            <button onClick={() => onNavigate("civic-map")}
              className="flex items-center gap-2 px-7 py-3.5 border hover:opacity-90 transition-opacity flex-shrink-0"
              style={{ borderColor: "#C8B89A", color: "#F5F0E8", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.62rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Explore Civic Map →
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 pt-6 border-t flex flex-wrap items-center justify-between gap-3" style={{ borderColor: "#C8B89A" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "#5C4A32", opacity: 0.4 }}>
            © 2026 CivicTrace · Department trust is publicly comparable and verifiably sourced.
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#4A7C5F" }}/>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "#5C4A32", opacity: 0.4 }}>Open · On-chain · Verifiable</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PAGE 17 — Civic Impact Dashboard ────────────────────────────────────────
function ImpactDashboardPage({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const [period, setPeriod] = useState("Last 30 days");
  const [catFilter, setCatFilter] = useState("All");
  const [scoreExpanded, setScoreExpanded] = useState(false);
  const [hoveredIssue, setHoveredIssue] = useState<number | null>(null);
  const [hoveredHotspot, setHoveredHotspot] = useState<string | null>(null);

  const periods = ["Last 30 days", "Last 90 days", "This year"];
  const cats = ["All", "Roads & Infrastructure", "Water & Drainage", "Sanitation", "Public Safety", "Parks & Public Spaces", "Environment"];

  const topIssues = [
    { rank: "01", title: "Major road damage near central intersection", cat: "Roads & Infrastructure", priority: "VERY URGENT", score: 94, supporters: 43, age: "11 days", status: "UNRESOLVED" },
    { rank: "02", title: "Overflowing drainage affecting residential area", cat: "Water & Drainage",        priority: "URGENT",      score: 91, supporters: 31, age: "8 days",  status: "IN PROGRESS" },
    { rank: "03", title: "Streetlights inactive across public route",      cat: "Roads & Infrastructure", priority: "URGENT",      score: 87, supporters: 24, age: "6 days",  status: "IN PROGRESS" },
    { rank: "04", title: "Large pothole cluster near school zone",         cat: "Roads & Infrastructure", priority: "VERY URGENT", score: 84, supporters: 19, age: "14 days", status: "ESCALATED" },
    { rank: "05", title: "Open manhole on high-traffic pedestrian path",   cat: "Public Safety",          priority: "VERY URGENT", score: 81, supporters: 17, age: "5 days",  status: "ASSIGNED" },
  ];

  const categoryData = [
    { name: "Roads & Infrastructure", total: 412, active: 128, avgScore: 78 },
    { name: "Water & Drainage",       total: 238, active:  71, avgScore: 74 },
    { name: "Sanitation",             total: 301, active:  62, avgScore: 61 },
    { name: "Public Safety",          total: 148, active:  47, avgScore: 82 },
    { name: "Parks & Public Spaces",  total: 112, active:  24, avgScore: 53 },
    { name: "Environment",            total:  73, active:  15, avgScore: 49 },
  ];
  const maxTotal = Math.max(...categoryData.map(c => c.total));

  const aging = [
    { label: "0–3 days",  count: 142, concern: false },
    { label: "4–7 days",  count:  98, concern: false },
    { label: "8–14 days", count:  67, concern: false },
    { label: "15–30 days",count:  38, concern: true  },
    { label: "30+ days",  count:  28, concern: true  },
  ];
  const maxAging = Math.max(...aging.map(a => a.count));

  const scoreFactors = [
    { label: "Community Support",           pts: 22, color: "#3A6B9B" },
    { label: "Priority",                    pts: 18, color: "#C4622D" },
    { label: "Time Unresolved",             pts: 17, color: "#9B3A3A" },
    { label: "Affected Population",         pts: 14, color: "#5C4A32" },
    { label: "Location Importance",         pts:  9, color: "#B8872A" },
    { label: "Escalation / Reopen History", pts:  7, color: "#6A5C8A" },
  ];

  // Trend line data (30 day)
  const trendPts = [41,44,38,52,61,57,63,70,68,74,71,80,77,83,79,85,82,88,91,87,93,89,95,92,97,94,99,96,101,98];
  const chartW = 600, chartH = 80;
  const minV = 35, maxV = 105;
  const toX = (i: number) => 10 + (i / (trendPts.length - 1)) * (chartW - 20);
  const toY = (v: number) => chartH - 8 - ((v - minV) / (maxV - minV)) * (chartH - 16);
  const lineStr = trendPts.map((v, i) => `${toX(i)},${toY(v)}`).join(" ");
  const areaStr = `M ${toX(0)} ${chartH - 8} ` + trendPts.map((v, i) => `L ${toX(i)} ${toY(v)}`).join(" ") + ` L ${toX(trendPts.length - 1)} ${chartH - 8} Z`;

  const hotspots = [
    { id: "central",  label: "Central District",       x: 52, y: 44, count: 94, color: "#9B3A3A" },
    { id: "north",    label: "North Residential Zone", x: 22, y: 22, count: 67, color: "#C4622D" },
    { id: "market",   label: "Market Area",            x: 74, y: 58, count: 53, color: "#C4622D" },
    { id: "school",   label: "School Corridor",        x: 40, y: 68, count: 41, color: "#B8872A" },
    { id: "river",    label: "Riverside Zone",         x: 82, y: 35, count: 29, color: "#3A6B9B" },
  ];

  const accountabilityRows = [
    { label: "Strongest Resolvers",     value: "Roads · Sanitation",     link: "View Leaderboard →",    nav: "leaderboard" as Page },
    { label: "Highest Reopen Rate",     value: "Environment · Parks",    link: "View Trust Scores →",   nav: "dept-trust"  as Page },
    { label: "Currently Escalated",     value: "39 complaints",          link: "View Escalations →",    nav: "civic-map"   as Page },
    { label: "Awaiting Evidence",       value: "21 complaints",          link: "View Records →",        nav: "verification"as Page },
  ];

  function statusColor(s: string) {
    const m: Record<string, string> = { "UNRESOLVED": "#9B3A3A", "IN PROGRESS": "#3A6B9B", "ESCALATED": "#9B3A3A", "ASSIGNED": "#5C4A32" };
    return m[s] || "#5C4A32";
  }
  function priorityColor(p: string) {
    return p === "VERY URGENT" ? "#9B3A3A" : p === "URGENT" ? "#C4622D" : "#5C4A32";
  }

  return (
    <div style={{ background: "#F5F0E8", minHeight: "100vh", fontFamily: "var(--font-body)" }}>

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 border-b" style={{ background: "rgba(245,240,232,0.97)", borderColor: "#C8B89A", backdropFilter: "blur(8px)" }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <button onClick={() => onNavigate("home")} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <CivicTraceLogo size={30}/>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", color: "#1C0A00" }}>CivicTrace</span>
          </button>
          <div className="hidden md:flex items-center gap-6">
            {[{ l: "Civic Map", p: "civic-map" }, { l: "Leaderboard", p: "leaderboard" }, { l: "Impact", p: "impact-dashboard" }].map(({ l, p }) => (
              <button key={p} onClick={() => onNavigate(p as Page)} className="hover:opacity-60 transition-opacity"
                style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase",
                  color: p === "impact-dashboard" ? "#1C0A00" : "#5C4A32",
                  borderBottom: p === "impact-dashboard" ? "1px solid #1C0A00" : "none", paddingBottom: "1px" }}>{l}</button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => onNavigate("auth")} className="px-3 py-2 border hover:bg-[#EDE5D4] transition-colors"
              style={{ borderColor: "#C8B89A", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.08em", color: "#5C4A32", textTransform: "uppercase" }}>Sign In</button>
            <button onClick={() => onNavigate("report-category")} className="px-4 py-2 hover:opacity-90 transition-opacity"
              style={{ background: "#1C0A00", color: "#F5F0E8", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>Report an Issue</button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* ── Hero header ── */}
        <div className="mb-8">
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.4, marginBottom: 8 }}>
            Civic Impact Dashboard · Demo Data
          </div>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
            <div>
              <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "clamp(2rem, 4vw, 3rem)", color: "#1C0A00", lineHeight: 1.05, marginBottom: 8 }}>
                What Matters Most<br/>Right Now?
              </h1>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.9rem", color: "#5C4A32", opacity: 0.65, lineHeight: 1.65, maxWidth: 520 }}>
                See which civic issues are affecting the city most, how long they remain unresolved, and where accountability is needed.
              </p>
            </div>
            {/* Filter controls */}
            <div className="flex items-center gap-2 flex-wrap">
              <select value={period} onChange={e => setPeriod(e.target.value)}
                className="border px-3 py-2 hover:bg-[#EDE5D4] transition-colors"
                style={{ borderColor: "#C8B89A", background: "#FAF7F2", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.57rem", color: "#1C0A00", outline: "none", cursor: "pointer" }}>
                {periods.map(p => <option key={p}>{p}</option>)}
              </select>
              <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
                className="border px-3 py-2 hover:bg-[#EDE5D4] transition-colors"
                style={{ borderColor: "#C8B89A", background: "#FAF7F2", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.57rem", color: "#1C0A00", outline: "none", cursor: "pointer" }}>
                {cats.map(c => <option key={c}>{c}</option>)}
              </select>
              <div className="border px-3 py-2" style={{ borderColor: "#C8B89A", background: "#FAF7F2", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "#5C4A32", opacity: 0.5 }}>
                All Areas ▾
              </div>
            </div>
          </div>
        </div>

        {/* ── Decorative rule ── */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 h-px" style={{ background: "#C8B89A" }}/>
          <div className="w-1.5 h-1.5 rotate-45" style={{ background: "#C8B89A" }}/>
          <div className="flex-1 h-px" style={{ background: "#C8B89A" }}/>
        </div>

        {/* ══ CITY OVERVIEW STATS ══ */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 border divide-x mb-9 overflow-hidden" style={{ borderColor: "#C8B89A", borderRadius: "2px" }}>
          {[
            { n: "1,284", label: "Total Complaints",   sub: "reported issues",                        color: "#1C0A00" },
            { n: "347",   label: "Active Issues",       sub: "currently require action",               color: "#C4622D" },
            { n: "812",   label: "Resolved",            sub: "successfully closed",                    color: "#4A7C5F" },
            { n: "86",    label: "Unresolved",          sub: "exceeded expected windows",              color: "#9B3A3A" },
            { n: "39",    label: "Escalated",           sub: "require senior attention",               color: "#9B3A3A" },
            { n: "79.1%", label: "Resolution Rate",     sub: "city-wide average",                      color: "#3A6B9B" },
          ].map(({ n, label, sub, color }) => (
            <div key={label} className="px-5 py-4" style={{ background: "#FAF7F2", borderColor: "#C8B89A" }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.7rem", color, lineHeight: 1 }}>{n}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#1C0A00", opacity: 0.7, marginTop: 4 }}>{label}</div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: "0.7rem", color: "#5C4A32", opacity: 0.5, marginTop: 2, lineHeight: 1.4 }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* ══ MAIN GRID ══ */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-7">

          {/* ── LEFT ── */}
          <div className="space-y-7">

            {/* HIGHEST IMPACT ISSUES */}
            <section className="border overflow-hidden" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#FAF7F2" }}>
              <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "#C8B89A" }}>
                <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "1.2rem", color: "#1C0A00" }}>Highest Impact Issues</h2>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.4 }}>{period}</span>
              </div>
              <div className="divide-y" style={{ borderColor: "#EDE5D4" }}>
                {topIssues.map((issue, i) => (
                  <div key={issue.rank}
                    className="px-6 py-4 transition-colors cursor-pointer"
                    style={{ background: hoveredIssue === i ? "#F0EAE0" : "transparent" }}
                    onMouseEnter={() => setHoveredIssue(i)}
                    onMouseLeave={() => setHoveredIssue(null)}
                    onClick={() => onNavigate("public-record")}>
                    <div className="flex items-start gap-5">
                      {/* Rank */}
                      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center border"
                        style={{ borderColor: i < 3 ? "#C4622D" : "#C8B89A", background: i < 3 ? "#FBF0EA" : "transparent", borderRadius: "1px" }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", fontWeight: 700, color: i < 3 ? "#C4622D" : "#5C4A32" }}>{issue.rank}</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-1">
                          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.97rem", color: "#1C0A00", lineHeight: 1.25 }}>{issue.title}</div>
                          {/* Score badge */}
                          <div className="flex-shrink-0 border px-2.5 py-1 text-center" style={{ borderColor: "#C4622D40", background: "#FBF0EA", borderRadius: "1px" }}>
                            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.1rem", color: "#C4622D", lineHeight: 1 }}>{issue.score}</div>
                            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.44rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#C4622D", opacity: 0.6 }}>impact</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap mt-1.5">
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", color: "#5C4A32", opacity: 0.5 }}>{issue.cat}</span>
                          <span style={{ color: "#C8B89A" }}>·</span>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", color: priorityColor(issue.priority), letterSpacing: "0.06em" }}>{issue.priority}</span>
                          <span style={{ color: "#C8B89A" }}>·</span>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", color: "#5C4A32", opacity: 0.5 }}>{issue.supporters} supporting</span>
                          <span style={{ color: "#C8B89A" }}>·</span>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", color: "#5C4A32", opacity: 0.5 }}>{issue.age}</span>
                          <span className="px-2 py-0.5 border" style={{ borderColor: `${statusColor(issue.status)}40`, background: `${statusColor(issue.status)}12`, borderRadius: "1px" }}>
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.07em", color: statusColor(issue.status) }}>{issue.status}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* CATEGORY IMPACT */}
            <section className="border overflow-hidden" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#FAF7F2" }}>
              <div className="px-6 py-4 border-b" style={{ borderColor: "#C8B89A" }}>
                <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "1.15rem", color: "#1C0A00" }}>Where Problems Are Concentrated</h2>
              </div>
              {/* Column headers */}
              <div className="px-6 pt-4 pb-2 grid gap-2" style={{ gridTemplateColumns: "1fr 80px 80px 70px" }}>
                {["Category", "Total", "Active", "Avg Score"].map(h => (
                  <div key={h} style={{ fontFamily: "var(--font-mono)", fontSize: "0.48rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.4 }}>{h}</div>
                ))}
              </div>
              <div className="px-6 pb-4 space-y-3">
                {categoryData.map(c => (
                  <div key={c.name} className="grid items-center gap-2" style={{ gridTemplateColumns: "1fr 80px 80px 70px" }}>
                    <div>
                      <div style={{ fontFamily: "var(--font-body)", fontSize: "0.83rem", color: "#1C0A00", marginBottom: 4 }}>{c.name}</div>
                      <div className="h-1.5 rounded-full" style={{ background: "#EDE5D4", maxWidth: 280 }}>
                        <div className="h-1.5 rounded-full" style={{ width: `${(c.total / maxTotal) * 100}%`, background: "#C4622D", opacity: 0.55 }}/>
                      </div>
                    </div>
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", color: "#1C0A00" }}>{c.total}</div>
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", color: "#9B3A3A" }}>{c.active}</div>
                    <div className="flex items-center gap-1">
                      <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", color: c.avgScore >= 75 ? "#C4622D" : "#5C4A32" }}>{c.avgScore}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* IMPACT OVER TIME */}
            <section className="border overflow-hidden" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#FAF7F2" }}>
              <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "#C8B89A" }}>
                <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "1.15rem", color: "#1C0A00" }}>Civic Impact Over Time</h2>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", color: "#5C4A32", opacity: 0.4 }}>30-day trend · demo data</span>
              </div>
              <div className="px-6 py-5">
                <svg width="100%" viewBox={`0 0 ${chartW} ${chartH + 28}`} style={{ display: "block", overflow: "visible" }}>
                  {/* Subtle gridlines */}
                  {[45, 65, 85].map(v => {
                    const y = toY(v);
                    return <g key={v}>
                      <line x1="10" y1={y} x2={chartW - 10} y2={y} stroke="#EDE5D4" strokeWidth="1"/>
                      <text x="6" y={y + 3} textAnchor="end" fontFamily="var(--font-mono)" fontSize="7" fill="#5C4A32" opacity="0.35">{v}</text>
                    </g>;
                  })}
                  {/* Area */}
                  <path d={areaStr} fill="#C4622D" opacity="0.06"/>
                  {/* Line */}
                  <polyline points={lineStr} fill="none" stroke="#C4622D" strokeWidth="1.5" strokeLinejoin="round"/>
                  {/* Month labels */}
                  {[0, 7, 14, 21, 28].map(i => (
                    <text key={i} x={toX(i)} y={chartH + 20} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="7.5" fill="#5C4A32" opacity="0.4">
                      {["Sep 1", "Sep 8", "Sep 15", "Sep 22", "Sep 29"][i / 7]}
                    </text>
                  ))}
                  {/* Current value dot */}
                  <circle cx={toX(trendPts.length - 1)} cy={toY(trendPts[trendPts.length - 1])} r="4" fill="#FAF7F2" stroke="#C4622D" strokeWidth="1.5"/>
                </svg>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.76rem", color: "#5C4A32", opacity: 0.55, lineHeight: 1.5, marginTop: 4, fontStyle: "italic" }}>
                  Combined Civic Impact Score across all active complaints. Higher values indicate greater collective urgency requiring city attention.
                </p>
              </div>
            </section>

            {/* CIVIC HOTSPOTS MAP */}
            <section className="border overflow-hidden" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#FAF7F2" }}>
              <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "#C8B89A" }}>
                <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "1.15rem", color: "#1C0A00" }}>Where Impact Is Concentrated</h2>
                <button onClick={() => onNavigate("civic-map")}
                  className="hover:opacity-60 transition-opacity"
                  style={{ fontFamily: "var(--font-mono)", fontSize: "0.54rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#3A6B9B" }}>
                  Explore Civic Map →
                </button>
              </div>
              <div style={{ background: "#E8E0CE", position: "relative" }}>
                <svg viewBox="0 0 700 320" style={{ display: "block", width: "100%" }}>
                  <rect width="700" height="320" fill="#E8E0CE"/>
                  {[60,130,200,270].map(y => <line key={y} x1="0" y1={y} x2="700" y2={y} stroke="#D4C9B0" strokeWidth="0.4" opacity="0.6"/>)}
                  {[80,200,340,480,620].map(x => <line key={x} x1={x} y1="0" x2={x} y2="320" stroke="#D4C9B0" strokeWidth="0.4" opacity="0.6"/>)}
                  {/* Roads */}
                  <rect x="0" y="140" width="700" height="20" fill="#D4C9B0"/>
                  <rect x="290" y="0" width="18" height="320" fill="#D4C9B0"/>
                  <rect x="0" y="240" width="700" height="12" fill="#D4C9B0"/>
                  <rect x="480" y="0" width="14" height="320" fill="#D4C9B0"/>
                  <rect x="110" y="0" width="14" height="320" fill="#D4C9B0"/>
                  <line x1="0" y1="150" x2="700" y2="150" stroke="#C8B89A" strokeWidth="0.7" strokeDasharray="12 9"/>
                  <line x1="299" y1="0" x2="299" y2="320" stroke="#C8B89A" strokeWidth="0.7" strokeDasharray="12 9"/>
                  {/* City blocks */}
                  {[[10,10,90,120],[130,10,150,120],[315,10,155,120],[510,10,180,120],
                    [10,170,90,60],[130,170,150,60],[315,170,155,60],[510,170,155,60],
                    [10,250,90,60],[130,250,150,60],[315,250,155,60],[510,250,155,60]
                  ].map(([x,y,w,h],i) => <rect key={i} x={x} y={y} width={w} height={h} fill="#D9D1BE" stroke="#C8B89A" strokeWidth="0.5"/>)}
                  {/* Water */}
                  <path d="M0 295 Q120 278 260 290 Q380 302 500 285 L500 320 L0 320 Z" fill="#BFCEDA" opacity="0.5"/>
                  {/* Park */}
                  <rect x="130" y="10" width="150" height="60" fill="#D4DEAD" opacity="0.6"/>

                  {/* Hotspot clusters */}
                  {hotspots.map(h => {
                    const cx = (h.x / 100) * 700;
                    const cy = (h.y / 100) * 320;
                    const r  = 8 + (h.count / 100) * 18;
                    const isHov = hoveredHotspot === h.id;
                    return (
                      <g key={h.id} style={{ cursor: "pointer" }}
                        onMouseEnter={() => setHoveredHotspot(h.id)}
                        onMouseLeave={() => setHoveredHotspot(null)}
                        onClick={() => onNavigate("civic-map")}>
                        <circle cx={cx} cy={cy} r={r + 6} fill={h.color} opacity={isHov ? 0.2 : 0.1}/>
                        <circle cx={cx} cy={cy} r={r}     fill={h.color} opacity={isHov ? 0.8 : 0.55}/>
                        <circle cx={cx} cy={cy} r={4}     fill="white"   opacity="0.9"/>
                        {/* Count badge */}
                        <rect x={cx + r - 2} y={cy - r - 12} width="26" height="14" fill="rgba(28,10,0,0.75)" rx="1"/>
                        <text x={cx + r + 11} y={cy - r - 2} textAnchor="middle" fill="#F5F0E8" fontSize="8" fontFamily="monospace">{h.count}</text>
                        {isHov && (
                          <g>
                            <rect x={cx - 55} y={cy + r + 4} width="110" height="18" fill="rgba(28,10,0,0.8)" rx="1"/>
                            <text x={cx} y={cy + r + 16} textAnchor="middle" fill="#F5F0E8" fontSize="8" fontFamily="monospace">{h.label}</text>
                          </g>
                        )}
                      </g>
                    );
                  })}

                  {/* Legend */}
                  {[["#9B3A3A","Very Urgent"],["#C4622D","Urgent"],["#3A6B9B","In Progress"],["#4A7C5F","Resolved"],["#B8872A","Disputed"]].map(([col, lbl], i) => (
                    <g key={lbl} transform={`translate(14, ${14 + i * 18})`}>
                      <circle cx="5" cy="5" r="5" fill={col} opacity="0.7"/>
                      <text x="14" y="9" fill="#1C0A00" fontSize="8.5" fontFamily="var(--font-mono)" opacity="0.65">{lbl}</text>
                    </g>
                  ))}
                </svg>
              </div>
            </section>
          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <div className="space-y-5">

            {/* CIVIC IMPACT SCORE explainer */}
            <div className="border overflow-hidden" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#FAF7F2" }}>
              <button className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#EDE5D4] transition-colors"
                onClick={() => setScoreExpanded(o => !o)}>
                <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "1rem", color: "#1C0A00" }}>Civic Impact Score</h3>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: scoreExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s", opacity: 0.4 }}>
                  <path d="M2 4 L6 8 L10 4" stroke="#1C0A00" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
              </button>

              <div className="px-5 pb-1 flex items-center gap-4 border-t" style={{ borderColor: "#EDE5D4" }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "2.8rem", color: "#1C0A00", lineHeight: 1, paddingTop: 14, paddingBottom: 10 }}>
                  87<span style={{ fontSize: "1rem", opacity: 0.3, fontStyle: "normal" }}> / 100</span>
                </div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "#5C4A32", opacity: 0.6, lineHeight: 1.55 }}>
                  A higher score means greater urgency, community impact, persistence, or accountability significance.
                </div>
              </div>

              {scoreExpanded && (
                <div className="px-5 pb-4 pt-2 border-t space-y-2.5" style={{ borderColor: "#EDE5D4" }}>
                  {scoreFactors.map(({ label, pts, color }) => (
                    <div key={label}>
                      <div className="flex items-center justify-between mb-1">
                        <span style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "#1C0A00", opacity: 0.75 }}>{label}</span>
                        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.9rem", color }}>+{pts}</span>
                      </div>
                      <div className="h-1 rounded-full" style={{ background: "#EDE5D4" }}>
                        <div className="h-1 rounded-full" style={{ width: `${(pts / 25) * 100}%`, background: color, opacity: 0.65 }}/>
                      </div>
                    </div>
                  ))}
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", color: "#5C4A32", opacity: 0.45, lineHeight: 1.5, paddingTop: 6, letterSpacing: "0.04em" }}>
                    Score is NOT simply complaint count. It weights urgency, persistence, community support and accountability history.
                  </p>
                </div>
              )}
            </div>

            {/* PRIORITY DISTRIBUTION */}
            <div className="border overflow-hidden" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#FAF7F2" }}>
              <div className="px-5 py-3 border-b" style={{ borderColor: "#C8B89A" }}>
                <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "1rem", color: "#1C0A00" }}>Priority Distribution</h3>
              </div>
              <div className="px-5 py-4 space-y-3">
                {[
                  { label: "Very Urgent", count: 128, color: "#9B3A3A", total: 1284 },
                  { label: "Urgent",      count: 402, color: "#C4622D", total: 1284 },
                  { label: "Normal",      count: 754, color: "#5C4A32", total: 1284 },
                ].map(({ label, count, color, total }) => (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.56rem", letterSpacing: "0.08em", textTransform: "uppercase", color }}>{label}</span>
                      <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", color }}>{count}</span>
                    </div>
                    <div className="h-2 rounded-full" style={{ background: "#EDE5D4" }}>
                      <div className="h-2 rounded-full" style={{ width: `${(count / total) * 100}%`, background: color, opacity: 0.65 }}/>
                    </div>
                  </div>
                ))}
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.74rem", color: "#5C4A32", opacity: 0.55, lineHeight: 1.55, paddingTop: 4, fontStyle: "italic" }}>
                  "Very urgent issues represent a smaller share of reports, but carry disproportionate civic impact."
                </p>
              </div>
            </div>

            {/* UNRESOLVED AGING */}
            <div className="border overflow-hidden" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#FAF7F2" }}>
              <div className="px-5 py-3 border-b" style={{ borderColor: "#C8B89A" }}>
                <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "1rem", color: "#1C0A00" }}>How Long Issues Stay Unresolved</h3>
              </div>
              <div className="px-5 py-4 space-y-2.5">
                {aging.map(({ label, count, concern }) => (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-1">
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.54rem", letterSpacing: "0.06em", color: concern ? "#9B3A3A" : "#5C4A32", opacity: concern ? 1 : 0.7 }}>{label}</span>
                      <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.9rem", color: concern ? "#9B3A3A" : "#1C0A00" }}>{count}</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: "#EDE5D4" }}>
                      <div className="h-1.5 rounded-full" style={{ width: `${(count / maxAging) * 100}%`, background: concern ? "#9B3A3A" : "#C8B89A", opacity: concern ? 0.7 : 0.45 }}/>
                    </div>
                  </div>
                ))}
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", color: "#9B3A3A", opacity: 0.7, lineHeight: 1.5, paddingTop: 4, fontStyle: "italic" }}>
                  Long-running unresolved complaints trigger escalation when they exceed their expected response window.
                </p>
              </div>
            </div>

            {/* COMMUNITY SIGNAL */}
            <div className="border overflow-hidden" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#EDE5D4" }}>
              <div className="px-5 py-3 border-b" style={{ borderColor: "#C8B89A" }}>
                <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "1rem", color: "#1C0A00" }}>Community Signal</h3>
              </div>
              <div className="px-5 py-4 space-y-3">
                <div>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "2rem", color: "#1C0A00", lineHeight: 1 }}>1,932</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.45, marginTop: 2 }}>Supporting Reports</div>
                </div>
                {[
                  { label: "Top Category",    value: "Roads & Infrastructure" },
                  { label: "Rising Area",     value: "Central District" },
                  { label: "Repeated Issue",  value: "Drainage overflow (×7)" },
                ].map(({ label, value }, i, arr) => (
                  <div key={label} className="flex justify-between items-start py-2" style={{ borderTop: "1px solid #C8B89A", opacity: 0.8 }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.09em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.45 }}>{label}</span>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "#1C0A00", textAlign: "right" }}>{value}</span>
                  </div>
                ))}
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", color: "#5C4A32", opacity: 0.55, lineHeight: 1.5, fontStyle: "italic" }}>
                  Duplicate reports are consolidated into meaningful community signals via AI spatial deduplication.
                </p>
              </div>
            </div>

            {/* ACCOUNTABILITY SNAPSHOT */}
            <div className="border overflow-hidden" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#FAF7F2" }}>
              <div className="px-5 py-3 border-b" style={{ borderColor: "#C8B89A" }}>
                <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "1rem", color: "#1C0A00" }}>Accountability Snapshot</h3>
              </div>
              <div className="px-5 py-3 space-y-0">
                {accountabilityRows.map(({ label, value, link, nav }, i, arr) => (
                  <div key={label} className="py-3 flex flex-col gap-0.5" style={{ borderBottom: i < arr.length - 1 ? "1px solid #EDE5D4" : "none" }}>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.4 }}>{label}</div>
                    <div style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", color: "#1C0A00" }}>{value}</div>
                    <button onClick={() => onNavigate(nav)} className="text-left hover:opacity-60 transition-opacity"
                      style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.07em", color: "#3A6B9B", marginTop: 1 }}>{link}</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Decorative rule ── */}
        <div className="flex items-center gap-4 my-12">
          <div className="flex-1 h-px" style={{ background: "#C8B89A" }}/>
          <div className="w-1.5 h-1.5 rotate-45" style={{ background: "#C8B89A" }}/>
          <div className="flex-1 h-px" style={{ background: "#C8B89A" }}/>
        </div>

        {/* ── Bottom CTA ── */}
        <div className="border overflow-hidden" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#1C0A00" }}>
          <div className="px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "1.7rem", color: "#F5F0E8", lineHeight: 1.1, marginBottom: 8 }}>
                See the Issues Behind the Numbers.
              </h2>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.9rem", color: "#C8B89A", opacity: 0.65, lineHeight: 1.6, maxWidth: 480 }}>
                Explore individual complaints, verified timelines, and the evidence behind every civic record.
              </p>
            </div>
            <div className="flex flex-col gap-3 flex-shrink-0">
              <button onClick={() => onNavigate("civic-map")} className="px-8 py-3.5 hover:opacity-90 transition-opacity"
                style={{ background: "#F5F0E8", color: "#1C0A00", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.62rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                Explore Civic Map
              </button>
              <button onClick={() => onNavigate("verification")} className="px-8 py-3.5 border hover:opacity-80 transition-opacity"
                style={{ borderColor: "#C8B89A40", color: "#C8B89A", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.62rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                Verify a Complaint
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 pt-6 border-t flex flex-wrap items-center justify-between gap-3" style={{ borderColor: "#C8B89A" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "#5C4A32", opacity: 0.4 }}>
            © 2026 CivicTrace · Civic Impact Dashboard · Demo data for illustration only.
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#4A7C5F" }}/>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "#5C4A32", opacity: 0.4 }}>Open · On-chain · Verifiable</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PAGE 18 — About CivicTrace ───────────────────────────────────────────────
function AboutPage({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const steps = [
    { n: "01", label: "REPORT",    desc: "Citizens submit evidence-backed civic issues with photos, location, and context." },
    { n: "02", label: "TRACK",     desc: "Every complaint receives a unique identity and a transparent lifecycle on the platform." },
    { n: "03", label: "VERIFY",    desc: "Evidence, timestamps and lifecycle events create an independently verifiable record." },
    { n: "04", label: "ESCALATE",  desc: "Issues that remain unresolved move upward through accountability workflows automatically." },
  ];

  const comparisons = [
    { traditional: "Submitted",              civictrace: "Submitted + Evidence" },
    { traditional: "Status Unknown",         civictrace: "Trackable Lifecycle" },
    { traditional: "Duplicate Reports",      civictrace: "AI Consolidation" },
    { traditional: '"Resolved" Claim',       civictrace: "Resolution Evidence" },
    { traditional: "No Response",            civictrace: "Escalation" },
    { traditional: "Limited Transparency",   civictrace: "Public Verification" },
  ];

  const problems = [
    "Complaints can disappear into opaque systems with no accountability.",
    "Citizens may not know who acted, when, or whether the issue was genuinely fixed.",
    "Resolution is difficult to verify without independent evidence.",
    "Duplicate complaints create noise rather than amplified civic signal.",
    "Unresolved issues can remain invisible without an escalation mechanism.",
  ];

  const onChainSteps = [
    "Complaint Created", "Status Updated", "Evidence Recorded", "Resolution Submitted", "Citizen Verification",
  ];

  return (
    <div style={{ background: "#F5F0E8", minHeight: "100vh", fontFamily: "var(--font-body)" }}>

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 border-b" style={{ background: "rgba(245,240,232,0.97)", borderColor: "#C8B89A", backdropFilter: "blur(8px)" }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <button onClick={() => onNavigate("home")} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <CivicTraceLogo size={30}/>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", color: "#1C0A00" }}>CivicTrace</span>
          </button>
          <div className="hidden md:flex items-center gap-6">
            {[
              { l: "Civic Map",  p: "civic-map" },
              { l: "Leaderboard", p: "leaderboard" },
              { l: "Impact",     p: "impact-dashboard" },
              { l: "About",      p: "about" },
            ].map(({ l, p }) => (
              <button key={p} onClick={() => onNavigate(p as Page)} className="hover:opacity-60 transition-opacity"
                style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase",
                  color: p === "about" ? "#1C0A00" : "#5C4A32",
                  borderBottom: p === "about" ? "1px solid #1C0A00" : "none", paddingBottom: "1px" }}>{l}</button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => onNavigate("auth")} className="px-3 py-2 border hover:bg-[#EDE5D4] transition-colors"
              style={{ borderColor: "#C8B89A", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.08em", color: "#5C4A32", textTransform: "uppercase" }}>Sign In</button>
            <button onClick={() => onNavigate("report-category")} className="px-4 py-2 hover:opacity-90 transition-opacity"
              style={{ background: "#1C0A00", color: "#F5F0E8", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>Report an Issue</button>
          </div>
        </div>
      </nav>

      {/* ══ HERO ══ */}
      <section className="border-b" style={{ borderColor: "#C8B89A", background: "#FAF7F2" }}>
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.4, marginBottom: 14 }}>
                About CivicTrace
              </div>
              <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontStyle: "italic", fontSize: "clamp(2.4rem, 5vw, 4rem)", color: "#1C0A00", lineHeight: 1.0, marginBottom: 20 }}>
                Accountability<br/>Should Leave<br/>a Trace.
              </h1>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "1rem", color: "#5C4A32", lineHeight: 1.75, opacity: 0.75, marginBottom: 28, maxWidth: 480 }}>
                CivicTrace is a privacy-first civic accountability platform that helps citizens report problems, track what happens next, and verify whether the promised fix actually happened.
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <button onClick={() => onNavigate("report-category")} className="px-7 py-3.5 hover:opacity-90 transition-opacity"
                  style={{ background: "#1C0A00", color: "#F5F0E8", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.62rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                  Report an Issue
                </button>
                <button onClick={() => onNavigate("civic-map")} className="px-7 py-3.5 border hover:bg-[#EDE5D4] transition-colors"
                  style={{ borderColor: "#C8B89A", color: "#1C0A00", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.62rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                  How It Works
                </button>
              </div>
            </div>

            {/* Hero illustration: lifecycle flow */}
            <div className="flex justify-center">
              <svg viewBox="0 0 340 280" style={{ width: "100%", maxWidth: 380 }}>
                {/* Background card */}
                <rect x="10" y="10" width="320" height="260" fill="#F5F0E8" stroke="#C8B89A" strokeWidth="1" rx="2"/>
                <rect x="10" y="10" width="320" height="3" fill="#1C0A00" rx="0"/>

                {/* Citizen box */}
                <rect x="30" y="35" width="80" height="48" fill="#EDE5D4" stroke="#C8B89A" strokeWidth="1" rx="1"/>
                <text x="70" y="56" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="7" fill="#5C4A32" letterSpacing="1">CITIZEN</text>
                <text x="70" y="70" textAnchor="middle" fontFamily="var(--font-display)" fontSize="9" fontWeight="700" fill="#1C0A00">Reports Issue</text>

                {/* Arrow right */}
                <path d="M114 59 L148 59" stroke="#C8B89A" strokeWidth="1.2" markerEnd="url(#arrow)"/>
                <defs>
                  <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                    <path d="M0,0 L6,3 L0,6 Z" fill="#C8B89A"/>
                  </marker>
                </defs>

                {/* CivicTrace box */}
                <rect x="150" y="35" width="90" height="48" fill="#1C0A00" rx="1"/>
                <text x="195" y="56" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="6.5" fill="#C8B89A" letterSpacing="1">CIVICTRACE</text>
                <text x="195" y="70" textAnchor="middle" fontFamily="var(--font-display)" fontSize="9" fontWeight="700" fill="#F5F0E8">Verified Record</text>

                {/* Arrow right */}
                <path d="M244 59 L276 59" stroke="#C8B89A" strokeWidth="1.2" markerEnd="url(#arrow)"/>

                {/* Authority box */}
                <rect x="278" y="35" width="40" height="48" fill="#EDE5D4" stroke="#C8B89A" strokeWidth="1" rx="1"/>
                <text x="298" y="52" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="6" fill="#5C4A32" letterSpacing="0.5">AUTH</text>
                <text x="298" y="64" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="6" fill="#5C4A32" letterSpacing="0.5">ORITY</text>
                <text x="298" y="76" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="6" fill="#4A7C5F" letterSpacing="0.5">ACTS</text>

                {/* Down arrow from Authority */}
                <path d="M298 87 L298 118" stroke="#C8B89A" strokeWidth="1.2" markerEnd="url(#arrow)"/>

                {/* Resolution box */}
                <rect x="248" y="120" width="90" height="40" fill="#EEF4F0" stroke="#4A7C5F" strokeWidth="1" rx="1"/>
                <circle cx="264" cy="140" r="6" fill="#4A7C5F"/>
                <path d="M261 140 L263 142 L267 137" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                <text x="302" y="136" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="6.5" fill="#4A7C5F" letterSpacing="0.5">RESOLUTION</text>
                <text x="302" y="149" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="6.5" fill="#4A7C5F" letterSpacing="0.5">EVIDENCED</text>

                {/* Lifecycle chain below */}
                <line x1="30" y1="115" x2="220" y2="115" stroke="#EDE5D4" strokeWidth="1"/>
                <text x="30" y="132" fontFamily="var(--font-mono)" fontSize="6.5" fill="#5C4A32" opacity="0.5">LIFECYCLE</text>
                {["REPORTED", "ASSESSED", "IN PROGRESS", "RESOLVED"].map((s, i) => {
                  const x = 30 + i * 50;
                  const done = i < 3;
                  return (
                    <g key={s}>
                      <circle cx={x} cy={148} r={5} fill={done ? "#1C0A00" : "#EDE5D4"} stroke="#C8B89A" strokeWidth="0.8"/>
                      {i < 3 && <line x1={x + 5} y1={148} x2={x + 45} y2={148} stroke="#C8B89A" strokeWidth="0.8" strokeDasharray="3 2"/>}
                      <text x={x} y={162} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="5" fill="#5C4A32" opacity="0.55">{s.split(" ")[0]}</text>
                    </g>
                  );
                })}

                {/* Privacy note */}
                <rect x="30" y="178" width="280" height="36" fill="#EDE5D4" rx="1"/>
                <text x="170" y="194" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="6.5" fill="#5C4A32" letterSpacing="0.5">CITIZEN IDENTITY · PRIVATE</text>
                <text x="170" y="207" textAnchor="middle" fontFamily="var(--font-body)" fontSize="7.5" fill="#1C0A00" opacity="0.6">Complaint and resolution are publicly visible and verifiable.</text>

                {/* Watermark label */}
                <text x="170" y="248" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="7" fill="#5C4A32" opacity="0.25" letterSpacing="2">CIVICTRACE ACCOUNTABILITY FRAMEWORK</text>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* ── Decorative rule ── */}
      <div className="flex items-center gap-4 my-0">
        <div className="flex-1 h-px" style={{ background: "#C8B89A" }}/>
        <div className="w-1.5 h-1.5 rotate-45 mx-6 my-10" style={{ background: "#C8B89A" }}/>
        <div className="flex-1 h-px" style={{ background: "#C8B89A" }}/>
      </div>

      {/* ══ THE PROBLEM ══ */}
      <section className="border-b" style={{ borderColor: "#C8B89A" }}>
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.4, marginBottom: 10 }}>
                The Problem
              </div>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "clamp(1.6rem, 3vw, 2.4rem)", color: "#1C0A00", lineHeight: 1.1, marginBottom: 18 }}>
                The Problem Isn't Reporting.<br/>It's What Happens After.
              </h2>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.93rem", color: "#5C4A32", lineHeight: 1.75, opacity: 0.75, marginBottom: 14 }}>
                Citizens already report potholes, broken streetlights, water leaks, overflowing bins, unsafe roads and other civic problems.
              </p>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.93rem", color: "#1C0A00", lineHeight: 1.75, marginBottom: 22, fontStyle: "italic" }}>
                But after submitting a complaint, one question often remains: <strong>What happened next?</strong>
              </p>
              <div className="space-y-2.5">
                {problems.map((p, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-4 h-4 border flex-shrink-0 mt-0.5 flex items-center justify-center" style={{ borderColor: "#9B3A3A", background: "#F8EEEE", borderRadius: "1px" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "#9B3A3A" }}>×</span>
                    </div>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "0.84rem", color: "#5C4A32", lineHeight: 1.6 }}>{p}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* The gap illustration */}
            <div className="flex justify-center items-start pt-6">
              <div className="border overflow-hidden" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#FAF7F2", width: "100%", maxWidth: 320 }}>
                <div className="h-0.5" style={{ background: "#9B3A3A" }}/>
                {[
                  { label: "REPORT", sub: "Citizen submits complaint", color: "#4A7C5F", bg: "#EEF4F0" },
                  { label: "?", sub: "Unknown · Invisible · Unverifiable", color: "#9B3A3A", bg: "#F8EEEE", large: true },
                  { label: "ACTION", sub: "Issue resolved — or is it?", color: "#3A6B9B", bg: "#EEF3F8" },
                ].map(({ label, sub, color, bg, large }, i, arr) => (
                  <div key={label}>
                    <div className="px-6 py-5 flex items-center gap-4" style={{ background: bg }}>
                      <div className="w-12 h-12 border flex items-center justify-center flex-shrink-0"
                        style={{ borderColor: color, background: "white", borderRadius: "1px" }}>
                        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: large ? "1.6rem" : "0.85rem", color, fontStyle: "italic" }}>{label}</span>
                      </div>
                      <div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.1em", textTransform: "uppercase", color, marginBottom: 3 }}>{label}</div>
                        <div style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "#5C4A32", lineHeight: 1.5 }}>{sub}</div>
                      </div>
                    </div>
                    {i < arr.length - 1 && (
                      <div className="flex justify-center py-2" style={{ borderTop: "1px solid #EDE5D4", borderBottom: "1px solid #EDE5D4" }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "1rem", color: "#C8B89A" }}>↓</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ OUR APPROACH ══ */}
      <section className="border-b" style={{ borderColor: "#C8B89A", background: "#FAF7F2" }}>
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.4, marginBottom: 10 }}>
              Our Approach
            </div>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "clamp(1.6rem, 3vw, 2.4rem)", color: "#1C0A00", lineHeight: 1.1 }}>
              From Complaint to Verifiable Record.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((s, i) => (
              <div key={s.n} className="border overflow-hidden" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#F5F0E8" }}>
                <div className="h-0.5" style={{ background: i === 0 ? "#4A7C5F" : i === 1 ? "#3A6B9B" : i === 2 ? "#B8872A" : "#9B3A3A" }}/>
                <div className="px-5 py-5">
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.35, marginBottom: 6 }}>
                    Step {s.n}
                  </div>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "1.3rem", color: "#1C0A00", marginBottom: 10 }}>{s.label}</div>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "0.83rem", color: "#5C4A32", lineHeight: 1.65, opacity: 0.75 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PRIVACY FIRST ══ */}
      <section className="border-b" style={{ borderColor: "#C8B89A" }}>
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Privacy diagram */}
            <div className="flex justify-center">
              <svg viewBox="0 0 320 220" style={{ width: "100%", maxWidth: 360 }}>
                <rect x="10" y="10" width="300" height="200" fill="#FAF7F2" stroke="#C8B89A" strokeWidth="1" rx="2"/>
                {/* Citizen section */}
                <rect x="30" y="30" width="120" height="60" fill="#EDE5D4" stroke="#C8B89A" strokeWidth="0.8" rx="1"/>
                <text x="90" y="55" textAnchor="middle" fontFamily="var(--font-display)" fontSize="10" fontWeight="700" fill="#1C0A00">Citizen</text>
                <text x="90" y="70" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="7" fill="#5C4A32" opacity="0.5">Identity</text>
                <rect x="160" y="42" width="50" height="18" fill="#9B3A3A10" stroke="#9B3A3A" strokeWidth="0.8" rx="1"/>
                <text x="185" y="55" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="6.5" fontWeight="700" fill="#9B3A3A">PRIVATE</text>

                {/* Divider */}
                <line x1="30" y1="108" x2="290" y2="108" stroke="#EDE5D4" strokeWidth="1" strokeDasharray="4 3"/>
                <text x="165" y="122" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="6" fill="#C8B89A" letterSpacing="2">SEPARATED BY DESIGN</text>

                {/* Civic issue + verification */}
                <rect x="30" y="132" width="110" height="36" fill="#EEF4F0" stroke="#4A7C5F" strokeWidth="0.8" rx="1"/>
                <text x="85" y="147" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="7" fill="#4A7C5F" letterSpacing="0.5">CIVIC ISSUE</text>
                <rect x="160" y="138" width="44" height="18" fill="#4A7C5F20" stroke="#4A7C5F" strokeWidth="0.8" rx="1"/>
                <text x="182" y="151" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="6.5" fontWeight="700" fill="#4A7C5F">PUBLIC</text>

                <rect x="30" y="176" width="130" height="22" fill="#EEF3F8" stroke="#3A6B9B" strokeWidth="0.8" rx="1"/>
                <text x="95" y="191" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="7" fill="#3A6B9B" letterSpacing="0.5">VERIFICATION RECORD</text>
                <rect x="172" y="180" width="44" height="14" fill="#3A6B9B20" stroke="#3A6B9B" strokeWidth="0.8" rx="1"/>
                <text x="194" y="191" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="6.5" fontWeight="700" fill="#3A6B9B">PUBLIC</text>
              </svg>
            </div>

            <div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.4, marginBottom: 10 }}>
                Privacy First
              </div>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "clamp(1.6rem, 3vw, 2.2rem)", color: "#1C0A00", lineHeight: 1.1, marginBottom: 18 }}>
                Accountability Without Exposing the Citizen.
              </h2>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.92rem", color: "#5C4A32", lineHeight: 1.75, opacity: 0.75, marginBottom: 14 }}>
                CivicTrace separates citizen identity from the public complaint record. Authorities can act on the issue without needing access to the complainant's personal identity.
              </p>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.92rem", color: "#5C4A32", lineHeight: 1.75, opacity: 0.75 }}>
                The platform is designed to reduce unnecessary exposure, bias, and pressure on citizens who want to hold their city accountable without putting themselves at risk.
              </p>
              <div className="mt-6 border px-5 py-4" style={{ borderColor: "#C8B89A40", background: "#EDE5D4", borderRadius: "2px" }}>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "#1C0A00", lineHeight: 1.65, fontStyle: "italic" }}>
                  "The civic record is public. The citizen behind it is not."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ WHY WEB3 ══ */}
      <section className="border-b" style={{ borderColor: "#C8B89A", background: "#FAF7F2" }}>
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.4, marginBottom: 10 }}>
                Verification Layer
              </div>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "clamp(1.5rem, 3vw, 2.2rem)", color: "#1C0A00", lineHeight: 1.1, marginBottom: 18 }}>
                Why a Verifiable Record?
              </h2>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.92rem", color: "#5C4A32", lineHeight: 1.75, opacity: 0.75, marginBottom: 14 }}>
                CivicTrace uses blockchain technology as a verification layer — not as a marketplace, wallet, or financial system.
              </p>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.92rem", color: "#5C4A32", lineHeight: 1.75, opacity: 0.75, marginBottom: 18 }}>
                Important verification events can be independently checked, while private information and full evidence files remain off-chain.
              </p>
              <button onClick={() => onNavigate("verification")} className="border px-5 py-2.5 hover:bg-[#EDE5D4] transition-colors"
                style={{ borderColor: "#C8B89A", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.1em", color: "#3A6B9B", textTransform: "uppercase" }}>
                Explore Verification →
              </button>
            </div>

            {/* On-chain steps */}
            <div className="border overflow-hidden" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#F5F0E8" }}>
              <div className="px-5 py-3 border-b" style={{ borderColor: "#C8B89A" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.45 }}>Verified Event Timeline</span>
              </div>
              <div className="px-5 py-4">
                {onChainSteps.map((s, i) => (
                  <div key={s} className="flex items-start gap-3 pb-3" style={{ borderBottom: i < onChainSteps.length - 1 ? "1px solid #EDE5D4" : "none", marginBottom: i < onChainSteps.length - 1 ? 12 : 0 }}>
                    <div className="flex flex-col items-center flex-shrink-0 mt-0.5">
                      <div className="w-5 h-5 rounded-full border flex items-center justify-center"
                        style={{ borderColor: "#3A6B9B", background: "#EEF3F8" }}>
                        <div className="w-2 h-2 rounded-full" style={{ background: "#3A6B9B" }}/>
                      </div>
                      {i < onChainSteps.length - 1 && <div className="w-px flex-1 mt-1" style={{ background: "#C8B89A", height: 16 }}/>}
                    </div>
                    <div>
                      <div style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "#1C0A00", fontWeight: 500 }}>{s}</div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", color: "#4A7C5F", letterSpacing: "0.06em", marginTop: 2 }}>✓ Recorded · Independently verifiable</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ AI + COMMUNITY ══ */}
      <section className="border-b" style={{ borderColor: "#C8B89A" }}>
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Signal visual */}
            <div className="flex justify-center">
              <div className="border overflow-hidden" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#FAF7F2", width: "100%", maxWidth: 320 }}>
                <div className="h-0.5" style={{ background: "#3A6B9B" }}/>
                <div className="px-6 py-5 border-b text-center" style={{ borderColor: "#C8B89A" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.4, marginBottom: 8 }}>Original Complaint</div>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.95rem", color: "#1C0A00" }}>Overflowing drain on Canal Road</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", color: "#3A6B9B", marginTop: 4 }}>CTY-82341-C</div>
                </div>
                <div className="px-6 py-3 border-b text-center" style={{ borderColor: "#C8B89A", background: "#EDE5D4" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", color: "#5C4A32", opacity: 0.5 }}>AI detected 17 nearby similar reports</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "#C4622D", marginTop: 2 }}>↓  Consolidated into one civic signal</div>
                </div>
                <div className="px-6 py-5 text-center">
                  <div className="flex items-center justify-center gap-4 mb-3">
                    <div className="text-center">
                      <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "2rem", color: "#1C0A00", lineHeight: 1 }}>1</div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.48rem", color: "#5C4A32", opacity: 0.4 }}>ORIGINAL</div>
                    </div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.2rem", color: "#C8B89A" }}>+</div>
                    <div className="text-center">
                      <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "2rem", color: "#C4622D", lineHeight: 1 }}>17</div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.48rem", color: "#5C4A32", opacity: 0.4 }}>SUPPORTING</div>
                    </div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.2rem", color: "#C8B89A" }}>=</div>
                    <div className="text-center">
                      <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.3rem", color: "#3A6B9B", lineHeight: 1 }}>1 Signal</div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.48rem", color: "#3A6B9B", opacity: 0.7 }}>AMPLIFIED</div>
                    </div>
                  </div>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "0.76rem", color: "#5C4A32", opacity: 0.55, lineHeight: 1.55, fontStyle: "italic" }}>
                    A stronger signal is harder to ignore.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.4, marginBottom: 10 }}>
                AI + Community
              </div>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "clamp(1.5rem, 3vw, 2.2rem)", color: "#1C0A00", lineHeight: 1.1, marginBottom: 18 }}>
                Smarter Reports.<br/>Stronger Signals.
              </h2>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.92rem", color: "#5C4A32", lineHeight: 1.75, opacity: 0.75, marginBottom: 14 }}>
                AI identifies likely duplicate complaints using geographic proximity, image similarity, and issue category. Instead of creating dozens of fragmented reports, citizens can support an existing issue.
              </p>
              <div className="space-y-2 mt-4">
                {["Geographic proximity analysis", "Image similarity detection", "Category and keyword matching"].map(f => (
                  <div key={f} className="flex items-center gap-2.5">
                    <div className="w-4 h-4 border flex-shrink-0 flex items-center justify-center" style={{ borderColor: "#3A6B9B", background: "#EEF3F8", borderRadius: "1px" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "#3A6B9B" }}>✓</span>
                    </div>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "0.84rem", color: "#5C4A32", opacity: 0.75 }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ THE CIVICTRACE PRINCIPLE — pullquote ══ */}
      <section style={{ background: "#1C0A00" }}>
        <div className="max-w-7xl mx-auto px-6 py-20 text-center">
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "#C8B89A", opacity: 0.45, marginBottom: 24 }}>
            The CivicTrace Principle
          </div>
          <blockquote style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontStyle: "italic", fontSize: "clamp(2rem, 5vw, 3.8rem)", color: "#F5F0E8", lineHeight: 1.1, maxWidth: 700, margin: "0 auto 20px" }}>
            "A complaint can be ignored.
          </blockquote>
          <blockquote style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontStyle: "italic", fontSize: "clamp(2rem, 5vw, 3.8rem)", color: "#C8B89A", lineHeight: 1.1, maxWidth: 700, margin: "0 auto 28px" }}>
            A verified record cannot."
          </blockquote>
          <div className="flex items-center gap-4 justify-center">
            <div className="flex-1 h-px max-w-32" style={{ background: "#C8B89A30" }}/>
            <div className="w-1.5 h-1.5 rotate-45" style={{ background: "#C8B89A40" }}/>
            <div className="flex-1 h-px max-w-32" style={{ background: "#C8B89A30" }}/>
          </div>
        </div>
      </section>

      {/* ══ COMPARISON ══ */}
      <section className="border-b" style={{ borderColor: "#C8B89A", background: "#FAF7F2" }}>
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.4, marginBottom: 10, textAlign: "center" }}>
            What Makes CivicTrace Different
          </div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "clamp(1.5rem, 3vw, 2.2rem)", color: "#1C0A00", lineHeight: 1.1, marginBottom: 32, textAlign: "center" }}>
            Traditional Complaint vs CivicTrace
          </h2>
          <div className="border overflow-hidden" style={{ borderColor: "#C8B89A", borderRadius: "2px", maxWidth: 680, margin: "0 auto" }}>
            {/* Header row */}
            <div className="grid grid-cols-2 border-b" style={{ borderColor: "#C8B89A" }}>
              <div className="px-6 py-3 border-r" style={{ borderColor: "#C8B89A", background: "#EDE5D4" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.54rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#9B3A3A" }}>Traditional Complaint</span>
              </div>
              <div className="px-6 py-3" style={{ background: "#1C0A00" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.54rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#C8B89A" }}>CivicTrace</span>
              </div>
            </div>
            {comparisons.map(({ traditional, civictrace }, i) => (
              <div key={i} className="grid grid-cols-2" style={{ borderBottom: i < comparisons.length - 1 ? "1px solid #EDE5D4" : "none" }}>
                <div className="px-6 py-4 border-r flex items-center gap-2" style={{ borderColor: "#EDE5D4", background: i % 2 === 0 ? "#F5F0E8" : "#FAF7F2" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", color: "#9B3A3A", flexShrink: 0 }}>×</span>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: "0.84rem", color: "#5C4A32", opacity: 0.65 }}>{traditional}</span>
                </div>
                <div className="px-6 py-4 flex items-center gap-2" style={{ background: i % 2 === 0 ? "#F5F0E8" : "#FAF7F2" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", color: "#4A7C5F", flexShrink: 0 }}>✓</span>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: "0.84rem", color: "#1C0A00", fontWeight: 500 }}>{civictrace}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CLOSING CTA ══ */}
      <section className="border-b" style={{ borderColor: "#C8B89A" }}>
        <div className="max-w-7xl mx-auto px-6 py-16 text-center">
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "clamp(1.8rem, 4vw, 3rem)", color: "#1C0A00", lineHeight: 1.05, marginBottom: 14 }}>
            Make Civic Problems Visible.
          </h2>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "1rem", color: "#5C4A32", opacity: 0.65, lineHeight: 1.7, marginBottom: 28 }}>
            Report what matters. Track what happens. Verify what gets fixed.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button onClick={() => onNavigate("report-category")} className="px-8 py-3.5 hover:opacity-90 transition-opacity"
              style={{ background: "#1C0A00", color: "#F5F0E8", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.64rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Report an Issue
            </button>
            <button onClick={() => onNavigate("civic-map")} className="px-8 py-3.5 border hover:bg-[#EDE5D4] transition-colors"
              style={{ borderColor: "#C8B89A", color: "#1C0A00", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.64rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Explore Civic Map
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t" style={{ borderColor: "#C8B89A", background: "#FAF7F2" }}>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <CivicTraceLogo size={28}/>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.95rem", color: "#1C0A00" }}>CivicTrace</span>
            </div>
            <div className="flex items-center gap-6 flex-wrap">
              {[
                { l: "Home",         p: "home" },
                { l: "Civic Map",    p: "civic-map" },
                { l: "About",        p: "about" },
                { l: "Leaderboard",  p: "leaderboard" },
                { l: "Impact",       p: "impact-dashboard" },
              ].map(({ l, p }) => (
                <button key={p} onClick={() => onNavigate(p as Page)} className="hover:opacity-60 transition-opacity"
                  style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.1em", textTransform: "uppercase",
                    color: p === "about" ? "#1C0A00" : "#5C4A32",
                    fontWeight: p === "about" ? 700 : 400 }}>{l}</button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#4A7C5F" }}/>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", color: "#5C4A32", opacity: 0.4 }}>Privacy-first · Open · Verifiable</span>
            </div>
          </div>
          <div className="mt-6 pt-5 border-t" style={{ borderColor: "#EDE5D4" }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", color: "#5C4A32", opacity: 0.35, letterSpacing: "0.06em" }}>
              © 2026 CivicTrace · Citizen identity is never publicly exposed · Complaint records are publicly verifiable
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── PAGE 19 — How It Works ───────────────────────────────────────────────────
function HowItWorksPage({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const [aiChoice, setAiChoice] = useState<"support" | "new" | null>(null);
  const [proofChoice, setProofChoice] = useState<"resolved" | "reopened" | null>(null);

  const STEPS = [
    { n: "01", label: "REPORT",    color: "#4A7C5F" },
    { n: "02", label: "EVIDENCE",  color: "#3A6B9B" },
    { n: "03", label: "AI CHECK",  color: "#B8872A" },
    { n: "04", label: "TRACK",     color: "#5C4A32" },
    { n: "05", label: "AUTHORITY", color: "#C4622D" },
    { n: "06", label: "PROOF",     color: "#9B3A3A" },
    { n: "07", label: "ESCALATE",  color: "#9B3A3A" },
    { n: "08", label: "VERIFY",    color: "#3A6B9B" },
  ];

  const lifecycleSteps = [
    { label: "Reported",        color: "#9B3A3A", active: true  },
    { label: "Assessed",        color: "#C4622D", active: true  },
    { label: "Assigned",        color: "#5C4A32", active: true  },
    { label: "In Progress",     color: "#3A6B9B", active: true  },
    { label: "Proof Submitted", color: "#6A5C8A", active: false },
    { label: "Resolved",        color: "#4A7C5F", active: false },
  ];

  const verifyEvents = [
    { label: "Complaint Created",     checks: ["Timestamp", "Complaint ID"] },
    { label: "Assigned to Dept",      checks: ["Timestamp"] },
    { label: "Status Changed",        checks: ["Timestamp"] },
    { label: "Evidence Hash",         checks: ["Verification Record"] },
    { label: "Resolution Submitted",  checks: ["Timestamp"] },
    { label: "Reopened / Escalated",  checks: ["Timestamp"] },
  ];

  const NavBar = () => (
    <nav className="sticky top-0 z-50 border-b" style={{ background: "rgba(245,240,232,0.97)", borderColor: "#C8B89A", backdropFilter: "blur(8px)" }}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
        <button onClick={() => onNavigate("home")} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <CivicTraceLogo size={30}/>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", color: "#1C0A00" }}>CivicTrace</span>
        </button>
        <div className="hidden md:flex items-center gap-6">
          {([
            { l: "How It Works", p: "how-it-works" },
            { l: "About",        p: "about" },
            { l: "Civic Map",    p: "civic-map" },
            { l: "Leaderboard",  p: "leaderboard" },
          ] as { l: string; p: Page }[]).map(({ l, p }) => (
            <button key={p} onClick={() => onNavigate(p)} className="hover:opacity-60 transition-opacity"
              style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase",
                color: p === "how-it-works" ? "#1C0A00" : "#5C4A32",
                borderBottom: p === "how-it-works" ? "1px solid #1C0A00" : "none", paddingBottom: "1px" }}>{l}</button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => onNavigate("auth")} className="px-3 py-2 border hover:bg-[#EDE5D4] transition-colors"
            style={{ borderColor: "#C8B89A", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.08em", color: "#5C4A32", textTransform: "uppercase" }}>Sign In</button>
          <button onClick={() => onNavigate("report-category")} className="px-4 py-2 hover:opacity-90 transition-opacity"
            style={{ background: "#1C0A00", color: "#F5F0E8", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>Report an Issue</button>
        </div>
      </div>
    </nav>
  );

  return (
    <div style={{ background: "#F5F0E8", minHeight: "100vh", fontFamily: "var(--font-body)" }}>
      <NavBar/>

      {/* ══ HERO ══ */}
      <section className="border-b" style={{ borderColor: "#C8B89A", background: "#FAF7F2" }}>
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-24">
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.4, marginBottom: 14 }}>
            How It Works
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontStyle: "italic", fontSize: "clamp(2.2rem, 5vw, 3.8rem)", color: "#1C0A00", lineHeight: 1.0, marginBottom: 18, maxWidth: 720 }}>
            From Report to<br/>Verified Resolution.
          </h1>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "1rem", color: "#5C4A32", lineHeight: 1.75, opacity: 0.7, marginBottom: 28, maxWidth: 560 }}>
            CivicTrace turns a simple civic complaint into a trackable, evidence-backed and verifiable accountability record.
          </p>

          {/* Step pills */}
          <div className="flex flex-wrap gap-2 mb-10">
            {STEPS.map(s => (
              <div key={s.n} className="flex items-center gap-2 border px-3 py-1.5"
                style={{ borderColor: "#C8B89A", background: "#F5F0E8", borderRadius: "1px" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", color: "#5C4A32", opacity: 0.4 }}>{s.n}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.08em", color: s.color, fontWeight: 700 }}>{s.label}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={() => onNavigate("report-category")} className="px-7 py-3.5 hover:opacity-90 transition-opacity"
              style={{ background: "#1C0A00", color: "#F5F0E8", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.62rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Report an Issue
            </button>
            <button onClick={() => onNavigate("civic-map")} className="px-7 py-3.5 border hover:bg-[#EDE5D4] transition-colors"
              style={{ borderColor: "#C8B89A", color: "#1C0A00", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.62rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Explore Civic Map
            </button>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6">

        {/* ══ STEP 01 — REPORT ══ */}
        <section className="py-16 border-b" style={{ borderColor: "#C8B89A" }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="border px-3 py-1" style={{ borderColor: "#4A7C5F", background: "#EEF4F0", borderRadius: "1px" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.12em", color: "#4A7C5F", fontWeight: 700 }}>01 — REPORT</span>
                </div>
              </div>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "clamp(1.5rem, 3vw, 2.2rem)", color: "#1C0A00", lineHeight: 1.1, marginBottom: 14 }}>
                Report the Issue
              </h2>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.92rem", color: "#5C4A32", lineHeight: 1.75, opacity: 0.75, marginBottom: 20 }}>
                Start with a civic problem that needs attention. Choose a category, describe the issue, capture evidence, and set the priority.
              </p>
              {/* Categories */}
              <div className="grid grid-cols-2 gap-2 mb-5">
                {["Roads & Infrastructure", "Water & Drainage", "Sanitation", "Public Safety", "Parks & Public Spaces", "Environment"].map(c => (
                  <div key={c} className="border px-3 py-2 flex items-center gap-2" style={{ borderColor: "#C8B89A", background: "#FAF7F2", borderRadius: "1px" }}>
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#4A7C5F" }}/>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "#1C0A00" }}>{c}</span>
                  </div>
                ))}
              </div>
              {/* Priority pills */}
              <div className="flex gap-2">
                {[{ l: "Normal", c: "#5C4A32" }, { l: "Urgent", c: "#C4622D" }, { l: "Very Urgent", c: "#9B3A3A" }].map(({ l, c }) => (
                  <div key={l} className="border px-3 py-1" style={{ borderColor: c + "60", background: c + "10", borderRadius: "1px" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.54rem", letterSpacing: "0.08em", color: c, fontWeight: 700 }}>{l.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Reporting flow diagram */}
            <div className="border overflow-hidden" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#FAF7F2" }}>
              <div className="h-0.5" style={{ background: "#4A7C5F" }}/>
              <div className="px-5 py-4 border-b" style={{ borderColor: "#C8B89A" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.4 }}>Complaint Creation Flow</span>
              </div>
              {["Choose Category", "Describe the Issue", "Capture Evidence", "Confirm Location", "Set Priority", "Submit"].map((s, i, arr) => (
                <div key={s} className="flex items-center gap-4 px-5 py-3" style={{ borderBottom: i < arr.length - 1 ? "1px solid #EDE5D4" : "none" }}>
                  <div className="w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0"
                    style={{ borderColor: "#4A7C5F", background: "#EEF4F0" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", color: "#4A7C5F", fontWeight: 700 }}>{String(i + 1).padStart(2, "0")}</span>
                  </div>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "#1C0A00" }}>{s}</span>
                  {i === arr.length - 1 && (
                    <span className="ml-auto border px-2 py-0.5" style={{ borderColor: "#4A7C5F40", background: "#EEF4F0", borderRadius: "1px" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", color: "#4A7C5F", fontWeight: 700 }}>✓ RECORD CREATED</span>
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ STEP 02 — EVIDENCE ══ */}
        <section className="py-16 border-b" style={{ borderColor: "#C8B89A" }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Evidence card */}
            <div className="border overflow-hidden order-2 lg:order-1" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#FAF7F2" }}>
              <div className="h-0.5" style={{ background: "#3A6B9B" }}/>
              <div className="px-5 py-4 border-b" style={{ borderColor: "#C8B89A" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.4 }}>Evidence Record · CTY-48291-X</span>
              </div>
              <div className="px-5 py-4 space-y-3">
                {[
                  { label: "PHOTO", value: "pothole_sector_x.jpg", icon: "📷" },
                  { label: "LOCATION", value: "Sector X, Central Road — 28.6139° N", icon: "📍" },
                  { label: "TIMESTAMP", value: "13 Sep 2026 · 14:32", icon: "🕐" },
                  { label: "EVIDENCE HASH", value: "sha256: 7f4c…a921", icon: "🔒" },
                ].map(({ label, value, icon }) => (
                  <div key={label} className="flex items-start gap-3 py-2.5 border-b" style={{ borderColor: "#EDE5D4" }}>
                    <span style={{ fontSize: "0.9rem", flexShrink: 0 }}>{icon}</span>
                    <div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.48rem", letterSpacing: "0.1em", color: "#5C4A32", opacity: 0.4, marginBottom: 2 }}>{label}</div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "#1C0A00" }}>{value}</div>
                    </div>
                  </div>
                ))}
                <div className="pt-1 flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: "#4A7C5F" }}>
                    <span style={{ color: "white", fontSize: "0.55rem" }}>✓</span>
                  </div>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", color: "#4A7C5F", letterSpacing: "0.06em" }}>Fingerprint recorded · Full photo remains off-chain</span>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="border px-3 py-1" style={{ borderColor: "#3A6B9B", background: "#EEF3F8", borderRadius: "1px" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.12em", color: "#3A6B9B", fontWeight: 700 }}>02 — EVIDENCE</span>
                </div>
              </div>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "clamp(1.5rem, 3vw, 2.2rem)", color: "#1C0A00", lineHeight: 1.1, marginBottom: 14 }}>
                Capture Proof
              </h2>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.92rem", color: "#5C4A32", lineHeight: 1.75, opacity: 0.75, marginBottom: 14 }}>
                CivicTrace records useful context around submitted evidence, including location, timestamp and a digital evidence fingerprint.
              </p>
              <div className="border px-5 py-4" style={{ borderColor: "#C8B89A40", background: "#EDE5D4", borderRadius: "2px" }}>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.84rem", color: "#1C0A00", lineHeight: 1.65, fontStyle: "italic" }}>
                  "The full photo and private information remain off-chain. A digital fingerprint can be used to verify that evidence has not been altered."
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ══ STEP 03 — AI CHECK ══ */}
        <section className="py-16 border-b" style={{ borderColor: "#C8B89A" }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="border px-3 py-1" style={{ borderColor: "#B8872A", background: "#FBF6EB", borderRadius: "1px" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.12em", color: "#B8872A", fontWeight: 700 }}>03 — AI CHECK</span>
                </div>
              </div>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "clamp(1.5rem, 3vw, 2.2rem)", color: "#1C0A00", lineHeight: 1.1, marginBottom: 14 }}>
                Find the Signal
              </h2>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.92rem", color: "#5C4A32", lineHeight: 1.75, opacity: 0.75, marginBottom: 20 }}>
                Before creating another complaint, CivicTrace checks whether a similar issue has already been reported nearby.
              </p>
              {/* Similarity result */}
              <div className="border overflow-hidden mb-5" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#FAF7F2" }}>
                <div className="px-5 py-3 border-b" style={{ borderColor: "#C8B89A", background: "#FBF6EB" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.1em", color: "#B8872A", fontWeight: 700 }}>POSSIBLE DUPLICATE DETECTED</span>
                </div>
                <div className="px-5 py-3 grid grid-cols-3 divide-x" style={{ borderColor: "#EDE5D4" }}>
                  {[{ n: "87%", l: "Similarity" }, { n: "120m", l: "Distance" }, { n: "Same", l: "Category" }].map(({ n, l }) => (
                    <div key={l} className="text-center px-3">
                      <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.2rem", color: "#B8872A" }}>{n}</div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.48rem", letterSpacing: "0.08em", color: "#5C4A32", opacity: 0.5 }}>{l.toUpperCase()}</div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Interactive choice */}
              {aiChoice === null ? (
                <div className="flex gap-2">
                  <button onClick={() => setAiChoice("support")} className="flex-1 py-3 border hover:bg-[#EEF4F0] transition-colors"
                    style={{ borderColor: "#4A7C5F", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.08em", color: "#4A7C5F", textTransform: "uppercase" }}>
                    Support Existing Issue
                  </button>
                  <button onClick={() => setAiChoice("new")} className="flex-1 py-3 border hover:bg-[#EDE5D4] transition-colors"
                    style={{ borderColor: "#C8B89A", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.08em", color: "#5C4A32", textTransform: "uppercase" }}>
                    Report as New
                  </button>
                </div>
              ) : aiChoice === "support" ? (
                <div className="border px-5 py-4" style={{ borderColor: "#4A7C5F40", background: "#EEF4F0", borderRadius: "2px" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.1em", color: "#4A7C5F", marginBottom: 4 }}>✓ SUPPORTING REPORT ADDED</div>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "#1C0A00" }}>Your report strengthens the civic signal for CTY-82341-C. The existing complaint now shows 15 supporting reports.</div>
                  <button onClick={() => setAiChoice(null)} className="mt-3 hover:opacity-60 transition-opacity" style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", color: "#5C4A32", opacity: 0.5, textTransform: "uppercase", letterSpacing: "0.08em" }}>Reset demo →</button>
                </div>
              ) : (
                <div className="border px-5 py-4" style={{ borderColor: "#3A6B9B40", background: "#EEF3F8", borderRadius: "2px" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.1em", color: "#3A6B9B", marginBottom: 4 }}>NEW COMPLAINT CREATED</div>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "#1C0A00" }}>A new complaint has been created: <strong>CTY-84917-Z</strong>. It will be assessed independently and may be merged later if confirmed as a duplicate.</div>
                  <button onClick={() => setAiChoice(null)} className="mt-3 hover:opacity-60 transition-opacity" style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", color: "#5C4A32", opacity: 0.5, textTransform: "uppercase", letterSpacing: "0.08em" }}>Reset demo →</button>
                </div>
              )}
            </div>

            {/* AI signal diagram */}
            <div className="border overflow-hidden" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#FAF7F2" }}>
              <div className="h-0.5" style={{ background: "#B8872A" }}/>
              <div className="px-5 py-4 border-b" style={{ borderColor: "#C8B89A" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.4 }}>AI Deduplication Signal</span>
              </div>
              <div className="px-5 py-5 space-y-3">
                {[
                  { label: "New Report",       detail: "Overflowing drain, Canal Road",  color: "#3A6B9B" },
                  { label: "Nearby Reports",   detail: "12 reports within 200m",          color: "#B8872A" },
                  { label: "Image Similarity", detail: "87% visual match",                color: "#C4622D" },
                  { label: "Category Match",   detail: "Water & Drainage",                color: "#4A7C5F" },
                ].map(({ label, detail, color }, i, arr) => (
                  <div key={label}>
                    <div className="flex items-center gap-3 py-2.5">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }}/>
                      <div className="flex-1">
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.08em", color, fontWeight: 700 }}>{label.toUpperCase()}</div>
                        <div style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", color: "#5C4A32", opacity: 0.7 }}>{detail}</div>
                      </div>
                    </div>
                    {i < arr.length - 1 && <div className="flex justify-center"><span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "#C8B89A" }}>+</span></div>}
                  </div>
                ))}
                <div className="border-t pt-3 flex items-center gap-3" style={{ borderColor: "#C8B89A" }}>
                  <div className="w-2 h-2 rotate-45 flex-shrink-0" style={{ background: "#B8872A" }}/>
                  <div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.08em", color: "#B8872A", fontWeight: 700 }}>= POSSIBLE DUPLICATE</div>
                    <div style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", color: "#5C4A32", opacity: 0.6 }}>Citizen is offered a choice</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══ STEP 04 — TRACK ══ */}
        <section className="py-16 border-b" style={{ borderColor: "#C8B89A" }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="border px-3 py-1" style={{ borderColor: "#5C4A32", background: "#F0EAE0", borderRadius: "1px" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.12em", color: "#5C4A32", fontWeight: 700 }}>04 — TRACK</span>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "clamp(1.5rem, 3vw, 2.2rem)", color: "#1C0A00", lineHeight: 1.1, marginBottom: 14 }}>
                Follow What Happens Next
              </h2>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.92rem", color: "#5C4A32", lineHeight: 1.75, opacity: 0.75, marginBottom: 18 }}>
                Every important stage becomes part of the complaint's visible lifecycle. Citizens can follow progress at any time without revealing their identity.
              </p>
              <div className="border px-4 py-3 flex items-center gap-3" style={{ borderColor: "#C8B89A", background: "#FAF7F2", borderRadius: "2px" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", color: "#5C4A32", opacity: 0.4 }}>COMPLAINT ID</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "#3A6B9B", fontWeight: 700 }}>CTY-48291-X</div>
              </div>
              {/* Alternate states */}
              <div className="mt-6 space-y-2">
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.4, marginBottom: 6 }}>Alternate lifecycle states</div>
                {[
                  { label: "UNRESOLVED", color: "#9B3A3A", bg: "#F8EEEE" },
                  { label: "ESCALATED",  color: "#9B3A3A", bg: "#F8EEEE" },
                  { label: "DISPUTED / REOPENED", color: "#B8872A", bg: "#FBF6EB" },
                ].map(({ label, color, bg }) => (
                  <div key={label} className="flex items-center gap-2 border px-3 py-2" style={{ borderColor: color + "40", background: bg, borderRadius: "1px" }}>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }}/>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.56rem", letterSpacing: "0.08em", color, fontWeight: 700 }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Lifecycle rail */}
            <div className="border overflow-hidden" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#FAF7F2" }}>
              <div className="h-0.5" style={{ background: "#5C4A32" }}/>
              <div className="px-5 py-4 border-b" style={{ borderColor: "#C8B89A" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.4 }}>Complaint Lifecycle · CTY-48291-X</span>
              </div>
              <div className="px-5 py-4">
                {lifecycleSteps.map((s, i) => (
                  <div key={s.label} className="flex items-start gap-4 pb-4" style={{ borderBottom: i < lifecycleSteps.length - 1 ? "1px dashed #EDE5D4" : "none", marginBottom: i < lifecycleSteps.length - 1 ? 12 : 0 }}>
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className="w-5 h-5 rounded-full border flex items-center justify-center"
                        style={{ borderColor: s.active ? s.color : "#C8B89A", background: s.active ? s.color + "20" : "transparent" }}>
                        {s.active && <div className="w-2 h-2 rounded-full" style={{ background: s.color }}/>}
                      </div>
                    </div>
                    <div className="flex-1 pt-0.5">
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.08em", color: s.active ? s.color : "#C8B89A", fontWeight: s.active ? 700 : 400 }}>{s.label.toUpperCase()}</div>
                      {s.active && <div style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", color: "#5C4A32", opacity: 0.55, marginTop: 2 }}>
                        {i === 0 ? "13 Sep 2026 · 14:32" : i === 1 ? "13 Sep 2026 · 15:10" : i === 2 ? "13 Sep 2026 · 16:02" : i === 3 ? "14 Sep 2026 · 09:20" : ""}
                      </div>}
                    </div>
                    {i === 3 && <div className="border px-2 py-0.5" style={{ borderColor: "#3A6B9B40", background: "#EEF3F8", borderRadius: "1px", flexShrink: 0 }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.48rem", color: "#3A6B9B" }}>CURRENT</span>
                    </div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ══ STEP 05 — AUTHORITY ══ */}
        <section className="py-16 border-b" style={{ borderColor: "#C8B89A" }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="border px-3 py-1" style={{ borderColor: "#C4622D", background: "#FBF0EA", borderRadius: "1px" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.12em", color: "#C4622D", fontWeight: 700 }}>05 — AUTHORITY</span>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "clamp(1.5rem, 3vw, 2.2rem)", color: "#1C0A00", lineHeight: 1.1, marginBottom: 14 }}>
                The Work Gets Tracked
              </h2>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.92rem", color: "#5C4A32", lineHeight: 1.75, opacity: 0.75, marginBottom: 14 }}>
                Once assigned, the department is responsible for progressing the complaint and uploading resolution evidence. An authority cannot simply mark an issue resolved without submitting proof.
              </p>
              {/* Authority flow */}
              {["Complaint Received", "Assigned to Department", "Work Started", "Resolution Evidence Uploaded"].map((s, i, arr) => (
                <div key={s} className="flex items-center gap-3 py-2" style={{ borderBottom: i < arr.length - 1 ? "1px solid #EDE5D4" : "none" }}>
                  <div className="w-5 h-5 border rounded-full flex items-center justify-center flex-shrink-0" style={{ borderColor: "#C4622D", background: "#FBF0EA" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.45rem", color: "#C4622D", fontWeight: 700 }}>{String(i + 1).padStart(2, "0")}</span>
                  </div>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "#1C0A00" }}>{s}</span>
                </div>
              ))}
              <button onClick={() => onNavigate("leaderboard")} className="mt-6 border px-5 py-2.5 hover:bg-[#EDE5D4] transition-colors"
                style={{ borderColor: "#C8B89A", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.1em", color: "#C4622D", textTransform: "uppercase" }}>
                View Authority Performance →
              </button>
            </div>
            {/* Authority dashboard preview */}
            <div className="border overflow-hidden" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#FAF7F2" }}>
              <div className="h-0.5" style={{ background: "#C4622D" }}/>
              <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: "#C8B89A" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.4 }}>Complaint · CTY-48291-X</span>
                <span className="border px-2 py-0.5" style={{ borderColor: "#3A6B9B40", background: "#EEF3F8", borderRadius: "1px" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.48rem", color: "#3A6B9B", fontWeight: 700 }}>IN PROGRESS</span>
                </span>
              </div>
              <div className="px-5 py-4 space-y-3">
                {[
                  { label: "Priority",         value: "URGENT",    color: "#C4622D" },
                  { label: "Civic Impact",     value: "87 / 100",  color: "#1C0A00" },
                  { label: "Supporting",       value: "17 citizens", color: "#1C0A00" },
                  { label: "Age",              value: "2 days",    color: "#1C0A00" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between py-2 border-b" style={{ borderColor: "#EDE5D4" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.45 }}>{label}</span>
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.9rem", color }}>{value}</span>
                  </div>
                ))}
                <div className="pt-1 border px-4 py-3" style={{ borderColor: "#9B3A3A40", background: "#F8EEEE", borderRadius: "1px" }}>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "#9B3A3A", fontStyle: "italic" }}>Resolution evidence required before this complaint can be marked resolved.</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══ STEP 06 — PROOF OF FIX ══ */}
        <section className="py-16 border-b" style={{ borderColor: "#C8B89A" }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="border px-3 py-1" style={{ borderColor: "#9B3A3A", background: "#F8EEEE", borderRadius: "1px" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.12em", color: "#9B3A3A", fontWeight: 700 }}>06 — PROOF OF FIX</span>
            </div>
          </div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "clamp(1.5rem, 3vw, 2.2rem)", color: "#1C0A00", lineHeight: 1.1, marginBottom: 14 }}>
            Resolution Needs Evidence
          </h2>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.92rem", color: "#5C4A32", lineHeight: 1.75, opacity: 0.75, marginBottom: 20, maxWidth: 560 }}>
            When an authority submits resolution evidence, the citizen can review and confirm whether the fix is genuine.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6" style={{ maxWidth: 640 }}>
            {[
              { side: "ORIGINAL EVIDENCE", label: "Before", color: "#9B3A3A", bg: "#F8EEEE" },
              { side: "RESOLUTION EVIDENCE", label: "After", color: "#4A7C5F", bg: "#EEF4F0" },
            ].map(({ side, label, color, bg }) => (
              <div key={side} className="border overflow-hidden" style={{ borderColor: color + "60", background: bg, borderRadius: "2px" }}>
                <div className="px-4 py-2 border-b" style={{ borderColor: color + "30" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.1em", textTransform: "uppercase", color, fontWeight: 700 }}>{side}</span>
                </div>
                <div className="px-4 py-8 flex items-center justify-center">
                  <div className="border border-dashed w-full h-20 flex items-center justify-center" style={{ borderColor: color + "40" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color, opacity: 0.5 }}>{label} Photo</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.9rem", color: "#1C0A00", fontStyle: "italic", marginBottom: 14 }}>Does the fix actually solve the issue?</p>

          {proofChoice === null ? (
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setProofChoice("resolved")} className="px-6 py-3 hover:opacity-90 transition-opacity"
                style={{ background: "#4A7C5F", color: "#F5F0E8", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Yes, It's Fixed
              </button>
              <button onClick={() => setProofChoice("reopened")} className="px-6 py-3 border hover:bg-[#F8EEEE] transition-colors"
                style={{ borderColor: "#9B3A3A", color: "#9B3A3A", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                No, Reopen
              </button>
            </div>
          ) : proofChoice === "resolved" ? (
            <div className="border px-5 py-4" style={{ borderColor: "#4A7C5F40", background: "#EEF4F0", borderRadius: "2px", maxWidth: 480 }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.54rem", letterSpacing: "0.1em", color: "#4A7C5F", marginBottom: 6, fontWeight: 700 }}>✓ COMPLAINT → RESOLVED</div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "#1C0A00", lineHeight: 1.6 }}>The complaint has been resolved. The verified resolution event is recorded with a timestamp.</div>
              <button onClick={() => setProofChoice(null)} className="mt-3 hover:opacity-60 transition-opacity" style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", color: "#5C4A32", opacity: 0.5, textTransform: "uppercase", letterSpacing: "0.08em" }}>Reset demo →</button>
            </div>
          ) : (
            <div className="border px-5 py-4" style={{ borderColor: "#B8872A40", background: "#FBF6EB", borderRadius: "2px", maxWidth: 520 }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.54rem", letterSpacing: "0.1em", color: "#B8872A", marginBottom: 6, fontWeight: 700 }}>COMPLAINT → DISPUTED / REOPENED</div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "#1C0A00", lineHeight: 1.6, marginBottom: 8 }}>The authority is notified and the issue returns to an active accountability workflow. The reopen event is recorded.</div>
              <button onClick={() => setProofChoice(null)} className="hover:opacity-60 transition-opacity" style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", color: "#5C4A32", opacity: 0.5, textTransform: "uppercase", letterSpacing: "0.08em" }}>Reset demo →</button>
            </div>
          )}
        </section>

        {/* ══ STEP 07 — ESCALATION ══ */}
        <section className="py-16 border-b" style={{ borderColor: "#C8B89A" }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="border px-3 py-1" style={{ borderColor: "#9B3A3A", background: "#F8EEEE", borderRadius: "1px" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.12em", color: "#9B3A3A", fontWeight: 700 }}>07 — ESCALATION</span>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "clamp(1.5rem, 3vw, 2.2rem)", color: "#1C0A00", lineHeight: 1.1, marginBottom: 14 }}>
                Silence Doesn't End the Record
              </h2>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.92rem", color: "#5C4A32", lineHeight: 1.75, opacity: 0.75, marginBottom: 18 }}>
                If an issue remains inactive beyond its expected response window, CivicTrace marks it unresolved and escalates it to a higher authority.
              </p>
              <div className="space-y-3 mt-2">
                {[
                  { p: "VERY URGENT", desc: "Fastest expected response window", color: "#9B3A3A" },
                  { p: "URGENT",      desc: "Shorter standard response window",  color: "#C4622D" },
                  { p: "NORMAL",      desc: "Standard civic response window",    color: "#5C4A32" },
                ].map(({ p, desc, color }) => (
                  <div key={p} className="flex items-center gap-3 border px-4 py-3" style={{ borderColor: color + "40", background: color + "08", borderRadius: "1px" }}>
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }}/>
                    <div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.54rem", letterSpacing: "0.08em", color, fontWeight: 700 }}>{p}</div>
                      <div style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "#5C4A32", opacity: 0.65 }}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Escalation flow */}
            <div className="border overflow-hidden" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#FAF7F2" }}>
              <div className="h-0.5" style={{ background: "#9B3A3A" }}/>
              <div className="px-5 py-4 border-b" style={{ borderColor: "#C8B89A" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.4 }}>Automatic Escalation Flow</span>
              </div>
              {[
                { label: "Complaint Submitted",        color: "#5C4A32", alert: false },
                { label: "Expected Response Window",   color: "#B8872A", alert: false },
                { label: "No Meaningful Update",       color: "#C4622D", alert: true  },
                { label: "UNRESOLVED",                 color: "#9B3A3A", alert: true  },
                { label: "ESCALATED → Higher Authority",color: "#9B3A3A", alert: true  },
              ].map((s, i, arr) => (
                <div key={s.label} className="flex items-center gap-4 px-5 py-3" style={{ borderBottom: i < arr.length - 1 ? "1px solid #EDE5D4" : "none", background: s.alert ? "#F8EEEE" : "transparent" }}>
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }}/>
                  <span style={{ fontFamily: s.alert ? "var(--font-mono)" : "var(--font-body)", fontWeight: s.alert ? 700 : 400, fontSize: s.alert ? "0.6rem" : "0.85rem", color: s.color, letterSpacing: s.alert ? "0.06em" : 0 }}>{s.label}</span>
                  {i < arr.length - 1 && <span className="ml-auto" style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "#C8B89A" }}>↓</span>}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ STEP 08 — VERIFY ══ */}
        <section className="py-16 border-b" style={{ borderColor: "#C8B89A" }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="border px-3 py-1" style={{ borderColor: "#3A6B9B", background: "#EEF3F8", borderRadius: "1px" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.12em", color: "#3A6B9B", fontWeight: 700 }}>08 — VERIFY</span>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "clamp(1.5rem, 3vw, 2.2rem)", color: "#1C0A00", lineHeight: 1.1, marginBottom: 14 }}>
                Every Important Event Leaves a Trace
              </h2>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.92rem", color: "#5C4A32", lineHeight: 1.75, opacity: 0.75, marginBottom: 14 }}>
                Blockchain acts as a verification layer for important lifecycle events. It does not replace the application's database or store private citizen information.
              </p>
              <button onClick={() => onNavigate("verification")} className="border px-5 py-2.5 hover:bg-[#EEF3F8] transition-colors"
                style={{ borderColor: "#3A6B9B", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.1em", color: "#3A6B9B", textTransform: "uppercase" }}>
                Verify a Complaint →
              </button>
            </div>
            {/* Verify events */}
            <div className="border overflow-hidden" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#FAF7F2" }}>
              <div className="h-0.5" style={{ background: "#3A6B9B" }}/>
              <div className="px-5 py-4 border-b" style={{ borderColor: "#C8B89A" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.4 }}>Verification Record · CTY-48291-X</span>
              </div>
              {verifyEvents.map((e, i) => (
                <div key={e.label} className="px-5 py-3 flex items-start gap-4" style={{ borderBottom: i < verifyEvents.length - 1 ? "1px solid #EDE5D4" : "none" }}>
                  <div className="flex flex-col items-center pt-0.5">
                    <div className="w-4 h-4 rounded-full border flex items-center justify-center" style={{ borderColor: "#3A6B9B", background: "#EEF3F8" }}>
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#3A6B9B" }}/>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div style={{ fontFamily: "var(--font-body)", fontSize: "0.83rem", color: "#1C0A00", fontWeight: 500 }}>{e.label}</div>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {e.checks.map(c => (
                        <span key={c} style={{ fontFamily: "var(--font-mono)", fontSize: "0.48rem", color: "#4A7C5F", letterSpacing: "0.06em" }}>✓ {c}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ COMPLETE JOURNEY ══ */}
        <section className="py-16 border-b" style={{ borderColor: "#C8B89A" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.4, marginBottom: 10 }}>The Complete Journey</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "clamp(1.5rem, 3vw, 2.2rem)", color: "#1C0A00", marginBottom: 28 }}>
            The Full CivicTrace Flow
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Main path */}
            <div className="border overflow-hidden" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#FAF7F2" }}>
              <div className="h-0.5" style={{ background: "#4A7C5F" }}/>
              <div className="px-4 py-3 border-b" style={{ borderColor: "#C8B89A" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#4A7C5F", fontWeight: 700 }}>Primary Path</span>
              </div>
              {["REPORT", "CAPTURE EVIDENCE", "AI CHECK", "TRACK", "AUTHORITY ACTION", "PROOF OF FIX", "CITIZEN VERIFICATION", "RESOLVED"].map((s, i, arr) => (
                <div key={s} className="flex items-center gap-3 px-4 py-2.5" style={{ borderBottom: i < arr.length - 1 ? "1px solid #EDE5D4" : "none" }}>
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: i === arr.length - 1 ? "#4A7C5F" : "#C8B89A" }}/>
                  <span style={{ fontFamily: i === arr.length - 1 ? "var(--font-mono)" : "var(--font-body)", fontSize: i === arr.length - 1 ? "0.58rem" : "0.82rem", color: i === arr.length - 1 ? "#4A7C5F" : "#1C0A00", fontWeight: i === arr.length - 1 ? 700 : 400, letterSpacing: i === arr.length - 1 ? "0.08em" : 0 }}>{s}</span>
                </div>
              ))}
            </div>
            {/* Unresolved path */}
            <div className="border overflow-hidden" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#FAF7F2" }}>
              <div className="h-0.5" style={{ background: "#9B3A3A" }}/>
              <div className="px-4 py-3 border-b" style={{ borderColor: "#C8B89A" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#9B3A3A", fontWeight: 700 }}>If Ignored</span>
              </div>
              {["TRACK", "No Response", "UNRESOLVED", "ESCALATED"].map((s, i, arr) => (
                <div key={s} className="flex items-center gap-3 px-4 py-2.5" style={{ borderBottom: i < arr.length - 1 ? "1px solid #EDE5D4" : "none", background: i >= 2 ? "#F8EEEE" : "transparent" }}>
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: i >= 2 ? "#9B3A3A" : "#C8B89A" }}/>
                  <span style={{ fontFamily: i >= 2 ? "var(--font-mono)" : "var(--font-body)", fontSize: i >= 2 ? "0.58rem" : "0.82rem", color: i >= 2 ? "#9B3A3A" : "#1C0A00", fontWeight: i >= 2 ? 700 : 400, letterSpacing: i >= 2 ? "0.08em" : 0 }}>{s}</span>
                </div>
              ))}
            </div>
            {/* Disputed path */}
            <div className="border overflow-hidden" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#FAF7F2" }}>
              <div className="h-0.5" style={{ background: "#B8872A" }}/>
              <div className="px-4 py-3 border-b" style={{ borderColor: "#C8B89A" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#B8872A", fontWeight: 700 }}>If Disputed</span>
              </div>
              {["RESOLVED", "Citizen Disputes", "DISPUTED / REOPENED", "Back to Accountability"].map((s, i, arr) => (
                <div key={s} className="flex items-center gap-3 px-4 py-2.5" style={{ borderBottom: i < arr.length - 1 ? "1px solid #EDE5D4" : "none", background: i >= 2 ? "#FBF6EB" : "transparent" }}>
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: i >= 2 ? "#B8872A" : "#C8B89A" }}/>
                  <span style={{ fontFamily: i >= 2 ? "var(--font-mono)" : "var(--font-body)", fontSize: i >= 2 ? "0.58rem" : "0.82rem", color: i >= 2 ? "#B8872A" : "#1C0A00", fontWeight: i >= 2 ? 700 : 400, letterSpacing: i >= 2 ? "0.08em" : 0 }}>{s}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ WHY THIS MATTERS ══ */}
        <section className="py-16 border-b" style={{ borderColor: "#C8B89A" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.4, marginBottom: 10 }}>Why This Matters</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "clamp(1.5rem, 3vw, 2.2rem)", color: "#1C0A00", marginBottom: 28 }}>
            Because Reporting Is Only the Beginning.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: "Visibility",     desc: "Citizens can see what happens after reporting. The complaint's lifecycle is never hidden.", color: "#4A7C5F" },
              { title: "Evidence",       desc: "Important actions can be backed by verifiable records. Resolution requires proof, not just a status change.", color: "#3A6B9B" },
              { title: "Accountability", desc: "Unresolved or disputed issues remain visible instead of disappearing. Silence triggers escalation.", color: "#9B3A3A" },
            ].map(({ title, desc, color }) => (
              <div key={title} className="border overflow-hidden" style={{ borderColor: "#C8B89A", borderRadius: "2px", background: "#FAF7F2" }}>
                <div className="h-0.5" style={{ background: color }}/>
                <div className="px-5 py-5">
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontStyle: "italic", fontSize: "1.2rem", color: "#1C0A00", marginBottom: 10 }}>{title}</div>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "0.84rem", color: "#5C4A32", lineHeight: 1.7, opacity: 0.75 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ══ PULLQUOTE CTA ══ */}
      <section style={{ background: "#1C0A00" }}>
        <div className="max-w-7xl mx-auto px-6 py-20 text-center">
          <blockquote style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontStyle: "italic", fontSize: "clamp(1.8rem, 4vw, 3.4rem)", color: "#F5F0E8", lineHeight: 1.1, marginBottom: 10 }}>
            "A complaint can be ignored.
          </blockquote>
          <blockquote style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontStyle: "italic", fontSize: "clamp(1.8rem, 4vw, 3.4rem)", color: "#C8B89A", lineHeight: 1.1, marginBottom: 24 }}>
            A verified record cannot."
          </blockquote>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.95rem", color: "#C8B89A", opacity: 0.6, lineHeight: 1.7, marginBottom: 28 }}>
            Report what matters. Track what happens. Verify what gets fixed.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button onClick={() => onNavigate("report-category")} className="px-8 py-3.5 hover:opacity-90 transition-opacity"
              style={{ background: "#F5F0E8", color: "#1C0A00", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.64rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Report an Issue
            </button>
            <button onClick={() => onNavigate("civic-map")} className="px-8 py-3.5 border hover:opacity-80 transition-opacity"
              style={{ borderColor: "#C8B89A40", color: "#C8B89A", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.64rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Explore Civic Map
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t" style={{ borderColor: "#C8B89A", background: "#FAF7F2" }}>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <CivicTraceLogo size={28}/>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.95rem", color: "#1C0A00" }}>CivicTrace</span>
            </div>
            <div className="flex items-center gap-6 flex-wrap">
              {([
                { l: "Home",         p: "home"          },
                { l: "How It Works", p: "how-it-works"  },
                { l: "About",        p: "about"         },
                { l: "Civic Map",    p: "civic-map"     },
                { l: "Leaderboard",  p: "leaderboard"   },
              ] as { l: string; p: Page }[]).map(({ l, p }) => (
                <button key={p} onClick={() => onNavigate(p)} className="hover:opacity-60 transition-opacity"
                  style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.1em", textTransform: "uppercase",
                    color: p === "how-it-works" ? "#1C0A00" : "#5C4A32",
                    fontWeight: p === "how-it-works" ? 700 : 400 }}>{l}</button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#4A7C5F" }}/>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", color: "#5C4A32", opacity: 0.4 }}>Privacy-first · Open · Verifiable</span>
            </div>
          </div>
          <div className="mt-6 pt-5 border-t" style={{ borderColor: "#EDE5D4" }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", color: "#5C4A32", opacity: 0.35, letterSpacing: "0.06em" }}>
              © 2026 CivicTrace · Citizen identity is never publicly exposed · Complaint records are publicly verifiable
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Backend lifecycle status → authority queue section. REPORTED/ASSESSED complaints
// are still awaiting authority action, so they belong under Pending.
function queueSectionStatus(raw: string): string {
  switch (raw) {
    case "REPORTED":
    case "ASSESSED":
      return "Pending";
    case "IN_PROGRESS":
      return "In Progress";
    case "RESOLVED":
      return "Resolved";
    case "DISPUTED":
      return "Disputed";
    default:
      return STATUS_UI[raw] ?? raw;
  }
}

// ─── Authority Dashboard Page ─────────────────────────────────────────────────
function AuthorityDashboardPage({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const [activeNav, setActiveNav] = useState<"dashboard" | "complaints" | "escalations" | "analytics">("dashboard");
  const [showProfile, setShowProfile] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const [filterPriority, setFilterPriority] = useState<"all" | "very-urgent" | "urgent" | "normal">("all");
  const [entered, setEntered] = useState(false);

  useEffect(() => { const t = setTimeout(() => setEntered(true), 60); return () => clearTimeout(t); }, []);

  const civic = useCivic();
  const liveC = useLiveComplaints();
  const liveN = useLiveNotifications();

  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  const stats = [
    { label: "Pending",       value: "24", hint: "↑ 3 from yesterday", color: "#B8872A", icon: "clock" },
    { label: "In Progress",   value: "18", hint: "4 due today",          color: "#3A6B9B", icon: "progress" },
    { label: "Very Urgent",   value: "7",  hint: "Needs immediate action", color: "#9B3A3A", icon: "alert" },
    { label: "Unresolved",    value: "5",  hint: "2 approaching escalation", color: "#C4622D", icon: "unresolved" },
    { label: "Awaiting Proof",value: "9",  hint: "Proof overdue on 3",   color: "#5C4A32", icon: "proof" },
    { label: "Resolved",      value: "142",hint: "↑ 8 this week",         color: "#4A7C5F", icon: "check" },
  ];

  type Complaint = { id: string; issue: string; category: string; priority: "VERY URGENT" | "URGENT" | "NORMAL"; status: string; age: string; impact: number };
  const mockRows: Complaint[] = [
    { id: "CTY-48291-X", issue: "Fallen Tree",         category: "Public Safety",     priority: "VERY URGENT", status: "Unresolved",     age: "2h",  impact: 87 },
    { id: "CTY-39182-A", issue: "Water Leakage",       category: "Water & Drainage",  priority: "URGENT",      status: "In Progress",    age: "1d",  impact: 74 },
    { id: "CTY-77420-K", issue: "Overflowing Bin",     category: "Sanitation",        priority: "NORMAL",      status: "Pending",        age: "3d",  impact: 61 },
    { id: "CTY-21487-P", issue: "Broken Streetlight",  category: "Public Safety",     priority: "URGENT",      status: "Awaiting Proof", age: "5h",  impact: 79 },
    { id: "CTY-59301-R", issue: "Pothole Cluster",     category: "Roads & Infrastructure", priority: "URGENT", status: "Escalated",     age: "2d",  impact: 83 },
    { id: "CTY-10982-D", issue: "Graffiti Damage",     category: "Public Property",   priority: "NORMAL",      status: "Assigned",       age: "4d",  impact: 44 },
  ];

  // Live data with mock fallback (backend unreachable → UI exactly as today).
  const allComplaints: (Complaint & { backendId: string | null })[] = (liveC.data && liveC.data.length)
    ? liveC.data.map((b: BackendComplaint) => ({
        id: b.tracking_code,
        backendId: b.id,
        issue: b.description || CATEGORY_LABELS[b.category] || b.category,
        category: CATEGORY_LABELS[b.category] || b.category,
        priority: PRIORITY_UI[b.priority] ?? "NORMAL",
        status: queueSectionStatus(b.status),
        age: timeAgo(b.last_action_at),
        impact: Math.min(99, b.support_count * 5 + 50),
      }))
    : mockRows.map(m => ({ ...m, backendId: null }));

  const filtered = filterPriority === "all" ? allComplaints
    : allComplaints.filter(c => c.priority.toLowerCase().replace(" ", "-") === filterPriority);

  const alerts = [
    { id: "CTY-48291-X", desc: "Exceeded expected response window.",       badge: "Escalation required", time: "2h ago",  action: "Review"       },
    { id: "CTY-21487-P", desc: "Awaiting resolution evidence submission.",  badge: "Proof due",           time: "5h ago",  action: "Upload Proof" },
    { id: "CTY-59301-R", desc: "Complaint was reopened by a citizen.",      badge: "Review dispute",      time: "1d ago",  action: "Open Case"    },
    { id: "CTY-77420-K", desc: "No activity for 72h — escalation pending.", badge: "Approaching limit",   time: "3d ago",  action: "Review"       },
  ];

  const activity = [
    { time: "10:42 AM", action: "Resolution evidence submitted",           id: "CTY-38192-B", today: true  },
    { time: "09:58 AM", action: "Complaint assigned to Roads & Infrastructure", id: "CTY-48291-X", today: true  },
    { time: "09:21 AM", action: "Citizen reopened complaint",              id: "CTY-59301-R", today: true  },
    { time: "Yesterday","action": "Complaint escalated automatically",     id: "CTY-77420-K", today: false },
    { time: "Yesterday","action": "Resolution verified by CivicTrace",     id: "CTY-31092-M", today: false },
  ];

  const perfBars = [42, 61, 55, 78, 88, 91, 84]; // last 7 days resolution activity
  const perfLabels = ["M","T","W","T","F","S","S"];

  function PriorityPill({ priority }: { priority: Complaint["priority"] }) {
    const map = { "VERY URGENT": { bg: "#9B3A3A", fg: "#FAF7F2" }, "URGENT": { bg: "#C4622D", fg: "#FAF7F2" }, "NORMAL": { bg: "#EDE5D4", fg: "#5C4A32" } };
    const s = map[priority];
    return (
      <span style={{ background: s.bg, color: s.fg, fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.12em", textTransform: "uppercase", padding: "2px 7px", borderRadius: "1px", whiteSpace: "nowrap" }}>{priority}</span>
    );
  }

  function StatusPill({ status }: { status: string }) {
    const colorMap: Record<string, string> = { "Unresolved": "#9B3A3A", "In Progress": "#3A6B9B", "Pending": "#B8872A", "Awaiting Proof": "#C4622D", "Escalated": "#9B3A3A", "Assigned": "#3A6B9B", "Resolved": "#4A7C5F" };
    const c = colorMap[status] ?? "#5C4A32";
    return (
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.1em", textTransform: "uppercase", color: c, borderBottom: `1px solid ${c}`, paddingBottom: "1px", opacity: 0.9 }}>{status}</span>
    );
  }

  function StatIcon({ type }: { type: string }) {
    if (type === "clock") return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2"/><path d="M8 5V8.5L10.5 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>;
    if (type === "progress") return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="10" width="3" height="4" fill="currentColor" opacity="0.4"/><rect x="6.5" y="7" width="3" height="7" fill="currentColor" opacity="0.6"/><rect x="11" y="4" width="3" height="10" fill="currentColor"/></svg>;
    if (type === "alert") return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2L14 13H2L8 2Z" stroke="currentColor" strokeWidth="1.2" fill="none"/><path d="M8 7V10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><circle cx="8" cy="12" r="0.8" fill="currentColor"/></svg>;
    if (type === "unresolved") return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2"/><path d="M5.5 5.5C5.5 5.5 6 4 8 4C10 4 10.5 5.5 10.5 6.5C10.5 7.5 9.5 8.5 8 9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><circle cx="8" cy="12" r="0.8" fill="currentColor"/></svg>;
    if (type === "proof") return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="3" y="2" width="10" height="12" rx="1" stroke="currentColor" strokeWidth="1.2"/><path d="M6 6H10M6 9H9" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/><circle cx="11" cy="11" r="2.5" fill="#FAF7F2" stroke="currentColor" strokeWidth="1.2"/><path d="M10 11L10.8 11.8L12.2 10.4" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/></svg>;
    return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2"/><path d="M5.5 8.5L7.2 10L10.5 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>;
  }

  const mockNotifs = [
    { text: "CTY-48291-X passed response deadline", time: "2h ago", unread: true },
    { text: "New evidence uploaded on CTY-38192-B", time: "1h ago", unread: true },
    { text: "CTY-59301-R reopened by citizen",       time: "3h ago", unread: false },
  ];

  // Live notifications with mock fallback.
  const notifications = (liveN.data && liveN.data.length)
    ? liveN.data.map(n => ({ text: n.message, time: timeAgo(n.created_at), unread: !n.read }))
    : mockNotifs;

  return (
    <div style={{ background: "#F5F0E8", minHeight: "100vh", fontFamily: "var(--font-body)", color: "#1C0A00" }}
      onClick={() => { if (showProfile) setShowProfile(false); if (showNotif) setShowNotif(false); }}>

      {/* ── Authority Navbar ── */}
      <nav className="sticky top-0 z-50 border-b" style={{ background: "rgba(245,240,232,0.97)", borderColor: "#C8B89A", backdropFilter: "blur(8px)" }}>
        <div className="max-w-7xl mx-auto px-5 h-14 flex items-center gap-6">

          {/* Logo + portal label */}
          <button onClick={() => onNavigate("home")} className="flex items-center gap-2.5 flex-shrink-0 hover:opacity-80 transition-opacity">
            <CivicTraceLogo size={26} />
            <div className="flex flex-col items-start leading-none">
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.875rem", color: "#1C0A00" }}>CivicTrace</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.42rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.6 }}>Authority Portal</span>
            </div>
          </button>

          {/* Divider */}
          <div className="h-6 w-px" style={{ background: "#C8B89A" }} />

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-5 flex-1">
            {(["dashboard","complaints","escalations","analytics"] as const).map(n => (
              <button key={n} onClick={() => setActiveNav(n)}
                className="transition-opacity hover:opacity-100"
                style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.12em", textTransform: "uppercase",
                  color: "#1C0A00", opacity: activeNav === n ? 1 : 0.45,
                  borderBottom: activeNav === n ? "1px solid #1C0A00" : "none", paddingBottom: activeNav === n ? "1px" : "0" }}>
                {n}
              </button>
            ))}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-3 ml-auto">
            {/* Search */}
            <div className="flex items-center gap-2">
              {showSearch && (
                <input autoFocus value={searchVal} onChange={e => setSearchVal(e.target.value)}
                  placeholder="Search complaints…"
                  className="border px-2 py-1 outline-none text-sm"
                  style={{ background: "#FAF7F2", borderColor: "#C8B89A", borderRadius: "1px", fontFamily: "var(--font-body)", fontSize: "0.78rem", width: "180px" }}
                  onBlur={() => { if (!searchVal) setShowSearch(false); }}
                />
              )}
              <button onClick={e => { e.stopPropagation(); setShowSearch(v => !v); }} className="opacity-50 hover:opacity-100 transition-opacity">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="#1C0A00" strokeWidth="1.3"/><path d="M11 11L14 14" stroke="#1C0A00" strokeWidth="1.3" strokeLinecap="round"/></svg>
              </button>
            </div>

            {/* Notifications */}
            <div className="relative">
              <button onClick={e => { e.stopPropagation(); setShowNotif(v => !v); setShowProfile(false); }}
                className="relative opacity-60 hover:opacity-100 transition-opacity">
                <svg width="17" height="17" viewBox="0 0 17 17" fill="none"><path d="M8.5 2C8.5 2 5 3.5 5 8V12H12V8C12 3.5 8.5 2 8.5 2Z" stroke="#1C0A00" strokeWidth="1.2" fill="none"/><path d="M3.5 12H13.5" stroke="#1C0A00" strokeWidth="1.2" strokeLinecap="round"/><path d="M7 13.5C7 14.3 7.7 15 8.5 15C9.3 15 10 14.3 10 13.5" stroke="#1C0A00" strokeWidth="1.2"/></svg>
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center" style={{ background: "#9B3A3A", fontFamily: "var(--font-mono)", fontSize: "0.45rem", color: "#FAF7F2" }}>2</span>
              </button>

              {showNotif && (
                <div className="absolute right-0 top-full mt-2 w-72 border z-50" style={{ background: "#FAF7F2", borderColor: "#C8B89A", borderRadius: "1px" }}
                  onClick={e => e.stopPropagation()}>
                  <div className="px-4 py-3 border-b" style={{ borderColor: "#EDE5D4" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#5C4A32" }}>Notifications</span>
                  </div>
                  {notifications.map((n, i) => (
                    <div key={i} className="px-4 py-3 border-b flex items-start gap-3 hover:bg-[#EDE5D4] transition-colors cursor-pointer" style={{ borderColor: "#EDE5D4" }}>
                      {n.unread && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ background: "#9B3A3A" }} />}
                      {!n.unread && <span className="w-1.5 flex-shrink-0" />}
                      <div>
                        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "#1C0A00", lineHeight: 1.5 }}>{n.text}</p>
                        <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", color: "#5C4A32", opacity: 0.6, letterSpacing: "0.06em", marginTop: "2px" }}>{n.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="relative">
              <button onClick={e => { e.stopPropagation(); setShowProfile(v => !v); setShowNotif(false); }}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <div className="w-7 h-7 border flex items-center justify-center flex-shrink-0" style={{ background: "#EDE5D4", borderColor: "#C8B89A", borderRadius: "1px" }}>
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.65rem", color: "#1C0A00" }}>RK</span>
                </div>
                <div className="hidden md:flex flex-col items-start leading-none">
                  <span style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", color: "#1C0A00", fontWeight: 600 }}>Roads Dept.</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.45rem", color: "#5C4A32", opacity: 0.6, letterSpacing: "0.06em", textTransform: "uppercase" }}>Infrastructure</span>
                </div>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ opacity: 0.5 }}><path d="M2 4L5 7L8 4" stroke="#1C0A00" strokeWidth="1.2" strokeLinecap="round"/></svg>
              </button>

              {showProfile && (
                <div className="absolute right-0 top-full mt-2 w-48 border z-50" style={{ background: "#FAF7F2", borderColor: "#C8B89A", borderRadius: "1px" }}
                  onClick={e => e.stopPropagation()}>
                  {[{ l: "Profile", fn: () => {} }, { l: "Settings", fn: () => {} }, { l: "Sign Out", fn: () => onNavigate("authority-login") }].map(({ l, fn }) => (
                    <button key={l} onClick={() => { setShowProfile(false); fn(); }}
                      className="w-full text-left px-4 py-2.5 hover:bg-[#EDE5D4] transition-colors border-b last:border-0"
                      style={{ borderColor: "#EDE5D4", fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.1em", textTransform: "uppercase",
                        color: l === "Sign Out" ? "#9B3A3A" : "#5C4A32" }}>
                      {l}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-5 py-10"
        style={{ opacity: entered ? 1 : 0, transform: entered ? "none" : "translateY(16px)", transition: "opacity 0.5s ease, transform 0.5s ease" }}>

        {/* ── Page header ── */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.5, marginBottom: "8px" }}>Authority Dashboard</div>
            <h1 className="font-display font-bold leading-tight" style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)", color: "#1C0A00" }}>
              Good governance<br className="hidden md:block" /> leaves a trace.
            </h1>
            <p className="mt-2" style={{ color: "#5C4A32", fontSize: "0.875rem", maxWidth: "48ch" }}>
              Monitor civic issues, act on priority cases, and keep every resolution accountable.
            </p>
          </div>
          <div className="flex-shrink-0 text-right border px-5 py-4" style={{ borderColor: "#C8B89A", background: "#FAF7F2", borderRadius: "1px", minWidth: "200px" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.5, marginBottom: "4px" }}>Date</div>
            <div className="font-display font-semibold" style={{ fontSize: "0.95rem", color: "#1C0A00", marginBottom: "6px" }}>{today}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.1em", color: "#5C4A32", marginBottom: "8px" }}>Roads & Infrastructure</div>
            <div className="inline-flex items-center gap-1.5 px-2 py-1" style={{ background: "#EDE5D4", borderRadius: "1px" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#4A7C5F" }} />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.46rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#4A7C5F" }}>Verified Authority</span>
            </div>
          </div>
        </div>

        <div className="h-px mb-8" style={{ background: "linear-gradient(to right, #C8B89A, transparent)" }} />

        {/* ── Stats grid ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-10">
          {stats.map(s => (
            <div key={s.label} className="card-lift border p-4 relative" style={{ background: "#FAF7F2", borderColor: "#C8B89A", borderRadius: "1px" }}>
              <div className="flex items-center justify-between mb-3">
                <div style={{ color: s.color, opacity: 0.8 }}><StatIcon type={s.icon} /></div>
                {s.label === "Very Urgent" && <span className="w-2 h-2 rounded-full" style={{ background: "#9B3A3A", boxShadow: "0 0 0 3px rgba(155,58,58,0.15)" }} />}
              </div>
              <div className="font-display font-bold" style={{ fontSize: "1.75rem", color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5C4A32", marginTop: "4px", marginBottom: "6px" }}>{s.label}</div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: "0.65rem", color: "#5C4A32", opacity: 0.6, lineHeight: 1.4 }}>{s.hint}</div>
            </div>
          ))}
        </div>

        {/* ── Main content grid ── */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">

          {/* Priority Queue (2/3 width) */}
          <div className="lg:col-span-2 border" style={{ background: "#FAF7F2", borderColor: "#C8B89A", borderRadius: "1px" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#EDE5D4" }}>
              <div>
                <h2 className="font-display font-bold" style={{ fontSize: "1.05rem", color: "#1C0A00" }}>Priority Queue</h2>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.08em", color: "#5C4A32", opacity: 0.6, textTransform: "uppercase", marginTop: "2px" }}>Cases requiring attention first</p>
              </div>
              {/* Priority filter tabs */}
              <div className="flex items-center gap-1">
                {(["all","very-urgent","urgent","normal"] as const).map(f => (
                  <button key={f} onClick={() => setFilterPriority(f)}
                    className="px-2.5 py-1 transition-colors"
                    style={{ fontFamily: "var(--font-mono)", fontSize: "0.46rem", letterSpacing: "0.1em", textTransform: "uppercase",
                      background: filterPriority === f ? "#1C0A00" : "transparent",
                      color: filterPriority === f ? "#F5F0E8" : "#5C4A32",
                      border: filterPriority === f ? "none" : "1px solid #C8B89A", borderRadius: "1px" }}>
                    {f === "all" ? "All" : f === "very-urgent" ? "V.Urgent" : f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: "#EDE5D4" }}>
                    {["Complaint","Category","Priority","Status","Age","Impact","Action"].map(h => (
                      <th key={h} className="px-4 py-3 text-left" style={{ fontFamily: "var(--font-mono)", fontSize: "0.48rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.55, fontWeight: 400 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, i) => (
                    <tr key={c.id} onClick={() => { civic.select(c.backendId ?? null, c.id); onNavigate("authority-complaint-detail"); }}
                      className="border-b cursor-pointer transition-colors hover:bg-[#EDE5D4]"
                      style={{ borderColor: "#EDE5D4" }}>
                      <td className="px-4 py-3.5">
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: "#1C0A00", letterSpacing: "0.05em" }}>{c.id}</div>
                        <div style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "#5C4A32", marginTop: "2px" }}>{c.issue}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "#5C4A32" }}>{c.category}</span>
                      </td>
                      <td className="px-4 py-3.5"><PriorityPill priority={c.priority} /></td>
                      <td className="px-4 py-3.5"><StatusPill status={c.status} /></td>
                      <td className="px-4 py-3.5" style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", color: "#5C4A32", letterSpacing: "0.06em" }}>{c.age}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <div className="h-1 rounded-full flex-1 max-w-[40px]" style={{ background: "#EDE5D4" }}>
                            <div style={{ width: `${c.impact}%`, height: "100%", background: c.impact > 80 ? "#9B3A3A" : c.impact > 65 ? "#C4622D" : "#B8872A", borderRadius: "2px" }} />
                          </div>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "#5C4A32" }}>{c.impact}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <button onClick={e => { e.stopPropagation(); civic.select(c.backendId ?? null, c.id); onNavigate("authority-complaint-detail"); }}
                          className="px-3 py-1 border hover:bg-[#1C0A00] hover:text-[#F5F0E8] transition-colors"
                          style={{ borderColor: "#C8B89A", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.48rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#1C0A00" }}>
                          {c.status === "Pending" || c.status === "Unresolved" ? "Review" : "Open"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile complaint cards */}
            <div className="md:hidden divide-y" style={{ borderColor: "#EDE5D4" }}>
              {filtered.map(c => (
                <div key={c.id} onClick={() => { civic.select(c.backendId ?? null, c.id); onNavigate("authority-complaint-detail"); }}
                  className="px-4 py-4 cursor-pointer hover:bg-[#EDE5D4] transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", color: "#5C4A32", letterSpacing: "0.06em" }}>{c.id}</div>
                      <div className="font-display font-semibold" style={{ fontSize: "0.9rem", color: "#1C0A00", marginTop: "1px" }}>{c.issue}</div>
                    </div>
                    <PriorityPill priority={c.priority} />
                  </div>
                  <div className="flex items-center justify-between">
                    <StatusPill status={c.status} />
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", color: "#5C4A32", opacity: 0.6 }}>{c.age} · Impact {c.impact}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Escalation alerts (1/3 width) */}
          <div className="border" style={{ background: "#FAF7F2", borderColor: "#C8B89A", borderRadius: "1px" }}>
            <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: "#EDE5D4" }}>
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "#9B3A3A" }} />
              <h2 className="font-display font-bold" style={{ fontSize: "1rem", color: "#1C0A00" }}>Needs Attention</h2>
            </div>
            <div className="divide-y" style={{ borderColor: "#EDE5D4" }}>
              {alerts.map((a, i) => (
                <div key={i} className="px-5 py-4 hover:bg-[#EDE5D4] transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", color: "#1C0A00", letterSpacing: "0.06em" }}>{a.id}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.46rem", color: "#5C4A32", opacity: 0.5, letterSpacing: "0.06em" }}>{a.time}</span>
                  </div>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "#5C4A32", lineHeight: 1.5, marginBottom: "8px" }}>{a.desc}</p>
                  <div className="flex items-center justify-between">
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.46rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#9B3A3A", borderBottom: "1px solid #9B3A3A", paddingBottom: "1px" }}>{a.badge}</span>
                    <button onClick={() => { civic.select(null, a.id); onNavigate("authority-complaint-detail"); }}
                      className="px-2.5 py-1 border hover:bg-[#1C0A00] hover:text-[#F5F0E8] transition-colors"
                      style={{ borderColor: "#C8B89A", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.46rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#1C0A00" }}>
                      {a.action}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Bottom row ── */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Accountability Snapshot */}
          <div className="border" style={{ background: "#FAF7F2", borderColor: "#C8B89A", borderRadius: "1px" }}>
            <div className="px-5 py-4 border-b" style={{ borderColor: "#EDE5D4" }}>
              <h2 className="font-display font-bold" style={{ fontSize: "1rem", color: "#1C0A00" }}>Accountability Snapshot</h2>
            </div>
            <div className="px-5 py-5">
              <div className="grid grid-cols-2 gap-3 mb-5">
                {[
                  { label: "Resolution Rate", value: "91%", color: "#4A7C5F" },
                  { label: "Avg. Resolution", value: "18.4h", color: "#3A6B9B" },
                  { label: "Reopened Cases", value: "6%",  color: "#B8872A" },
                  { label: "Evidence Compliance", value: "96%", color: "#4A7C5F" },
                ].map(m => (
                  <div key={m.label} className="border p-3" style={{ borderColor: "#EDE5D4", borderRadius: "1px" }}>
                    <div className="font-display font-bold" style={{ fontSize: "1.3rem", color: m.color }}>{m.value}</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.48rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.65, marginTop: "2px" }}>{m.label}</div>
                  </div>
                ))}
              </div>

              {/* Mini bar chart */}
              <div className="mb-3">
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.48rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.5, marginBottom: "8px" }}>
                  7-day resolution activity
                </div>
                <div className="flex items-end gap-1.5" style={{ height: "40px" }}>
                  {perfBars.map((v, i) => (
                    <div key={i} className="flex flex-col items-center gap-0.5 flex-1">
                      <div style={{ height: `${(v / 100) * 36}px`, background: i === perfBars.length - 1 ? "#4A7C5F" : "#C8B89A", borderRadius: "1px 1px 0 0", width: "100%", minHeight: "4px" }} />
                    </div>
                  ))}
                </div>
                <div className="flex gap-1.5 mt-1">
                  {perfLabels.map((l, i) => (
                    <div key={i} className="flex-1 text-center" style={{ fontFamily: "var(--font-mono)", fontSize: "0.42rem", color: "#5C4A32", opacity: 0.4 }}>{l}</div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t" style={{ borderColor: "#EDE5D4" }}>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "#5C4A32", lineHeight: 1.6, fontStyle: "italic" }}>
                  "Resolution quality remains strong, but response time is rising for infrastructure complaints."
                </p>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="border" style={{ background: "#FAF7F2", borderColor: "#C8B89A", borderRadius: "1px" }}>
            <div className="px-5 py-4 border-b" style={{ borderColor: "#EDE5D4" }}>
              <h2 className="font-display font-bold" style={{ fontSize: "1rem", color: "#1C0A00" }}>Recent Activity</h2>
            </div>
            <div className="px-5 py-4">
              <div className="relative">
                <div className="absolute left-2 top-2 bottom-2 w-px" style={{ background: "linear-gradient(to bottom, #C8B89A, transparent)" }} />
                {activity.map((a, i) => (
                  <div key={i} className="relative pl-7 mb-5 last:mb-0">
                    <div className="absolute left-0 w-4 h-4 border flex items-center justify-center" style={{ background: "#FAF7F2", borderColor: "#C8B89A", borderRadius: "1px", top: "1px" }}>
                      <span className="w-1 h-1 rounded-full" style={{ background: "#C8B89A" }} />
                    </div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.08em", color: "#5C4A32", opacity: 0.55, textTransform: "uppercase", marginBottom: "2px" }}>{a.time}</div>
                    <div style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", color: "#1C0A00", lineHeight: 1.4 }}>{a.action}</div>
                    <button onClick={() => { civic.select(null, a.id); onNavigate("authority-complaint-detail"); }}
                      style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.08em", color: "#3A6B9B", textDecoration: "underline", textUnderlineOffset: "2px", marginTop: "1px", cursor: "pointer" }}>
                      {a.id}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Verification + Quick Actions stacked */}
          <div className="flex flex-col gap-4">
            {/* Verification Layer */}
            <div className="border flex-shrink-0" style={{ background: "#FAF7F2", borderColor: "#C8B89A", borderRadius: "1px" }}>
              <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: "#EDE5D4" }}>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1 L11 3.5 L11 7 C11 10 6.5 12 6.5 12 C6.5 12 2 10 2 7 L2 3.5 Z" stroke="#4A7C5F" strokeWidth="1.1" fill="none"/><path d="M4.5 7L5.8 8.3L8.5 6" stroke="#4A7C5F" strokeWidth="1.1" strokeLinecap="round"/></svg>
                <h2 className="font-display font-bold" style={{ fontSize: "0.95rem", color: "#1C0A00" }}>Verification Layer</h2>
              </div>
              <div className="px-5 py-4">
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "#5C4A32", lineHeight: 1.5, marginBottom: "12px" }}>
                  All major case events are recorded as verifiable civic events.
                </p>
                <div className="space-y-2.5 mb-4">
                  {[
                    { l: "Last recorded event", v: "CTY-48291-X · Status Updated" },
                    { l: "Timestamp",            v: "Today · 10:42 AM" },
                    { l: "Proof status",         v: "Verified" },
                    { l: "Hash",                 v: "0x7A91...C42E" },
                  ].map(r => (
                    <div key={r.l} className="flex justify-between gap-2">
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.48rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.55 }}>{r.l}</span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: r.l === "Proof status" ? "#4A7C5F" : "#1C0A00", letterSpacing: "0.06em", textAlign: "right" }}>{r.v}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => onNavigate("verification")}
                  className="w-full py-2 border hover:bg-[#EDE5D4] transition-colors"
                  style={{ borderColor: "#C8B89A", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#1C0A00" }}>
                  View Verification
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="border" style={{ background: "#FAF7F2", borderColor: "#C8B89A", borderRadius: "1px" }}>
              <div className="px-5 py-4 border-b" style={{ borderColor: "#EDE5D4" }}>
                <h2 className="font-display font-bold" style={{ fontSize: "0.95rem", color: "#1C0A00" }}>Quick Actions</h2>
              </div>
              <div className="px-5 py-4 grid grid-cols-2 gap-2">
                {[
                  { l: "View Complaints",         p: "authority-complaint-queue" as Page },
                  { l: "Review Escalations",      p: "authority-complaint-queue" as Page },
                  { l: "Upload Resolution Proof", p: "proof-of-fix" as Page },
                  { l: "Civic Impact",            p: "impact-dashboard" as Page },
                ].map(({ l, p }) => (
                  <button key={l} onClick={() => onNavigate(p)}
                    className="px-3 py-2.5 border text-left hover:bg-[#1C0A00] hover:text-[#F5F0E8] hover:border-[#1C0A00] transition-all"
                    style={{ borderColor: "#C8B89A", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#1C0A00", lineHeight: 1.4 }}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Authority Login Page ─────────────────────────────────────────────────────
function AuthorityLoginPage({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [emailErr, setEmailErr] = useState("");
  const [passErr, setPassErr] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [entered, setEntered] = useState(false);
  const [signInErr, setSignInErr] = useState("");
  const civic = useCivic();

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 60);
    return () => clearTimeout(t);
  }, []);

  async function handleSignIn() {
    let ok = true;
    if (!email.trim()) { setEmailErr("Official email is required."); ok = false; } else setEmailErr("");
    if (!password.trim()) { setPassErr("Password is required."); ok = false; } else setPassErr("");
    if (!ok) return;
    setSignInErr("");
    // Demo auth: email is the identity (password is not verified server-side).
    // The backend freezes identity+role at first signup, so an email once used
    // on the citizen form stays "citizen" — never enter the authority area
    // with a non-authority account. Verify the saved user before navigating.
    const name = email.trim().split("@")[0] || "Officer";
    const logged = await civic.login(name, email.trim(), "authority").catch(() => false);
    let role: string | null = null;
    try {
      const raw = localStorage.getItem("civictrace_user");
      role = raw ? (JSON.parse(raw) as { role?: string }).role ?? null : null;
    } catch {
      role = null;
    }
    if (!logged || !role) {
      setSignInErr("Backend unreachable — cannot verify authority access. Check your connection and retry.");
      return;
    }
    if (role !== "authority") {
      setSignInErr("This email is registered as a citizen account. Use a different official email for authority access.");
      return;
    }
    onNavigate("authority-dashboard");
  }

  const navLinks: { l: string; p: Page | null }[] = [
    { l: "Home", p: "home" },
    { l: "How It Works", p: "how-it-works" },
    { l: "Public Map", p: "civic-map" },
    { l: "About", p: "about" },
  ];

  const timelineSteps = ["ASSIGNED", "IN PROGRESS", "PROOF SUBMITTED", "VERIFIED"];

  return (
    <div style={{ background: "#F5F0E8", minHeight: "100vh", fontFamily: "var(--font-body)", color: "#1C0A00" }}>

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 border-b" style={{ background: "rgba(245,240,232,0.97)", borderColor: "#C8B89A", backdropFilter: "blur(8px)" }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <button onClick={() => onNavigate("home")} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <CivicTraceLogo size={30} />
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", color: "#1C0A00" }}>CivicTrace</span>
          </button>

          <div className="hidden md:flex items-center gap-6">
            {navLinks.map(({ l, p }) => (
              <button key={l} onClick={() => p && onNavigate(p)} className="hover:opacity-100 transition-opacity"
                style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase",
                  color: "#5C4A32", opacity: 0.65 }}>{l}</button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => onNavigate("auth")} className="px-3 py-2 border hover:bg-[#EDE5D4] transition-colors"
              style={{ borderColor: "#C8B89A", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.08em", color: "#5C4A32", textTransform: "uppercase" }}>
              Citizen Login
            </button>
            <button className="px-4 py-2 transition-colors"
              style={{ background: "#1C0A00", color: "#F5F0E8", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Authority Login
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="border-b" style={{ borderColor: "#C8B89A" }}>
        <div className="max-w-7xl mx-auto px-6 py-16 text-center">
          <div className="font-mono text-xs tracking-widest uppercase mb-5 opacity-45" style={{ color: "#5C4A32", letterSpacing: "0.2em" }}>
            Authority Access
          </div>
          <h1 className="font-display font-bold mb-5 leading-tight" style={{ fontSize: "clamp(2rem, 5vw, 3.25rem)", color: "#1C0A00" }}>
            Secure access to civic accountability.
          </h1>
          <p className="max-w-xl mx-auto leading-relaxed" style={{ color: "#5C4A32", fontSize: "0.95rem" }}>
            Manage assigned complaints, review evidence, submit verified resolution proof, and respond to escalations.
          </p>
        </div>
      </section>

      {/* ── Main split layout ── */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-start">

          {/* Left: login card */}
          <div
            className="w-full"
            style={{
              opacity: entered ? 1 : 0,
              transform: entered ? "translateY(0)" : "translateY(20px)",
              transition: "opacity 0.5s ease, transform 0.5s ease",
            }}
          >
            {/* Card */}
            <div className="border p-8 relative" style={{ background: "#FAF7F2", borderColor: "#C8B89A", borderRadius: "2px" }}>
              {/* Corner accent */}
              <div className="absolute top-0 right-0 w-8 h-8 border-l border-b" style={{ borderColor: "#C8B89A" }} />
              <div className="absolute top-0 left-0 w-8 h-8 border-r border-b" style={{ borderColor: "#C8B89A" }} />

              {/* Card header */}
              <div className="mb-7 pb-5 border-b" style={{ borderColor: "#EDE5D4" }}>
                <div className="flex items-center gap-2 mb-2">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 1 L13 3.5 L13 8 C13 11.5 8 14.5 8 14.5 C8 14.5 3 11.5 3 8 L3 3.5 Z" stroke="#1C0A00" strokeWidth="1.2" fill="none"/>
                    <path d="M6 8 L7.5 9.5 L10.5 7" stroke="#4A7C5F" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                  <span className="font-display font-bold text-lg" style={{ color: "#1C0A00" }}>Authority Portal</span>
                </div>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "#5C4A32", letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.7 }}>
                  Sign in to manage civic complaints and resolutions.
                </p>
              </div>

              {/* Email field */}
              <div className="mb-5">
                <label className="block mb-1.5" style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5C4A32" }}>
                  Department / Official Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); if (e.target.value) setEmailErr(""); }}
                  placeholder="Enter your official email"
                  className="w-full px-3 py-2.5 border outline-none transition-all"
                  style={{
                    background: "#F5F0E8", borderColor: emailErr ? "#9B3A3A" : "#C8B89A", borderRadius: "1px",
                    fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "#1C0A00",
                  }}
                  onFocus={e => { if (!emailErr) e.target.style.borderColor = "#5C4A32"; }}
                  onBlur={e => { if (!emailErr) e.target.style.borderColor = "#C8B89A"; }}
                />
                {emailErr && <p className="mt-1" style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", color: "#9B3A3A", letterSpacing: "0.05em" }}>{emailErr}</p>}
              </div>

              {/* Password field */}
              <div className="mb-5">
                <label className="block mb-1.5" style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5C4A32" }}>
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={e => { setPassword(e.target.value); if (e.target.value) setPassErr(""); }}
                    placeholder="Enter your password"
                    className="w-full px-3 py-2.5 border outline-none transition-all pr-10"
                    style={{
                      background: "#F5F0E8", borderColor: passErr ? "#9B3A3A" : "#C8B89A", borderRadius: "1px",
                      fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "#1C0A00",
                    }}
                    onFocus={e => { if (!passErr) e.target.style.borderColor = "#5C4A32"; }}
                    onBlur={e => { if (!passErr) e.target.style.borderColor = "#C8B89A"; }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-80 transition-opacity"
                  >
                    {showPass ? (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M1 1L15 15M6.5 6.7C6.2 7.0 6 7.5 6 8C6 9.1 6.9 10 8 10C8.5 10 8.9 9.8 9.3 9.5" stroke="#5C4A32" strokeWidth="1.2" strokeLinecap="round"/>
                        <path d="M3 3.8C1.8 5.0 1 6.5 1 8C1 8 3.5 13 8 13C9.6 13 11 12.4 12.2 11.6" stroke="#5C4A32" strokeWidth="1.2" strokeLinecap="round"/>
                        <path d="M6 3.1C6.6 3.0 7.3 3 8 3C12.5 3 15 8 15 8C15 8 14.3 9.4 13 10.6" stroke="#5C4A32" strokeWidth="1.2" strokeLinecap="round"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M8 5C6.3 5 5 6.3 5 8C5 9.7 6.3 11 8 11C9.7 11 11 9.7 11 8C11 6.3 9.7 5 8 5Z" stroke="#5C4A32" strokeWidth="1.2" fill="none"/>
                        <path d="M1 8C1 8 3.5 3 8 3C12.5 3 15 8 15 8C15 8 12.5 13 8 13C3.5 13 1 8 1 8Z" stroke="#5C4A32" strokeWidth="1.2" fill="none"/>
                      </svg>
                    )}
                  </button>
                </div>
                {passErr && <p className="mt-1" style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", color: "#9B3A3A", letterSpacing: "0.05em" }}>{passErr}</p>}
              </div>

              {/* Remember me + Forgot */}
              <div className="flex items-center justify-between mb-7">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <button
                    type="button"
                    onClick={() => setRememberMe(v => !v)}
                    className="w-4 h-4 border flex items-center justify-center transition-colors flex-shrink-0"
                    style={{ borderColor: "#C8B89A", borderRadius: "1px", background: rememberMe ? "#1C0A00" : "#F5F0E8" }}
                  >
                    {rememberMe && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5L4.2 7.2L8 3" stroke="#F5F0E8" strokeWidth="1.3" strokeLinecap="round"/>
                      </svg>
                    )}
                  </button>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.75 }}>
                    Remember me
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgot(true)}
                  className="hover:opacity-100 transition-opacity"
                  style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#3A6B9B", opacity: 0.8, textDecoration: "underline", textUnderlineOffset: "3px" }}
                >
                  Forgot password?
                </button>
              </div>

              {/* Sign in button */}
              <button
                type="button"
                onClick={handleSignIn}
                className="w-full py-3 font-mono text-xs tracking-widest uppercase transition-all hover:opacity-90 active:scale-[0.99]"
                style={{ background: "#1C0A00", color: "#F5F0E8", borderRadius: "1px", letterSpacing: "0.15em" }}
              >
                Sign In
              </button>
              {signInErr && (
                <p className="mt-2 text-center" style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", color: "#9B3A3A", letterSpacing: "0.05em" }}>{signInErr}</p>
              )}

              <p className="mt-4 text-center" style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "#5C4A32", opacity: 0.5, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Authorized civic personnel only.
              </p>
            </div>

            {/* Trust indicator */}
            <div className="mt-4 border px-5 py-3.5 flex items-center gap-3" style={{ borderColor: "#C8B89A", background: "#FAF7F2", borderRadius: "1px" }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="flex-shrink-0" style={{ opacity: 0.7 }}>
                <rect x="5" y="9" width="8" height="7" rx="1" stroke="#4A7C5F" strokeWidth="1.2" fill="none"/>
                <path d="M6 9V6.5C6 4.6 12 4.6 12 6.5V9" stroke="#4A7C5F" strokeWidth="1.2" fill="none"/>
                <circle cx="9" cy="12.5" r="1" fill="#4A7C5F"/>
              </svg>
              <div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#4A7C5F", fontWeight: 700 }}>Verified Access</div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", color: "#5C4A32", lineHeight: 1.5, marginTop: "2px" }}>
                  Authority actions are recorded as part of the CivicTrace accountability trail.
                </div>
              </div>
            </div>
          </div>

          {/* Right: editorial / accountability statement */}
          <div
            className="hidden md:block"
            style={{
              opacity: entered ? 1 : 0,
              transform: entered ? "translateY(0)" : "translateY(24px)",
              transition: "opacity 0.6s ease 0.15s, transform 0.6s ease 0.15s",
            }}
          >
            {/* Decorative top rule */}
            <div className="h-px mb-8" style={{ background: "linear-gradient(to right, #C8B89A, transparent)" }} />

            <div className="font-mono text-xs tracking-widest uppercase mb-3 opacity-40" style={{ color: "#5C4A32", letterSpacing: "0.18em" }}>
              Civic Accountability
            </div>

            <h2 className="font-display font-bold leading-tight mb-6" style={{ fontSize: "clamp(2rem, 3.5vw, 2.8rem)", color: "#1C0A00" }}>
              Every action<br />leaves a trace.
            </h2>

            <p className="leading-relaxed mb-10" style={{ color: "#5C4A32", fontSize: "0.9rem", maxWidth: "36ch" }}>
              Assignments, status updates, evidence submissions, resolutions, and escalations become part of a verifiable civic record.
            </p>

            {/* Vertical timeline */}
            <div className="relative pl-8">
              {/* Vertical line */}
              <div className="absolute left-3.5 top-3 bottom-3 w-px" style={{ background: "linear-gradient(to bottom, #C8B89A, transparent)" }} />

              {timelineSteps.map((step, i) => (
                <div key={step} className="relative mb-8 last:mb-0 flex items-center gap-4">
                  {/* Node */}
                  <div
                    className="absolute left-0 w-3 h-3 border flex items-center justify-center"
                    style={{
                      background: i === timelineSteps.length - 1 ? "#4A7C5F" : "#FAF7F2",
                      borderColor: i === timelineSteps.length - 1 ? "#4A7C5F" : "#C8B89A",
                      borderRadius: "1px",
                      transform: "translateX(-0.25rem)"
                    }}
                  >
                    {i === timelineSteps.length - 1 && (
                      <svg width="7" height="7" viewBox="0 0 7 7" fill="none">
                        <path d="M1.5 3.5L3 5L5.5 2" stroke="#FAF7F2" strokeWidth="1.2" strokeLinecap="round"/>
                      </svg>
                    )}
                  </div>

                  <div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", letterSpacing: "0.16em", textTransform: "uppercase",
                      color: i === timelineSteps.length - 1 ? "#4A7C5F" : "#1C0A00",
                      fontWeight: i === timelineSteps.length - 1 ? 700 : 400 }}>
                      {step}
                    </div>
                    {i < timelineSteps.length - 1 && (
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", color: "#C8B89A", marginTop: "2px", letterSpacing: "0.06em" }}>
                        Timestamped · Signed · Immutable
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom decorative block quote */}
            <div className="mt-12 pt-8 border-t" style={{ borderColor: "#EDE5D4" }}>
              <div className="h-px mb-6" style={{ background: "linear-gradient(to right, transparent, #C8B89A, transparent)" }} />
              <blockquote className="font-display italic" style={{ fontSize: "0.9rem", color: "#5C4A32", lineHeight: 1.7 }}>
                "Transparency is not a feature — it is the foundation of public trust."
              </blockquote>
              <div className="mt-3" style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", color: "#5C4A32", opacity: 0.45, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                CivicTrace · Authority Module
              </div>
            </div>
          </div>
        </div>

        {/* Mobile editorial note */}
        <div className="md:hidden mt-12 pt-8 border-t" style={{ borderColor: "#C8B89A" }}>
          <h2 className="font-display font-bold leading-tight mb-4 text-center" style={{ fontSize: "1.75rem", color: "#1C0A00" }}>
            Every action leaves a trace.
          </h2>
          <p className="text-center leading-relaxed mb-8" style={{ color: "#5C4A32", fontSize: "0.875rem" }}>
            Assignments, updates, evidence, resolutions — all become part of a verifiable civic record.
          </p>
          <div className="flex justify-center">
            <div className="relative pl-8">
              <div className="absolute left-3.5 top-3 bottom-3 w-px" style={{ background: "linear-gradient(to bottom, #C8B89A, transparent)" }} />
              {timelineSteps.map((step, i) => (
                <div key={step} className="relative mb-7 last:mb-0 flex items-center gap-4">
                  <div className="absolute left-0 w-3 h-3 border flex items-center justify-center"
                    style={{ background: i === timelineSteps.length - 1 ? "#4A7C5F" : "#FAF7F2", borderColor: i === timelineSteps.length - 1 ? "#4A7C5F" : "#C8B89A", borderRadius: "1px", transform: "translateX(-0.25rem)" }}>
                    {i === timelineSteps.length - 1 && (
                      <svg width="7" height="7" viewBox="0 0 7 7" fill="none">
                        <path d="M1.5 3.5L3 5L5.5 2" stroke="#FAF7F2" strokeWidth="1.2" strokeLinecap="round"/>
                      </svg>
                    )}
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", letterSpacing: "0.16em", textTransform: "uppercase",
                    color: i === timelineSteps.length - 1 ? "#4A7C5F" : "#1C0A00" }}>
                    {step}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t mt-16 py-8" style={{ borderColor: "#C8B89A" }}>
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", color: "#5C4A32", opacity: 0.4, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            © 2026 CivicTrace · Authority actions are part of the public accountability record
          </p>
        </div>
      </footer>

      {/* ── Forgot password modal ── */}
      {showForgot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(28,10,0,0.45)" }}>
          <div className="border p-8 mx-4 max-w-sm w-full relative" style={{ background: "#FAF7F2", borderColor: "#C8B89A", borderRadius: "2px" }}>
            <div className="absolute top-0 right-0 w-6 h-6 border-l border-b" style={{ borderColor: "#C8B89A" }} />
            <div className="font-mono text-xs tracking-widest uppercase mb-4 opacity-50" style={{ color: "#5C4A32", letterSpacing: "0.15em" }}>
              Password Recovery
            </div>
            <h3 className="font-display font-bold text-lg mb-3" style={{ color: "#1C0A00" }}>Access Recovery</h3>
            <p className="leading-relaxed mb-6" style={{ color: "#5C4A32", fontSize: "0.875rem" }}>
              Password recovery is available through your department administrator. Contact your department IT officer or system administrator to reset your credentials.
            </p>
            <button
              onClick={() => setShowForgot(false)}
              className="w-full py-2.5 font-mono text-xs tracking-widest uppercase transition-colors hover:bg-[#EDE5D4]"
              style={{ border: "1px solid #C8B89A", borderRadius: "1px", color: "#1C0A00", letterSpacing: "0.12em" }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Authority Nav Shell (shared across authority pages) ──────────────────────
function AuthorityNav({ onNavigate, active }: { onNavigate: (p: Page) => void; active: "dashboard" | "complaints" | "escalations" | "analytics" }) {
  const [showProfile, setShowProfile] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchVal, setSearchVal] = useState("");

  return (
    <nav className="sticky top-0 z-50 border-b" style={{ background: "rgba(245,240,232,0.97)", borderColor: "#C8B89A", backdropFilter: "blur(8px)" }}
      onClick={() => { if (showProfile) setShowProfile(false); if (showNotif) setShowNotif(false); }}>
      <div className="max-w-7xl mx-auto px-5 h-14 flex items-center gap-5">
        <button onClick={() => onNavigate("home")} className="flex items-center gap-2.5 flex-shrink-0 hover:opacity-80 transition-opacity">
          <CivicTraceLogo size={26} />
          <div className="flex flex-col items-start leading-none">
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.875rem", color: "#1C0A00" }}>CivicTrace</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.42rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.6 }}>Authority Portal</span>
          </div>
        </button>
        <div className="h-6 w-px flex-shrink-0" style={{ background: "#C8B89A" }} />
        <div className="hidden md:flex items-center gap-5 flex-1">
          {([
            ["dashboard","authority-dashboard"],
            ["complaints","authority-complaint-queue"],
            ["escalations","authority-escalations"],
            ["analytics","impact-dashboard"],
          ] as const).map(([n, dest]) => (
            <button key={n} onClick={() => onNavigate(dest as Page)}
              className="transition-opacity hover:opacity-100"
              style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.12em", textTransform: "uppercase",
                color: "#1C0A00", opacity: active === n ? 1 : 0.45,
                borderBottom: active === n ? "1px solid #1C0A00" : "none", paddingBottom: active === n ? "1px" : "0" }}>
              {n}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 ml-auto">
          <div className="flex items-center gap-2">
            {showSearch && (
              <input autoFocus value={searchVal} onChange={e => setSearchVal(e.target.value)}
                placeholder="Search complaints…"
                className="border px-2 py-1 outline-none"
                style={{ background: "#FAF7F2", borderColor: "#C8B89A", borderRadius: "1px", fontFamily: "var(--font-body)", fontSize: "0.78rem", width: "180px" }}
                onBlur={() => { if (!searchVal) setShowSearch(false); }} />
            )}
            <button onClick={e => { e.stopPropagation(); setShowSearch(v => !v); }} className="opacity-50 hover:opacity-100 transition-opacity">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="#1C0A00" strokeWidth="1.3"/><path d="M11 11L14 14" stroke="#1C0A00" strokeWidth="1.3" strokeLinecap="round"/></svg>
            </button>
          </div>
          <div className="relative">
            <button onClick={e => { e.stopPropagation(); setShowNotif(v => !v); setShowProfile(false); }} className="relative opacity-60 hover:opacity-100 transition-opacity">
              <svg width="17" height="17" viewBox="0 0 17 17" fill="none"><path d="M8.5 2C8.5 2 5 3.5 5 8V12H12V8C12 3.5 8.5 2 8.5 2Z" stroke="#1C0A00" strokeWidth="1.2" fill="none"/><path d="M3.5 12H13.5" stroke="#1C0A00" strokeWidth="1.2" strokeLinecap="round"/><path d="M7 13.5C7 14.3 7.7 15 8.5 15C9.3 15 10 14.3 10 13.5" stroke="#1C0A00" strokeWidth="1.2"/></svg>
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center" style={{ background: "#9B3A3A", fontFamily: "var(--font-mono)", fontSize: "0.45rem", color: "#FAF7F2" }}>2</span>
            </button>
            {showNotif && (
              <div className="absolute right-0 top-full mt-2 w-72 border z-50" style={{ background: "#FAF7F2", borderColor: "#C8B89A", borderRadius: "1px" }}
                onClick={e => e.stopPropagation()}>
                <div className="px-4 py-3 border-b" style={{ borderColor: "#EDE5D4" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#5C4A32" }}>Notifications</span>
                </div>
                {[
                  { text: "CTY-48291-X passed response deadline", time: "2h ago", unread: true },
                  { text: "New evidence uploaded on CTY-38192-B", time: "1h ago", unread: true },
                  { text: "CTY-59301-R reopened by citizen", time: "3h ago", unread: false },
                ].map((n, i) => (
                  <div key={i} className="px-4 py-3 border-b flex items-start gap-3 hover:bg-[#EDE5D4] transition-colors cursor-pointer last:border-0" style={{ borderColor: "#EDE5D4" }}>
                    {n.unread ? <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ background: "#9B3A3A" }} /> : <span className="w-1.5 flex-shrink-0" />}
                    <div>
                      <p style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "#1C0A00", lineHeight: 1.5 }}>{n.text}</p>
                      <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", color: "#5C4A32", opacity: 0.6, letterSpacing: "0.06em", marginTop: "2px" }}>{n.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="relative">
            <button onClick={e => { e.stopPropagation(); setShowProfile(v => !v); setShowNotif(false); }} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-7 h-7 border flex items-center justify-center flex-shrink-0" style={{ background: "#EDE5D4", borderColor: "#C8B89A", borderRadius: "1px" }}>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.65rem", color: "#1C0A00" }}>RK</span>
              </div>
              <div className="hidden md:flex flex-col items-start leading-none">
                <span style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", color: "#1C0A00", fontWeight: 600 }}>Roads Dept.</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.45rem", color: "#5C4A32", opacity: 0.6, letterSpacing: "0.06em", textTransform: "uppercase" }}>Infrastructure</span>
              </div>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ opacity: 0.5 }}><path d="M2 4L5 7L8 4" stroke="#1C0A00" strokeWidth="1.2" strokeLinecap="round"/></svg>
            </button>
            {showProfile && (
              <div className="absolute right-0 top-full mt-2 w-48 border z-50" style={{ background: "#FAF7F2", borderColor: "#C8B89A", borderRadius: "1px" }}
                onClick={e => e.stopPropagation()}>
                {[{ l: "Profile", fn: () => {} }, { l: "Settings", fn: () => {} }, { l: "Sign Out", fn: () => onNavigate("authority-login") }].map(({ l, fn }) => (
                  <button key={l} onClick={() => { setShowProfile(false); fn(); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-[#EDE5D4] transition-colors border-b last:border-0"
                    style={{ borderColor: "#EDE5D4", fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.1em", textTransform: "uppercase", color: l === "Sign Out" ? "#9B3A3A" : "#5C4A32" }}>
                    {l}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

// ─── Authority Complaint Queue ────────────────────────────────────────────────
function AuthorityComplaintQueuePage({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const civic = useCivic();
  const liveC = useLiveComplaints();

  type QComplaint = {
    id: string; issue: string; category: string;
    priority: "VERY URGENT" | "URGENT" | "NORMAL";
    status: "Pending" | "In Progress" | "Awaiting Proof" | "Unresolved" | "Disputed" | "Escalated" | "Resolved";
    age: string; impact: number;
  };

  const mockRows: QComplaint[] = [
    { id: "CTY-48291-X", issue: "Fallen Tree Blocking Road",    category: "Public Safety",        priority: "VERY URGENT", status: "Unresolved",    age: "2h",  impact: 87 },
    { id: "CTY-39182-A", issue: "Water Leakage on Main Street", category: "Water & Drainage",     priority: "URGENT",      status: "In Progress",   age: "1d",  impact: 74 },
    { id: "CTY-77420-K", issue: "Overflowing Bin",              category: "Sanitation",           priority: "NORMAL",      status: "Pending",       age: "3d",  impact: 61 },
    { id: "CTY-21487-P", issue: "Broken Streetlight",           category: "Public Safety",        priority: "URGENT",      status: "Awaiting Proof",age: "5h",  impact: 79 },
    { id: "CTY-59301-R", issue: "Pothole Cluster, Sector 14",   category: "Roads & Infrastructure",priority: "URGENT",     status: "Escalated",     age: "2d",  impact: 83 },
    { id: "CTY-10982-D", issue: "Graffiti on Public Wall",      category: "Public Property",      priority: "NORMAL",      status: "Pending",       age: "4d",  impact: 44 },
    { id: "CTY-63041-F", issue: "Park Drainage Failure",        category: "Parks & Environment",  priority: "URGENT",      status: "In Progress",   age: "6h",  impact: 68 },
    { id: "CTY-88120-G", issue: "Gas Leak Near Junction",       category: "Public Safety",        priority: "VERY URGENT", status: "In Progress",   age: "45m", impact: 94 },
    { id: "CTY-34509-H", issue: "Sewage Overflow",              category: "Water & Drainage",     priority: "VERY URGENT", status: "Unresolved",    age: "3h",  impact: 91 },
    { id: "CTY-19203-J", issue: "Damaged Bus Shelter",          category: "Public Property",      priority: "NORMAL",      status: "Disputed",      age: "5d",  impact: 37 },
    { id: "CTY-72811-L", issue: "Illegal Dumping Site",         category: "Sanitation",           priority: "URGENT",      status: "Pending",       age: "2d",  impact: 72 },
    { id: "CTY-44018-N", issue: "Crumbling Footpath",           category: "Roads & Infrastructure",priority: "NORMAL",     status: "Awaiting Proof",age: "1d",  impact: 55 },
    { id: "CTY-55102-Q", issue: "Dead Tree on Public Path",     category: "Parks & Environment",  priority: "URGENT",      status: "Disputed",      age: "3d",  impact: 63 },
    { id: "CTY-91047-S", issue: "Traffic Signal Fault",         category: "Roads & Infrastructure",priority: "VERY URGENT",status: "In Progress",   age: "1h",  impact: 89 },
  ];

  // Live data with mock fallback (backend unreachable → UI exactly as today).
  const allComplaints: (QComplaint & { backendId: string | null })[] = (liveC.data && liveC.data.length)
    ? liveC.data.map((b: BackendComplaint) => ({
        id: b.tracking_code,
        backendId: b.id,
        issue: b.description || CATEGORY_LABELS[b.category] || b.category,
        category: CATEGORY_LABELS[b.category] || b.category,
        priority: PRIORITY_UI[b.priority] ?? "NORMAL",
        status: queueSectionStatus(b.status) as QComplaint["status"],
        age: timeAgo(b.last_action_at),
        impact: Math.min(99, b.support_count * 5 + 50),
      }))
    : mockRows.map(m => ({ ...m, backendId: null }));

  const tabs: { label: string; filter: QComplaint["status"] | "all" }[] = [
    { label: "All",           filter: "all" },
    { label: "Pending",       filter: "Pending" },
    { label: "In Progress",   filter: "In Progress" },
    { label: "Awaiting Proof",filter: "Awaiting Proof" },
    { label: "Unresolved",    filter: "Unresolved" },
    { label: "Disputed",      filter: "Disputed" },
    { label: "Resolved",      filter: "Resolved" },
  ];

  const tabCounts: Record<string, number> = {
    all: allComplaints.length,
    Pending: allComplaints.filter(c => c.status === "Pending").length,
    "In Progress": allComplaints.filter(c => c.status === "In Progress").length,
    "Awaiting Proof": allComplaints.filter(c => c.status === "Awaiting Proof").length,
    Unresolved: allComplaints.filter(c => c.status === "Unresolved").length,
    Disputed: allComplaints.filter(c => c.status === "Disputed").length,
    Resolved: allComplaints.filter(c => c.status === "Resolved").length,
  };

  const categories = ["All Categories", "Public Safety", "Water & Drainage", "Sanitation", "Roads & Infrastructure", "Public Property", "Parks & Environment"];
  const priorities = ["All Priorities", "VERY URGENT", "URGENT", "NORMAL"];
  const sortOptions = ["Newest", "Oldest", "Highest Impact"];

  const [activeTab, setActiveTab] = useState<QComplaint["status"] | "all">("all");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All Categories");
  const [priFilter, setPriFilter] = useState("All Priorities");
  const [sortBy, setSortBy] = useState("Newest");
  const [entered, setEntered] = useState(false);

  useEffect(() => { const t = setTimeout(() => setEntered(true), 60); return () => clearTimeout(t); }, []);

  const filtered = allComplaints
    .filter(c => activeTab === "all" || c.status === activeTab)
    .filter(c => !search || c.id.toLowerCase().includes(search.toLowerCase()) || c.issue.toLowerCase().includes(search.toLowerCase()))
    .filter(c => catFilter === "All Categories" || c.category === catFilter)
    .filter(c => priFilter === "All Priorities" || c.priority === priFilter)
    .sort((a, b) => {
      if (sortBy === "Highest Impact") return b.impact - a.impact;
      if (sortBy === "Oldest") return 0;
      return 0;
    });

  function PriorityPill({ p }: { p: QComplaint["priority"] }) {
    const s = p === "VERY URGENT" ? { bg: "#9B3A3A", fg: "#FAF7F2" } : p === "URGENT" ? { bg: "#C4622D", fg: "#FAF7F2" } : { bg: "#EDE5D4", fg: "#5C4A32" };
    return <span style={{ background: s.bg, color: s.fg, fontFamily: "var(--font-mono)", fontSize: "0.48rem", letterSpacing: "0.12em", textTransform: "uppercase", padding: "2px 6px", borderRadius: "1px", whiteSpace: "nowrap" }}>{p}</span>;
  }

  function StatusPill({ s }: { s: string }) {
    const colorMap: Record<string, string> = { Unresolved: "#9B3A3A", "In Progress": "#3A6B9B", Pending: "#B8872A", "Awaiting Proof": "#C4622D", Escalated: "#9B3A3A", Disputed: "#B8872A", Resolved: "#4A7C5F" };
    const c = colorMap[s] ?? "#5C4A32";
    return <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.48rem", letterSpacing: "0.1em", textTransform: "uppercase", color: c, borderBottom: `1px solid ${c}`, paddingBottom: "1px" }}>{s}</span>;
  }

  return (
    <div style={{ background: "#F5F0E8", minHeight: "100vh", fontFamily: "var(--font-body)", color: "#1C0A00" }}>
      <AuthorityNav onNavigate={onNavigate} active="complaints" />

      <div className="max-w-7xl mx-auto px-5 py-10"
        style={{ opacity: entered ? 1 : 0, transform: entered ? "none" : "translateY(14px)", transition: "opacity 0.45s ease, transform 0.45s ease" }}>

        {/* Page header */}
        <div className="mb-7">
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.5, marginBottom: "6px" }}>
            Authority Portal · Complaints
          </div>
          <h1 className="font-display font-bold leading-tight" style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", color: "#1C0A00" }}>Complaint Queue</h1>
          <p style={{ color: "#5C4A32", fontSize: "0.875rem", marginTop: "6px" }}>Every issue waiting for action, in one place.</p>
        </div>

        <div className="h-px mb-7" style={{ background: "linear-gradient(to right, #C8B89A, transparent)" }} />

        {/* Tab bar */}
        <div className="flex items-center gap-1 flex-wrap mb-6 overflow-x-auto pb-1">
          {tabs.map(({ label, filter }) => {
            const count = tabCounts[filter === "all" ? "all" : filter] ?? 0;
            const isActive = activeTab === filter;
            return (
              <button key={label} onClick={() => setActiveTab(filter)}
                className="flex items-center gap-1.5 px-3.5 py-2 border transition-colors flex-shrink-0"
                style={{ background: isActive ? "#1C0A00" : "#FAF7F2", borderColor: isActive ? "#1C0A00" : "#C8B89A", borderRadius: "1px", color: isActive ? "#F5F0E8" : "#5C4A32" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", opacity: isActive ? 0.7 : 0.5 }}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Filters row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-6">
          {/* Search */}
          <div className="md:col-span-1 relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 opacity-40" width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6" cy="6" r="4" stroke="#1C0A00" strokeWidth="1.1"/><path d="M9 9L12 12" stroke="#1C0A00" strokeWidth="1.1" strokeLinecap="round"/></svg>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search ID or issue…"
              className="w-full border pl-7 pr-3 py-2 outline-none transition-colors"
              style={{ background: "#FAF7F2", borderColor: "#C8B89A", borderRadius: "1px", fontFamily: "var(--font-body)", fontSize: "0.8rem", color: "#1C0A00" }}
              onFocus={e => e.target.style.borderColor = "#5C4A32"}
              onBlur={e => e.target.style.borderColor = "#C8B89A"} />
          </div>
          {/* Category */}
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
            className="border px-3 py-2 outline-none transition-colors appearance-none"
            style={{ background: "#FAF7F2", borderColor: "#C8B89A", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.08em", color: "#5C4A32", cursor: "pointer" }}>
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
          {/* Priority */}
          <select value={priFilter} onChange={e => setPriFilter(e.target.value)}
            className="border px-3 py-2 outline-none appearance-none"
            style={{ background: "#FAF7F2", borderColor: "#C8B89A", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.08em", color: "#5C4A32", cursor: "pointer" }}>
            {priorities.map(p => <option key={p}>{p}</option>)}
          </select>
          {/* Sort */}
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="border px-3 py-2 outline-none appearance-none"
            style={{ background: "#FAF7F2", borderColor: "#C8B89A", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.08em", color: "#5C4A32", cursor: "pointer" }}>
            {sortOptions.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        {/* Result count */}
        <div className="mb-3">
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.55 }}>
            {filtered.length} complaint{filtered.length !== 1 ? "s" : ""} shown
          </span>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block border" style={{ background: "#FAF7F2", borderColor: "#C8B89A", borderRadius: "1px" }}>
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: "#EDE5D4" }}>
                {["Complaint", "Category", "Priority", "Status", "Age", "Impact", "Action"].map(h => (
                  <th key={h} className="px-4 py-3 text-left" style={{ fontFamily: "var(--font-mono)", fontSize: "0.46rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.5, fontWeight: 400 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center" style={{ fontFamily: "var(--font-body)", fontSize: "0.875rem", color: "#5C4A32", opacity: 0.5 }}>No complaints match the selected filters.</td></tr>
              ) : filtered.map((c) => (
                <tr key={c.id} onClick={() => { civic.select(c.backendId ?? null, c.id); onNavigate("authority-complaint-detail"); }}
                  className="border-b cursor-pointer transition-colors hover:bg-[#EDE5D4] group last:border-0"
                  style={{ borderColor: "#EDE5D4" }}>
                  <td className="px-4 py-3.5">
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "#1C0A00", letterSpacing: "0.06em" }}>{c.id}</div>
                    <div style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "#5C4A32", marginTop: "2px" }}>{c.issue}</div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "#5C4A32" }}>{c.category}</span>
                  </td>
                  <td className="px-4 py-3.5"><PriorityPill p={c.priority} /></td>
                  <td className="px-4 py-3.5"><StatusPill s={c.status} /></td>
                  <td className="px-4 py-3.5" style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", color: "#5C4A32", letterSpacing: "0.06em" }}>{c.age}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <div style={{ width: "44px", height: "4px", background: "#EDE5D4", borderRadius: "2px", overflow: "hidden" }}>
                        <div style={{ width: `${c.impact}%`, height: "100%", background: c.impact > 80 ? "#9B3A3A" : c.impact > 65 ? "#C4622D" : "#B8872A" }} />
                      </div>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "#5C4A32" }}>{c.impact}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <button onClick={e => { e.stopPropagation(); civic.select(c.backendId ?? null, c.id); onNavigate("authority-complaint-detail"); }}
                      className="px-3 py-1.5 border transition-colors hover:bg-[#1C0A00] hover:text-[#F5F0E8] hover:border-[#1C0A00]"
                      style={{ borderColor: "#C8B89A", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.46rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#1C0A00" }}>
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile complaint cards */}
        <div className="md:hidden space-y-2.5">
          {filtered.length === 0 ? (
            <div className="border px-5 py-10 text-center" style={{ background: "#FAF7F2", borderColor: "#C8B89A", borderRadius: "1px" }}>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.875rem", color: "#5C4A32", opacity: 0.5 }}>No complaints match the selected filters.</p>
            </div>
          ) : filtered.map(c => (
            <div key={c.id} className="border p-4 transition-colors hover:bg-[#EDE5D4] cursor-pointer" style={{ background: "#FAF7F2", borderColor: "#C8B89A", borderRadius: "1px" }}
              onClick={() => { civic.select(c.backendId ?? null, c.id); onNavigate("authority-complaint-detail"); }}>
              <div className="flex items-start justify-between gap-3 mb-2.5">
                <div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "#5C4A32", letterSpacing: "0.08em", marginBottom: "2px" }}>{c.id}</div>
                  <div className="font-display font-semibold" style={{ fontSize: "0.9rem", color: "#1C0A00", lineHeight: 1.3 }}>{c.issue}</div>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", color: "#5C4A32", marginTop: "2px" }}>{c.category}</div>
                </div>
                <PriorityPill p={c.priority} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <StatusPill s={c.status} />
                <div className="flex items-center gap-3">
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", color: "#5C4A32", opacity: 0.6 }}>{c.age} · {c.impact}</span>
                  <button onClick={e => { e.stopPropagation(); civic.select(c.backendId ?? null, c.id); onNavigate("authority-complaint-detail"); }}
                    className="px-3 py-1.5 border transition-colors"
                    style={{ borderColor: "#C8B89A", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.48rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#1C0A00", background: "#FAF7F2" }}>
                    Open
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <div className="mt-10 pt-6 border-t" style={{ borderColor: "#C8B89A" }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", color: "#5C4A32", opacity: 0.35, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            All complaint records are part of the CivicTrace accountability trail · Authority actions are logged
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Authority Complaint Detail ───────────────────────────────────────────────
function AuthorityComplaintDetailPage({ onNavigate }: { onNavigate: (p: Page) => void }) {
  type CaseStatus = "Unresolved" | "Assessed" | "Assigned" | "In Progress" | "Awaiting Proof" | "Awaiting Verification" | "Resolved" | "Disputed";

  const [caseStatus, setCaseStatus] = useState<CaseStatus>("Unresolved");
  const [modal, setModal] = useState<"" | "assign" | "status" | "proof">("") ;
  const [proofSubmitted, setProofSubmitted] = useState(false);
  const [resolved, setResolved] = useState(false);
  const [disputed, setDisputed] = useState(false);
  const [assignDept, setAssignDept] = useState("Roads & Infrastructure");
  const [assignOfficer, setAssignOfficer] = useState("");
  const [assignNote, setAssignNote] = useState("");
  const [newStatus, setNewStatus] = useState<CaseStatus>("In Progress");
  const [statusNote, setStatusNote] = useState("");
  const [proofNote, setProofNote] = useState("");
  const [entered, setEntered] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const civic = useCivic();
  const liveDetail = useLiveVerification(civic.selectedId);
  const detailComplaint = liveDetail?.complaint ?? null;
  const detailEvents = liveDetail?.events ?? [];
  const displayDetail = detailComplaint ? {
    trackingCode: detailComplaint.tracking_code,
    category: CATEGORY_LABELS[detailComplaint.category] || detailComplaint.category,
    description: detailComplaint.description || CATEGORY_LABELS[detailComplaint.category] || detailComplaint.category,
    priority: PRIORITY_UI[detailComplaint.priority] ?? "NORMAL",
    status: STATUS_UI[detailComplaint.status] ?? detailComplaint.status,
    rawStatus: detailComplaint.status,
    lat: detailComplaint.lat,
    lng: detailComplaint.lng,
    supportCount: detailComplaint.support_count,
    createdAt: detailComplaint.created_at,
    lastActionAt: detailComplaint.last_action_at,
  } : null;
  const lastDetailHash = detailEvents.length ? detailEvents[detailEvents.length - 1].this_hash : null;

  const [timeline, setTimeline] = useState([
    { label: "REPORTED",    time: "Today · 8:42 AM",  done: true },
    { label: "ASSESSED",    time: "Today · 9:05 AM",  done: true },
    { label: "ASSIGNED",    time: "Today · 9:18 AM",  done: true },
    { label: "IN PROGRESS", time: "Today · 10:02 AM", done: true },
    { label: "UNRESOLVED",  time: "Today · 12:42 PM", done: true },
    { label: "ESCALATED",   time: "Pending",           done: false },
  ]);

  useEffect(() => { const t = setTimeout(() => setEntered(true), 60); return () => clearTimeout(t); }, []);

  // Sync local UI state from the actually-selected complaint (fixes "always fallen tree").
  useEffect(() => {
    if (displayDetail) {
      const mapped: CaseStatus =
        displayDetail.rawStatus === "REPORTED" ? "Unresolved"
        : displayDetail.rawStatus === "ASSESSED" ? "Assessed"
        : displayDetail.rawStatus === "IN_PROGRESS" ? "In Progress"
        : displayDetail.rawStatus === "RESOLVED" ? "Resolved"
        : displayDetail.rawStatus === "DISPUTED" ? "Disputed"
        : "Unresolved";
      setCaseStatus(mapped);
      if (detailEvents.length) {
        const { rows } = buildLifecycleTimeline(detailEvents);
        setTimeline(rows.map((r) => ({
          label: r.label === "COMMUNITY SUPPORT" ? `SUPPORT ×${r.supportCount}` : r.label,
          time: r.time,
          done: true,
        })));
      }
      if (displayDetail.rawStatus === "RESOLVED") { setResolved(true); setProofSubmitted(true); }
      if (displayDetail.rawStatus === "DISPUTED") { setDisputed(true); }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [civic.selectedId, liveDetail?.complaint?.id, liveDetail?.events?.length]);

  function showSuccess(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3000);
  }

  function handleAssign() {
    try {
      const id = civic.selectedId;
      if (id) civic.updateStatus(id, "ASSESSED", assignNote || undefined, undefined).catch(() => showSuccess("Offline — change kept locally."));
    } catch { showSuccess("Offline — change kept locally."); }
    setModal("");
    setCaseStatus("Assigned");
    setTimeline(t => t.map(e => e.label === "ASSIGNED" ? { ...e, done: true, time: "Today · Updated" } : e));
    showSuccess("Complaint assigned successfully.");
  }

  function handleStatusUpdate() {
    try {
      const id = civic.selectedId;
      if (id) {
        const backendStatus = (newStatus === "Assessed" || newStatus === "Assigned") ? "ASSESSED"
          : (newStatus === "In Progress" || newStatus === "Awaiting Proof") ? "IN_PROGRESS" : "REPORTED";
        civic.updateStatus(id, backendStatus, statusNote || undefined).catch(() => showSuccess("Offline — change kept locally."));
      }
    } catch { showSuccess("Offline — change kept locally."); }
    setModal("");
    setCaseStatus(newStatus);
    setTimeline(t => [...t.filter(e => e.label !== "ESCALATED"), { label: newStatus.toUpperCase(), time: "Today · Just now", done: true }, { label: "ESCALATED", time: "Pending", done: false }]);
    showSuccess("Status updated.");
  }

  function handleProofSubmit() {
    try {
      const id = civic.selectedId;
      if (id) civic.submitProof(id, "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==").catch(() => showSuccess("Offline — change kept locally."));
    } catch { showSuccess("Offline — change kept locally."); }
    setModal("");
    setProofSubmitted(true);
    setCaseStatus("Awaiting Verification");
    setTimeline(t => [...t.filter(e => e.label !== "ESCALATED"), { label: "PROOF SUBMITTED", time: "Today · Just now", done: true }]);
    showSuccess("Resolution evidence submitted.");
  }

  function handleCitizenConfirm() {
    try {
      const id = civic.selectedId;
      if (id) civic.acceptFix(id).catch(() => showSuccess("Offline — change kept locally."));
    } catch { showSuccess("Offline — change kept locally."); }
    setResolved(true);
    setCaseStatus("Resolved");
    setTimeline(t => [...t, { label: "VERIFIED / RESOLVED", time: "Today · Just now", done: true }]);
    showSuccess("Complaint resolved and verified.");
  }

  function handleCitizenDispute() {
    try {
      const id = civic.selectedId;
      if (id) civic.disputeComplaint(id, undefined).catch(() => showSuccess("Offline — change kept locally."));
    } catch { showSuccess("Offline — change kept locally."); }
    setDisputed(true);
    setCaseStatus("Disputed");
    setTimeline(t => [...t, { label: "REOPENED", time: "Today · Just now", done: true }]);
  }

  const statusColors: Record<string, string> = { Unresolved: "#9B3A3A", "In Progress": "#3A6B9B", Assigned: "#3A6B9B", Assessed: "#B8872A", "Awaiting Proof": "#C4622D", "Awaiting Verification": "#C4622D", Resolved: "#4A7C5F", Disputed: "#9B3A3A" };

  return (
    <div style={{ background: "#F5F0E8", minHeight: "100vh", fontFamily: "var(--font-body)", color: "#1C0A00" }}>
      <AuthorityNav onNavigate={onNavigate} active="complaints" />

      {/* Success toast */}
      {successMsg && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-5 py-3 border" style={{ background: "#FAF7F2", borderColor: "#4A7C5F", borderRadius: "1px", boxShadow: "0 4px 20px rgba(28,10,0,0.12)" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#4A7C5F" }}>✓ {successMsg}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-5 py-8"
        style={{ opacity: entered ? 1 : 0, transform: entered ? "none" : "translateY(14px)", transition: "opacity 0.45s ease, transform 0.45s ease" }}>

        {/* Breadcrumb + back */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => onNavigate("authority-complaint-queue")}
            className="flex items-center gap-1.5 hover:opacity-70 transition-opacity"
            style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#5C4A32" }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M8 2L4 6L8 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
            Complaint Queue
          </button>
          <span style={{ color: "#C8B89A" }}>/</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.1em", color: "#1C0A00" }}>{displayDetail?.trackingCode || civic.selectedCode || "Select a complaint"}</span>
        </div>

        <div className="h-px mb-7" style={{ background: "linear-gradient(to right, #C8B89A, transparent)" }} />

        {/* Disputed warning banner */}
        {disputed && (
          <div className="mb-6 border px-5 py-4 flex items-start gap-3" style={{ borderColor: "#9B3A3A", background: "#FAF7F2", borderRadius: "1px" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 mt-0.5"><path d="M8 2L14 13H2L8 2Z" stroke="#9B3A3A" strokeWidth="1.2" fill="none"/><path d="M8 7V9.5" stroke="#9B3A3A" strokeWidth="1.2" strokeLinecap="round"/><circle cx="8" cy="11.5" r="0.8" fill="#9B3A3A"/></svg>
            <div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#9B3A3A", fontWeight: 700, marginBottom: "3px" }}>Authority Action Required</div>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", color: "#5C4A32", lineHeight: 1.5 }}>This complaint has been reopened. The citizen indicated the issue was not resolved. Please review the case and resubmit evidence.</p>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">

          {/* ── Left: Main content ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Case header card */}
            <div className="border p-6 relative" style={{ background: "#FAF7F2", borderColor: "#C8B89A", borderRadius: "1px" }}>
              <div className="absolute top-0 right-0 w-7 h-7 border-l border-b" style={{ borderColor: "#C8B89A" }} />
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.55, marginBottom: "6px" }}>
                Complaint Detail · {displayDetail?.trackingCode || civic.selectedCode || "—"}
              </div>
              <h1 className="font-display font-bold leading-tight mb-4" style={{ fontSize: "clamp(1.4rem, 2.5vw, 1.9rem)", color: "#1C0A00" }}>
                {displayDetail?.description || "Select a complaint from the queue"}
              </h1>
              <div className="flex flex-wrap items-center gap-2.5 mb-5">
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.1em", textTransform: "uppercase", background: "#EDE5D4", color: "#5C4A32", padding: "3px 8px", borderRadius: "1px" }}>{displayDetail?.category || "—"}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.12em", textTransform: "uppercase", background: "#9B3A3A", color: "#FAF7F2", padding: "3px 8px", borderRadius: "1px" }}>{displayDetail?.priority || "—"}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.1em", textTransform: "uppercase", color: statusColors[caseStatus] ?? "#5C4A32", borderBottom: `1px solid ${statusColors[caseStatus] ?? "#C8B89A"}`, paddingBottom: "1px" }}>{displayDetail?.status || caseStatus}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t" style={{ borderColor: "#EDE5D4" }}>
                {[
                  { l: "Reported",           v: displayDetail ? timeAgo(displayDetail.createdAt) : "—" },
                  { l: "Location",           v: displayDetail ? `${displayDetail.lat.toFixed(4)}°N ${displayDetail.lng.toFixed(4)}°E` : "—" },
                  { l: "Supporting Reports", v: displayDetail ? `${displayDetail.supportCount} citizens` : "—" },
                  { l: "Civic Impact",       v: displayDetail ? `${Math.min(99, 50 + displayDetail.supportCount * 8)} / 100` : "—" },
                ].map(({ l, v }) => (
                  <div key={l}>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.46rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.5, marginBottom: "3px" }}>{l}</div>
                    <div style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "#1C0A00", fontWeight: 600 }}>{v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t flex items-center gap-2" style={{ borderColor: "#EDE5D4" }}>
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.5 1L9.5 3V6C9.5 8.5 5.5 10 5.5 10C5.5 10 1.5 8.5 1.5 6V3L5.5 1Z" stroke="#4A7C5F" strokeWidth="1" fill="none"/></svg>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.48rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#4A7C5F", opacity: 0.8 }}>Citizen Identity Protected</span>
              </div>
            </div>

            {/* Evidence */}
            <div className="border" style={{ background: "#FAF7F2", borderColor: "#C8B89A", borderRadius: "1px" }}>
              <div className="px-5 py-4 border-b" style={{ borderColor: "#EDE5D4" }}>
                <h2 className="font-display font-bold" style={{ fontSize: "1rem", color: "#1C0A00" }}>Evidence</h2>
              </div>
              <div className="p-5">
                <div className="border mb-4 overflow-hidden" style={{ borderColor: "#EDE5D4", borderRadius: "1px", background: "#EDE5D4", height: "180px" }}>
                  <div className="w-full h-full flex items-center justify-center flex-col gap-2" style={{ opacity: 0.4 }}>
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><rect x="4" y="8" width="24" height="18" rx="1" stroke="#5C4A32" strokeWidth="1.5" fill="none"/><circle cx="16" cy="17" r="5" stroke="#5C4A32" strokeWidth="1.5" fill="none"/><path d="M12 8L10 5H7" stroke="#5C4A32" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#5C4A32" }}>Photo Evidence · Complaint Photo</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.46rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.5, marginBottom: "3px" }}>Location</div>
                    <div style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", color: "#1C0A00" }}>{displayDetail ? `${displayDetail.lat.toFixed(4)}°N ${displayDetail.lng.toFixed(4)}°E` : "—"}</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.46rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.5, marginBottom: "3px" }}>Captured</div>
                    <div style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", color: "#1C0A00" }}>{displayDetail ? new Date(displayDetail.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" }) : "—"}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: "#EDE5D4" }}>
                  <div className="flex items-center gap-2">
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1L11 3.5V7C11 10 6.5 12 6.5 12C6.5 12 2 10 2 7V3.5L6.5 1Z" stroke="#4A7C5F" strokeWidth="1" fill="none"/><path d="M4.5 7L5.8 8.3L8.5 6" stroke="#4A7C5F" strokeWidth="1" strokeLinecap="round"/></svg>
                    <div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#4A7C5F" }}>Evidence hash recorded</div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", color: "#5C4A32", opacity: 0.6, letterSpacing: "0.06em", marginTop: "1px" }}>{lastDetailHash ? `0x${lastDetailHash.slice(0, 6)}…${lastDetailHash.slice(-4)}` : "pending"}</div>
                    </div>
                  </div>
                  <button onClick={() => onNavigate("verification")}
                    style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#3A6B9B", textDecoration: "underline", textUnderlineOffset: "3px" }}>
                    View verification
                  </button>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="border" style={{ background: "#FAF7F2", borderColor: "#C8B89A", borderRadius: "1px" }}>
              <div className="px-5 py-4 border-b" style={{ borderColor: "#EDE5D4" }}>
                <h2 className="font-display font-bold" style={{ fontSize: "1rem", color: "#1C0A00" }}>Complaint Timeline</h2>
              </div>
              <div className="p-5">
                <div className="relative">
                  <div className="absolute left-3.5 top-3 bottom-3 w-px" style={{ background: "linear-gradient(to bottom, #C8B89A, transparent)" }} />
                  {timeline.map((e, i) => (
                    <div key={i} className="relative pl-9 mb-5 last:mb-0">
                      <div className="absolute left-0 w-7 h-7 border flex items-center justify-center"
                        style={{ background: e.done ? "#1C0A00" : "#FAF7F2", borderColor: e.done ? "#1C0A00" : "#C8B89A", borderRadius: "1px" }}>
                        {e.done
                          ? <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5.5L4.2 7.5L8 3" stroke="#F5F0E8" strokeWidth="1.2" strokeLinecap="round"/></svg>
                          : <span className="w-2 h-px" style={{ background: "#C8B89A" }} />}
                      </div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.14em", textTransform: "uppercase", color: e.done ? "#1C0A00" : "#5C4A32", opacity: e.done ? 1 : 0.45, fontWeight: e.done ? 700 : 400 }}>{e.label}</div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", color: "#5C4A32", opacity: 0.55, letterSpacing: "0.06em", marginTop: "2px" }}>{e.time}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Verification card */}
            <div className="border" style={{ background: "#FAF7F2", borderColor: "#C8B89A", borderRadius: "1px" }}>
              <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: "#EDE5D4" }}>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1L11 3.5V7C11 10 6.5 12 6.5 12C6.5 12 2 10 2 7V3.5L6.5 1Z" stroke="#4A7C5F" strokeWidth="1.1" fill="none"/><path d="M4.5 7L5.8 8.3L8.5 6" stroke="#4A7C5F" strokeWidth="1.1" strokeLinecap="round"/></svg>
                <h2 className="font-display font-bold" style={{ fontSize: "0.95rem", color: "#1C0A00" }}>Verifiable Civic Record</h2>
              </div>
              <div className="px-5 py-4">
                <div className="space-y-2 mb-4">
                  {[
                    { l: "Complaint Created",   done: true },
                    { l: "Assignment Recorded", done: true },
                    { l: "Status Changes",      done: true },
                    { l: "Evidence Hash",       done: proofSubmitted },
                    { l: "Resolution",          done: resolved },
                  ].map(r => (
                    <div key={r.l} className="flex items-center justify-between">
                      <span style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "#5C4A32" }}>{r.l}</span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", color: r.done ? "#4A7C5F" : "#C8B89A", letterSpacing: "0.06em" }}>{r.done ? "✓ Recorded" : "Pending"}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: "#EDE5D4" }}>
                  <div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.48rem", color: "#5C4A32", opacity: 0.5, letterSpacing: "0.08em" }}>Last event · {displayDetail ? timeAgo(displayDetail.lastActionAt) : "—"}{lastDetailHash ? ` · 0x${lastDetailHash.slice(0, 6)}…${lastDetailHash.slice(-4)}` : ""}</div>
                  </div>
                  <button onClick={() => onNavigate("verification")}
                    className="px-3 py-1.5 border hover:bg-[#EDE5D4] transition-colors"
                    style={{ borderColor: "#C8B89A", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#1C0A00" }}>
                    Full Verification
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right: actions sidebar ── */}
          <div className="space-y-4">

            {/* Citizen verification section (after proof) */}
            {proofSubmitted && !resolved && !disputed && (
              <div className="border p-5" style={{ background: "#FAF7F2", borderColor: "#C4622D", borderRadius: "1px" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#C4622D", marginBottom: "6px" }}>Awaiting Citizen Verification</div>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", color: "#5C4A32", lineHeight: 1.6, marginBottom: "14px" }}>
                  The submitted resolution evidence must be verified before this case is permanently resolved.
                </p>
                <div className="space-y-2">
                  <button onClick={handleCitizenConfirm}
                    className="w-full py-2.5 transition-colors hover:opacity-90"
                    style={{ background: "#4A7C5F", color: "#FAF7F2", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                    Citizen confirms fixed
                  </button>
                  <button onClick={handleCitizenDispute}
                    className="w-full py-2.5 border transition-colors hover:bg-[#EDE5D4]"
                    style={{ borderColor: "#9B3A3A", color: "#9B3A3A", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                    No, issue remains
                  </button>
                </div>
              </div>
            )}

            {/* Resolved state */}
            {resolved && (
              <div className="border p-5" style={{ background: "#FAF7F2", borderColor: "#4A7C5F", borderRadius: "1px" }}>
                <div className="flex items-center gap-2 mb-3">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="#4A7C5F" strokeWidth="1.2" fill="none"/><path d="M5.5 8.5L7.2 10L10.5 7" stroke="#4A7C5F" strokeWidth="1.2" strokeLinecap="round"/></svg>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#4A7C5F", fontWeight: 700 }}>Case Resolved</span>
                </div>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", color: "#5C4A32", lineHeight: 1.6 }}>
                  This complaint has been verified and resolved. The record is now part of the permanent CivicTrace accountability trail.
                </p>
              </div>
            )}

            {/* Actions */}
            {!resolved && (
              <div className="border" style={{ background: "#FAF7F2", borderColor: "#C8B89A", borderRadius: "1px" }}>
                <div className="px-5 py-4 border-b" style={{ borderColor: "#EDE5D4" }}>
                  <h2 className="font-display font-bold" style={{ fontSize: "0.95rem", color: "#1C0A00" }}>Authority Actions</h2>
                </div>
                <div className="p-4 space-y-2.5">
                  <button onClick={() => setModal("assign")}
                    className="w-full py-3 transition-all hover:opacity-90 active:scale-[0.99]"
                    style={{ background: "#1C0A00", color: "#F5F0E8", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.14em", textTransform: "uppercase" }}>
                    Assign Complaint
                  </button>
                  <button onClick={() => setModal("status")}
                    className="w-full py-3 border transition-colors hover:bg-[#EDE5D4]"
                    style={{ borderColor: "#C8B89A", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#1C0A00" }}>
                    Update Status
                  </button>
                  {!proofSubmitted && (
                    <button onClick={() => setModal("proof")}
                      className="w-full py-3 border transition-colors hover:bg-[#EDE5D4]"
                      style={{ borderColor: "#C8B89A", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#1C0A00" }}>
                      Upload Resolution Proof
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Case meta */}
            <div className="border" style={{ background: "#FAF7F2", borderColor: "#C8B89A", borderRadius: "1px" }}>
              <div className="px-5 py-4 border-b" style={{ borderColor: "#EDE5D4" }}>
                <h2 className="font-display font-bold" style={{ fontSize: "0.9rem", color: "#1C0A00" }}>Case Information</h2>
              </div>
              <div className="px-5 py-4 space-y-3">
                {[
                  { l: "Complaint ID",       v: displayDetail?.trackingCode || "—" },
                  { l: "Department",         v: displayDetail?.category || "—" },
                  { l: "Response Window",    v: "4 hours" },
                  { l: "Time Elapsed",       v: displayDetail ? timeAgo(displayDetail.createdAt) : "—" },
                  { l: "Priority",           v: displayDetail?.priority || "—" },
                  { l: "Current Status",     v: displayDetail?.status || caseStatus },
                ].map(({ l, v }) => (
                  <div key={l} className="flex justify-between gap-2 items-start">
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.48rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.55 }}>{l}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "#1C0A00", letterSpacing: "0.06em", textAlign: "right" }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Escalation note */}
            <div className="border px-5 py-4" style={{ background: "#FAF7F2", borderColor: "#C8B89A", borderRadius: "1px" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#9B3A3A", marginBottom: "4px", opacity: 0.8 }}>Escalation Triggered</div>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "#5C4A32", lineHeight: 1.6, marginBottom: "10px" }}>
                This complaint exceeded its expected response window.
              </p>
              <button className="text-left transition-opacity hover:opacity-70"
                style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#3A6B9B", textDecoration: "underline", textUnderlineOffset: "3px" }}>
                View Escalation
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(28,10,0,0.45)" }}
          onClick={() => setModal("")}>
          <div className="border w-full max-w-md relative" style={{ background: "#FAF7F2", borderColor: "#C8B89A", borderRadius: "2px" }}
            onClick={e => e.stopPropagation()}>
            <div className="absolute top-0 right-0 w-7 h-7 border-l border-b" style={{ borderColor: "#C8B89A" }} />

            {/* Assign modal */}
            {modal === "assign" && (
              <div className="p-7">
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.5, marginBottom: "6px" }}>Assign Complaint</div>
                <h3 className="font-display font-bold text-lg mb-5" style={{ color: "#1C0A00" }}>Assign Case</h3>
                <div className="space-y-4 mb-6">
                  <div>
                    <label style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5C4A32", display: "block", marginBottom: "6px" }}>Department / Team</label>
                    <select value={assignDept} onChange={e => setAssignDept(e.target.value)} className="w-full border px-3 py-2 outline-none appearance-none"
                      style={{ background: "#F5F0E8", borderColor: "#C8B89A", borderRadius: "1px", fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "#1C0A00" }}>
                      {["Roads & Infrastructure", "Water & Drainage", "Public Safety", "Sanitation", "Parks & Environment"].map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5C4A32", display: "block", marginBottom: "6px" }}>Officer / Team</label>
                    <input value={assignOfficer} onChange={e => setAssignOfficer(e.target.value)} placeholder="Select or enter officer name"
                      className="w-full border px-3 py-2 outline-none"
                      style={{ background: "#F5F0E8", borderColor: "#C8B89A", borderRadius: "1px", fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "#1C0A00" }} />
                  </div>
                  <div>
                    <label style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5C4A32", display: "block", marginBottom: "6px" }}>Internal Note</label>
                    <textarea value={assignNote} onChange={e => setAssignNote(e.target.value)} rows={3} placeholder="Optional internal note…"
                      className="w-full border px-3 py-2 outline-none resize-none"
                      style={{ background: "#F5F0E8", borderColor: "#C8B89A", borderRadius: "1px", fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "#1C0A00" }} />
                  </div>
                </div>
                <div className="flex gap-2.5">
                  <button onClick={handleAssign} className="flex-1 py-2.5 transition-colors hover:opacity-90"
                    style={{ background: "#1C0A00", color: "#F5F0E8", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                    Assign Complaint
                  </button>
                  <button onClick={() => setModal("")} className="flex-1 py-2.5 border transition-colors hover:bg-[#EDE5D4]"
                    style={{ borderColor: "#C8B89A", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5C4A32" }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Update status modal */}
            {modal === "status" && (
              <div className="p-7">
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.5, marginBottom: "6px" }}>Manage Case</div>
                <h3 className="font-display font-bold text-lg mb-5" style={{ color: "#1C0A00" }}>Update Status</h3>
                <div className="space-y-4 mb-6">
                  <div>
                    <label style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5C4A32", display: "block", marginBottom: "6px" }}>New Status</label>
                    <div className="space-y-1.5">
                      {(["Assessed", "Assigned", "In Progress", "Awaiting Proof", "Unresolved"] as CaseStatus[]).map(s => (
                        <button key={s} onClick={() => setNewStatus(s)}
                          className="w-full text-left px-3 py-2.5 border transition-colors"
                          style={{ background: newStatus === s ? "#1C0A00" : "#F5F0E8", borderColor: newStatus === s ? "#1C0A00" : "#C8B89A", borderRadius: "1px",
                            fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.1em", textTransform: "uppercase",
                            color: newStatus === s ? "#F5F0E8" : "#5C4A32" }}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5C4A32", display: "block", marginBottom: "6px" }}>Update Note</label>
                    <textarea value={statusNote} onChange={e => setStatusNote(e.target.value)} rows={3} placeholder="Optional update note…"
                      className="w-full border px-3 py-2 outline-none resize-none"
                      style={{ background: "#F5F0E8", borderColor: "#C8B89A", borderRadius: "1px", fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "#1C0A00" }} />
                  </div>
                </div>
                <div className="flex gap-2.5">
                  <button onClick={handleStatusUpdate} className="flex-1 py-2.5 transition-colors hover:opacity-90"
                    style={{ background: "#1C0A00", color: "#F5F0E8", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                    Update Status
                  </button>
                  <button onClick={() => setModal("")} className="flex-1 py-2.5 border transition-colors hover:bg-[#EDE5D4]"
                    style={{ borderColor: "#C8B89A", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5C4A32" }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Resolution proof modal */}
            {modal === "proof" && (
              <div className="p-7">
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.5, marginBottom: "6px" }}>Resolution Evidence</div>
                <h3 className="font-display font-bold text-lg mb-1" style={{ color: "#1C0A00" }}>Upload Resolution Proof</h3>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "#5C4A32", lineHeight: 1.6, marginBottom: "18px" }}>
                  A complaint can only move toward resolution when the fix is supported by evidence.
                </p>
                <div className="space-y-4 mb-6">
                  <div className="border-2 border-dashed flex flex-col items-center justify-center py-8 gap-2 cursor-pointer hover:bg-[#EDE5D4] transition-colors"
                    style={{ borderColor: "#C8B89A", borderRadius: "1px" }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 16V8M12 8L9 11M12 8L15 11" stroke="#5C4A32" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/><rect x="4" y="4" width="16" height="16" rx="1" stroke="#C8B89A" strokeWidth="1" fill="none"/></svg>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.6 }}>Upload or drag evidence</span>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "0.7rem", color: "#5C4A32", opacity: 0.4 }}>JPG, PNG, PDF accepted</span>
                  </div>
                  <div>
                    <label style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5C4A32", display: "block", marginBottom: "6px" }}>Resolution Note</label>
                    <textarea value={proofNote} onChange={e => setProofNote(e.target.value)} rows={3} placeholder="Describe the resolution…"
                      className="w-full border px-3 py-2 outline-none resize-none"
                      style={{ background: "#F5F0E8", borderColor: "#C8B89A", borderRadius: "1px", fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "#1C0A00" }} />
                  </div>
                  <div>
                    <label style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5C4A32", display: "block", marginBottom: "6px" }}>Date / Time</label>
                    <input type="text" defaultValue="Today · Just now" className="w-full border px-3 py-2 outline-none"
                      style={{ background: "#F5F0E8", borderColor: "#C8B89A", borderRadius: "1px", fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "#1C0A00" }} />
                  </div>
                </div>
                <div className="flex gap-2.5">
                  <button onClick={handleProofSubmit} className="flex-1 py-2.5 transition-colors hover:opacity-90"
                    style={{ background: "#1C0A00", color: "#F5F0E8", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                    Submit Proof
                  </button>
                  <button onClick={() => setModal("")} className="flex-1 py-2.5 border transition-colors hover:bg-[#EDE5D4]"
                    style={{ borderColor: "#C8B89A", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5C4A32" }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Authority Escalations & Alerts ──────────────────────────────────────────
function AuthorityEscalationsPage({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const civic = useCivic();
  const liveC = useLiveComplaints();

  type EscFilter = "all" | "active" | "approaching" | "reopened" | "disputed";

  type Escalation = {
    id: string;
    issue: string;
    priority: "VERY URGENT" | "URGENT" | "NORMAL";
    reason: string;
    reasonTag: "response-exceeded" | "no-update" | "reopened" | "disputed" | "proof-missing";
    overdue: string;
    level: "Level 1" | "Level 2" | "Level 3";
    filter: Exclude<EscFilter, "all">;
  };

  const mockEscalations: Escalation[] = [
    { id: "CTY-48291-X", issue: "Fallen Tree Blocking Road",  priority: "VERY URGENT", reason: "Response window exceeded",   reasonTag: "response-exceeded", overdue: "2h overdue",  level: "Level 1", filter: "active"      },
    { id: "CTY-77420-K", issue: "Overflowing Bin",            priority: "NORMAL",      reason: "No meaningful update",      reasonTag: "no-update",         overdue: "1d overdue",  level: "Level 1", filter: "active"      },
    { id: "CTY-59301-R", issue: "Broken Streetlight",         priority: "URGENT",      reason: "Citizen reopened case",     reasonTag: "reopened",          overdue: "3h ago",      level: "Level 2", filter: "reopened"    },
    { id: "CTY-21487-P", issue: "Water Leakage on Main St.",  priority: "URGENT",      reason: "Resolution proof missing",  reasonTag: "proof-missing",     overdue: "45m overdue", level: "Level 1", filter: "active"      },
    { id: "CTY-88120-G", issue: "Gas Leak Near Junction",     priority: "VERY URGENT", reason: "Response window exceeded",  reasonTag: "response-exceeded", overdue: "30m overdue", level: "Level 2", filter: "active"      },
    { id: "CTY-10982-D", issue: "Graffiti on Public Wall",    priority: "NORMAL",      reason: "Approaching escalation",   reasonTag: "no-update",         overdue: "In 1h",       level: "Level 1", filter: "approaching" },
    { id: "CTY-44018-N", issue: "Crumbling Footpath",         priority: "NORMAL",      reason: "Approaching escalation",   reasonTag: "proof-missing",     overdue: "In 2h",       level: "Level 1", filter: "approaching" },
    { id: "CTY-55102-Q", issue: "Dead Tree on Public Path",   priority: "URGENT",      reason: "Disputed resolution",      reasonTag: "disputed",          overdue: "2d ago",      level: "Level 2", filter: "disputed"    },
    { id: "CTY-19203-J", issue: "Damaged Bus Shelter",        priority: "NORMAL",      reason: "Disputed resolution",      reasonTag: "disputed",          overdue: "5d ago",      level: "Level 2", filter: "disputed"    },
    { id: "CTY-63041-F", issue: "Park Drainage Failure",      priority: "URGENT",      reason: "No meaningful update",     reasonTag: "no-update",         overdue: "6h overdue",  level: "Level 1", filter: "approaching" },
    { id: "CTY-91047-S", issue: "Traffic Signal Fault",       priority: "VERY URGENT", reason: "Response window exceeded", reasonTag: "response-exceeded", overdue: "1h overdue",  level: "Level 1", filter: "active"      },
    { id: "CTY-34509-H", issue: "Sewage Overflow",            priority: "VERY URGENT", reason: "Citizen reopened case",    reasonTag: "reopened",          overdue: "4h ago",      level: "Level 2", filter: "reopened"    },
    { id: "CTY-72811-L", issue: "Illegal Dumping Site",       priority: "URGENT",      reason: "Approaching escalation",   reasonTag: "no-update",         overdue: "In 45m",      level: "Level 1", filter: "approaching" },
  ];

  // Live escalations (overdue/stalled) with mock fallback.
  const escalations: (Escalation & { backendId: string | null })[] = (liveC.data && liveC.data.length)
    ? liveC.data
        .filter(b => b.status !== "RESOLVED" && b.status !== "DISPUTED")
        .map((b: BackendComplaint) => ({
          id: b.tracking_code,
          backendId: b.id,
          issue: b.description || CATEGORY_LABELS[b.category] || b.category,
          priority: PRIORITY_UI[b.priority] ?? "NORMAL",
          reason: `Inactive since ${timeAgo(b.last_action_at)}`,
          reasonTag: "no-update" as const,
          overdue: `${daysOpen(b.last_action_at)}d`,
          level: "Level 1" as const,
          filter: "active" as const,
        }))
    : mockEscalations.map(m => ({ ...m, backendId: null }));

  const alerts = [
    { time: "10:42 AM", id: "CTY-48291-X", msg: "automatically escalated to Level 2.",    tag: "Escalated",   unread: true  },
    { time: "09:58 AM", id: "CTY-59301-R", msg: "reopened by a citizen.",                 tag: "Reopened",    unread: true  },
    { time: "09:21 AM", id: "CTY-21487-P", msg: "is approaching its escalation window.",  tag: "Approaching", unread: true  },
    { time: "08:44 AM", id: "CTY-77420-K", msg: "has remained unresolved for 24 hours.",  tag: "Unresolved",  unread: false },
    { time: "Yesterday",id: "CTY-88120-G", msg: "escalated automatically — Level 1.",      tag: "Escalated",   unread: false },
    { time: "Yesterday",id: "CTY-55102-Q", msg: "resolution disputed by citizen.",         tag: "Disputed",    unread: false },
  ];

  const reasonLabels: Record<string, string> = {
    "response-exceeded": "Response Window Exceeded",
    "no-update":         "No Meaningful Update",
    "reopened":          "Citizen Reopened",
    "disputed":          "Disputed Resolution",
    "proof-missing":     "Proof Not Submitted",
  };

  const reasonColors: Record<string, string> = {
    "response-exceeded": "#9B3A3A",
    "no-update":         "#B8872A",
    "reopened":          "#C4622D",
    "disputed":          "#9B3A3A",
    "proof-missing":     "#C4622D",
  };

  const [activeFilter, setActiveFilter] = useState<EscFilter>("all");
  const [entered, setEntered] = useState(false);

  useEffect(() => { const t = setTimeout(() => setEntered(true), 60); return () => clearTimeout(t); }, []);

  const filtered = activeFilter === "all" ? escalations : escalations.filter(e => e.filter === activeFilter);

  const tabs: { label: string; f: EscFilter; count: number }[] = [
    { label: "All",         f: "all",         count: escalations.length },
    { label: "Active",      f: "active",       count: escalations.filter(e => e.filter === "active").length },
    { label: "Approaching", f: "approaching",  count: escalations.filter(e => e.filter === "approaching").length },
    { label: "Reopened",    f: "reopened",     count: escalations.filter(e => e.filter === "reopened").length },
    { label: "Disputed",    f: "disputed",     count: escalations.filter(e => e.filter === "disputed").length },
  ];

  function PriorityPill({ p }: { p: Escalation["priority"] }) {
    const s = p === "VERY URGENT" ? { bg: "#9B3A3A", fg: "#FAF7F2" } : p === "URGENT" ? { bg: "#C4622D", fg: "#FAF7F2" } : { bg: "#EDE5D4", fg: "#5C4A32" };
    return <span style={{ background: s.bg, color: s.fg, fontFamily: "var(--font-mono)", fontSize: "0.46rem", letterSpacing: "0.12em", textTransform: "uppercase", padding: "2px 6px", borderRadius: "1px", whiteSpace: "nowrap" }}>{p}</span>;
  }

  function LevelBadge({ level }: { level: Escalation["level"] }) {
    const c = level === "Level 3" ? "#9B3A3A" : level === "Level 2" ? "#C4622D" : "#B8872A";
    return <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.48rem", letterSpacing: "0.1em", textTransform: "uppercase", color: c, border: `1px solid ${c}`, padding: "1px 6px", borderRadius: "1px", whiteSpace: "nowrap", opacity: 0.85 }}>{level}</span>;
  }

  return (
    <div style={{ background: "#F5F0E8", minHeight: "100vh", fontFamily: "var(--font-body)", color: "#1C0A00" }}>
      <AuthorityNav onNavigate={onNavigate} active="escalations" />

      <div className="max-w-7xl mx-auto px-5 py-10"
        style={{ opacity: entered ? 1 : 0, transform: entered ? "none" : "translateY(14px)", transition: "opacity 0.45s ease, transform 0.45s ease" }}>

        {/* ── Page header ── */}
        <div className="mb-7">
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.5, marginBottom: "6px" }}>
            Authority Portal · Escalations
          </div>
          <h1 className="font-display font-bold leading-tight" style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", color: "#1C0A00" }}>Escalations</h1>
          <p style={{ color: "#5C4A32", fontSize: "0.875rem", fontStyle: "italic", marginTop: "5px" }}>
            "When action stops, accountability moves upward."
          </p>
        </div>

        <div className="h-px mb-8" style={{ background: "linear-gradient(to right, #C8B89A, transparent)" }} />

        {/* ── Summary cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-9">
          {[
            { label: "Active Escalations",  value: "5",  color: "#9B3A3A", hint: "Require immediate action" },
            { label: "Approaching",         value: "8",  color: "#C4622D", hint: "Window closing soon"      },
            { label: "Reopened Cases",      value: "3",  color: "#B8872A", hint: "Citizen disputed or reopened" },
            { label: "Disputed Cases",      value: "2",  color: "#5C4A32", hint: "Resolution rejected"      },
          ].map(s => (
            <div key={s.label} className="card-lift border p-4 relative" style={{ background: "#FAF7F2", borderColor: "#C8B89A", borderRadius: "1px" }}>
              <div className="font-display font-bold" style={{ fontSize: "2rem", color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5C4A32", margin: "5px 0 4px" }}>{s.label}</div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: "0.65rem", color: "#5C4A32", opacity: 0.55, lineHeight: 1.4 }}>{s.hint}</div>
            </div>
          ))}
        </div>

        {/* ── Main grid: list + sidebar ── */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Escalation list — 2/3 */}
          <div className="lg:col-span-2 space-y-4">

            {/* Section header + filter chips */}
            <div className="flex flex-col gap-3">
              <div>
                <h2 className="font-display font-bold" style={{ fontSize: "1.15rem", color: "#1C0A00" }}>Cases Requiring Escalation</h2>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.5, marginTop: "3px" }}>
                  {filtered.length} case{filtered.length !== 1 ? "s" : ""} shown
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {tabs.map(({ label, f, count }) => (
                  <button key={f} onClick={() => setActiveFilter(f)}
                    className="flex items-center gap-1.5 px-3 py-1.5 border transition-colors flex-shrink-0"
                    style={{ background: activeFilter === f ? "#1C0A00" : "#FAF7F2", borderColor: activeFilter === f ? "#1C0A00" : "#C8B89A", borderRadius: "1px", color: activeFilter === f ? "#F5F0E8" : "#5C4A32", fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    {label}
                    <span style={{ opacity: activeFilter === f ? 0.65 : 0.45 }}>{count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Desktop table */}
            <div className="hidden md:block border" style={{ background: "#FAF7F2", borderColor: "#C8B89A", borderRadius: "1px" }}>
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: "#EDE5D4" }}>
                    {["Complaint", "Priority", "Reason", "Time", "Level", "Action"].map(h => (
                      <th key={h} className="px-4 py-3 text-left" style={{ fontFamily: "var(--font-mono)", fontSize: "0.44rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.5, fontWeight: 400 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(e => (
                    <tr key={e.id} onClick={() => { civic.select(e.backendId ?? null, e.id); onNavigate("authority-complaint-detail"); }}
                      className="border-b cursor-pointer transition-colors hover:bg-[#EDE5D4] last:border-0"
                      style={{ borderColor: "#EDE5D4" }}>
                      <td className="px-4 py-3.5">
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", color: "#1C0A00", letterSpacing: "0.06em" }}>{e.id}</div>
                        <div style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "#5C4A32", marginTop: "2px" }}>{e.issue}</div>
                      </td>
                      <td className="px-4 py-3.5"><PriorityPill p={e.priority} /></td>
                      <td className="px-4 py-3.5">
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.48rem", letterSpacing: "0.08em", textTransform: "uppercase", color: reasonColors[e.reasonTag], opacity: 0.85, whiteSpace: "nowrap" }}>
                          {reasonLabels[e.reasonTag]}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", color: e.overdue.includes("overdue") || e.overdue.includes("ago") ? "#9B3A3A" : "#4A7C5F", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                          {e.overdue}
                        </span>
                      </td>
                      <td className="px-4 py-3.5"><LevelBadge level={e.level} /></td>
                      <td className="px-4 py-3.5">
                        <button onClick={ev => { ev.stopPropagation(); civic.select(e.backendId ?? null, e.id); onNavigate("authority-complaint-detail"); }}
                          className="px-3 py-1.5 border transition-colors hover:bg-[#1C0A00] hover:text-[#F5F0E8] hover:border-[#1C0A00]"
                          style={{ borderColor: "#C8B89A", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.46rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#1C0A00" }}>
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="px-4 py-12 text-center" style={{ fontFamily: "var(--font-body)", fontSize: "0.875rem", color: "#5C4A32", opacity: 0.45 }}>
                  No escalations in this category.
                </div>
              )}
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-2.5">
              {filtered.length === 0 ? (
                <div className="border px-5 py-10 text-center" style={{ background: "#FAF7F2", borderColor: "#C8B89A", borderRadius: "1px" }}>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "0.875rem", color: "#5C4A32", opacity: 0.45 }}>No escalations in this category.</p>
                </div>
              ) : filtered.map(e => (
                <div key={e.id} className="border p-4 cursor-pointer transition-colors hover:bg-[#EDE5D4]"
                  style={{ background: "#FAF7F2", borderColor: "#C8B89A", borderRadius: "1px" }}
                  onClick={() => { civic.select(e.backendId ?? null, e.id); onNavigate("authority-complaint-detail"); }}>
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", color: "#5C4A32", letterSpacing: "0.08em" }}>{e.id}</div>
                      <div className="font-display font-semibold" style={{ fontSize: "0.875rem", color: "#1C0A00", marginTop: "1px" }}>{e.issue}</div>
                    </div>
                    <PriorityPill p={e.priority} />
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.46rem", letterSpacing: "0.08em", textTransform: "uppercase", color: reasonColors[e.reasonTag], opacity: 0.85, marginBottom: "10px" }}>
                    {reasonLabels[e.reasonTag]}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <LevelBadge level={e.level} />
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.48rem", color: e.overdue.includes("overdue") ? "#9B3A3A" : "#5C4A32" }}>{e.overdue}</span>
                    </div>
                    <button onClick={ev => { ev.stopPropagation(); civic.select(e.backendId ?? null, e.id); onNavigate("authority-complaint-detail"); }}
                      className="px-3 py-1.5 border transition-colors"
                      style={{ borderColor: "#C8B89A", borderRadius: "1px", fontFamily: "var(--font-mono)", fontSize: "0.46rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#1C0A00", background: "#FAF7F2" }}>
                      Review
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Reason legend */}
            <div className="border px-5 py-4" style={{ background: "#FAF7F2", borderColor: "#C8B89A", borderRadius: "1px" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.48rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.5, marginBottom: "10px" }}>Escalation Reasons</div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(reasonLabels).map(([key, label]) => (
                  <span key={key} style={{ fontFamily: "var(--font-mono)", fontSize: "0.46rem", letterSpacing: "0.1em", textTransform: "uppercase", color: reasonColors[key], border: `1px solid ${reasonColors[key]}`, padding: "2px 8px", borderRadius: "1px", opacity: 0.8 }}>
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* ── Sidebar — 1/3 ── */}
          <div className="space-y-4">

            {/* Automatic escalation info */}
            <div className="border" style={{ background: "#FAF7F2", borderColor: "#C8B89A", borderRadius: "1px" }}>
              <div className="px-5 py-4 border-b" style={{ borderColor: "#EDE5D4" }}>
                <h2 className="font-display font-bold" style={{ fontSize: "0.95rem", color: "#1C0A00" }}>Automatic Escalation</h2>
              </div>
              <div className="px-5 py-4">
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", color: "#5C4A32", lineHeight: 1.65, marginBottom: "16px" }}>
                  CivicTrace monitors priority, response windows, status changes, supporting reports, and reopen events.
                </p>

                <div className="space-y-3 mb-5">
                  {[
                    { p: "NORMAL",      c: "#5C4A32", w: "Standard response window", bg: "#EDE5D4" },
                    { p: "URGENT",      c: "#C4622D", w: "Shorter response window",  bg: "#FAF7F2" },
                    { p: "VERY URGENT", c: "#9B3A3A", w: "Immediate attention",      bg: "#FAF7F2" },
                  ].map(({ p, c, w, bg }) => (
                    <div key={p} className="flex items-center gap-3 p-2.5 border" style={{ borderColor: "#EDE5D4", borderRadius: "1px", background: bg }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.46rem", letterSpacing: "0.12em", textTransform: "uppercase", color: c, background: p === "NORMAL" ? "#EDE5D4" : c + "18", padding: "2px 6px", borderRadius: "1px", whiteSpace: "nowrap", border: `1px solid ${c}40` }}>{p}</span>
                      <span style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "#5C4A32" }}>{w}</span>
                    </div>
                  ))}
                </div>

                {/* Escalation flow */}
                <div className="pt-4 border-t" style={{ borderColor: "#EDE5D4" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.46rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#5C4A32", opacity: 0.5, marginBottom: "10px" }}>When window passes without action</div>
                  <div className="relative pl-5">
                    <div className="absolute left-2 top-2 bottom-2 w-px" style={{ background: "linear-gradient(to bottom, #9B3A3A, transparent)" }} />
                    {["Unresolved", "Escalated", "Higher Authority", "Accountability Record"].map((step, i) => (
                      <div key={step} className="relative mb-4 last:mb-0">
                        <div className="absolute -left-5 w-3.5 h-3.5 border flex items-center justify-center" style={{ background: i === 0 ? "#9B3A3A" : "#FAF7F2", borderColor: i === 0 ? "#9B3A3A" : "#C8B89A", borderRadius: "1px", top: "1px" }}>
                          {i === 0 && <span className="w-1 h-1 rounded-full" style={{ background: "#FAF7F2" }} />}
                        </div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.1em", textTransform: "uppercase", color: i === 0 ? "#9B3A3A" : "#5C4A32", opacity: i === 0 ? 1 : 0.65, fontWeight: i === 0 ? 700 : 400 }}>{step}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent alerts */}
            <div className="border" style={{ background: "#FAF7F2", borderColor: "#C8B89A", borderRadius: "1px" }}>
              <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "#EDE5D4" }}>
                <h2 className="font-display font-bold" style={{ fontSize: "0.95rem", color: "#1C0A00" }}>Recent Alerts</h2>
                <span className="w-2 h-2 rounded-full" style={{ background: "#9B3A3A", boxShadow: "0 0 0 3px rgba(155,58,58,0.15)" }} />
              </div>
              <div className="divide-y" style={{ borderColor: "#EDE5D4" }}>
                {alerts.map((a, i) => {
                  const tagColors: Record<string, string> = { Escalated: "#9B3A3A", Reopened: "#C4622D", Approaching: "#B8872A", Unresolved: "#9B3A3A", Disputed: "#9B3A3A" };
                  const tc = tagColors[a.tag] ?? "#5C4A32";
                  return (
                    <div key={i} className="px-4 py-3.5 cursor-pointer hover:bg-[#EDE5D4] transition-colors"
                      onClick={() => { civic.select(null, a.id); onNavigate("authority-complaint-detail"); }}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.46rem", letterSpacing: "0.08em", color: "#5C4A32", opacity: 0.5 }}>{a.time}</span>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.44rem", letterSpacing: "0.1em", textTransform: "uppercase", color: tc, borderBottom: `1px solid ${tc}`, paddingBottom: "1px", opacity: 0.85 }}>{a.tag}</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        {a.unread && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ background: "#9B3A3A" }} />}
                        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "#1C0A00", lineHeight: 1.5 }}>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "#1C0A00", letterSpacing: "0.05em" }}>{a.id}</span>
                          {" "}{a.msg}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Editorial closing note */}
            <div className="border px-5 py-5" style={{ background: "#FAF7F2", borderColor: "#C8B89A", borderRadius: "1px" }}>
              <div className="h-px mb-5" style={{ background: "linear-gradient(to right, transparent, #C8B89A, transparent)" }} />
              <blockquote className="font-display italic text-center" style={{ fontSize: "0.9rem", color: "#5C4A32", lineHeight: 1.75 }}>
                "A complaint does not disappear because nobody acted."
              </blockquote>
              <div className="mt-4" style={{ fontFamily: "var(--font-mono)", fontSize: "0.48rem", color: "#5C4A32", opacity: 0.35, letterSpacing: "0.1em", textTransform: "uppercase", textAlign: "center" }}>
                CivicTrace · Escalation Module
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 pt-6 border-t" style={{ borderColor: "#C8B89A" }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", color: "#5C4A32", opacity: 0.35, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Escalation events are part of the CivicTrace accountability trail · All actions are logged
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────
// ─── Global Back Button (visible on every page with navigation history) ─────
function GlobalBackButton({ onBack }: { onBack: () => void }) {
  return (
    <button onClick={onBack} aria-label="Go back to previous page"
      className="fixed bottom-5 left-5 z-40 flex items-center gap-2 px-4 py-2.5 border transition-all hover:-translate-x-0.5"
      style={{ background: "#FAF7F2", borderColor: "#1C0A00", color: "#1C0A00", borderRadius: "1px",
        fontFamily: "var(--font-mono)", fontSize: "0.62rem", letterSpacing: "0.1em", textTransform: "uppercase",
        boxShadow: "0 4px 16px rgba(28,10,0,0.15)" }}>
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M7.5 2 L4 6 L7.5 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      Back
    </button>
  );
}

export default function App() {
  const [page, setPage] = useState<Page>("home");
  const [navOpen, setNavOpen] = useState(false);
  // Navigation history so the global Back button returns to the previous page.
  const historyRef = useRef<Page[]>([]);
  const pageRef = useRef<Page>("home");
  const [canGoBack, setCanGoBack] = useState(false);

  function navigate(next: Page) {
    const current = pageRef.current;
    if (next !== current) {
      historyRef.current.push(current);
      if (historyRef.current.length > 30) historyRef.current.shift();
      setCanGoBack(true);
      pageRef.current = next;
      navigate(next);
      window.scrollTo(0, 0);
    }
  }

  function goBack() {
    const prev = historyRef.current.pop();
    if (prev !== undefined) {
      pageRef.current = prev;
      navigate(prev);
      window.scrollTo(0, 0);
    }
    if (historyRef.current.length === 0) setCanGoBack(false);
  }

  const features = [
    { icon: icons.shield, title: "Hidden Identity", desc: "Your identity stays protected while your complaint remains fully accountable to authorities.", tag: "Privacy", },
    { icon: icons.ai, title: "AI Spatial Deduplication", desc: "Similar complaints within proximity merge into one verified civic record, amplifying priority.", tag: "Intelligence", },
    { icon: icons.score, title: "Civic Impact Score", desc: "Measure how strongly an issue affects the community based on reports, location, and urgency.", tag: "Analytics", },
    { icon: icons.proof, title: "Proof of Fix", desc: "Authorities must provide photographic evidence before any complaint can be marked resolved.", tag: "Accountability", },
    { icon: icons.escalate, title: "Automatic Escalation", desc: "Inactive complaints are automatically escalated to higher authorities after set thresholds.", tag: "Enforcement", },
    { icon: icons.chain, title: "Blockchain Verification", desc: "Every important lifecycle event becomes an independently verifiable on-chain record.", tag: "Web3", },
  ];

  const complaints = [
    { id: "CTY-48291-X", issue: "Major Pothole", location: "Sector X, Main Road Junction", priority: "URGENT", status: "IN PROGRESS", score: 87 },
    { id: "CTY-39102-A", issue: "Burst Water Main", location: "Sector A, Grove Street", priority: "VERY URGENT", status: "IN PROGRESS", score: 94 },
    { id: "CTY-55017-M", issue: "Broken Streetlight", location: "Sector M, Park Avenue", priority: "URGENT", status: "REPORTED", score: 62 },
  ];

  let content: React.ReactNode = null;
  if (page === "auth") content = <AuthPage onBack={() => navigate("home")} onSuccess={() => navigate("dashboard")}/>;
  else if (page === "dashboard") content = <CitizenDashboard onNavigate={navigate}/>;
  else if (page === "report-category") content = <ReportCategoryPage onBack={() => navigate("dashboard")} onContinue={() => navigate("report-evidence")}/>;
  else if (page === "report-evidence") content = <ReportEvidencePage onBack={() => navigate("report-category")} onContinue={() => navigate("report-details")}/>;
  else if (page === "report-details") content = <ReportDetailsPage onBack={() => navigate("report-evidence")} onContinue={() => navigate("complaint-submitted")}/>;
  else if (page === "complaint-submitted") content = <ComplaintSubmittedPage onNavigate={navigate}/>;
  else if (page === "my-complaints") content = <MyComplaintsPage onNavigate={navigate}/>;
  else if (page === "complaint-detail") content = <ComplaintDetailPage onNavigate={navigate}/>;
  else if (page === "proof-of-fix") content = <ProofOfFixPage onNavigate={navigate}/>;
  else if (page === "civic-map") content = <PublicCivicMapPage onNavigate={navigate}/>;
  else if (page === "public-record") content = <PublicComplaintRecordPage onNavigate={navigate}/>;
  else if (page === "verification") content = <VerificationPage onNavigate={navigate}/>;
  else if (page === "leaderboard") content = <LeaderboardPage onNavigate={navigate}/>;
  else if (page === "dept-trust") content = <DeptTrustPage onNavigate={navigate}/>;
  else if (page === "impact-dashboard") content = <ImpactDashboardPage onNavigate={navigate}/>;
  else if (page === "about") content = <AboutPage onNavigate={navigate}/>;
  else if (page === "how-it-works") content = <HowItWorksPage onNavigate={navigate}/>;
  else if (page === "authority-login") content = <AuthorityLoginPage onNavigate={navigate}/>;
  else if (page === "authority-dashboard") content = <AuthorityDashboardPage onNavigate={navigate}/>;
  else if (page === "authority-complaint-queue") content = <AuthorityComplaintQueuePage onNavigate={navigate}/>;
  else if (page === "authority-complaint-detail") content = <AuthorityComplaintDetailPage onNavigate={navigate}/>;
  else if (page === "authority-escalations") content = <AuthorityEscalationsPage onNavigate={navigate}/>;
  else content = (
    <div style={{ background: "#F5F0E8", color: "#1C0A00", fontFamily: "var(--font-body)", minHeight: "100vh" }}>

      {/* ── NAVBAR ── */}
      <nav className="sticky top-0 z-50 border-b" style={{ background: "rgba(245,240,232,0.95)", borderColor: "#C8B89A", backdropFilter: "blur(8px)" }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="#" className="flex items-center gap-3">
            <CivicTraceLogo size={34}/>
            <span className="font-display font-bold text-lg tracking-tight" style={{ color: "#1C0A00" }}>CivicTrace</span>
          </a>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-7">
            {["About", "Features", "Map", "Leaderboard", "How It Works"].map(item => (
              item === "About"
                ? <button key={item} onClick={() => navigate("about")}
                    className="nav-link font-mono text-xs tracking-widest uppercase opacity-60 hover:opacity-100 transition-opacity"
                    style={{ color: "#1C0A00" }}>About</button>
                : item === "How It Works"
                ? <button key={item} onClick={() => navigate("how-it-works")}
                    className="nav-link font-mono text-xs tracking-widest uppercase opacity-60 hover:opacity-100 transition-opacity"
                    style={{ color: "#1C0A00" }}>How It Works</button>
                : <a key={item} href={`#${item.toLowerCase().replace(" ", "-")}`}
                    className="nav-link font-mono text-xs tracking-widest uppercase opacity-60 hover:opacity-100 transition-opacity"
                    style={{ color: "#1C0A00" }}>{item}</a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2">
            <button onClick={() => navigate("auth")} className="px-3 py-2 border hover:bg-[#EDE5D4] transition-colors font-mono text-xs tracking-widest uppercase"
              style={{ borderColor: "#C8B89A", color: "#5C4A32", borderRadius: "1px" }}>
              Citizen Login
            </button>
            <button onClick={() => navigate("authority-login")} className="px-3 py-2 border hover:opacity-80 transition-opacity font-mono text-xs tracking-widest uppercase"
              style={{ borderColor: "#1C0A00", color: "#1C0A00", borderRadius: "1px" }}>
              Authority Login
            </button>
          </div>

          {/* Mobile toggle */}
          <button className="md:hidden" onClick={() => setNavOpen(!navOpen)}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 5H17 M3 10H17 M3 15H17" stroke="#1C0A00" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {navOpen && (
          <div className="drawer-in md:hidden border-t px-6 py-4 space-y-3" style={{ borderColor: "#C8B89A", background: "#F5F0E8" }}>
            {["About", "Features", "Map", "Leaderboard", "How It Works"].map(item => (
              item === "About"
                ? <button key={item} onClick={() => { navigate("about"); setNavOpen(false); }}
                    className="block font-mono text-xs tracking-widest uppercase opacity-60"
                    style={{ color: "#1C0A00" }}>About</button>
                : item === "How It Works"
                ? <button key={item} onClick={() => { navigate("how-it-works"); setNavOpen(false); }}
                    className="block font-mono text-xs tracking-widest uppercase opacity-60"
                    style={{ color: "#1C0A00" }}>How It Works</button>
                : <a key={item} href={`#${item.toLowerCase().replace(" ", "-")}`}
                    className="block font-mono text-xs tracking-widest uppercase opacity-60"
                    style={{ color: "#1C0A00" }} onClick={() => setNavOpen(false)}>{item}</a>
            ))}
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-12">
        <div className="grid md:grid-cols-[1fr_1.4fr] gap-12 items-center">
          <div>
            <SectionLabel>Civic Accountability · Web3 Verified</SectionLabel>
            <h1 className="rise-in font-display font-bold italic leading-tight mb-6" style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", color: "#1C0A00" }}>
              A complaint<br/>can be ignored.<br/>
              <span className="not-italic" style={{ color: "#9B3A3A" }}>A verified record</span><br/>cannot.
            </h1>
            <Rule className="mb-6"/>
            <p className="rise-in rise-d1 text-base leading-relaxed mb-8 max-w-md" style={{ color: "#5C4A32", fontFamily: "var(--font-body)" }}>
              CivicTrace turns civic complaints into transparent, trackable and verifiable public records. Every report. Every resolution. Every proof — permanently recorded.
            </p>
            <div className="rise-in rise-d2 flex flex-wrap gap-3">
              <button onClick={() => navigate("auth")} className="btn-primary px-6 py-3 font-mono text-xs tracking-widest uppercase transition-all hover:opacity-90 flex items-center gap-2"
                style={{ background: "#1C0A00", color: "#F5F0E8", borderRadius: "1px" }}>
                <span className="w-2 h-2 rounded-full" style={{ background: "#9B3A3A" }}/>
                Report an Issue
              </button>
              <button onClick={() => navigate("civic-map")} className="px-6 py-3 border font-mono text-xs tracking-widest uppercase transition-colors hover:bg-[#EDE5D4]"
                style={{ borderColor: "#1C0A00", color: "#1C0A00", borderRadius: "1px" }}>
                Explore Civic Map
              </button>
            </div>

            {/* Stats strip */}
            <div className="rise-in rise-d3 flex gap-8 mt-10 pt-8 border-t" style={{ borderColor: "#C8B89A" }}>
              <div>
                <div className="font-display font-bold text-xl" style={{ color: "#1C0A00" }}><AnimatedNumber value={14280} /></div>
                <div className="font-mono text-xs opacity-50 mt-0.5" style={{ color: "#5C4A32" }}>Complaints Filed</div>
              </div>
              <div>
                <div className="font-display font-bold text-xl" style={{ color: "#1C0A00" }}><AnimatedNumber value={91} format={(n) => `${n}%`} /></div>
                <div className="font-mono text-xs opacity-50 mt-0.5" style={{ color: "#5C4A32" }}>Resolution Rate</div>
              </div>
              <div>
                <div className="font-display font-bold text-xl" style={{ color: "#1C0A00" }}>0x verified</div>
                <div className="font-mono text-xs opacity-50 mt-0.5" style={{ color: "#5C4A32" }}>On-Chain Records</div>
              </div>
            </div>
          </div>

          {/* Hero Map */}
          <div className="relative">
            <div className="absolute -top-3 -left-3 w-full h-full border" style={{ borderColor: "#C8B89A", borderRadius: "2px" }}/>
            <div onClick={() => navigate("civic-map")} className="relative border overflow-hidden cursor-pointer group" style={{ borderColor: "#C8B89A", borderRadius: "2px" }}>
              <CivicMap/>
              <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                <MapLegend/>
              </div>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(28,10,0,0.35)" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#F5F0E8", fontWeight: 700 }}>Open Civic Map →</span>
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 font-mono text-xs opacity-30 rotate-90" style={{ color: "#5C4A32" }}>CIVIC MAP · LIVE</div>
          </div>
        </div>
      </section>

      <Rule className="max-w-7xl mx-auto px-6 my-4"/>

      {/* ── FEATURES ── */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-16">
        <Reveal>
        <div className="text-center mb-12">
          <SectionLabel>Feature Showcase</SectionLabel>
          <h2 className="font-display font-bold italic text-4xl" style={{ color: "#1C0A00" }}>
            Built for accountability.<br/>Designed for trust.
          </h2>
        </div>
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={Math.min(i, 5) * 70}>
            <FeatureCard {...f}/>
            </Reveal>
          ))}
        </div>
      </section>

      <Rule className="max-w-7xl mx-auto px-6"/>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-6 py-16">
        <Reveal>
        <div className="text-center mb-12">
          <SectionLabel>The Process</SectionLabel>
          <h2 className="font-display font-bold italic text-4xl mb-3" style={{ color: "#1C0A00" }}>Report. Track. Verify. Escalate.</h2>
          <p className="font-body text-base opacity-60 max-w-xl mx-auto" style={{ color: "#5C4A32" }}>
            A clear, unbreakable chain of civic accountability from first report to verified resolution.
          </p>
        </div>
        </Reveal>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 relative">
          <Reveal delay={0}><ProcessStep num="1" title="Report" desc="Citizen submits evidence, location, and description of the civic issue."/></Reveal>
          <Reveal delay={80}><ProcessStep num="2" title="Track" desc="Follow the complaint lifecycle in real-time with status updates."/></Reveal>
          <Reveal delay={160}><ProcessStep num="3" title="Verify" desc="Check proof of resolution — evidence submitted by authorities."/></Reveal>
          <Reveal delay={240}><ProcessStep num="4" title="Escalate" isLast desc="Unresolved issues automatically escalate to higher authorities."/></Reveal>
        </div>

        {/* Connecting illustration */}
        <div className="hidden md:flex items-center justify-center gap-0 mt-8">
          {["Submitted", "→", "Assessed", "→", "Assigned", "→", "In Progress", "→", "Proof Added", "→", "Resolved"].map((step, i) => (
            <span key={i} className="font-mono text-xs px-2" style={{ color: i % 2 === 1 ? "#C8B89A" : "#5C4A32", opacity: i % 2 === 1 ? 0.5 : 0.7 }}>
              {step}
            </span>
          ))}
        </div>
      </section>

      <Rule className="max-w-7xl mx-auto px-6"/>

      {/* ── CIVIC MAP SECTION ── */}
      <section id="map" className="max-w-7xl mx-auto px-6 py-16">
        <Reveal>
        <div className="grid md:grid-cols-[1fr_2fr] gap-10 items-start">
          <div>
            <SectionLabel>Civic Map</SectionLabel>
            <h2 className="font-display font-bold italic text-3xl mb-4" style={{ color: "#1C0A00" }}>See what your city is dealing with.</h2>
            <p className="font-body text-sm leading-relaxed mb-6 opacity-70" style={{ color: "#5C4A32" }}>
              Every active complaint, resolution, and disputed record — mapped in real time. Filter by status, department, or priority.
            </p>
            <MapLegend/>
            <div className="mt-6 space-y-3">
              {[["24", "Active Issues"], ["18", "In Progress"], ["7", "Disputed"]].map(([n, l]) => (
                <div key={l} className="flex items-center justify-between py-2 border-b" style={{ borderColor: "#EDE5D4" }}>
                  <span className="font-mono text-xs opacity-50" style={{ color: "#5C4A32" }}>{l}</span>
                  <span className="font-display font-bold text-lg" style={{ color: "#1C0A00" }}>{n}</span>
                </div>
              ))}
            </div>
            <button onClick={() => navigate("civic-map")} className="mt-6 w-full py-3 border font-mono text-xs tracking-widest uppercase hover:bg-[#EDE5D4] transition-colors"
              style={{ borderColor: "#1C0A00", color: "#1C0A00", borderRadius: "1px" }}>
              Explore Civic Map
            </button>
          </div>
          <div onClick={() => navigate("civic-map")} className="card-lift border overflow-hidden relative cursor-pointer group" style={{ borderColor: "#C8B89A", borderRadius: "2px" }}>
            <CivicMap/>
            <div className="absolute top-3 right-3 px-3 py-1.5 border font-mono text-xs flex items-center gap-2" style={{ borderColor: "#C8B89A", background: "rgba(245,240,232,0.9)", color: "#5C4A32" }}>
              <span className="live-dot w-1.5 h-1.5 rounded-full inline-block" style={{ background: "#4A7C5F" }}/>
              LIVE · 56 ISSUES
            </div>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(28,10,0,0.35)" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#F5F0E8", fontWeight: 700 }}>Open Civic Map →</span>
            </div>
          </div>
        </div>
        </Reveal>
      </section>

      <Rule className="max-w-7xl mx-auto px-6"/>

      {/* ── CIVIC IMPACT SCORE ── */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <Reveal>
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <SectionLabel>Civic Impact Assessment</SectionLabel>
            <h2 className="font-display font-bold italic text-4xl mb-4" style={{ color: "#1C0A00" }}>
              Not every pothole<br/>is equal.
            </h2>
            <p className="font-body text-base leading-relaxed mb-6 opacity-70" style={{ color: "#5C4A32" }}>
              Our Civic Impact Score weighs supporting reports, location traffic, time unresolved, escalation history, and affected population to prioritise the issues that matter most.
            </p>
            <div className="p-5 border" style={{ background: "#FAF7F2", borderColor: "#C8B89A", borderRadius: "2px" }}>
              <div className="font-mono text-xs tracking-widest uppercase opacity-50 mb-3" style={{ color: "#5C4A32" }}>Score breakdown</div>
              {[["Community Reports", 92], ["Location Severity", 88], ["Time Weight", 85], ["Escalation Factor", 78]].map(([label, val]) => (
                <div key={label as string} className="mb-3">
                  <div className="flex justify-between mb-1">
                    <span className="font-mono text-xs opacity-60" style={{ color: "#5C4A32" }}>{label}</span>
                    <span className="font-mono text-xs font-bold" style={{ color: "#1C0A00" }}>{val}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "#EDE5D4" }}>
                    <div className="h-full rounded-full bar-fill" style={{ width: `${val as number}%`, background: "#9B3A3A" }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-center">
            <CivicImpactCard/>
          </div>
        </div>
        </Reveal>
      </section>

      <Rule className="max-w-7xl mx-auto px-6"/>

      {/* ── BLOCKCHAIN VERIFICATION ── */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <Reveal>
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="flex justify-center md:justify-start">
            <BlockchainRecord onNavigate={navigate}/>
          </div>
          <div>
            <SectionLabel>Blockchain Verification</SectionLabel>
            <h2 className="font-display font-bold italic text-4xl mb-4" style={{ color: "#1C0A00" }}>
              Every important action<br/>leaves a verifiable record.
            </h2>
            <p className="font-body text-base leading-relaxed mb-6 opacity-70" style={{ color: "#5C4A32" }}>
              Key lifecycle events — creation, acknowledgment, assignment, evidence submission, and resolution — are cryptographically hashed and stored on-chain. No authority can alter or delete them.
            </p>
            <div className="space-y-4">
              {[
                { icon: "🔒", label: "Immutable Records", desc: "Once written, lifecycle events cannot be altered or deleted." },
                { icon: "🔍", label: "Independent Verification", desc: "Any citizen can verify any record using the public hash." },
                { icon: "📄", label: "No Crypto Jargon", desc: "Blockchain operates invisibly. You see a record, not a wallet." },
              ].map(({ icon, label, desc }) => (
                <div key={label} className="flex gap-4 p-4 border" style={{ background: "#FAF7F2", borderColor: "#C8B89A", borderRadius: "2px" }}>
                  <span className="text-xl mt-0.5">{icon}</span>
                  <div>
                    <div className="font-display font-semibold text-sm mb-1" style={{ color: "#1C0A00" }}>{label}</div>
                    <div className="font-body text-sm opacity-60" style={{ color: "#5C4A32" }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        </Reveal>
      </section>

      <Rule className="max-w-7xl mx-auto px-6"/>

      {/* ── LEADERBOARD ── */}
      <section id="leaderboard" className="max-w-7xl mx-auto px-6 py-16">
        <Reveal>
        <div className="text-center mb-10">
          <SectionLabel>Department Accountability</SectionLabel>
          <h2 className="font-display font-bold italic text-4xl mb-3" style={{ color: "#1C0A00" }}>Who is actually fixing the city?</h2>
          <p className="font-body text-sm opacity-60 max-w-lg mx-auto" style={{ color: "#5C4A32" }}>
            Departments are ranked by resolution speed, evidence compliance, and reopen rate — computed weekly.
          </p>
        </div>
        </Reveal>

        <Reveal delay={80}>
        <div className="card-lift border overflow-hidden" style={{ borderColor: "#C8B89A", borderRadius: "2px" }}>
          {/* Header row */}
          <div className="grid py-3 px-5 border-b" style={{
            gridTemplateColumns: "2.5rem 1fr 1fr 1fr 1fr 3rem",
            gap: "1rem",
            borderColor: "#C8B89A",
            background: "#EDE5D4",
          }}>
            {["#", "Department", "Resolution", "Avg. Time", "Reopen", "Trust"].map(h => (
              <span key={h} className="font-mono text-xs tracking-widest uppercase opacity-50" style={{ color: "#5C4A32" }}>{h}</span>
            ))}
          </div>
          <DeptRow rank="01" name="Roads" rate="94%" time="2.1 days" reopen="3%" trust={91} active/>
          <DeptRow rank="02" name="Water" rate="89%" time="3.4 days" reopen="5%" trust={88}/>
          <DeptRow rank="03" name="Street Services" rate="82%" time="4.8 days" reopen="8%" trust={79}/>
          <DeptRow rank="04" name="Sanitation" rate="76%" time="6.2 days" reopen="11%" trust={71}/>
        </div>

        {/* Trust score breakdown */}
        <Reveal delay={120}>
        <div className="card-lift mt-10 border p-6" style={{ background: "#FAF7F2", borderColor: "#C8B89A", borderRadius: "2px" }}>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <SectionLabel>Trust Score Breakdown</SectionLabel>
              <h3 className="font-display font-bold text-2xl mb-1" style={{ color: "#1C0A00" }}>Roads Department</h3>
              <div className="flex items-baseline gap-2 mb-5">
                <span className="font-display font-bold text-5xl" style={{ color: "#4A7C5F" }}>91</span>
                <span className="font-body opacity-40" style={{ color: "#5C4A32" }}>/ 100</span>
              </div>
              {[["Resolution Speed", 92], ["Successful Fixes", 94], ["Evidence Compliance", 96], ["Reopen Rate", 88], ["Escalation Rate", 85], ["Consistency", 91]].map(([label, val]) => (
                <div key={label as string} className="mb-3">
                  <div className="flex justify-between mb-1">
                    <span className="font-mono text-xs opacity-60" style={{ color: "#5C4A32" }}>{label}</span>
                    <span className="font-mono text-xs font-bold" style={{ color: "#1C0A00" }}>{val}</span>
                  </div>
                  <div className="w-full h-1 overflow-hidden" style={{ background: "#EDE5D4" }}>
                    <div className="h-full bar-fill" style={{ width: `${val as number}%`, background: "#4A7C5F" }}/>
                  </div>
                </div>
              ))}
            </div>
            {/* Radial indicator */}
            <div className="flex justify-center">
              <svg width="200" height="200" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="80" fill="none" stroke="#EDE5D4" strokeWidth="12"/>
                <circle cx="100" cy="100" r="80" fill="none" stroke="#4A7C5F" strokeWidth="12"
                  strokeDasharray={`${2 * Math.PI * 80 * 0.91} ${2 * Math.PI * 80}`}
                  strokeDashoffset={2 * Math.PI * 80 * 0.25}
                  strokeLinecap="round" style={{ transform: "rotate(-90deg)", transformOrigin: "100px 100px" }}/>
                <circle cx="100" cy="100" r="60" fill="none" stroke="#EDE5D4" strokeWidth="1"/>
                <text x="100" y="96" textAnchor="middle" fontFamily="var(--font-display)" fontSize="36" fontWeight="bold" fill="#1C0A00">91</text>
                <text x="100" y="116" textAnchor="middle" fontFamily="var(--font-body)" fontSize="11" fill="#5C4A32" opacity="0.6">Trust Score</text>
                <text x="100" y="132" textAnchor="middle" fontFamily="var(--font-body)" fontSize="10" fill="#4A7C5F">Roads Dept.</text>
              </svg>
            </div>
          </div>
        </div>
        </Reveal>
        </Reveal>
      </section>

      <Rule className="max-w-7xl mx-auto px-6"/>

      {/* ── CITIZEN DASHBOARD PREVIEW ── */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <Reveal>
        <div className="grid md:grid-cols-[1fr_2fr] gap-10 items-start">
          <div>
            <SectionLabel>Citizen Dashboard</SectionLabel>
            <h2 className="font-display font-bold italic text-3xl mb-4" style={{ color: "#1C0A00" }}>Your complaints.<br/>Your city's record.</h2>
            <p className="font-body text-sm leading-relaxed mb-6 opacity-70" style={{ color: "#5C4A32" }}>
              Track every complaint you have filed across its full lifecycle — from first report to verified resolution.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[["03", "Active", "#9B3A3A"], ["02", "In Progress", "#3A6B9B"], ["08", "Resolved", "#4A7C5F"], ["01", "Disputed", "#B8872A"]].map(([n, l, c]) => (
                <div key={l} className="p-4 border text-center" style={{ background: "#FAF7F2", borderColor: "#C8B89A", borderRadius: "2px" }}>
                  <div className="font-display font-bold text-3xl" style={{ color: c as string }}>{n}</div>
                  <div className="font-mono text-xs opacity-50 mt-1" style={{ color: "#5C4A32" }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            {complaints.map((c, i) => <Reveal key={c.id} delay={Math.min(i, 4) * 80}><ComplaintCard {...c} onNavigate={navigate}/></Reveal>)}
          </div>
        </div>
        </Reveal>
      </section>

      <Rule className="max-w-7xl mx-auto px-6"/>

      {/* ── CTA ── */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <Reveal>
        <SectionLabel>Join the Record</SectionLabel>
        <h2 className="font-display font-bold italic text-5xl mb-4" style={{ color: "#1C0A00" }}>
          Your city.<br/>Your record.<br/><span style={{ color: "#9B3A3A" }}>Your proof.</span>
        </h2>
        <p className="font-body text-base opacity-60 max-w-md mx-auto mb-10" style={{ color: "#5C4A32" }}>
          Every unresolved pothole, every burst pipe, every broken streetlight — now has a permanent, verifiable record.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <button onClick={() => navigate("auth")} className="btn-primary px-8 py-4 font-mono text-xs tracking-widest uppercase flex items-center gap-2 hover:opacity-90 transition-opacity"
            style={{ background: "#1C0A00", color: "#F5F0E8", borderRadius: "1px" }}>
            <span className="w-2 h-2 rounded-full" style={{ background: "#9B3A3A" }}/>
            Report an Issue
          </button>
          <button onClick={() => navigate("civic-map")} className="btn-press px-8 py-4 border font-mono text-xs tracking-widest uppercase hover:bg-[#EDE5D4] transition-colors"
            style={{ borderColor: "#1C0A00", color: "#1C0A00", borderRadius: "1px" }}>
            Explore Civic Map
          </button>
        </div>
        </Reveal>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t" style={{ borderColor: "#C8B89A", background: "#EDE5D4" }}>
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="grid md:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CivicTraceLogo size={28}/>
                <span className="font-display font-bold" style={{ color: "#1C0A00" }}>CivicTrace</span>
              </div>
              <p className="font-body text-sm opacity-60 leading-relaxed" style={{ color: "#5C4A32" }}>
                A civic accountability archive from the future — where every complaint becomes a verifiable public record.
              </p>
            </div>
            {[
              { title: "Platform", links: [
                { label: "Report Issue",  page: "report-category" as Page },
                { label: "Civic Map",     page: "civic-map"       as Page },
                { label: "Dashboard",     page: "dashboard"       as Page },
                { label: "Verify Record", page: "verification"    as Page },
              ]},
              { title: "About", links: [
                { label: "How It Works",  page: "how-it-works" as Page },
                { label: "About",         page: "about"        as Page },
                { label: "Leaderboard",   page: "leaderboard"  as Page },
                { label: "Impact",        page: "impact-dashboard" as Page },
              ]},
              { title: "Legal", links: [
                { label: "Privacy Policy", page: null },
                { label: "Terms of Use",   page: null },
                { label: "Open Data",      page: null },
              ]},
            ].map(({ title, links }) => (
              <div key={title}>
                <div className="font-mono text-xs tracking-widest uppercase opacity-50 mb-3" style={{ color: "#5C4A32" }}>{title}</div>
                <div className="space-y-2">
                  {links.map(({ label, page: p }) => (
                    p
                      ? <button key={label} onClick={() => navigate(p)} className="block font-body text-sm opacity-70 hover:opacity-100 transition-opacity text-left" style={{ color: "#1C0A00" }}>{label}</button>
                      : <span key={label} className="block font-body text-sm opacity-40" style={{ color: "#1C0A00" }}>{label}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <Rule/>
          <div className="flex flex-wrap items-center justify-between gap-4 mt-6">
            <div className="font-mono text-xs opacity-40" style={{ color: "#5C4A32" }}>© 2026 CivicTrace. All civic records preserved.</div>
            <div className="font-mono text-xs opacity-40 flex items-center gap-2" style={{ color: "#5C4A32" }}>
              <span className="live-dot w-1.5 h-1.5 rounded-full" style={{ background: "#4A7C5F" }}/>
              On-chain · Verified · Open
            </div>
          </div>
        </div>
      </footer>
    </div>
  );

  return (
    <PageTransition pageKey={page}>
      {content}
      {page !== "home" && canGoBack && <GlobalBackButton onBack={goBack}/>}
    </PageTransition>
  );
}
