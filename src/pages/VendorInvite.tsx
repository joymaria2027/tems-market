import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Lock, Store, ArrowRight } from "lucide-react";

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
          .select("id, business_name, status, invite_expires_at")
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

    if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match");
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
      toast({ title: "Account created!", description: "You can now log in and start selling." });

      // Auto-redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);
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

  // --- Completed ---
  if (completed) {
    return (
      <Layout>
        <div className="container py-24 max-w-md mx-auto text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">Account Created!</h1>
          <p className="text-muted-foreground">
            Your vendor account is ready. You'll be redirected to the login page to sign in.
          </p>
          <Button asChild>
            <Link to="/login">
              Sign In Now <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
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
