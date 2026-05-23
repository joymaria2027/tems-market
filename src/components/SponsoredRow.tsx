import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductCard from "./ProductCard";
import type { Product } from "@/data/mockProducts";

const SponsoredRow = ({ products }: { products: Product[] }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "left" ? -280 : 280, behavior: "smooth" });
  };

  return (
    <section className="py-6">
      <div className="container">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display text-xl md:text-2xl font-bold text-foreground">Sponsored Picks</h2>
            <p className="text-sm text-muted-foreground">Curated by our partners</p>
          </div>
          <div className="hidden sm:flex gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => scroll("left")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => scroll("right")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 -mx-1 px-1"
          style={{ scrollbarWidth: "none" }}
        >
          {products.map((p) => (
            <div key={p.id} className="min-w-[200px] max-w-[220px] snap-start flex-shrink-0">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SponsoredRow;
