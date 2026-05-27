import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/hooks/useCurrency";
import type { DbProduct } from "@/types/product";
import { imageKit, imageSizes } from "@/lib/imageKit";

interface ShopProductCardProps {
  product: DbProduct;
}

const ShopProductCard = ({ product }: ShopProductCardProps) => {
  const image = product.images?.[0] || "/placeholder.svg";
  const { formatPrice } = useCurrency();

  return (
    <div className="group flex flex-col rounded-lg bg-card border border-border shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden">
      <Link to={`/product/${product.slug}`} className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={imageKit(image, imageSizes.thumb)}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {product.sponsored && (
          <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] font-semibold px-2 py-0.5">
            Sponsored
          </Badge>
        )}
      </Link>
      <div className="p-3 flex flex-col flex-1">
        {product.vendor_name && (
          <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide mb-1">
            {product.vendor_name}
          </p>
        )}
        <Link to={`/product/${product.slug}`}>
          <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-2 mb-2 group-hover:text-primary transition-colors">
            {product.title}
          </h3>
        </Link>
        {product.category_name && (
          <span className="text-[10px] text-muted-foreground mb-2">{product.category_name}</span>
        )}
        <div className="mt-auto flex items-center justify-between gap-2">
          <span className="text-base font-bold text-foreground">
            {formatPrice(Number(product.price))}
          </span>
          <Button
            size="sm"
            className="h-8 px-3 text-xs font-semibold gap-1.5"
            onClick={(e) => {
              e.preventDefault();
              // TODO: add to cart logic
            }}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            Add
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ShopProductCard;
