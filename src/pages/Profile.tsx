import { useAuth } from "@/contexts/AuthContext";
import { useTrades } from "@/hooks/useTrades";
import { GlassCard } from "@/components/GlassCard";
import { motion } from "framer-motion";
import {
    Trophy, Medal, Star, TrendingUp, Target, Zap, User, Shield, Gem, Crown,
    Flame, Rocket, Briefcase, DollarSign, BarChart, Activity, Globe, Database,
    Landmark, Crosshair, Eye, Scale, RefreshCw, Award, Layers, LogOut, Brain, Lock
} from "lucide-react";
import * as importTrades from "@/components/ImportTrades";
import { getNetProfit, getWinRate } from "@/lib/tradeStore";
import { usePlan } from "@/hooks/usePlan";
import { auth } from "@/lib/firebase";

export default function Profile() {
    const { user } = useAuth();
    const { plan } = usePlan();
    const isUltimate = plan === "ultimate";
    const { trades } = useTrades();

    const netProfit = getNetProfit(trades);
    const winRate = getWinRate(trades);
    const totalTrades = trades.length;

    // Advanced Gamification Logic
    // XP Formula: (Trades * 10) + (Positive Profit * 0.1) + (Win Rate * 20)
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

    const RankIcon = currentRank.icon;

    // Plan Logic
    // const { plan } = usePlan(); // Already defined at top

    const handleLogout = async () => {
        try {
            await auth.signOut();
            // navigate("/auth"); // Handled by AuthContext usually, but safe to redirect if needed
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    return (
        <div className="space-y-8 pb-10">
            {/* Header Section */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl glass p-8"
            >
                <div className={`absolute inset-0 opacity-10 ${currentRank.bg}`} />

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className="absolute top-4 right-4 p-2 rounded-full bg-background/20 hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors z-20"
                    title="Log Out"
                >
                    <LogOut className="w-5 h-5" />
                </button>

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                    {/* Avatar with Rank Border */}
                    <div className="relative">
                        <div className={`h-28 w-28 rounded-full flex items-center justify-center border-4 ${currentRank.borderColor} shadow-[0_0_30px_rgba(0,0,0,0.5)] bg-background/80 backdrop-blur-sm relative z-10`}>
                            {user?.photoURL ? (
                                <img src={user.photoURL} alt="Profile" className="h-full w-full rounded-full object-cover" />
                            ) : (
                                <User className={`h-12 w-12 ${currentRank.color}`} />
                            )}
                        </div>
                        <div className={`absolute -bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-sm font-black uppercase tracking-widest text-white ${currentRank.bg} shadow-lg z-20 whitespace-nowrap`}>
                            {currentRank.name}
                        </div>
                    </div>

                    <div className="flex-1 text-center md:text-left space-y-2">
                        <div className="flex items-center justify-center md:justify-start gap-3">
                            <h1 className="text-4xl font-bold text-foreground tracking-tight">{user?.displayName || "Trader"}</h1>
                            <div className={`p-2 rounded-lg bg-background/50 backdrop-blur-md border ${currentRank.borderColor}`}>
                                <RankIcon className={`w-6 h-6 ${currentRank.color}`} />
                            </div>
                            <div className="px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-xs font-bold uppercase tracking-wider">
                                {plan} Plan
                            </div>
                        </div>
                        <p className="text-muted-foreground text-lg">{user?.email}</p>

                        {/* Level & XP */}
                        <div className="flex items-center justify-center md:justify-start gap-4 text-sm font-medium pt-2">
                            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                                Level {Math.floor(Math.sqrt(totalTrades)) + 1}
                            </span>
                            <span className={`${currentRank.color}`}>
                                {xp.toLocaleString()} XP
                            </span>
                            <span className="text-muted-foreground">
                                {unlockedCount} / {badges.length} Achievements
                            </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="pt-4 max-w-xl">
                            <div className="flex justify-between text-xs mb-2 font-medium">
                                <span className={currentRank.color}>{currentRank.name}</span>
                                <span className="text-muted-foreground">{nextRank ? `Next: ${nextRank.name}` : "Max Rank"}</span>
                            </div>
                            <div className="relative h-3 w-full bg-secondary/50 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    className={`absolute top-0 left-0 h-full ${currentRank.bg} shadow-[0_0_20px_currentColor]`}
                                />
                            </div>
                            {nextRank && (
                                <p className="text-xs text-right text-muted-foreground mt-1.5">
                                    {Math.round(nextThreshold - xp).toLocaleString()} XP to promotion
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Stats Overview */}
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
                <GlassCard className="p-6 flex flex-col items-center justify-center gap-2">
                    <h3 className="text-muted-foreground text-sm font-medium uppercase tracking-wider">Total Trades</h3>
                    <span className="text-4xl font-bold text-foreground">{totalTrades}</span>
                </GlassCard>
                <GlassCard className="p-6 flex flex-col items-center justify-center gap-2">
                    <h3 className="text-muted-foreground text-sm font-medium uppercase tracking-wider">Win Rate</h3>
                    <span className={`text-4xl font-bold ${winRate >= 50 ? "text-profit" : "text-loss"}`}>{winRate}%</span>
                </GlassCard>
                <GlassCard className="p-6 flex flex-col items-center justify-center gap-2">
                    <h3 className="text-muted-foreground text-sm font-medium uppercase tracking-wider">Net Profit</h3>
                    <span className={`text-4xl font-bold ${netProfit >= 0 ? "text-profit" : "text-loss"}`}>
                        ${netProfit.toLocaleString()}
                    </span>
                </GlassCard>
            </motion.div>

            {/* Achievements Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Trophy className="h-6 w-6 text-yellow-500" />
                        <h2 className="text-2xl font-bold text-foreground">Achievements</h2>
                    </div>
                    <span className="text-sm text-muted-foreground">
                        {Math.round((unlockedCount / badges.length) * 100)}% Completed
                    </span>
                </div>

                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
                >
                    {badges.map((badge) => (
                        <motion.div key={badge.id} variants={item}>
                            <GlassCard
                                className={`h-full flex flex-col items-center p-6 text-center transition-all duration-300 hover:scale-[1.02] ${badge.unlocked
                                    ? "bg-primary/5 border-primary/20 shadow-[0_0_20px_-10px_hsl(var(--primary)/0.3)] relative overflow-hidden"
                                    : "opacity-40 grayscale border-dashed"
                                    }`}
                            >
                                {badge.unlocked && <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent" />}

                                <div className={`relative p-4 rounded-full mb-4 ${badge.unlocked ? "bg-primary/20 text-primary ring-4 ring-primary/10" : "bg-secondary text-muted-foreground"}`}>
                                    <badge.icon className="h-8 w-8" />
                                </div>

                                <h3 className={`font-bold text-sm mb-2 ${badge.unlocked ? "text-foreground" : "text-muted-foreground"}`}>
                                    {badge.name}
                                </h3>

                                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                                    {badge.description}
                                </p>
                            </GlassCard>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
            {/* AI Coach & Import */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Weekly Coach - AI Layer */}
                <GlassCard className="p-6 relative overflow-hidden">
                    <div className="flex items-start gap-3 relative z-10">
                        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                            <Brain className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Weekly AI Coach</h3>
                            <p className="text-xs text-muted-foreground mb-4">Personalized feedback based on your recent 20 trades.</p>

                            {!isUltimate ? (
                                <div className="flex flex-col items-center justify-center py-6 text-center">
                                    <Lock className="w-8 h-8 text-primary mb-2" />
                                    <p className="text-sm font-semibold">Upgrade to Ultimate</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="p-3 rounded-lg bg-secondary/30 text-sm">
                                        <span className="font-bold block mb-1 text-profit">What went well:</span>
                                        You maintained a 2:1 Reward ratio on 80% of winning trades. Great discipline!
                                    </div>
                                    <div className="p-3 rounded-lg bg-secondary/30 text-sm">
                                        <span className="font-bold block mb-1 text-loss">Review needed:</span>
                                        Your win rate drops to 18% during the Asian session. Consider avoiding this time.
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </GlassCard>

                {/* Import Section */}
                <importTrades.ImportTrades />
            </div>
        </div>
    );
}

// Need to import Brain, Lock and ImportTrades at top
