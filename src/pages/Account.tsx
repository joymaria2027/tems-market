import { Link, useNavigate } from "react-router-dom";
import {
  User, ShoppingBag, Store, Users, LogOut, ChevronRight, Mail, Phone,
  ShieldCheck
} from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";

const roleLabels: Record<string, { label: string; icon: React.ReactNode }> = {
  customer: { label: "Customer", icon: <ShoppingBag className="h-3.5 w-3.5" /> },
  vendor: { label: "Vendor", icon: <Store className="h-3.5 w-3.5" /> },
  affiliate: { label: "Affiliate", icon: <Users className="h-3.5 w-3.5" /> },
  admin: { label: "Admin", icon: <ShieldCheck className="h-3.5 w-3.5" /> },
  superadmin: { label: "Super Admin", icon: <ShieldCheck className="h-3.5 w-3.5" /> },
};

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700 border-green-200",
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
  suspended: "bg-red-100 text-red-700 border-red-200",
};

const quickLinks = [
  {
    to: "/orders",
    label: "My Orders",
    description: "View order history and track shipments",
    icon: ShoppingBag,
  },
  {
    to: "/affiliate",
    label: "Affiliate Dashboard",
    description: "Manage referrals and earnings",
    icon: Users,
  },
  {
    to: "/vendor/dashboard",
    label: "Vendor Dashboard",
    description: "Manage products and sales",
    icon: Store,
  },
  {
    to: "/become-a-vendor",
    label: "Sell on Tems Market",
    description: "Start selling your products",
    icon: Store,
  },
];

const Account = () => {
  const { user, profile, loading, signOut } = useAuth();

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || "?";

  const roleInfo = profile?.role ? roleLabels[profile.role] : null;

  if (loading) {
    return (
      <Layout>
        <div className="container py-10 max-w-2xl">
          <Skeleton className="h-32 w-full rounded-xl mb-6" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="container py-16 md:py-24 text-center max-w-md mx-auto space-y-6">
          <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center mx-auto">
            <User className="h-10 w-10 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">My Account</h1>
            <p className="text-muted-foreground text-sm">Sign in to view your account details and manage your profile.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button asChild size="lg" className="font-semibold">
              <Link to="/login">Sign In</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/signup">Create Account</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const filteredLinks = quickLinks.filter((link) => {
    if (link.to === "/vendor/dashboard" && profile?.role !== "vendor") return false;
    if (link.to === "/become-a-vendor" && profile?.role === "vendor") return false;
    if (link.to === "/affiliate" && profile?.role !== "affiliate") return false;
    return true;
  });

  return (
    <Layout>
      <div className="container py-8 md:py-10 max-w-2xl space-y-6">
        {/* Profile card */}
        <div className="bg-card rounded-xl border border-border p-5 md:p-6 shadow-sm">
          <div className="flex items-start gap-4 md:gap-5">
            <Avatar className="w-16 h-16 md:w-20 md:h-20 rounded-xl">
              <AvatarFallback className="rounded-xl bg-primary/10 text-primary text-lg md:text-xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 space-y-2">
              <div>
                <h1 className="font-display text-xl md:text-2xl font-bold text-foreground truncate">
                  {profile?.full_name || "User"}
                </h1>
                {profile?.role && roleInfo && (
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-xs font-medium bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">
                      {roleInfo.icon}
                      {roleInfo.label}
                    </span>
                    <span className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full border ${statusColors[profile.status] || "bg-muted text-muted-foreground"}`}>
                      {profile.status}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-1 text-sm">
                {profile?.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{profile.email}</span>
                  </div>
                )}
                {user?.email && !profile?.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>
                )}
                {profile?.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    <span>{profile.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className="bg-card rounded-xl border border-border shadow-sm divide-y divide-border">
          {filteredLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="flex items-center gap-4 p-4 md:p-5 hover:bg-secondary/30 transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                <link.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{link.label}</p>
                <p className="text-xs text-muted-foreground">{link.description}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
          ))}
          {filteredLinks.length === 0 && (
            <div className="p-5 text-center text-sm text-muted-foreground">
              No account options available.
            </div>
          )}
        </div>

        {/* Account details */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-5 md:p-6 space-y-4">
          <h2 className="font-display text-base font-bold text-foreground">Account Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Full Name</p>
              <p className="font-medium text-foreground">{profile?.full_name || "—"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="font-medium text-foreground truncate">{profile?.email || user?.email || "—"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Phone</p>
              <p className="font-medium text-foreground">{profile?.phone || "—"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Date of Birth</p>
              <p className="font-medium text-foreground">
                {profile?.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString() : "—"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Role</p>
              <p className="font-medium text-foreground capitalize">{profile?.role || "—"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Payout Preference</p>
              <p className="font-medium text-foreground capitalize">
                {profile?.commission_payout_preference?.replace("_", " ") || "—"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Age Verified</p>
              <p className="font-medium text-foreground">{profile?.age_verified ? "Yes" : "No"}</p>
            </div>
          </div>
        </div>

        {/* Sign out */}
        <div className="text-center pt-2">
          <Button
            variant="outline"
            className="gap-2 text-muted-foreground"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default Account;
