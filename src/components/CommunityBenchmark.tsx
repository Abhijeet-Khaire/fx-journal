import React from "react";
import { GlassCard } from "./GlassCard";
import { Users, TrendingUp, Trophy, Target, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

interface CommunityBenchmarkProps {
  userStats: {
    winRate: number;
    consistency: number;
    avgRR: number;
    discipline: number;
  };
}

export function CommunityBenchmark({ userStats }: CommunityBenchmarkProps) {
  // Mock Community Data (Top 10% of Profitable Traders)
  const topTraders = {
    winRate: 68,
    consistency: 82,
    avgRR: 2.4,
    discipline: 91
  };

  const benchmarks = [
    { label: "Win Rate", user: userStats.winRate, community: topTraders.winRate, suffix: "%", icon: <Target className="w-4 h-4" /> },
    { label: "Consistency", user: userStats.consistency, community: topTraders.consistency, suffix: "%", icon: <TrendingUp className="w-4 h-4" /> },
    { label: "Avg RR", user: userStats.avgRR, community: topTraders.avgRR, suffix: ":1", icon: <Trophy className="w-4 h-4" /> },
    { label: "Discipline", user: userStats.discipline, community: topTraders.discipline, suffix: "%", icon: <ShieldCheck className="w-4 h-4" /> }
  ];

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-orange-500/20 text-orange-500">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Community Benchmark</h3>
            <p className="text-xs text-muted-foreground">Compared with Top 10% Profitable Traders</p>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {benchmarks.map((b, i) => {
          const isBeating = b.user >= b.community;
          const userProgress = Math.min(100, Math.max(0, b.user));
          const communityProgress = Math.min(100, Math.max(0, b.community));

          return (
            <div key={b.label} className="space-y-3">
              <div className="flex justify-between items-end">
                <div className="flex items-center gap-2">
                    <div className="text-muted-foreground">{b.icon}</div>
                    <span className="text-sm font-semibold">{b.label}</span>
                </div>
                <div className="flex gap-4 text-xs font-mono">
                    <span className="text-muted-foreground uppercase opacity-50">You: <span className={`font-bold ${isBeating ? 'text-profit' : 'text-loss'}`}>{b.user}{b.suffix}</span></span>
                    <span className="text-primary uppercase opacity-70 font-bold">Top 10%: {b.community}{b.suffix}</span>
                </div>
              </div>

              <div className="relative h-2 w-full bg-white/5 rounded-full overflow-hidden">
                {/* Community Indicator Line */}
                <div 
                  className="absolute top-0 bottom-0 w-0.5 bg-primary z-10 shadow-[0_0_8px_rgba(var(--primary),0.5)]"
                  style={{ left: `${communityProgress}%` }}
                />
                
                {/* User Progress Bar */}
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${userProgress}%` }}
                    className={`h-full ${isBeating ? 'bg-profit' : 'bg-white/20'}`}
                />
              </div>

              {isBeating ? (
                <p className="text-[10px] text-profit font-bold uppercase tracking-widest">🏆 Beating the average</p>
              ) : (
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                    Gap to Top Performer: <span className="text-loss font-bold">{Math.abs(b.community - b.user).toFixed(1)}{b.suffix}</span>
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 pt-6 border-t border-white/5">
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
            <h4 className="text-xs font-bold text-primary uppercase mb-1">Growth Roadmap</h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
                Traders with <span className="text-foreground font-bold">Discipline &gt; 90%</span> are 4.5x more likely to secure funding. 
                Focus on reducing rule violations to close the gap with the top 10%.
            </p>
        </div>
      </div>
    </GlassCard>
  );
}
