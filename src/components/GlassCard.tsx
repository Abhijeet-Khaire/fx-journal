import { ReactNode } from "react";
import { motion } from "framer-motion";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  onClick?: () => void;
}

export function GlassCard({ children, className = "", hover = true, glow = false, onClick }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`${hover ? "glass-hover" : "glass"} ${glow ? "animate-glow-pulse" : ""} p-6 ${className}`}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}
