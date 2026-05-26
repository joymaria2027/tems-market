import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldCheck, Users, DollarSign, ShoppingBag, Store, TrendingUp, TrendingDown,
  ChevronRight, Plus, Mail, UserPlus, Key, Settings, ExternalLink,
  CheckCircle, AlertTriangle, XCircle, Eye, Search, Copy,
  Ban, Clock, UserCog, BarChart3, Package
} from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { formatGMD } from "@/lib/utils/currency";

// ─── Stat Card ─────────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  change?: number;
  icon: React.ReactNode;
  color: string;
}

const StatCard = ({ label, value, change, icon, color }: StatCardProps) => {
  const isPositive = change ? change >= 0 : true;
  return (
    <div className="bg-card rounded-xl border border-border p-5 shadow-sm hover:shadow-card-hover transition-all duration-300 group">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
          <div className="text-white">{icon}</div>
        </div>
        {change !== undefined && (
          <span className={`inline-flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full ${
            isPositive
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          }`}>
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(change)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-foreground mb-0.5">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
};

// ─── Admin Admin Card ──────────────────────────────────────────────────────────────

interface AdminItem {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  status: string;
  created_at: string;
}

const AdminCard = ({ admin }: { admin: AdminItem }) => (
  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50">
    <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center shrink-0">
      <UserCog className="h-4 w-4" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-foreground truncate">{admin.full_name}</p>
      <p className="text-xs text-muted-foreground truncate">{admin.email}</p>
    </div>
    <Badge variant="secondary" className="text-[10px] capitalize">
      {admin.status}
    </Badge>
  </div>
);

// ─── Platform Settings Editor ──────────────────────────────────────────────────────

interface PlatformSetting {
  key: string;
  value: string;
  description: string;
}

// ─── Main Page ─────────────────────────────────────────────────────────────────────

const SuperAdminDashboard = () => {
  const { user, profile, signOut, updatePassword: updatePasswordCtx } = useAuth();
  const navigate = useNavigate();

  // --- Password change state ---
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);

  // --- Invite Admin state ---
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const [sendingInvite, setSendingInvite] = useState(false);

  // --- Platform Settings state ---
  const [settings, setSettings] = useState<PlatformSetting[]>([]);
  const [editingSetting, setEditingSetting] = useState<PlatformSetting | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showSettingsEditor, setShowSettingsEditor] = useState(false);

  // --- Admins list (mock for now) ---
  const [admins, setAdmins] = useState<AdminItem[]>([
    { id: "1", full_name: "Mariama Bah", email: "mariama@temsmarket.gm", phone: "+220 999 0002", status: "active", created_at: "2025-02-01" },
    { id: "2", full_name: "Ousman Sowe", email: "ousman@temsmarket.gm", phone: "+220 999 0003", status: "active", created_at: "2025-02-15" },
  ]);

  // --- Fetch platform settings ---
  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("*")
        .order("key");

      if (!error && data) {
        setSettings(data as PlatformSetting[]);
      }
    };
    fetchSettings();
  }, []);

  // ─── Password Change ─────────────────────────────────────────────────────────────

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await updatePasswordCtx(currentPassword, newPassword);
      if (error) throw error;

      toast.success("Password updated successfully");
      setPasswordChanged(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        setShowPasswordDialog(false);
        setPasswordChanged(false);
      }, 1500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update password";
      toast.error(message);
    } finally {
      setChangingPassword(false);
    }
  };

  // ─── Invite Admin ────────────────────────────────────────────────────────────────

  const handleInviteAdmin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteEmail || !inviteName || !invitePhone) {
      toast.error("All fields are required");
      return;
    }

    setSendingInvite(true);
    try {
      const { data, error } = await supabase.functions.invoke("invite-admin", {
        body: {
          email: inviteEmail,
          full_name: inviteName,
          phone: invitePhone,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Invite failed");

      const newAdmin: AdminItem = {
        id: data.admin_id || String(Date.now()),
        full_name: inviteName,
        email: inviteEmail,
        phone: invitePhone,
        status: "pending",
        created_at: new Date().toISOString().split("T")[0],
      };

      setAdmins((prev) => [newAdmin, ...prev]);
      toast.success(`Invite sent to ${inviteEmail}`);
      setShowInviteDialog(false);
      setInviteEmail("");
      setInviteName("");
      setInvitePhone("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to send invite";
      toast.error(message);
    } finally {
      setSendingInvite(false);
    }
  };

  // ─── Platform Settings Save ──────────────────────────────────────────────────────

  const handleSaveSetting = async () => {
    if (!editingSetting) return;

    try {
      const { error } = await supabase
        .from("platform_settings")
        .update({ value: editValue })
        .eq("key", editingSetting.key);

      if (error) throw error;

      setSettings((prev) =>
        prev.map((s) =>
          s.key === editingSetting.key ? { ...s, value: editValue } : s
        )
      );

      toast.success(`${editingSetting.key} updated`);
      setShowSettingsEditor(false);
      setEditingSetting(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update setting";
      toast.error(message);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────────

  if (!profile || profile.role !== "superadmin") {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <ShieldCheck className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">You don't have superadmin access.</p>
          <Button onClick={() => navigate("/")}>Go Home</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-6 md:py-10 space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">Super Admin</h1>
              <p className="text-sm text-muted-foreground">Full platform control and configuration</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs gap-1">
              <ShieldCheck className="h-3 w-3 text-purple-500" />
              {profile.full_name}
            </Badge>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <StatCard label="Total Revenue" value={formatGMD(285_450)} change={12.5} icon={<DollarSign className="h-5 w-5" />} color="bg-green-500" />
          <StatCard label="Total Users" value="1,247" change={8.3} icon={<Users className="h-5 w-5" />} color="bg-blue-500" />
          <StatCard label="Active Vendors" value="48" change={16.7} icon={<Store className="h-5 w-5" />} color="bg-purple-500" />
          <StatCard label="Total Orders" value="1,247" icon={<ShoppingBag className="h-5 w-5" />} color="bg-amber-500" />
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left column - Admin Management + Password */}
          <div className="lg:col-span-2 space-y-6">
            {/* Manage Admins */}
            <div className="bg-card rounded-xl border border-border shadow-sm p-5 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <UserCog className="h-5 w-5 text-primary" />
                  <h2 className="font-display text-base font-bold text-foreground">Admin Management</h2>
                </div>
                <Button size="sm" className="text-xs gap-1" onClick={() => setShowInviteDialog(true)}>
                  <UserPlus className="h-3.5 w-3.5" />
                  Invite Admin
                </Button>
              </div>

              <div className="space-y-2">
                {admins.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No admins yet. Invite your first admin.</p>
                ) : (
                  admins.map((admin) => <AdminCard key={admin.id} admin={admin} />)
                )}
              </div>

              <Separator className="my-4" />

              <Button variant="outline" size="sm" className="w-full text-xs gap-1" asChild>
                <Link to="/admin/users">
                  View All Users <ExternalLink className="h-3 w-3" />
                </Link>
              </Button>
            </div>

            {/* Platform Settings */}
            <div className="bg-card rounded-xl border border-border shadow-sm divide-y divide-border">
              <div className="flex items-center justify-between p-5 md:p-6 pb-4">
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  <h2 className="font-display text-base font-bold text-foreground">Platform Settings</h2>
                </div>
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => setShowSettingsDialog(!showSettingsDialog)}>
                  {showSettingsDialog ? "Hide" : "Show All"}
                </Button>
              </div>

              {showSettingsDialog && (
                <div className="px-5 md:px-6 pb-5 space-y-2 max-h-96 overflow-y-auto">
                  {settings.map((setting) => (
                    <div key={setting.key} className="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/20 transition-colors group">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-mono font-medium text-foreground">{setting.key}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{setting.description}</p>
                        <p className="text-sm font-medium text-foreground mt-1">
                          {setting.key.includes("fee") || setting.key.includes("price") || setting.key.includes("min") || setting.key.includes("rate")
                            ? setting.key.includes("fee")
                              ? `${(Number(setting.value) * 100).toFixed(0)}%`
                              : setting.value
                            : setting.value}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => {
                          setEditingSetting(setting);
                          setEditValue(setting.value);
                          setShowSettingsEditor(true);
                        }}
                      >
                        Edit
                      </Button>
                    </div>
                  ))}
                  {settings.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No settings loaded. Make sure the database is migrated.
                    </p>
                  )}
                </div>
              )}

              {!showSettingsDialog && (
                <div className="px-5 md:px-6 pb-5">
                  <p className="text-xs text-muted-foreground text-center py-2">
                    {settings.length} settings configured · Click "Show All" to view and edit
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Password */}
            <div className="bg-card rounded-xl border border-border shadow-sm p-5 md:p-6">
              <div className="flex items-center gap-2 mb-4">
                <Key className="h-5 w-5 text-primary" />
                <h2 className="font-display text-base font-bold text-foreground">Security</h2>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Password</span>
                  <Badge variant="outline" className="text-[10px]">Last changed recently</Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 text-xs"
                  onClick={() => { setPasswordChanged(false); setShowPasswordDialog(true); }}
                >
                  <Key className="h-3.5 w-3.5" />
                  Change Password
                </Button>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-card rounded-xl border border-border shadow-sm p-5 md:p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-5 w-5 text-primary" />
                <h2 className="font-display text-base font-bold text-foreground">Quick Access</h2>
              </div>
              <div className="space-y-1">
                {[
                  { to: "/admin/users", label: "User Management", icon: Users },
                  { to: "/admin/vendors", label: "Vendor Management", icon: Store },
                  { to: "/admin/orders", label: "Order Management", icon: ShoppingBag },
                  { to: "/admin/products", label: "Product Catalog", icon: Package },
                  { to: "/admin/coupons", label: "Coupons", icon: DollarSign },
                  { to: "/admin/gift-cards", label: "Gift Cards", icon: DollarSign },
                  { to: "/admin/affiliates", label: "Affiliates", icon: Users },
                ].map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary/50 transition-colors group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                      <link.icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <span className="text-sm text-foreground flex-1">{link.label}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Account Info */}
            <div className="bg-card rounded-xl border border-border shadow-sm p-5 md:p-6">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="h-5 w-5 text-purple-500" />
                <h2 className="font-display text-base font-bold text-foreground">Account</h2>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span className="text-foreground font-medium">{user?.email || "admin@temsmarket.gm"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Role</span>
                  <Badge className="text-[10px] bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400">
                    Super Admin
                  </Badge>
                </div>
                <Separator className="my-2" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-muted-foreground hover:text-destructive gap-1"
                  onClick={signOut}
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Password Change Dialog ─────────────── */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Change Password
            </DialogTitle>
            <DialogDescription>
              Enter your current password and a new password.
            </DialogDescription>
          </DialogHeader>

          {passwordChanged ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                <CheckCircle className="h-7 w-7 text-green-600 dark:text-green-400" />
              </div>
              <p className="font-semibold text-foreground">Password Updated</p>
              <p className="text-xs text-muted-foreground">Your password has been changed successfully.</p>
            </div>
          ) : (
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={() => setShowPasswordDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={changingPassword}>
                  {changingPassword ? "Updating..." : "Update Password"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Invite Admin Dialog ─────────────── */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Invite Admin
            </DialogTitle>
            <DialogDescription>
              Send an invitation to become a Tems Market admin.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleInviteAdmin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inviteName">Full Name</Label>
              <Input
                id="inviteName"
                placeholder="e.g. Mariama Bah"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inviteEmail">Email</Label>
              <Input
                id="inviteEmail"
                type="email"
                placeholder="mariama@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invitePhone">Phone Number</Label>
              <Input
                id="invitePhone"
                type="tel"
                placeholder="+220 xxx xxxx"
                value={invitePhone}
                onChange={(e) => setInvitePhone(e.target.value)}
                required
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setShowInviteDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={sendingInvite}>
                {sendingInvite ? "Sending..." : "Send Invite"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── Platform Settings Editor Dialog ─────────────── */}
      <Dialog open={showSettingsEditor} onOpenChange={setShowSettingsEditor}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Setting</DialogTitle>
            <DialogDescription>
              {editingSetting?.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Key</Label>
              <Input value={editingSetting?.key || ""} disabled className="font-mono text-xs" />
            </div>
            <div className="space-y-2">
              <Label>Value</Label>
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                placeholder="Enter new value"
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setShowSettingsEditor(false)}>Cancel</Button>
              <Button onClick={handleSaveSetting}>Save</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default SuperAdminDashboard;
