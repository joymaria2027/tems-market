import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Mail, Lock, ShieldCheck, Loader2, AlertCircle } from "lucide-react";

const AdminLogin = () => {
  const { signInWithEmail, user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If already logged in as admin/superadmin, redirect to dashboard
  useEffect(() => {
    if (!authLoading && user && profile &&
        (profile.role === "admin" || profile.role === "superadmin")) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [authLoading, user, profile, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    const { error } = await signInWithEmail(email, password);
    setLoading(false);

    if (error) {
      setErrorMessage(error.message);
      toast.error(error.message);
    } else {
      toast.success("Signed in successfully!");
      // After successful sign-in, AuthContext will update and onAuthStateChange
      // will trigger, which causes the useEffect above to redirect to /admin
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // If already logged in with correct role, this page won't mount (redirect above)
  // But if the user is logged in with a non-admin role, show a friendly message
  if (profile && profile.role !== "admin" && profile.role !== "superadmin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <CardTitle>Access Restricted</CardTitle>
            <CardDescription className="mt-2">
              This area is for administrators only. Your account role is{" "}
              <strong>{profile.role}</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full" onClick={() => navigate("/")}>
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
            <ShieldCheck className="h-3.5 w-3.5" />
            Admin Portal
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground">Admin Sign In</h1>
          <p className="text-muted-foreground mt-2">
            Sign in with your admin email and password
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm">
                  <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                  <span className="text-destructive-foreground">{errorMessage}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="admin-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="admin@temsmarket.gm"
                    className="pl-10 h-12"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setErrorMessage(null); }}
                    required
                    autoFocus
                    autoComplete="email"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="admin-password">Password</Label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="admin-password"
                    type="password"
                    placeholder="Enter your password"
                    className="pl-10 h-12"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setErrorMessage(null); }}
                    required
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-12 font-semibold" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in…
                  </span>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Not an admin?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Customer sign in
            </Link>
          </p>
          <p className="text-xs text-muted-foreground">
            <Link to="/" className="hover:text-primary transition-colors">
              Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
