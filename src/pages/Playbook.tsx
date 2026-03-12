import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTrades } from "@/hooks/useTrades";
import { usePlan } from "@/hooks/usePlan";
import { generateGoldenPlaybook } from "@/lib/mlEngine";
import { GoldenPlaybook } from "@/components/AICoach/GoldenPlaybook";
import { Brain, Lock, BookOpen, Sparkles, ChevronRight, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { SkeletonCard } from "@/components/SkeletonLoader";
import { MarketReplay } from "@/components/MarketReplay";

export default function PlaybookPage() {
  const navigate = useNavigate();
  const { trades, loading } = useTrades();
  const { plan } = usePlan();
  const isUltimate = plan === "ultimate";

  const playbook = useMemo(() => {
    if (!trades.length || trades.length < 5) return null;
    return generateGoldenPlaybook(trades);
  }, [trades]);

  if (loading) {
    return (
      <div className="space-y-8 max-w-4xl mx-auto">
        <div className="h-40 w-full rounded-[2.5rem] bg-white/5 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <SkeletonCard className="rounded-[2.5rem]" />
          <SkeletonCard className="rounded-[2.5rem]" />
        </div>
      </div>
    );
  }

  if (!isUltimate) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-8 relative">
        <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px]" />
        </div>
        <div className="relative">
            <div className="absolute -inset-4 bg-indigo-500/20 rounded-full blur-xl animate-pulse" />
            <div className="relative p-6 bg-white/5 rounded-full border border-white/10 backdrop-blur-xl">
                <Lock className="w-16 h-16 text-indigo-500" />
            </div>
        </div>
        <div className="space-y-3 relative z-10">
            <h2 className="text-4xl font-black uppercase tracking-tighter italic">Access Restricted</h2>
            <p className="text-muted-foreground max-w-md mx-auto font-medium">
                The <span className="text-indigo-400 font-bold">Strategy Playbook</span> is exclusive to the Institutional Plan. 
                Upgrade now to unlock advanced strategy synthesis and automated behavior rules.
            </p>
        </div>
        <button 
            onClick={() => navigate("/plans")}
            className="relative group px-10 py-4 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl font-black text-xs uppercase tracking-[0.2em] text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all shadow-[0_0_40px_rgba(79,70,229,0.2)]"
        >
            Elevate to Institutional
            <div className="absolute -right-2 -top-2 w-4 h-4 bg-indigo-500 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>
    );
  }

  if (!playbook || trades.length < 5) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-6 relative">
          <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
          </div>
          <div className="relative">
            <div className="absolute -inset-4 bg-primary/20 rounded-full blur-xl animate-pulse" />
            <div className="relative p-6 bg-white/5 rounded-full border border-white/10 backdrop-blur-xl">
                <BookOpen className="w-16 h-16 text-primary" />
            </div>
          </div>
          <div className="space-y-2 relative z-10">
            <h2 className="text-3xl font-black tracking-tighter uppercase italic">Strategy Synthesis in Progress</h2>
            <p className="text-muted-foreground max-w-md mx-auto font-medium">
                AI is compiling your <span className="text-primary font-bold italic">Primary Strategy</span>. 
                Keep journaling to reach the <span className="text-primary font-bold">5-10 trade baseline</span> for synthesis.
            </p>
          </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-24 relative">
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4"
        >
            <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                    <div className="px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                        <span className="text-[8px] font-black tracking-[0.3em] uppercase text-primary">Strategy Synthesis Active</span>
                    </div>
                </div>
                <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic">
                    AI <span className="text-primary not-italic">Strategy Hub</span>
                </h1>
                <p className="text-muted-foreground font-medium text-lg leading-relaxed max-w-xl">
                    Dynamic strategy framework synthesized from your highest-performing trading patterns.
                </p>
            </div>
            
            <div className="flex items-center gap-4 py-2 px-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
                <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Last Optimization</p>
                    <p className="text-sm font-bold text-white tracking-tight">Today, 14:22 UTC</p>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <div className="p-2 rounded-xl bg-primary/20 text-primary">
                    <Sparkles className="w-5 h-5" />
                </div>
            </div>
        </motion.div>

        <GoldenPlaybook playbook={playbook} />

        <div className="pt-16 space-y-10 px-4">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-3">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20">
                            <span className="text-[8px] font-black tracking-[0.3em] uppercase text-primary">Trade Simulation Engine</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[8px] font-black text-profit uppercase tracking-widest animate-pulse">
                            <span className="w-1.5 h-1.5 bg-profit rounded-full shadow-profit" />
                            Online
                        </div>
                    </div>
                    <h2 className="text-4xl font-black uppercase tracking-tighter italic flex items-center gap-4">
                        Practice Your <span className="text-primary not-italic ml-2">Edge</span>
                    </h2>
                    <p className="text-muted-foreground font-medium text-base leading-relaxed max-w-xl">
                        Relive past trades candlestick by candlestick. Practice entries and exits with zero capital risk, powered by your historical trade data.
                    </p>
                </div>

                <div className="flex items-center gap-4 py-3 px-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shrink-0">
                    <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Replay System</p>
                        <p className="text-sm font-bold text-white tracking-tight">v4.0 — Live</p>
                    </div>
                    <div className="h-8 w-px bg-white/10" />
                    <div className="p-2.5 rounded-xl bg-primary/20 text-primary shadow-glow">
                        <Zap className="w-5 h-5" />
                    </div>
                </div>
            </div>
            
            <div className="h-px w-full bg-gradient-to-r from-primary/30 via-primary/10 to-transparent" />
            
            <MarketReplay trades={trades} />
        </div>
    </div>
  );
}
