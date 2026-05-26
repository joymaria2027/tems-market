import { useLocation } from "react-router-dom";
import { Construction } from "lucide-react";
import Layout from "@/components/layout/Layout";

const AdminPlaceholder = () => {
  const { pathname } = useLocation();
  const section = pathname.split("/").pop() || "section";

  return (
    <Layout>
      <div className="container max-w-lg py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto">
          <Construction className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h1 className="font-display text-2xl font-bold text-foreground capitalize">
            Admin: {section}
          </h1>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            This section will be built with database integration. Check back
            soon for the full management dashboard.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default AdminPlaceholder;
