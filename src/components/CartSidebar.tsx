import { useState } from "react";
import { Link } from "react-router-dom";
import { Minus, Plus, Trash2, Tag, ShoppingBag } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/hooks/useCurrency";

const CartSidebar = () => {
  const { items, isOpen, closeCart, removeItem, updateQuantity, subtotal, discount, total, coupon, setCoupon } = useCart();
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const { toast } = useToast();
  const { formatPrice } = useCurrency();

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
    setCouponLoading(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent className="flex flex-col w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" /> Cart ({items.length})
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground text-sm">Your cart is empty.</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className="w-16 h-16 rounded-md overflow-hidden bg-muted shrink-0">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.vendor_name}</p>
                    <p className="text-sm font-semibold text-foreground mt-0.5">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeItem(item.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-xs font-medium w-5 text-center">{item.quantity}</span>
                      <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.id, item.quantity + 1)} disabled={item.quantity >= item.stock}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            {/* Coupon */}
            <div className="space-y-3">
              {coupon ? (
                <div className="flex items-center justify-between bg-secondary rounded-md px-3 py-2">
                  <span className="text-sm flex items-center gap-1.5 text-secondary-foreground">
                    <Tag className="h-3.5 w-3.5" /> {coupon.code}
                  </span>
                  <Button variant="ghost" size="sm" className="h-auto py-0.5 text-xs" onClick={() => setCoupon(null)}>Remove</Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input placeholder="Coupon code" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} className="h-9 text-sm" />
                  <Button variant="outline" size="sm" className="shrink-0" onClick={applyCoupon} disabled={couponLoading}>
                    Apply
                  </Button>
                </div>
              )}

              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold text-foreground text-base">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          </>
        )}

        <SheetFooter className="mt-2">
          <Button asChild className="w-full" disabled={items.length === 0}>
            <Link to="/checkout" onClick={closeCart}>
              Proceed to Checkout
            </Link>
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default CartSidebar;
