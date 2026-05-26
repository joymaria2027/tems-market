import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Phone, MessageSquareCode, CheckCircle2 } from "lucide-react";

const Login = () => {
  const { requestOTP, verifyOTP } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "verify">("phone");
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
      setStep("verify");
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
      // Redirect handled by AuthProvider + route guards
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
            {step === "phone" ? "Login with Phone" : "Verify Your Number"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {step === "phone"
              ? "Enter your Gambian phone number to receive a one-time code"
              : "Enter the 6-digit code sent to your phone"}
          </p>
        </div>

        <form
          onSubmit={step === "phone" ? handleRequestOTP : handleVerifyOTP}
          className="space-y-4"
        >
          {step === "phone" ? (
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
                  pattern="\\+220[0-9]{7,8}"
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
              ? step === "phone"
                ? "Sending…"
                : "Verifying…"
              : step === "phone"
                ? "Send Code"
                : "Verify Code"}
          </Button>
        </form>

        {step === "verify" && (
          <div className="flex items-center justify-between text-sm">
            <Link to="/" className="text-muted-foreground hover:text-primary">
              ← Back to phone number
            </Link>
            <p className="text-muted-foreground">Code expires in 5 minutes</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
