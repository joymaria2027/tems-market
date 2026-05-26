import { useState, useMemo } from "react";
import {
  Users, Search, Eye, Shield, Ban, CheckCircle,
  Trash2, XCircle, Clock, AlertTriangle, Mail, Phone, Calendar,
  Store, UserCheck, Filter,
  MoreHorizontal, ShieldCheck, UserCog
} from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { mockUsers, type AdminUser } from "@/data/mockAdminData";
import { formatGMD } from "@/lib/utils/currency";

// ─── Helpers ──────────────────────────────────────────────────────────────────────

const roleColors: Record<string, string> = {
  superadmin: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
  admin: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  vendor: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
  affiliate: "bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-800",
  customer: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
};

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800",
  rejected: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
  suspended: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800",
};

const roleIcons: Record<string, React.ReactNode> = {
  superadmin: <ShieldCheck className="h-3.5 w-3.5" />,
  admin: <UserCog className="h-3.5 w-3.5" />,
  vendor: <Store className="h-3.5 w-3.5" />,
  affiliate: <Users className="h-3.5 w-3.5" />,
  customer: <UserCheck className="h-3.5 w-3.5" />,
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────────

interface UserStatCardProps {
  label: string;
  count: number;
  icon: React.ReactNode;
  color: string;
}

const UserStatCard = ({ label, count, icon, color }: UserStatCardProps) => (
  <div className="bg-card rounded-xl border border-border p-4 shadow-sm hover:shadow-card-hover transition-all duration-300 group">
    <div className="flex items-center justify-between mb-2">
      <p className="text-2xl font-bold text-foreground">{count}</p>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color} group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
    </div>
    <p className="text-xs text-muted-foreground">{label}</p>
  </div>
);

// ─── User Actions Dropdown ────────────────────────────────────────────────────────

interface UserActionsDropdownProps {
  user: AdminUser;
  onView: (user: AdminUser) => void;
  onChangeRole: (user: AdminUser) => void;
  onToggleStatus: (user: AdminUser) => void;
  onDelete: (user: AdminUser) => void;
}

const UserActionsDropdown = ({ user, onView, onChangeRole, onToggleStatus, onDelete }: UserActionsDropdownProps) => {
  const canSuspend = user.role !== "superadmin";
  const isSuperadmin = user.role === "superadmin";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => onView(user)}>
          <Eye className="h-4 w-4 mr-2" />
          View Details
        </DropdownMenuItem>
        {!isSuperadmin && (
          <DropdownMenuItem onClick={() => onChangeRole(user)}>
            <Shield className="h-4 w-4 mr-2" />
            Change Role
          </DropdownMenuItem>
        )}
        {canSuspend && (
          <DropdownMenuItem onClick={() => onToggleStatus(user)}>
            {user.status === "suspended" ? (
              <><CheckCircle className="h-4 w-4 mr-2" /> Activate</>
            ) : (
              <><Ban className="h-4 w-4 mr-2" /> Suspend</>
            )}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onDelete(user)}
          className="text-destructive focus:text-destructive focus:bg-destructive/10"
          disabled={isSuperadmin}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete User
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// ─── View User Details Dialog ──────────────────────────────────────────────────────

interface ViewUserDialogProps {
  user: AdminUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ViewUserDialog = ({ user, open, onOpenChange }: ViewUserDialogProps) => {
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
          <DialogDescription>Full profile information for {user.full_name}</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4 p-4 rounded-lg bg-secondary/30 -mx-1">
          <Avatar className="h-14 w-14 border-2 border-border">
            <AvatarFallback className="text-base bg-primary/10 text-primary font-semibold">
              {getInitials(user.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground text-base truncate">{user.full_name}</p>
            <div className="flex flex-wrap gap-2 mt-1">
              <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${roleColors[user.role]}`}>
                {roleIcons[user.role]} {capitalize(user.role)}
              </span>
              <span className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full border ${statusColors[user.status]}`}>
                {capitalize(user.status)}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-[100px_1fr] gap-x-2 gap-y-2.5">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" /> Email
            </span>
            <span className="text-foreground font-medium">{user.email}</span>

            <span className="text-muted-foreground flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" /> Phone
            </span>
            <span className="text-foreground font-medium">{user.phone}</span>

            <span className="text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" /> Joined
            </span>
            <span className="text-foreground font-medium">{formatDate(user.created_at)}</span>

            {user.business_name && (
              <>
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Store className="h-3.5 w-3.5" /> Business
                </span>
                <span className="text-foreground font-medium">{user.business_name}</span>
              </>
            )}

            <span className="text-muted-foreground">DOB</span>
            <span className="text-foreground font-medium">
              {user.date_of_birth ? formatDate(user.date_of_birth) : "Not provided"}
            </span>

            <span className="text-muted-foreground">Age Verified</span>
            <span className="text-foreground font-medium">{user.age_verified ? "Yes" : "No"}</span>

            <span className="text-muted-foreground">Payout Preference</span>
            <span className="text-foreground font-medium capitalize">{user.commission_payout_preference.replace("_", " ")}</span>

            {user.total_orders !== undefined && user.role !== "superadmin" && user.role !== "admin" && (
              <>
                <span className="text-muted-foreground">Total Orders</span>
                <span className="text-foreground font-medium">{user.total_orders}</span>
              </>
            )}

            {user.total_spent !== undefined && user.total_spent > 0 && (
              <>
                <span className="text-muted-foreground">Total Spent</span>
                <span className="text-foreground font-medium">{formatGMD(user.total_spent)}</span>
              </>
            )}

            {user.invited_by && (
              <>
                <span className="text-muted-foreground">Invited By</span>
                <span className="text-foreground font-medium">{user.invited_by}</span>
              </>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── Change Role Dialog ────────────────────────────────────────────────────────────

interface ChangeRoleDialogProps {
  user: AdminUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (user: AdminUser, newRole: AdminUser["role"]) => void;
}

const ChangeRoleDialog = ({ user, open, onOpenChange, onConfirm }: ChangeRoleDialogProps) => {
  const [selectedRole, setSelectedRole] = useState<AdminUser["role"] | "">("");

  if (!user) return null;

  const availableRoles: AdminUser["role"][] = ["admin", "vendor", "affiliate", "customer"];

  const handleConfirm = () => {
    if (selectedRole && user) {
      onConfirm(user, selectedRole as AdminUser["role"]);
      setSelectedRole("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Change User Role</DialogTitle>
          <DialogDescription>
            Update role for <strong>{user.full_name}</strong>. This changes their permissions immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-2">Current role:</p>
          <Badge variant="secondary" className="mb-4 capitalize">{user.role}</Badge>

          <p className="text-sm text-muted-foreground mb-2">New role:</p>
          <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AdminUser["role"])}>
            <SelectTrigger>
              <SelectValue placeholder="Select a role..." />
            </SelectTrigger>
            <SelectContent>
              {availableRoles.map((role) => (
                <SelectItem key={role} value={role} className="capitalize">
                  <div className="flex items-center gap-2 capitalize">
                    {roleIcons[role]}
                    {role}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { setSelectedRole(""); onOpenChange(false); }}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={!selectedRole || selectedRole === user.role}>
            Update Role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── Confirm Action Dialog ─────────────────────────────────────────────────────────

interface ConfirmActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: "default" | "destructive";
  icon?: React.ReactNode;
}

const ConfirmActionDialog = ({
  open, onOpenChange, onConfirm,
  title, description, confirmLabel = "Confirm",
  variant = "default", icon,
}: ConfirmActionDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-sm">
      <DialogHeader>
        <div className="flex items-center gap-3 mb-2">
          {icon && <div className="text-destructive">{icon}</div>}
          <DialogTitle>{title}</DialogTitle>
        </div>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogFooter className="gap-2 sm:gap-0">
        <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
        <Button variant={variant} onClick={onConfirm}>{confirmLabel}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────────

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ─── Main Page ─────────────────────────────────────────────────────────────────────

const roleOptions = ["all", "superadmin", "admin", "vendor", "affiliate", "customer"] as const;
const statusOptions = ["all", "active", "pending", "rejected", "suspended"] as const;

const AdminUsers = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Dialogs state
  const [viewUser, setViewUser] = useState<AdminUser | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const [changeRoleUser, setChangeRoleUser] = useState<AdminUser | null>(null);
  const [changeRoleDialogOpen, setChangeRoleDialogOpen] = useState(false);

  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmDescription, setConfirmDescription] = useState("");
  const [confirmLabel, setConfirmLabel] = useState("Confirm");
  const [confirmVariant, setConfirmVariant] = useState<"default" | "destructive">("default");
  const [confirmIcon, setConfirmIcon] = useState<React.ReactNode>(undefined);
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // Snackbar
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Stats
  const totalUsers = mockUsers.length;
  const superadminCount = mockUsers.filter((u) => u.role === "superadmin").length;
  const adminCount = mockUsers.filter((u) => u.role === "admin").length;
  const vendorCount = mockUsers.filter((u) => u.role === "vendor").length;
  const affiliateCount = mockUsers.filter((u) => u.role === "affiliate").length;
  const customerCount = mockUsers.filter((u) => u.role === "customer").length;
  const pendingCount = mockUsers.filter((u) => u.status === "pending").length;

  // Filtered & searched users
  const filteredUsers = useMemo(() => {
    return mockUsers.filter((user) => {
      const matchesSearch =
        searchQuery === "" ||
        user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesStatus = statusFilter === "all" || user.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [searchQuery, roleFilter, statusFilter]);

  // Actions
  const handleViewUser = (user: AdminUser) => {
    setViewUser(user);
    setViewDialogOpen(true);
  };

  const handleChangeRoleClick = (user: AdminUser) => {
    setChangeRoleUser(user);
    setChangeRoleDialogOpen(true);
  };

  const handleChangeRoleConfirm = (user: AdminUser, newRole: AdminUser["role"]) => {
    showToast(`${user.full_name}'s role changed to ${capitalize(newRole)}`);
  };

  const handleToggleStatus = (user: AdminUser) => {
    const isSuspended = user.status === "suspended";
    setConfirmTitle(isSuspended ? "Activate User" : "Suspend User");
    setConfirmDescription(
      isSuspended
        ? `Reactivate ${user.full_name}? They will regain access to their account immediately.`
        : `Suspend ${user.full_name}? They will lose access to their account until reactivated.`
    );
    setConfirmLabel(isSuspended ? "Activate" : "Suspend");
    setConfirmVariant(isSuspended ? "default" : "destructive");
    setConfirmIcon(isSuspended ? undefined : <Ban className="h-5 w-5" />);
    setConfirmAction(() => () => {
      showToast(`${user.full_name} ${isSuspended ? "activated" : "suspended"} successfully`);
      setConfirmDialogOpen(false);
    });
    setConfirmDialogOpen(true);
  };

  const handleDeleteUser = (user: AdminUser) => {
    setConfirmTitle("Delete User");
    setConfirmDescription(
      `Permanently delete ${user.full_name}? This action cannot be undone. All associated data will be removed.`
    );
    setConfirmLabel("Delete");
    setConfirmVariant("destructive");
    setConfirmIcon(<AlertTriangle className="h-5 w-5" />);
    setConfirmAction(() => () => {
      showToast(`${user.full_name} deleted successfully`, "error");
      setConfirmDialogOpen(false);
    });
    setConfirmDialogOpen(true);
  };

  return (
    <Layout>
      <div className="container py-6 md:py-10 space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">User Management</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage all {totalUsers} registered users across the platform
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs gap-1">
              <Clock className="h-3 w-3" />
              Live
            </Badge>
            <span className="text-xs text-muted-foreground">{pendingCount} pending review</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <UserStatCard label="Total Users" count={totalUsers} icon={<Users className="h-4 w-4 text-white" />} color="bg-foreground" />
          <UserStatCard label="Superadmins" count={superadminCount} icon={<ShieldCheck className="h-4 w-4 text-white" />} color="bg-purple-500" />
          <UserStatCard label="Admins" count={adminCount} icon={<UserCog className="h-4 w-4 text-white" />} color="bg-blue-500" />
          <UserStatCard label="Vendors" count={vendorCount} icon={<Store className="h-4 w-4 text-white" />} color="bg-green-500" />
          <UserStatCard label="Affiliates" count={affiliateCount} icon={<Users className="h-4 w-4 text-white" />} color="bg-cyan-500" />
          <UserStatCard label="Customers" count={customerCount} icon={<UserCheck className="h-4 w-4 text-white" />} color="bg-amber-500" />
        </div>

        {/* Filters */}
        <div className="space-y-4">
          {/* Search + Role + Status */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
            <div className="flex gap-3">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-1" />
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((role) => (
                    <SelectItem key={role} value={role} className="capitalize">
                      {role === "all" ? "All Roles" : capitalize(role)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-1" />
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status} className="capitalize">
                      {status === "all" ? "All Status" : capitalize(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quick filter chips */}
          <div className="flex flex-wrap gap-2">
            {roleOptions.slice(1).map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(roleFilter === role ? "all" : role)}
                aria-pressed={roleFilter === role}
                className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
                  roleFilter === role
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                }`}
              >
                {roleIcons[role]}
                {capitalize(role)}
              </button>
            ))}
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3.5">User</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3.5 hidden md:table-cell">Email</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3.5">Role</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3.5">Status</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3.5 hidden lg:table-cell">Joined</th>
                  <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border border-border/50">
                          <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.full_name)}&backgroundColor=3b82f6&textColor=ffffff`} />
                          <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                            {getInitials(user.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground text-sm leading-tight">{user.full_name}</p>
                          {user.business_name && (
                            <p className="text-xs text-muted-foreground">{user.business_name}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground hidden md:table-cell">{user.email}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${roleColors[user.role]}`}>
                        {roleIcons[user.role]}
                        <span className="hidden sm:inline">{capitalize(user.role)}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${statusColors[user.status]}`}>
                        {user.status === "active" && <CheckCircle className="h-3 w-3" />}
                        {user.status === "pending" && <Clock className="h-3 w-3" />}
                        {user.status === "rejected" && <XCircle className="h-3 w-3" />}
                        {user.status === "suspended" && <Ban className="h-3 w-3" />}
                        {capitalize(user.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground hidden lg:table-cell">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <UserActionsDropdown
                        user={user}
                        onView={handleViewUser}
                        onChangeRole={handleChangeRoleClick}
                        onToggleStatus={handleToggleStatus}
                        onDelete={handleDeleteUser}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredUsers.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <Users className="h-12 w-12 text-muted-foreground/40 mb-3" />
                <p className="text-sm font-medium text-foreground">No users found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {searchQuery
                    ? "Try adjusting your search or filters"
                    : "There are no users matching the selected filters"}
                </p>
                {(searchQuery || roleFilter !== "all" || statusFilter !== "all") && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 text-xs"
                    onClick={() => { setSearchQuery(""); setRoleFilter("all"); setStatusFilter("all"); }}
                  >
                    Clear all filters
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-secondary/20">
            <p className="text-xs text-muted-foreground">
              Showing <span className="font-medium text-foreground">{filteredUsers.length}</span> of{" "}
              <span className="font-medium text-foreground">{mockUsers.length}</span> users
            </p>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-7 text-xs" disabled>
                Previous
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs bg-primary/10 text-primary font-medium">
                1
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs" disabled>
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <ViewUserDialog user={viewUser} open={viewDialogOpen} onOpenChange={setViewDialogOpen} />
      <ChangeRoleDialog
        user={changeRoleUser}
        open={changeRoleDialogOpen}
        onOpenChange={setChangeRoleDialogOpen}
        onConfirm={handleChangeRoleConfirm}
      />
      <ConfirmActionDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        onConfirm={confirmAction}
        title={confirmTitle}
        description={confirmDescription}
        confirmLabel={confirmLabel}
        variant={confirmVariant}
        icon={confirmIcon}
      />

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4">
          <div className={`rounded-lg px-4 py-3 shadow-lg text-sm font-medium flex items-center gap-2 ${
            toast.type === "success"
              ? "bg-green-600 text-white"
              : "bg-destructive text-destructive-foreground"
          }`}>
            {toast.type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            {toast.message}
          </div>
        </div>
      )}
    </Layout>
  );
};

export default AdminUsers;
