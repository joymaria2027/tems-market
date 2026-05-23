import { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AffiliateRow {
  id: string;
  code: string;
  commission_rate: number;
  total_earned: number;
  total_clicks: number;
  user_id: string;
  profiles: { name: string | null } | null;
}

interface ReferralRow {
  id: string;
  affiliate_id: string;
  order_id: string;
  commission_amount: number;
  status: string;
  created_at: string;
}

const AdminAffiliates = () => {
  const [affiliates, setAffiliates] = useState<AffiliateRow[]>([]);
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchData = async () => {
    const [{ data: affs }, { data: refs }] = await Promise.all([
      supabase.from("affiliates").select("*, profiles(name)"),
      supabase.from("affiliate_referrals").select("*").order("created_at", { ascending: false }),
    ]);
    setAffiliates((affs as any) || []);
    setReferrals((refs as any) || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const markPaid = async (referralId: string, affiliateId: string, amount: number) => {
    setUpdating(referralId);
    const { error } = await supabase
      .from("affiliate_referrals")
      .update({ status: "paid" })
      .eq("id", referralId);

    if (!error) {
      // Update affiliate total_earned
      const aff = affiliates.find((a) => a.id === affiliateId);
      if (aff) {
        await supabase
          .from("affiliates")
          .update({ total_earned: Number(aff.total_earned) + Number(amount) })
          .eq("id", affiliateId);
      }
      toast.success("Marked as paid");
      fetchData();
    } else {
      toast.error(error.message);
    }
    setUpdating(null);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-10">
        <h1 className="font-display text-3xl font-bold text-foreground mb-8">Manage Affiliates</h1>

        {/* Affiliates Table */}
        <div className="bg-card rounded-xl border border-border p-6 mb-8 overflow-x-auto">
          <h2 className="font-semibold text-foreground mb-4">All Affiliates</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-2">Name</th>
                <th className="pb-2">Code</th>
                <th className="pb-2">Rate</th>
                <th className="pb-2">Clicks</th>
                <th className="pb-2">Earned</th>
              </tr>
            </thead>
            <tbody>
              {affiliates.map((a) => (
                <tr key={a.id} className="border-b border-border last:border-0">
                  <td className="py-2 text-foreground">{a.profiles?.name || "N/A"}</td>
                  <td className="py-2 font-mono text-foreground">{a.code}</td>
                  <td className="py-2 text-foreground">{a.commission_rate}%</td>
                  <td className="py-2 text-foreground">{a.total_clicks}</td>
                  <td className="py-2 text-foreground">D{Number(a.total_earned).toFixed(2)}</td>
                </tr>
              ))}
              {affiliates.length === 0 && (
                <tr><td colSpan={5} className="py-4 text-center text-muted-foreground">No affiliates yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Referrals Table */}
        <div className="bg-card rounded-xl border border-border p-6 overflow-x-auto">
          <h2 className="font-semibold text-foreground mb-4">All Referrals</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-2">Order</th>
                <th className="pb-2">Affiliate</th>
                <th className="pb-2">Commission</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Date</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {referrals.map((r) => {
                const aff = affiliates.find((a) => a.id === r.affiliate_id);
                return (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className="py-2 font-mono text-foreground">{r.order_id.slice(0, 8)}…</td>
                    <td className="py-2 text-foreground">{aff?.code || "N/A"}</td>
                    <td className="py-2 text-foreground">D{Number(r.commission_amount).toFixed(2)}</td>
                    <td className="py-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        r.status === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                      }`}>{r.status}</span>
                    </td>
                    <td className="py-2 text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="py-2">
                      {r.status === "pending" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={updating === r.id}
                          onClick={() => markPaid(r.id, r.affiliate_id, r.commission_amount)}
                        >
                          {updating === r.id ? "…" : "Mark Paid"}
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {referrals.length === 0 && (
                <tr><td colSpan={6} className="py-4 text-center text-muted-foreground">No referrals yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default AdminAffiliates;
