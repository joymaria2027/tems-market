import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Gift, Copy, Check, MessageSquare, Sparkles } from "lucide-react";
import Confetti from "@/components/Confetti";
import { formatGMD } from "@/lib/utils/currency";

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

  // Gift states
  const [revealedCard, setRevealedCard] = useState<{ code: string; value: number; email: string } | null>(null);
  const [cardEntered, setCardEntered] = useState(false);
  const [copied, setCopied] = useState(false);

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

      // Stage 2: Show visual card reveal instead of toast
      setRevealedCard({ code, value: parseFloat(value), email });
      setTimeout(() => setCardEntered(true), 100);
      setEmail("");
      setValue("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCode = () => {
    if (!revealedCard) return;
    navigator.clipboard.writeText(revealedCard.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    if (!revealedCard) return;
    const msg = `🎁 You've received a Tems Market Gift Card!\n\nCode: ${revealedCard.code}\nValue: ${formatGMD(revealedCard.value)}\n\nRedeem at ${window.location.origin}/shop`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank", "noopener,noreferrer");
  };

  const resetCard = () => {
    setCardEntered(false);
    setTimeout(() => setRevealedCard(null), 300);
  };

  return (
    <Layout>
      {/* Stage 2: Confetti on reveal */}
      <Confetti active={cardEntered} count={60} duration={2500} />

      <div className="container max-w-lg py-10">
        <h1 className="font-display text-3xl font-bold text-foreground mb-8">Generate Gift Card</h1>

        {/* Creation form */}
        <Card className={`transition-all duration-500 ${revealedCard ? "opacity-50 scale-95 pointer-events-none" : ""}`}>
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
              <Button type="submit" className="w-full gap-2" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gift className="h-4 w-4" />}
                {submitting ? "Generating..." : "Generate Gift Card"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Stage 2: Visual gift card reveal */}
        {revealedCard && (
          <div
            className={`mt-8 transition-all duration-700 ${
              cardEntered ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-90"
            }`}
          >
            {/* The gift card itself */}
            <div
              className="relative overflow-hidden rounded-2xl p-6 text-white shadow-2xl"
              style={{
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 30%, #a855f7 60%, #d946ef 100%)",
              }}
            >
              {/* Decorative circles */}
              <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
              <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/10" />

              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gift className="h-5 w-5" />
                    <span className="font-semibold text-sm tracking-wider uppercase">Tems Market</span>
                  </div>
                  <span className="text-xs opacity-80">Gift Card</span>
                </div>

                {/* Code with reveal animation */}
                <div
                  className="text-center py-4"
                  style={{ animation: cardEntered ? "codeReveal 0.8s ease-out 0.4s both" : "none" }}
                >
                  <p className="text-xs opacity-70 mb-1">Your Code</p>
                  <p className="text-3xl font-mono font-bold tracking-[0.2em]">{revealedCard.code}</p>
                </div>

                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs opacity-70">Value</p>
                    <p className="text-2xl font-bold">{formatGMD(revealedCard.value)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs opacity-70">Sent to</p>
                    <p className="text-sm font-medium truncate max-w-[180px]">{revealedCard.email}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stage 3: Afterglow — share actions */}
            <div
              className={`mt-4 space-y-3 transition-all duration-500 delay-500 ${
                cardEntered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <div className="flex items-center gap-2 justify-center">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <p className="text-xs text-muted-foreground font-medium">Send this gift card</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={handleCopyCode}>
                  {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied!" : "Copy Code"}
                </Button>
                <Button
                  size="sm"
                  className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                  onClick={handleWhatsAppShare}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  WhatsApp
                </Button>
              </div>
              <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={resetCard}>
                Create another gift card
              </Button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes codeReveal {
          0% { opacity: 0; transform: scale(0.8); filter: blur(8px); }
          100% { opacity: 1; transform: scale(1); filter: blur(0); }
        }
      `}</style>
    </Layout>
  );
};

export default AdminGiftCards;
