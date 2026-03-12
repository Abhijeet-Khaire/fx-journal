import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { useTrades } from "@/hooks/useTrades";
import { Trade } from "@/lib/tradeTypes";
import {
    Trophy, Target, AlertCircle, ShieldCheck, TrendingUp, TrendingDown, Calendar,
    Zap, Plus, Trash2, BarChart3, Save, Edit3, CheckCircle2, XCircle,
    Cpu, DollarSign, Activity, Shield, Loader2
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { useEffect } from "react";
import { getTradeQuality } from "@/lib/tradeStore";
import { AnimatePresence } from "framer-motion";

interface ChallengeConfig {
    id: string;
    name: string;
    firmName: string;
    accountSize: number;
    profitTarget: number;
    dailyDrawdownLimit: number;
    maxDrawdownLimit: number;
    startDate: string;
    endDate: string;
    minTradingDays: number;
    phase: string;
    isActive: boolean;
}

const DEFAULT_CHALLENGE: Omit<ChallengeConfig, 'id'> = {
    name: "My Challenge",
    firmName: "FTMO",
    accountSize: 100000,
    profitTarget: 10000,
    dailyDrawdownLimit: 5000,
    maxDrawdownLimit: 10000,
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    minTradingDays: 4,
    phase: "Phase 1",
    isActive: true,
};

const FIRM_PRESETS: Record<string, Partial<ChallengeConfig>> = {
    "FTMO": { profitTarget: 10000, dailyDrawdownLimit: 5000, maxDrawdownLimit: 10000, minTradingDays: 4, accountSize: 100000 },
    "MFF": { profitTarget: 8000, dailyDrawdownLimit: 5000, maxDrawdownLimit: 12000, minTradingDays: 5, accountSize: 100000 },
    "TFT": { profitTarget: 8000, dailyDrawdownLimit: 4000, maxDrawdownLimit: 8000, minTradingDays: 3, accountSize: 100000 },
    "Funding Pips (Phase 1)": { profitTarget: 8000, dailyDrawdownLimit: 5000, maxDrawdownLimit: 10000, minTradingDays: 0, accountSize: 100000 },
    "Funding Pips (Phase 2)": { profitTarget: 5000, dailyDrawdownLimit: 5000, maxDrawdownLimit: 10000, minTradingDays: 0, accountSize: 100000 },
    "Goat Funded (Phase 1)": { profitTarget: 8000, dailyDrawdownLimit: 4000, maxDrawdownLimit: 8000, minTradingDays: 0, accountSize: 100000 },
    "Goat Funded (Phase 2)": { profitTarget: 5000, dailyDrawdownLimit: 4000, maxDrawdownLimit: 8000, minTradingDays: 0, accountSize: 100000 },
    "Custom": {},
};

export default function ChallengeTracker() {
    const { trades } = useTrades();
    const { user } = useAuth();
    const [challenges, setChallenges] = useState<ChallengeConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<Omit<ChallengeConfig, 'id'>>(DEFAULT_CHALLENGE);

    useEffect(() => {
        const fetchChallenges = async () => {
            if (!user) return;
            try {
                const docRef = doc(db, "traders", user.uid, "challenges", "config");
                const docSnap = await getDoc(docRef);
                if (docSnap.exists() && docSnap.data().data) {
                    setChallenges(docSnap.data().data);
                }
            } catch (error) {
                console.error("Error fetching challenges:", error);
                toast.error("Failed to load challenges.");
            } finally {
                setLoading(false);
            }
        };
        fetchChallenges();
    }, [user]);

    const saveToStorage = async (data: ChallengeConfig[]) => {
        if (!user) return;
        try {
            await setDoc(doc(db, "traders", user.uid, "challenges", "config"), { data }, { merge: true });
            setChallenges(data);
        } catch (error) {
            console.error("Error saving challenges:", error);
            toast.error("Failed to save changes.");
            throw error; // Re-throw to prevent UI optimistic update on failure
        }
    };

    const handleSubmit = async () => {
        if (!form.name || !form.profitTarget) {
            toast.error("Please fill in challenge name and profit target.");
            return;
        }

        try {
            if (editingId) {
                const updated = challenges.map(c => c.id === editingId ? { ...form, id: editingId } : c);
                await saveToStorage(updated);
                toast.success("Challenge updated!");
            } else {
                const newId = `ch_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
                const newChallenge: ChallengeConfig = { ...form, id: newId };
                await saveToStorage([...challenges, newChallenge]);
                toast.success("Challenge created!");
            }
            setForm(DEFAULT_CHALLENGE);
            setShowForm(false);
            setEditingId(null);
        } catch (error) {
            // Error handled in saveToStorage
        }
    };

    const handleEdit = (c: ChallengeConfig) => {
        setForm({ ...c });
        setEditingId(c.id);
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        try {
            await saveToStorage(challenges.filter(c => c.id !== id));
            toast.success("Challenge deleted.");
        } catch (error) {
            // Error handled in saveToStorage
        }
    };

    const handlePreset = (firmName: string) => {
        const preset = FIRM_PRESETS[firmName];
        setForm(f => ({ ...f, firmName, ...preset }));
    };

    const update = (key: string, value: any) => setForm(f => ({ ...f, [key]: value }));

    return (
        <div className="space-y-10 pb-24 relative">
            {/* Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-amber-400/3 rounded-full blur-[200px]" />
                <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[150px]" />
            </div>

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                <div className="flex items-center gap-3 mb-2">
                    <div className="px-3 py-1 rounded-lg bg-amber-400/10 border border-amber-400/20">
                        <span className="text-[8px] font-black tracking-[0.3em] uppercase text-amber-400">Prop Firm Evaluation</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-profit rounded-full animate-pulse shadow-profit" />
                        <span className="text-[8px] font-black text-profit uppercase tracking-widest">Tracking</span>
                    </div>
                </div>
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic">
                            Challenge <span className="text-amber-400 not-italic">Tracker</span>
                        </h1>
                        <p className="text-muted-foreground font-medium text-lg leading-relaxed max-w-xl mt-2">
                            Monitor your prop firm evaluations in real-time. Track profit targets, drawdown limits, and trading days across multiple challenges.
                        </p>
                    </div>
                    {!loading && (
                        <button
                            onClick={() => { setShowForm(true); setEditingId(null); setForm(DEFAULT_CHALLENGE); }}
                            className="flex items-center gap-2.5 px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-widest bg-amber-400 text-black hover:brightness-110 shadow-lg shadow-amber-400/20 hover:scale-[1.02] active:scale-[0.98] transition-all shrink-0"
                        >
                            <Plus className="w-5 h-5" />
                            New Challenge
                        </button>
                    )}
                </div>
            </motion.div>

            {/* Loading State */}
            {loading && (
                <div className="flex justify-center items-center py-24">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400"></div>
                </div>
            )}

            {/* Create/Edit Form */}
            {showForm && !loading && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <GlassCard className="p-8 rounded-[2.5rem] border-amber-400/10 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 rounded-2xl bg-amber-400/10 text-amber-400">
                                <Edit3 className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tighter italic">
                                    {editingId ? "Edit" : "Configure"} Challenge
                                </h3>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Set your evaluation parameters</p>
                            </div>
                        </div>

                        {/* Firm Presets */}
                        <div className="mb-6">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3">Quick Presets</p>
                            <div className="flex flex-wrap gap-2">
                                {Object.keys(FIRM_PRESETS).map(firm => (
                                    <button
                                        key={firm}
                                        onClick={() => handlePreset(firm)}
                                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${form.firmName === firm
                                                ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20'
                                                : 'bg-white/5 text-muted-foreground border border-white/10 hover:bg-white/10 hover:text-white'
                                            }`}
                                    >
                                        {firm}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Form Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
                            {[
                                { key: "name", label: "Challenge Name", type: "text", placeholder: "e.g. FTMO $100k Phase 1" },
                                { key: "firmName", label: "Firm Name", type: "text", placeholder: "e.g. FTMO" },
                                { key: "phase", label: "Phase", type: "text", placeholder: "e.g. Phase 1, Verification" },
                                { key: "accountSize", label: "Account Size ($)", type: "number", placeholder: "100000" },
                                { key: "profitTarget", label: "Profit Target ($)", type: "number", placeholder: "10000" },
                                { key: "dailyDrawdownLimit", label: "Daily DD Limit ($)", type: "number", placeholder: "5000" },
                                { key: "maxDrawdownLimit", label: "Max DD Limit ($)", type: "number", placeholder: "10000" },
                                { key: "minTradingDays", label: "Min Trading Days", type: "number", placeholder: "4" },
                                { key: "startDate", label: "Start Date", type: "date", placeholder: "" },
                                { key: "endDate", label: "End Date (Optional)", type: "date", placeholder: "" },
                            ].map(field => (
                                <div key={field.key} className="space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">{field.label}</label>
                                    <input
                                        type={field.type}
                                        value={(form as any)[field.key] || ""}
                                        onChange={e => update(field.key, field.type === "number" ? parseFloat(e.target.value) || 0 : e.target.value)}
                                        placeholder={field.placeholder}
                                        className="glass-input w-full px-4 py-3 text-sm rounded-xl font-medium"
                                        spellCheck={false}
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center gap-3">
                            <button onClick={handleSubmit} className="flex items-center gap-2 px-8 py-3 rounded-2xl text-sm font-black uppercase tracking-widest bg-amber-400 text-black hover:brightness-110 transition-all">
                                <Save className="w-4 h-4" /> {editingId ? "Update" : "Create"} Challenge
                            </button>
                            <button onClick={() => { setShowForm(false); setEditingId(null); }} className="px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-widest bg-white/5 text-muted-foreground border border-white/10 hover:bg-white/10 transition-all">
                                Cancel
                            </button>
                        </div>
                    </GlassCard>
                </motion.div>
            )}

            {/* Challenge Cards */}
            {!loading && challenges.length === 0 && !showForm ? (
                <GlassCard className="p-16 rounded-[2.5rem] border-white/10 text-center">
                    <Trophy className="w-16 h-16 text-muted-foreground/20 mx-auto mb-6" />
                    <h3 className="text-2xl font-black uppercase tracking-tighter italic text-white mb-2">No Active Challenges</h3>
                    <p className="text-muted-foreground text-sm max-w-md mx-auto mb-8">
                        Start tracking your prop firm evaluation by creating a new challenge. Set your profit target, drawdown limits, and evaluation parameters.
                    </p>
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-widest bg-amber-400 text-black hover:brightness-110 shadow-lg shadow-amber-400/20 transition-all mx-auto"
                    >
                        <Plus className="w-5 h-5" />
                        Create Your First Challenge
                    </button>
                </GlassCard>
            ) : (
                <div className="space-y-8">
                    {!loading && challenges.map((challenge, idx) => (
                        <ChallengeCard key={challenge.id} challenge={challenge} index={idx} onEdit={handleEdit} onDelete={handleDelete} />
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Challenge Card ────────────────────────────────
function ChallengeCard({ challenge, index, onEdit, onDelete }: {
    challenge: ChallengeConfig;
    index: number;
    onEdit: (c: ChallengeConfig) => void;
    onDelete: (id: string) => void;
}) {
    const c = challenge;

    const { user } = useAuth();
    const { deleteTrade } = useTrades();
    const [challengeTrades, setChallengeTrades] = useState<Trade[]>([]);
    const [loadingTrades, setLoadingTrades] = useState(true);
    const [showTrades, setShowTrades] = useState(false);

    // Fetch trades explicitly for this challenge
    useEffect(() => {
        if (!user) return;
        
        const docRef = doc(db, "traders", user.uid, "trade-history", `challenge_${c.id}`);
        const unsubscribe = onSnapshot(docRef, (docSnapshot) => {
            if (docSnapshot.exists()) {
                const rawTrades = docSnapshot.data().trades || [];
                const parsedTrades = rawTrades.map((t: any) => ({
                    ...t,
                    profitLoss: Number(t.profitLoss ?? t.profit ?? 0),
                    date: typeof t.date === 'string' ? t.date : new Date(t.date?.seconds * 1000 || Date.now()).toISOString().split('T')[0],
                }));
                setChallengeTrades(parsedTrades.sort((a,b) => new Date(b.date + "T" + b.time).getTime() - new Date(a.date + "T" + a.time).getTime()));
            } else {
                setChallengeTrades([]);
            }
            setLoadingTrades(false);
        });

        return () => unsubscribe();
    }, [user, c.id]);

    const today = new Date().toISOString().split("T")[0];
    const todayTrades = challengeTrades.filter(t => t.date === today);
    const todayPnL = todayTrades.reduce((s, t) => s + t.profitLoss, 0);
    const totalPnL = challengeTrades.reduce((s, t) => s + t.profitLoss, 0);
    const daysTraded = new Set(challengeTrades.map(t => t.date)).size;
    const wins = challengeTrades.filter(t => t.profitLoss > 0).length;
    const losses = challengeTrades.filter(t => t.profitLoss < 0).length;
    const rulesFollowed = challengeTrades.filter(t => t.rulesFollowed).length;

    const profitProgress = Math.min(100, Math.max(0, (totalPnL / c.profitTarget) * 100));
    const dailyDDProgress = Math.min(100, Math.max(0, (Math.abs(Math.min(0, todayPnL)) / c.dailyDrawdownLimit) * 100));
    const maxDDUsed = Math.min(100, Math.max(0, (Math.abs(Math.min(0, totalPnL)) / c.maxDrawdownLimit) * 100));
    const currentEquity = c.accountSize + totalPnL;

    const highestWinningTrade = challengeTrades.reduce((max, t) => Math.max(max, t.profitLoss), 0);
    const consistencyWarning = totalPnL > 0 && highestWinningTrade > (totalPnL * 0.5); // 50% consistency rule

    // Equity curve data
    const equityCurve = useMemo(() => {
        if (!challengeTrades.length) return [];
        const sorted = [...challengeTrades].sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());
        let cum = 0;
        return sorted.map(t => { cum += t.profitLoss; return cum; });
    }, [challengeTrades]);

    const isProfitTargetHit = totalPnL >= c.profitTarget;
    const isDailyDDBreached = todayPnL <= -(c.dailyDrawdownLimit);
    const isMaxDDBreached = totalPnL <= -(c.maxDrawdownLimit);
    const isMinDaysHit = daysTraded >= c.minTradingDays;

    const challengeStatus = isMaxDDBreached || isDailyDDBreached
        ? "FAILED"
        : isProfitTargetHit && isMinDaysHit
            ? "PASSED"
            : "IN PROGRESS";

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
            <GlassCard className="rounded-[2.5rem] border-white/10 overflow-hidden relative">
                {/* Top gradient bar */}
                <div className={`h-1.5 w-full ${challengeStatus === "PASSED" ? "bg-gradient-to-r from-profit via-profit/60 to-profit" :
                        challengeStatus === "FAILED" ? "bg-gradient-to-r from-loss via-loss/60 to-loss" :
                            "bg-gradient-to-r from-transparent via-amber-400/40 to-transparent"
                    }`} />

                {/* Header */}
                <div className="p-8 pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className={`p-4 rounded-2xl ${challengeStatus === "PASSED" ? "bg-profit/10 text-profit" :
                                challengeStatus === "FAILED" ? "bg-loss/10 text-loss" :
                                    "bg-amber-400/10 text-amber-400"
                            }`}>
                            <Trophy className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black uppercase tracking-tighter italic">{c.name}</h3>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{c.firmName} • {c.phase}</span>
                                <span className={`px-2.5 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${challengeStatus === "PASSED" ? "bg-profit/10 text-profit border-profit/20" :
                                        challengeStatus === "FAILED" ? "bg-loss/10 text-loss border-loss/20" :
                                            "bg-amber-400/10 text-amber-400 border-amber-400/20"
                                    }`}>
                                    {challengeStatus}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setShowTrades(!showTrades)} className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all text-xs font-bold uppercase tracking-widest ${showTrades ? 'bg-amber-400 border-amber-400 text-black' : 'bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10'}`}>
                            <Activity className="w-4 h-4" /> Trades {challengeTrades.length > 0 && <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] ${showTrades ? 'bg-black/20' : 'bg-white/10'}`}>{challengeTrades.length}</span>}
                        </button>
                        <Link to={`/add-trade?challengeId=${c.id}`} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-muted-foreground hover:text-primary hover:bg-primary/10 hover:border-primary/20 transition-all text-xs font-bold uppercase tracking-widest">
                            <Plus className="w-4 h-4" /> Add
                        </Link>
                        <button onClick={() => onEdit(c)} className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-muted-foreground hover:text-primary hover:bg-primary/10 hover:border-primary/20 transition-all">
                            <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => onDelete(c.id)} className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-muted-foreground hover:text-loss hover:bg-loss/10 hover:border-loss/20 transition-all">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="p-8 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {[
                        { label: "Equity", value: `$${currentEquity.toFixed(0)}`, color: totalPnL >= 0 ? "text-profit" : "text-loss", icon: DollarSign },
                        { label: "Net P/L", value: `${totalPnL >= 0 ? '+' : ''}$${totalPnL.toFixed(2)}`, color: totalPnL >= 0 ? "text-profit" : "text-loss", icon: TrendingUp },
                        { label: "Today P/L", value: `${todayPnL >= 0 ? '+' : ''}$${todayPnL.toFixed(2)}`, color: todayPnL >= 0 ? "text-profit" : "text-loss", icon: Zap },
                        { label: "Win/Loss", value: `${wins}/${losses}`, color: "text-primary", icon: Activity },
                        { label: "Days Traded", value: `${daysTraded}/${c.minTradingDays}`, color: isMinDaysHit ? "text-profit" : "text-amber-400", icon: Calendar },
                        { label: "Rules Followed", value: `${challengeTrades.length ? Math.round((rulesFollowed / challengeTrades.length) * 100) : 0}%`, color: "text-primary", icon: ShieldCheck },
                    ].map(stat => (
                        <div key={stat.label} className="p-4 rounded-2xl bg-white/3 border border-white/5">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                                <stat.icon className={`w-3.5 h-3.5 ${stat.color} opacity-50`} />
                            </div>
                            <p className={`text-lg font-black tracking-tighter ${stat.color}`}>{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Progress Bars */}
                <div className="px-8 pb-4 space-y-5">
                    {/* Profit Progress */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Target className="w-4 h-4 text-profit" />
                                <span className="text-xs font-black uppercase tracking-widest">Profit Target</span>
                            </div>
                            <span className="text-xs font-mono font-black">
                                ${totalPnL.toFixed(2)} / ${c.profitTarget.toLocaleString()}
                                <span className="text-muted-foreground ml-1">({profitProgress.toFixed(1)}%)</span>
                            </span>
                        </div>
                        <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden relative">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${profitProgress}%` }}
                                className="h-full bg-gradient-to-r from-profit/40 to-profit rounded-full"
                                transition={{ duration: 1 }}
                            />
                            {isProfitTargetHit && (
                                <div className="absolute right-2 top-1/2 -translate-y-1/2"><CheckCircle2 className="w-2.5 h-2.5 text-white" /></div>
                            )}
                        </div>
                    </div>

                    {/* Daily Drawdown */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Zap className={`w-4 h-4 ${dailyDDProgress >= 80 ? 'text-loss' : 'text-amber-400'}`} />
                                <span className="text-xs font-black uppercase tracking-widest">Daily Drawdown</span>
                                {dailyDDProgress >= 80 && (
                                    <span className="text-[8px] font-black text-loss uppercase tracking-widest animate-pulse flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" /> Warning
                                    </span>
                                )}
                            </div>
                            <span className="text-xs font-mono font-black">
                                ${Math.abs(Math.min(0, todayPnL)).toFixed(2)} / ${c.dailyDrawdownLimit.toLocaleString()}
                            </span>
                        </div>
                        <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${dailyDDProgress}%` }}
                                className={`h-full rounded-full ${dailyDDProgress >= 80 ? 'bg-gradient-to-r from-loss/60 to-loss' : 'bg-gradient-to-r from-amber-400/40 to-amber-400'}`}
                                transition={{ duration: 1 }}
                            />
                        </div>
                    </div>

                    {/* Max Drawdown */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <TrendingDown className={`w-4 h-4 ${maxDDUsed >= 80 ? 'text-loss' : 'text-muted-foreground'}`} />
                                <span className="text-xs font-black uppercase tracking-widest">Max Drawdown</span>
                                {isMaxDDBreached && (
                                    <span className="text-[8px] font-black text-loss uppercase tracking-widest flex items-center gap-1">
                                        <XCircle className="w-3 h-3" /> Breached
                                    </span>
                                )}
                            </div>
                            <span className="text-xs font-mono font-black">
                                ${Math.abs(Math.min(0, totalPnL)).toFixed(2)} / ${c.maxDrawdownLimit.toLocaleString()}
                            </span>
                        </div>
                        <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${maxDDUsed}%` }}
                                className={`h-full rounded-full ${maxDDUsed >= 80 ? 'bg-gradient-to-r from-loss/60 to-loss' : 'bg-gradient-to-r from-primary/40 to-primary'}`}
                                transition={{ duration: 1 }}
                            />
                        </div>
                    </div>
                </div>

                {/* Mini Equity Curve */}
                {equityCurve.length > 1 && (
                    <div className="px-8 pb-4">
                        <div className="p-5 rounded-2xl bg-white/3 border border-white/5">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <BarChart3 className="w-3.5 h-3.5 text-primary" />
                                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Equity Curve</span>
                                </div>
                                <span className="text-[9px] font-mono text-muted-foreground">{challengeTrades.length} ops</span>
                            </div>
                            <svg className="w-full h-20" viewBox="0 0 100 40" preserveAspectRatio="none">
                                {/* Zero line */}
                                {(() => {
                                    const min = Math.min(...equityCurve, 0);
                                    const max = Math.max(...equityCurve, 0);
                                    const range = max - min || 1;
                                    const zeroY = 40 - ((0 - min) / range) * 40;
                                    return <line x1="0" y1={zeroY} x2="100" y2={zeroY} stroke="white" strokeWidth="0.2" strokeOpacity="0.15" strokeDasharray="1,1" />;
                                })()}
                                <motion.polyline
                                    fill="none"
                                    stroke="hsl(var(--primary))"
                                    strokeWidth="0.6"
                                    strokeLinejoin="round"
                                    points={equityCurve.map((val, idx) => {
                                        const x = (idx / (equityCurve.length - 1)) * 100;
                                        const min = Math.min(...equityCurve, 0);
                                        const max = Math.max(...equityCurve, 0);
                                        const range = max - min || 1;
                                        const y = 40 - ((val - min) / range) * 40;
                                        return `${x},${y}`;
                                    }).join(' ')}
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 1.5 }}
                                />
                            </svg>
                        </div>
                    </div>
                )}

                {/* Checklist */}
                <div className="px-8 pb-8">
                    <div className="p-5 rounded-2xl bg-white/3 border border-white/5 flex flex-wrap gap-6">
                        {[
                            { label: "Profit Target", ok: isProfitTargetHit },
                            { label: `Min ${c.minTradingDays} Days`, ok: isMinDaysHit },
                            { label: "Daily DD Safe", ok: !isDailyDDBreached },
                            { label: "Max DD Safe", ok: !isMaxDDBreached },
                            { label: "Consistency < 50%", ok: !consistencyWarning },
                        ].map(item => (
                            <div key={item.label} className="flex items-center gap-2">
                                {item.ok ? (
                                    <CheckCircle2 className="w-4 h-4 text-profit" />
                                ) : (
                                    <XCircle className="w-4 h-4 text-muted-foreground/40" />
                                )}
                                <span className={`text-xs font-bold ${item.ok ? 'text-profit' : 'text-muted-foreground/60'}`}>{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Inline Trade History */}
                <AnimatePresence>
                    {showTrades && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-white/10 overflow-hidden"
                        >
                            <div className="p-8 space-y-4">
                                <h4 className="text-sm font-black uppercase tracking-widest text-white mb-4">Trade History</h4>
                                {loadingTrades ? (
                                    <div className="flex flex-col items-center justify-center py-12 space-y-4 bg-white/2 rounded-3xl border border-white/5">
                                        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Fetching challenge trades...</p>
                                    </div>
                                ) : challengeTrades.length === 0 ? (
                                    <div className="text-center py-12 bg-white/2 rounded-3xl border border-white/5">
                                        <div className="p-4 rounded-full bg-white/5 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                            <Activity className="w-8 h-8 text-muted-foreground/30" />
                                        </div>
                                        <p className="text-muted-foreground text-sm">No trades recorded for this challenge yet.</p>
                                        <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-1">Assign trades to this challenge ID in Add Trade</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-white/5">
                                            <tr className="text-muted-foreground text-xs uppercase tracking-wider">
                                                {["Date", "Pair", "Grade", "Dir", "P/L", "Actions"].map((h) => (
                                                <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                                                ))}
                                            </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {challengeTrades.map((trade) => (
                                                    <tr key={trade.id} className="hover:bg-white/5 transition-colors">
                                                        <td className="px-4 py-3 text-muted-foreground font-mono text-xs whitespace-nowrap">
                                                            <div>{trade.date}</div>
                                                            <div className="text-[10px] opacity-70">{trade.time}</div>
                                                        </td>
                                                        <td className="px-4 py-3 font-semibold text-white">{trade.pair}</td>
                                                        <td className="px-4 py-3">
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getTradeQuality(trade).grade === 'A' ? 'bg-profit/20 text-profit' : getTradeQuality(trade).grade === 'B' ? 'bg-primary/20 text-primary' : 'bg-loss/20 text-loss'}`}>
                                                                {getTradeQuality(trade).grade}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full border ${trade.direction === "BUY" ? "bg-profit/10 text-profit border-profit/20" : "bg-loss/10 text-loss border-loss/20"}`}>
                                                                {trade.direction}
                                                            </span>
                                                        </td>
                                                        <td className={`px-4 py-3 font-mono font-bold ${trade.profitLoss >= 0 ? "text-profit" : "text-loss"}`}>
                                                            {trade.profitLoss > 0 ? "+" : ""}${trade.profitLoss.toFixed(2)}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-1">
                                                                <Link to={`/edit-trade/${trade.id}?challengeId=${c.id}`} className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                                                                    <Edit3 className="w-4 h-4" />
                                                                </Link>
                                                                <button onClick={() => {
                                                                    if (confirm('Delete this trade permanently?')) {
                                                                        deleteTrade(trade.id, c.id);
                                                                    }
                                                                }} className="p-1.5 rounded-md text-muted-foreground hover:text-loss hover:bg-loss/10 transition-colors">
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </GlassCard>
        </motion.div>
    );
}
