// ============================================================
// Checkster API client. Talks to the FastAPI backend only.
// The Gemini key lives on the server — never in this bundle.
// ============================================================

export function getApiBaseUrl(): string {
  const configured = (process.env.NEXT_PUBLIC_API_URL || "").trim().replace(/\/$/, "");
  if (configured) return configured;
  if (typeof window !== "undefined" && window.location?.hostname) {
    return `http://${window.location.hostname}:8000`;
  }
  return "http://localhost:8000";
}

export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");
const TOKEN_KEY = "checkster-auth-token";

export type Lang3 = "en" | "ur" | "roman_ur";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "homeowner" | "contractor" | "admin";
  preferred_language: Lang3;
  city: string;
  neighbourhood: string;
  created_at: string;
}

export interface Observation {
  observation: string;
  evidence: string;
  location_hint: string;
  confidence: number;
}
export interface PossibleCause {
  cause: string;
  probability: number;
  explanation: string;
  specialist: string;
}
export interface FollowupQuestion {
  id: string;
  question_en: string;
  question_ur: string;
  why: string;
}
export interface Inspection {
  inspection_id?: string;
  image_urls?: string[];
  model: string;
  generated_at: number;
  image_usable: boolean;
  issue_category: string;
  summary_en: string;
  summary_ur: string;
  observations: Observation[];
  possible_causes: PossibleCause[];
  severity: "low" | "moderate" | "high" | "critical";
  severity_reason: string;
  additional_questions: FollowupQuestion[];
  recommended_next_steps: string[];
  safety_warnings: string[];
  limitations: string[];
}
export interface RepairAction {
  step: string;
  trade: string;
  materials: string[];
  estimated_days: number;
  safety_level: "diy_ok" | "professional_recommended" | "professional_required";
}
export interface Diagnosis {
  problem_summary_en: string;
  problem_summary_ur: string;
  final_cause: string;
  final_cause_ur: string;
  cause_explanation: string;
  confidence: number;
  confidence_label: "likely" | "possible" | "uncertain";
  severity: string;
  specialists_consulted: { specialist: string; supports_cause: string; reasoning: string; agrees: boolean }[];
  conflicts_resolved: string;
  repair_plan: RepairAction[];
  primary_trade: "plumber" | "mason" | "waterproofing" | "painter" | "electrician" | "carpenter";
  safety_warnings: string[];
  limitations: string[];
  professional_inspection_required: boolean;
  estimate?: Estimate;
}
export interface EstimateRow {
  work: string;
  low: number;
  high: number;
  kind: "labour" | "material" | "equipment" | "transport" | "other";
  source_type: "official" | "market_observed" | "sample";
  reference_ids: string[];
}
export interface Estimate {
  rows: EstimateRow[];
  total_low: number;
  total_high: number;
  area_sqft: number;
  city?: string;
  notes: string[];
}
export interface QuoteItem {
  id?: string;
  description: string;
  quantity: number | null;
  unit: string;
  unit_price: number | null;
  total_price: number | null;
  category: "labour" | "material" | "equipment" | "transport" | "other";
  unclear?: boolean;
}
export interface ExtractedQuote {
  quotation_id?: string;
  uploaded_file_signed_url?: string;
  is_quotation: boolean;
  contractor_name: string;
  date: string;
  work_description: string;
  line_items: QuoteItem[];
  stated_total: number | null;
  raw_text: string;
  extraction_confidence: number;
  language_detected: string;
  needs_user_review: boolean;
  review_notes: string[];
  computed_line_total: number;
  extraction_method: string;
}
export interface ApiFinding {
  id: string;
  severity: "high" | "medium" | "info";
  classification: string;
  item: string;
  title: { en: string; ur: string };
  explain: { en: string; ur: string };
  ask: { en: string; ur: string };
  data: Record<string, unknown>;
}
export interface AuditResult {
  quotation_id?: string;
  findings: ApiFinding[];
  total_issues: number;
  computed_total: number;
  stated_total: number | null;
}
export interface AuditExplanation {
  summary_en: string;
  summary_ur: string;
  summary_roman_ur: string;
  finding_explanations: { id: string; en: string; ur: string; roman_ur: string }[];
  questions_for_contractor_en: string[];
  questions_for_contractor_ur: string[];
}

export interface ContractorListing {
  id: string;
  user_id?: string;
  google_place_id?: string;
  business_name: string;
  owner_name?: string;
  phone?: string;
  email?: string;
  service_categories: string[];
  experience_years?: number;
  daily_rate?: number;
  description?: string;
  city: string;
  neighbourhood?: string;
  working_areas?: string[];
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  distance_km?: number | null;
  rating?: number | null;
  review_count?: number;
  user_ratings_total?: number;
  is_available?: boolean;
  registration_status: "google_maps_listed" | "checkster_registered";
  verification_status: "pending" | "submitted" | "under_review" | "verified" | "rejected" | "unverified_external";
  listing_status: "google_maps_listed" | "checkster_registered" | "checkster_verified";
  is_external_listing: boolean;
  google_maps_url?: string | null;
  attribution?: string;
  created_at?: string;
}

export interface SavedInspectionRecord {
  id: string;
  user_id?: string;
  property_location: string;
  city: string;
  neighbourhood: string;
  room: string;
  area_sqft: number;
  issue_category: string;
  description: string;
  image_urls: string[];
  initial_analysis: Inspection;
  followup_answers: Record<string, string>;
  diagnosis_data: Diagnosis;
  estimate_data: Estimate;
  diagnosis: string;
  severity: string;
  confidence: number;
  status: string;
  created_at: string;
  updated_at: string;
  evidence?: { id: string; observation: string; confidence: number }[];
  recommendations?: { id: string; repair_action: string; trade: string; estimated_cost: number; safety_level: string }[];
  quotations?: {
    id: string;
    contractor_name: string;
    quoted_total: number | null;
    audited_total: number;
    audit_status: string;
    findings: ApiFinding[];
    ai_explanation: AuditExplanation;
    line_items: QuoteItem[];
    created_at: string;
  }[];
}

export interface RepairRequestRecord {
  id: string;
  user_id: string;
  inspection_id?: string | null;
  contractor_id?: string | null;
  trade: string;
  title: string;
  description: string;
  city: string;
  neighbourhood: string;
  offered_price: number;
  counter_price?: number | null;
  status: "open" | "accepted" | "countered" | "rejected" | "scheduled" | "completed" | "cancelled";
  scheduled_date: string;
  created_at: string;
}

export class ApiError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}, timeoutMs = 90_000): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const headers = new Headers(init.headers || {});
  const token = getStoredToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  try {
    const res = await fetch(`${baseUrl}${path}`, { ...init, headers, signal: ctrl.signal });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const detail = typeof body?.detail === "string" ? body.detail : `Request failed (${res.status})`;
      throw new ApiError(res.status, detail, body?.code);
    }
    return body as T;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    if ((e as Error).name === "AbortError") throw new ApiError(504, "The request timed out. Please try again.");
    throw new ApiError(0, `Cannot reach the Checkster server at ${baseUrl}. Make sure the FastAPI backend is running.`);
  } finally {
    clearTimeout(timer);
  }
}

const json = (body: unknown, method = "POST"): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export function resolveFileUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("http") || url.startsWith("blob:") || url.startsWith("data:")) return url;
  return `${getApiBaseUrl()}${url}`;
}

export const api = {
  health: () =>
    request<{ status: string; model: string; api_key_configured: boolean; maps_configured: boolean }>(
      "/api/health",
      { method: "GET" },
      8000,
    ),

  // Auth
  register: (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    city?: string;
    neighbourhood?: string;
    preferred_language?: Lang3;
    role?: "homeowner" | "contractor" | "admin";
  }) => request<{ user: UserProfile; access_token: string }>("/api/auth/register", json(data)),

  login: (email: string, password: string) =>
    request<{ user: UserProfile; access_token: string }>("/api/auth/login", json({ email, password })),

  me: () => request<{ user: UserProfile }>("/api/auth/me", { method: "GET" }, 10000),

  updateProfile: (patch: Partial<UserProfile>) =>
    request<{ user: UserProfile }>("/api/auth/profile", json(patch, "PATCH")),

  requestPasswordReset: (email: string) =>
    request<{ message: string; reset_token_preview?: string | null }>("/api/auth/password-reset/request", json({ email })),

  confirmPasswordReset: (token: string, new_password: string) =>
    request<{ status: string; message: string }>("/api/auth/password-reset/confirm", json({ token, new_password })),

  deleteAccount: () => request<{ status: string }>("/api/auth/account", { method: "DELETE" }),

  // Inspections
  inspect(
    files: File[],
    meta: {
      category: string;
      description: string;
      room: string;
      city: string;
      neighbourhood?: string;
      area_sqft?: number;
      language: Lang3;
      inspection_id?: string;
    },
  ) {
    const fd = new FormData();
    files.forEach((f) => fd.append("images", f));
    fd.append("category", meta.category);
    fd.append("description", meta.description);
    fd.append("room", meta.room);
    fd.append("city", meta.city);
    fd.append("neighbourhood", meta.neighbourhood || "");
    fd.append("area_sqft", String(meta.area_sqft || 40));
    fd.append("language", meta.language);
    if (meta.inspection_id) fd.append("inspection_id", meta.inspection_id);
    fd.append("consent", "true");
    return request<Inspection>("/api/inspect", { method: "POST", body: fd });
  },

  refine: (
    initial_inspection: Inspection,
    followup_answers: Record<string, string>,
    language: Lang3,
    inspection_id?: string,
    area_sqft = 40,
    city = "peshawar",
  ) =>
    request<Diagnosis>(
      "/api/inspect/refine",
      json({ initial_inspection, followup_answers, language, inspection_id, area_sqft, city }),
    ),

  askFollowup: (question: string, context: unknown, language: Lang3) =>
    request<{ answer_en: string; answer_ur: string; recommended_trade: string }>(
      "/api/inspect/ask",
      json({ question, context, language }),
    ),

  listInspections: () => request<{ inspections: SavedInspectionRecord[] }>("/api/inspections", { method: "GET" }),

  getInspection: (id: string) => request<SavedInspectionRecord>(`/api/inspections/${id}`, { method: "GET" }),

  deleteInspection: (id: string) => request<{ status: string }>(`/api/inspections/${id}`, { method: "DELETE" }),

  // Pricing & Estimates
  estimate: (repair_plan: RepairAction[], area_sqft: number, city: string) =>
    request<Estimate>("/api/estimate", json({ repair_plan, area_sqft, city })),

  priceReferences: (category?: string, location?: string) => {
    const q = new URLSearchParams();
    if (category) q.set("category", category);
    if (location) q.set("location", location);
    return request<{ references: Record<string, unknown>[] }>(`/api/pricing/references?${q.toString()}`, { method: "GET" });
  },

  // Quotations & Audit
  extractQuote(file: File, inspection_id?: string) {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("consent", "true");
    if (inspection_id) fd.append("inspection_id", inspection_id);
    return request<ExtractedQuote>("/api/quote/extract", { method: "POST", body: fd });
  },

  audit: (
    items: QuoteItem[],
    stated_total: number | null,
    diagnosis: Diagnosis | null,
    estimate_low: number | null,
    city: string,
    quotation_id?: string,
    inspection_id?: string,
    contractor_name?: string,
  ) =>
    request<AuditResult>(
      "/api/quote/audit",
      json({ items, stated_total, diagnosis, estimate_low, city, quotation_id, inspection_id, contractor_name: contractor_name || "" }),
    ),

  explain: (findings: ApiFinding[], quote_items: QuoteItem[], diagnosis: Diagnosis | null, quotation_id?: string) =>
    request<AuditExplanation>("/api/quote/explain", json({ findings, quote_items, diagnosis, quotation_id })),

  listQuotations: () => request<{ quotations: Record<string, unknown>[] }>("/api/quotations", { method: "GET" }),

  // Contractors & Discovery
  discoverContractors: (params: { category: string; city: string; neighbourhood?: string; lat?: number; lng?: number }) => {
    const q = new URLSearchParams({ category: params.category, city: params.city });
    if (params.neighbourhood) q.set("neighbourhood", params.neighbourhood);
    if (params.lat !== undefined) q.set("lat", String(params.lat));
    if (params.lng !== undefined) q.set("lng", String(params.lng));
    return request<{
      checkster_contractors: ContractorListing[];
      google_maps_listings: ContractorListing[];
      maps_configured: boolean;
      maps_setup_message?: string;
      maps_error?: string;
      attribution?: string;
    }>(`/api/contractors/discover?${q.toString()}`, { method: "GET" });
  },

  registerContractor: (data: {
    business_name: string;
    owner_name?: string;
    phone: string;
    email?: string;
    service_categories: string[];
    experience_years: number;
    daily_rate: number;
    description?: string;
    city: string;
    neighbourhood?: string;
    working_areas?: string[];
    address?: string;
    is_available?: boolean;
  }) => request<{ contractor: ContractorListing }>("/api/contractors", json(data)),

  getMyContractor: () =>
    request<{
      contractor: ContractorListing | null;
      reviews: { id: string; user_name: string; rating: number; review: string; created_at: string }[];
      requests: RepairRequestRecord[];
    }>("/api/contractors/me", { method: "GET" }),

  submitVerification: (notes: string, document?: File | null) => {
    const fd = new FormData();
    fd.append("notes", notes);
    if (document) fd.append("document", document);
    return request<{ contractor: ContractorListing }>("/api/contractors/me/verification", { method: "POST", body: fd });
  },

  addContractorReview: (contractor_id: string, rating: number, review: string) =>
    request<{ status: string; id: string }>(`/api/contractors/${contractor_id}/reviews`, json({ rating, review })),

  // Saved Contractors
  listSavedContractors: () =>
    request<{ saved: { id: string; contractor_id?: string; google_place_id?: string; snapshot: ContractorListing; created_at: string }[] }>(
      "/api/saved-contractors",
      { method: "GET" },
    ),

  saveContractor: (c: ContractorListing) =>
    request<{ id: string; status: string }>(
      "/api/saved-contractors",
      json({
        contractor_id: c.is_external_listing ? null : c.id,
        google_place_id: c.google_place_id || null,
        snapshot: c,
      }),
    ),

  deleteSavedContractor: (id: string) => request<{ status: string }>(`/api/saved-contractors/${id}`, { method: "DELETE" }),

  // Repair Requests
  createRepairRequest: (data: {
    inspection_id?: string;
    contractor_id?: string;
    trade: string;
    title: string;
    description?: string;
    city: string;
    neighbourhood?: string;
    offered_price: number;
    scheduled_date?: string;
  }) => request<{ request: RepairRequestRecord }>("/api/repair-requests", json(data)),

  listRepairRequests: () => request<{ requests: RepairRequestRecord[] }>("/api/repair-requests", { method: "GET" }),

  updateRepairRequest: (id: string, data: { status: string; counter_price?: number; scheduled_date?: string }) =>
    request<{ request: RepairRequestRecord }>(`/api/repair-requests/${id}`, json(data, "PATCH")),

  // Admin
  adminOverview: () =>
    request<{ counts: Record<string, number>; contractors: ContractorListing[] }>("/api/admin/overview", { method: "GET" }),

  adminVerifyContractor: (contractor_id: string, verification_status: string, verification_notes: string) =>
    request<{ contractor: ContractorListing }>(
      `/api/admin/contractors/${contractor_id}/verify`,
      json({ verification_status, verification_notes }, "PATCH"),
    ),
};

/** Turn a blob: URL (from URL.createObjectURL) back into a File for upload. */
export async function fileFromObjectUrl(url: string, name = "photo.jpg"): Promise<File> {
  const blob = await (await fetch(url)).blob();
  return new File([blob], name, { type: blob.type || "image/jpeg" });
}

/** Generate a real JPEG image File from an offscreen canvas showing a damp wall for sample mode. */
export async function createSampleDampWallFile(): Promise<File> {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext("2d")!;
  // Wall background
  ctx.fillStyle = "#ece3d2";
  ctx.fillRect(0, 0, 640, 480);
  // Skirting board
  ctx.fillStyle = "#c5b69c";
  ctx.fillRect(0, 445, 640, 35);
  // Damp moisture stain near lower wall
  const grad = ctx.createRadialGradient(240, 410, 20, 240, 380, 220);
  grad.addColorStop(0, "rgba(88, 72, 54, 0.88)");
  grad.addColorStop(0.55, "rgba(125, 107, 84, 0.55)");
  grad.addColorStop(1, "rgba(236, 227, 210, 0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(240, 390, 220, 0, Math.PI * 2);
  ctx.fill();
  // Peeling paint blisters & efflorescence (shora)
  ctx.strokeStyle = "#8d7b61";
  ctx.lineWidth = 3;
  for (const [x, y, rx, ry] of [
    [350, 220, 36, 20],
    [410, 255, 26, 15],
    [310, 285, 30, 18],
  ]) {
    ctx.fillStyle = "#f7f2e7";
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  // White salt efflorescence dots
  ctx.fillStyle = "#ffffff";
  for (let i = 0; i < 40; i++) {
    ctx.beginPath();
    ctx.arc(160 + (i * 37) % 240, 310 + (i * 29) % 120, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
  const blob: Blob = await new Promise((resolve) => canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.9));
  return new File([blob], "sample-damp-wall.jpg", { type: "image/jpeg" });
}
