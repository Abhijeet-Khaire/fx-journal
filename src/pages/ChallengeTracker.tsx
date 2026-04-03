import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { Trade } from "@/lib/tradeTypes";
import {
  Trophy, Target, AlertCircle, ShieldCheck, TrendingUp, TrendingDown, Calendar,
  Zap, Plus, Trash2, BarChart3, Save, Edit3, CheckCircle2, XCircle, Archive,
  DollarSign, Activity, Loader2, ChevronDown, ChevronUp, Download,
  Shield, Clock, Eye, EyeOff, AlertTriangle, Percent, ToggleLeft, ToggleRight,
  Flame, Award, Hash
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import {
  ChallengeConfig, DEFAULT_CHALLENGE, FIRM_PRESETS,
  evaluateChallenge, calculateChallengeStatistics,
  generateChallengeReport, ChallengeEvaluation, ChallengeStats,
  calculatePerTradeRiskPercent
} from "@/lib/challengeEngine";

// ─── Main Page ──────────────────────────────────────────────────────

export default function ChallengeTracker() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<ChallengeConfig[]>([]);
  const [archivedChallenges, setArchivedChallenges] = useState<ChallengeConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<ChallengeConfig, "id">>(DEFAULT_CHALLENGE);
  const [viewMode, setViewMode] = useState<"active" | "history">("active");

  useEffect(() => {
    if (!user) return;
    const fetchAll = async () => {
      try {
        const [configSnap, archiveSnap] = await Promise.all([
          getDoc(doc(db, "traders", user.uid, "challenges", "config")),
          getDoc(doc(db, "traders", user.uid, "challenges", "archive")),
        ]);
        if (configSnap.exists() && configSnap.data().data) setChallenges(configSnap.data().data);
        if (archiveSnap.exists() && archiveSnap.data().data) setArchivedChallenges(archiveSnap.data().data);
      } catch (error) {
        console.error("Error fetching challenges:", error);
        toast.error("Failed to load challenges.");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [user]);

  const saveToStorage = async (data: ChallengeConfig[]) => {
    if (!user) return;
    try {
      await setDoc(doc(db, "traders", user.uid, "challenges", "config"), { data }, { merge: true });
      setChallenges(data);
    } catch (error) {
      console.error("Error saving challenges:", error);
      toast.error("Failed to save changes.");
      throw error;
    }
  };

  const saveArchive = async (data: ChallengeConfig[]) => {
    if (!user) return;
    try {
      await setDoc(doc(db, "traders", user.uid, "challenges", "archive"), { data }, { merge: true });
      setArchivedChallenges(data);
    } catch (error) {
      console.error("Error saving archive:", error);
      toast.error("Failed to save archive.");
    }
  };

  const handleSubmit = async () => {
    if (!form.name || !form.profitTarget) {
      toast.error("Please fill in challenge name and profit target.");
      return;
    }
    try {
      if (editingId) {
        const updated = challenges.map(c => c.id === editingId ? { ...form, id: editingId } as ChallengeConfig : c);
        await saveToStorage(updated);
        toast.success("Challenge updated!");
      } else {
        const newId = `ch_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const newChallenge: ChallengeConfig = { ...form, id: newId, createdAt: new Date().toISOString() };
        await saveToStorage([...challenges, newChallenge]);
        toast.success("Challenge created!");
      }
      setForm(DEFAULT_CHALLENGE);
      setShowForm(false);
      setEditingId(null);
    } catch { }
  };

  const handleEdit = (c: ChallengeConfig) => { setForm({ ...c }); setEditingId(c.id); setShowForm(true); };

  const handleDelete = async (id: string) => {
    try { await saveToStorage(challenges.filter(c => c.id !== id)); toast.success("Challenge deleted."); } catch { }
  };

  const handleArchive = async (challenge: ChallengeConfig, status: string, reason?: string) => {
    const archived: ChallengeConfig = {
      ...challenge,
      isActive: false,
      status: status as any,
      failReason: reason,
      archivedAt: new Date().toISOString(),
      ...(status === "passed" ? { passedDate: new Date().toISOString().split("T")[0] } : {}),
      ...(status === "failed" ? { failedDate: new Date().toISOString().split("T")[0] } : {}),
    };
    await saveArchive([...archivedChallenges, archived]);
    await saveToStorage(challenges.filter(c => c.id !== challenge.id));
    toast.success(`Challenge archived as ${status.toUpperCase()}`);
  };

  const handlePreset = (firmName: string) => {
    const preset = FIRM_PRESETS[firmName];
    if (!preset) return;
    setForm(f => ({
      ...f,
      ...preset,
      name: firmName !== "Custom" ? `${preset.firmName} ${preset.phase || ""}`.trim() : f.name,
    }));
  };

  const update = (key: string, value: any) => setForm(f => ({ ...f, [key]: value }));

  const displayChallenges = viewMode === "active" ? challenges : archivedChallenges;

  return (
    <div className="space-y-10 pb-24 relative">
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
            <h1 className="text-5xl font-black text-white tracking-tighter uppercase">
              Challenge <span className="text-amber-400">Tracker</span>
            </h1>
            <p className="text-muted-foreground font-medium text-lg leading-relaxed max-w-xl mt-2">
              Track evaluations with real-time drawdown limits, per-trade risk caps, consistency rules, and more.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Tab Switcher */}
            <div className="flex rounded-2xl bg-white/5 border border-white/10 p-1">
              <button onClick={() => setViewMode("active")} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === "active" ? "bg-amber-400 text-black" : "text-muted-foreground hover:text-white"}`}>
                <Activity className="w-3.5 h-3.5 inline mr-1.5" />Active ({challenges.length})
              </button>
              <button onClick={() => setViewMode("history")} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === "history" ? "bg-amber-400 text-black" : "text-muted-foreground hover:text-white"}`}>
                <Archive className="w-3.5 h-3.5 inline mr-1.5" />History ({archivedChallenges.length})
              </button>
            </div>
            {!loading && viewMode === "active" && (
              <button onClick={() => { setShowForm(true); setEditingId(null); setForm(DEFAULT_CHALLENGE); }}
                className="flex items-center gap-2.5 px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-widest bg-amber-400 text-black hover:brightness-110 shadow-lg shadow-amber-400/20 hover:scale-[1.02] active:scale-[0.98] transition-all shrink-0">
                <Plus className="w-5 h-5" /> New Challenge
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {loading && (
        <div className="flex justify-center items-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400" />
        </div>
      )}

      {/* Create/Edit Form */}
      {showForm && !loading && <ChallengeForm form={form} editingId={editingId} onUpdate={update} onSubmit={handleSubmit} onCancel={() => { setShowForm(false); setEditingId(null); }} onPreset={handlePreset} />}

      {/* Challenge Cards */}
      {!loading && displayChallenges.length === 0 && !showForm ? (
        <GlassCard className="p-16 rounded-[2.5rem] border-white/10 text-center">
          <Trophy className="w-16 h-16 text-muted-foreground/20 mx-auto mb-6" />
          <h3 className="text-2xl font-black uppercase tracking-tighter text-white mb-2">
            {viewMode === "active" ? "No Active Challenges" : "No Challenge History"}
          </h3>
          <p className="text-muted-foreground text-sm max-w-md mx-auto mb-8">
            {viewMode === "active"
              ? "Start tracking your prop firm evaluation by creating a new challenge."
              : "Completed and failed challenges will appear here."}
          </p>
          {viewMode === "active" && (
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-widest bg-amber-400 text-black hover:brightness-110 shadow-lg shadow-amber-400/20 transition-all mx-auto">
              <Plus className="w-5 h-5" /> Create Your First Challenge
            </button>
          )}
        </GlassCard>
      ) : (
        <div className="space-y-8">
          {!loading && displayChallenges.map((challenge, idx) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              index={idx}
              onEdit={viewMode === "active" ? handleEdit : undefined}
              onDelete={viewMode === "active" ? handleDelete : undefined}
              onArchive={viewMode === "active" ? handleArchive : undefined}
              isArchived={viewMode === "history"}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Challenge Form ─────────────────────────────────────────────────

function ChallengeForm({ form, editingId, onUpdate, onSubmit, onCancel, onPreset }: {
  form: Omit<ChallengeConfig, "id">;
  editingId: string | null;
  onUpdate: (key: string, value: any) => void;
  onSubmit: () => void;
  onCancel: () => void;
  onPreset: (firm: string) => void;
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <GlassCard className="p-8 rounded-[2.5rem] border-amber-400/10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-2xl bg-amber-400/10 text-amber-400"><Edit3 className="w-5 h-5" /></div>
          <div>
            <h3 className="text-xl font-black uppercase tracking-tighter">{editingId ? "Edit" : "Configure"} Challenge</h3>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Set your prop firm evaluation parameters</p>
          </div>
        </div>

        {/* Firm Presets */}
        <div className="mb-6">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3">Quick Presets</p>
          <div className="flex flex-wrap gap-2">
            {Object.keys(FIRM_PRESETS).map(firm => (
              <button key={firm} onClick={() => onPreset(firm)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${form.firmName === (FIRM_PRESETS[firm]?.firmName || firm)
                  ? "bg-amber-400 text-black shadow-lg shadow-amber-400/20"
                  : "bg-white/5 text-muted-foreground border border-white/10 hover:bg-white/10 hover:text-white"}`}>
                {firm}
              </button>
            ))}
          </div>
        </div>

        {/* Core Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
          {[
            { key: "name", label: "Challenge Name", type: "text", placeholder: "e.g. FTMO $100k Phase 1" },
            { key: "firmName", label: "Firm Name", type: "text", placeholder: "e.g. FTMO" },
            { key: "phase", label: "Phase", type: "text", placeholder: "e.g. Phase 1" },
            { key: "accountSize", label: "Account Size ($)", type: "number", placeholder: "100000" },
            { key: "profitTarget", label: "Profit Target ($)", type: "number", placeholder: "10000" },
            { key: "dailyDrawdownLimit", label: "Daily DD Limit ($)", type: "number", placeholder: "5000" },
            { key: "maxDrawdownLimit", label: "Max DD Limit ($)", type: "number", placeholder: "10000" },
            { key: "maxRiskPerTrade", label: "Max Risk/Trade (%)", type: "number", placeholder: "3" },
            { key: "minTradingDays", label: "Min Trading Days", type: "number", placeholder: "4" },
            { key: "maxTradingDays", label: "Max Calendar Days (0=∞)", type: "number", placeholder: "30" },
            { key: "startDate", label: "Start Date", type: "date", placeholder: "" },
            { key: "endDate", label: "End Date (Optional)", type: "date", placeholder: "" },
          ].map(field => (
            <div key={field.key} className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">{field.label}</label>
              <input type={field.type} value={(form as any)[field.key] || ""} onChange={e => onUpdate(field.key, field.type === "number" ? parseFloat(e.target.value) || 0 : e.target.value)}
                placeholder={field.placeholder} className="glass-input w-full px-4 py-3 text-sm rounded-xl font-medium" spellCheck={false} />
            </div>
          ))}
        </div>

        {/* Advanced Rules Toggle */}
        <button onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 mb-6 text-xs font-black uppercase tracking-widest text-amber-400 hover:text-amber-300 transition-colors">
          <Shield className="w-4 h-4" />
          Advanced Prop Firm Rules
          {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        <AnimatePresence>
          {showAdvanced && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 p-5 rounded-2xl bg-white/3 border border-white/5">
                {/* Trailing Drawdown */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">Trailing Drawdown</label>
                  <select value={form.trailingDrawdownType} onChange={e => onUpdate("trailingDrawdownType", e.target.value)}
                    className="glass-input w-full px-4 py-3 text-sm rounded-xl font-medium bg-transparent">
                    <option value="none">None (Static)</option>
                    <option value="trailing-to-breakeven">Trail to Breakeven</option>
                    <option value="full-trailing">Full Trailing</option>
                  </select>
                </div>

                {/* Consistency */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">
                    Consistency Rule
                    <button onClick={() => onUpdate("consistencyRule", !form.consistencyRule)} className="ml-2 inline-flex">
                      {form.consistencyRule ? <ToggleRight className="w-4 h-4 text-profit" /> : <ToggleLeft className="w-4 h-4 text-muted-foreground" />}
                    </button>
                  </label>
                  {form.consistencyRule && (
                    <input type="number" value={form.consistencyPercent} onChange={e => onUpdate("consistencyPercent", parseFloat(e.target.value) || 30)}
                      placeholder="30" className="glass-input w-full px-4 py-3 text-sm rounded-xl font-medium" />
                  )}
                  {!form.consistencyRule && <p className="text-[10px] text-muted-foreground/50">Disabled</p>}
                </div>

                {/* Max Lot Size */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">Max Lot Size (0=∞)</label>
                  <input type="number" value={form.maxLotSize} onChange={e => onUpdate("maxLotSize", parseFloat(e.target.value) || 0)}
                    placeholder="0" className="glass-input w-full px-4 py-3 text-sm rounded-xl font-medium" />
                </div>

                {/* Toggles */}
                {[
                  { key: "noNewsTrading", label: "No News Trading" },
                  { key: "noWeekendHolding", label: "No Weekend Holding" },
                  { key: "noHedging", label: "No Hedging" },
                ].map(toggle => (
                  <div key={toggle.key} className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5">
                    <span className="text-xs font-bold">{toggle.label}</span>
                    <button onClick={() => onUpdate(toggle.key, !(form as any)[toggle.key])}>
                      {(form as any)[toggle.key]
                        ? <ToggleRight className="w-6 h-6 text-amber-400" />
                        : <ToggleLeft className="w-6 h-6 text-muted-foreground/40" />}
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-3">
          <button onClick={onSubmit} className="flex items-center gap-2 px-8 py-3 rounded-2xl text-sm font-black uppercase tracking-widest bg-amber-400 text-black hover:brightness-110 transition-all">
            <Save className="w-4 h-4" /> {editingId ? "Update" : "Create"} Challenge
          </button>
          <button onClick={onCancel} className="px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-widest bg-white/5 text-muted-foreground border border-white/10 hover:bg-white/10 transition-all">
            Cancel
          </button>
        </div>
      </GlassCard>
    </motion.div>
  );
}

// ─── Challenge Card ─────────────────────────────────────────────────

function ChallengeCard({ challenge, index, onEdit, onDelete, onArchive, isArchived }: {
  challenge: ChallengeConfig;
  index: number;
  onEdit?: (c: ChallengeConfig) => void;
  onDelete?: (id: string) => void;
  onArchive?: (c: ChallengeConfig, status: string, reason?: string) => void;
  isArchived: boolean;
}) {
  const c = challenge;
  const { user } = useAuth();
  const [challengeTrades, setChallengeTrades] = useState<Trade[]>([]);
  const [loadingTrades, setLoadingTrades] = useState(true);
  const [showTrades, setShowTrades] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showRules, setShowRules] = useState(true);

  useEffect(() => {
    if (!user) return;
    const docRef = doc(db, "traders", user.uid, "trade-history", `challenge_${c.id}`);
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const raw = snap.data().trades || [];
        const parsed = raw.map((t: any) => ({
          ...t,
          profitLoss: Number(t.profitLoss ?? t.profit ?? 0),
          date: typeof t.date === "string" ? t.date : new Date(t.date?.seconds * 1000 || Date.now()).toISOString().split("T")[0],
        }));
        setChallengeTrades(parsed.sort((a: Trade, b: Trade) => new Date(b.date + "T" + b.time).getTime() - new Date(a.date + "T" + a.time).getTime()));
      } else {
        setChallengeTrades([]);
      }
      setLoadingTrades(false);
    });
    return () => unsubscribe();
  }, [user, c.id]);

  const evaluation = useMemo(() => evaluateChallenge(c, challengeTrades), [c, challengeTrades]);
  const stats = useMemo(() => calculateChallengeStatistics(c, challengeTrades), [c, challengeTrades]);

  // Auto-archive if status changed
  useEffect(() => {
    if (!isArchived && onArchive && challengeTrades.length > 0) {
      if (evaluation.status === "failed" && c.status !== "failed") {
        onArchive(c, "failed", evaluation.failReason);
      }
    }
  }, [evaluation.status]);

  const equityCurve = useMemo(() => {
    if (!challengeTrades.length) return [];
    const sorted = [...challengeTrades].sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());
    let cum = 0;
    return sorted.map(t => { cum += t.profitLoss; return cum; });
  }, [challengeTrades]);

  const statusColor = evaluation.status === "passed" ? "profit" : evaluation.status === "failed" ? "loss" : "amber-400";
  const statusLabel = evaluation.status.toUpperCase();

  const handleExport = () => {
    const report = generateChallengeReport(c, evaluation, stats, challengeTrades);
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${c.name.replace(/\s+/g, "_")}_report.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Challenge report exported!");
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
      <GlassCard className="rounded-[2.5rem] border-white/10 overflow-hidden relative">
        {/* Top bar */}
        <div className={`h-1.5 w-full ${evaluation.status === "passed" ? "bg-gradient-to-r from-profit via-profit/60 to-profit" :
          evaluation.status === "failed" ? "bg-gradient-to-r from-loss via-loss/60 to-loss" :
            "bg-gradient-to-r from-transparent via-amber-400/40 to-transparent"}`} />

        {/* Header */}
        <div className="p-8 pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-2xl ${evaluation.status === "passed" ? "bg-profit/10 text-profit" :
              evaluation.status === "failed" ? "bg-loss/10 text-loss" : "bg-amber-400/10 text-amber-400"}`}>
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-black uppercase tracking-tighter">{c.name}</h3>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{c.firmName} • {c.phase}</span>
                <span className={`px-2.5 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border bg-${statusColor}/10 text-${statusColor} border-${statusColor}/20`}>
                  {statusLabel}
                </span>
                {c.trailingDrawdownType !== "none" && (
                  <span className="px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest bg-purple-400/10 text-purple-400 border border-purple-400/20">
                    Trailing DD
                  </span>
                )}
              </div>
              {isArchived && c.archivedAt && (
                <span className="text-[9px] text-muted-foreground/50 font-mono">Archived {new Date(c.archivedAt).toLocaleDateString()}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setShowTrades(!showTrades)} className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all text-xs font-bold uppercase tracking-widest ${showTrades ? "bg-amber-400 border-amber-400 text-black" : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"}`}>
              <Activity className="w-4 h-4" /> Trades {challengeTrades.length > 0 && <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] ${showTrades ? "bg-black/20" : "bg-white/10"}`}>{challengeTrades.length}</span>}
            </button>
            <button onClick={() => setShowStats(!showStats)} className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all text-xs font-bold uppercase tracking-widest ${showStats ? "bg-primary border-primary text-black" : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"}`}>
              <BarChart3 className="w-4 h-4" /> Stats
            </button>
            <button onClick={handleExport} className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all" title="Export Report">
              <Download className="w-4 h-4" />
            </button>
            {!isArchived && (
              <>
                <Link to={`/add-trade?challengeId=${c.id}`} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all text-xs font-bold uppercase tracking-widest">
                  <Plus className="w-4 h-4" /> Add
                </Link>
                {onEdit && <button onClick={() => onEdit(c)} className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"><Edit3 className="w-4 h-4" /></button>}
                {onDelete && <button onClick={() => onDelete(c.id)} className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-muted-foreground hover:text-loss hover:bg-loss/10 transition-all"><Trash2 className="w-4 h-4" /></button>}
                {onArchive && evaluation.status === "passed" && (
                  <button onClick={() => onArchive(c, "passed")} className="flex items-center gap-1 px-3 py-2 rounded-xl bg-profit/10 border border-profit/20 text-profit text-xs font-bold uppercase tracking-widest hover:bg-profit/20 transition-all">
                    <Award className="w-4 h-4" /> Pass
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="p-8 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {[
            { label: "Equity", value: `$${evaluation.currentEquity.toFixed(0)}`, color: evaluation.totalPnL >= 0 ? "text-profit" : "text-loss", icon: DollarSign },
            { label: "Net P/L", value: `${evaluation.totalPnL >= 0 ? "+" : ""}$${evaluation.totalPnL.toFixed(2)}`, color: evaluation.totalPnL >= 0 ? "text-profit" : "text-loss", icon: TrendingUp },
            { label: "Max DD", value: `$${evaluation.maxDD.toFixed(0)}`, color: (evaluation.maxDD / c.maxDrawdownLimit) * 100 >= 80 ? "text-loss" : "text-muted-foreground", icon: TrendingDown },
            { label: "Win Rate", value: `${evaluation.winRate}%`, color: evaluation.winRate >= 50 ? "text-profit" : "text-loss", icon: Target },
            { label: "W/L", value: `${evaluation.wins}/${evaluation.losses}`, color: "text-primary", icon: Activity },
            { label: "Days", value: `${evaluation.daysTraded}/${c.minTradingDays}`, color: evaluation.daysTraded >= c.minTradingDays ? "text-profit" : "text-amber-400", icon: Calendar },
            { label: "Avg Risk", value: `${stats.avgRiskPerTrade}%`, color: stats.avgRiskPerTrade <= c.maxRiskPerTrade ? "text-profit" : "text-loss", icon: Shield },
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
          <ProgressBar label="Profit Target" value={evaluation.totalPnL} max={c.profitTarget} unit="$" icon={<Target className="w-4 h-4 text-profit" />}
            color="profit" percent={evaluation.profitProgress} completed={evaluation.totalPnL >= c.profitTarget} />
          <ProgressBar label="Daily Drawdown" value={Math.abs(Math.min(0, evaluation.dailyPnL.find(d => d.date === new Date().toISOString().split("T")[0])?.pnl ?? 0))} max={c.dailyDrawdownLimit} unit="$"
            icon={<Zap className={`w-4 h-4 ${evaluation.ruleChecks.find(r => r.rule === "Daily Drawdown")?.severity === "critical" ? "text-loss" : "text-amber-400"}`} />}
            color={evaluation.ruleChecks.find(r => r.rule === "Daily Drawdown")?.severity === "critical" ? "loss" : "amber-400"}
            percent={c.dailyDrawdownLimit > 0 ? (Math.abs(Math.min(0, evaluation.dailyPnL.find(d => d.date === new Date().toISOString().split("T")[0])?.pnl ?? 0)) / c.dailyDrawdownLimit) * 100 : 0}
            warning={evaluation.ruleChecks.find(r => r.rule === "Daily Drawdown")?.severity !== "ok"} />
          <ProgressBar label={`Max Drawdown${c.trailingDrawdownType !== "none" ? " (Trailing)" : ""}`}
            value={evaluation.maxDD} max={c.maxDrawdownLimit} unit="$"
            icon={<TrendingDown className={`w-4 h-4 ${(evaluation.maxDD / c.maxDrawdownLimit) * 100 >= 80 ? "text-loss" : "text-muted-foreground"}`} />}
            color={(evaluation.maxDD / c.maxDrawdownLimit) * 100 >= 80 ? "loss" : "primary"}
            percent={c.maxDrawdownLimit > 0 ? (evaluation.maxDD / c.maxDrawdownLimit) * 100 : 0}
            warning={evaluation.maxDD > c.maxDrawdownLimit} />
        </div>

        {/* Equity Curve */}
        {equityCurve.length > 1 && (
          <div className="px-8 pb-4">
            <div className="p-5 rounded-2xl bg-white/3 border border-white/5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Equity Curve</span>
                </div>
                <span className="text-[9px] font-mono text-muted-foreground">{challengeTrades.length} trades</span>
              </div>
              <svg className="w-full h-20" viewBox="0 0 100 40" preserveAspectRatio="none">
                {(() => {
                  const min = Math.min(...equityCurve, 0);
                  const max = Math.max(...equityCurve, 0);
                  const range = max - min || 1;
                  const zeroY = 40 - ((0 - min) / range) * 40;
                  return <line x1="0" y1={zeroY} x2="100" y2={zeroY} stroke="white" strokeWidth="0.2" strokeOpacity="0.15" strokeDasharray="1,1" />;
                })()}
                <motion.polyline fill="none" stroke="hsl(var(--primary))" strokeWidth="0.6" strokeLinejoin="round"
                  points={equityCurve.map((val, idx) => {
                    const x = (idx / (equityCurve.length - 1)) * 100;
                    const min = Math.min(...equityCurve, 0);
                    const max = Math.max(...equityCurve, 0);
                    const range = max - min || 1;
                    const y = 40 - ((val - min) / range) * 40;
                    return `${x},${y}`;
                  }).join(" ")}
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5 }} />
              </svg>
            </div>
          </div>
        )}

        {/* Rule Checks */}
        <div className="px-8 pb-4">
          <button onClick={() => setShowRules(!showRules)} className="flex items-center gap-2 mb-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest hover:text-white transition-colors">
            <ShieldCheck className="w-3.5 h-3.5" /> Rule Compliance ({evaluation.ruleChecks.filter(r => r.passed).length}/{evaluation.ruleChecks.length})
            {showRules ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          <AnimatePresence>
            {showRules && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="p-5 rounded-2xl bg-white/3 border border-white/5 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {evaluation.ruleChecks.map(rule => (
                    <div key={rule.rule} className={`flex items-start gap-3 p-3 rounded-xl ${rule.severity === "critical" ? "bg-loss/5 border border-loss/10" : rule.severity === "warning" ? "bg-amber-400/5 border border-amber-400/10" : "bg-white/2 border border-white/5"}`}>
                      {rule.passed ? <CheckCircle2 className="w-4 h-4 text-profit shrink-0 mt-0.5" /> :
                        rule.severity === "critical" ? <XCircle className="w-4 h-4 text-loss shrink-0 mt-0.5 animate-pulse" /> :
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
                      <div>
                        <p className={`text-xs font-bold ${rule.passed ? "text-profit" : rule.severity === "critical" ? "text-loss" : "text-amber-400"}`}>{rule.rule}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{rule.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Per-Trade Risk Warnings */}
        {evaluation.tradeRiskWarnings.length > 0 && (
          <div className="px-8 pb-4">
            <div className="p-4 rounded-2xl bg-loss/5 border border-loss/10">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-loss" />
                <span className="text-xs font-bold text-loss uppercase tracking-widest">{evaluation.tradeRiskWarnings.length} Trade(s) Exceed {c.maxRiskPerTrade}% Risk Limit</span>
              </div>
              <div className="space-y-1">
                {evaluation.tradeRiskWarnings.slice(0, 5).map(w => (
                  <p key={w.tradeId} className="text-[10px] text-loss/80 font-mono">
                    {w.date} • {w.pair} • {w.lotSize} lot • Risk: {w.riskPercent}% (${w.riskDollars.toFixed(0)})
                  </p>
                ))}
                {evaluation.tradeRiskWarnings.length > 5 && <p className="text-[10px] text-loss/60">...and {evaluation.tradeRiskWarnings.length - 5} more</p>}
              </div>
            </div>
          </div>
        )}

        {/* Stats Panel */}
        <AnimatePresence>
          {showStats && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-white/10 overflow-hidden">
              <div className="p-8">
                <h4 className="text-sm font-black uppercase tracking-widest text-white mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" /> Advanced Statistics</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {[
                    { label: "Profit Factor", value: stats.profitFactor.toFixed(2), color: stats.profitFactor >= 1.5 ? "text-profit" : stats.profitFactor >= 1 ? "text-amber-400" : "text-loss" },
                    { label: "Sharpe Ratio", value: stats.sharpeRatio.toFixed(2), color: stats.sharpeRatio >= 1 ? "text-profit" : stats.sharpeRatio >= 0 ? "text-amber-400" : "text-loss" },
                    { label: "Avg R-Multiple", value: `${stats.avgRMultiple.toFixed(2)}R`, color: stats.avgRMultiple >= 1 ? "text-profit" : stats.avgRMultiple >= 0 ? "text-amber-400" : "text-loss" },
                    { label: "Avg Win", value: `$${stats.avgWin.toFixed(0)}`, color: "text-profit" },
                    { label: "Avg Loss", value: `$${stats.avgLoss.toFixed(0)}`, color: "text-loss" },
                    { label: "Largest Win", value: `$${stats.largestWin.toFixed(0)}`, color: "text-profit" },
                    { label: "Largest Loss", value: `$${stats.largestLoss.toFixed(0)}`, color: "text-loss" },
                    { label: "Max Win Streak", value: `${stats.maxConsecutiveWins}`, color: "text-profit" },
                    { label: "Max Loss Streak", value: `${stats.maxConsecutiveLosses}`, color: "text-loss" },
                    { label: "Best Day", value: `$${stats.bestDay.pnl.toFixed(0)}`, sub: stats.bestDay.date, color: "text-profit" },
                    { label: "Worst Day", value: `$${stats.worstDay.pnl.toFixed(0)}`, sub: stats.worstDay.date, color: "text-loss" },
                    { label: "Avg Trades/Day", value: stats.avgTradesPerDay.toFixed(1), color: "text-primary" },
                    { label: "Avg Risk/Trade", value: `${stats.avgRiskPerTrade}%`, color: stats.avgRiskPerTrade <= c.maxRiskPerTrade ? "text-profit" : "text-loss" },
                    { label: "Win Rate", value: `${stats.winRate}%`, color: stats.winRate >= 50 ? "text-profit" : "text-loss" },
                  ].map(s => (
                    <div key={s.label} className="p-3 rounded-xl bg-white/3 border border-white/5">
                      <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">{s.label}</p>
                      <p className={`text-sm font-black tracking-tight ${s.color}`}>{s.value}</p>
                      {"sub" in s && s.sub && <p className="text-[9px] text-muted-foreground/50 font-mono">{s.sub}</p>}
                    </div>
                  ))}
                </div>

                {/* Risk Distribution */}
                {stats.riskDistribution.some(b => b.count > 0) && (
                  <div className="mt-4 p-4 rounded-xl bg-white/3 border border-white/5">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-3">Risk Distribution Per Trade</p>
                    <div className="flex items-end gap-2 h-20">
                      {stats.riskDistribution.map(b => {
                        const maxCount = Math.max(...stats.riskDistribution.map(x => x.count), 1);
                        const height = (b.count / maxCount) * 100;
                        const isOver = b.bucket.startsWith("3-") || b.bucket.startsWith("4");
                        return (
                          <div key={b.bucket} className="flex-1 flex flex-col items-center gap-1">
                            <span className="text-[8px] font-mono text-muted-foreground">{b.count}</span>
                            <div className={`w-full rounded-t-md transition-all ${isOver ? "bg-loss/60" : b.bucket === "No SL" ? "bg-muted-foreground/20" : "bg-profit/60"}`}
                              style={{ height: `${Math.max(height, 4)}%` }} />
                            <span className="text-[7px] font-mono text-muted-foreground/60 whitespace-nowrap">{b.bucket}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>



        {/* Trade History */}
        <AnimatePresence>
          {showTrades && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-white/10 overflow-hidden">
              <div className="p-8 space-y-4">
                <h4 className="text-sm font-black uppercase tracking-widest text-white mb-4">Trade History</h4>
                {loadingTrades ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4 bg-white/2 rounded-3xl border border-white/5">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Loading...</p>
                  </div>
                ) : challengeTrades.length === 0 ? (
                  <div className="text-center py-12 bg-white/2 rounded-3xl border border-white/5">
                    <Activity className="w-8 h-8 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground text-sm">No trades yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-white/5"><tr className="text-muted-foreground text-xs uppercase tracking-wider">
                        {["Date", "Pair", "Lot", "Dir", "P/L", "Risk %", "Actions"].map(h => (
                          <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                        ))}
                      </tr></thead>
                      <tbody className="divide-y divide-white/5">
                        {challengeTrades.map(trade => {
                          const riskPct = calculatePerTradeRiskPercent(trade, c.accountSize);
                          const riskColor = riskPct === 0 ? "text-muted-foreground/40" : riskPct <= 2 ? "text-profit" : riskPct <= c.maxRiskPerTrade ? "text-amber-400" : "text-loss";
                          return (
                            <tr key={trade.id} className="hover:bg-white/5 transition-colors">
                              <td className="px-4 py-3 text-muted-foreground font-mono text-xs whitespace-nowrap">
                                <div>{trade.date}</div><div className="text-[10px] opacity-70">{trade.time}</div>
                              </td>
                              <td className="px-4 py-3 font-semibold text-white">{trade.pair}</td>
                              <td className="px-4 py-3"><span className="text-[10px] font-black text-white bg-white/5 px-2 py-0.5 rounded border border-white/10">{trade.lotSize}</span></td>
                              <td className="px-4 py-3"><span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full border ${trade.direction === "BUY" ? "bg-profit/10 text-profit border-profit/20" : "bg-loss/10 text-loss border-loss/20"}`}>{trade.direction}</span></td>
                              <td className="px-4 py-3">
                                <span className={`font-mono font-bold text-xs ${trade.profitLoss >= 0 ? "text-profit" : "text-loss"}`}>
                                  {trade.profitLoss > 0 ? "+" : ""}${trade.profitLoss.toFixed(2)}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`text-xs font-bold ${riskColor}`}>
                                  {riskPct > 0 ? `${riskPct}%` : "—"}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                {!isArchived && (
                                  <Link to={`/edit-trade/${trade.id}?challengeId=${c.id}`} className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors inline-block">
                                    <Edit3 className="w-4 h-4" />
                                  </Link>
                                )}
                              </td>
                            </tr>
                          );
                        })}
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

// ─── Progress Bar Component ─────────────────────────────────────────

function ProgressBar({ label, value, max, unit, icon, color, percent, completed, warning }: {
  label: string; value: number; max: number; unit: string; icon: React.ReactNode;
  color: string; percent: number; completed?: boolean; warning?: boolean;
}) {
  const clampedPercent = Math.min(100, Math.max(0, percent));
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-xs font-black uppercase tracking-widest">{label}</span>
          {warning && <span className="text-[8px] font-black text-loss uppercase tracking-widest animate-pulse flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Warning</span>}
        </div>
        <span className="text-xs font-mono font-black">
          {unit}{value.toFixed(2)} / {unit}{max.toLocaleString()}
          <span className="text-muted-foreground ml-1">({clampedPercent.toFixed(1)}%)</span>
        </span>
      </div>
      <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden relative">
        <motion.div initial={{ width: 0 }} animate={{ width: `${clampedPercent}%` }}
          className={`h-full rounded-full bg-gradient-to-r ${color === "profit" ? "from-profit/40 to-profit" : color === "loss" ? "from-loss/60 to-loss" : color === "amber-400" ? "from-amber-400/40 to-amber-400" : "from-primary/40 to-primary"}`}
          transition={{ duration: 1 }} />
        {completed && <div className="absolute right-2 top-1/2 -translate-y-1/2"><CheckCircle2 className="w-2.5 h-2.5 text-white" /></div>}
      </div>
    </div>
  );
}
