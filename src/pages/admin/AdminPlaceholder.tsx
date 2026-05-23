import { useLocation } from "react-router-dom";
import Layout from "@/components/layout/Layout";

const AdminPlaceholder = () => {
  const { pathname } = useLocation();
  const section = pathname.split("/").pop() || "section";

  return (
    <Layout>
      <div className="container py-16 text-center">
        <h1 className="font-display text-3xl font-bold text-foreground mb-2 capitalize">Admin: {section}</h1>
        <p className="text-muted-foreground">This section will be built with database integration.</p>
      </div>
    </Layout>
  );
};

export default AdminPlaceholder;
