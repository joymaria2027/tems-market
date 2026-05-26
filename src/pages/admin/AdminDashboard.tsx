import { Link } from "react-router-dom";
import {
  DollarSign, ShoppingBag, Package, Store, Users, TrendingUp, TrendingDown,
  ChevronRight, Clock, AlertCircle, ShieldCheck, Plus, Eye,
  ArrowUpRight, BarChart3, Gift, Tag
} from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  mockAdminStats, mockRecentOrders, mockPendingItems, mockRevenueByMonth,
  statusColors, type RecentOrder
} from "@/data/mockAdminData";
import { formatGMD } from "@/lib/utils/currency";

interface StatCardProps {
  label: string;
  value: string;
  change: number;
  icon: React.ReactNode;
  trend?: "up" | "down";
}

const StatCard = ({ label, value, change, icon, trend }: StatCardProps) => {
  const isPositive = trend ? trend === "up" : change >= 0;
  return (
    <div className="bg-card rounded-xl border border-border p-5 shadow-sm hover:shadow-card-hover transition-all duration-300 group">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
          <div className="text-primary group-hover:text-primary-foreground transition-colors">
            {icon}
          </div>
        </div>
        <span className={`inline-flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full ${
          isPositive
            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
        }`}>
          {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {Math.abs(change)}%
        </span>
      </div>
      <p className="text-2xl font-bold text-foreground mb-0.5">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
};

const quickActions = [
  { label: "Review Products", to: "/admin/products", icon: Package, color: "text-blue-600" },
  { label: "Manage Vendors", to: "/admin/vendors", icon: Store, color: "text-purple-600" },
  { label: "View Orders", to: "/admin/orders", icon: ShoppingBag, color: "text-green-600" },
  { label: "Create Coupon", to: "/admin/coupons", icon: Tag, color: "text-amber-600" },
  { label: "Generate Gift Card", to: "/admin/gift-cards", icon: Gift, color: "text-pink-600" },
  { label: "Manage Affiliates", to: "/admin/affiliates", icon: Users, color: "text-cyan-600" },
];

const AdminDashboard = () => {
  const stats = mockAdminStats;

  const statCards: StatCardProps[] = [
    {
      label: "Total Revenue",
      value: formatCurrency(stats.totalRevenue),
      change: stats.revenueChange,
      icon: <DollarSign className="h-5 w-5" />,
    },
    {
      label: "Total Orders",
      value: stats.totalOrders.toLocaleString(),
      change: stats.ordersChange,
      icon: <ShoppingBag className="h-5 w-5" />,
    },
    {
      label: "Total Products",
      value: stats.totalProducts.toLocaleString(),
      change: stats.productsChange,
      icon: <Package className="h-5 w-5" />,
      trend: "down",
    },
    {
      label: "Active Vendors",
      value: stats.totalVendors.toString(),
      change: stats.vendorsChange,
      icon: <Store className="h-5 w-5" />,
    },
    {
      label: "Affiliates",
      value: stats.totalAffiliates.toString(),
      change: stats.affiliatesChange,
      icon: <Users className="h-5 w-5" />,
    },
  ];

  return (
    <Layout>
      <div className="container py-6 md:py-10 space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Overview of your marketplace performance</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs gap-1">
              <Clock className="h-3 w-3" />
              Live
            </Badge>
            <span className="text-xs text-muted-foreground">Updated just now</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
          {statCards.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>

        {/* Main content grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Revenue Chart + Recent Orders */}
          <div className="lg:col-span-2 space-y-6">
            {/* Revenue Chart */}
            <div className="bg-card rounded-xl border border-border p-5 md:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <h2 className="font-display text-base font-bold text-foreground">Revenue Overview</h2>
                </div>
                <span className="text-xs text-muted-foreground">Last 6 months</span>
              </div>

              <div className="flex items-end gap-2 md:gap-3 h-40 md:h-48">
                {mockRevenueByMonth.map((month) => {
                  const maxRevenue = Math.max(...mockRevenueByMonth.map((m) => m.revenue));
                  const heightPercent = (month.revenue / maxRevenue) * 100;
                  return (
                    <div key={month.month} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                      <span className="text-[10px] font-medium text-foreground">
                        D{(month.revenue / 1000).toFixed(0)}k
                      </span>
                      <div className="relative w-full max-w-[40px] flex-1 rounded-md bg-primary/10 transition-colors">
                        <div
                          className="absolute bottom-0 w-full rounded-md bg-primary transition-all duration-500 hover:opacity-90"
                          style={{ height: `${heightPercent}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{month.month}</span>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm bg-primary" />
                  <span>Revenue</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm bg-primary/20" />
                  <span>Full capacity</span>
                </div>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
              <div className="flex items-center justify-between p-5 md:p-6 pb-4">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                  <h2 className="font-display text-base font-bold text-foreground">Recent Orders</h2>
                </div>
                <Button asChild variant="ghost" size="sm" className="text-xs gap-1">
                  <Link to="/admin/orders">
                    View All <ChevronRight className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-t border-border bg-secondary/30">
                      <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Order</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Customer</th>
                      <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Total</th>
                      <th className="text-center text-xs font-medium text-muted-foreground px-4 py-3 hidden sm:table-cell">Items</th>
                      <th className="text-center text-xs font-medium text-muted-foreground px-4 py-3">Status</th>
                      <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3 hidden md:table-cell">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {mockRecentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="px-5 py-3.5">
                          <span className="font-mono text-xs font-medium text-foreground">{order.id}</span>
                        </td>
                        <td className="px-4 py-3.5 text-foreground font-medium">{order.customer}</td>
                        <td className="px-4 py-3.5 text-right font-semibold text-foreground">{formatGMD(order.total)}</td>
                        <td className="px-4 py-3.5 text-center text-muted-foreground hidden sm:table-cell">{order.items}</td>
                        <td className="px-4 py-3.5 text-center">
                          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border capitalize ${statusColors[order.status] || "bg-muted text-muted-foreground"}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right text-muted-foreground text-xs hidden md:table-cell">
                          {new Date(order.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {mockRecentOrders.length === 0 && (
                  <div className="text-center py-10 text-sm text-muted-foreground">No recent orders.</div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pending Items */}
            <div className="bg-card rounded-xl border border-border shadow-sm p-5 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  <h2 className="font-display text-base font-bold text-foreground">Pending Review</h2>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {mockPendingItems.length}
                </Badge>
              </div>

              <div className="space-y-3">
                {mockPendingItems.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      item.type === "product"
                        ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                        : "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                    }`}>
                      {item.type === "product" ? <Package className="h-4 w-4" /> : <Store className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.submittedBy} · {item.date}
                      </p>
                    </div>
                    <Button asChild variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                      <Link to={item.type === "product" ? "/admin/products" : "/admin/vendors"}>
                        <Eye className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                ))}
                {mockPendingItems.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No pending items.</p>
                )}
              </div>

              <Separator className="my-4" />

              <Button asChild variant="outline" size="sm" className="w-full text-xs gap-1">
                <Link to="/admin/products">
                  Review All Pending <ArrowUpRight className="h-3 w-3" />
                </Link>
              </Button>
            </div>

            {/* Quick Actions */}
            <div className="bg-card rounded-xl border border-border shadow-sm p-5 md:p-6">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <h2 className="font-display text-base font-bold text-foreground">Quick Actions</h2>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {quickActions.map((action) => (
                  <Link
                    key={action.to}
                    to={action.to}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors group"
                  >
                    <div className={`w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors`}>
                      <action.icon className={`h-4 w-4 ${action.color} group-hover:text-primary transition-colors`} />
                    </div>
                    <span className="text-sm font-medium text-foreground flex-1">{action.label}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </Link>
                ))}
              </div>
            </div>

            {/* System Health */}
            <div className="bg-card rounded-xl border border-border shadow-sm p-5 md:p-6">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="h-5 w-5 text-green-500" />
                <h2 className="font-display text-base font-bold text-foreground">System Health</h2>
              </div>
              <div className="space-y-3 text-sm">
                {[
                  { label: "Database", status: "Operational", color: "text-green-600" },
                  { label: "Storage", status: "Operational", color: "text-green-600" },
                  { label: "Email Service", status: "Operational", color: "text-green-600" },
                  { label: "Payment Gateway", status: "Degraded", color: "text-amber-600" },
                ].map((service) => (
                  <div key={service.label} className="flex items-center justify-between">
                    <span className="text-muted-foreground">{service.label}</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${service.color.replace("text", "bg")}`} />
                      <span className={`text-xs font-medium ${service.color}`}>{service.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
