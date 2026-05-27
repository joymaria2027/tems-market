import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import type { Product } from "@/data/mockProducts";
import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/hooks/useCurrency";
import { imageKit, imageSizes } from "@/lib/imageKit";

const ProductCard = ({ product }: { product: Product }) => {
  const { formatPrice } = useCurrency();
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  return (
    <Link
      to={`/product/${product.slug}`}
      className="group block rounded-lg bg-card border border-border shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={imageKit(product.image, imageSizes.thumb)}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {product.badge && (
          <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] font-semibold px-2 py-0.5">
            {product.badge}
          </Badge>
        )}
        {discount && (
          <span className="absolute top-2 right-2 bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-0.5 rounded-md">
            -{discount}%
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide mb-1">{product.vendor}</p>
        <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-2 mb-2 group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        <div className="flex items-center gap-1 mb-2">
          <Star className="h-3.5 w-3.5 fill-primary text-primary" />
          <span className="text-xs font-medium text-foreground">{product.rating}</span>
          <span className="text-xs text-muted-foreground">({product.reviews})</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-base font-bold text-foreground">{formatPrice(product.price)}</span>
          {product.originalPrice && (
            <span className="text-xs text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
