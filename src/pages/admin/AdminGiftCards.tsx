import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Gift } from "lucide-react";

const generateCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const array = new Uint32Array(8);
  crypto.getRandomValues(array);
  return "GC-" + Array.from(array).map((n) => chars[n % chars.length]).join("");
};

const AdminGiftCards = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !value) return;
    setSubmitting(true);
    try {
      const code = generateCode();
      const { error } = await supabase.from("gift_cards").insert({
        code,
        value: parseFloat(value),
        remaining_balance: parseFloat(value),
        issued_to_email: email,
      });
      if (error) throw error;

      // Send gift card email to recipient
      try {
        await supabase.functions.invoke("send-email", {
          body: {
            type: "gift_card",
            to: email,
            code,
            value: parseFloat(value),
          },
        });
      } catch {
        // Non-critical
      }

      setGeneratedCode(code);
      toast({ title: "Gift card created!", description: `Code: ${code}` });
      setEmail("");
      setValue("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="container max-w-lg py-10">
        <h1 className="font-display text-3xl font-bold text-foreground mb-8">Generate Gift Card</h1>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Gift className="h-5 w-5" /> New Gift Card</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Recipient Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="customer@example.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="value">Value (GMD)</Label>
                <Input id="value" type="number" min="1" step="0.01" value={value} onChange={(e) => setValue(e.target.value)} placeholder="5000" required />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? <Loader2 className="animate-spin mr-2" /> : null} Generate Gift Card
              </Button>
            </form>

            {generatedCode && (
              <div className="mt-6 p-4 rounded-lg bg-primary/10 border border-primary/20 text-center">
                <p className="text-sm text-muted-foreground mb-1">Generated Code</p>
                <p className="text-2xl font-mono font-bold text-primary tracking-wider">{generatedCode}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AdminGiftCards;
