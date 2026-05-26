import { Link, useNavigate } from "react-router-dom";
import {
  Store, TrendingUp, ShieldCheck, Globe, Users, Wallet,
  Package, Sparkles, ArrowRight, Star
} from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";

const benefits = [
  {
    icon: Globe,
    title: "Reach Local Customers",
    description: "Connect with thousands of shoppers across The Gambia actively looking for products like yours.",
  },
  {
    icon: Wallet,
    title: "Set Your Own Margins",
    description: "You control your pricing. Choose your markup on top of the base price and maximize your profit.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Payments",
    description: "Bank transfer payments processed securely. Get paid reliably for every sale you make.",
  },
  {
    icon: TrendingUp,
    title: "Grow Your Business",
    description: "Access sales analytics, customer insights, and promotional tools to scale your store.",
  },
  {
    icon: Package,
    title: "Easy Inventory Management",
    description: "Upload products with images and descriptions. Track stock levels and manage orders effortlessly.",
  },
  {
    icon: Users,
    title: "Affiliate Network",
    description: "Optionally enable affiliates to promote your products. They earn commissions on sales they bring.",
  },
];

const steps = [
  { number: 1, title: "Create Your Account", description: "Sign up as a vendor with your business details and contact information." },
  { number: 2, title: "Submit Verification", description: "Upload your ID documents for verification. We review within 24 hours." },
  { number: 3, title: "List Your Products", description: "Add products with photos, descriptions, and prices. Set your margins." },
  { number: 4, title: "Start Selling", description: "Get approved and start receiving orders from customers across The Gambia." },
];

const testimonials = [
  {
    name: "Fatou J.",
    store: "Banjul Boutique",
    text: "Since joining Tems Market, my customer base has grown tremendously. The platform is easy to use and support is always helpful.",
    rating: 5,
  },
  {
    name: "Amadou B.",
    store: "Serekunda Tech",
    text: "The affiliate feature is a game-changer. Other sellers are promoting my products and I only pay when they make a sale.",
    rating: 5,
  },
];

const BecomeVendor = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const handleCTA = () => {
    if (!user) {
      navigate("/signup");
    } else if (profile?.role === "vendor") {
      navigate("/vendor/dashboard");
    } else {
      navigate("/vendor/upload");
    }
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="container py-12 md:py-20">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <Badge variant="secondary" className="text-xs font-medium px-3 py-1">
              <Sparkles className="h-3 w-3 mr-1 text-primary" />
              Open for Vendor Registration
            </Badge>
            <h1 className="font-display text-3xl md:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight">
              Sell on{" "}
              <span className="text-gradient">Tems Market</span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Reach thousands of customers across The Gambia. List your products, set your prices, and grow your business
              with The Gambia's premier social commerce marketplace.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button
                size="lg"
                className="h-12 px-8 font-semibold gap-2"
                onClick={handleCTA}
              >
                {!user ? "Get Started" : profile?.role === "vendor" ? "Go to Dashboard" : "Start Selling"}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 px-8 font-semibold">
                <Link to="/shop">Browse Marketplace</Link>
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-3xl mx-auto mt-12 md:mt-16">
            {[
              { value: "500+", label: "Active Customers" },
              { value: "50+", label: "Vendors" },
              { value: "1,000+", label: "Products Listed" },
              { value: "100%", label: "Local Marketplace" },
            ].map((stat) => (
              <div key={stat.label} className="text-center p-4 rounded-xl bg-card border border-border">
                <p className="text-2xl md:text-3xl font-bold text-primary">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="container py-12 md:py-20">
        <div className="text-center mb-10 md:mb-12 max-w-2xl mx-auto">
          <h2 className="font-display text-2xl md:text-4xl font-bold text-foreground mb-3">
            Why Sell on Tems Market?
          </h2>
          <p className="text-muted-foreground">
            Everything you need to start and grow your online business in The Gambia.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
          {benefits.map((benefit) => (
            <div
              key={benefit.title}
              className="group bg-card rounded-xl border border-border p-5 md:p-6 shadow-sm hover:shadow-card-hover hover:border-primary/20 transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                <benefit.icon className="h-5 w-5 text-primary group-hover:text-primary-foreground transition-colors" />
              </div>
              <h3 className="font-display text-base font-bold text-foreground mb-2">{benefit.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{benefit.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-secondary/30 border-y border-border">
        <div className="container py-12 md:py-20">
          <div className="text-center mb-10 md:mb-12 max-w-2xl mx-auto">
            <h2 className="font-display text-2xl md:text-4xl font-bold text-foreground mb-3">
              How It Works
            </h2>
            <p className="text-muted-foreground">
              Getting started as a vendor takes just a few minutes.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4 md:space-y-6">
            {steps.map((step, i) => (
              <div
                key={step.number}
                className="flex gap-4 md:gap-6 bg-card rounded-xl border border-border p-5 md:p-6 shadow-sm"
              >
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shrink-0">
                    {step.number}
                  </div>
                  {i < steps.length - 1 && (
                    <div className="w-px flex-1 bg-border mt-2" />
                  )}
                </div>
                <div className="pb-6">
                  <h3 className="font-display text-base md:text-lg font-bold text-foreground">{step.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container py-12 md:py-20">
        <div className="text-center mb-10 md:mb-12 max-w-2xl mx-auto">
          <h2 className="font-display text-2xl md:text-4xl font-bold text-foreground mb-3">
            What Vendors Say
          </h2>
          <p className="text-muted-foreground">
            Hear from vendors who are already growing their business on Tems Market.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 md:gap-6 max-w-3xl mx-auto">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="bg-card rounded-xl border border-border p-6 shadow-sm"
            >
              <div className="flex gap-1 mb-3">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4 italic">
                "{t.text}"
              </p>
              <div>
                <p className="text-sm font-semibold text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.store}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-y border-primary/10">
        <div className="container py-12 md:py-20 text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="font-display text-2xl md:text-4xl font-bold text-foreground">
              Ready to Start Selling?
            </h2>
            <p className="text-muted-foreground text-base md:text-lg">
              Join The Gambia's fastest-growing marketplace. Create your vendor account today and start reaching customers.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                size="lg"
                className="h-12 px-8 font-semibold gap-2"
                onClick={handleCTA}
              >
                {!user ? "Create Your Vendor Account" : profile?.role === "vendor" ? "Go to Dashboard" : "Start Selling Now"}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 px-8 font-semibold">
                <Link to="/shop">Browse Marketplace</Link>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Free to join. No setup fees. Vendor accounts require verification.
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default BecomeVendor;
