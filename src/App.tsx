import { useState } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ScrollToTop } from "@/components/ScrollToTop";
import Index from "./pages/Index";
import AddTrade from "./pages/AddTrade";
import TradeHistory from "./pages/TradeHistory";
import CalendarPage from "./pages/Calendar";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import Plans from "./pages/Plans";
import Payment from "./pages/Payment";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Analytics from "./pages/Analytics";
import Risk from "./pages/Risk";
import ChallengeTracker from "./pages/ChallengeTracker";
import Playbook from "./pages/Playbook";
import AICoach from "./pages/AICoach";
import AdminDashboard from "./pages/AdminDashboard";
import AdminTraderView from "./pages/AdminTraderView";
import { AdminRoute } from "@/components/AdminRoute";


import { ThemeSettingsProvider, useThemeSettings } from "@/contexts/ThemeSettingsContext";

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
          <Route path="/challenges" element={<ProtectedRoute><ChallengeTracker /></ProtectedRoute>} />
          <Route path="/ai-coach" element={<ProtectedRoute><AICoach /></ProtectedRoute>} />
          <Route path="/playbook" element={<ProtectedRoute><Playbook /></ProtectedRoute>} />
          <Route path="/plans" element={<ProtectedRoute><Plans /></ProtectedRoute>} />
          <Route path="/payment" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/trader/:uid" element={<AdminRoute><AdminTraderView /></AdminRoute>} />
          
          {/* Fallback route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

const AppContent = () => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
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
    if (path === "/challenges") return "Challenge Tracker";
    if (path === "/ai-coach") return "AI Coach";
    if (path === "/payment") return "Secure Checkout";
  };

  const excludedPaths = ["/analytics", "/add-trade", "/payment"];
  const isExcluded = excludedPaths.includes(location.pathname) || location.pathname.startsWith("/edit-trade");

  const { theme } = useThemeSettings();

  return (
    <div className={`flex min-h-screen w-full ${theme} bg-background relative overflow-hidden`}>
      {/* Premium Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute top-[20%] right-[10%] w-[20%] h-[20%] rounded-full bg-indigo-500/5 blur-[100px]" />
      </div>

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
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />
        </>
      )}
      <main className={`flex-1 transition-all duration-300 w-full relative z-10
        ${!isPublicPage
          ? `${isSidebarCollapsed ? "lg:ml-16" : "lg:ml-20 xl:ml-60"} pt-20 pb-10 px-4 md:px-8 lg:pt-8`
          : "p-0"}
        ${!isExcluded ? "font-dense" : ""}`}
      >
        <div className="max-w-7xl mx-auto">
          <AnimatedRoutes />
        </div>
      </main>
    </div>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeSettingsProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>

            <ScrollToTop />
            <AppContent />
          </BrowserRouter>
        </TooltipProvider>
      </ThemeSettingsProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
