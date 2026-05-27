import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Ticket,
  Scan,
  Users,
  Calendar,
  MapPin,
  Loader2,
  ArrowLeft,
  BarChart3,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Package,
} from "lucide-react";
import { Link } from "react-router-dom";

// ─── Types ─────────────────────────────────────────────────

interface TicketProduct {
  id: string;
  title: string;
  slug: string;
  stock: number;
  images: string[];
  ticket_meta: {
    event_date?: string;
    venue?: string;
    valid_from?: string;
    valid_to?: string;
    terms?: string;
  } | null;
  status: string;
  created_at: string;
  category_name?: string;
}

interface TicketStats {
  total_capacity: number;
  sold: number;
  scanned: number;
  remaining: number;
}

interface ScanIn {
  id: string;
  ticket_identifier: string | null;
  quantity: number;
  note: string | null;
  scanned_at: string;
}

// ─── Helpers ────────────────────────────────────────────────

const statusColor: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  approved: "default",
  active: "default",
  pending_review: "secondary",
  pending: "secondary",
  rejected: "destructive",
  inactive: "outline",
};

const capacityPercent = (used: number, total: number) =>
  total > 0 ? Math.min(Math.round((used / total) * 100), 100) : 0;

const capacityColor = (pct: number) => {
  if (pct >= 90) return "bg-red-500";
  if (pct >= 70) return "bg-amber-500";
  return "bg-green-500";
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Main Component ────────────────────────────────────────

const VendorTickets = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Scan-in form state
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [scanIdentifier, setScanIdentifier] = useState("");
  const [scanQuantity, setScanQuantity] = useState("1");
  const [scanNote, setScanNote] = useState("");

  // ─── Fetch ticket products ────────────────────────────────

  const {
    data: ticketProducts = [],
    isLoading: productsLoading,
  } = useQuery({
    queryKey: ["vendor-ticket-products", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, title, slug, stock, images, ticket_meta, status, created_at")
        .eq("vendor_id", user!.id)
        .eq("product_type", "ticket")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as unknown as TicketProduct[];
    },
  });

  const selectedProduct = ticketProducts.find((p) => p.id === selectedProductId);

  // ─── Fetch scan-ins for each ticket product ───────────────

  const productIds = ticketProducts.map((p) => p.id);

  const { data: scanInsByProduct = {} } = useQuery({
    queryKey: ["vendor-ticket-scanins", productIds],
    enabled: productIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ticket_scan_ins")
        .select("id, product_id, ticket_identifier, quantity, note, scanned_at")
        .in("product_id", productIds)
        .order("scanned_at", { ascending: false });

      if (error) throw error;

      // Group by product_id
      const grouped: Record<string, ScanIn[]> = {};
      for (const row of data ?? []) {
        if (!grouped[row.product_id]) grouped[row.product_id] = [];
        grouped[row.product_id].push(row);
      }
      return grouped;
    },
  });

  // ─── Fetch sold counts ────────────────────────────────────

  const { data: soldByProduct = {} } = useQuery({
    queryKey: ["vendor-ticket-sold", productIds],
    enabled: productIds.length > 0,
    queryFn: async () => {
      const results: Record<string, number> = {};

      for (const pid of productIds) {
        const { data, error } = await supabase
          .from("order_items")
          .select("quantity, orders!inner(status)")
          .eq("product_id", pid)
          .in("orders.status", ["paid", "delivered", "shipped", "processing", "placed"]);

        if (error) throw error;

        const totalSold =
          (data ?? []).reduce((sum: number, item: any) => sum + (item.quantity ?? 0), 0);
        results[pid] = totalSold;
      }

      return results;
    },
  });

  // ─── Compute stats per product ────────────────────────────

  const productStats: Record<string, TicketStats> = {};
  for (const p of ticketProducts) {
    const scanned = (scanInsByProduct[p.id] ?? []).reduce(
      (sum, s) => sum + s.quantity,
      0
    );
    const sold = soldByProduct[p.id] ?? 0;
    productStats[p.id] = {
      total_capacity: p.stock,
      sold,
      scanned,
      remaining: Math.max(p.stock - scanned, 0),
    };
  }

  // ─── All recent scan-ins (for the activity feed) ──────────

  const allScanIns = Object.values(scanInsByProduct)
    .flat()
    .sort(
      (a, b) =>
        new Date(b.scanned_at).getTime() - new Date(a.scanned_at).getTime()
    )
    .slice(0, 20);

  // Helper: find product title by id
  const productTitleById = (id: string) =>
    ticketProducts.find((p) => p.id === id)?.title ?? "Unknown";

  // ─── Scan-in mutation ─────────────────────────────────────

  const scanMutation = useMutation({
    mutationFn: async () => {
      if (!user || !selectedProductId) return;
      const { error } = await supabase.from("ticket_scan_ins").insert({
        product_id: selectedProductId,
        scanned_by: user.id,
        ticket_identifier: scanIdentifier || null,
        quantity: parseInt(scanQuantity) || 1,
        note: scanNote || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Ticket scanned!",
        description: `Admitted ${scanQuantity} ticket(s) for "${selectedProduct?.title}".`,
      });
      setScanIdentifier("");
      setScanQuantity("1");
      setScanNote("");
      queryClient.invalidateQueries({ queryKey: ["vendor-ticket-scanins"] });
    },
    onError: (err: any) => {
      toast({
        title: "Scan failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      toast({
        title: "Select a product",
        description: "Choose a ticket product to scan into.",
        variant: "destructive",
      });
      return;
    }
    scanMutation.mutate();
  };

  // ─── Aggregate stats ──────────────────────────────────────

  const totalCapacity = ticketProducts.reduce((s, p) => s + p.stock, 0);
  const totalScanned = Object.values(productStats).reduce(
    (s, st) => s + st.scanned,
    0
  );
  const aggRemaining = totalCapacity - totalScanned;

  // ─── Render ───────────────────────────────────────────────

  return (
    <Layout>
      <div className="container py-10">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <Button asChild variant="ghost" size="sm" className="gap-1">
            <Link to="/vendor/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
          </Button>
        </div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground flex items-center gap-2">
              <Ticket className="h-7 w-7 text-primary" />
              Ticket Management
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track admissions, scan tickets, and monitor capacity
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/vendor/upload">New Ticket Product</Link>
          </Button>
        </div>

        {/* Aggregate capacity bar */}
        {ticketProducts.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-5 mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <BarChart3 className="h-4 w-4 text-primary" />
                Overall Capacity
              </div>
              <span className="text-xs text-muted-foreground">
                {totalScanned} / {totalCapacity} admitted
              </span>
            </div>
            <div className="h-3 rounded-full bg-secondary overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${capacityColor(capacityPercent(totalScanned, totalCapacity))}`}
                style={{ width: `${capacityPercent(totalScanned, totalCapacity)}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
              <span>{aggRemaining} remaining</span>
              <span>{capacityPercent(totalScanned, totalCapacity)}% full</span>
            </div>
          </div>
        )}

        {productsLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        ) : ticketProducts.length === 0 ? (
          <div className="text-center py-20">
            <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">
              You don't have any ticket products yet.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Create a ticket product to start tracking admissions.
            </p>
            <Button asChild>
              <Link to="/vendor/upload">
                <Ticket className="mr-2 h-4 w-4" />
                Create Ticket Product
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* ── Ticket Products List ────────────────────────── */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                <h2 className="font-display text-lg font-bold text-foreground">
                  Ticket Products
                </h2>
                <Badge variant="secondary" className="ml-auto">
                  {ticketProducts.length} products
                </Badge>
              </div>

              <div className="space-y-3">
                {ticketProducts.map((p) => {
                  const stats = productStats[p.id];
                  const pct = capacityPercent(stats.scanned, stats.total_capacity);
                  const eventDate = p.ticket_meta?.event_date
                    ? new Date(p.ticket_meta.event_date).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : null;

                  return (
                    <div
                      key={p.id}
                      className={`rounded-xl border p-5 shadow-sm transition-all duration-200 ${
                        selectedProductId === p.id
                          ? "border-primary ring-1 ring-primary"
                          : "border-border bg-card hover:shadow-card-hover"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Thumbnail */}
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted shrink-0">
                          {p.images?.[0] ? (
                            <img
                              src={p.images[0]}
                              alt={p.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                              <Ticket className="h-6 w-6" />
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-medium text-foreground truncate">
                                {p.title}
                              </h3>
                              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                {eventDate && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {eventDate}
                                  </span>
                                )}
                                {p.ticket_meta?.venue && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {p.ticket_meta.venue}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Badge
                              variant={statusColor[p.status] ?? "outline"}
                              className="capitalize shrink-0 text-[10px]"
                            >
                              {p.status.replace("_", " ")}
                            </Badge>
                          </div>

                          {/* Capacity bar */}
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-muted-foreground">
                                Capacity
                              </span>
                              <span className="font-medium text-foreground">
                                {stats.scanned} / {stats.total_capacity} admitted
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-secondary overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${capacityColor(pct)}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between mt-1 text-[10px] text-muted-foreground">
                              <span>
                                {stats.sold} sold · {stats.remaining} remaining
                              </span>
                              <span>{pct}% full</span>
                            </div>
                          </div>

                          {/* Quick scan button */}
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-3 gap-1.5 h-8 text-xs"
                            onClick={() => {
                              setSelectedProductId(p.id);
                              document
                                .getElementById("scan-form")
                                ?.scrollIntoView({ behavior: "smooth", block: "start" });
                            }}
                          >
                            <Scan className="h-3.5 w-3.5" />
                            Scan Into This
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Sidebar: Scan Form + Recent Activity ───────── */}
            <div className="space-y-6">
              {/* Scan-in Form */}
              <div
                id="scan-form"
                className="bg-card rounded-xl border border-border p-5 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Scan className="h-5 w-5 text-primary" />
                  <h2 className="font-display text-base font-bold text-foreground">
                    Scan Ticket
                  </h2>
                </div>

                <form onSubmit={handleScan} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="product-select">Ticket Product</Label>
                    <select
                      id="product-select"
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Select a product...</option>
                      {ticketProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="scan-identifier">
                      Ticket Identifier{" "}
                      <span className="text-muted-foreground font-normal">
                        (order #, QR code)
                      </span>
                    </Label>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="scan-identifier"
                        value={scanIdentifier}
                        onChange={(e) => setScanIdentifier(e.target.value)}
                        placeholder="e.g. TEMS-ABC123"
                        className="pl-8"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="scan-qty">Quantity</Label>
                      <Input
                        id="scan-qty"
                        type="number"
                        min="1"
                        value={scanQuantity}
                        onChange={(e) => setScanQuantity(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="scan-note">Note (optional)</Label>
                      <Input
                        id="scan-note"
                        value={scanNote}
                        onChange={(e) => setScanNote(e.target.value)}
                        placeholder="e.g. VIP entry"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full gap-2"
                    disabled={scanMutation.isPending || !selectedProductId}
                  >
                    {scanMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    {scanMutation.isPending ? "Scanning..." : "Confirm Admission"}
                  </Button>

                  {selectedProduct && (
                    <p className="text-xs text-muted-foreground text-center">
                      Scanning into{" "}
                      <span className="font-medium text-foreground">
                        {selectedProduct.title}
                      </span>
                      {" · "}
                      {productStats[selectedProduct.id]?.remaining} capacity
                      remaining
                    </p>
                  )}
                </form>
              </div>

              {/* Recent Scan Activity */}
              <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <h2 className="font-display text-base font-bold text-foreground">
                      Recent Activity
                    </h2>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">
                    {allScanIns.length} scans
                  </Badge>
                </div>

                {allScanIns.length === 0 ? (
                  <div className="text-center py-8">
                    <Scan className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No tickets scanned yet.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Use the form to admit ticket holders.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                    {allScanIns.map((scan) => (
                      <div
                        key={scan.id}
                        className="flex items-start gap-3 p-2.5 rounded-lg bg-secondary/30 border border-border/50"
                      >
                        <div className="w-7 h-7 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">
                            {productTitleById(scan.product_id)}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {scan.ticket_identifier
                              ? `${scan.ticket_identifier} · `
                              : ""}
                            x{scan.quantity}
                            {scan.note ? ` · ${scan.note}` : ""}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {formatDateTime(scan.scanned_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default VendorTickets;
