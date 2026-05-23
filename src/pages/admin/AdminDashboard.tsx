import Layout from "@/components/layout/Layout";
import { Link } from "react-router-dom";

const adminLinks = [
  { to: "/admin/products", label: "Products" },
  { to: "/admin/vendors", label: "Vendors" },
  { to: "/admin/users", label: "Users" },
  { to: "/admin/orders", label: "Orders" },
  { to: "/admin/gift-cards", label: "Gift Cards" },
  { to: "/admin/coupons", label: "Coupons" },
  { to: "/admin/affiliates", label: "Affiliates" },
];

const AdminDashboard = () => (
  <Layout>
    <div className="container py-10">
      <h1 className="font-display text-3xl font-bold text-foreground mb-6">Admin Panel</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {adminLinks.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className="rounded-lg border border-border bg-card p-6 shadow-card hover:shadow-card-hover transition-all text-center"
          >
            <span className="font-semibold text-foreground">{l.label}</span>
          </Link>
        ))}
      </div>
    </div>
  </Layout>
);

export default AdminDashboard;
