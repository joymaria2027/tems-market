import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Phone,
  MessageSquareCode,
  Calendar,
  ShieldCheck,
  User,
  Mail,
} from "lucide-react";

const Signup = () => {
  const { requestOTP, verifyOTP, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [role, setRole] = useState<"customer" | "affiliate">("customer");
  const [ageConfirm, setAgeConfirm] = useState(false);
  const [step, setStep] = useState<"info" | "verify">("info");
  const [loading, setLoading] = useState(false);

  const calculateAge = (dobString: string) => {
    if (!dobString) return 0;
    const today = new Date();
    const birthDate = new Date(dobString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleSubmitInfo = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast.error("Full name is required");
      return;
    }

    if (!phone.trim()) {
      toast.error("Phone number is required");
      return;
    }

    if (!email.trim()) {
      toast.error("Email address is required");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (!dob) {
      toast.error("Date of birth is required");
      return;
    }

    const age = calculateAge(dob);
    if (age < 18) {
      toast.error("You must be at least 18 years old to register");
      return;
    }

    if (!ageConfirm) {
      toast.error("Please confirm you are at least 18 years old");
      return;
    }

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

  const handleSubmitVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error, session } = await verifyOTP(phone, code);
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else if (session) {
      // Update profile with additional info
      const { error: profileError } = await updateProfile({
        full_name: fullName,
        email: email.trim(),
        date_of_birth: dob,
        age_verified: true, // Will be verified server-side too
        role,
      });

      if (profileError) {
        toast.error(profileError.message);
      } else {
        toast.success("Account created successfully!");
        if (role === "affiliate") {
          navigate("/affiliate/dashboard");
        } else {
          navigate("/");
        }
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md space-y-6 bg-card p-8 rounded-2xl border border-border shadow-sm">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <span className="font-bold text-primary-foreground text-lg">
                T
              </span>
            </div>
            <span className="font-display text-2xl font-bold text-foreground">
              Tems Market
            </span>
          </Link>
          <h1 className="font-display text-2xl font-bold text-foreground">
            {step === "info" ? "Create your account" : "Verify Your Number"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {step === "info"
              ? "Join the premier Gambian marketplace"
              : "Enter the 6-digit code sent to your phone"}
          </p>
        </div>

        <form
          onSubmit={step === "info" ? handleSubmitInfo : handleSubmitVerify}
          className="space-y-4"
        >
          {step === "info" ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="fullName">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    placeholder="Jane Doe"
                    className="pl-9 h-11"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">
                  Email Address <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="janedoe@example.com"
                    className="pl-9 h-11"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      placeholder="+220 3XXXXXX"
                      className="pl-9 h-11"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      pattern="\\+220[0-9]{7,8}"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="dob"
                      type="date"
                      className="pl-9 h-11"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      required
                      max={new Date().toISOString().split("T")[0]} // Prevent future dates
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Select Account Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole("customer")}
                    className={`py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                      role === "customer"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-primary/50 text-muted-foreground"
                    }`}
                  >
                    Customer
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("affiliate")}
                    className={`py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                      role === "affiliate"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-primary/50 text-muted-foreground"
                    }`}
                  >
                    Affiliate
                  </button>
                </div>
              </div>

              <div className="flex items-start space-x-2 pt-2">
                <Checkbox
                  id="age-confirm"
                  checked={ageConfirm}
                  onCheckedChange={(checked) => setAgeConfirm(!!checked)}
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="age-confirm"
                    className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-75 flex items-center gap-1 cursor-pointer"
                  >
                    <ShieldCheck className="h-3.5 w-3.5 text-primary inline" />I
                    confirm that I am at least 18 years old.
                  </label>
                  <p className="text-[10px] text-muted-foreground">
                    Tems Market requires age verification for all participants.
                  </p>
                </div>
              </div>
            </>
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
            className="w-full h-11 font-semibold mt-4"
            disabled={loading}
          >
            {loading
              ? step === "info"
                ? "Sending code…"
                : "Verifying…"
              : step === "info"
                ? "Send code"
                : "Verify code"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-primary hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
