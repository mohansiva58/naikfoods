import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import logo from "@/assets/logo.png";
import { ContactPage, PrivacyPolicyPage, RefundPolicyPage, TermsPage } from "./pages/PolicyPage";
import { preloadCheckoutPage } from "./lib/preloadRoutes";

// Lazy-loaded routes for better bundle splitting
const ShopPage = lazy(() => import("./pages/ShopPage"));
const ProductDetailPage = lazy(() => import("./pages/ProductDetailPage"));
const CartPage = lazy(() => import("./pages/CartPage"));
const CheckoutPage = lazy(preloadCheckoutPage);
const AdminPage = lazy(() => import("./pages/AdminPage"));
const OrdersPage = lazy(() => import("./pages/OrdersPage"));
const AboutPage = lazy(() => import("./pages/Aboutpage"));
const WishlistPage = lazy(() => import("./pages/WishlistPage"));
const ProcessingPage = lazy(() => import("./pages/ProcessingPage"));
const OrderSuccessPage = lazy(() => import("./pages/OrderSuccessPage"));
const PaymentFailedPage = lazy(() => import("./pages/PaymentFailedPage"));
const DevelopedBySybaritesPage = lazy(() => import("./pages/DevelopedBySybaritesPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
import { WhatsAppButton } from "./components/WhatsAppButton";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { CartServerSync } from "./components/CartServerSync";
import { PaymentOrderRecovery } from "./components/PaymentOrderRecovery";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartServerSync />
      <TooltipProvider>
        <Sonner />
        <BrowserRouter>
          <PaymentOrderRecovery />
          <Suspense 
            fallback={
              <div className="flex h-screen w-screen items-center justify-center bg-white">
                <img src={logo} alt="Loading..." className="h-12 w-auto animate-pulse" />
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/shop" element={<ShopPage />} />
              <Route path="/product/:id" element={<ProductDetailPage />} />
              <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
              <Route path="/wishlist" element={<WishlistPage />} />
              <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
              <Route path="/processing" element={<ProcessingPage />} />
              <Route path="/order-success" element={<OrderSuccessPage />} />
              <Route path="/payment-failed" element={<PaymentFailedPage />} />
              <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
              <Route path="/terms-and-conditions" element={<TermsPage />} />
              <Route path="/refund-return-policy" element={<RefundPolicyPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/developedby-sybarites" element={<DevelopedBySybaritesPage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <WhatsAppButton />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
