import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle, XCircle, Eye, ExternalLink, UserPlus, ClipboardCopy,
  Store, Clock, AlertTriangle, CheckCheck, Search, Send, Loader2,
} from "lucide-react";
import { format } from "date-fns";

// ─── Types ─────────────────────────────────────────────────

interface VendorUser {
  id: string;
  name: string | null;
  store_name: string | null;
  role: string;
  vendor_status: string;
  verification_documents: string[];
  verification_note: string | null;
  fulfillment_rate: number;
  created_at: string;
}

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
}

// ─── Helpers ───────────────────────────────────────────────

const statusBadge: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  verified: "default",
  pending_verification: "secondary",
  suspended: "destructive",
  unverified: "outline",
};

const appStatusBadge: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  approved: "default",
  rejected: "destructive",
  expired: "outline",
  completed: "default",
};

const BUSINESS_TYPE_LABELS: Record<string, string> = {
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

// ─── Component ─────────────────────────────────────────────

const AdminVendors = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState("vendors");

  // Vendor management state
  const [actionTarget, setActionTarget] = useState<{ id: string; action: "verified" | "suspended" } | null>(null);
  const [note, setNote] = useState("");
  const [docsDialog, setDocsDialog] = useState<string[] | null>(null);

  // Application review state
  const [reviewTarget, setReviewTarget] = useState<VendorApplication | null>(null);
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  // Direct invite state
  const [directInviteOpen, setDirectInviteOpen] = useState(false);
  const [directPhone, setDirectPhone] = useState("");
  const [directStore, setDirectStore] = useState("");
  const [directCategory, setDirectCategory] = useState("");

  // Application detail state
  const [appDetail, setAppDetail] = useState<VendorApplication | null>(null);

  // Notification sending state
  const [notifSending, setNotifSending] = useState(false);
  const [notifSent, setNotifSent] = useState(false);
  const [notifError, setNotifError] = useState<string | null>(null);

  // ─── Queries ──────────────────────────────────────────────

  const { data: vendors, isLoading: vendorsLoading } = useQuery({
    queryKey: ["admin-vendors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select(`
          id, full_name, role, status, created_at,
          vendor_profiles (business_name, id_document_url)
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
        } as VendorUser;
      });
    },
  });

  const { data: applications, isLoading: appsLoading } = useQuery({
    queryKey: ["admin-vendor-applications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as VendorApplication[];
    },
  });

  const pendingCount = applications?.filter((a) => a.status === "pending").length ?? 0;

  // ─── Mutations ────────────────────────────────────────────

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: string; reason?: string }) => {
      const dbStatus = status === "verified" ? "active" : "suspended";
      const updates: Record<string, any> = { status: dbStatus };
      if (reason) updates.note = reason;
      const { error } = await supabase.from("users").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Vendor status updated" });
      setActionTarget(null);
      setNote("");
      qc.invalidateQueries({ queryKey: ["admin-vendors"] });
    },
  });

  const approveApplication = useMutation({
    mutationFn: async (application: VendorApplication) => {
      // Generate a unique invite token
      const token = crypto.randomUUID();

      // Update application status and set invite token (7 day expiry)
      const { error } = await supabase
        .from("vendor_applications")
        .update({
          status: "approved",
          invite_token: token,
          invite_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          invite_generated_at: new Date().toISOString(),
        })
        .eq("id", application.id);

      if (error) throw error;

      return { token, businessName: application.business_name };
    },
    onSuccess: async (result, variables) => {
      const link = `${window.location.origin}/vendor-invite/${result.token}`;
      setInviteLink(link);
      setReviewTarget(null);
      toast({
        title: "Invite link generated",
        description: `Sending to ${variables.phone}...`,
      });

      // Auto-send notification
      const notifResult = await sendInviteNotification(variables.phone, link);
      if (notifResult.success) {
        toast({ title: "Invite sent!", description: `WhatsApp/SMS sent to ${variables.phone}` });
      } else {
        toast({
          title: "Invite generated, but notification failed",
          description: `${notifResult.error}. The link is copied below — send it manually.`,
          variant: "destructive",
        });
      }

      qc.invalidateQueries({ queryKey: ["admin-vendor-applications"] });
    },
  });

  // Helper to send invite notification after link generation
  const sendInviteNotification = async (phone: string, link: string) => {
    setNotifSending(true);
    setNotifSent(false);
    setNotifError(null);
    try {
      const res = await supabase.functions.invoke("send-notification", {
        body: {
          phone,
          type: "invite",
          message: `You've been invited to sell on Tems Market! Set up your vendor account here: ${link}`,
        },
      });
      if (res.error) throw new Error(res.error.message || "Notification failed");
      setNotifSent(true);
      return { success: true };
    } catch (err: any) {
      const errMsg = err?.message || "Failed to send notification";
      setNotifError(errMsg);
      console.error("send-notification error:", errMsg);
      return { success: false, error: errMsg };
    } finally {
      setNotifSending(false);
    }
  };

  const rejectApplication = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { error } = await supabase
        .from("vendor_applications")
        .update({ status: "rejected", rejection_reason: reason })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Application rejected" });
      setReviewTarget(null);
      setRejectReason("");
      qc.invalidateQueries({ queryKey: ["admin-vendor-applications"] });
    },
  });

  const sendDirectInvite = useMutation({
    mutationFn: async () => {
      const token = crypto.randomUUID();
      const phone = directPhone.trim();

      const { error } = await supabase
        .from("vendor_applications")
        .insert({
          business_name: directStore.trim(),
          category: directCategory,
          phone,
          description: "Invited directly by admin",
          status: "approved",
          invite_token: token,
          invite_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          invite_generated_at: new Date().toISOString(),
        });

      if (error) throw error;
      return { token, businessName: directStore, phone };
    },
    onSuccess: async (result) => {
      const link = `${window.location.origin}/vendor-invite/${result.token}`;
      setInviteLink(link);
      setDirectInviteOpen(false);
      setDirectPhone("");
      setDirectStore("");
      setDirectCategory("");
      toast({
        title: "Direct invite created",
        description: `Sending to ${result.phone}...`,
      });

      // Auto-send notification
      const notifResult = await sendInviteNotification(result.phone, link);
      if (notifResult.success) {
        toast({ title: "Invite sent!", description: `WhatsApp/SMS sent to ${result.phone}` });
      } else {
        toast({
          title: "Invite generated, but notification failed",
          description: `${notifResult.error}. Copy the link and send it manually.`,
          variant: "destructive",
        });
      }

      qc.invalidateQueries({ queryKey: ["admin-vendor-applications"] });
    },
  });

  return (
    <Layout>
      <div className="container py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Vendor Management</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage vendor accounts and applications
            </p>
          </div>
          <Button onClick={() => setDirectInviteOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" /> Direct Invite
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="vendors">
              <Store className="h-4 w-4 mr-2" />
              Vendors
            </TabsTrigger>
            <TabsTrigger value="applications" className="relative">
              Applications
              {pendingCount > 0 && (
                <Badge variant="destructive" className="ml-2 text-[10px] h-5 px-1.5">
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ═══════════════════════════════════════════════
             TAB 1: Existing Vendors
             ═══════════════════════════════════════════════ */}
          <TabsContent value="vendors">
            {vendorsLoading ? (
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
                    {vendors.map((v) => (
                      <TableRow key={v.id}>
                        <TableCell className="font-medium">{v.name ?? "N/A"}</TableCell>
                        <TableCell className="text-muted-foreground">{v.store_name ?? "-"}</TableCell>
                        <TableCell>
                          <Badge variant={statusBadge[v.vendor_status] ?? "outline"} className="capitalize">
                            {v.vendor_status?.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {(v.verification_documents)?.length > 0 ? (
                            <Button size="sm" variant="ghost" onClick={() => setDocsDialog(v.verification_documents)}>
                              <Eye className="h-4 w-4 mr-1" /> {v.verification_documents.length}
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
          </TabsContent>

          {/* ═══════════════════════════════════════════════
             TAB 2: Applications Queue
             ═══════════════════════════════════════════════ */}
          <TabsContent value="applications">
            {appsLoading ? (
              <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : !applications || applications.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <Store className="mx-auto h-10 w-10 text-muted-foreground" />
                <p className="text-muted-foreground">No applications yet.</p>
                <Button variant="outline" size="sm" onClick={() => setDirectInviteOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" /> Send Direct Invite
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-card rounded-lg border border-border p-4 text-center">
                    <p className="text-2xl font-bold text-foreground">
                      {applications.filter((a) => a.status === "pending").length}
                    </p>
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </div>
                  <div className="bg-card rounded-lg border border-border p-4 text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {applications.filter((a) => a.status === "approved" || a.status === "completed").length}
                    </p>
                    <p className="text-xs text-muted-foreground">Approved</p>
                  </div>
                  <div className="bg-card rounded-lg border border-border p-4 text-center">
                    <p className="text-2xl font-bold text-destructive">
                      {applications.filter((a) => a.status === "rejected").length}
                    </p>
                    <p className="text-xs text-muted-foreground">Rejected</p>
                  </div>
                </div>

                {/* Applications table */}
                <div className="rounded-lg border border-border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Business</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-center">Submitted</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {applications.map((app) => (
                        <TableRow
                          key={app.id}
                          className={app.status === "pending" ? "bg-primary/5" : ""}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Store className="h-4 w-4 text-muted-foreground shrink-0" />
                              <div>
                                <p className="font-medium text-foreground text-sm">{app.business_name}</p>
                                <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                  {app.description}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {BUSINESS_TYPE_LABELS[app.category] || app.category}
                          </TableCell>
                          <TableCell className="text-xs">{app.phone}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {app.location || "-"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={appStatusBadge[app.status] ?? "outline"} className="capitalize text-xs">
                              {app.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground text-center">
                            {format(new Date(app.created_at), "dd MMM")}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setAppDetail(app)}
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              {app.status === "pending" && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => {
                                      setReviewTarget(app);
                                      setRejectMode(false);
                                    }}
                                  >
                                    <CheckCircle className="h-3.5 w-3.5 mr-1" /> Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => {
                                      setReviewTarget(app);
                                      setRejectMode(true);
                                      setRejectReason("");
                                    }}
                                  >
                                    <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                                  </Button>
                                </>
                              )}
                              {app.status === "approved" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setInviteLink(
                                      `${window.location.origin}/vendor-invite/${app.invite_token}`
                                    );
                                  }}
                                >
                                  <ExternalLink className="h-3.5 w-3.5 mr-1" /> Link
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* ═══════════════════════════════════════════════════
           DIALOGS
           ═══════════════════════════════════════════════════ */}

        {/* Vendor verify/suspend dialog */}
        <Dialog open={!!actionTarget} onOpenChange={(o) => { if (!o) { setActionTarget(null); setNote(""); } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionTarget?.action === "verified" ? "Verify Vendor" : "Suspend Vendor"}
              </DialogTitle>
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
                onClick={() => actionTarget && updateStatus.mutate({ id: actionTarget.id, status: actionTarget.action, reason: note })}
              >
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Application approve/reject dialog */}
        <Dialog open={!!reviewTarget} onOpenChange={(o) => { if (!o) { setReviewTarget(null); setRejectMode(false); setRejectReason(""); } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {rejectMode
                  ? `Reject ${reviewTarget?.business_name}`
                  : `Approve ${reviewTarget?.business_name}`}
              </DialogTitle>
              <DialogDescription>
                {rejectMode
                  ? "Provide a reason for rejection. The vendor will not be notified automatically yet."
                  : `Generate an invite link for ${reviewTarget?.business_name}. The link expires in 7 days.`}
              </DialogDescription>
            </DialogHeader>

            {rejectMode ? (
              <Textarea
                placeholder="Reason for rejection..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
              />
            ) : (
              <div className="space-y-3">
                <div className="bg-secondary/20 rounded-lg border border-border p-3 text-sm">
                  <p className="font-medium text-foreground">{reviewTarget?.business_name}</p>
                  <p className="text-muted-foreground text-xs">{reviewTarget?.phone}</p>
                  <p className="text-muted-foreground text-xs mt-1">{reviewTarget?.description}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Approving will generate a unique invite link. You can copy and share it with the vendor.
                </p>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => { setReviewTarget(null); setRejectMode(false); setRejectReason(""); }}>
                Cancel
              </Button>
              {rejectMode ? (
                <Button
                  variant="destructive"
                  disabled={rejectApplication.isPending || !rejectReason.trim()}
                  onClick={() => reviewTarget && rejectApplication.mutate({ id: reviewTarget.id, reason: rejectReason })}
                >
                  Reject Application
                </Button>
              ) : (
                <Button
                  disabled={approveApplication.isPending}
                  onClick={() => reviewTarget && approveApplication.mutate(reviewTarget)}
                >
                  {approveApplication.isPending ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-1" />
                  )}
                  Generate Invite Link
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Invite link dialog */}
        <Dialog open={!!inviteLink} onOpenChange={(o) => { if (!o) setInviteLink(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Invite Link Generated
              </DialogTitle>
              <DialogDescription>
                Share this link with the vendor. They'll set their password and be immediately active.
                The link expires in 7 days.
              </DialogDescription>
            </DialogHeader>

            <div className="flex items-center gap-2 p-3 bg-secondary/20 rounded-lg border border-border">
              <Input value={inviteLink || ""} readOnly className="text-xs font-mono" />
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (inviteLink) {
                    navigator.clipboard.writeText(inviteLink);
                    toast({ title: "Link copied to clipboard!" });
                  }
                }}
              >
                <ClipboardCopy className="h-4 w-4" />
              </Button>
            </div>

            {notifSending ? (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-xs">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span className="text-blue-700 dark:text-blue-300">Sending invite via WhatsApp/SMS...</span>
                </div>
              </div>
            ) : notifSent ? (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 text-xs text-green-700 dark:text-green-300">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">Invite sent via WhatsApp/SMS</span>
                </div>
              </div>
            ) : notifError ? (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-xs text-amber-800 dark:text-amber-300">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Could not send notification</p>
                    <p className="mt-1 opacity-80">{notifError}</p>
                    <p className="mt-1 opacity-80">Copy the link and send it to the vendor manually.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-muted rounded-lg p-3 text-xs text-muted-foreground">
                Sending notification to vendor…
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setInviteLink(null)}>Close</Button>
              <Button onClick={() => {
                if (inviteLink) {
                  navigator.clipboard.writeText(inviteLink);
                  toast({ title: "Link copied!" });
                }
              }}>
                <ClipboardCopy className="h-4 w-4 mr-1" /> Copy Link
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Application detail dialog */}
        <Dialog open={!!appDetail} onOpenChange={(o) => { if (!o) setAppDetail(null); }}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            {appDetail && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Store className="h-5 w-5 text-primary" />
                    {appDetail.business_name}
                  </DialogTitle>
                  <Badge variant={appStatusBadge[appDetail.status] ?? "outline"} className="w-fit capitalize">
                    {appDetail.status}
                  </Badge>
                </DialogHeader>

                <div className="space-y-4">
                  {/* Core info */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Category</p>
                      <p className="font-medium">{BUSINESS_TYPE_LABELS[appDetail.category] || appDetail.category}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="font-medium">{appDetail.phone}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">Location</p>
                      <p className="font-medium">{appDetail.location || "Not provided"}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">Description</p>
                      <p className="text-sm">{appDetail.description || "Not provided"}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">Submitted</p>
                      <p className="text-sm">
                        {format(new Date(appDetail.created_at), "dd MMM yyyy, HH:mm")}
                      </p>
                    </div>
                  </div>

                  {/* Extra data */}
                  {appDetail.extra_data && (
                    <>
                      <div className="border-t border-border pt-3">
                        <p className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wider">
                          Additional Details
                        </p>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          {appDetail.extra_data.fullName && (
                            <>
                              <p className="text-xs text-muted-foreground">Full Name</p>
                              <p className="font-medium">{appDetail.extra_data.fullName}</p>
                            </>
                          )}
                          {appDetail.extra_data.whatsapp && (
                            <>
                              <p className="text-xs text-muted-foreground">WhatsApp</p>
                              <p className="font-medium">{appDetail.extra_data.whatsapp}</p>
                            </>
                          )}
                          {appDetail.extra_data.physicalStore && (
                            <>
                              <p className="text-xs text-muted-foreground">Physical Store</p>
                              <p className="font-medium capitalize">{appDetail.extra_data.physicalStore.replace("_", " ")}</p>
                            </>
                          )}
                          {appDetail.extra_data.sourcing && (
                            <>
                              <p className="text-xs text-muted-foreground">Sourcing</p>
                              <p className="font-medium capitalize">{appDetail.extra_data.sourcing.replace("_", " ")}</p>
                            </>
                          )}
                          {appDetail.extra_data.productCount && (
                            <>
                              <p className="text-xs text-muted-foreground">Initial Products</p>
                              <p className="font-medium">{appDetail.extra_data.productCount}</p>
                            </>
                          )}
                          {appDetail.extra_data.deliveryMethod && (
                            <>
                              <p className="text-xs text-muted-foreground">Delivery Method</p>
                              <p className="font-medium capitalize">{appDetail.extra_data.deliveryMethod.replace("_", " ")}</p>
                            </>
                          )}
                          {appDetail.extra_data.deliveryAreas?.length > 0 && (
                            <>
                              <p className="text-xs text-muted-foreground">Delivery Areas</p>
                              <p className="font-medium">
                                {appDetail.extra_data.deliveryAreas.join(", ")}
                              </p>
                            </>
                          )}
                          {appDetail.extra_data.affiliateOptIn && (
                            <>
                              <p className="text-xs text-muted-foreground">Affiliate Interest</p>
                              <p className="font-medium capitalize">{appDetail.extra_data.affiliateOptIn.replace("_", " ")}</p>
                            </>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Rejection reason */}
                  {appDetail.rejection_reason && (
                    <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-sm">
                      <p className="font-medium text-destructive">Rejection reason</p>
                      <p className="text-muted-foreground mt-1">{appDetail.rejection_reason}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    {appDetail.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => {
                            setAppDetail(null);
                            setReviewTarget(appDetail);
                          }}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" /> Approve
                        </Button>                          <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setAppDetail(null);
                            setReviewTarget(appDetail);
                            setRejectMode(true);
                            setRejectReason("");
                          }}
                        >
                          <XCircle className="h-4 w-4 mr-1" /> Reject
                        </Button>
                      </>
                    )}
                    {appDetail.status === "approved" && appDetail.invite_token && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setInviteLink(`${window.location.origin}/vendor-invite/${appDetail.invite_token}`)}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" /> View Invite Link
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Direct invite dialog */}
        <Dialog open={directInviteOpen} onOpenChange={(o) => { if (!o) { setDirectInviteOpen(false); setDirectPhone(""); setDirectStore(""); setDirectCategory(""); } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                Send Direct Invite
              </DialogTitle>
              <DialogDescription>
                Create an invite link for a vendor you already know. They'll set their password and be immediately active.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="directStore">
                  Business Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="directStore"
                  placeholder="e.g. Fatou's Fashion House"
                  value={directStore}
                  onChange={(e) => setDirectStore(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="directPhone">
                  Phone Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="directPhone"
                  placeholder="+220 123 4567"
                  value={directPhone}
                  onChange={(e) => setDirectPhone(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="directCategory">
                  Category <span className="text-destructive">*</span>
                </Label>
                <Select value={directCategory} onValueChange={setDirectCategory}>
                  <SelectTrigger id="directCategory">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(BUSINESS_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDirectInviteOpen(false)}>Cancel</Button>
              <Button
                disabled={sendDirectInvite.isPending || !directStore || !directPhone || !directCategory}
                onClick={() => sendDirectInvite.mutate()}
              >
                <UserPlus className="h-4 w-4 mr-1" /> Generate Invite
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
