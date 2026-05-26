import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag, Tag, ArrowLeft, Sparkles } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/contexts/CartContext";
import { useCurrency } from "@/hooks/useCurrency";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { mockProducts } from "@/data/mockProducts";
import ProductCard from "@/components/ProductCard";

const Cart = () => {
  const { items, removeItem, updateQuantity, subtotal, discount, total, coupon, setCoupon } = useCart();
  const { formatPrice } = useCurrency();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  const suggested = mockProducts
    .filter((p) => !items.some((i) => i.id === p.id))
    .slice(0, 4);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", couponCode.trim().toUpperCase())
      .maybeSingle();

    if (error || !data) {
      toast({ title: "Invalid coupon", description: "This coupon code doesn't exist.", variant: "destructive" });
      setCouponLoading(false);
      return;
    }

    if (data.expiry_date && new Date(data.expiry_date) < new Date()) {
      toast({ title: "Expired coupon", description: "This coupon has expired.", variant: "destructive" });
      setCouponLoading(false);
      return;
    }

    if (data.usage_limit && data.times_used >= data.usage_limit) {
      toast({ title: "Coupon limit reached", description: "This coupon has been fully redeemed.", variant: "destructive" });
      setCouponLoading(false);
      return;
    }

    setCoupon({
      code: data.code,
      discount_type: data.discount_type,
      discount_value: data.discount_value,
    });
    toast({ title: "Coupon applied!", description: `${data.discount_type === "percentage" ? `${data.discount_value}%` : `D${data.discount_value}`} off` });
    setCouponCode("");
    setCouponLoading(false);
  };

  // Empty cart state
  if (items.length === 0) {
    return (
      <Layout>
        <div className="container py-16 md:py-24">
          <div className="max-w-md mx-auto text-center space-y-6">
            <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center mx-auto">
              <ShoppingBag className="h-10 w-10 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">Your cart is empty</h1>
              <p className="text-muted-foreground text-sm md:text-base">
                Looks like you haven't added anything yet. Browse our collection and find something you love.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button asChild size="lg" className="font-semibold">
                <Link to="/shop">Browse Products</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/">Go Home</Link>
              </Button>
            </div>

            {/* Suggested products when empty */}
            <div className="pt-12 border-t border-border mt-12">
              <div className="flex items-center gap-2 justify-center mb-6">
                <Sparkles className="h-4 w-4 text-primary" />
                <h2 className="font-display text-lg font-semibold text-foreground">Popular Products</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                {mockProducts.slice(0, 4).map((p, i) => (
                  <div key={p.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
                    <ProductCard product={p} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 md:py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link to="/shop" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">Shopping Cart</h1>
              <p className="text-sm text-muted-foreground">{items.length} {items.length === 1 ? "item" : "items"}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => navigate("/shop")}>
            Continue Shopping
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 md:gap-5 bg-card rounded-xl border border-border p-4 md:p-5 shadow-sm"
              >
                {/* Image */}
                <Link to={`/product/${item.id}`} className="shrink-0">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden bg-muted">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                </Link>

                {/* Details */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        to={`/product/${item.id}`}
                        className="text-sm md:text-base font-semibold text-foreground hover:text-primary transition-colors line-clamp-1"
                      >
                        {item.title}
                      </Link>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="shrink-0 p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                        aria-label={`Remove ${item.title} from cart`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground">{item.vendor_name}</p>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    {/* Quantity controls */}
                    <div className="flex items-center gap-1 border border-border rounded-lg bg-background">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="p-1.5 rounded-l-lg hover:bg-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium tabular-nums">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                        className="p-1.5 rounded-r-lg hover:bg-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Price */}
                    <div className="text-right">
                      <p className="text-sm md:text-base font-bold text-foreground">{formatPrice(item.price * item.quantity)}</p>
                      {item.quantity > 1 && (
                        <p className="text-[11px] text-muted-foreground">{formatPrice(item.price)} each</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-xl border border-border p-5 md:p-6 shadow-sm lg:sticky lg:top-24 space-y-5">
              <h2 className="font-display text-lg font-bold text-foreground">Order Summary</h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-medium text-foreground">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span className="text-foreground">Calculated at checkout</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span className="font-medium">-{formatPrice(discount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-base">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="font-bold text-lg text-foreground">{formatPrice(total)}</span>
                </div>
                <p className="text-[11px] text-muted-foreground">All prices in Gambian Dalasi (GMD)</p>
              </div>

              {/* Coupon */}
              <div className="space-y-2 pt-1">
                <p className="text-xs font-medium text-foreground">Have a coupon?</p>
                {coupon ? (
                  <div className="flex items-center justify-between bg-secondary/60 rounded-lg px-3 py-2 border border-border">
                    <span className="text-sm flex items-center gap-1.5 text-foreground">
                      <Tag className="h-3.5 w-3.5 text-primary" />
                      {coupon.code}
                    </span>
                    <Button variant="ghost" size="sm" className="h-auto py-0.5 text-xs text-muted-foreground" onClick={() => setCoupon(null)}>
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="h-9 text-sm"
                      onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                    />
                    <Button variant="outline" size="sm" className="shrink-0 h-9" onClick={applyCoupon} disabled={couponLoading}>
                      Apply
                    </Button>
                  </div>
                )}
              </div>

              <Button
                className="w-full h-12 font-semibold text-base gap-2"
                size="lg"
                onClick={() => navigate("/checkout")}
              >
                <ShoppingBag className="h-5 w-5" />
                Proceed to Checkout
              </Button>

              {/* Trust badges */}
              <div className="flex items-center justify-center gap-4 text-[11px] text-muted-foreground pt-1">
                <span>🔒 Secure checkout</span>
                <span>💳 Bank transfer</span>
              </div>
            </div>
          </div>
        </div>

        {/* Suggested products */}
        {suggested.length > 0 && (
          <section className="mt-16 pt-8 border-t border-border">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="font-display text-lg md:text-xl font-bold text-foreground">You Might Also Like</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {suggested.map((p, i) => (
                <div key={p.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
};

export default Cart;
