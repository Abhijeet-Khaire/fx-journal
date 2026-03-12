import { useNavigate } from "react-router-dom";
import { useTrades } from "@/hooks/useTrades";
import { usePlan } from "@/hooks/usePlan";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import {
    getDrawdownStats,
    getRiskStats
} from "@/lib/tradeStore";
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";
import { Shield, TrendingDown, Activity, AlertTriangle, Lock, Zap, Fingerprint, ShieldAlert, Crosshair } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { RiskMetrics } from "@/components/Risk/RiskMetrics";

export default function Risk() {
    const navigate = useNavigate();
    const { trades, loading } = useTrades();
    const { plan } = usePlan();
    const isUltimate = plan === "ultimate";

    const [maxDailyLossPercent, setMaxDailyLossPercent] = useState<string>("");

    useEffect(() => {
        const saved = localStorage.getItem("maxDailyLoss");
        if (saved) setMaxDailyLossPercent(saved);
    }, []);

    const saveDailyLoss = () => {
        if (!maxDailyLossPercent) return;
        localStorage.setItem("maxDailyLoss", maxDailyLossPercent);
        toast.success("Daily Loss Limit Updated");
    };

    const stats = useMemo(() => {
        if (!trades.length) return null;
        
        const totalTrades = trades.length;
        const wins = trades.filter(t => t.profitLoss > 0).length;
        const winRate = (wins / totalTrades) * 100;
        
        const winners = trades.filter(t => t.profitLoss > 0);
        const losers = trades.filter(t => t.profitLoss < 0);
        
        const avgWin = winners.reduce((s, t) => s + t.profitLoss, 0) / (winners.length || 1);
        const avgLoss = Math.abs(losers.reduce((s, t) => s + t.profitLoss, 0) / (losers.length || 1));
        const avgRR = avgWin / (avgLoss || 1);

        // Calculate avg risk per trade (conceptual for now, or based on pips/value)
        // Let's assume average risk is the average loss if not explicitly tracked
        const avgRisk = avgLoss; 
        
        return { winRate, avgRR, avgRisk };
    }, [trades]);

    if (loading) return (
        <div className="space-y-6">
            <div className="h-40 w-full rounded-2xl bg-white/5 animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="h-64 rounded-2xl bg-white/5 animate-pulse" />
                <div className="h-64 rounded-2xl bg-white/5 animate-pulse" />
                <div className="h-64 rounded-2xl bg-white/5 animate-pulse" />
            </div>
        </div>
    );

    const drawdownStats = getDrawdownStats(trades);
    const riskStats = getRiskStats(trades);

    const today = new Date().toISOString().split("T")[0];
    const todayTrades = trades.filter(t => t.date === today);
    const todayPnL = todayTrades.reduce((s, t) => s + t.profitLoss, 0);

    return (
        <div className="space-y-10 pb-20 relative">
            {/* Page Header */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-[2.5rem] p-10 border border-white/10 bg-black/40 backdrop-blur-3xl group shadow-2xl"
            >
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Fingerprint className="w-48 h-48 text-primary" />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 flex items-center gap-2">
                                <Shield className="w-4 h-4 text-primary animate-pulse" />
                                <span className="text-[10px] font-black tracking-[0.3em] uppercase text-primary">Risk Oversight Active</span>
                            </div>
                        </div>
                        <div>
                            <h1 className="text-5xl font-black tracking-tighter text-white uppercase italic">Risk <span className="text-primary not-italic">Manager</span></h1>
                            <p className="text-muted-foreground text-lg font-medium mt-2">
                                Advanced drawdown monitoring and statistical risk modeling.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1">Execution Risk</p>
                            <div className="flex items-baseline gap-2">
                                <p className="text-6xl font-black text-white tracking-tighter shimmer-text">
                                    {riskStats.riskConsistency}%
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <GlassCard className="p-8 border-t-2 border-t-red-500/50">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Active Drawdown</h3>
                        <div className="p-2 rounded-lg bg-red-500/10">
                            <TrendingDown className="w-5 h-5 text-red-500" />
                        </div>
                    </div>
                    <div className="text-4xl font-black text-red-500 font-mono italic">
                        -${drawdownStats.currentDrawdown}
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase text-muted-foreground">Historical Peak:</span>
                        <span className="text-xs font-bold text-white">-${drawdownStats.maxDrawdown}</span>
                    </div>
                </GlassCard>

                <GlassCard className="p-8 border-t-2 border-t-indigo-500/50">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Avg Exposure</h3>
                        <div className="p-2 rounded-lg bg-indigo-500/10">
                            <Crosshair className="w-5 h-5 text-indigo-500" />
                        </div>
                    </div>
                    <div className="text-4xl font-black text-white font-mono italic">
                        ${riskStats.avgRisk}
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase text-muted-foreground">Highest Risk:</span>
                        <span className="text-xs font-bold text-white">${riskStats.maxRisk}</span>
                    </div>
                </GlassCard>

                <GlassCard className="p-8 border-t-2 border-t-primary/50">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Risk Variance</h3>
                        <div className="p-2 rounded-lg bg-primary/10">
                            <Activity className="w-5 h-5 text-primary" />
                        </div>
                    </div>
                    <div className="text-4xl font-black text-primary font-mono italic">
                        ±{Math.abs(100 - riskStats.riskConsistency)}%
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase text-muted-foreground">Consistency Score:</span>
                        <span className="text-xs font-bold text-white">{riskStats.riskConsistency}%</span>
                    </div>
                </GlassCard>
            </div>

            {/* Critical Risk Metrics Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-xl font-black uppercase tracking-widest flex items-center gap-3">
                        <ShieldAlert className="w-6 h-6 text-primary" />
                        Statistical <span className="text-primary not-italic">Edge</span>
                    </h3>
                    <span className="h-px flex-1 bg-gradient-to-r from-primary/30 to-transparent ml-6" />
                </div>
                
                {stats && (
                    <RiskMetrics 
                        winRate={stats.winRate} 
                        avgRR={stats.avgRR} 
                        avgRiskPerTrade={1.5} // Defaulting to 1.5% as placeholder
                    />
                )}
            </div>

            {/* Drawdown Chart - Ultimate Feature */}
            <div className="relative">
                <GlassCard className={`p-8 rounded-[2rem] ${!isUltimate ? "blur-sm pointer-events-none opacity-50" : ""}`}>
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3 italic">
                                <TrendingDown className="w-6 h-6 text-red-500" />
                                Drawdown <span className="text-red-500 not-italic">History</span>
                            </h2>
                            <p className="text-sm text-muted-foreground font-medium mt-1">Real-time equity curve performance monitoring.</p>
                        </div>
                        <div className="flex gap-2">
                            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Live Analysis</span>
                        </div>
                    </div>
                    
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={drawdownStats.equityCurve}>
                                <defs>
                                    <linearGradient id="colorDd" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="date" hide />
                                <YAxis hide domain={['auto', 'auto']} />
                                <Tooltip
                                    contentStyle={{
                                        background: "rgba(0,0,0,0.8)",
                                        backdropFilter: "blur(10px)",
                                        border: "1px solid rgba(255,255,255,0.1)",
                                        borderRadius: "12px",
                                        padding: "12px"
                                    }}
                                    itemStyle={{ color: "#ef4444", fontWeight: "bold", fontSize: "12px" }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="drawdown" 
                                    stroke="#ef4444" 
                                    strokeWidth={3}
                                    fillOpacity={1} 
                                    fill="url(#colorDd)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>
                {!isUltimate && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                        <div className="bg-black/60 backdrop-blur-xl p-10 rounded-[2.5rem] border border-white/10 text-center shadow-2xl max-w-sm">
                            <Lock className="w-12 h-12 text-primary mx-auto mb-4" />
                            <h3 className="text-2xl font-black uppercase tracking-tighter italic">Institutional Access Required</h3>
                            <p className="text-sm text-muted-foreground mb-8 leading-relaxed font-medium">Drawdown statistics and performance history analysis are exclusive to Institutional traders.</p>
                            <Button 
                                onClick={() => navigate("/plans")}
                                className="w-full bg-primary hover:scale-105 transition-transform py-6 rounded-2xl font-black uppercase text-xs tracking-widest"
                            >
                                Upgrade Plan
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Daily Loss Guard */}
            <div className="relative">
                <GlassCard className={`p-8 rounded-[2rem] border-l-8 border-l-primary/30 ${!isUltimate ? "opacity-60 pointer-events-none" : ""}`}>
                    <div className="flex items-start justify-between">
                        <div className="space-y-4">
                            <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3 italic">
                                <Zap className="w-6 h-6 text-primary" />
                                Loss <span className="text-primary not-italic">Limit</span> Gate
                            </h2>
                            <p className="text-sm text-muted-foreground font-medium max-w-md">
                                Hard-coded circuit breaker. Set your maximum tolerable daily loss and the system will actively warn you upon breach.
                            </p>
                        </div>
                        {todayPnL < 0 && (
                            <div className="text-right p-4 rounded-2xl bg-white/5 border border-white/10">
                                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Today's PnL Status</span>
                                <div className={`text-4xl font-black font-mono italic mt-1 ${todayPnL < 0 ? "text-loss" : "text-profit"}`}>
                                    ${todayPnL.toFixed(2)}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-10 flex gap-4 max-w-sm">
                        <Input
                            type="number"
                            placeholder="MAX LOSS THRESHOLD ($)"
                            value={maxDailyLossPercent}
                            onChange={(e) => setMaxDailyLossPercent(e.target.value)}
                            className="bg-white/5 border-white/10 rounded-xl h-12 font-bold focus:ring-primary"
                        />
                        <Button onClick={saveDailyLoss} className="h-12 px-8 rounded-xl bg-white/10 hover:bg-primary transition-colors font-black uppercase text-[10px] tracking-widest">
                            Set Risk Alert
                        </Button>
                    </div>

                    {maxDailyLossPercent && todayPnL < -Math.abs(parseFloat(maxDailyLossPercent)) && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="mt-8 p-6 rounded-2xl bg-destructive/10 border border-destructive/30 flex items-center gap-6 text-destructive"
                        >
                            <AlertTriangle className="w-12 h-12 animate-bounce" />
                            <div>
                                <h3 className="font-black text-xl uppercase tracking-widest italic">Circuit Breaker Tripped</h3>
                                <p className="text-sm font-medium opacity-80 uppercase tracking-tighter">Daily maximum loss exceeded. Cease all trading operations immediately to preserve capital.</p>
                            </div>
                        </motion.div>
                    )}
                </GlassCard>
                
                {!isUltimate && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                         <div className="px-4 py-2 bg-primary/20 backdrop-blur-md rounded-full border border-primary/30 flex items-center gap-2">
                            <Lock className="w-4 h-4 text-primary" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Institutional Feature</span>
                         </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Icon helper
function RoundingDownIcon(props: any) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 7 7 17" /><path d="M17 17H7V7" /></svg>
    )
}
