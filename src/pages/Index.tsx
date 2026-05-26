import { useState } from "react";
import { ShieldCheck, Truck, HeartHandshake, ArrowRight, Tag } from "lucide-react";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import SponsoredRow from "@/components/SponsoredRow";
import CategoryTabs from "@/components/CategoryTabs";
import ProductCard from "@/components/ProductCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Slideshow, { type Slide } from "@/components/ui/slideshow";
import { mockProducts } from "@/data/mockProducts";

const heroSlides: Slide[] = [
  {
    img: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&q=60",
    text: ["SHOP THE BEST OF", "THE GAMBIA"],
    link: "/shop",
  },
  {
    img: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=60",
    text: ["TRUSTED VENDORS", "REAL PRODUCTS"],
    link: "/shop",
  },
  {
    img: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1200&q=60",
    text: ["START SELLING", "IN MINUTES"],
    link: "/become-a-vendor",
  },
];

const Index = () => {
  const [category, setCategory] = useState("All");

  const sponsored = mockProducts.filter((p) => p.sponsored);
  const filtered = category === "All" ? mockProducts : mockProducts.filter((p) => p.category === category);

  return (
    <Layout>
      {/* Hero Slideshow */}
      <Slideshow slides={heroSlides} />

      {/* CTA + Value Proposition — single action, outcome-driven */}
      <section className="py-10 md:py-14 border-b border-border/50">
        <div className="container text-center max-w-3xl space-y-5">
          <h1 className="font-display text-2xl md:text-4xl lg:text-5xl font-extrabold text-foreground leading-tight">
            Shop local products from{" "}
            <span className="text-gradient">trusted Gambian vendors</span>
          </h1>
          <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Fashion, electronics, and home goods — verified sellers, fair prices, delivered across The Gambia.
          </p>

          {/* Single CTA — what they get + how */}
          <div className="pt-2">
            <Button asChild size="lg" className="h-12 px-8 font-semibold gap-2">
              <Link to="/shop">
                Browse {mockProducts.length}+ Products
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* 3 objection-handling bullets — most common to least common */}
          <div className="grid sm:grid-cols-3 gap-4 pt-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-3 text-left p-3 rounded-lg bg-secondary/30">
              <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Verified Vendors</p>
                <p className="text-xs text-muted-foreground">Every seller is ID-verified</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-left p-3 rounded-lg bg-secondary/30">
              <Truck className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Local Delivery</p>
                <p className="text-xs text-muted-foreground">Across The Gambia</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-left p-3 rounded-lg bg-secondary/30">
              <HeartHandshake className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Support Local</p>
                <p className="text-xs text-muted-foreground">Every purchase helps a Gambian business</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sponsored */}
      <SponsoredRow products={sponsored} />

      {/* Product Grid */}
      <section className="py-8 md:py-12">
        <div className="container">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-xl md:text-2xl font-bold text-foreground">
              All Products
            </h2>
            <Badge variant="secondary" className="text-xs gap-1">
              <Tag className="h-3 w-3" />
              {filtered.length} items
            </Badge>
          </div>
          <CategoryTabs active={category} onChange={setCategory} />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
            {filtered.map((p, i) => (
              <div
                key={p.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <ProductCard product={p} />
              </div>
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-20 space-y-3">
              <p className="text-muted-foreground">
                No products in this category yet.
              </p>
              <button
                onClick={() => setCategory("All")}
                className="text-sm font-medium text-primary hover:underline"
              >
                View all products
              </button>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Index;
