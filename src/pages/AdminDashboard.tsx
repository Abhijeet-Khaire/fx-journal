import { useEffect, useState, useMemo } from "react";
import { collection, onSnapshot, orderBy, query, doc, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { GlassCard } from "@/components/GlassCard";
import { format, formatDistanceToNow } from "date-fns";
import {
    Users, Key, Clock, Mail, TrendingUp, Activity, Target, ArrowRight,
    Shield, Cpu, Globe, BarChart3, Zap, Eye, Crown, Fingerprint,
    ArrowUpRight, ArrowDownRight, Sparkles, Search, Calendar, Trophy, ChevronRight, LayoutDashboard, Database, Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Trade } from "@/lib/tradeTypes";
import { getNetProfit, getWinRate, getProfitFactor, getDrawdownStats } from "@/lib/tradeStore";
import { AnimatedCounter } from "@/components/AnimatedCounter";

interface Trader {
    uid: string;
    email: string;
    displayName: string;
    photoURL: string | null;
    lastSeen: string;
    isAnonymous: boolean;
    role?: string;
}

interface PerformanceData {
    uid: string;
    displayName: string;
    email: string;
    photoURL: string | null;
    totalTrades: number;
    winRate: number;
    netProfit: number;
    profitFactor: number;
    maxDrawdown: number;
}

export default function AdminDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [traders, setTraders] = useState<Trader[]>([]);
    const [loading, setLoading] = useState(true);
    const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
    const [perfLoading, setPerfLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'performance'>('overview');
    const [searchQuery, setSearchQuery] = useState("");

    // 1. Reactive Traders List
    useEffect(() => {
        if (!user) return;
        const trRef = collection(db, "traders");
        const q = query(trRef, orderBy("lastSeen", "desc"));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(d => ({
                ...d.data(),
                uid: d.id
            }) as Trader);
            setTraders(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    // 2. Reactive Performance Data for the leaderboard
    useEffect(() => {
        if (activeTab === 'performance' && traders.length > 0) {
            loadPerformanceData();
        }
    }, [traders, activeTab]);

    const loadPerformanceData = async () => {
        // We only load if we don't have it or need fresh aggregation
        // This could be made fully reactive too, but for many users it might be heavy.
        // For now, it refreshes when the tab is active or traders change.
        setPerfLoading(true);
        try {
            const promises = traders.map(async (trader) => {
                const subRef = collection(db, "traders", trader.uid, "trade-history");
                const subSnap = await getDocs(subRef);
                
                let allTrades: Trade[] = [];
                subSnap.forEach((doc) => {
                    const data = doc.data();
                    if (data.trades && Array.isArray(data.trades)) {
                        allTrades = [...allTrades, ...(data.trades as Trade[])];
                    }
                });

                return {
                    uid: trader.uid,
                    displayName: trader.displayName,
                    email: trader.email,
                    photoURL: trader.photoURL,
                    totalTrades: allTrades.length,
                    winRate: getWinRate(allTrades),
                    netProfit: getNetProfit(allTrades),
                    profitFactor: getProfitFactor(allTrades),
                    maxDrawdown: allTrades.length ? getDrawdownStats(allTrades).maxDrawdown : 0,
                };
            });
            const results = await Promise.all(promises);
            results.sort((a, b) => b.netProfit - a.netProfit);
            setPerformanceData(results);
        } catch (error) {
            console.error("Failed to fetch performance data", error);
        } finally {
            setPerfLoading(false);
        }
    };

    const totalUsers = traders.length;
    const adminUsers = traders.filter(t => t.role === "superadmin").length;
    const recentUsers = traders.filter(t => {
        if (!t.lastSeen) return false;
        const lastSeenDate = new Date(t.lastSeen);
        const now = new Date();
        return (now.getTime() - lastSeenDate.getTime()) < 1000 * 60 * 60 * 24 * 7;
    }).length;
    const activeToday = traders.filter(t => {
        if (!t.lastSeen) return false;
        const lastSeenDate = new Date(t.lastSeen);
        const now = new Date();
        return (now.getTime() - lastSeenDate.getTime()) < 1000 * 60 * 60 * 24;
    }).length;

    const filteredTraders = useMemo(() => {
        if (!searchQuery) return traders;
        const q = searchQuery.toLowerCase();
        return traders.filter(t => 
            t.displayName?.toLowerCase().includes(q) || 
            t.email?.toLowerCase().includes(q)
        );
    }, [traders, searchQuery]);

    const filteredPerformance = useMemo(() => {
        if (!searchQuery) return performanceData;
        const q = searchQuery.toLowerCase();
        return performanceData.filter(p => 
            p.displayName?.toLowerCase().includes(q) || 
            p.email?.toLowerCase().includes(q)
        );
    }, [performanceData, searchQuery]);

    const platformStats = useMemo(() => {
        if (!performanceData.length) return null;
        const totalTrades = performanceData.reduce((s, p) => s + p.totalTrades, 0);
        const totalProfit = performanceData.reduce((s, p) => s + p.netProfit, 0);
        const avgWinRate = performanceData.length ? performanceData.reduce((s, p) => s + p.winRate, 0) / performanceData.length : 0;
        const profitable = performanceData.filter(p => p.netProfit > 0).length;
        return { totalTrades, totalProfit, avgWinRate, profitable };
    }, [performanceData]);

    const ActivityRing = ({ value, max, color, size = 60 }: { value: number; max: number; color: string; size?: number }) => {
        const radius = (size - 8) / 2;
        const circumference = 2 * Math.PI * radius;
        const progress = max > 0 ? (value / max) * circumference : 0;
        return (
            <svg width={size} height={size} className="transform -rotate-90">
                <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="currentColor" strokeWidth="3" className="text-white/5" />
                <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth="3" 
                    strokeDasharray={circumference} strokeDashoffset={circumference - progress} strokeLinecap="round"
                    className="transition-all duration-1000" />
            </svg>
        );
    };

    return (
        <div className="space-y-10 pb-24 relative">
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/3 rounded-full blur-[200px]" />
                <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[150px]" />
            </div>

            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="px-3 py-1 rounded-lg bg-primary/10 border border-primary/20">
                                <span className="text-[8px] font-black tracking-[0.3em] uppercase text-primary">Platform Control v3.0</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-profit rounded-full animate-pulse shadow-profit" />
                                <span className="text-[8px] font-black text-profit uppercase tracking-widest">Systems Online</span>
                            </div>
                        </div>
                        <h1 className="text-5xl font-black text-white tracking-tighter uppercase ">
                            Admin <span className="text-primary not-">Control</span>
                        </h1>
                        <p className="text-muted-foreground font-medium text-lg leading-relaxed max-w-xl">
                            Real-time platform analytics. Monitor traders and perform global data synchronization.
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-4 py-3 px-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
                            <div className="text-right">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Last Updated</p>
                                <p className="text-sm font-bold text-white tracking-tight font-mono">{format(new Date(), "PPp")}</p>
                            </div>
                            <div className="h-8 w-px bg-white/10" />
                            <div className="p-2.5 rounded-xl bg-primary/20 text-primary shadow-glow">
                                <Globe className="w-5 h-5 animate-spin" style={{ animationDuration: '8s' }} />
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            <div className="flex items-center gap-3">
                {[
                    { key: 'overview', label: 'Platform Overview', icon: Users },
                    { key: 'performance', label: 'Performance Analytics', icon: BarChart3 }
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key as any)}
                        className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-widest transition-all duration-300 ${
                            activeTab === tab.key 
                                ? 'bg-primary text-primary-foreground shadow-glow' 
                                : 'bg-white/5 text-muted-foreground border border-white/10 hover:bg-white/10 hover:text-white'
                        }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
                <div className="flex-1" />
                <div className="relative">
                    <input 
                        type="text"
                        placeholder="Search traders..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="glass-input px-5 py-3 rounded-2xl text-sm font-medium w-64 pl-10"
                        spellCheck={false}
                    />
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'overview' ? (
                    <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { label: "Total Traders", value: totalUsers, icon: Users, color: "text-primary", bg: "bg-primary/10", glow: "shadow-glow" },
                                { label: "Admin Nodes", value: adminUsers, icon: Shield, color: "text-amber-400", bg: "bg-amber-400/10", glow: "" },
                                { label: "Active (7d)", value: recentUsers, icon: Activity, color: "text-profit", bg: "bg-profit/10", glow: "" },
                                { label: "Active Today", value: activeToday, icon: Zap, color: "text-primary", bg: "bg-primary/10", glow: "" },
                            ].map((stat, i) => (
                                <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                                    <GlassCard className="p-8 rounded-[2rem] border-white/10 relative overflow-hidden group hover:border-primary/20 transition-all">
                                        <div className="relative z-10 flex items-start justify-between">
                                            <div className="space-y-3">
                                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                                                <AnimatedCounter value={stat.value} className="text-4xl text-white" />
                                            </div>
                                            <div className={`p-3.5 rounded-2xl ${stat.bg} ${stat.color} ${stat.glow}`}>
                                                <stat.icon className="w-5 h-5" />
                                            </div>
                                        </div>
                                    </GlassCard>
                                </motion.div>
                            ))}
                        </div>

                        <GlassCard className="rounded-[2.5rem] border-white/10 overflow-hidden relative">
                            <div className="p-8 pb-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-2xl bg-primary/10 text-primary"><Fingerprint className="w-5 h-5" /></div>
                                    <div>
                                        <h3 className="text-xl font-black uppercase tracking-tighter ">Trader Directory</h3>
                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{filteredTraders.length} Nodes Detected</p>
                                    </div>
                                </div>
                            </div>

                            {loading ? (
                                <div className="py-16 flex flex-col items-center justify-center gap-4">
                                    <Cpu className="w-10 h-10 text-primary animate-spin" style={{ animationDuration: '3s' }} />
                                    <p className="text-xs font-black uppercase text-muted-foreground tracking-widest animate-pulse">Scanning Network...</p>
                                </div>
                            ) : (
                                <div className="px-4 pb-4">
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-12 gap-4 px-6 py-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                            <div className="col-span-4">Trader</div>
                                            <div className="col-span-3">Email</div>
                                            <div className="col-span-2">Plan</div>
                                            <div className="col-span-2">Last Active</div>
                                            <div className="col-span-1 text-right">ID</div>
                                        </div>

                                        {filteredTraders.map((trader, i) => (
                                            <motion.div
                                                key={trader.uid}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.02 }}
                                                className="grid grid-cols-12 gap-4 items-center px-6 py-4 rounded-2xl hover:bg-white/5 transition-all cursor-pointer group border border-transparent hover:border-white/10"
                                                onClick={() => navigate(`/admin/trader/${trader.uid}`)}
                                            >
                                                <div className="col-span-4 flex items-center gap-3">
                                                    {trader.photoURL ? (
                                                        <img src={trader.photoURL} alt={trader.displayName} className="w-10 h-10 rounded-xl border-2 border-transparent group-hover:border-primary/50 transition-all" />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-sm border-2 border-transparent group-hover:border-primary/50 transition-all">
                                                            {trader.displayName?.charAt(0) || "T"}
                                                        </div>
                                                    )}
                                                    <span className="font-bold text-sm group-hover:text-primary transition-colors">{trader.displayName}</span>
                                                </div>
                                                <div className="col-span-3 text-muted-foreground text-xs font-medium truncate">{trader.email || "Classified"}</div>
                                                <div className="col-span-2">
                                                    {trader.role === "superadmin" ? (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-400/10 text-amber-400 text-[9px] font-black uppercase tracking-widest border border-amber-400/20"><Crown className="w-3 h-3" /> Admin</span>
                                                    ) : (
                                                        <span className="px-3 py-1 rounded-lg bg-white/5 text-muted-foreground text-[9px] font-black uppercase tracking-widest border border-white/10">Trader</span>
                                                    )}
                                                </div>
                                                <div className="col-span-2 text-xs text-muted-foreground font-mono">
                                                    {trader.lastSeen ? formatDistanceToNow(new Date(trader.lastSeen), { addSuffix: true }) : "Unknown"}
                                                </div>
                                                <div className="col-span-1 text-right text-[10px] font-mono text-muted-foreground/50">{trader.uid.substring(0, 5)}</div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </GlassCard>
                    </motion.div>
                ) : (
                    <motion.div key="performance" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                        {platformStats && (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                {[
                                    { label: "Total Trades", value: platformStats.totalTrades, icon: Activity, color: "text-primary" },
                                    { label: "Platform Profit", value: platformStats.totalProfit, icon: TrendingUp, color: platformStats.totalProfit >= 0 ? "text-profit" : "text-loss", prefix: "$" },
                                    { label: "Avg Win Rate", value: platformStats.avgWinRate, icon: Target, color: platformStats.avgWinRate >= 50 ? "text-profit" : "text-loss", suffix: "%" },
                                    { label: "Growth Nodes", value: platformStats.profitable, icon: Crown, color: "text-amber-400" },
                                ].map((stat, i) => (
                                    <motion.div key={stat.label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }}>
                                        <GlassCard className="p-6 rounded-[2rem] border-white/10 relative overflow-hidden group">
                                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">{stat.label}</p>
                                            <AnimatedCounter 
                                                value={stat.value}
                                                prefix={stat.prefix}
                                                suffix={stat.suffix}
                                                decimals={stat.suffix === '%' ? 1 : 0}
                                                className={`text-3xl ${stat.color}`} 
                                            />
                                            <stat.icon className="absolute bottom-4 right-4 w-8 h-8 text-white/5 group-hover:text-white/10 transition-colors" />
                                        </GlassCard>
                                    </motion.div>
                                ))}
                            </div>
                        )}

                        <GlassCard className="rounded-[2.5rem] border-white/10 overflow-hidden relative">
                            <div className="p-8 pb-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-2xl bg-primary/10 text-primary"><Sparkles className="w-5 h-5" /></div>
                                    <div>
                                        <h3 className="text-xl font-black uppercase tracking-tighter ">Performance Leaderboard</h3>
                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Ranked by Net Profit</p>
                                    </div>
                                </div>
                            </div>

                            {perfLoading ? (
                                <div className="py-16 flex flex-col items-center justify-center gap-4">
                                    <Cpu className="w-10 h-10 text-primary animate-spin" style={{ animationDuration: '3s' }} />
                                    <p className="text-xs font-black uppercase text-muted-foreground tracking-widest animate-pulse">Aggregating Global Metrics...</p>
                                </div>
                            ) : (
                                <div className="px-4 pb-4 space-y-2">
                                    <div className="grid grid-cols-12 gap-4 px-6 py-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                        <div className="col-span-1">#</div>
                                        <div className="col-span-3">Trader</div>
                                        <div className="col-span-2 text-center">Trades</div>
                                        <div className="col-span-2 text-center">Win Rate</div>
                                        <div className="col-span-2 text-right">Net Profit</div>
                                        <div className="col-span-1 text-center">PF</div>
                                        <div className="col-span-1"></div>
                                    </div>

                                    {filteredPerformance.map((perf, i) => (
                                        <motion.div
                                            key={perf.uid}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.03 }}
                                            className="grid grid-cols-12 gap-4 items-center px-6 py-4 rounded-2xl hover:bg-white/5 transition-all cursor-pointer group border border-transparent hover:border-white/10"
                                            onClick={() => navigate(`/admin/trader/${perf.uid}`)}
                                        >
                                            <div className="col-span-1">
                                                <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs bg-white/5 text-muted-foreground">{i + 1}</div>
                                            </div>
                                            <div className="col-span-3 flex items-center gap-3">
                                                {perf.photoURL ? (
                                                    <img src={perf.photoURL} alt={perf.displayName} className="w-10 h-10 rounded-xl" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-xs">
                                                        {perf.displayName?.charAt(0) || "T"}
                                                    </div>
                                                )}
                                                <span className="font-bold text-sm truncate group-hover:text-primary transition-colors">{perf.displayName}</span>
                                            </div>
                                            <div className="col-span-2 text-center font-mono text-sm">{perf.totalTrades}</div>
                                            <div className="col-span-2 text-center font-mono text-sm font-bold text-profit">{perf.winRate}%</div>
                                            <div className="col-span-2 text-right">
                                                <AnimatedCounter value={perf.netProfit} prefix="$" className={`text-lg font-black ${perf.netProfit >= 0 ? 'text-profit' : 'text-loss'}`} />
                                            </div>
                                            <div className="col-span-1 text-center font-mono text-xs">{perf.profitFactor.toFixed(2)}</div>
                                            <div className="col-span-1 flex justify-end"><ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-all" /></div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </GlassCard>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
