import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTrades } from "@/hooks/useTrades";
import { GlassCard } from "@/components/GlassCard";
import { motion } from "framer-motion";
import {
    Trophy, Medal, Star, TrendingUp, Target, Zap, User, Shield, Gem, Crown,
    Flame, Rocket, Briefcase, DollarSign, BarChart, Activity, Globe, Database,
    Landmark, Crosshair, Eye, Scale, RefreshCw, Award, Layers, LogOut, Brain, Lock,
    Fingerprint, Cpu, Search, Terminal, Settings, ShieldCheck, ZapOff, Sparkles
} from "lucide-react";
import * as importTrades from "@/components/ImportTrades";
import { getNetProfit, getWinRate } from "@/lib/tradeStore";
import { usePlan } from "@/hooks/usePlan";
import { auth } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { useThemeSettings, AVAILABLE_FONTS } from "@/contexts/ThemeSettingsContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Profile() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { plan } = usePlan();
    const isUltimate = plan === "ultimate";
    const { trades } = useTrades();
    const { theme, setTheme, fontFamily, setFontFamily } = useThemeSettings();

    const netProfit = getNetProfit(trades);
    const winRate = getWinRate(trades);
    const totalTrades = trades.length;

    // Advanced Gamification Logic
    // XP Formula: (Trades * 15) + (Positive Profit * 0.1) + (Win Rate * 20)
    const xp = Math.floor(
        (totalTrades * 15) +
        (Math.max(0, netProfit) * 0.1) +
        (winRate * 20)
    );

    // Calculate Max Win Streak
    const calculateMaxStreak = () => {
        let max = 0;
        let current = 0;
        // Sort trades by date ascending to calculate streak correcty
        const sorted = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        for (const t of sorted) {
            if (t.profitLoss > 0) {
                current++;
                if (current > max) max = current;
            } else {
                current = 0;
            }
        }
        return max;
    };
    const maxWinStreak = calculateMaxStreak();

    // Ranks Definition with Sub-levels
    const RANKS = [
        { name: "Bronze V", threshold: 0, color: "text-orange-700", borderColor: "border-orange-700/50", bg: "bg-orange-700", icon: Shield },
        { name: "Bronze IV", threshold: 200, color: "text-orange-600", borderColor: "border-orange-600/50", bg: "bg-orange-600", icon: Shield },
        { name: "Bronze III", threshold: 400, color: "text-orange-500", borderColor: "border-orange-500/50", bg: "bg-orange-500", icon: Shield },
        { name: "Bronze II", threshold: 600, color: "text-orange-400", borderColor: "border-orange-400/50", bg: "bg-orange-400", icon: Shield },
        { name: "Bronze I", threshold: 800, color: "text-orange-300", borderColor: "border-orange-300/50", bg: "bg-orange-300", icon: Shield },

        { name: "Silver V", threshold: 1000, color: "text-slate-500", borderColor: "border-slate-500/50", bg: "bg-slate-500", icon: Shield },
        { name: "Silver IV", threshold: 1400, color: "text-slate-400", borderColor: "border-slate-400/50", bg: "bg-slate-400", icon: Shield },
        { name: "Silver III", threshold: 1800, color: "text-slate-300", borderColor: "border-slate-300/50", bg: "bg-slate-300", icon: Shield },
        { name: "Silver II", threshold: 2200, color: "text-slate-200", borderColor: "border-slate-200/50", bg: "bg-slate-200", icon: Shield },
        { name: "Silver I", threshold: 2600, color: "text-white", borderColor: "border-white/50", bg: "bg-white", icon: Shield },

        { name: "Gold V", threshold: 3000, color: "text-yellow-600", borderColor: "border-yellow-600/50", bg: "bg-yellow-600", icon: Shield },
        { name: "Gold IV", threshold: 3500, color: "text-yellow-500", borderColor: "border-yellow-500/50", bg: "bg-yellow-500", icon: Shield },
        { name: "Gold III", threshold: 4000, color: "text-yellow-400", borderColor: "border-yellow-400/50", bg: "bg-yellow-400", icon: Shield },
        { name: "Gold II", threshold: 4500, color: "text-yellow-300", borderColor: "border-yellow-300/50", bg: "bg-yellow-300", icon: Shield },
        { name: "Gold I", threshold: 5000, color: "text-yellow-200", borderColor: "border-yellow-200/50", bg: "bg-yellow-200", icon: Shield },

        { name: "Platinum V", threshold: 6000, color: "text-cyan-600", borderColor: "border-cyan-600/50", bg: "bg-cyan-600", icon: Award },
        { name: "Platinum IV", threshold: 7000, color: "text-cyan-500", borderColor: "border-cyan-500/50", bg: "bg-cyan-500", icon: Award },
        { name: "Platinum III", threshold: 8000, color: "text-cyan-400", borderColor: "border-cyan-400/50", bg: "bg-cyan-400", icon: Award },
        { name: "Platinum II", threshold: 9000, color: "text-cyan-300", borderColor: "border-cyan-300/50", bg: "bg-cyan-300", icon: Award },
        { name: "Platinum I", threshold: 10000, color: "text-cyan-200", borderColor: "border-cyan-200/50", bg: "bg-cyan-200", icon: Award },

        { name: "Diamond V", threshold: 12000, color: "text-blue-600", borderColor: "border-blue-600/50", bg: "bg-blue-600", icon: Gem },
        { name: "Diamond IV", threshold: 14000, color: "text-blue-500", borderColor: "border-blue-500/50", bg: "bg-blue-500", icon: Gem },
        { name: "Diamond III", threshold: 16000, color: "text-blue-400", borderColor: "border-blue-400/50", bg: "bg-blue-400", icon: Gem },
        { name: "Diamond II", threshold: 18000, color: "text-blue-300", borderColor: "border-blue-300/50", bg: "bg-blue-300", icon: Gem },
        { name: "Diamond I", threshold: 20000, color: "text-blue-200", borderColor: "border-blue-200/50", bg: "bg-blue-200", icon: Gem },

        { name: "Crown V", threshold: 25000, color: "text-amber-600", borderColor: "border-amber-600/50", bg: "bg-amber-600", icon: Crown },
        { name: "Crown IV", threshold: 30000, color: "text-amber-500", borderColor: "border-amber-500/50", bg: "bg-amber-500", icon: Crown },
        { name: "Crown III", threshold: 35000, color: "text-amber-400", borderColor: "border-amber-400/50", bg: "bg-amber-400", icon: Crown },
        { name: "Crown II", threshold: 40000, color: "text-amber-300", borderColor: "border-amber-300/50", bg: "bg-amber-300", icon: Crown },
        { name: "Crown I", threshold: 45000, color: "text-amber-200", borderColor: "border-amber-200/50", bg: "bg-amber-200", icon: Crown },

        { name: "Ace", threshold: 50000, color: "text-purple-500", borderColor: "border-purple-500/50", bg: "bg-purple-500", icon: Star },
        { name: "Conqueror", threshold: 100000, color: "text-red-600", borderColor: "border-red-600/50", bg: "bg-red-600", icon: Trophy },
    ];

    const currentRankIndex = RANKS.slice().reverse().findIndex(r => xp >= r.threshold);
    const rankIndex = currentRankIndex >= 0 ? RANKS.length - 1 - currentRankIndex : 0;
    const currentRank = RANKS[rankIndex];
    const nextRank = RANKS[rankIndex + 1];

    const prevThreshold = currentRank.threshold;
    const nextThreshold = nextRank ? nextRank.threshold : xp * 1.5; // Cap if max rank
    const progress = Math.min(100, Math.max(0, ((xp - prevThreshold) / (nextThreshold - prevThreshold)) * 100));

    // Achievements List
    const badges = [
        // Starters
        { id: 1, name: "First Steps", icon: Zap, unlocked: totalTrades > 0, description: "Complete your first trade" },
        { id: 2, name: "Getting Started", icon: Briefcase, unlocked: totalTrades >= 10, description: "Complete 10 trades" },
        { id: 3, name: "Active Trader", icon: Activity, unlocked: totalTrades >= 50, description: "Complete 50 trades" },

        // Volume
        { id: 4, name: "High Volume", icon: Layers, unlocked: totalTrades >= 100, description: "Complete 100 trades" },
        { id: 5, name: "Market Mover", icon: Globe, unlocked: totalTrades >= 500, description: "Complete 500 trades" },
        { id: 6, name: "Legendary", icon: Database, unlocked: totalTrades >= 1000, description: "Complete 1,000 trades" },

        // Profit
        { id: 7, name: "In The Green", icon: TrendingUp, unlocked: netProfit > 0, description: "Achieve positive net profit" },
        { id: 8, name: "Making Bank", icon: DollarSign, unlocked: netProfit >= 1000, description: "$1,000+ Net Profit" },
        { id: 9, name: "High Roller", icon: Gem, unlocked: netProfit >= 10000, description: "$10,000+ Net Profit" },
        { id: 10, name: "Whale", icon: Crown, unlocked: netProfit >= 50000, description: "$50,000+ Net Profit" },
        { id: 11, name: "Millionaire Mindset", icon: Landmark, unlocked: netProfit >= 100000, description: "$100,000+ Net Profit" },

        // Win Rate & Mastery
        { id: 12, name: "Consistent", icon: Scale, unlocked: winRate >= 50 && totalTrades >= 20, description: "50%+ Win Rate (min 20 trades)" },
        { id: 13, name: "Sharpshooter", icon: Target, unlocked: winRate >= 60 && totalTrades >= 20, description: "60%+ Win Rate (min 20 trades)" },
        { id: 14, name: "Sniper", icon: Crosshair, unlocked: winRate >= 70 && totalTrades >= 30, description: "70%+ Win Rate (min 30 trades)" },
        { id: 15, name: "God Mode", icon: Eye, unlocked: winRate >= 80 && totalTrades >= 50, description: "80%+ Win Rate (min 50 trades)" },

        // Streaks
        { id: 16, name: "Heating Up", icon: Flame, unlocked: maxWinStreak >= 3, description: "Win 3 trades in a row" },
        { id: 17, name: "On Fire", icon: Rocket, unlocked: maxWinStreak >= 5, description: "Win 5 trades in a row" },
        { id: 18, name: "Unstoppable", icon: Trophy, unlocked: maxWinStreak >= 10, description: "Win 10 trades in a row" },

        // Time Experience (Simulated by volume for now)
        { id: 19, name: "Veteran", icon: Medal, unlocked: totalTrades >= 200, description: "Seasoned trader with 200+ trades" },
        { id: 20, name: "Master Mind", icon: Star, unlocked: winRate >= 75 && netProfit >= 5000, description: "75% WR & $5k Profit" },
    ];

    const unlockedCount = badges.filter(b => b.unlocked).length;

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    const handleLogout = async () => {
        try {
            await auth.signOut();
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    return (
        <div className="space-y-12 pb-20">
            {/* Trader Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-[2.5rem] p-12 border border-white/10 bg-black/40 backdrop-blur-3xl group shadow-2xl"
            >
                <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:opacity-20 transition-opacity text-primary">
                    <Fingerprint className="w-64 h-64" />
                </div>

                <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
                    {/* Avatar System */}
                    <div className="relative flex-shrink-0">
                        <div className={cn(
                            "h-48 w-48 rounded-[3rem] border-2 bg-black/60 backdrop-blur-xl flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform duration-500 shadow-2xl",
                            currentRank.borderColor
                        )}>
                            {user?.photoURL ? (
                                <img src={user.photoURL} alt="Trader" className="h-full w-full object-cover" />
                            ) : (
                                <User className={cn("h-24 w-24 opacity-20", currentRank.color)} />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        </div>
                        <div className={cn(
                            "absolute -bottom-4 left-1/2 -translate-x-1/2 px-8 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-white shadow-xl z-20 whitespace-nowrap ",
                            currentRank.bg
                        )}>
                            {currentRank.name}
                        </div>
                        {/* Glow Effect */}
                        <div className={cn(
                            "absolute inset-0 blur-[40px] opacity-20 transition-opacity duration-1000 group-hover:opacity-40 rounded-[3rem]",
                            currentRank.bg
                        )} />
                    </div>

                    <div className="flex-1 space-y-8 w-full">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
                            <div className="space-y-2">
                                <div className="flex items-center gap-4">
                                    <h1 className="text-5xl font-black text-white  tracking-tighter uppercase">
                                        {user?.displayName || "Trader"}
                                    </h1>
                                    <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-primary">
                                        <Terminal className="w-5 h-5" />
                                    </div>
                                </div>
                                <p className="text-muted-foreground font-mono text-sm tracking-widest uppercase flex items-center gap-3">
                                    <Globe className="w-4 h-4" /> {user?.email}
                                </p>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Subscription</span>
                                    <div className="px-5 py-2 rounded-2xl bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest  shadow-lg shadow-primary/5">
                                        {plan === 'ultimate' ? 'Institutional' : plan === 'pro' ? 'Professional' : 'Standard'} ACCESS
                                    </div>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white/40 hover:text-loss hover:bg-loss/10 hover:border-loss/30 transition-all shadow-xl group/logout"
                                >
                                    <LogOut className="w-5 h-5 group-hover/logout:-translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>

                        {/* Performance Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Growth Path</span>
                                        <span className={cn("text-lg font-black  uppercase", currentRank.color)}>
                                            {currentRank.name}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-2xl font-black  text-white">{xp.toLocaleString()}</span>
                                        <span className="text-[10px] font-black text-muted-foreground uppercase ml-2 tracking-widest">XP</span>
                                    </div>
                                </div>
                                <div className="relative h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/10">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                        transition={{ duration: 2, ease: "circOut" }}
                                        className={cn("absolute top-0 left-0 h-full shadow-[0_0_15px_currentColor]", currentRank.bg)}
                                    />
                                </div>
                                <div className="flex justify-between text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">
                                    <span>Entry Level</span>
                                    <span>Target: {nextRank?.name || "Apex reached"}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="flex-1 bg-white/5 border border-white/10 rounded-3xl p-5 flex flex-col items-center justify-center text-center transition-colors hover:bg-white/10">
                                    <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-2">Unlocking Progress</span>
                                    <span className="text-2xl font-black  text-white">{unlockedCount} / {badges.length}</span>
                                </div>
                                <div className="flex-1 bg-white/5 border border-white/10 rounded-3xl p-5 flex flex-col items-center justify-center text-center transition-colors hover:bg-white/10">
                                    <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-2">Trader Level</span>
                                    <span className="text-2xl font-black  text-primary">LVL {Math.floor(Math.sqrt(totalTrades)) + 1}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Interface Configuration */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-8"
            >
                <GlassCard className="p-8 border-primary/20 bg-primary/5">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                            <Settings className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-black text-white uppercase tracking-tighter">Theme Selection</h3>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Interface Appearance</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setTheme("light")}
                            className={cn(
                                "flex-1 px-6 py-4 rounded-2xl border transition-all font-black uppercase text-[10px] tracking-widest",
                                theme === "light" 
                                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20" 
                                    : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"
                            )}
                        >
                            Light Mode
                        </button>
                        <button
                            onClick={() => setTheme("dark")}
                            className={cn(
                                "flex-1 px-6 py-4 rounded-2xl border transition-all font-black uppercase text-[10px] tracking-widest",
                                theme === "dark" 
                                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20" 
                                    : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"
                            )}
                        >
                            Dark Mode
                        </button>
                    </div>
                </GlassCard>

                <GlassCard className="p-8 border-indigo-500/20 bg-indigo-500/5">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400">
                            <Sparkles className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-black text-white uppercase tracking-tighter">Typography</h3>
                            <p className="text-[10px] text-indigo-400/60 uppercase tracking-widest">System Font Family</p>
                        </div>
                    </div>
                    <Select value={fontFamily} onValueChange={setFontFamily}>
                        <SelectTrigger className="w-full bg-black/40 border-white/10 rounded-2xl h-14 font-black uppercase text-[10px] tracking-widest">
                            <SelectValue placeholder="Select font" />
                        </SelectTrigger>
                        <SelectContent className="bg-black/90 border-white/10 backdrop-blur-xl rounded-2xl">
                            {AVAILABLE_FONTS.map((font) => (
                                <SelectItem 
                                    key={font.family} 
                                    value={font.family}
                                    className="font-black uppercase text-[10px] tracking-widest focus:bg-primary/20 focus:text-primary"
                                >
                                    {font.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </GlassCard>
            </motion.div>

            {/* Grid Layout: Stats & Achievements */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Left Column: Stats */}
                <div className="space-y-8">
                    <div className="flex items-center gap-3 mb-6">
                        <Activity className="w-5 h-5 text-primary" />
                        <h2 className="text-xl font-black text-white uppercase  tracking-tighter">Performance Overview</h2>
                    </div>
                    <div className="grid grid-cols-1 gap-6">
                        <GlassCard className="p-8 group hover:border-primary/20 transition-all overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                <BarChart className="w-24 h-24" />
                            </div>
                            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">Total trades</h3>
                            <div className="text-5xl font-black  text-white flex items-center gap-4">
                                <AnimatedCounter value={totalTrades} />
                                <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                                    <Layers className="w-6 h-6 text-primary" />
                                </div>
                            </div>
                        </GlassCard>

                        <GlassCard className="p-8 group hover:border-profit/20 transition-all overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity text-profit">
                                <Target className="w-24 h-24" />
                            </div>
                            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">Win rate</h3>
                            <div className={cn("text-5xl font-black  flex items-center gap-4", winRate >= 50 ? "text-profit" : "text-loss")}>
                                <AnimatedCounter value={winRate} suffix="%" />
                                <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                                    <Target className="w-6 h-6" />
                                </div>
                            </div>
                        </GlassCard>

                        <GlassCard className="p-8 group hover:border-profit/20 transition-all overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity text-profit">
                                <DollarSign className="w-24 h-24" />
                            </div>
                            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">Net Profit</h3>
                            <div className={cn("text-5xl font-black  flex items-center gap-4", netProfit >= 0 ? "text-profit" : "text-loss")}>
                                <span className="text-2xl mt-1">$</span>
                                <AnimatedCounter value={netProfit} />
                            </div>
                        </GlassCard>
                    </div>

                    {/* Weekly AI Coach Section */}
                    <GlassCard className="p-8 border-indigo-500/20 bg-indigo-500/5 relative overflow-hidden group">
                        <div className="absolute -top-10 -right-10 opacity-10 group-hover:opacity-20 transition-opacity text-indigo-500 rotate-12">
                            <Brain className="w-48 h-48" />
                        </div>
                        <div className="relative z-10 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                        <Brain className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-white uppercase  tracking-tighter">AI Coach</h3>
                                        <p className="text-[10px] font-black text-indigo-400/60 uppercase tracking-widest">Trading Insights</p>
                                    </div>
                                </div>
                                {!isUltimate && <Lock className="w-4 h-4 text-white/20" />}
                            </div>

                            {!isUltimate ? (
                                <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
                                    <div className="p-4 rounded-full bg-white/5 border border-white/10 text-indigo-400">
                                        <ZapOff className="w-8 h-8" />
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold text-white/60">Module Locked</p>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Institutional Plan Required</p>
                                        </div>
                                        <button
                                            onClick={() => navigate("/plans")}
                                            className="px-6 py-2 bg-indigo-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-transform shadow-lg shadow-indigo-500/20"
                                        >
                                            Elevate Access
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4 font-medium leading-relaxed">
                                    <div className="p-4 rounded-2xl bg-black/40 border border-white/5 text-sm group/tip">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-profit animate-pulse" />
                                            <span className="text-[10px] font-black text-profit uppercase tracking-widest">Performance Gain</span>
                                        </div>
                                        <p className="text-white/70  group-hover/tip:text-white transition-colors">
                                            You maintained a 2:1 Reward ratio on 80% of winning trades. Great discipline!
                                        </p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-black/40 border border-white/5 text-sm group/tip">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-loss animate-pulse" />
                                            <span className="text-[10px] font-black text-loss uppercase tracking-widest">Efficiency Alert</span>
                                        </div>
                                        <p className="text-white/70  group-hover/tip:text-white transition-colors">
                                            Your win rate drops to 18% during the Asian session. Consider session adjustment.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </GlassCard>
                </div>

                {/* Right Columns: Achievements & Import */}
                <div className="xl:col-span-2 space-y-8">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <Trophy className="w-5 h-5 text-yellow-500" />
                            <h2 className="text-xl font-black text-white uppercase  tracking-tighter">Achievement Milestones</h2>
                        </div>
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                            Completion status: {Math.round((unlockedCount / badges.length) * 100)}% Complete
                        </span>
                    </div>

                    <motion.div
                        variants={container}
                        initial="hidden"
                        animate="show"
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                    >
                        {badges.map((badge) => (
                            <motion.div key={badge.id} variants={item}>
                                <GlassCard
                                    className={cn(
                                        "p-6 h-full flex flex-col gap-4 items-center text-center transition-all duration-500 overflow-hidden relative group",
                                        badge.unlocked
                                            ? "border-primary/20 bg-primary/5 shadow-xl shadow-primary/5"
                                            : "opacity-30 grayscale border-dashed border-white/10"
                                    )}
                                >

                                    <div className={cn(
                                        "p-5 rounded-3xl shrink-0 transition-transform duration-500 group-hover:scale-110",
                                        badge.unlocked
                                            ? "bg-primary/20 text-primary border border-primary/30 ring-8 ring-primary/5 shadow-2xl"
                                            : "bg-white/5 text-white/20 border border-white/10"
                                    )}>
                                        <badge.icon className="w-8 h-8" />
                                    </div>

                                    <div className="space-y-1">
                                        <h3 className={cn("font-black uppercase  tracking-tighter text-sm", badge.unlocked ? "text-white" : "text-white/40")}>
                                            {badge.name}
                                        </h3>
                                        <p className="text-[10px] text-muted-foreground leading-relaxed  line-clamp-2">{badge.description}</p>
                                    </div>

                                    {badge.unlocked && (
                                        <div className="absolute bottom-4 right-4 animate-pulse">
                                            <ShieldCheck className="w-4 h-4 text-primary opacity-50" />
                                        </div>
                                    )}
                                </GlassCard>
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* Trade Import System */}
                    <div className="mt-12">
                        <div className="flex items-center gap-3 mb-8">
                            <Settings className="w-5 h-5 text-primary" />
                            <h2 className="text-xl font-black text-white uppercase  tracking-tighter">Trade History Import</h2>
                        </div>
                        <div className="rounded-[2.5rem] overflow-hidden border border-white/5 bg-black/20 p-2 shadow-inner">
                            <importTrades.ImportTrades />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
