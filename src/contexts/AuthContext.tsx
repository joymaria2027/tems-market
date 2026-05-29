import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  id: string;
  phone: string;
  full_name: string;
  email: string | null;
  date_of_birth: string | null;
  age_verified: boolean;
  role: "superadmin" | "admin" | "vendor" | "affiliate" | "customer";
  status: "active" | "pending" | "rejected" | "suspended";
  commission_payout_preference: "mobile_money" | "credits";
  invited_by: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  // Phone OTP methods
  requestOTP: (phone: string) => Promise<{ error: Error | null }>;
  verifyOTP: (
    phone: string,
    code: string,
  ) => Promise<{ error: Error | null; session?: Session; profile?: Profile | null }>;
  // Email/password sign in (for superadmin)
  signInWithEmail: (
    email: string,
    password: string,
  ) => Promise<{ error: Error | null }>;
  // Profile update
  updateProfile: (
    updates: Partial<Profile>,
  ) => Promise<{ error: Error | null }>;
  // Role update (only for customer and affiliate)
  updateRole: (role: "customer" | "affiliate") => Promise<void>;
  // Sign out
  signOut: () => Promise<void>;
  // Update password (authenticated user — requires current password, calls Edge Function)
  updatePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<{ error: Error | null }>;
  // Password reset via email link (sends reset email)
  resetPasswordEmail: (
    email: string,
  ) => Promise<{ error: Error | null }>;
  // Set new password after recovery link (uses auth scope set by recovery link)
  updateUserPassword: (
    newPassword: string,
  ) => Promise<{ error: Error | null }>;
  // Refresh profile
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching user profile:", error);
      setProfile(null);
      return null;
    }

    setProfile(data as Profile | null);
    return data as Profile | null;
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error("No user") };
    const { error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", user.id);

    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const updateRole = async (role: "customer" | "affiliate") => {
    if (!user) return;
    const { error } = await supabase.rpc("update_own_role", { new_role: role });
    if (error) {
      console.error("Error updating role:", error);
      throw error;
    }
    await fetchProfile(user.id);
  };

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const requestOTP = async (phone: string) => {
    // Call the request-otp Edge Function
    const { error } = await supabase.functions.invoke("request-otp", {
      body: { phone },
    });
    return { error: error as Error | null };
  };

  const verifyOTP = async (phone: string, code: string) => {
    // Call the verify-otp Edge Function
    const { data, error } = await supabase.functions.invoke("verify-otp", {
      body: { phone, code },
    });
    if (error) {
      return { error: error as Error | null };
    }

    if (!data?.session) {
      return { error: new Error("No session returned from OTP verification") };
    }

    // Set the session on the client so onAuthStateChange fires and fetches profile
    const { error: setSessionError } = await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });

    if (setSessionError) {
      return { error: setSessionError as Error };
    }

    // Eagerly fetch profile so Login can immediately access it for role-based redirect
    const profile = await fetchProfile(data.session.user.id);

    return { error: null, session: data.session as Session, profile: profile as Profile | null };
  };

  // ─── Email/password sign in (admin/superadmin) ─────────────────────────────────
  //
  // On failure, we call check-email-exists Edge Function to distinguish
  // "no account" from "wrong password" and give the user a more helpful error.

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error) {
      return { error: null };
    }

    const msg = error.message?.toLowerCase() || "";

    // If it's a rate-limit or network error, surface it directly
    if (msg.includes("rate_limit") || msg.includes("too many")) {
      return {
        error: new Error(
          "Too many sign-in attempts. Please wait a moment and try again.",
        ),
      };
    }

    if (msg.includes("email not confirmed")) {
      return {
        error: new Error(
          "Your email has not been confirmed yet. Check your inbox for the confirmation link.",
        ),
      };
    }

    if (msg.includes("timeout") || msg.includes("network")) {
      return { error: new Error("Connection issue. Please check your internet and try again.") };
    }

    // For "Invalid login credentials", check whether the account actually exists
    if (msg.includes("invalid login credentials") || msg.includes("invalid_credentials")) {
      try {
        const { data: existsData } = await supabase.functions.invoke(
          "check-email-exists",
          { body: { email } },
        );

        if (existsData?.exists === false) {
          return {
            error: new Error(
              "No account found with this email. Please check the email address or contact your admin.",
            ),
          };
        }

        if (existsData?.exists === true) {
          return {
            error: new Error(
              "Incorrect password. Try again or use the 'Forgot password' link below.",
            ),
          };
        }
      } catch {
        // If the check-edge-function is unavailable, show generic error
      }

      // Fallback: generic error when we can't determine the cause
      return {
        error: new Error(
          "Invalid email or password. Please check your credentials and try again.",
        ),
      };
    }

    // Any other error — surface as-is but wrap in a friendly prefix
    return { error: new Error(error.message) };
  };

  // ─── Update password via Edge Function ───────────────────────────────────────────

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("update-password", {
        body: { currentPassword, newPassword },
      });

      if (error) return { error: error as Error };
      if (data?.error) return { error: new Error(data.error) };

      return { error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update password";
      return { error: new Error(message) };
    }
  };

  // ─── Password reset via email link ──────────────────────────────────────────────

  const resetPasswordEmail = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    return { error: error as Error | null };
  };

  // ─── Set new password after recovery link click ─────────────────────────────────

  const updateUserPassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error: error as Error | null };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        requestOTP,
        verifyOTP,
        signInWithEmail,
        updatePassword,
        resetPasswordEmail,
        updateUserPassword,
        updateProfile,
        updateRole,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
