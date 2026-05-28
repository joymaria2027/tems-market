import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Package, Ticket } from "lucide-react";
import VendorVerificationBanner from "@/components/VendorVerificationBanner";
import { useVendorTicketPermission } from "@/hooks/useVendorTicketPermission";

const statusColor: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  approved: "default",
  pending: "secondary",
  rejected: "destructive",
  draft: "outline",
};

const VendorDashboard = () => {
  const { user, profile } = useAuth();
  const { canCreateTickets } = useVendorTicketPermission();

  const { data: vendorProfile } = useQuery({
    queryKey: ["vendor-profile-status", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_profiles")
        .select("id_document_url")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ["vendor-products", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, title, slug, price, stock, status, sponsored, images, created_at, category_id, categories(name)")
        .eq("vendor_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const getVerificationStatus = () => {
    if (!profile) return "unverified";
    if (profile.status === "active") return "verified";
    if (profile.status === "suspended") return "suspended";
    if (vendorProfile?.id_document_url) return "pending_verification";
    return "unverified";
  };

  return (
    <Layout>
      <div className="container py-10">          <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground">Vendor Dashboard</h1>
          <div className="flex items-center gap-2">
            {canCreateTickets && (
              <Button asChild variant="outline" size="sm">
                <Link to="/vendor/tickets"><Ticket className="mr-2 h-4 w-4" /> Tickets</Link>
              </Button>
            )}
            <Button asChild>
              <Link to="/vendor/upload"><Plus className="mr-2 h-4 w-4" /> Upload Product</Link>
            </Button>
          </div>
        </div>

        {profile && (
          <VendorVerificationBanner
            vendorStatus={getVerificationStatus()}
            verificationNote={null}
          />
        )}

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
          </div>
        ) : !products || products.length === 0 ? (
          <div className="text-center py-20">
            <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">You haven't listed any products yet.</p>
            <Button asChild><Link to="/vendor/upload">Upload Your First Product</Link></Button>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((p) => (
              <div key={p.id} className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 shadow-sm">
                <div className="h-16 w-16 rounded-md overflow-hidden bg-muted shrink-0">
                  {p.images?.[0] ? (
                    <img src={p.images[0]} alt={p.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground"><Package className="h-6 w-6" /></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{p.title}</p>
                  <p className="text-sm text-muted-foreground">
                    GMD {Number(p.price).toLocaleString()} · {p.stock} in stock
                    {(p.categories as any)?.name && ` · ${(p.categories as any).name}`}
                  </p>
                </div>
                <Badge variant={statusColor[p.status] ?? "outline"} className="capitalize shrink-0">
                  {p.status}
                </Badge>
                {p.sponsored && <Badge variant="outline" className="shrink-0 text-primary border-primary">Sponsored</Badge>}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default VendorDashboard;
