import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Store, ArrowLeft, CheckCircle, XCircle, MapPin, Phone,
  MessageSquare, Tag, User, Package, Truck, Users,
  Image as ImageIcon, Loader2,
} from "lucide-react";
import { format } from "date-fns";

interface VendorApplication {
  id: string;
  business_name: string;
  category: string;
  phone: string;
  description: string | null;
  location: string | null;
  status: string;
  extra_data: Record<string, any> | null;
  created_at: string;
  rejection_reason: string | null;
  reviewed_by: string | null;
  invite_token: string | null;
  invite_expires_at: string | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  fashion_thrift: "Fashion & Thrift",
  electronics: "Electronics & Gadgets",
  food_snacks: "Food & Snacks",
  beauty: "Beauty & Personal Care",
  home_living: "Home & Living",
  arts_crafts: "Arts & Crafts",
  baby_kids: "Baby & Kids",
  books_media: "Books & Media",
  health_wellness: "Health & Wellness",
  services: "Services",
  other: "Other",
};

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  approved: "default",
  rejected: "destructive",
  expired: "outline",
  completed: "default",
};

function InfoRow({ icon, label, value, className = "" }: {
  icon: React.ReactNode; label: string; value: string; className?: string;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1">{icon} {label}</p>
      <p className={`font-medium text-foreground ${className}`}>{value}</p>
    </div>
  );
}

const AdminApplicationReview = () => {
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const { data: app, isLoading, error } = useQuery({
    queryKey: ["admin-vendor-application", applicationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_applications")
        .select("*")
        .eq("id", applicationId!)
        .single();
      if (error) throw error;
      return data as VendorApplication;
    },
    enabled: !!applicationId,
  });

  const approve = useMutation({
    mutationFn: async () => {
      const inviteToken = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const { error } = await supabase
        .from("vendor_applications")
        .update({ status: "approved", invite_token: inviteToken, invite_expires_at: expiresAt })
        .eq("id", applicationId!);
      if (error) throw error;
      return { inviteToken };
    },
    onSuccess: async ({ inviteToken }) => {
      const link = `${window.location.origin}/vendor-invite/${inviteToken}`;
      navigator.clipboard.writeText(link);

      // Send email notification to vendor via send-email Edge Function
      const vendorEmail = app?.extra_data?.email;
      if (vendorEmail) {
        supabase.functions.invoke("send-email", {
          body: {
            type: "vendor_approved",
            to: vendorEmail,
            businessName: app?.business_name || "Your Business",
            inviteLink: link,
            createdBy: "Admin",
          },
        }).catch((err) => console.error("Failed to send approval email:", err));
      }

      // Send SMS/WhatsApp notification via send-notification Edge Function
      if (app?.phone) {
        const inviteMessage = `You've been approved to sell on Tems Market! Set up your vendor account here: ${link}`;
        supabase.functions.invoke("send-notification", {
          body: {
            type: "invite",
            phone: app.phone,
            message: inviteMessage,
          },
        }).catch((err) => console.error("Failed to send approval SMS:", err));
      }

      toast({
        title: "Approved!",
        description: "Invite link copied. Notifications sent to vendor.",
      });
      qc.invalidateQueries({ queryKey: ["admin-vendor-application", applicationId] });
      qc.invalidateQueries({ queryKey: ["admin-vendor-applications"] });
    },
  });

  const reject = useMutation({
    mutationFn: async (reason: string) => {
      const { error } = await supabase
        .from("vendor_applications")
        .update({ status: "rejected", rejection_reason: reason })
        .eq("id", applicationId!);
      if (error) throw error;
    },
    onSuccess: () => {
      setRejectOpen(false);
      toast({ title: "Application rejected" });
      qc.invalidateQueries({ queryKey: ["admin-vendor-application", applicationId] });
      qc.invalidateQueries({ queryKey: ["admin-vendor-applications"] });
    },
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-8 max-w-3xl mx-auto space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </Layout>
    );
  }

  if (error || !app) {
    return (
      <Layout>
        <div className="container py-16 text-center space-y-4">
          <XCircle className="mx-auto h-10 w-10 text-destructive" />
          <h1 className="text-xl font-bold">Application Not Found</h1>
          <Button variant="outline" onClick={() => navigate("/admin/vendors")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Vendors
          </Button>
        </div>
      </Layout>
    );
  }

  const extra = app.extra_data || {};
  const photos: string[] = extra.photos || [];

  return (
    <Layout>
      <div className="container py-8 max-w-3xl mx-auto">
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate("/admin/vendors")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Vendors
        </Button>

        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Store className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">{app.business_name}</h1>
              <p className="text-sm text-muted-foreground">
                Submitted {format(new Date(app.created_at), "dd MMM yyyy 'at' HH:mm")}
              </p>
            </div>
          </div>
          <Badge variant={statusVariant[app.status] ?? "outline"} className="capitalize text-sm">
            {app.status}
          </Badge>
        </div>

        <div className="space-y-6">
          {/* Applicant */}
          <section className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
              <User className="h-4 w-4" /> Applicant Info
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <InfoRow icon={<User className="h-3.5 w-3.5" />} label="Full Name" value={extra.fullName || "—"} />
              <InfoRow icon={<Phone className="h-3.5 w-3.5" />} label="Phone" value={app.phone} />
              <InfoRow icon={<MessageSquare className="h-3.5 w-3.5" />} label="WhatsApp" value={extra.whatsapp || app.phone} />
              <InfoRow icon={<Tag className="h-3.5 w-3.5" />} label="Email" value={extra.email || "—"} />
            </div>
          </section>

          {/* Business */}
          <section className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
              <Store className="h-4 w-4" /> Business Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <InfoRow icon={<Tag className="h-3.5 w-3.5" />} label="Category" value={CATEGORY_LABELS[app.category] || app.category} />
              <InfoRow icon={<MapPin className="h-3.5 w-3.5" />} label="Location" value={app.location || "—"} />
              <div className="sm:col-span-2">
                <p className="text-xs text-muted-foreground mb-1">Description</p>
                <p className="text-sm">{app.description || "—"}</p>
              </div>
              <InfoRow icon={<Store className="h-3.5 w-3.5" />} label="Physical Store" value={extra.physicalStore ? extra.physicalStore.replace(/_/g, " ") : "—"} className="capitalize" />
              <InfoRow icon={<Package className="h-3.5 w-3.5" />} label="Sourcing" value={extra.sourcing ? extra.sourcing.replace(/_/g, " ") : "—"} className="capitalize" />
              <InfoRow icon={<Package className="h-3.5 w-3.5" />} label="Products" value={extra.productCount || "—"} />
            </div>
          </section>

          {/* Delivery */}
          {(extra.deliveryMethod || extra.deliveryAreas?.length > 0) && (
            <section className="bg-card border border-border rounded-xl p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
                <Truck className="h-4 w-4" /> Delivery
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <InfoRow icon={<Truck className="h-3.5 w-3.5" />} label="Method" value={extra.deliveryMethod?.replace(/_/g, " ") || "—"} className="capitalize" />
                {extra.deliveryAreas?.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Areas</p>
                    <div className="flex flex-wrap gap-1.5">
                      {extra.deliveryAreas.map((a: string) => (
                        <Badge key={a} variant="outline" className="text-xs">{a}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Affiliate */}
          {extra.affiliateOptIn && (
            <section className="bg-card border border-border rounded-xl p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" /> Affiliate
              </h2>
              <InfoRow icon={<Users className="h-3.5 w-3.5" />} label="Opt-In" value={extra.affiliateOptIn.replace(/_/g, " ")} className="capitalize" />
            </section>
          )}

          {/* Photos */}
          {photos.length > 0 && (
            <section className="bg-card border border-border rounded-xl p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
                <ImageIcon className="h-4 w-4" /> Photos ({photos.length})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {photos.map((url: string, i: number) => (
                  <button key={i} onClick={() => setLightboxUrl(url)}
                    className="group rounded-lg overflow-hidden border border-border hover:border-primary transition-colors aspect-square">
                    <img src={url} alt={`Upload ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                  </button>
                ))}
              </div>
            </section>
          )}

          {app.rejection_reason && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4">
              <p className="font-medium text-destructive text-sm">Rejection Reason</p>
              <p className="text-muted-foreground text-sm mt-1">{app.rejection_reason}</p>
            </div>
          )}

          {app.status === "pending" && (
            <div className="flex gap-3 pt-2">
              <Button className="flex-1" disabled={approve.isPending} onClick={() => approve.mutate()}>
                {approve.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                Approve & Generate Invite
              </Button>
              <Button variant="destructive" className="flex-1" onClick={() => setRejectOpen(true)}>
                <XCircle className="h-4 w-4 mr-1" /> Reject
              </Button>
            </div>
          )}
        </div>

        {/* Lightbox */}
        <Dialog open={!!lightboxUrl} onOpenChange={(o) => { if (!o) setLightboxUrl(null); }}>
          <DialogContent className="max-w-2xl p-0 overflow-hidden bg-black/95">
            {lightboxUrl && <img src={lightboxUrl} alt="Full size" className="w-full h-auto max-h-[80vh] object-contain" />}
          </DialogContent>
        </Dialog>

        {/* Reject dialog */}
        <Dialog open={rejectOpen} onOpenChange={(o) => { if (!o) { setRejectOpen(false); setRejectReason(""); } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject {app.business_name}</DialogTitle>
              <DialogDescription>Provide a reason for rejection.</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="reject-reason">Reason</Label>
              <Textarea id="reject-reason" placeholder="Why is this application being rejected?" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
              <Button variant="destructive" disabled={reject.isPending || !rejectReason.trim()} onClick={() => reject.mutate(rejectReason)}>
                {reject.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                Reject Application
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default AdminApplicationReview;
