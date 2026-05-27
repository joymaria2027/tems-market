import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, ShoppingBag, ArrowRight, Sparkles, Ticket, Download, Loader2 } from "lucide-react";
import { formatGMD } from "@/lib/utils/currency";
import { supabase } from "@/integrations/supabase/client";
import Confetti from "@/components/Confetti";
import CountUp from "@/components/CountUp";
import ShareCard from "@/components/ShareCard";

interface OrderItem {
  product_id: string;
  title: string;
  quantity: number;
  price: number;
  product_type?: string;
}

interface OrderState {
  orderId: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  couponCode?: string;
  paymentMethod: string;
  isTicketOrder?: boolean;
}

const OrderConfirmation = () => {
  const location = useLocation();
  const order = location.state as OrderState | undefined;
  const [showConfetti, setShowConfetti] = useState(false);
  const [entered, setEntered] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [qrSvgs, setQrSvgs] = useState<Record<string, string>>({});
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);

  // Stage 1 → Stage 2 transition: delay the reveal for anticipation
  useEffect(() => {
    if (!order) return;
    // Small delay before confetti fires — builds micro-anticipation
    const confettiTimer = setTimeout(() => setShowConfetti(true), 300);
    // Content slides in after confetti starts
    const enterTimer = setTimeout(() => setEntered(true), 500);
    // Share prompt appears after ceremony settles
    const shareTimer = setTimeout(() => setShowShare(true), 2000);

    return () => {
      clearTimeout(confettiTimer);
      clearTimeout(enterTimer);
      clearTimeout(shareTimer);
    };
  }, [order]);

  // ─── Fetch QR codes for ticket items ────────────────────────
  useEffect(() => {
    if (!order || !order.items || !order.orderId) return;

    const ticketItems = order.items.filter((i) => i.product_type === "ticket");
    if (ticketItems.length === 0) return;

    setQrLoading(true);
    setQrError(null);

    const fetchQrs = async () => {
      const results: Record<string, string> = {};

      for (const item of ticketItems) {
        try {
          const { data, error } = await supabase.functions.invoke(
            "generate-ticket-qr",
            {
              body: {
                orderId: order.orderId,
                productId: item.product_id,
                productTitle: item.title,
                format: "svg",
              },
            }
          );

          if (error) throw error;
          // Response is raw SVG if format=svg
          if (typeof data === "string") {
            results[item.product_id] = data;
          }
        } catch (err: any) {
          console.error(`QR failed for ${item.title}:`, err);
          setQrError(`Could not generate QR for "${item.title}"`);
        }
      }

      setQrSvgs(results);
      setQrLoading(false);
    };

    const timer = setTimeout(fetchQrs, 1000); // Delay to let the ceremony settle
    return () => clearTimeout(timer);
  }, [order]);

  const handleDownloadQr = (svg: string, filename: string) => {
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

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

  const shareMessage = `I just ordered ${order.items.length} item${order.items.length > 1 ? "s" : ""} on Tems Market! 🛍️ Check it out → ${window.location.origin}/shop`;

  return (
    <Layout>
      {/* Stage 2: Confetti ceremony */}
      <Confetti active={showConfetti} count={100} duration={3500} />

      <div className="container py-10 max-w-2xl">
        {/* Stage 2: Animated hero section */}
        <div
          className={`text-center mb-8 space-y-3 transition-all duration-700 ${
            entered
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-6"
          }`}
        >
          {/* Bouncing check icon */}
          <div
            className="mx-auto w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center"
            style={{
              animation: entered ? "orderCheckBounce 0.7s ease-out 0.2s both" : "none",
            }}
          >
            <CheckCircle className="h-10 w-10 text-green-500" />
          </div>

          <h1 className="font-display text-3xl font-bold text-foreground">
            Order Confirmed! 🎉
          </h1>
          <p className="text-muted-foreground">
            Your order has been placed successfully.
          </p>
        </div>

        {/* Order card — slides in */}
        <div
          className={`bg-card rounded-xl border border-border p-6 space-y-5 transition-all duration-700 delay-200 ${
            entered
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          <div className="flex justify-between items-center">
            <h2 className="font-semibold text-foreground">Order Summary</h2>
            {/* Stage 2: Order ID with typewriter feel */}
            <span className="text-sm font-mono bg-primary/10 text-primary px-3 py-1 rounded-lg font-semibold">
              #{order.orderId.slice(0, 8).toUpperCase()}
            </span>
          </div>

          <div className="space-y-3">
            {order.items.map((item, i) => (
              <div
                key={i}
                className={`flex justify-between text-sm transition-all duration-500 items-center`}
                style={{
                  animation: entered
                    ? `fadeSlideIn 0.4s ease-out ${0.6 + i * 0.1}s both`
                    : "none",
                }}
              >
                <span className="text-foreground flex items-center gap-2">
                  {item.title} <span className="text-muted-foreground">× {item.quantity}</span>
                  {item.product_type === "ticket" && (
                    <Badge variant="outline" className="text-[10px] h-4 px-1 gap-0.5">
                      <Ticket className="h-2.5 w-2.5" />
                      Ticket
                    </Badge>
                  )}
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
            {/* Stage 2: Animated total count-up */}
            <div className="flex justify-between font-semibold text-foreground text-xl pt-2">
              <span>Total</span>
              <CountUp
                end={order.total}
                prefix="D"
                duration={1000}
                decimals={2}
                active={entered}
                className="tabular-nums"
              />
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

          {/* ── Ticket QR Codes ──────────────────────────────── */}
          {order.items.some((i) => i.product_type === "ticket") && (
            <div className="border-t border-border pt-5 mt-1">
              <div className="flex items-center gap-2 mb-4">
                <Ticket className="h-4 w-4 text-primary" />
                <p className="font-semibold text-foreground text-sm">Your Tickets</p>
                {qrLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
              </div>

              {qrError && (
                <p className="text-xs text-amber-600 mb-3">{qrError}</p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {order.items
                  .filter((i) => i.product_type === "ticket")
                  .map((item) => {
                    const svg = qrSvgs[item.product_id];
                    return (
                      <div
                        key={item.product_id}
                        className="bg-white rounded-xl border border-border overflow-hidden shadow-sm"
                      >
                        {svg ? (
                          <>
                            <div
                              className="w-full flex items-center justify-center bg-white p-3"
                              dangerouslySetInnerHTML={{ __html: svg }}
                            />
                            <div className="p-3 border-t border-border/50 flex items-center justify-between">
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-foreground truncate">
                                  {item.title}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  × {item.quantity} ticket{item.quantity > 1 ? "s" : ""}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 gap-1 text-xs shrink-0"
                                onClick={() =>
                                  handleDownloadQr(
                                    svg,
                                    `ticket-${item.title
                                      .toLowerCase()
                                      .replace(/\s+/g, "-")}`
                                  )
                                }
                              >
                                <Download className="h-3 w-3" />
                                Save
                              </Button>
                            </div>
                          </>
                        ) : qrLoading ? (
                          <div className="flex items-center justify-center h-48">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-48 text-muted-foreground text-xs">
                            QR unavailable
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>

              <p className="text-[10px] text-muted-foreground mt-3 text-center">
                Show this QR code at the venue for admission. You can also download each ticket.
              </p>
            </div>
          )}
        </div>

        {/* Stage 3: Share prompt — afterglow */}
        <div
          className={`mt-6 bg-card rounded-xl border border-border p-6 transition-all duration-700 ${
            showShare
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4"
          }`}
        >
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">Spread the word!</p>
          </div>
          <ShareCard
            message={shareMessage}
            label=""
            whatsapp
          />
        </div>

        {/* CTAs */}
        <div
          className={`mt-8 flex flex-col sm:flex-row gap-3 justify-center transition-all duration-700 delay-300 ${
            entered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <Button asChild size="lg" className="gap-2">
            <Link to="/orders">
              Track Your Order <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/shop">Continue Shopping</Link>
          </Button>
        </div>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes orderCheckBounce {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.2); opacity: 1; }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </Layout>
  );
};

export default OrderConfirmation;
