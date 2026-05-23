import { useState } from "react";
import Layout from "@/components/layout/Layout";
import SponsoredRow from "@/components/SponsoredRow";
import CategoryTabs from "@/components/CategoryTabs";
import ProductCard from "@/components/ProductCard";
import { mockProducts } from "@/data/mockProducts";

const Index = () => {
  const [category, setCategory] = useState("All");

  const sponsored = mockProducts.filter((p) => p.sponsored);
  const filtered = category === "All" ? mockProducts : mockProducts.filter((p) => p.category === category);

  return (
    <Layout>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-background py-10 md:py-16">
        <div className="container text-center max-w-2xl">
          <h1 className="font-display text-3xl md:text-5xl font-extrabold text-foreground leading-tight mb-4">
            Discover unique finds from <span className="text-gradient">independent vendors</span>
          </h1>
          <p className="text-muted-foreground text-base md:text-lg mb-6">
            Shop handpicked products from trusted sellers, all in one place.
          </p>
        </div>
      </section>

      {/* Sponsored */}
      <SponsoredRow products={sponsored} />

      {/* Product Grid */}
      <section className="py-8">
        <div className="container">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-xl md:text-2xl font-bold text-foreground">All Products</h2>
          </div>
          <CategoryTabs active={category} onChange={setCategory} />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
            {filtered.map((p, i) => (
              <div key={p.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
                <ProductCard product={p} />
              </div>
            ))}
          </div>
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-16">No products in this category yet.</p>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Index;
