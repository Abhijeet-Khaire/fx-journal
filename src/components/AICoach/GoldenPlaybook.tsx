import React from "react";
import { GlassCard } from "../GlassCard";
import { GoldenPlaybook as GoldenPlaybookType } from "@/lib/mlEngine";
import { Star, ShieldCheck, Zap, Brain, TrendingUp, Calendar, ChevronRight, Activity, Target } from "lucide-react";
import { motion } from "framer-motion";

interface GoldenPlaybookProps {
  playbook: GoldenPlaybookType;
}

export function GoldenPlaybook({ playbook }: GoldenPlaybookProps) {
  return (
    <div className="space-y-10 max-w-5xl mx-auto pb-24 relative">
      {/* Futuristic Background Decorations */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        <div className="absolute top-0 left-1/4 w-[1px] h-full bg-gradient-to-b from-transparent via-primary/10 to-transparent" />
        <div className="absolute top-0 right-1/4 w-[1px] h-full bg-gradient-to-b from-transparent via-primary/10 to-transparent" />
        <div className="absolute top-1/3 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/5 to-transparent" />
      </div>

      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative group"
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-orange-500/50 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
        <div className="relative overflow-hidden rounded-[2rem] p-10 border border-white/10 bg-black/40 backdrop-blur-3xl">
            <div className="absolute top-0 right-0 p-6 opacity-20 transform translate-x-4 -translate-y-4">
                <Activity className="w-32 h-32 text-primary" />
            </div>
            
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 flex items-center gap-2">
                            <Star className="w-4 h-4 text-primary fill-primary animate-pulse" />
                            <span className="text-[10px] font-black tracking-[0.2em] uppercase text-primary">Strategy Playbook v1.0</span>
                        </div>
                    </div>
                    <h1 className="text-5xl font-black tracking-tighter">
                        <span className="text-white">GOLDEN</span>{" "}
                        <span className="text-primary italic">STRATEGY</span>
                    </h1>
                    <div className="flex items-center gap-3">
                        <p className="text-muted-foreground text-lg font-medium">Verified Optimization:</p>
                        <span className="px-4 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xl font-black text-foreground shadow-2xl">
                            {playbook.strategyName}
                        </span>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                    <div className="relative">
                        <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-full" />
                        <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl flex items-center gap-6">
                            <div className="text-right">
                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest leading-none mb-1">Success probability</p>
                                <p className="text-5xl font-black text-white leading-none tracking-tighter">{playbook.winRate}%</p>
                            </div>
                            <div className="h-12 w-[1px] bg-white/10" />
                            <div className="flex flex-col items-center">
                                <TrendingUp className="w-10 h-10 text-primary" />
                                <span className="text-[8px] font-black text-primary mt-1 uppercase">High Confidence</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Rules Section (60% width on large screens) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between mb-2 px-2">
             <h3 className="text-xl font-black uppercase tracking-widest flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-primary" />
                Execution Rules
             </h3>
             <span className="h-[1px] flex-1 bg-gradient-to-r from-primary/30 to-transparent ml-4" />
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {playbook.rules.map((rule, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="group relative p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/30 transition-all hover:bg-white/10"
              >
                <div className="flex items-start gap-5">
                    <div className="flex flex-col items-center gap-1 mt-1">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary border border-primary/20">
                            0{i + 1}
                        </div>
                        {i < playbook.rules.length - 1 && <div className="w-[2px] h-full min-h-[20px] bg-white/5" />}
                    </div>
                    <div>
                        <p className="text-md leading-relaxed font-medium text-foreground/90 group-hover:text-white transition-colors">{rule}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 ml-auto text-white/10 group-hover:text-primary transition-colors mt-1" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Specs & Psychology (40% width) */}
        <div className="lg:col-span-5 space-y-8">
            {/* Tactical Grid */}
            <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 px-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    Performance Metrics
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { label: "Optimal Asset", value: playbook.bestPair, icon: Activity },
                        { label: "Prime Session", value: playbook.bestSession, icon: Calendar },
                        { label: "Alpha Ratio", value: `1:${playbook.recommendedRR}`, icon: Target },
                        { label: "Avg Yield", value: `$${playbook.avgProfit}`, icon: Zap, highlight: true }
                    ].map((spec, i) => (
                        <div key={i} className="p-4 rounded-3xl bg-white/5 border border-white/5 flex flex-col gap-2 relative overflow-hidden group hover:bg-white/10 transition-all cursor-default">
                             <div className="flex items-center justify-between">
                                <spec.icon className="w-4 h-4 text-primary opacity-50 group-hover:opacity-100 transition-opacity" />
                                <div className="p-1 rounded bg-white/5 border border-white/5 opacity-0 group-hover:opacity-100 transition-all">
                                    <ChevronRight className="w-3 h-3 text-muted-foreground" />
                                </div>
                             </div>
                             <div>
                                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{spec.label}</p>
                                <p className={`font-black text-lg tracking-tight ${spec.highlight ? (parseFloat(spec.value.replace('$','')) >= 0 ? 'text-profit' : 'text-loss') : 'text-white'}`}>{spec.value}</p>
                             </div>
                             <div className="absolute bottom-0 right-0 w-8 h-8 bg-primary/5 blur-xl group-hover:bg-primary/20 transition-all" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Psychology Card */}
            <div className="relative group">
                <div className="absolute -inset-0.5 bg-indigo-500/20 rounded-[2rem] blur opacity-0 group-hover:opacity-100 transition duration-500" />
                <GlassCard className="p-8 bg-gradient-to-br from-indigo-500/10 via-background to-transparent border-indigo-500/20 relative overflow-hidden rounded-[2rem]">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl" />
                    <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2 text-indigo-400">
                        <Brain className="w-5 h-5" />
                        Mindset Guidelines
                    </h3>
                    <div className="relative">
                        <span className="absolute -left-2 -top-2 text-4xl text-indigo-500/30 font-serif">"</span>
                        <p className="text-md text-foreground leading-relaxed font-medium italic relative z-10 px-4">
                            {playbook.psychologyNote}
                        </p>
                        <span className="absolute -right-2 -bottom-2 text-4xl text-indigo-500/30 font-serif">"</span>
                    </div>
                </GlassCard>
            </div>
        </div>
      </div>

      {/* Footer System Message */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="flex flex-col items-center gap-4 pt-10"
      >
        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40">
            <div className="h-[1px] w-12 bg-white/5" />
            System Authentication Verified
            <div className="h-[1px] w-12 bg-white/5" />
        </div>
        <p className="text-center text-[11px] text-muted-foreground/60 max-w-lg leading-relaxed px-6">
            THIS PLAYBOOK IS DISTILLED BY THE PERFORMANCE ENGINE FROM YOUR TRADING DATA. 
            RULES ARE DYNAMIC AND READ-ONLY. AS YOUR EDGE EVOLVES, THE MODELS WILL RE-ALIGN.
        </p>
      </motion.div>
    </div>
  );
}
