import React from "react";
import { GlassCard } from "@/components/GlassCard";
import { TradeCluster } from "@/lib/mlEngine";
import { TrendingUp, TrendingDown, Target } from "lucide-react";

interface BehaviorPatternsProps {
  clusters: TradeCluster[];
}

export function BehaviorPatterns({ clusters }: BehaviorPatternsProps) {
  if (!clusters.length) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        Insufficient data to detect behavioral clusters.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Target className="w-5 h-5 text-primary" />
        Identified Setups
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {clusters.map((cluster) => (
          <GlassCard key={cluster.id} className="p-4 border-white/5 bg-white/[0.02]">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-bold text-foreground">{cluster.name.split('-')[0]}</h4>
                <p className="text-xs text-muted-foreground uppercase tracking-widest">
                  {cluster.name.split('-')[1]} Session
                </p>
              </div>
              <div className={`px-2 py-1 rounded text-[10px] font-bold ${cluster.winRate > 50 ? 'bg-profit/10 text-profit' : 'bg-loss/10 text-loss'}`}>
                {cluster.winRate}% WR
              </div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-muted-foreground">Avg. Profit</span>
              <span className={`text-sm font-mono font-bold ${cluster.avgProfit > 0 ? 'text-profit' : 'text-loss'}`}>
                {cluster.avgProfit > 0 ? '+' : ''}${Math.round(cluster.avgProfit)}
              </span>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
