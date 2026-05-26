import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Phone, MessageSquareCode, Mail, ShieldCheck } from "lucide-react";

type LoginMode = "phone" | "verify" | "email";

const Login = () => {
  const { requestOTP, verifyOTP, signInWithEmail } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<LoginMode>("phone");
  const [phone, setPhone] = useState("");
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
    const { error, session } = await verifyOTP(phone, code);
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Welcome back!");
      navigate("/");
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signInWithEmail(email, password);
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Signed in successfully!");
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <span className="font-bold text-primary-foreground text-lg">
                T
              </span>
            </div>
            <span className="font-display text-2xl font-bold text-foreground">
              Tems Market
            </span>
          </Link>
          <h1 className="font-display text-3xl font-bold text-foreground">
            {mode === "email"
              ? "Admin Sign In"
              : mode === "phone"
                ? "Login with Phone"
                : "Verify Your Number"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {mode === "email"
              ? "Sign in with your admin email and password"
              : mode === "phone"
                ? "Enter your Gambian phone number to receive a one-time code"
                : "Enter the 6-digit code sent to your phone"}
          </p>
        </div>

        {mode === "email" ? (
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
              />
            </div>
            <Button
              type="submit"
              className="w-full h-12 font-semibold"
              disabled={loading}
            >
              {loading ? "Signing in…" : "Sign In"}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => { setMode("phone"); setEmail(""); setPassword(""); }}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                ← Back to phone login
              </button>
            </div>
          </form>
        ) : (
          <form
            onSubmit={mode === "phone" ? handleRequestOTP : handleVerifyOTP}
            className="space-y-4"
          >
            {mode === "phone" ? (
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
                    pattern="[0-9+\\s]{7,15}"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="code">Verification Code</Label>
                <div className="relative">
                  <MessageSquareCode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="code"
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    className="pl-10 h-12 letter-spacing-wide text-center font-mono"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    pattern="[0-9]{6}"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Didn't receive the code?{" "}
                  <span className="font-medium text-primary cursor-pointer">
                    Resend
                  </span>
                </p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 font-semibold"
              disabled={loading}
            >
              {loading
                ? mode === "phone"
                  ? "Sending…"
                  : "Verifying…"
                : mode === "phone"
                  ? "Send Code"
                  : "Verify Code"}
            </Button>
          </form>
        )}

        {/* Toggle between phone OTP and email/password */}
        {mode !== "verify" && (
          <div className="text-center border-t border-border pt-4">
            {mode === "phone" ? (
              <button
                type="button"
                onClick={() => { setMode("email"); setPhone(""); }}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Admin sign in with email
              </button>
            ) : null}
          </div>
        )}

        {mode === "verify" && (
          <div className="flex items-center justify-between text-sm">
            <button
              onClick={() => setMode("phone")}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              ← Back to phone number
            </button>
            <p className="text-muted-foreground">Code expires in 5 minutes</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
