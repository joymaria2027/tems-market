import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ShoppingBag, Package } from "lucide-react";
import { formatGMD } from "@/lib/utils/currency";

const statusColor: Record<string, string> = {
  placed: "bg-yellow-100 text-yellow-700",
  processing: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  refunded: "bg-gray-100 text-gray-700",
};

const Orders = () => {
  const { user, loading: authLoading } = useAuth();

  const { data: orders, isLoading } = useQuery({
    queryKey: ["my-orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          created_at,
          status,
          total_amount,
          quantity,
          vendor_listings (
            products (
              title,
              images
            )
          )
        `)
        .eq("customer_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      return (data ?? []).map((order: any) => {
        const listing = order.vendor_listings || {};
        const product = listing.products || {};
        return {
          id: order.id,
          created_at: order.created_at,
          status: order.status,
          total: order.total_amount,
          order_items: [
            {
              id: order.id + "-item",
              quantity: order.quantity,
              price_at_purchase: Number(order.total_amount) / order.quantity,
              products: {
                title: product.title || "Product",
                images: product.images || []
              }
            }
          ]
        };
      });
    },
  });

  if (authLoading) {
    return <Layout><div className="container py-16"><Skeleton className="h-8 w-48 mx-auto" /></div></Layout>;
  }

  if (!user) {
    return (
      <Layout>
        <div className="container py-16 text-center space-y-4">
          <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground" />
          <h1 className="font-display text-2xl font-bold text-foreground">My Orders</h1>
          <p className="text-muted-foreground">Log in to view your order history.</p>
          <Button asChild><Link to="/login">Log In</Link></Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-10 max-w-3xl">
        <h1 className="font-display text-3xl font-bold text-foreground mb-8">My Orders</h1>

        {isLoading ? (
          <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}</div>
        ) : !orders || orders.length === 0 ? (
          <div className="text-center py-20">
            <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">You have no orders yet.</p>
            <Button asChild><Link to="/shop">Start Shopping</Link></Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order: any) => (
              <div key={order.id} className="bg-card rounded-xl border border-border p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-mono text-muted-foreground">#{order.id.slice(0, 8).toUpperCase()}</span>
                    <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${statusColor[order.status] || "bg-muted text-muted-foreground"}`}>
                    {order.status.replace("_", " ")}
                  </span>
                </div>
                <Separator />
                <div className="space-y-2">
                  {order.order_items?.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-3 text-sm">
                      <div className="w-10 h-10 rounded bg-muted overflow-hidden shrink-0">
                        {item.products?.images?.[0] && (
                          <img src={item.products.images[0]} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <span className="flex-1 text-foreground truncate">{item.products?.title || "Product"}</span>
                      <span className="text-muted-foreground">x{item.quantity}</span>
                      <span className="font-medium text-foreground">{formatGMD(item.price_at_purchase * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-semibold text-foreground">{formatGMD(order.total)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Orders;
