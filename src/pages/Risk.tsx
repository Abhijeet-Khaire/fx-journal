import { useTrades } from "@/hooks/useTrades";
import { usePlan } from "@/hooks/usePlan";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import {
    getDrawdownStats,
    getRiskStats
} from "@/lib/tradeStore";
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line
} from "recharts";
import { Shield, TrendingDown, Activity, AlertTriangle, Lock } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function Risk() {
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

    if (loading) return <div>Loading...</div>;

    const drawdownStats = getDrawdownStats(trades);
    const riskStats = getRiskStats(trades);

    // Check if daily loss limit exceeded (simple check for today)
    const today = new Date().toISOString().split("T")[0];
    const todayTrades = trades.filter(t => t.date === today);
    const todayPnL = todayTrades.reduce((s, t) => s + t.profitLoss, 0);

    // Assume generic account balance for % calc if user didn't set one? 
    // For now we just show PnL. If user sets %, we need an account balance setting.
    // We'll stick to a conceptual guard or absolute value for MVP if balance is missing.
    // Actually, let's interpret the input as $ amount for simplicity or just save it.

    return (
        <div className="space-y-8 pb-10">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="text-3xl font-bold text-foreground mb-2">Risk Management</h1>
                <p className="text-muted-foreground">Protect your capital with advanced drawdown monitoring and risk analysis.</p>
            </motion.div>

            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <GlassCard className="p-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-muted-foreground text-xs uppercase tracking-wider">Current Drawdown</h3>
                        <TrendingDown className="w-5 h-5 text-red-500" />
                    </div>
                    <div className="text-3xl font-bold text-red-500 font-mono">
                        -${drawdownStats.currentDrawdown}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Peak: -${drawdownStats.maxDrawdown}</p>
                </GlassCard>

                <GlassCard className="p-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-muted-foreground text-xs uppercase tracking-wider">Avg Risk / Trade</h3>
                        <Shield className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div className="text-3xl font-bold text-foreground font-mono">
                        ${riskStats.avgRisk}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Max Risk Taken: ${riskStats.maxRisk}</p>
                </GlassCard>

                <GlassCard className="p-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-muted-foreground text-xs uppercase tracking-wider">Risk Consistency</h3>
                        <Activity className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-3xl font-bold text-primary font-mono">
                        {riskStats.riskConsistency}%
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Consistency Score</p>
                </GlassCard>
            </div>

            {/* Drawdown Chart - Ultimate Feature */}
            <div className="relative">
                <GlassCard className={`p-6 ${!isUltimate ? "blur-sm pointer-events-none opacity-50" : ""}`}>
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <RoundingDownIcon className="w-5 h-5 text-red-500" />
                        Drawdown Monitor
                    </h2>
                    <div className="h-[300px] w-full">
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
                                        background: "hsl(var(--card))",
                                        border: "1px solid hsl(var(--border))",
                                    }}
                                />
                                <Area type="monotone" dataKey="drawdown" stroke="#ef4444" fillOpacity={1} fill="url(#colorDd)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>
                {!isUltimate && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                        <div className="bg-background/80 backdrop-blur-md p-6 rounded-2xl border border-white/10 text-center shadow-2xl">
                            <Lock className="w-10 h-10 text-primary mx-auto mb-3" />
                            <h3 className="text-lg font-bold">Ultimate Feature</h3>
                            <p className="text-sm text-muted-foreground mb-4">Upgrade to unlock Drawdown Monitoring.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Daily Loss Guard */}
            <div className="relative">
                <GlassCard className={`p-6 ${!isUltimate ? "opacity-60 pointer-events-none" : ""}`}>
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <Shield className="w-5 h-5 text-primary" />
                                Daily Loss Guard
                            </h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                Set a maximum daily loss limit. We'll warn you if you cross it.
                            </p>
                        </div>
                        {todayPnL < 0 && (
                            <div className="text-right">
                                <span className="text-xs uppercase text-muted-foreground">Today's PnL</span>
                                <div className={`text-xl font-bold font-mono ${todayPnL < 0 ? "text-loss" : "text-profit"}`}>
                                    ${todayPnL.toFixed(2)}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-6 flex gap-4 max-w-sm">
                        <Input
                            type="number"
                            placeholder="Max Loss $ (e.g. 100)"
                            value={maxDailyLossPercent}
                            onChange={(e) => setMaxDailyLossPercent(e.target.value)}
                        />
                        <Button onClick={saveDailyLoss}>Save Limit</Button>
                    </div>

                    {/* Mock Warning if exceeded (using todayPnL vs logic) */}
                    {maxDailyLossPercent && todayPnL < -Math.abs(parseFloat(maxDailyLossPercent)) && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="mt-6 p-4 rounded-xl bg-destructive/10 border border-destructive/30 flex items-center gap-4 text-destructive"
                        >
                            <AlertTriangle className="w-8 h-8" />
                            <div>
                                <h3 className="font-bold text-lg">Daily Limit Exceeded</h3>
                                <p className="text-sm text-destructive-foreground/80">Stop trading for today. You have hit your risk limit.</p>
                            </div>
                        </motion.div>
                    )}
                </GlassCard>
                {!isUltimate && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                        <Lock className="w-8 h-8 text-primary mb-2" />
                        <span className="text-sm font-bold bg-background/80 px-3 py-1 rounded-full border border-white/10">Ultimate Feature</span>
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
