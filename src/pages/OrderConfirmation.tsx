import { Link, useLocation } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, ShoppingBag } from "lucide-react";
import { formatGMD } from "@/lib/utils/currency";

interface OrderState {
  orderId: string;
  items: { title: string; quantity: number; price: number }[];
  subtotal: number;
  discount: number;
  total: number;
  couponCode?: string;
  paymentMethod: string;
}

const OrderConfirmation = () => {
  const location = useLocation();
  const order = location.state as OrderState | undefined;

  if (!order) {
    return (
      <Layout>
        <div className="container py-16 text-center space-y-4">
          <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground" />
          <h1 className="font-display text-2xl font-bold text-foreground">No order found</h1>
          <Button asChild variant="outline">
            <Link to="/shop">Continue Shopping</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-10 max-w-2xl">
        <div className="text-center mb-8 space-y-3">
          <CheckCircle className="h-16 w-16 mx-auto text-green-500" />
          <h1 className="font-display text-3xl font-bold text-foreground">Order Confirmed!</h1>
          <p className="text-muted-foreground">
            Your order has been placed successfully.
          </p>
        </div>

        <div className="bg-card rounded-xl border border-border p-6 space-y-5">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold text-foreground">Order Summary</h2>
            <span className="text-sm font-mono bg-muted px-3 py-1 rounded text-foreground">
              #{order.orderId.slice(0, 8).toUpperCase()}
            </span>
          </div>

          <div className="space-y-3">
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-foreground">
                  {item.title} <span className="text-muted-foreground">× {item.quantity}</span>
                </span>
                <span className="font-medium text-foreground">{formatGMD(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          <Separator />

          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatGMD(order.subtotal)}</span>
            </div>
            {order.couponCode && order.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount ({order.couponCode})</span>
                <span>-{formatGMD(order.discount)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-semibold text-foreground text-lg pt-1">
              <span>Total</span>
              <span>{formatGMD(order.total)}</span>
            </div>
          </div>

          <Separator />

          <div className="text-sm space-y-1">
            <p className="font-medium text-foreground">Payment Method</p>
            <div className="space-y-2">
              <p className="text-muted-foreground">Bank Transfer: <span className="font-medium text-amber-600">Awaiting Payment</span></p>
              <div className="bg-muted rounded-lg p-4 space-y-1 text-sm">
                <p className="font-semibold text-foreground">Bank Details</p>
                <p className="text-muted-foreground">Bank: <span className="text-foreground">Trust Bank Gambia</span></p>
                <p className="text-muted-foreground">Account Name: <span className="text-foreground">Tems Market</span></p>
                <p className="text-muted-foreground">Account Number: <span className="text-foreground font-mono">1234567890</span></p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Button asChild size="lg">
            <Link to="/shop">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default OrderConfirmation;
