import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { api } from "./api/civictrace";
import type { BackendComplaint, BackendUser } from "./api/civictrace";

// ─── Auth (email + OTP, like real websites) ───

export type UserRole = "citizen" | "authority";

interface AuthState {
  user: BackendUser | null;
  token: string | null;
  /** Signup step 1: validate + send OTP to a new email. Throws on error. */
  signupRequestOtp: (name: string, email: string, role?: UserRole) => Promise<import("./api/civictrace").OtpRequestResponse>;
  /** Signup step 2: verify OTP → creates the account and signs in. */
  signupVerifyOtp: (name: string, email: string, otp: string, role?: UserRole) => Promise<boolean>;
  /** Login step 1: send OTP. Throws NOT_REGISTERED when the email never signed up. */
  loginRequestOtp: (email: string, role?: UserRole) => Promise<import("./api/civictrace").OtpRequestResponse>;
  /** Login step 2: verify OTP → signs in. Only works for existing accounts. */
  loginVerifyOtp: (email: string, otp: string, role?: UserRole) => Promise<boolean>;
  logout: () => void;
  authError: string;
}

// ─── Report draft (shared across the 3 report steps) ───

export interface ReportLocation {
  lat: number;
  lng: number;
  accuracy: number | null; // GPS accuracy in meters (null when unknown/manual)
  address: string | null; // reverse-geocoded address
  source: "gps" | "map_search" | "manual_adjustment";
  confirmed: boolean;
  timestamp: string | null; // ISO capture/confirm time
}

export interface ReportDraft {
  category: string;
  categoryLabel: string;
  priority: string; // backend value: normal | urgent | very_urgent
  priorityLabel: string;
  photoDataUrl: string | null;
  photoNote: string;
  summary: string;
  description: string;
  lat: number | null;
  lng: number | null;
  /** Round 3: confirmed complaint location (required to submit). */
  location: ReportLocation | null;
}

const DEFAULT_DRAFT: ReportDraft = {
  category: "",
  categoryLabel: "",
  priority: "normal",
  priorityLabel: "Normal",
  photoDataUrl: null,
  photoNote: "",
  summary: "",
  description: "",
  lat: null,
  lng: null,
  location: null,
};

// Fallback location (New Delhi) when geolocation is unavailable.
const FALLBACK_LAT = 28.6139;
const FALLBACK_LNG = 77.209;

export interface RepeatSignal {
  tracking_code: string;
  status: string;
  resolved_at: string | null;
  distance_m: number;
  proof_available: boolean;
  confidence: number;
}

export interface SubmitResult {
  ok: boolean;
  merged: boolean;
  complaint: BackendComplaint | null;
  trackingCode: string;
  repeat: RepeatSignal | null;
  error: string;
}

interface CivicState extends AuthState {
  draft: ReportDraft;
  setDraft: (patch: Partial<ReportDraft>) => void;
  resetDraft: () => void;
  /** Selected complaint for detail / verification / authority pages. */
  selectedId: string | null;
  selectedCode: string | null;
  select: (id: string | null, code?: string | null) => void;
  /** When true, VerificationPage auto-expands blockchain proof on mount. */
  expandProof: boolean;
  setExpandProof: (v: boolean) => void;
  lastResult: SubmitResult | null;
  submitting: boolean;
  submitReport: () => Promise<SubmitResult>;
  updateStatus: (id: string, toStatus: string, note?: string, departmentId?: string) => Promise<void>;
  submitProof: (
    id: string,
    photoDataUrl: string,
    resolution?: { lat: number; lng: number; accuracy?: number | null; timestamp?: string | null } | null
  ) => Promise<void>;
  disputeComplaint: (id: string, reason?: string) => Promise<void>;
  acceptFix: (id: string) => Promise<void>;
  actionError: string;
}

const CivicContext = createContext<CivicState | null>(null);

export function CivicProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<BackendUser | null>(() => {
    try {
      const raw = localStorage.getItem("civictrace_user");
      return raw ? (JSON.parse(raw) as BackendUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("civictrace_token")
  );
  const [authError, setAuthError] = useState("");
  const [actionError, setActionError] = useState("");
  const [draft, setDraftState] = useState<ReportDraft>(DEFAULT_DRAFT);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<SubmitResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [expandProof, setExpandProof] = useState(false);

  // Best-effort geolocation once (report submit falls back to Delhi coords).
  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setDraftState((d) =>
          d.lat == null ? { ...d, lat: pos.coords.latitude, lng: pos.coords.longitude } : d
        ),
      () => {},
      { timeout: 8000 }
    );
  }, []);

  const persistSession = useCallback((token: string, user: BackendUser) => {
    localStorage.setItem("civictrace_token", token);
    localStorage.setItem("civictrace_user", JSON.stringify(user));
    setToken(token);
    setUser(user);
    // Clear any complaint selected by a previous account so verification
    // pages never show another citizen's record.
    setSelectedId(null);
    setSelectedCode(null);
  }, []);

  const signupRequestOtp = useCallback(async (name: string, email: string, role?: UserRole) => {
    setAuthError("");
    return api.signupRequestOtp(name, email, role);
  }, []);

  const signupVerifyOtp = useCallback(async (name: string, email: string, otp: string, role?: UserRole) => {
    setAuthError("");
    try {
      const res = await api.signupVerifyOtp(name, email, otp, role);
      persistSession(res.token, res.user);
      return true;
    } catch (e) {
      setAuthError(e instanceof Error ? e.message : "Verification failed");
      throw e;
    }
  }, [persistSession]);

  const loginRequestOtp = useCallback(async (email: string, role?: UserRole) => {
    setAuthError("");
    return api.loginRequestOtp(email, role);
  }, []);

  const loginVerifyOtp = useCallback(async (email: string, otp: string, role?: UserRole) => {
    setAuthError("");
    try {
      const res = await api.loginVerifyOtp(email, otp, role);
      persistSession(res.token, res.user);
      return true;
    } catch (e) {
      setAuthError(e instanceof Error ? e.message : "Verification failed");
      throw e;
    }
  }, [persistSession]);

  const logout = useCallback(() => {
    localStorage.removeItem("civictrace_token");
    localStorage.removeItem("civictrace_user");
    setToken(null);
    setUser(null);
    setSelectedId(null);
    setSelectedCode(null);
  }, []);

  const setDraft = useCallback((patch: Partial<ReportDraft>) => {
    setDraftState((d) => ({ ...d, ...patch }));
  }, []);

  const resetDraft = useCallback(() => setDraftState(DEFAULT_DRAFT), []);

  const select = useCallback((id: string | null, code?: string | null) => {
    setSelectedId(id);
    setSelectedCode(code ?? null);
  }, []);

  const submitReport = useCallback(async (): Promise<SubmitResult> => {
    setSubmitting(true);
    setActionError("");
    try {
      // Round 3: a confirmed location is mandatory — never silently fall back.
      if (!draft.location?.confirmed) {
        throw new Error("Please confirm the complaint location on the map before submitting.");
      }
      const res = await api.createComplaint({
        category: draft.category || "roads",
        description: draft.description || draft.summary || undefined,
        lat: draft.location.lat,
        lng: draft.location.lng,
        priority: draft.priority,
        location: {
          lat: draft.location.lat,
          lng: draft.location.lng,
          accuracy: draft.location.accuracy,
          address: draft.location.address,
          source: draft.location.source,
          confirmed: true,
          timestamp: draft.location.timestamp,
        },
        ...(draft.photoDataUrl
          ? { photo: { dataUrl: draft.photoDataUrl, capturedAt: new Date().toISOString() } }
          : {}),
      });
      const result: SubmitResult = {
        ok: true,
        merged: res.merged,
        complaint: res.complaint,
        trackingCode: res.complaint.tracking_code,
        repeat: (res.repeat ?? null) as RepeatSignal | null,
        error: "",
      };
      setLastResult(result);
      select(res.complaint.id, res.complaint.tracking_code);
      return result;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Submit failed";
      setActionError(message);
      const result: SubmitResult = { ok: false, merged: false, complaint: null, trackingCode: "", repeat: null, error: message };
      setLastResult(result);
      return result;
    } finally {
      setSubmitting(false);
    }
  }, [draft, select]);

  const updateStatus = useCallback(async (id: string, toStatus: string, note?: string, departmentId?: string) => {
    setActionError("");
    try {
      await api.updateStatus(id, toStatus, note, departmentId);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Status update failed";
      setActionError(message);
      throw new Error(message);
    }
  }, []);

  const submitProof = useCallback(async (
    id: string,
    photoDataUrl: string,
    resolution?: { lat: number; lng: number; accuracy?: number | null; timestamp?: string | null } | null
  ) => {
    setActionError("");
    try {
      await api.proofOfFix(id, { dataUrl: photoDataUrl, capturedAt: new Date().toISOString() }, resolution ?? null);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Proof upload failed";
      setActionError(message);
      throw new Error(message);
    }
  }, []);

  const disputeComplaint = useCallback(async (id: string, reason?: string) => {
    setActionError("");
    try {
      await api.dispute(id, reason);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Dispute failed";
      setActionError(message);
      throw new Error(message);
    }
  }, []);

  const acceptFix = useCallback(async (id: string) => {
    setActionError("");
    try {
      await api.acceptFix(id);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Accept failed";
      setActionError(message);
      throw new Error(message);
    }
  }, []);

  const value = useMemo<CivicState>(
    () => ({
      user, token, signupRequestOtp, signupVerifyOtp, loginRequestOtp, loginVerifyOtp, logout, authError,
      draft, setDraft, resetDraft,
      selectedId, selectedCode, select,
      expandProof, setExpandProof,
      lastResult, submitting, submitReport,
      updateStatus, submitProof, disputeComplaint, acceptFix,
      actionError,
    }),
    [user, token, signupRequestOtp, signupVerifyOtp, loginRequestOtp, loginVerifyOtp, logout, authError, draft, setDraft, resetDraft,
      selectedId, selectedCode, select, expandProof,
      lastResult, submitting, submitReport,
      updateStatus, submitProof, disputeComplaint, acceptFix, actionError]
  );

  return <CivicContext.Provider value={value}>{children}</CivicContext.Provider>;
}

export function useCivic(): CivicState {
  const ctx = useContext(CivicContext);
  if (!ctx) throw new Error("useCivic must be used inside CivicProvider");
  return ctx;
}

// ─── Live-data hooks (null data = backend unreachable → keep mock fallback) ───

function useLive<T>(fetcher: () => Promise<T>): { data: T | null; refresh: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let cancelled = false;
    fetcher()
      .then((d) => { if (!cancelled) setData(d); })
      .catch(() => { if (!cancelled) setData(null); });
    return () => { cancelled = true; };
  }, [tick]); // eslint-disable-line react-hooks/exhaustive-deps
  return { data, refresh: () => setTick((t) => t + 1) };
}

export function useLiveComplaints() {
  return useLive(api.listComplaints);
}

export function useLiveMyComplaints() {
  return useLive(api.myComplaints);
}

export function useLiveLeaderboard() {
  return useLive(api.leaderboard);
}

export function useLiveNotifications(departmentId?: string) {
  return useLive(() => api.notifications(departmentId));
}

export function useLiveDepartments() {
  return useLive(api.departments);
}

export function useLiveVerification(complaintId: string | null) {
  const [state, setState] = useState<{ valid: boolean; events: import("./api/civictrace").BackendStatusEvent[]; complaint: BackendComplaint | null; onchain?: import("./api/civictrace").VerificationOnchain } | null>(null);
  useEffect(() => {
    if (!complaintId) { setState(null); return; }
    let cancelled = false;
    api.verification(complaintId)
      .then((v) => { if (!cancelled) setState({ valid: v.chain_valid, events: v.events, complaint: v.complaint, onchain: v.onchain }); })
      .catch(() => { if (!cancelled) setState(null); });
    return () => { cancelled = true; };
  }, [complaintId]);
  return state;
}
