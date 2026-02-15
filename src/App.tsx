import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar } from "@/components/Sidebar";
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

const AppContent = () => {
  const location = useLocation();
  const publicPages = ["/auth", "/terms", "/privacy"];
  const isPublicPage = publicPages.includes(location.pathname);

  return (
    <div className="flex min-h-screen w-full dark">
      {!isPublicPage && <Sidebar />}
      <main className={`flex-1 ${!isPublicPage ? "ml-16 md:ml-60 p-6 md:p-8" : "p-0"} transition-all duration-300`}>
        <AnimatedRoutes />
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
