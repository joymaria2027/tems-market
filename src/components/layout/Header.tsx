import { Link } from "react-router-dom";
import { ShoppingCart, User, Search, Menu, X, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import CurrencySelector from "@/components/CurrencySelector";

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const { openCart, itemCount } = useCart();

  return (
    <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md shadow-nav border-b border-border">
      <div className="container flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="font-bold text-primary-foreground text-sm">T</span>
          </div>
          <span className="font-display text-xl font-bold text-foreground">Tems Market</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link to="/shop" className="text-muted-foreground hover:text-foreground transition-colors">Shop</Link>
          {user && <Link to="/orders" className="text-muted-foreground hover:text-foreground transition-colors">Orders</Link>}
          {profile?.role === "superadmin" ? (
            <Link to="/superadmin" className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors font-semibold">
              Super Admin
            </Link>
          ) : profile?.role === "admin" ? (
            <Link to="/admin/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">Admin Dashboard</Link>
          ) : profile?.role === "vendor" ? (
            <Link to="/vendor/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">Vendor Dashboard</Link>
          ) : (
            <Link to="/become-a-vendor" className="text-muted-foreground hover:text-foreground transition-colors">Sell on Tems Market</Link>
          )}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <CurrencySelector />
          <Button variant="ghost" size="icon" aria-label="Search">
            <Search className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Cart" className="relative" onClick={openCart}>
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Button>
          {user ? (
            <>
              <Link to="/account">
                <Button variant="ghost" size="icon" aria-label="Account">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
              <Button variant="ghost" size="icon" aria-label="Sign out" onClick={signOut}>
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <Link to="/login">
              <Button variant="default" size="sm" className="font-semibold">Sign in</Button>
            </Link>
          )}
        </div>

        {/* Mobile toggle */}
        <div className="flex md:hidden items-center gap-2">
          <Button variant="ghost" size="icon" className="relative" onClick={openCart}>
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-card px-4 pb-4 pt-2 space-y-2 animate-fade-in-up">
          <Link to="/shop" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium text-muted-foreground hover:text-foreground">Shop</Link>
          {user && <Link to="/orders" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium text-muted-foreground hover:text-foreground">Orders</Link>}
          {profile?.role === "superadmin" ? (
            <Link to="/superadmin" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium text-purple-600 dark:text-purple-400">Super Admin</Link>
          ) : profile?.role === "admin" ? (
            <Link to="/admin/dashboard" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium text-muted-foreground hover:text-foreground">Admin Dashboard</Link>
          ) : profile?.role === "vendor" ? (
            <Link to="/vendor/dashboard" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium text-muted-foreground hover:text-foreground">Vendor Dashboard</Link>
          ) : (
            <Link to="/become-a-vendor" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium text-muted-foreground hover:text-foreground">Sell on Tems Market</Link>
          )}
          {user ? (
            <>
              <Link to="/account" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium text-muted-foreground hover:text-foreground">Account</Link>
              <button onClick={() => { signOut(); setMobileOpen(false); }} className="block py-2 text-sm font-medium text-destructive">Sign out</button>
            </>
          ) : (
            <Link to="/login" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium text-primary">Sign in</Link>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
