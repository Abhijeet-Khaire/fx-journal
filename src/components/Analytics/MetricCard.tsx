import React from "react";
import { GlassCard } from "@/components/GlassCard";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  subValue?: string;
  glow?: boolean;
  trend?: "up" | "down" | "neutral";
}

export function MetricCard({ label, value, icon: Icon, subValue, glow, trend }: MetricCardProps) {
  const trendColor = trend === "up" ? "text-profit" : trend === "down" ? "text-loss" : "text-muted-foreground";
  
  return (
    <GlassCard className="p-4 flex items-center justify-between" glow={glow}>
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl font-bold font-mono ${trendColor}`}>
            {value}
          </span>
          {subValue && <span className="text-[10px] text-muted-foreground font-medium">{subValue}</span>}
        </div>
      </div>
      <div className={`p-3 rounded-full bg-primary/10 text-primary`}>
        <Icon className="w-5 h-5" />
      </div>
    </GlassCard>
  );
}
