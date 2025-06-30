import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import { useEffect } from 'react';
import { useLocation } from 'wouter';

// Pages
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import About from "./pages/About";
import Contact from "./pages/Contact";
import CheckoutPage from "./pages/CheckoutPage";
import OrdersPage from "./pages/OrdersPage";
import NotFound from "./pages/not-found";

// Auth wrapper component
const AuthWrapper = ({ children }: { children: React.ReactNode }) => {
  const { loading, user } = useAuth();
  const [location, navigate] = useLocation();

  // Redirect to login if not authenticated and trying to access protected route
  useEffect(() => {
    const protectedRoutes = ['/checkout', '/orders', '/profile'];
    if (!loading && !user && protectedRoutes.some(route => location.startsWith(route))) {
      navigate(`/login?redirect=${encodeURIComponent(location)}`);
    }
  }, [loading, user, location, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }


  return <>{children}</>;
};

function Router() {
  return (
    <AuthWrapper>
      <Layout>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/products" component={Products} />
          <Route path="/product/:id" component={ProductDetail} />
          <Route path="/about" component={About} />
          <Route path="/contact" component={Contact} />
          
          {/* Protected Routes */}
          <Route path="/checkout">
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          </Route>
          
          <Route path="/orders">
            <ProtectedRoute>
              <OrdersPage />
            </ProtectedRoute>
          </Route>
          
          <Route path="/profile">
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          </Route>
          
          <Route path="/admin">
            <ProtectedRoute roles={['admin', 'super_admin']}>
              <Admin />
            </ProtectedRoute>
          </Route>
          
          <Route component={NotFound} />
        </Switch>
      </Layout>
    </AuthWrapper>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
