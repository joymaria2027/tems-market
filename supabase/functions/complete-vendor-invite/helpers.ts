// =============================================================
// HELPERS — complete-vendor-invite Edge Function
//
// Pure helper functions extracted for testability.
// No Deno-specific imports — works in both Deno and Node (Vitest).
// =============================================================

// ─── Types ─────────────────────────────────────────────────

export interface VendorApplication {
  id: string;
  business_name: string;
  category: string;
  phone: string;
  status: string;
  extra_data: Record<string, any> | null;
  invite_token: string | null;
  invite_expires_at: string | null;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  status?: number;
}

export interface UserMetadata {
  role: "vendor";
  phone: string;
  full_name: string;
}

// ─── Token validation ──────────────────────────────────────

export function validateToken(token: unknown): ValidationResult {
  if (!token || typeof token !== "string") {
    return { valid: false, error: "Invite token is required", status: 400 };
  }
  return { valid: true };
}

// ─── Password validation ───────────────────────────────────

export function validatePassword(password: unknown): ValidationResult {
  if (!password || typeof password !== "string") {
    return { valid: false, error: "Password must be at least 6 characters", status: 400 };
  }
  if (password.length < 6) {
    return { valid: false, error: "Password must be at least 6 characters", status: 400 };
  }
  return { valid: true };
}

// ─── Application status validation ─────────────────────────

export function validateApplicationStatus(app: VendorApplication | null): ValidationResult {
  if (!app) {
    return { valid: false, error: "Invalid invite link", status: 404 };
  }

  if (app.status === "completed") {
    return {
      valid: false,
      error: "This invite has already been used. Please sign in instead.",
      status: 409,
    };
  }

  if (app.status !== "approved") {
    return { valid: false, error: "Invalid invite link", status: 404 };
  }

  if (app.invite_expires_at && new Date(app.invite_expires_at) < new Date()) {
    return {
      valid: false,
      error: "This invite has expired. Contact your admin for a new one.",
      status: 410,
    };
  }

  return { valid: true };
}

// ─── Build user metadata ───────────────────────────────────

export function buildUserMetadata(
  app: VendorApplication,
  providedEmail?: string | null,
): {
  phone: string;
  email: string | null;
  fullName: string;
  metadata: UserMetadata;
} {
  const phone = app.phone.startsWith("+") ? app.phone : `+${app.phone}`;
  const extraData = app.extra_data || {};
  const fullName = extraData.fullName || app.business_name;
  // Prefer email passed from the invite form; fall back to extra_data
  const email = (providedEmail && providedEmail.trim()) ? providedEmail.trim() : (extraData.email || null);

  return {
    phone,
    email,
    fullName,
    metadata: {
      role: "vendor",
      phone: app.phone,
      full_name: fullName,
    },
  };
}
