import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Copy, Check, Link2, DollarSign, MousePointerClick, Loader2, TrendingUp, Users, Gift, Sparkles, PartyPopper } from "lucide-react";
import { toast } from "sonner";
import { formatGMD } from "@/lib/utils/currency";
import CeremonyOverlay from "@/components/CeremonyOverlay";
import ShareCard from "@/components/ShareCard";

interface AffiliateData {
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
  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Gift states
  const [showCreationCeremony, setShowCreationCeremony] = useState(false);
  const [showFirstCommission, setShowFirstCommission] = useState(false);
  const [firstCommissionAmount, setFirstCommissionAmount] = useState(0);
  const [hadReferralsBefore, setHadReferralsBefore] = useState<boolean | null>(null);

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

      const newRefs = refs || [];

      // Priority 5: Detect first commission milestone
      if (hadReferralsBefore === false && newRefs.length > 0) {
        setFirstCommissionAmount(newRefs[0].commission_amount);
        setShowFirstCommission(true);
      }
      if (hadReferralsBefore === null) {
        setHadReferralsBefore(newRefs.length > 0);
      }

      setReferrals(newRefs);
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
      // Priority 3: Show ceremony instead of toast
      await fetchAffiliate();
      setShowCreationCeremony(true);
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
        <div className="container py-16 text-center space-y-6 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto">
            <Link2 className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="font-display text-2xl font-bold text-foreground">Affiliate Program</h1>
            <p className="text-muted-foreground text-sm">
              Earn a commission on every order made through your referral link. Share your link and start earning!
            </p>
          </div>

          {/* Benefits cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
            <div className="bg-card rounded-xl border border-border p-4 space-y-2">
              <Gift className="h-5 w-5 text-primary" />
              <p className="text-sm font-semibold text-foreground">Earn Commissions</p>
              <p className="text-xs text-muted-foreground">Get paid for every sale from your link</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4 space-y-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <p className="text-sm font-semibold text-foreground">Track Performance</p>
              <p className="text-xs text-muted-foreground">Monitor clicks and earnings in real time</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4 space-y-2">
              <Users className="h-5 w-5 text-primary" />
              <p className="text-sm font-semibold text-foreground">No Inventory</p>
              <p className="text-xs text-muted-foreground">Promote products without holding stock</p>
            </div>
          </div>

          <Button onClick={handleCreate} disabled={creating} size="lg" className="gap-2">
            {creating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Setting up your account...
              </>
            ) : (
              "Become an Affiliate"
            )}
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Priority 3: Creation ceremony overlay */}
      <CeremonyOverlay
        active={showCreationCeremony}
        icon={<PartyPopper className="h-10 w-10 text-primary" />}
        title="You're an Affiliate! 🎉"
        subtitle={`Your unique code is ${affiliate.code}. Share your link and start earning ${affiliate.commission_rate}% on every sale!`}
        iconBg="bg-primary/10"
        onDismiss={() => setShowCreationCeremony(false)}
      >
        <div className="mt-4 space-y-4">
          <ShareCard
            message={`Check out Tems Market! Shop with my link and I'll earn a commission 💰 → ${referralLink}`}
            label="Share your link now"
            whatsapp
          />
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => setShowCreationCeremony(false)}
          >
            I'll share later
          </Button>
        </div>
      </CeremonyOverlay>

      {/* Priority 5: First commission ceremony */}
      <CeremonyOverlay
        active={showFirstCommission}
        icon={<DollarSign className="h-10 w-10 text-green-500" />}
        title="First Commission! 💰"
        subtitle={`You just earned ${formatGMD(firstCommissionAmount)} from your first referral!`}
        iconBg="bg-green-100 dark:bg-green-900/30"
        onDismiss={() => setShowFirstCommission(false)}
      >
        <div className="mt-4 space-y-4">
          <div className="inline-flex items-center gap-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full px-3 py-1 text-xs font-semibold">
            <Sparkles className="h-3 w-3" />
            First Sale Milestone ✨
          </div>
          <ShareCard
            message={`I just earned my first commission on Tems Market! 💸 Join the affiliate program → ${window.location.origin}/affiliate`}
            label="Share your success"
            whatsapp
          />
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => setShowFirstCommission(false)}
          >
            Continue to dashboard
          </Button>
        </div>
      </CeremonyOverlay>

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
            <p className="text-2xl font-bold text-foreground">{formatGMD(affiliate.total_earned)}</p>
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
            <div className="text-center py-8 space-y-3">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
                <TrendingUp className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No referrals yet.</p>
              <p className="text-xs text-muted-foreground">Share your link to earn your first commission!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {referrals.map((r, i) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between text-sm border-b border-border pb-2 last:border-0"
                  style={{ animation: `fadeSlideIn 0.3s ease-out ${i * 0.05}s both` }}
                >
                  <div>
                    <p className="font-mono text-xs text-muted-foreground">{r.order_id.slice(0, 8)}…</p>
                    <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{formatGMD(r.commission_amount)}</p>
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

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </Layout>
  );
};

export default Affiliate;
