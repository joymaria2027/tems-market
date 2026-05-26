// =============================================================
// VendorInvite form validation
//
// Shared between VendorInvite.tsx and its test file.
// =============================================================

export interface PasswordFormValidation {
  valid: boolean;
  error?: string;
}

/**
 * Validates the vendor invite password setup form.
 * Rules:
 * - Password must be at least 6 characters
 * - Password and confirm must match
 */
export function validatePasswordForm(
  password: string,
  confirmPassword: string,
): PasswordFormValidation {
  if (password.length < 6) {
    return { valid: false, error: "Password must be at least 6 characters" };
  }
  if (password !== confirmPassword) {
    return { valid: false, error: "Passwords do not match" };
  }
  return { valid: true };
}
