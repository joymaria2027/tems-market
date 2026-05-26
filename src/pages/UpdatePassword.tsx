import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Lock, KeyRound, ArrowLeft, Loader2 } from "lucide-react";

const UpdatePassword = () => {
  const { user, loading: authLoading, updateUserPassword, signOut } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [updated, setUpdated] = useState(false);
  const [recoveryDetected, setRecoveryDetected] = useState(false);

  // Snapshot the URL hash before Supabase processes it (race guard)
  useEffect(() => {
    if (window.location.hash?.includes("type=recovery")) {
      setRecoveryDetected(true);
    }
  }, []);

  const isRecovery = recoveryDetected || !!user;

  useEffect(() => {
    if (!authLoading && !isRecovery) {
      navigate("/forgot-password", { replace: true });
    }
  }, [authLoading, isRecovery, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    const { error } = await updateUserPassword(password);
    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      setUpdated(true);
      toast.success("Password updated successfully!");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <span className="font-bold text-primary-foreground text-lg">T</span>
            </div>
            <span className="font-display text-2xl font-bold text-foreground">Tems Market</span>
          </Link>
        </div>

        {updated ? (
          /* Success state */
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                <KeyRound className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle>Password updated</CardTitle>
              <CardDescription className="mt-2">
                Your password has been changed successfully.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" onClick={async () => { await signOut(); navigate("/login"); }}>
                Sign in with new password
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* New password form */
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Set new password</CardTitle>
              <CardDescription className="mt-2">
                Enter your new password below. Must be at least 8 characters.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Min. 8 characters"
                    className="h-12"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Repeat your new password"
                    className="h-12"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>
                <Button type="submit" className="w-full h-12 font-semibold" disabled={loading}>
                  {loading ? "Updating…" : "Update password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center mt-6">
          <Link
            to="/login"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UpdatePassword;
