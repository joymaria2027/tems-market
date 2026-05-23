import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, Package, ChevronLeft, ChevronRight } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/hooks/useCurrency";

const ProductDetail = () => {
  const { slug } = useParams();
  const { addItem } = useCart();
  const { toast } = useToast();
  const { formatPrice } = useCurrency();
  const [selectedImage, setSelectedImage] = useState(0);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name), profiles!products_vendor_id_fkey(name, store_name)")
        .eq("slug", slug!)
        .eq("status", "approved")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-10">
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="aspect-square rounded-lg" />
            <div className="space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="font-display text-2xl font-bold text-foreground">Product not found</h1>
        </div>
      </Layout>
    );
  }

  const images = product.images?.length ? product.images : ["/placeholder.svg"];
  const vendorName = (product.profiles as any)?.store_name || (product.profiles as any)?.name || "Unknown Vendor";
  const categoryName = (product.categories as any)?.name;

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      title: product.title,
      price: product.price,
      image: images[0],
      vendor_name: vendorName,
      stock: product.stock,
    });
    toast({ title: "Added to cart", description: product.title });
  };

  return (
    <Layout>
      <div className="container py-10">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Image gallery */}
          <div className="space-y-3">
            <div className="aspect-square rounded-xl overflow-hidden bg-muted relative group">
              <img
                src={images[selectedImage]}
                alt={product.title}
                className="w-full h-full object-cover"
              />
              {images.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                    onClick={() => setSelectedImage((prev) => (prev - 1 + images.length) % images.length)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                    onClick={() => setSelectedImage((prev) => (prev + 1) % images.length)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 transition-colors ${
                      i === selectedImage ? "border-primary" : "border-transparent"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product info */}
          <div className="space-y-5">
            <div>
              <p className="text-sm text-muted-foreground mb-1">{vendorName}</p>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">{product.title}</h1>
            </div>

            {categoryName && <Badge variant="secondary">{categoryName}</Badge>}

            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-foreground">{formatPrice(Number(product.price))}</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Package className="h-4 w-4" />
              {product.stock > 0 ? (
                <span>{product.stock} in stock</span>
              ) : (
                <span className="text-destructive font-medium">Out of stock</span>
              )}
            </div>

            {product.description && (
              <p className="text-muted-foreground leading-relaxed">{product.description}</p>
            )}

            <Button
              size="lg"
              className="w-full md:w-auto gap-2"
              onClick={handleAddToCart}
              disabled={product.stock < 1}
            >
              <ShoppingCart className="h-5 w-5" />
              Add to Cart
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductDetail;
