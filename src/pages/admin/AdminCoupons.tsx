import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Tag } from "lucide-react";

const AdminCoupons = () => {
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !discountValue) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("coupons").insert({
        code: code.toUpperCase(),
        discount_type: discountType,
        discount_value: parseFloat(discountValue),
        expiry_date: expiryDate ? new Date(expiryDate).toISOString() : null,
        usage_limit: usageLimit ? parseInt(usageLimit) : null,
      });
      if (error) throw error;
      toast({ title: "Coupon created!", description: `Code: ${code.toUpperCase()}` });
      setCode("");
      setDiscountValue("");
      setExpiryDate("");
      setUsageLimit("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="container max-w-lg py-10">
        <h1 className="font-display text-3xl font-bold text-foreground mb-8">Create Coupon</h1>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Tag className="h-5 w-5" /> New Coupon</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Coupon Code</Label>
                <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="SUMMER25" className="uppercase" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Discount Type</Label>
                  <Select value={discountType} onValueChange={(v) => setDiscountType(v as "percentage" | "fixed")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed (D)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dv">Discount Value</Label>
                  <Input id="dv" type="number" min="0" step="0.01" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} placeholder={discountType === "percentage" ? "25" : "1000"} required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="exp">Expiry Date</Label>
                  <Input id="exp" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ul">Usage Limit</Label>
                  <Input id="ul" type="number" min="1" value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} placeholder="Unlimited" />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? <Loader2 className="animate-spin mr-2" /> : null} Create Coupon
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AdminCoupons;
