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
import { CheckCircle, XCircle, Eye } from "lucide-react";

const statusBadge: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  verified: "default",
  pending_verification: "secondary",
  suspended: "destructive",
  unverified: "outline",
};

const AdminVendors = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [actionTarget, setActionTarget] = useState<{ id: string; action: "verified" | "suspended" } | null>(null);
  const [note, setNote] = useState("");
  const [docsDialog, setDocsDialog] = useState<string[] | null>(null);

  const { data: vendors, isLoading } = useQuery({
    queryKey: ["admin-vendors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select(`
          id,
          full_name,
          role,
          status,
          created_at,
          vendor_profiles (
            business_name,
            id_document_url
          )
        `)
        .eq("role", "vendor")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data ?? []).map((u: any) => {
        const vp = Array.isArray(u.vendor_profiles) 
          ? u.vendor_profiles[0] 
          : u.vendor_profiles || {};

        return {
          id: u.id,
          name: u.full_name,
          store_name: vp.business_name || null,
          role: u.role,
          vendor_status: u.status === "active" 
            ? "verified" 
            : u.status === "suspended" 
            ? "suspended" 
            : vp.id_document_url 
            ? "pending_verification" 
            : "unverified",
          verification_documents: vp.id_document_url ? [vp.id_document_url] : [],
          verification_note: null,
          fulfillment_rate: 100,
          created_at: u.created_at,
        };
      });
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string; note: string }) => {
      const dbStatus = status === "verified" ? "active" : "suspended";
      const { error } = await supabase
        .from("users")
        .update({ status: dbStatus })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Vendor status updated" });
      setActionTarget(null);
      setNote("");
      qc.invalidateQueries({ queryKey: ["admin-vendors"] });
    },
  });

  return (
    <Layout>
      <div className="container py-10">
        <h1 className="font-display text-3xl font-bold text-foreground mb-8">Vendor Management</h1>

        {isLoading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
        ) : !vendors || vendors.length === 0 ? (
          <p className="text-muted-foreground text-center py-16">No vendors found.</p>
        ) : (
          <div className="rounded-lg border border-border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Store</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Docs</TableHead>
                  <TableHead className="text-right">Fulfillment</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendors.map((v: any) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">{v.name ?? "N/A"}</TableCell>
                    <TableCell className="text-muted-foreground">{v.store_name ?? "-"}</TableCell>
                    <TableCell>
                      <Badge variant={statusBadge[v.vendor_status] ?? "outline"} className="capitalize">
                        {v.vendor_status?.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {(v.verification_documents as string[])?.length > 0 ? (
                        <Button size="sm" variant="ghost" onClick={() => setDocsDialog(v.verification_documents)}>
                          <Eye className="h-4 w-4 mr-1" /> {(v.verification_documents as string[]).length}
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-xs">None</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{Number(v.fulfillment_rate).toFixed(0)}%</TableCell>
                    <TableCell className="text-right space-x-2">
                      {v.vendor_status !== "verified" && (
                        <Button size="sm" onClick={() => setActionTarget({ id: v.id, action: "verified" })}>
                          <CheckCircle className="h-4 w-4 mr-1" /> Verify
                        </Button>
                      )}
                      {v.vendor_status !== "suspended" && (
                        <Button size="sm" variant="destructive" onClick={() => setActionTarget({ id: v.id, action: "suspended" })}>
                          <XCircle className="h-4 w-4 mr-1" /> Suspend
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Action dialog */}
        <Dialog open={!!actionTarget} onOpenChange={(o) => { if (!o) { setActionTarget(null); setNote(""); } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{actionTarget?.action === "verified" ? "Verify Vendor" : "Suspend Vendor"}</DialogTitle>
            </DialogHeader>
            <Textarea
              placeholder="Optional note..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setActionTarget(null)}>Cancel</Button>
              <Button
                variant={actionTarget?.action === "suspended" ? "destructive" : "default"}
                disabled={updateStatus.isPending}
                onClick={() => actionTarget && updateStatus.mutate({ id: actionTarget.id, status: actionTarget.action, note })}
              >
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Documents viewer */}
        <Dialog open={!!docsDialog} onOpenChange={(o) => { if (!o) setDocsDialog(null); }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Verification Documents</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {docsDialog?.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block rounded-lg overflow-hidden border border-border hover:border-primary transition-colors">
                  <img src={url} alt={`Document ${i + 1}`} className="w-full h-40 object-cover" />
                </a>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default AdminVendors;
