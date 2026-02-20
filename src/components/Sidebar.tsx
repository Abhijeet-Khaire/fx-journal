import { NavLink as RouterNavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  PlusCircle,
  History,
  TrendingUp,
  BarChart2,
  Shield,
  ChevronLeft,
  ChevronRight,
  Crown,
  Calendar,
  User,
  Sparkles,
  BookOpen,
  Key
} from "lucide-react";
import { Logo } from "./Logo";
import { useState } from "react";
import type { Plan } from "@/lib/tradeTypes";
import { usePlan } from "@/hooks/usePlan";
import { useAuth } from "@/contexts/AuthContext";

const links = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: PlusCircle, label: "Add Trade", path: "/add-trade" },
  { icon: History, label: "History", path: "/trade-history" },
  { icon: BarChart2, label: "Analytics", path: "/analytics" },
  { icon: Shield, label: "Risk", path: "/risk" },
  { icon: BookOpen, label: "Playbook", path: "/playbook" },
  { icon: Calendar, label: "Calendar", path: "/calendar" },
  { icon: BookOpen, label: "Plans", path: "/plans" },
  { icon: User, label: "Profile", path: "/profile" },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const { plan } = usePlan();
  const { isAdmin } = useAuth();

  const activeLinks = [
    ...links,
    ...(isAdmin ? [{ icon: Key, label: "Admin", path: "/admin" }] : [])
  ];

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{
          x: isOpen ? 0 : (typeof window !== 'undefined' && window.innerWidth < 1024 ? -240 : 0),
          width: collapsed ? 64 : 240
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`fixed left-0 top-0 h-screen z-50 flex flex-col
          bg-[hsl(var(--sidebar-background))] border-r border-[hsl(var(--sidebar-border))]
          lg:translate-x-0 ${!isOpen && "max-lg:-translate-x-full"}`}
      >
        {/* Logo */}
        <div className="p-4 flex items-center gap-3 border-b border-[hsl(var(--sidebar-border))]">
          <Logo className="w-8 h-8 text-cyan-400 shrink-0" />
          {(!collapsed || isOpen) && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-bold text-foreground text-lg tracking-tight"
            >
              FX Journal
            </motion.span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {activeLinks.map((link) => (
            <RouterNavLink
              key={link.path}
              to={link.path}
              end
              onClick={() => {
                if (window.innerWidth < 1024) onClose();
              }}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative
                ${isActive
                  ? "bg-[hsl(var(--sidebar-accent))] text-primary"
                  : "text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))] hover:text-foreground"
                }`
              }
            >
              {({ isActive }) => (
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <link.icon className={`w-5 h-5 shrink-0 ${isActive ? "text-primary" : ""}`} />
                    {(!collapsed || (typeof window !== 'undefined' && window.innerWidth < 1024 && isOpen)) && (
                      <span className="text-sm font-medium">{link.label}</span>
                    )}
                  </div>
                  {(!collapsed || (typeof window !== 'undefined' && window.innerWidth < 1024 && isOpen)) && link.label === "Playbook" && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/20 text-primary uppercase tracking-wider">
                      Soon
                    </span>
                  )}
                  {/* Active Indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute left-0 w-0.5 h-6 bg-primary rounded-r"
                    />
                  )}
                </div>
              )}
            </RouterNavLink>
          ))}
        </nav>

        {/* Plan & Upgrade */}
        <div className="p-3 border-t border-[hsl(var(--sidebar-border))] space-y-2">
          <div
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-default
              ${plan === "pro"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
          >
            <Crown className={`w-4 h-4 shrink-0 ${plan === "pro" ? "text-primary" : ""}`} />
            {(!collapsed || (typeof window !== 'undefined' && window.innerWidth < 1024 && isOpen)) && (
              <span>{plan === "pro" ? "Pro Plan" : "Free Plan"}</span>
            )}
          </div>

          <button
            onClick={() => {
              navigate("/plans");
              if (window.innerWidth < 1024) onClose();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold
              bg-gradient-to-r from-primary to-cyan-400 text-primary-foreground
              hover:shadow-lg hover:shadow-primary/20 hover:scale-[1.02] transition-all duration-300"
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            {(!collapsed || (typeof window !== 'undefined' && window.innerWidth < 1024 && isOpen)) && <span>Upgrade</span>}
          </button>
        </div>

        {/* Collapse (Desktop Only) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex p-3 border-t border-[hsl(var(--sidebar-border))] justify-center
            text-muted-foreground hover:text-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </motion.aside>
    </>
  );
}
