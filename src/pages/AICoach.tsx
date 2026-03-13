import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTrades } from "@/hooks/useTrades";
import { GlassCard } from "@/components/GlassCard";
import { motion } from "framer-motion";
import {
    Sparkles,
    Brain,
    Zap,
    ShieldAlert,
    TrendingUp,
    Activity,
    MessageSquare,
    Lock,
    ChevronRight,
    Fingerprint
} from "lucide-react";
import { TraderRadarChart } from "@/components/AICoach/TraderRadarChart";
import { BehaviorPatterns } from "@/components/AICoach/BehaviorPatterns";
import { clusterTrades, getTraderProfile } from "@/lib/mlEngine";
import { generateCoachingInsights } from "@/lib/aiCoach";
import { usePlan } from "@/hooks/usePlan";
import { SkeletonCard } from "@/components/SkeletonLoader";
import { PreTradeCopilot } from "@/components/AICoach/PreTradeCopilot";
import { AIAnalyst } from "@/components/AICoach/AIAnalyst";

export default function AICoach() {
    const navigate = useNavigate();
    const { trades, loading } = useTrades();
    const { plan } = usePlan();
    const isPro = plan === "pro" || plan === "ultimate";

    const data = useMemo(() => {
        if (!trades.length) return null;
        return {
            profile: getTraderProfile(trades),
            clusters: clusterTrades(trades),
            insights: generateCoachingInsights(trades)
        };
    }, [trades]);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-40 w-full rounded-2xl bg-white/5 animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <SkeletonCard />
                    <SkeletonCard className="md:col-span-2" />
                </div>
            </div>
        );
    }

    if (!data || trades.length < 3) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-6 relative">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
                </div>
                <div className="relative">
                    <div className="absolute -inset-4 bg-primary/20 rounded-full blur-xl animate-pulse" />
                    <div className="relative p-6 bg-white/5 rounded-full border border-white/10 backdrop-blur-xl">
                        <Brain className="w-16 h-16 text-primary" />
                    </div>
                </div>
                <div className="space-y-2 relative z-10">
                    <h2 className="text-3xl font-black tracking-tighter uppercase">Initializing Performance Coach</h2>
                    <p className="text-muted-foreground max-w-md mx-auto font-medium">
                        The AI engine requires more behavioral data points to construct your trading profile.
                        Journal at least <span className="text-primary font-bold">5-10 trades</span> to unlock the full potential.
                    </p>
                </div>
                <button className="group relative px-8 py-3 bg-white/5 border border-white/10 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary hover:text-primary-foreground transition-all">
                    Sync Data Inputs
                    <div className="absolute -right-2 -top-2 w-4 h-4 bg-primary rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-10 pb-20 relative">
            {/* Page Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border border-white/10 bg-black/40 backdrop-blur-3xl group shadow-2xl"
            >
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Fingerprint className="w-32 h-32 md:w-48 md:h-48 text-primary" />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-10">
                    <div className="space-y-4 md:space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                                <span className="text-[10px] font-black tracking-[0.3em] uppercase text-primary">System Status: Optimized</span>
                            </div>
                        </div>
                        <div>
                            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white uppercase ">AI Coach <span className="text-primary not-">Hub</span></h1>
                            <p className="text-muted-foreground text-sm md:text-lg font-medium mt-2 flex items-center gap-2">
                                Autonomous Classification:
                                <span className="text-white font-black px-3 py-1 rounded-xl bg-white/5 border border-white/10 uppercase ">
                                    {data.profile.profile}
                                </span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1">Consistency Index</p>
                            <div className="flex items-baseline gap-2">
                                <p className="text-6xl font-black text-white tracking-tighter shimmer-text">{data.profile.stats.consistency}%</p>
                                <div className="h-2 w-16 bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary" style={{ width: `${data.profile.stats.consistency}%` }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Column: Profile Hub */}
                <div className="lg:col-span-4 space-y-8">
                    <GlassCard className="p-8 rounded-[2rem] border-white/10 shadow-2xl">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                                <Activity className="w-5 h-5 text-primary" />
                                Behavioral Profile
                            </h3>
                            <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                <ChevronRight className="w-4 h-4" />
                            </div>
                        </div>

                        <TraderRadarChart data={{
                            consistency: data.profile.stats.consistency,
                            discipline: data.profile.stats.discipline,
                            ruleAdherence: data.profile.stats.ruleAdherence,
                            revengeRisk: data.profile.stats.revengeRisk,
                            riskManagement: 80
                        }} />

                        <div className="mt-10 space-y-6">
                            <div className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Rule Compliance</span>
                                    <span className="text-xl font-black text-white">{data.profile.stats.ruleAdherence}%</span>
                                </div>
                                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${data.profile.stats.ruleAdherence}%` }}
                                        className="h-full bg-gradient-to-r from-primary to-cyan-400"
                                    />
                                </div>
                            </div>
                        </div>
                    </GlassCard>

                    <div className="relative group overflow-hidden rounded-[2rem]">
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <GlassCard className="p-8 bg-black/40 border-white/10 rounded-[2rem] relative z-10">
                            <h3 className="text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2 text-yellow-500">
                                <Zap className="w-4 h-4" />
                                Coach's Priority
                            </h3>
                            <p className="text-md text-foreground/90 leading-relaxed font-bold ">
                                "Aggressive optimization required: elevate rule compliance to 90th percentile to mitigate variance and solidify equity curve."
                            </p>
                        </GlassCard>
                    </div>
                </div>

                {/* Right Columns: Tactical Flow */}
                <div className="lg:col-span-8 space-y-10">
                    <PreTradeCopilot trades={trades} />

                    <div className="space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-xl font-black uppercase tracking-widest flex items-center gap-3">
                                <MessageSquare className="w-6 h-6 text-primary" />
                                Strategic Insights
                            </h3>
                            <span className="h-px flex-1 bg-gradient-to-r from-primary/30 to-transparent ml-6" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {data.insights.map((insight, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.1 }}
                                >
                                    <GlassCard className={`p-6 h-full rounded-3xl border-l-8 transition-all hover:scale-[1.02] ${insight.type === 'strength' ? 'border-l-profit bg-profit/5' :
                                        insight.type === 'weakness' ? 'border-l-loss bg-loss/5' :
                                            insight.type === 'recommendation' ? 'border-l-primary bg-primary/5' : 'border-l-indigo-500 bg-indigo-500/5'
                                        }`}>
                                        <h4 className="text-md font-black  uppercase tracking-tight mb-2 flex items-center gap-2">
                                            {insight.type === 'weakness' && <ShieldAlert className="w-4 h-4 text-loss" />}
                                            {insight.type === 'strength' && <TrendingUp className="w-4 h-4 text-profit" />}
                                            {insight.title}
                                        </h4>
                                        <p className="text-sm text-foreground/70 font-medium leading-relaxed">
                                            {insight.description}
                                        </p>
                                        {insight.impact && (
                                            <div className="mt-4 flex items-center gap-2">
                                                <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${insight.impact === 'Critical' ? 'bg-loss/20 text-loss' : 'bg-primary/20 text-primary'}`}>
                                                    IMPACT: {insight.impact}
                                                </div>
                                            </div>
                                        )}
                                    </GlassCard>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    <AIAnalyst trades={trades} />

                    <div className="space-y-6">
                        <div className="flex items-center gap-6 px-2">
                            <h3 className="text-xl font-black uppercase tracking-widest flex items-center gap-3  whitespace-nowrap">
                                <Brain className="w-6 h-6 text-primary" />
                                Behavioral <span className="text-primary not-">Patterns</span>
                            </h3>
                            <div className="h-px flex-1 bg-gradient-to-r from-primary/50 via-primary/10 to-transparent" />
                        </div>

                        <div className="relative">
                            <BehaviorPatterns clusters={data.clusters} />
                            {!isPro && (
                                <div className="absolute inset-0 z-20 flex items-center justify-center backdrop-blur-xl rounded-[2rem] border border-white/10 bg-black/40">
                                    <div className="text-center p-6 glass border-white/10 shadow-2xl max-w-[320px] relative overflow-hidden group/lock">
                                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50" />
                                        <div className="relative z-10">
                                            <div className="relative inline-block mb-4">
                                                <div className="absolute -inset-4 bg-primary/20 rounded-full blur-xl animate-pulse" />
                                                <div className="relative p-3 bg-white/5 rounded-full border border-white/10">
                                                    <Lock className="w-6 h-6 text-primary shadow-glow" />
                                                </div>
                                            </div>
                                            <h4 className="text-lg font-black uppercase tracking-tighter mb-2  leading-tight">Professional <span className="text-primary not-">Access</span> Required</h4>
                                            <p className="text-[10px] text-muted-foreground font-medium mb-6 leading-relaxed px-2">
                                                Hidden pattern detection and deep behavioral clustering are exclusive to Professional & Institutional members.
                                            </p>
                                            <button
                                                onClick={() => navigate("/plans")}
                                                className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-[1.03] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(var(--primary),0.3)]"
                                            >
                                                Upgrade Plan
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
