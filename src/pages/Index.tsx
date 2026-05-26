import { useState } from "react";
import { Sparkles, Tag } from "lucide-react";
import Layout from "@/components/layout/Layout";
import SponsoredRow from "@/components/SponsoredRow";
import CategoryTabs from "@/components/CategoryTabs";
import ProductCard from "@/components/ProductCard";
import { Badge } from "@/components/ui/badge";
import Slideshow, { type Slide } from "@/components/ui/slideshow";
import { mockProducts } from "@/data/mockProducts";

const heroSlides: Slide[] = [
  {
    img: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1600&q=80",
    text: ["DISCOVER YOUR", "NEXT FAVORITE"],
  },
  {
    img: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80",
    text: ["SHOP LOCAL", "SUPPORT INDEPENDENT"],
  },
  {
    img: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1600&q=80",
    text: ["HANDMADE WITH", "CARE AND PURPOSE"],
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

      {/* Intro section below slideshow */}
      <section className="py-10 md:py-14 border-b border-border/50">
        <div className="container text-center max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
            <Sparkles className="h-3 w-3" />
            The Gambia's Local Marketplace
          </div>
          <h1 className="font-display text-2xl md:text-4xl lg:text-5xl font-extrabold text-foreground leading-tight">
            Discover unique finds from{" "}
            <span className="text-gradient">independent vendors</span>
          </h1>
          <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Shop handpicked products from trusted sellers across The Gambia, all
            in one place.
          </p>

          {/* Quick stats */}
          <div className="flex items-center justify-center gap-6 md:gap-10 pt-2">
            <div className="text-center">
              <p className="font-display text-xl md:text-2xl font-bold text-foreground">
                {mockProducts.length}
              </p>
              <p className="text-[11px] text-muted-foreground">Products</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <p className="font-display text-xl md:text-2xl font-bold text-foreground">
                {new Set(mockProducts.map((p) => p.vendor)).size}
              </p>
              <p className="text-[11px] text-muted-foreground">Vendors</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <p className="font-display text-xl md:text-2xl font-bold text-foreground">
                {new Set(mockProducts.map((p) => p.category)).size}
              </p>
              <p className="text-[11px] text-muted-foreground">Categories</p>
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
