// =============================================================
// HELPERS — update-password Edge Function
//
// Pure helper functions extracted for testability.
// No Deno-specific imports — works in both Deno and Node (Vitest).
// =============================================================

export interface PasswordChangeValidation {
  valid: boolean;
  error?: string;
  status?: number;
}

/**
 * Validates the password change request body.
 * Checks for presence of both fields and minimum length on newPassword.
 */
export function validatePasswordChange(
  currentPassword: unknown,
  newPassword: unknown,
): PasswordChangeValidation {
  if (!currentPassword || !newPassword) {
    return {
      valid: false,
      error: "Current password and new password are required",
      status: 400,
    };
  }

  if (typeof newPassword !== "string" || newPassword.length < 8) {
    return {
      valid: false,
      error: "New password must be at least 8 characters",
      status: 400,
    };
  }

  return { valid: true };
}

/**
 * Validates the authorization header format.
 * Returns the extracted Bearer token or an error.
 */
export function validateAuthHeader(
  authHeader: string | null,
): { valid: true; token: string } | { valid: false; error: string; status: number } {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      valid: false,
      error: "Missing or invalid authorization header",
      status: 401,
    };
  }

  return { valid: true, token: authHeader.replace("Bearer ", "") };
}
