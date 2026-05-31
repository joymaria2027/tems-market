import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import ShopCategoryTabs from "@/components/ShopCategoryTabs";
import ShopProductCard from "@/components/ShopProductCard";
import SponsoredPicksRow from "@/components/SponsoredPicksRow";
import { Skeleton } from "@/components/ui/skeleton";
import type { DbProduct } from "@/types/product";

const Shop = () => {
  const [activeCategory, setActiveCategory] = useState("all");

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug")
        .order("name");
      if (error) throw error;
      return data as { id: string; name: string; slug: string }[];
    },
  });

  // Fetch approved products with category & vendor info
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["shop-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name, slug), profiles:users!products_submitted_by_vendor_fkey(name:full_name)")
        .eq("status", "active")
        .order("sponsored", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((p: any) => ({
        ...p,
        category_name: p.categories?.name ?? null,
        category_slug: p.categories?.slug ?? null,
        vendor_name: p.profiles?.name ?? null,
      })) as DbProduct[];
    },
  });

  const sponsored = products.filter((p) => p.sponsored);
  const filtered =
    activeCategory === "all"
      ? products
      : products.filter((p) => p.category_slug === activeCategory);

  return (
    <Layout>
      {/* Sponsored row */}
      <SponsoredPicksRow products={sponsored} />

      {/* Product grid */}
      <section className="py-8">
        <div className="container">
          <div className="flex items-center justify-between mb-5">
            <h1 className="font-display text-xl md:text-2xl font-bold text-foreground">All Products</h1>
          </div>
          <ShopCategoryTabs
            categories={categories}
            active={activeCategory}
            onChange={setActiveCategory}
          />

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-square rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
                {filtered.map((p, i) => (
                  <div key={p.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
                    <ShopProductCard product={p} />
                  </div>
                ))}
              </div>
              {filtered.length === 0 && (
                <p className="text-center text-muted-foreground py-16">
                  No products found in this category yet.
                </p>
              )}
            </>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Shop;
