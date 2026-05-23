import Header from "./Header";
import Footer from "./Footer";
import { useReferralTracker } from "@/hooks/useReferralTracker";

const Layout = ({ children }: { children: React.ReactNode }) => {
  useReferralTracker();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
};

export default Layout;
