const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:4000";

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
) {
  const token = localStorage.getItem("civictrace_token");
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "x-user-id": token } : {}),
      ...(options.headers || {}),
    },
  });

  // Backend error middleware always returns JSON, but guard anyway:
  // proxies / CORS blocks / empty bodies can be non-JSON.
  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : await response.text().catch(() => "");

  if (!response.ok) {
    const message =
      (data && typeof data === "object" && (data as { error?: string }).error) ||
      (typeof data === "string" && data.slice(0, 200)) ||
      `Request failed (${response.status})`;
    throw new Error(message);
  }

  return data;
}

// ─── Backend types (snake_case, as returned by the Express API) ───

export interface BackendUser {
  id: string;
  name: string;
  role: string;
}

export interface BackendComplaint {
  id: string;
  tracking_code: string;
  category: string;
  description: string | null;
  lat: number;
  lng: number;
  priority: "normal" | "urgent" | "very_urgent";
  status: "REPORTED" | "ASSESSED" | "IN_PROGRESS" | "RESOLVED" | "DISPUTED";
  department_id: string | null;
  support_count: number;
  last_action_at: string;
  created_at: string;
  resolved_at: string | null;
}

export interface BackendDepartment {
  id: string;
  name: string;
  category: string;
}

export interface BackendNotification {
  id: string;
  department_id: string;
  complaint_id: string;
  message: string;
  created_at: string;
  read: boolean;
}

export interface MyComplaintsPayload {
  filed: BackendComplaint[];
  supported: BackendComplaint[];
  activity: BackendStatusEvent[];
}

export interface BackendStatusEvent {
  id: string;
  complaint_id: string;
  from_status: string | null;
  to_status: string;
  actor_id: string | null;
  actor_role: string | null;
  note: string | null;
  prev_hash: string;
  this_hash: string;
  created_at: string;
  link_ok?: boolean;
  hash_ok?: boolean;
  // Additive Web3 fields — absent until migration + ONCHAIN_ENABLED.
  tx_hash?: string | null;
  chain_id?: number | null;
}

export interface VerificationOnchain {
  enabled: boolean;
  match?: boolean;
  contract?: string | null;
  chainId?: number | null;
  explorer?: string | null;
  onchainHash?: string | null;
  anchorTx?: string | null;
  txUrl?: string | null;
  error?: string;
}

export interface LeaderboardRow {
  rank: number;
  department_id: string;
  department_name: string;
  total_complaints: number;
  resolved_count: number;
  avg_resolution_hours: number | null;
  reopened_count: number;
  escalated_count: number;
}

// ─── Endpoint helpers ───

const post = (endpoint: string, body: unknown) =>
  apiFetch(endpoint, { method: "POST", body: JSON.stringify(body) });

export const api = {
  login: (name: string, contact: string, role?: string): Promise<{ token: string; user: BackendUser }> =>
    post("/auth/login", { name, contact, role }),

  createComplaint: (body: {
    category: string;
    description?: string;
    lat: number;
    lng: number;
    priority?: string;
    photo?: { dataUrl: string; capturedAt?: string };
  }): Promise<{ merged: boolean; dedup_score?: number; distance_m?: number | null; complaint: BackendComplaint; tracking_code?: string }> =>
    post("/complaints", body),

  listComplaints: (params?: { status?: string; department_id?: string }): Promise<BackendComplaint[]> => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return apiFetch(`/complaints${q ? `?${q}` : ""}`);
  },

  /** The logged-in citizen's own records (filed + supported + activity). */
  myComplaints: (): Promise<MyComplaintsPayload> => apiFetch("/complaints/mine"),

  trackComplaint: (code: string): Promise<BackendComplaint> =>
    apiFetch(`/complaints/track/${encodeURIComponent(code)}`),

  updateStatus: (id: string, toStatus: string, note?: string, departmentId?: string) =>
    post(`/complaints/${id}/status`, { toStatus, note, departmentId }),

  proofOfFix: (id: string, photo: { dataUrl: string; capturedAt?: string }) =>
    post(`/complaints/${id}/proof-of-fix`, { photo }),

  acceptFix: (id: string) => post(`/complaints/${id}/accept`, {}),

  dispute: (id: string, reason?: string) => post(`/complaints/${id}/dispute`, { reason }),

  verification: (id: string): Promise<{ complaint: BackendComplaint; chain_valid: boolean; events: BackendStatusEvent[]; onchain?: VerificationOnchain }> =>
    apiFetch(`/complaints/${id}/verification`),

  leaderboard: (): Promise<LeaderboardRow[]> => apiFetch("/leaderboard"),

  notifications: (department_id?: string): Promise<BackendNotification[]> =>
    apiFetch(`/notifications${department_id ? `?department_id=${encodeURIComponent(department_id)}` : ""}`),

  departments: (): Promise<BackendDepartment[]> => apiFetch("/departments"),

  runEscalation: (): Promise<{ ok: boolean }> => post("/admin/run-escalation", {}),
};

// ─── Display maps (backend values → UI labels) ───

export const CATEGORY_LABELS: Record<string, string> = {
  roads: "Roads & Infrastructure",
  water: "Water & Drainage",
  sanitation: "Sanitation",
  safety: "Public Safety",
  parks: "Parks & Public Spaces",
  environment: "Environment",
  pothole: "Roads & Infrastructure",
  garbage: "Sanitation",
  fallen_tree: "Public Safety",
  water_leak: "Water & Drainage",
};

export const PRIORITY_UI: Record<string, "NORMAL" | "URGENT" | "VERY URGENT"> = {
  normal: "NORMAL",
  urgent: "URGENT",
  very_urgent: "VERY URGENT",
};

export const STATUS_UI: Record<string, string> = {
  REPORTED: "REPORTED",
  ASSESSED: "ASSESSED",
  IN_PROGRESS: "IN PROGRESS",
  RESOLVED: "RESOLVED",
  DISPUTED: "DISPUTED",
};

export function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

export function daysOpen(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));
}

// ─── Backend → UI adapters (keep existing UI shapes; feed them live data) ───

export interface UiCardComplaint {
  backendId: string;
  id: string; // tracking_code (public-facing)
  issue: string;
  location: string;
  priority: "NORMAL" | "URGENT" | "VERY URGENT";
  status: string;
  days: number;
  score: number;
  supporters: number;
  submitted: string;
  resolved: boolean;
}

export function toCardComplaint(b: BackendComplaint): UiCardComplaint {
  return {
    backendId: b.id,
    id: b.tracking_code,
    issue: b.description || CATEGORY_LABELS[b.category] || b.category,
    location: `${b.lat.toFixed(3)}, ${b.lng.toFixed(3)}`,
    priority: PRIORITY_UI[b.priority] ?? "NORMAL",
    status: STATUS_UI[b.status] ?? b.status,
    days: daysOpen(b.created_at),
    score: Math.min(99, 50 + b.support_count * 8),
    supporters: b.support_count,
    submitted: new Date(b.created_at).toLocaleDateString(),
    resolved: b.status === "RESOLVED",
  };
}
