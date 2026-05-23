import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ShoppingBag, Store, Users } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

const SelectRole = () => {
  const { updateRole } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<"customer" | "vendor" | "affiliate" | null>(null);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      await updateRole(selected);
      toast.success(
        selected === "vendor"
          ? "Welcome, vendor! Account pending approval."
          : selected === "affiliate"
          ? "Welcome, affiliate partner!"
          : "Happy shopping!"
      );
      if (selected === "vendor") {
        navigate("/vendor/dashboard");
      } else if (selected === "affiliate") {
        navigate("/affiliate/dashboard");
      } else {
        navigate("/");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update role");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-2xl space-y-8 text-center bg-card p-8 rounded-2xl border border-border shadow-sm">
        <div>
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4">
            <span className="font-bold text-primary-foreground text-xl">T</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground">How will you use Tems Market?</h1>
          <p className="text-muted-foreground mt-2">Choose the role that fits your goals</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Customer */}
          <button
            onClick={() => setSelected("customer")}
            className={`group relative p-6 rounded-2xl border-2 transition-all duration-200 text-left flex flex-col justify-between
              ${selected === "customer"
                ? "border-primary bg-primary/5 shadow-lg"
                : "border-border bg-card hover:border-primary/40 hover:shadow-md"
              }`}
          >
            <div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors
                ${selected === "customer" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
                <ShoppingBag className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-bold text-foreground mb-1">Shop</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Browse products, discover deals, and buy from local Gambian vendors.
              </p>
            </div>
            {selected === "customer" && (
              <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>

          {/* Affiliate */}
          <button
            onClick={() => setSelected("affiliate")}
            className={`group relative p-6 rounded-2xl border-2 transition-all duration-200 text-left flex flex-col justify-between
              ${selected === "affiliate"
                ? "border-primary bg-primary/5 shadow-lg"
                : "border-border bg-card hover:border-primary/40 hover:shadow-md"
              }`}
          >
            <div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors
                ${selected === "affiliate" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
                <Users className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-bold text-foreground mb-1">Affiliate</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Promote vendor products, share affiliate links, and earn commission payouts.
              </p>
            </div>
            {selected === "affiliate" && (
              <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>

          {/* Vendor */}
          <button
            onClick={() => setSelected("vendor")}
            className={`group relative p-6 rounded-2xl border-2 transition-all duration-200 text-left flex flex-col justify-between
              ${selected === "vendor"
                ? "border-primary bg-primary/5 shadow-lg"
                : "border-border bg-card hover:border-primary/40 hover:shadow-md"
              }`}
          >
            <div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors
                ${selected === "vendor" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
                <Store className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-bold text-foreground mb-1">Sell</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                List products, manage inventory, control margins, and fulfill customer orders.
              </p>
            </div>
            {selected === "vendor" && (
              <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>
        </div>

        <button
          onClick={handleContinue}
          disabled={!selected || loading}
          className={`w-full h-12 rounded-xl font-semibold text-sm transition-all
            ${selected
              ? "bg-primary text-primary-foreground hover:opacity-90 cursor-pointer"
              : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
        >
          {loading ? "Saving…" : "Continue"}
        </button>
      </div>
    </div>
  );
};

export default SelectRole;
