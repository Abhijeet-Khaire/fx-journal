import { useEffect, useState, useMemo } from "react";
import { collection, getDocs, orderBy, query, getDoc, doc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "@/lib/firebase";
import { GlassCard } from "@/components/GlassCard";
import { format, formatDistanceToNow } from "date-fns";
import { 
    Users, Key, Clock, Mail, TrendingUp, Activity, Target, ArrowRight, 
    Shield, Cpu, Globe, BarChart3, Zap, Eye, Crown, Fingerprint,
    ArrowUpRight, ArrowDownRight, Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Trade } from "@/lib/tradeTypes";
import { getNetProfit, getWinRate, getProfitFactor, getDrawdownStats } from "@/lib/tradeStore";

interface Trader {
    uid: string;
    email: string;
    displayName: string;
    photoURL: string | null;
    lastSeen: string;
    isAnonymous: boolean;
    role?: string;
}

interface TraderPerformance {
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
    const navigate = useNavigate();
    const [traders, setTraders] = useState<Trader[]>([]);
    const [performanceData, setPerformanceData] = useState<TraderPerformance[]>([]);
    const [loading, setLoading] = useState(true);
    const [perfLoading, setPerfLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'performance'>('overview');
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchTraders = async () => {
            try {
                const trRef = collection(db, "traders");
                const q = query(trRef, orderBy("lastSeen", "desc"));
                const snapshot = await getDocs(q);
                const data = snapshot.docs.map(d => d.data() as Trader);
                setTraders(data);
            } catch (error) {
                console.error("Failed to fetch traders", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTraders();
    }, []);

    const loadPerformanceData = async () => {
        if (performanceData.length > 0 || traders.length === 0) return;
        setPerfLoading(true);
        try {
            const promises = traders.map(async (trader) => {
                // Fetch ALL documents in the trade-history subcollection (main, challenge_1, etc.)
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
        const lastSeenDate = new Date(t.lastSeen);
        const now = new Date();
        return (now.getTime() - lastSeenDate.getTime()) < 1000 * 60 * 60 * 24 * 7;
    }).length;
    const activeToday = traders.filter(t => {
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

    // Platform aggregate stats
    const platformStats = useMemo(() => {
        if (!performanceData.length) return null;
        const totalTrades = performanceData.reduce((s, p) => s + p.totalTrades, 0);
        const totalProfit = performanceData.reduce((s, p) => s + p.netProfit, 0);
        const avgWinRate = performanceData.length ? performanceData.reduce((s, p) => s + p.winRate, 0) / performanceData.length : 0;
        const profitable = performanceData.filter(p => p.netProfit > 0).length;
        return { totalTrades, totalProfit, avgWinRate, profitable };
    }, [performanceData]);

    // Mini Activity Ring SVG
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
            {/* Background Ambience */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/3 rounded-full blur-[200px]" />
                <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[150px]" />
            </div>

            {/* Admin Control Header */}
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
                        <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic">
                            Admin <span className="text-primary not-italic">Control</span>
                        </h1>
                        <p className="text-muted-foreground font-medium text-lg leading-relaxed max-w-xl">
                            Real-time platform analytics. Monitor traders, analyze performance metrics, and identify trading patterns.
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

            {/* Tab Switcher */}
            <div className="flex items-center gap-3">
                {[
                    { key: 'overview', label: 'Platform Overview', icon: Users },
                    { key: 'performance', label: 'Performance Analytics', icon: BarChart3 }
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => {
                            setActiveTab(tab.key as any);
                            if (tab.key === 'performance') loadPerformanceData();
                        }}
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

                {/* Search */}
                <div className="relative">
                    <input 
                        type="text"
                        placeholder="Search traders..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="glass-input px-5 py-3 rounded-2xl text-sm font-medium w-64 pl-10"
                        spellCheck={false}
                    />
                    <Eye className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'overview' ? (
                    <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                        
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { label: "Total Traders", value: totalUsers, icon: Users, color: "text-primary", bg: "bg-primary/10", glow: "shadow-glow" },
                                { label: "Admin Nodes", value: adminUsers, icon: Shield, color: "text-amber-400", bg: "bg-amber-400/10", glow: "" },
                                { label: "Active (7d)", value: recentUsers, icon: Activity, color: "text-profit", bg: "bg-profit/10", glow: "" },
                                { label: "Active Today", value: activeToday, icon: Zap, color: "text-primary", bg: "bg-primary/10", glow: "" },
                            ].map((stat, i) => (
                                <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                                    <GlassCard className="p-8 rounded-[2rem] border-white/10 relative overflow-hidden group hover:border-primary/20 transition-all">
                                        <div className="absolute -top-6 -right-6 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
                                        <div className="relative z-10 flex items-start justify-between">
                                            <div className="space-y-3">
                                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                                                <p className="text-4xl font-black tracking-tighter text-white italic">{stat.value}</p>
                                            </div>
                                            <div className={`p-3.5 rounded-2xl ${stat.bg} ${stat.color} ${stat.glow}`}>
                                                <stat.icon className="w-5 h-5" />
                                            </div>
                                        </div>
                                        {/* Mini Ring */}
                                        <div className="absolute bottom-3 right-3 opacity-20 group-hover:opacity-40 transition-opacity">
                                            <ActivityRing value={stat.value} max={totalUsers || 1} color="hsl(var(--primary))" size={40} />
                                        </div>
                                    </GlassCard>
                                </motion.div>
                            ))}
                        </div>

                        {/* Activity Distribution Chart */}
                        <GlassCard className="p-8 rounded-[2.5rem] border-white/10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-full h-full circuit-pattern opacity-[0.03] pointer-events-none" />
                            <div className="flex items-center justify-between mb-8 relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                                        <BarChart3 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black uppercase tracking-tighter italic">User Activity Distribution</h3>
                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Network Signal Analysis</p>
                                    </div>
                                </div>
                                <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[8px] font-black text-muted-foreground uppercase tracking-widest">
                                    Last 30 Days
                                </div>
                            </div>

                            {/* SVG Bar Chart */}
                            <div className="relative z-10 h-48 flex items-end gap-1.5">
                                {traders.slice(0, 30).map((trader, i) => {
                                    const lastSeen = new Date(trader.lastSeen);
                                    const daysSince = Math.max(1, Math.floor((Date.now() - lastSeen.getTime()) / (1000 * 60 * 60 * 24)));
                                    const recency = Math.max(5, 100 - daysSince * 3);
                                    const isActive = daysSince <= 7;
                                    return (
                                        <motion.div
                                            key={trader.uid}
                                            initial={{ height: 0 }}
                                            animate={{ height: `${recency}%` }}
                                            transition={{ delay: i * 0.02, duration: 0.5 }}
                                            className={`flex-1 rounded-t-lg transition-all cursor-pointer group/bar relative ${
                                                isActive ? 'bg-primary/60 hover:bg-primary' : 'bg-white/10 hover:bg-white/20'
                                            }`}
                                            title={`${trader.displayName} — Last seen ${daysSince}d ago`}
                                        >
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap">
                                                <span className="text-[8px] font-black text-primary bg-black/80 px-2 py-1 rounded-lg border border-white/10">
                                                    {trader.displayName?.split(' ')[0]}
                                                </span>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                            <div className="flex items-center justify-between mt-4 text-[9px] font-black text-muted-foreground uppercase tracking-widest relative z-10">
                                <span>Most Recent</span>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-primary/60" /> Active (7d)</div>
                                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-white/10" /> Inactive</div>
                                </div>
                                <span>Least Recent</span>
                            </div>
                        </GlassCard>

                        {/* Users Table */}
                        <GlassCard className="rounded-[2.5rem] border-white/10 overflow-hidden relative">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                            <div className="p-8 pb-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                                        <Fingerprint className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black uppercase tracking-tighter italic">Trader Directory</h3>
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
                                        {/* Table Header */}
                                        <div className="grid grid-cols-12 gap-4 px-6 py-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                            <div className="col-span-4">Trader</div>
                                            <div className="col-span-3">Email Address</div>
                                            <div className="col-span-2">Plan</div>
                                            <div className="col-span-2">Last Active</div>
                                            <div className="col-span-1 text-right">User ID</div>
                                        </div>

                                        {/* Table Rows */}
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
                                                <div className="col-span-3 flex items-center gap-2 text-muted-foreground text-xs font-medium">
                                                    <Mail className="w-3.5 h-3.5 opacity-50" />
                                                    <span className="truncate">{trader.email || "Classified"}</span>
                                                </div>
                                                <div className="col-span-2">
                                                    {trader.role === "superadmin" ? (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-400/10 text-amber-400 text-[9px] font-black uppercase tracking-widest border border-amber-400/20">
                                                            <Crown className="w-3 h-3" /> Admin
                                                        </span>
                                                    ) : (
                                                        <span className="px-3 py-1 rounded-lg bg-white/5 text-muted-foreground text-[9px] font-black uppercase tracking-widest border border-white/10">
                                                            Trader
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="col-span-2 text-xs text-muted-foreground font-mono">
                                                    {trader.lastSeen ? formatDistanceToNow(new Date(trader.lastSeen), { addSuffix: true }) : "Unknown"}
                                                </div>
                                                <div className="col-span-1 text-right">
                                                    <span className="text-[10px] font-mono text-muted-foreground/50 group-hover:text-primary transition-colors">{trader.uid.substring(0, 8)}</span>
                                                </div>
                                            </motion.div>
                                        ))}
                                        {filteredTraders.length === 0 && (
                                            <div className="py-16 text-center">
                                                <Target className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                                                <p className="text-xs font-black uppercase text-muted-foreground tracking-widest">No Traders Found</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </GlassCard>
                    </motion.div>
                ) : (
                    <motion.div key="performance" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                        
                        {/* Platform-Wide Aggregate Cards */}
                        {platformStats && (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                {[
                                    { label: "Total Trades", value: platformStats.totalTrades.toLocaleString(), icon: Activity, color: "text-primary" },
                                    { label: "Total Platform Profit", value: `${platformStats.totalProfit >= 0 ? '+' : ''}$${platformStats.totalProfit.toFixed(0)}`, icon: TrendingUp, color: platformStats.totalProfit >= 0 ? "text-profit" : "text-loss" },
                                    { label: "Avg Win Rate", value: `${platformStats.avgWinRate.toFixed(1)}%`, icon: Target, color: platformStats.avgWinRate >= 50 ? "text-profit" : "text-loss" },
                                    { label: "Profitable Traders", value: `${platformStats.profitable}/${performanceData.length}`, icon: Crown, color: "text-amber-400" },
                                ].map((stat, i) => (
                                    <motion.div key={stat.label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }}>
                                        <GlassCard className="p-6 rounded-[2rem] border-white/10 relative overflow-hidden group">
                                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">{stat.label}</p>
                                            <p className={`text-3xl font-black tracking-tighter italic ${stat.color}`}>{stat.value}</p>
                                            <stat.icon className="absolute bottom-4 right-4 w-8 h-8 text-white/5 group-hover:text-white/10 transition-colors" />
                                        </GlassCard>
                                    </motion.div>
                                ))}
                            </div>
                        )}

                        {/* Profit Distribution SVG Chart */}
                        {performanceData.length > 0 && (
                            <GlassCard className="p-8 rounded-[2.5rem] border-white/10 relative overflow-hidden">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="p-3 rounded-2xl bg-primary/10 text-primary"><TrendingUp className="w-5 h-5" /></div>
                                    <div>
                                        <h3 className="text-xl font-black uppercase tracking-tighter italic">Yield Distribution</h3>
                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Net Profit Per Trader</p>
                                    </div>
                                </div>

                                <div className="h-56 flex gap-2 relative">
                                    {/* Zero Line */}
                                    <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-white/10 z-0" />
                                    
                                    {performanceData.map((perf, i) => {
                                        const maxAbs = Math.max(...performanceData.map(p => Math.abs(p.netProfit)), 1);
                                        const heightPercent = Math.min(50, Math.abs(perf.netProfit) / maxAbs * 50);
                                        const isPositive = perf.netProfit >= 0;
                                        return (
                                            <div key={perf.uid} className="flex-1 h-full relative group/bar cursor-pointer" onClick={() => navigate(`/admin/trader/${perf.uid}`)}>
                                                <motion.div
                                                    initial={{ height: 0 }}
                                                    animate={{ height: `${heightPercent}%` }}
                                                    transition={{ delay: i * 0.03, duration: 0.6 }}
                                                    className={`absolute left-0 right-0 rounded-lg transition-all ${
                                                        isPositive 
                                                            ? 'bg-profit/50 group-hover/bar:bg-profit bottom-1/2' 
                                                            : 'bg-loss/50 group-hover/bar:bg-loss top-1/2'
                                                    }`}
                                                    style={{ minHeight: '4px' }}
                                                    title={`${perf.displayName}: $${perf.netProfit.toFixed(2)}`}
                                                >
                                                    <div className={`absolute left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap z-20 ${isPositive ? '-top-10' : '-bottom-10'}`}>
                                                        <div className="text-[8px] font-black bg-black/90 px-2 py-1 rounded-lg border border-white/10 text-center">
                                                            <p className="text-white">{perf.displayName?.split(' ')[0]}</p>
                                                            <p className={isPositive ? 'text-profit' : 'text-loss'}>${perf.netProfit.toFixed(0)}</p>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="flex items-center justify-center mt-4 gap-6 text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-profit/50" /> Profitable</div>
                                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-loss/50" /> In Drawdown</div>
                                </div>
                            </GlassCard>
                        )}

                        {/* Performance Leaderboard */}
                        <GlassCard className="rounded-[2.5rem] border-white/10 overflow-hidden relative">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                            <div className="p-8 pb-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-2xl bg-primary/10 text-primary"><Sparkles className="w-5 h-5" /></div>
                                    <div>
                                        <h3 className="text-xl font-black uppercase tracking-tighter italic">Performance Leaderboard</h3>
                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Ranked by Net Profit</p>
                                    </div>
                                </div>
                            </div>

                            {perfLoading ? (
                                <div className="py-16 flex flex-col items-center justify-center gap-4">
                                    <Cpu className="w-10 h-10 text-primary animate-spin" style={{ animationDuration: '3s' }} />
                                    <p className="text-xs font-black uppercase text-muted-foreground tracking-widest animate-pulse">Aggregating Neural Data...</p>
                                </div>
                            ) : (
                                <div className="px-4 pb-4 space-y-2">
                                    {/* Header */}
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
                                                {i < 3 ? (
                                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm ${
                                                        i === 0 ? 'bg-amber-400/20 text-amber-400 border border-amber-400/30' :
                                                        i === 1 ? 'bg-gray-300/20 text-gray-300 border border-gray-300/30' :
                                                        'bg-amber-700/20 text-amber-700 border border-amber-700/30'
                                                    }`}>
                                                        {i + 1}
                                                    </div>
                                                ) : (
                                                    <span className="text-sm font-mono text-muted-foreground/50 pl-2">{i + 1}</span>
                                                )}
                                            </div>
                                            <div className="col-span-3 flex items-center gap-3">
                                                {perf.photoURL ? (
                                                    <img src={perf.photoURL} alt={perf.displayName} className="w-10 h-10 rounded-xl border-2 border-transparent group-hover:border-primary/50 transition-all" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-sm border-2 border-transparent group-hover:border-primary/50 transition-all">
                                                        {perf.displayName?.charAt(0) || "T"}
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-bold text-sm group-hover:text-primary transition-colors">{perf.displayName}</p>
                                                    <p className="text-[10px] text-muted-foreground truncate max-w-[150px]">{perf.email}</p>
                                                </div>
                                            </div>
                                            <div className="col-span-2 text-center">
                                                <span className="font-mono font-bold text-sm">{perf.totalTrades}</span>
                                            </div>
                                            <div className="col-span-2">
                                                <div className="flex items-center justify-center gap-2">
                                                    <div className="w-16 h-2 bg-white/5 rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${perf.winRate}%` }}
                                                            transition={{ delay: i * 0.05, duration: 0.8 }}
                                                            className={`h-full rounded-full ${perf.winRate >= 50 ? 'bg-profit' : 'bg-loss'}`}
                                                        />
                                                    </div>
                                                    <span className={`font-mono text-xs font-black ${perf.winRate >= 50 ? 'text-profit' : 'text-loss'}`}>
                                                        {perf.winRate}%
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="col-span-2 text-right">
                                                <span className={`font-mono text-lg font-black tracking-tighter ${perf.netProfit >= 0 ? 'text-profit' : 'text-loss'}`}>
                                                    {perf.netProfit >= 0 ? '+' : ''}${perf.netProfit.toFixed(0)}
                                                </span>
                                            </div>
                                            <div className="col-span-1 text-center">
                                                <span className={`font-mono text-xs font-bold px-2 py-1 rounded-lg ${
                                                    perf.profitFactor >= 2 ? 'bg-profit/10 text-profit' :
                                                    perf.profitFactor >= 1 ? 'bg-primary/10 text-primary' :
                                                    'bg-loss/10 text-loss'
                                                }`}>
                                                    {perf.profitFactor.toFixed(1)}
                                                </span>
                                            </div>
                                            <div className="col-span-1 flex justify-end">
                                                <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                                            </div>
                                        </motion.div>
                                    ))}
                                    {filteredPerformance.length === 0 && (
                                        <div className="py-16 text-center">
                                            <Target className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                                            <p className="text-sm font-black uppercase text-muted-foreground tracking-widest">No Performance Data</p>
                                            <p className="text-xs text-muted-foreground mt-2">Traders haven't logged any trades yet.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </GlassCard>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
