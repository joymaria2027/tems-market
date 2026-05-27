import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import CartSidebar from "@/components/CartSidebar";

import Index from "./pages/Index";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import Orders from "./pages/Orders";
import Account from "./pages/Account";
import BecomeVendor from "./pages/BecomeVendor";
import ApplyAsVendor from "./pages/ApplyAsVendor";
import VendorInvite from "./pages/VendorInvite";
import SuperAdminDashboard from "./pages/superadmin/SuperAdminDashboard";
import VendorDashboard from "./pages/vendor/VendorDashboard";
import VendorProducts from "./pages/vendor/VendorProducts";
import VendorUpload from "./pages/vendor/VendorUpload";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminGiftCards from "./pages/admin/AdminGiftCards";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AdminPlaceholder from "./pages/admin/AdminPlaceholder";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminAffiliates from "./pages/admin/AdminAffiliates";
import AdminVendors from "./pages/admin/AdminVendors";
import AdminApplicationReview from "./pages/admin/AdminApplicationReview";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminGuard from "./components/AdminGuard";
import SuperAdminGuard from "./components/SuperAdminGuard";
import AdminLogin from "./pages/admin/AdminLogin";
import Affiliate from "./pages/Affiliate";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import UpdatePassword from "./pages/UpdatePassword";
import Signup from "./pages/Signup";
import SelectRole from "./pages/SelectRole";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
          <CartSidebar />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:slug" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/orders/confirmation" element={<OrderConfirmation />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/account" element={<Account />} />
            <Route path="/become-a-vendor" element={<BecomeVendor />} />
            <Route path="/apply-as-vendor" element={<ApplyAsVendor />} />
            <Route path="/vendor-invite/:token" element={<VendorInvite />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/update-password" element={<UpdatePassword />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/select-role" element={<SelectRole />} />
            <Route path="/vendor/dashboard" element={<VendorDashboard />} />
            <Route path="/vendor/products" element={<VendorProducts />} />
            <Route path="/vendor/upload" element={<VendorUpload />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminGuard><AdminDashboard /></AdminGuard>} />
            <Route path="/admin/products" element={<AdminGuard><AdminProducts /></AdminGuard>} />
            <Route path="/admin/gift-cards" element={<AdminGuard><AdminGiftCards /></AdminGuard>} />
            <Route path="/admin/coupons" element={<AdminGuard><AdminCoupons /></AdminGuard>} />
            <Route path="/admin/users" element={<AdminGuard><AdminUsers /></AdminGuard>} />
            <Route path="/admin/orders" element={<AdminGuard><AdminOrders /></AdminGuard>} />
            <Route path="/admin/vendors" element={<AdminGuard><AdminVendors /></AdminGuard>} />
            <Route path="/admin/vendors/review/:applicationId" element={<AdminGuard><AdminApplicationReview /></AdminGuard>} />
            <Route path="/admin/notifications" element={<AdminGuard><AdminNotifications /></AdminGuard>} />
            <Route path="/admin/affiliates" element={<AdminGuard><AdminAffiliates /></AdminGuard>} />
            <Route path="/superadmin" element={<SuperAdminGuard><SuperAdminDashboard /></SuperAdminGuard>} />
            <Route path="/affiliate" element={<Affiliate />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
