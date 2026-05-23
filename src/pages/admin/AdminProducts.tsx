import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Check, X } from "lucide-react";

const AdminProducts = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectionNote, setRejectionNote] = useState("");

  const { data: products, isLoading } = useQuery({
    queryKey: ["admin-pending-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, title, price, images, status, created_at, vendor_id, profiles(name)")
        .eq("status", "pending")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const approve = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").update({ status: "approved" }).eq("id", id);
      if (error) throw error;

      const product = products?.find((p) => p.id === id);
      if (product) {
        const vendorName = (product.profiles as any)?.name || "Vendor";
        try {
          await supabase.functions.invoke("send-email", {
            body: {
              type: "product_approved",
              vendorId: product.vendor_id,
              vendorName,
              productTitle: product.title,
            },
          });
        } catch {
          // Non-critical
        }
      }
    },
    onSuccess: () => {
      toast({ title: "Product approved" });
      qc.invalidateQueries({ queryKey: ["admin-pending-products"] });
    },
  });

  const reject = useMutation({
    mutationFn: async ({ id, note }: { id: string; note: string }) => {
      const { error } = await supabase.from("products").update({ status: "rejected", rejection_note: note }).eq("id", id);
      if (error) throw error;

      const product = products?.find((p) => p.id === id);
      if (product) {
        const vendorName = (product.profiles as any)?.name || "Vendor";
        try {
          await supabase.functions.invoke("send-email", {
            body: {
              type: "product_rejected",
              vendorId: product.vendor_id,
              vendorName,
              productTitle: product.title,
              rejectionNote: note,
            },
          });
        } catch {
          // Non-critical
        }
      }
    },
    onSuccess: () => {
      toast({ title: "Product rejected" });
      setRejectTarget(null);
      setRejectionNote("");
      qc.invalidateQueries({ queryKey: ["admin-pending-products"] });
    },
  });

  return (
    <Layout>
      <div className="container py-10">
        <h1 className="font-display text-3xl font-bold text-foreground mb-8">Pending Products</h1>

        {isLoading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
        ) : !products || products.length === 0 ? (
          <p className="text-muted-foreground text-center py-16">No pending products to review.</p>
        ) : (
          <div className="rounded-lg border border-border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Image</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="h-12 w-12 rounded bg-muted overflow-hidden">
                        {p.images?.[0] && <img src={p.images[0]} alt="" className="h-full w-full object-cover" />}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{p.title}</TableCell>
                    <TableCell className="text-muted-foreground">{(p.profiles as any)?.name ?? "N/A"}</TableCell>
                    <TableCell className="text-right">D{Number(p.price).toLocaleString()}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" onClick={() => approve.mutate(p.id)} disabled={approve.isPending}>
                        <Check className="h-4 w-4 mr-1" /> Approve
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => setRejectTarget(p.id)}>
                        <X className="h-4 w-4 mr-1" /> Reject
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <Dialog open={!!rejectTarget} onOpenChange={(o) => { if (!o) { setRejectTarget(null); setRejectionNote(""); } }}>
          <DialogContent>
            <DialogHeader><DialogTitle>Reject Product</DialogTitle></DialogHeader>
            <Textarea placeholder="Reason for rejection..." value={rejectionNote} onChange={(e) => setRejectionNote(e.target.value)} rows={3} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectTarget(null)}>Cancel</Button>
              <Button variant="destructive" disabled={reject.isPending} onClick={() => rejectTarget && reject.mutate({ id: rejectTarget, note: rejectionNote })}>
                Confirm Reject
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default AdminProducts;
