import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Copy, Check, Link2, DollarSign, MousePointerClick, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Affiliate {
  id: string;
  code: string;
  commission_rate: number;
  total_earned: number;
  total_clicks: number;
}

interface Referral {
  id: string;
  order_id: string;
  commission_amount: number;
  status: string;
  created_at: string;
}

const Affiliate = () => {
  const { user, loading: authLoading } = useAuth();
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchAffiliate = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("affiliates")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    setAffiliate(data);

    if (data) {
      const { data: refs } = await supabase
        .from("affiliate_referrals")
        .select("*")
        .eq("affiliate_id", data.id)
        .order("created_at", { ascending: false });
      setReferrals(refs || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!authLoading) fetchAffiliate();
  }, [user, authLoading]);

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const array = new Uint32Array(6);
    crypto.getRandomValues(array);
    return Array.from(array).map((n) => chars[n % chars.length]).join("");
  };

  const handleCreate = async () => {
    if (!user) return;
    setCreating(true);
    const code = generateCode();
    const { error } = await supabase.from("affiliates").insert({ user_id: user.id, code });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Affiliate account created!");
      await fetchAffiliate();
    }
    setCreating(false);
  };

  const referralLink = affiliate ? `${window.location.origin}/shop?ref=${affiliate.code}` : "";

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="container py-16 text-center space-y-4">
          <h1 className="font-display text-2xl font-bold text-foreground">Join Our Affiliate Program</h1>
          <p className="text-muted-foreground">Log in to become an affiliate and earn commissions.</p>
          <Button asChild><Link to="/login">Log In</Link></Button>
        </div>
      </Layout>
    );
  }

  if (!affiliate) {
    return (
      <Layout>
        <div className="container py-16 text-center space-y-4 max-w-lg mx-auto">
          <Link2 className="h-12 w-12 mx-auto text-primary" />
          <h1 className="font-display text-2xl font-bold text-foreground">Affiliate Program</h1>
          <p className="text-muted-foreground">
            Earn a commission on every order made through your referral link. Share your link and start earning!
          </p>
          <Button onClick={handleCreate} disabled={creating}>
            {creating ? "Creating…" : "Become an Affiliate"}
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-10 max-w-3xl">
        <h1 className="font-display text-3xl font-bold text-foreground mb-8">Affiliate Dashboard</h1>

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-card rounded-xl border border-border p-5 text-center">
            <MousePointerClick className="h-6 w-6 mx-auto text-primary mb-2" />
            <p className="text-2xl font-bold text-foreground">{affiliate.total_clicks}</p>
            <p className="text-sm text-muted-foreground">Total Clicks</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-5 text-center">
            <DollarSign className="h-6 w-6 mx-auto text-primary mb-2" />
            <p className="text-2xl font-bold text-foreground">D{Number(affiliate.total_earned).toFixed(2)}</p>
            <p className="text-sm text-muted-foreground">Total Earned</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-5 text-center">
            <p className="text-2xl font-bold text-foreground">{affiliate.commission_rate}%</p>
            <p className="text-sm text-muted-foreground">Commission Rate</p>
          </div>
        </div>

        {/* Referral Link */}
        <div className="bg-card rounded-xl border border-border p-6 mb-8 space-y-3">
          <h2 className="font-semibold text-foreground">Your Referral Link</h2>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={referralLink}
              className="flex-1 bg-muted rounded-lg px-3 py-2 text-sm text-foreground font-mono truncate border border-border"
            />
            <Button variant="outline" size="icon" onClick={copyLink}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Share this link. When someone makes a purchase, you earn {affiliate.commission_rate}% commission.</p>
        </div>

        {/* Referral History */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="font-semibold text-foreground mb-4">Referral History</h2>
          {referrals.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No referrals yet. Share your link to start earning!</p>
          ) : (
            <div className="space-y-3">
              {referrals.map((r) => (
                <div key={r.id} className="flex items-center justify-between text-sm border-b border-border pb-2 last:border-0">
                  <div>
                    <p className="font-mono text-xs text-muted-foreground">{r.order_id.slice(0, 8)}…</p>
                    <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">D{Number(r.commission_amount).toFixed(2)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      r.status === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {r.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Affiliate;
