import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, Wallet, TrendingUp, ArrowRight } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const BecomeVendor = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const handleCTA = () => {
    if (profile?.role === "vendor") {
      navigate("/vendor/dashboard");
    } else if (user) {
      navigate("/apply-as-vendor");
    } else {
      navigate("/apply-as-vendor");
    }
  };

  const ctaLabel = !user
    ? "Create Your Free Vendor Account"
    : profile?.role === "vendor"
      ? "Go to Dashboard"
      : "Start Selling Now";

  return (
    <Layout>
      {/* Hero — single action, outcome-driven headline */}
      <section className="bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="container py-14 md:py-24">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="font-display text-3xl md:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight">
              Turn your products into income —{" "}
              <span className="text-gradient">sell to thousands across The Gambia</span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              List in minutes. Set your own prices. Get paid on every sale.
            </p>

            {/* Single CTA — what they get + how, nothing else */}
            <div className="pt-2">
              <Button
                size="lg"
                className="h-12 px-8 font-semibold gap-2"
                onClick={handleCTA}
              >
                {ctaLabel}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <p className="text-xs text-muted-foreground mt-3">
                Free to join · No setup fees · Takes 3 minutes
              </p>
            </div>
          </div>

          {/* Hero image — proof of outcome */}
          <div className="mt-10 md:mt-14 max-w-4xl mx-auto">
            <div className="relative rounded-xl overflow-hidden border border-border shadow-lg bg-card">
              <img
                src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&q=60"
                alt="Vendor managing products on a marketplace dashboard"
                className="w-full h-auto object-cover"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6">
                <p className="text-white font-display text-sm md:text-base font-semibold">
                  Your store, live in minutes
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 objection-handling bullets — most common to least common */}
      <section className="border-y border-border/50">
        <div className="container py-10 md:py-14">
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Objection 1: "Is it trustworthy / will I get paid?" */}
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-foreground mb-1">
                  Get paid reliably
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Secure payments processed through ModemPay. Commissions settle daily to your mobile money.
                </p>
              </div>
            </div>

            {/* Objection 2: "Is it hard to set up?" */}
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-foreground mb-1">
                  Simple to start
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Upload products with photos, set your own markup, and start receiving orders — no tech skills needed.
                </p>
              </div>
            </div>

            {/* Objection 3: "Will I get customers?" */}
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-foreground mb-1">
                  Built-in customer base
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Shoppers are already browsing. Enable affiliates to promote your products — pay only when they sell.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default BecomeVendor;
