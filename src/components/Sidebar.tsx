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
  Trophy,
  Key
} from "lucide-react";
import { Logo } from "./Logo";
import { useState, useEffect } from "react";
import type { Plan } from "@/lib/tradeTypes";
import { usePlan } from "@/hooks/usePlan";
import { useAuth } from "@/contexts/AuthContext";
import { useWindowSize } from "@/hooks/useWindowSize";
import { TrialTimer } from "./TrialTimer";

const links = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: PlusCircle, label: "Add Trade", path: "/add-trade" },
  { icon: History, label: "History", path: "/trade-history" },
  { icon: BarChart2, label: "Analytics", path: "/analytics" },
  { icon: Sparkles, label: "AI Coach", path: "/ai-coach" },
  { icon: Shield, label: "Risk", path: "/risk" },
  { icon: Trophy, label: "Challenges", path: "/challenges" },
  { icon: BookOpen, label: "Playbook", path: "/playbook" },
  { icon: Calendar, label: "Calendar", path: "/calendar" },
  { icon: BookOpen, label: "Plans", path: "/plans" },
  { icon: User, label: "Profile", path: "/profile" },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ isOpen, onClose, isCollapsed, onToggleCollapse }: SidebarProps) {
  const navigate = useNavigate();
  const { plan, joinedDate, isTrial } = usePlan();
  const { isAdmin } = useAuth();
  const { width } = useWindowSize();
  const isMobile = width < 1024;

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
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{
          x: isOpen || !isMobile ? 0 : -240,
          width: isCollapsed ? 64 : 240
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`fixed left-0 top-0 h-screen z-50 flex flex-col
          bg-[hsl(var(--sidebar-background))] border-r border-[hsl(var(--sidebar-border))]
          ${isMobile && !isOpen ? "-translate-x-full" : "translate-x-0"}`}
      >
        {/* Logo */}
        <div className="p-4 flex items-center gap-3 border-b border-[hsl(var(--sidebar-border))]">
          <Logo className="w-8 h-8 text-primary shrink-0" />
          {(!isCollapsed || isOpen) && (
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
        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto custom-scrollbar" aria-label="Main Navigation">
          {activeLinks.map((link) => (
            <>
            <RouterNavLink
              key={link.path}
              to={link.path}
              end
              onClick={() => {
                if (isMobile) onClose();
              }}
              aria-label={link.label}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group relative
                ${isActive
                  ? "bg-primary/10 text-primary shadow-[inset_0_0_10px_rgba(var(--primary),0.05)]"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                }`
              }
            >
              {({ isActive }) => (
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <link.icon className={`w-5 h-5 shrink-0 transition-transform duration-300 group-hover:scale-110 ${isActive ? "text-primary text-glow" : ""}`} />
                    {(!isCollapsed || (isMobile && isOpen)) && (
                      <span className={`text-sm font-bold tracking-tight ${isActive ? "text-primary" : ""}`}>{link.label}</span>
                    )}
                  </div>
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute left-[-8px] w-1 h-6 bg-primary rounded-r-full shadow-[0_0_15px_rgba(var(--primary),0.5)]"
                    />
                  )}
                </div>
              )}
            </RouterNavLink>
            {link.label === "Profile" && isTrial && (!isCollapsed || (isMobile && isOpen)) && (
              <TrialTimer joinedDate={joinedDate} isTrial={isTrial} isSidebar />
            )}
          </>
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
            {(!isCollapsed || (isMobile && isOpen)) && (
              <span>
                {plan === "pro" ? "Professional Plan" : 
                 plan === "ultimate" ? "Institutional Plan" : 
                 "Standard Plan"}
              </span>
            )}
          </div>

          <button
            onClick={() => {
              navigate("/plans");
              if (isMobile) onClose();
            }}
            aria-label="Upgrade your plan"
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold
              bg-gradient-to-r from-primary to-cyan-400 text-primary-foreground
              hover:shadow-lg hover:shadow-primary/20 hover:scale-[1.02] transition-all duration-300"
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            {(!isCollapsed || (isMobile && isOpen)) && <span>Upgrade Plan</span>}
          </button>
        </div>

        {/* Collapse (Desktop Only) */}
        <button
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden lg:flex p-3 border-t border-[hsl(var(--sidebar-border))] justify-center
            text-muted-foreground hover:text-foreground transition-colors"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </motion.aside>
    </>
  );
}
