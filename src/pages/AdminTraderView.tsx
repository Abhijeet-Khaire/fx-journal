import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Trade } from "@/lib/tradeTypes";
import { getNetProfit, getWinRate, getProfitFactor, getDrawdownStats } from "@/lib/tradeStore";
import { GlassCard } from "@/components/GlassCard";
import { 
    ArrowLeft, TrendingUp, TrendingDown, Trophy, Activity, 
    ArrowUpRight, ArrowDownRight, Clock, Zap, Target, Shield, 
    BarChart3, Cpu, Fingerprint
} from "lucide-react";
import { motion } from "framer-motion";

interface Trader {
    uid: string;
    email: string;
    displayName: string;
    photoURL: string | null;
}

export default function AdminTraderView() {
    const { uid } = useParams();
    const navigate = useNavigate();
    const [trader, setTrader] = useState<Trader | null>(null);
    const [trades, setTrades] = useState<Trade[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTraderData = async () => {
            if (!uid) return;
            try {
                const traderDoc = await getDoc(doc(db, "traders", uid));
                if (traderDoc.exists()) {
                    setTrader(traderDoc.data() as Trader);
                }
                const { collection, getDocs } = await import("firebase/firestore");
                const subRef = collection(db, "traders", uid, "trade-history");
                const subSnap = await getDocs(subRef);
                
                let allTrades: Trade[] = [];
                subSnap.forEach((doc) => {
                    const data = doc.data();
                    if (data.trades && Array.isArray(data.trades)) {
                        allTrades = [...allTrades, ...(data.trades as Trade[])];
                    }
                });

                const sortedTrades = allTrades.sort((a, b) => {
                    return new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime();
                });
                setTrades(sortedTrades);
            } catch (error) {
                console.error("Failed to fetch trader details", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTraderData();
    }, [uid]);

    // Equity Curve Data
    const equityCurve = useMemo(() => {
        if (!trades.length) return [];
        const sorted = [...trades].sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());
        let cumulative = 0;
        return sorted.map(t => { cumulative += t.profitLoss; return cumulative; });
    }, [trades]);

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center flex-col gap-4">
                <Cpu className="w-10 h-10 text-primary animate-spin" style={{ animationDuration: '3s' }} />
                <p className="text-xs font-black uppercase text-muted-foreground tracking-widest animate-pulse">Loading Trader Profile...</p>
            </div>
        );
    }

    if (!trader) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
                <Target className="w-16 h-16 text-muted-foreground/20" />
                <h2 className="text-2xl font-black uppercase tracking-tighter italic">Trader Not Found</h2>
                <button onClick={() => navigate('/admin')} className="text-primary text-sm font-bold hover:underline">Return to Admin Dashboard</button>
            </div>
        );
    }

    const netProfit = getNetProfit(trades);
    const winRate = getWinRate(trades);
    const profitFactor = getProfitFactor(trades);
    const totalTrades = trades.length;
    const { maxDrawdown } = trades.length ? getDrawdownStats(trades) : { maxDrawdown: 0 };
    const wins = trades.filter(t => t.profitLoss > 0).length;
    const losses = trades.filter(t => t.profitLoss < 0).length;

    return (
        <div className="space-y-10 pb-24 relative">
            {/* Background Ambience */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/3 rounded-full blur-[200px]" />
            </div>

            {/* Back + Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <button
                    onClick={() => navigate('/admin')}
                    className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm font-bold uppercase tracking-widest"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Admin Dashboard
                </button>

                <div className="flex flex-col md:flex-row md:items-center gap-6">
                    <div className="relative">
                        {trader.photoURL ? (
                            <img src={trader.photoURL} alt={trader.displayName} className="w-20 h-20 rounded-2xl border-2 border-primary/30 shadow-glow" />
                        ) : (
                            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-3xl font-black border-2 border-primary/30 shadow-glow">
                                {trader.displayName?.charAt(0) || "T"}
                            </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-profit rounded-lg border-2 border-background flex items-center justify-center">
                            <Shield className="w-3 h-3 text-white" />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="px-2.5 py-0.5 rounded-lg bg-primary/10 border border-primary/20">
                                <span className="text-[8px] font-black tracking-[0.3em] uppercase text-primary">Trader Account</span>
                            </div>
                        </div>
                        <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">{trader.displayName}</h1>
                        <p className="text-muted-foreground font-medium flex items-center gap-2 mt-1">
                            <Fingerprint className="w-3.5 h-3.5" /> {trader.email}
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                    { label: "Net Yield", value: `${netProfit >= 0 ? '+' : ''}$${netProfit.toFixed(2)}`, icon: TrendingUp, color: netProfit >= 0 ? "text-profit" : "text-loss", bg: netProfit >= 0 ? "bg-profit/10" : "bg-loss/10" },
                    { label: "Win Rate", value: `${winRate.toFixed(1)}%`, icon: Trophy, color: winRate >= 50 ? "text-profit" : "text-loss", bg: "bg-primary/10" },
                    { label: "Operations", value: totalTrades.toString(), icon: Activity, color: "text-primary", bg: "bg-primary/10" },
                    { label: "Profit Factor", value: profitFactor.toFixed(2), icon: BarChart3, color: profitFactor >= 1.5 ? "text-profit" : "text-loss", bg: "bg-white/5" },
                    { label: "Max Drawdown", value: `-$${maxDrawdown.toFixed(0)}`, icon: TrendingDown, color: "text-loss", bg: "bg-loss/10" },
                ].map((stat, i) => (
                    <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                        <GlassCard className="p-6 rounded-[2rem] border-white/10 relative overflow-hidden group">
                            <div className="flex items-start justify-between mb-3">
                                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                                <div className={`p-2 rounded-xl ${stat.bg} ${stat.color}`}>
                                    <stat.icon className="w-4 h-4" />
                                </div>
                            </div>
                            <p className={`text-2xl font-black tracking-tighter italic ${stat.color}`}>{stat.value}</p>
                        </GlassCard>
                    </motion.div>
                ))}
            </div>

            {/* Equity Curve Chart */}
            {equityCurve.length > 0 && (
                <GlassCard className="p-8 rounded-[2.5rem] border-white/10 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full circuit-pattern opacity-[0.03] pointer-events-none" />
                    <div className="flex items-center gap-4 mb-8 relative z-10">
                        <div className="p-3 rounded-2xl bg-primary/10 text-primary"><TrendingUp className="w-5 h-5" /></div>
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-tighter italic">Equity Curve</h3>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Cumulative Performance Over Time</p>
                        </div>
                        <div className="ml-auto flex items-center gap-2">
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-profit/10 border border-profit/20 text-[8px] font-black text-profit uppercase tracking-widest">
                                <ArrowUpRight className="w-3 h-3" /> {wins}W
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-loss/10 border border-loss/20 text-[8px] font-black text-loss uppercase tracking-widest">
                                <ArrowDownRight className="w-3 h-3" /> {losses}L
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 h-52">
                        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                            {/* Grid */}
                            {[20, 40, 60, 80].map(y => (
                                <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="white" strokeWidth="0.1" strokeOpacity="0.08" />
                            ))}
                            {/* Zero Line */}
                            {(() => {
                                const min = Math.min(...equityCurve, 0);
                                const max = Math.max(...equityCurve, 0);
                                const range = max - min || 1;
                                const zeroY = 100 - ((0 - min) / range) * 100;
                                return <line x1="0" y1={zeroY} x2="100" y2={zeroY} stroke="white" strokeWidth="0.2" strokeOpacity="0.2" strokeDasharray="1,1" />;
                            })()}
                            {/* Equity Line */}
                            <motion.polyline
                                fill="none"
                                stroke="url(#eqGradient)"
                                strokeWidth="0.8"
                                strokeLinejoin="round"
                                points={equityCurve.map((val, idx) => {
                                    const x = (idx / (equityCurve.length - 1)) * 100;
                                    const min = Math.min(...equityCurve, 0);
                                    const max = Math.max(...equityCurve, 0);
                                    const range = max - min || 1;
                                    const y = 100 - ((val - min) / range) * 100;
                                    return `${x},${y}`;
                                }).join(' ')}
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 2 }}
                            />
                            {/* Fill */}
                            <polygon
                                fill="url(#eqFill)"
                                opacity="0.15"
                                points={
                                    equityCurve.map((val, idx) => {
                                        const x = (idx / (equityCurve.length - 1)) * 100;
                                        const min = Math.min(...equityCurve, 0);
                                        const max = Math.max(...equityCurve, 0);
                                        const range = max - min || 1;
                                        const y = 100 - ((val - min) / range) * 100;
                                        return `${x},${y}`;
                                    }).join(' ') + ` 100,100 0,100`
                                }
                            />
                            <defs>
                                <linearGradient id="eqGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
                                    <stop offset="100%" stopColor="hsl(var(--primary))" />
                                </linearGradient>
                                <linearGradient id="eqFill" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="hsl(var(--primary))" />
                                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                </GlassCard>
            )}

            {/* Trade History */}
            <GlassCard className="rounded-[2.5rem] border-white/10 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                <div className="p-8 pb-4 flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-primary/10 text-primary"><Zap className="w-5 h-5" /></div>
                    <div>
                        <h3 className="text-xl font-black uppercase tracking-tighter italic">Trade History</h3>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{trades.length} Records</p>
                    </div>
                </div>

                {trades.length === 0 ? (
                    <div className="py-16 text-center">
                        <Clock className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                        <p className="text-xs font-black uppercase text-muted-foreground tracking-widest">No Trades Recorded</p>
                    </div>
                ) : (
                    <div className="px-4 pb-4 space-y-2">
                        {/* Header */}
                        <div className="grid grid-cols-12 gap-3 px-6 py-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                            <div className="col-span-2">Timestamp</div>
                            <div className="col-span-2">Pair</div>
                            <div className="col-span-1">Dir</div>
                            <div className="col-span-2">Entry / Exit</div>
                            <div className="col-span-1 text-right">Pips</div>
                            <div className="col-span-2 text-right">P/L</div>
                            <div className="col-span-2">Strategy</div>
                        </div>

                        <div className="max-h-[600px] overflow-y-auto pr-2 space-y-1 custom-scrollbar">
                            {trades.map((trade, i) => (
                                <motion.div
                                    key={trade.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: Math.min(i * 0.02, 0.5) }}
                                    className="grid grid-cols-12 gap-3 items-center px-6 py-3.5 rounded-xl hover:bg-white/5 transition-all border border-transparent hover:border-white/10 group"
                                >
                                    <div className="col-span-2 font-mono text-xs text-muted-foreground">
                                        <div>{trade.date}</div>
                                        <div className="text-[10px] opacity-60">{trade.time}</div>
                                    </div>
                                    <div className="col-span-2 font-bold text-sm group-hover:text-primary transition-colors">{trade.pair}</div>
                                    <div className="col-span-1">
                                        <span className={`inline-flex items-center gap-1 text-[9px] font-black px-2 py-1 rounded-lg border uppercase tracking-widest ${
                                            trade.direction === "BUY" ? "bg-profit/10 text-profit border-profit/20" : "bg-loss/10 text-loss border-loss/20"
                                        }`}>
                                            {trade.direction === "BUY" ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                                            {trade.direction}
                                        </span>
                                    </div>
                                    <div className="col-span-2 font-mono text-xs text-muted-foreground">
                                        {trade.entryPrice} → {trade.exitPrice}
                                    </div>
                                    <div className={`col-span-1 text-right font-mono font-bold text-xs ${trade.pips >= 0 ? "text-profit" : "text-loss"}`}>
                                        {trade.pips > 0 ? "+" : ""}{trade.pips}
                                    </div>
                                    <div className={`col-span-2 text-right font-mono font-black text-sm ${trade.profitLoss >= 0 ? "text-profit" : "text-loss"}`}>
                                        {trade.profitLoss > 0 ? "+" : ""}${trade.profitLoss.toFixed(2)}
                                    </div>
                                    <div className="col-span-2 text-xs text-muted-foreground truncate">{trade.strategy}</div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}
            </GlassCard>
        </div>
    );
}
