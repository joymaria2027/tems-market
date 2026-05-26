import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="border-t border-border bg-card mt-16">
    <div className="container py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
      <div>
        <h4 className="font-display text-base font-semibold mb-3 text-foreground">Tems Market</h4>
        <p className="text-muted-foreground leading-relaxed">Your local marketplace for The Gambia. Shop trusted vendors, sell your products.</p>
      </div>
      <div>
        <h5 className="font-semibold mb-3 text-foreground">Shop</h5>
        <ul className="space-y-2 text-muted-foreground">
          <li><Link to="/shop" className="hover:text-foreground transition-colors">Browse All</Link></li>
          <li><Link to="/orders" className="hover:text-foreground transition-colors">My Orders</Link></li>
          <li><Link to="/cart" className="hover:text-foreground transition-colors">Cart</Link></li>
        </ul>
      </div>
      <div>
        <h5 className="font-semibold mb-3 text-foreground">Vendors</h5>
        <ul className="space-y-2 text-muted-foreground">
          <li><Link to="/become-a-vendor" className="hover:text-foreground transition-colors">Become a Vendor</Link></li>
          <li><Link to="/vendor/dashboard" className="hover:text-foreground transition-colors">Vendor Dashboard</Link></li>
        </ul>
      </div>
      <div>
        <h5 className="font-semibold mb-3 text-foreground">Legal</h5>
        <ul className="space-y-2 text-muted-foreground">
          <li><Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
          <li><Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
        </ul>
      </div>
    </div>
    <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
      © {new Date().getFullYear()} Tems Market. All rights reserved.
    </div>
  </footer>
);

export default Footer;

