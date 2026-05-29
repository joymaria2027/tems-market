import { useState, useEffect } from "react";
import { validatePasswordForm } from "@/lib/validatePasswordForm";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Lock, Store, ArrowRight, Sparkles, Upload, Camera, MapPin } from "lucide-react";
import Confetti from "@/components/Confetti";

type InviteState =
  | { status: "loading" }
  | { status: "valid"; businessName: string; applicationId: string; phone: string }
  | { status: "expired" }
  | { status: "used" }
  | { status: "invalid" }
  | { status: "error"; message: string };

const VendorInvite = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [state, setState] = useState<InviteState>({ status: "loading" });
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [ceremonyEntered, setCeremonyEntered] = useState(false);

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setState({ status: "invalid" });
      return;
    }

    const validateToken = async () => {
      try {
        const { data, error } = await supabase
          .from("vendor_applications")
          .select("id, business_name, phone, status, invite_expires_at")
          .eq("invite_token", token)
          .maybeSingle();

        if (error) throw error;

        if (!data) {
          setState({ status: "invalid" });
          return;
        }

        if (data.status === "completed") {
          setState({ status: "used" });
          return;
        }

        if (data.status === "expired" || (data.invite_expires_at && new Date(data.invite_expires_at) < new Date())) {
          setState({ status: "expired" });
          return;
        }

        if (data.status !== "approved") {
          setState({ status: "invalid" });
          return;
        }

        setState({
          status: "valid",
          businessName: data.business_name,
          applicationId: data.id,
          phone: data.phone,
        });
      } catch (err: any) {
        setState({ status: "error", message: err?.message || "Failed to validate invite" });
      }
    };

    validateToken();
  }, [token]);

  const handleSetup = async () => {
    setPasswordError("");

    const validation = validatePasswordForm(password, confirmPassword);
    if (!validation.valid) {
      setPasswordError(validation.error!);
      return;
    }

    setSubmitting(true);
    try {
      // Call Edge Function to complete the invite
      const { data, error } = await supabase.functions.invoke("complete-vendor-invite", {
        body: {
          token,
          password,
        },
      });

      if (error) throw error;

      setCompleted(true);
      // Trigger ceremony entrance
      setTimeout(() => setCeremonyEntered(true), 100);
      toast({ title: "Account created!", description: "You can now log in and start selling." });

      // Auto-redirect to login after 8 seconds (give ceremony time)
      setTimeout(() => {
        navigate("/login");
      }, 8000);
    } catch (err: any) {
      toast({
        title: "Setup failed",
        description: err?.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // --- Loading ---
  if (state.status === "loading") {
    return (
      <Layout>
        <div className="container py-24 max-w-md mx-auto text-center">
          <div className="animate-pulse space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted" />
            <div className="h-6 w-48 mx-auto bg-muted rounded" />
            <div className="h-4 w-64 mx-auto bg-muted rounded" />
          </div>
        </div>
      </Layout>
    );
  }

  // --- Invite used ---
  if (state.status === "used") {
    return (
      <Layout>
        <div className="container py-24 max-w-md mx-auto text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">Account Already Set Up</h1>
          <p className="text-muted-foreground">
            This invite has already been used. Please sign in to your account.
          </p>
          <Button asChild>
            <Link to="/login">
              Sign In <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </Layout>
    );
  }

  // --- Invite expired ---
  if (state.status === "expired") {
    return (
      <Layout>
        <div className="container py-24 max-w-md mx-auto text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <XCircle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">Invite Expired</h1>
          <p className="text-muted-foreground">
            This invite link has expired. Contact your Tems Market admin for a new one.
          </p>
          <Button asChild variant="outline">
            <Link to="/">Go to Home</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  // --- Invalid token ---
  if (state.status === "invalid") {
    return (
      <Layout>
        <div className="container py-24 max-w-md mx-auto text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <XCircle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">Invalid Invite Link</h1>
          <p className="text-muted-foreground">
            This link is not valid. Please check the link or contact your Tems Market admin.
          </p>
          <Button asChild variant="outline">
            <Link to="/">Go to Home</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  // --- Error ---
  if (state.status === "error") {
    return (
      <Layout>
        <div className="container py-24 max-w-md mx-auto text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <XCircle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">Something Went Wrong</h1>
          <p className="text-muted-foreground">{state.message}</p>
          <Button asChild variant="outline">
            <Link to="/">Go to Home</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  // --- Completed (GIFT, not receipt) ---
  if (completed) {
    const businessName = state.status === "valid" ? state.businessName : "Your Store";
    const CHECKLIST = [
      { icon: Upload, label: "Upload your first product", desc: "Add photos, price, and description" },
      { icon: Camera, label: "Add a profile photo", desc: "Help buyers recognize your brand" },
      { icon: MapPin, label: "Set delivery areas", desc: "Choose where you can deliver" },
    ];

    return (
      <Layout>
        {/* Stage 2: Confetti */}
        <Confetti active={ceremonyEntered} count={100} duration={3500} />

        <div className="container py-16 md:py-24 max-w-md mx-auto text-center space-y-6">
          {/* Stage 2: Bouncing store icon */}
          <div
            className={`mx-auto w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center transition-all duration-700 ${ceremonyEntered ? "opacity-100" : "opacity-0 scale-50"}`}
            style={{ animation: ceremonyEntered ? "welcomeBounce 0.7s ease-out 0.3s both" : "none" }}
          >
            <Store className="h-10 w-10 text-primary" />
          </div>

          {/* Stage 2: Welcome title */}
          <div className={`space-y-3 transition-all duration-700 delay-200 ${ceremonyEntered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
              Welcome to Tems Market! 🎉
            </h1>
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-lg px-4 py-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="font-semibold text-primary text-sm">{businessName}</span>
              <span className="text-muted-foreground text-sm">is now live!</span>
            </div>
          </div>

          {/* Stage 3: Quick-start checklist (afterglow) */}
          <div className={`bg-card rounded-xl border border-border p-5 text-left space-y-4 transition-all duration-700 delay-500 ${ceremonyEntered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <p className="font-semibold text-foreground text-sm">Get started in 3 steps:</p>
            {CHECKLIST.map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-3"
                style={{ animation: ceremonyEntered ? `fadeSlideIn 0.4s ease-out ${0.8 + i * 0.15}s both` : "none" }}
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <item.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className={`transition-all duration-500 delay-1000 ${ceremonyEntered ? "opacity-100" : "opacity-0"}`}>
            <Button asChild size="lg" className="gap-2 w-full">
              <Link to="/login">
                Sign In & Start Selling <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <p className="text-xs text-muted-foreground mt-2">Auto-redirecting to login...</p>
          </div>
        </div>

        <style>{`
          @keyframes welcomeBounce {
            0% { transform: scale(0.3); opacity: 0; }
            50% { transform: scale(1.15); opacity: 1; }
            70% { transform: scale(0.95); }
            100% { transform: scale(1); }
          }
          @keyframes fadeSlideIn {
            from { opacity: 0; transform: translateX(-10px); }
            to { opacity: 1; transform: translateX(0); }
          }
        `}</style>
      </Layout>
    );
  }

  // --- Valid invite: show setup form ---
  return (
    <Layout>
      <div className="container py-16 md:py-24 max-w-md mx-auto">
        <Card className="border-border shadow-sm">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <Store className="h-6 w-6 text-primary" />
            </div>
            <Badge variant="secondary" className="mx-auto text-xs mb-2">
              Vendor Invite
            </Badge>
            <CardTitle>Set Up Your Vendor Account</CardTitle>
            <CardDescription>
              You've been invited to join Tems Market as a vendor for{" "}
              <strong>{state.businessName}</strong>. Create your password to get started.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="bg-secondary/20 rounded-lg border border-border p-3 text-sm space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Business</span>
                <span className="font-medium">{state.businessName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Phone</span>
                <span className="font-medium">{state.phone}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">
                Password <span className="text-destructive">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setPasswordError(""); }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                Confirm Password <span className="text-destructive">*</span>
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(""); }}
              />
            </div>

            {passwordError && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <XCircle className="h-4 w-4" />
                {passwordError}
              </p>
            )}

            <div className="bg-secondary/20 rounded-lg border border-border p-3 text-xs text-muted-foreground space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" />
                <span>Your password is encrypted and stored securely</span>
              </div>
              <p>After setup, you'll be able to log in with your phone number and password.</p>
            </div>
          </CardContent>

          <CardFooter>
            <Button className="w-full" onClick={handleSetup} disabled={submitting}>
              {submitting ? "Setting up..." : "Create Account & Start Selling"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
};

export default VendorInvite;
