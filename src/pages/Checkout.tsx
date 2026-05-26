import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingBag, ArrowLeft, Building2, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { getStoredRefCode, clearStoredRefCode } from "@/hooks/useReferralTracker";
import { useCurrency } from "@/hooks/useCurrency";

const Checkout = () => {
  const { items, subtotal, discount, total, coupon, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [orderPhase, setOrderPhase] = useState(0);
  const { formatPrice } = useCurrency();

  // Stage 1: Anticipation — cycle through processing phases
  useEffect(() => {
    if (!loading) { setOrderPhase(0); return; }
    const t1 = setTimeout(() => setOrderPhase(1), 1200);
    const t2 = setTimeout(() => setOrderPhase(2), 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [loading]);

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container py-16 text-center space-y-4">
          <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground" />
          <h1 className="font-display text-2xl font-bold text-foreground">Your cart is empty</h1>
          <Button asChild variant="outline">
            <Link to="/shop">Continue Shopping</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const handlePlaceOrder = async () => {
    if (!user) {
      toast.error("Please log in to place an order.");
      navigate("/login");
      return;
    }

    setLoading(true);
    try {
      const refCode = getStoredRefCode();

      // Use server-side order creation with validated prices
      const { data, error } = await supabase.functions.invoke("create-order", {
        body: {
          items: items.map((item) => ({
            product_id: item.id,
            quantity: item.quantity,
          })),
          couponCode: coupon?.code,
          refCode: refCode || undefined,
        },
      });

      if (error) throw new Error(error.message || "Failed to place order");
      if (data?.error) throw new Error(data.error);

      if (refCode) clearStoredRefCode();

      // Send emails non-blocking
      try {
        await supabase.functions.invoke("send-email", {
          body: { type: "order_confirmation", orderId: data.orderId },
        });
      } catch { /* non-critical */ }

      try {
        const productIds = items.map((i) => i.id);
        const { data: products } = await supabase
          .from("products")
          .select("id, title, vendor_id, price, profiles(name)")
          .in("id", productIds);

        if (products) {
          for (const product of products) {
            const item = items.find((i) => i.id === product.id);
            if (!item) continue;
            try {
              await supabase.functions.invoke("send-email", {
                body: {
                  type: "new_sale_alert",
                  vendorId: product.vendor_id,
                  vendorName: (product.profiles as any)?.name || "Vendor",
                  productTitle: product.title,
                  quantity: item.quantity,
                  price: Number(product.price),
                  orderId: data.orderId,
                },
              });
            } catch { /* non-critical */ }
          }
        }
      } catch { /* non-critical */ }

      clearCart();
      navigate("/orders/confirmation", { state: data });
    } catch (err: any) {
      toast.error(err.message || "Failed to place order.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container py-10 max-w-3xl">
        <Link to="/shop" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to shop
        </Link>

        <h1 className="font-display text-3xl font-bold text-foreground mb-8">Checkout</h1>

        <div className="grid gap-6 md:grid-cols-5">
          {/* Order Summary */}
          <div className="md:col-span-3 bg-card rounded-xl border border-border p-6 space-y-4">
            <h2 className="font-semibold text-foreground">Order Summary</h2>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-md overflow-hidden bg-muted shrink-0">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{formatPrice(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>

            <Separator />

            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {coupon && discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount ({coupon.code})</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold text-foreground text-lg pt-1">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">All payments processed in GMD</p>
            </div>
          </div>

          {/* Payment: Bank Transfer Only */}
          <div className="md:col-span-2 space-y-4">
            <div className="bg-card rounded-xl border border-border p-6 space-y-4">
              <h2 className="font-semibold text-foreground">Payment Method</h2>

              <div className="w-full flex items-center gap-3 rounded-lg border border-primary bg-primary/5 ring-1 ring-primary p-4">
                <Building2 className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Bank Transfer</p>
                  <p className="text-xs text-muted-foreground">Transfer to our bank account</p>
                </div>
              </div>

              <div className="bg-muted rounded-lg p-4 space-y-1 text-sm">
                <p className="font-semibold text-foreground">Bank Details</p>
                <p className="text-muted-foreground">Bank: <span className="text-foreground">Trust Bank Gambia</span></p>
                <p className="text-muted-foreground">Account Name: <span className="text-foreground">Tems Market</span></p>
                <p className="text-muted-foreground">Account Number: <span className="text-foreground font-mono">1234567890</span></p>
              </div>
            </div>

            <Button
              className="w-full gap-2 transition-all duration-300"
              size="lg"
              disabled={loading}
              onClick={handlePlaceOrder}
            >
              {loading ? (
                <>
                  {orderPhase < 2 ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-400 animate-pulse" />
                  )}
                  <span className="transition-opacity duration-300">
                    {orderPhase === 0 && "Placing order..."}
                    {orderPhase === 1 && "Confirming payment..."}
                    {orderPhase === 2 && "Almost there..."}
                  </span>
                </>
              ) : (
                "Place Order"
              )}
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Checkout;
