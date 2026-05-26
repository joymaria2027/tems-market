import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Home, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md text-center space-y-6">
        {/* Logo */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 justify-center"
        >
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <span className="font-bold text-primary-foreground text-lg">
              T
            </span>
          </div>
          <span className="font-display text-2xl font-bold text-foreground">
            Tems Market
          </span>
        </Link>

        <div className="bg-card rounded-2xl border border-border shadow-sm p-8 md:p-10 space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>

          <div className="space-y-2">
            <h1 className="font-display text-5xl font-extrabold text-foreground">
              404
            </h1>
            <p className="text-muted-foreground">Page not found</p>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>

          <Button asChild className="w-full gap-2" size="lg">
            <Link to="/">
              <Home className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
