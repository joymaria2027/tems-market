import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Phone, MessageSquareCode, Mail, ShieldCheck } from "lucide-react";

type Tab = "phone" | "email";
type LoginMode = "phone" | "verify";

const Login = () => {
  const { requestOTP, verifyOTP, signInWithEmail } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("phone");
  const [phone, setPhone] = useState("");
  const [mode, setMode] = useState<LoginMode>("phone");
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await requestOTP(phone);
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("OTP sent!");
      setMode("verify");
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error, profile } = await verifyOTP(phone, code);
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Welcome back!");
      if (profile?.role === "vendor") {
        navigate("/vendor/dashboard");
      } else if (profile?.role === "admin" || profile?.role === "superadmin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/");
      }
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Safety timeout: if fetchProfile in onAuthStateChange hangs
    // (Supabase auth-js awaits callbacks in _notifyAllSubscribers),
    // this prevents the UI from being stuck at "Signing in…" forever.
    const safetyTimer = setTimeout(() => {
      setLoading(false);
      toast.error(
        "Sign in timed out. The session may still have been created — try refreshing the page.",
      );
    }, 25000);

    try {
      const { error } = await signInWithEmail(email, password);
      clearTimeout(safetyTimer);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Signed in successfully!");
        navigate("/");
      }
    } catch (err) {
      clearTimeout(safetyTimer);
      const msg = err instanceof Error ? err.message : "An unexpected error occurred";
      console.error("Email sign-in error:", err);
      toast.error(msg);
    } finally {
      clearTimeout(safetyTimer);
      setLoading(false);
    }
  };

  const isPhoneMode = tab === "phone";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <span className="font-bold text-primary-foreground text-lg">T</span>
            </div>
            <span className="font-display text-2xl font-bold text-foreground">Tems Market</span>
          </Link>
          <h1 className="font-display text-3xl font-bold text-foreground">
            {isPhoneMode ? "Sign In" : "Admin Sign In"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isPhoneMode
              ? "Enter your Gambian phone number to receive a one-time code"
              : "Sign in with your admin email and password"}
          </p>
        </div>

        {/* Tab Switcher — equal prominence */}
        <div className="grid grid-cols-2 gap-1 bg-secondary/50 rounded-lg p-1">
          <button
            type="button"
            onClick={() => { setTab("phone"); setMode("phone"); setCode(""); }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all ${
              isPhoneMode
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Phone className="h-4 w-4" />
            Phone
          </button>
          <button
            type="button"
            onClick={() => { setTab("email"); setMode("phone"); setPassword(""); }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all ${
              !isPhoneMode
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Mail className="h-4 w-4" />
            Email
          </button>
        </div>

        {/* Phone OTP Form */}
        {isPhoneMode ? (
          <form
            onSubmit={mode === "verify" ? handleVerifyOTP : handleRequestOTP}
            className="space-y-4"
          >
            {mode === "verify" ? (
              <div className="space-y-2">
                <Label htmlFor="code">Verification Code</Label>
                <div className="relative">
                  <MessageSquareCode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />                    <Input
                      id="code"
                      type="text"
                      maxLength={6}
                      placeholder="123456"
                      className="pl-10 h-12 letter-spacing-wide text-center font-mono"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      required
                      pattern="[0-9]{6}"
                      autoComplete="one-time-code"
                    />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Didn't receive the code?{" "}
                  <button
                    type="button"
                    onClick={() => { setLoading(true); requestOTP(phone).then(({ error }) => { setLoading(false); if (error) toast.error(error.message); else { toast.success("OTP resent!"); setMode("verify"); } }); }}
                    className="font-medium text-primary hover:underline cursor-pointer"
                  >
                    Resend
                  </button>
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+220 xxx xxxx"
                    className="pl-10 h-12"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    pattern="[0-9+\s]{7,15}"
                    autoComplete="tel"
                  />
                </div>
              </div>
            )}

            <Button type="submit" className="w-full h-12 font-semibold" disabled={loading}>
              {loading
                ? code
                  ? "Verifying…"
                  : "Sending…"
                : code
                  ? "Verify Code"
                  : "Send Code"}
            </Button>

            {code && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => { setMode("phone"); setCode(""); }}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  ← Back to phone number
                </button>
              </div>
            )}
          </form>
        ) : (
          /* Email / Password Form */
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@temsmarket.gm"
                  className="pl-10 h-12"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                className="h-12"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full h-12 font-semibold" disabled={loading}>
              {loading ? "Signing in…" : "Sign In"}
            </Button>

            <div className="text-center">
              <Link
                to="/forgot-password"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Forgot password?
              </Link>
            </div>
          </form>
        )}

        {/* Sign up link */}
        <div className="text-center border-t border-border pt-4">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/select-role" className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
