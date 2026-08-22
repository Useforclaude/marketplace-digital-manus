import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/_core/hooks/useAuth";
import NotFound from "@/pages/NotFound";
import { Redirect, Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { CartProvider } from "./contexts/CartContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Library from "./pages/Library";
import MemberDashboard from "./pages/MemberDashboard";
import Reader from "./pages/Reader";
import Admin from "./pages/Admin";

function AdminRoute() {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return <div className="grid min-h-screen place-items-center bg-[#0a0b0d] text-sm text-white/50">กำลังตรวจสอบสิทธิ์…</div>;
  if (!isAuthenticated) return <Redirect to="/" />;
  if (user?.role !== "admin") return <Redirect to="/dashboard" />;
  return <Admin />;
}

function MemberRoute() {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return <div className="grid min-h-screen place-items-center bg-[#0a0b0d] text-sm text-white/50">กำลังตรวจสอบสิทธิ์…</div>;
  if (!isAuthenticated) return <Redirect to="/" />;
  if (user?.role === "admin") return <Redirect to="/admin" />;
  return <MemberDashboard />;
}

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/library"} component={MemberRoute} />
      <Route path={"/dashboard"} component={MemberRoute} />
      <Route path={"/read/:productId"} component={Reader} />
      <Route path={"/admin"} component={AdminRoute} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <CartProvider>
            <Router />
          </CartProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
