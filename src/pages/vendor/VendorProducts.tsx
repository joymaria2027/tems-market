import { Link } from "react-router-dom";
import { Package, Plus } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";

const VendorProducts = () => (
  <Layout>
    <div className="container max-w-lg py-16 text-center space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto">
        <Package className="h-8 w-8 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <h1 className="font-display text-2xl font-bold text-foreground">
          My Products
        </h1>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto">
          Manage your listed products here. Use the dashboard to upload,
          edit, and track your inventory.
        </p>
      </div>
      <Button asChild className="gap-2">
        <Link to="/vendor/upload">
          <Plus className="h-4 w-4" />
          Upload New Product
        </Link>
      </Button>
    </div>
  </Layout>
);

export default VendorProducts;
