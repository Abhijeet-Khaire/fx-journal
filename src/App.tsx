import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import AddTrade from "./pages/AddTrade";
import TradeHistory from "./pages/TradeHistory";
import CalendarPage from "./pages/Calendar";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import Plans from "./pages/Plans";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Analytics from "./pages/Analytics";
import Risk from "./pages/Risk";
import Playbook from "./pages/Playbook";
import AdminDashboard from "./pages/AdminDashboard";
import AdminTraderView from "./pages/AdminTraderView";
import { AdminRoute } from "@/components/AdminRoute";

const queryClient = new QueryClient();

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.25 }}
      >
        <Routes location={location}>
          <Route path="/auth" element={<Auth />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
          <Route path="/add-trade" element={<ProtectedRoute><AddTrade /></ProtectedRoute>} />
          <Route path="/edit-trade/:id" element={<ProtectedRoute><AddTrade /></ProtectedRoute>} />
          <Route path="/trade-history" element={<ProtectedRoute><TradeHistory /></ProtectedRoute>} />
          <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="/risk" element={<ProtectedRoute><Risk /></ProtectedRoute>} />
          <Route path="/playbook" element={<ProtectedRoute><Playbook /></ProtectedRoute>} />
          <Route path="/plans" element={<ProtectedRoute><Plans /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/trader/:uid" element={<AdminRoute><AdminTraderView /></AdminRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

const AppContent = () => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const publicPages = ["/auth", "/terms", "/privacy"];
  const isPublicPage = publicPages.includes(location.pathname);

  // Map paths to titles for the mobile header
  const getPageTitle = (path: string) => {
    if (path === "/") return "Dashboard";
    if (path === "/add-trade") return "Add Trade";
    if (path.startsWith("/edit-trade")) return "Edit Trade";
    if (path === "/trade-history") return "History";
    if (path === "/calendar") return "Calendar";
    if (path === "/analytics") return "Analytics";
    if (path === "/risk") return "Risk";
    if (path === "/playbook") return "Playbook";
    if (path === "/plans") return "Plans";
    if (path === "/profile") return "Profile";
    if (path === "/admin") return "Admin Dashboard";
    if (path.startsWith("/admin/trader")) return "Trader Details";
    return "";
  };

  return (
    <div className="flex min-h-screen w-full dark bg-background">
      {!isPublicPage && (
        <>
          <Header
            onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
            isOpen={isSidebarOpen}
            pageTitle={getPageTitle(location.pathname)}
          />
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />
        </>
      )}
      <main className={`flex-1 transition-all duration-300 w-full
        ${!isPublicPage
          ? "lg:ml-20 xl:ml-60 pt-20 pb-10 px-4 md:px-8 lg:pt-8"
          : "p-0"}`}
      >
        <div className="max-w-7xl mx-auto">
          <AnimatedRoutes />
        </div>
      </main>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
