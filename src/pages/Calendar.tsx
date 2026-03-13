import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { useTrades } from "@/hooks/useTrades";
import { Trade } from "@/lib/tradeTypes";
import { 
    format, 
    startOfMonth, 
    endOfMonth, 
    startOfWeek, 
    endOfWeek, 
    eachDayOfInterval, 
    isSameMonth, 
    isSameDay, 
    isToday, 
    parseISO, 
    addMonths, 
    subMonths 
} from "date-fns";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { 
    TrendingUp, 
    TrendingDown, 
    Activity, 
    CalendarDays, 
    Award, 
    Sparkles, 
    ChevronRight, 
    Fingerprint, 
    Zap, 
    Target, 
    BookOpen, 
    ChevronLeft, 
    Lock,
    Globe
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function CalendarPage() {
    const { user } = useAuth();
    const { trades } = useTrades();
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [viewDate, setViewDate] = useState<Date>(new Date());

    // Generate days for the grid
    const calendarDays = useMemo(() => {
        const start = startOfWeek(startOfMonth(viewDate), { weekStartsOn: 1 });
        const end = endOfWeek(endOfMonth(viewDate), { weekStartsOn: 1 });
        return eachDayOfInterval({ start, end });
    }, [viewDate]);

    // Group trades by date
    const tradesByDate = useMemo(() => trades.reduce((acc, trade) => {
        const dateStr = trade.date; 
        if (!acc[dateStr]) acc[dateStr] = [];
        acc[dateStr].push(trade);
        return acc;
    }, {} as Record<string, Trade[]>), [trades]);

    // Daily Stats
    const dailyStats = useMemo(() => Object.entries(tradesByDate).reduce((acc, [dateStr, dayTrades]) => {
        const pnl = dayTrades.reduce((sum, t) => sum + t.profitLoss, 0);
        acc[dateStr] = {
            pnl,
            status: pnl > 0 ? "profit" : pnl < 0 ? "loss" : "breakeven",
            count: dayTrades.length
        };
        return acc;
    }, {} as Record<string, { pnl: number, status: "profit" | "loss" | "breakeven", count: number }>), [tradesByDate]);

    // Monthly Summary
    const monthlyStats = useMemo(() => {
        const targetMonth = viewDate.getMonth();
        const targetYear = viewDate.getFullYear();

        const monthTrades = trades.filter(t => {
            if (!t.date) return false;
            const [y, m] = t.date.split('-').map(Number);
            return y === targetYear && (m - 1) === targetMonth;
        });

        const totalPnL = monthTrades.reduce((sum, t) => sum + t.profitLoss, 0);
        const wins = monthTrades.filter(t => t.profitLoss > 0).length;
        const losses = monthTrades.filter(t => t.profitLoss < 0).length;
        const winRate = monthTrades.length > 0 ? (wins / monthTrades.length) * 100 : 0;

        let bestDay = { date: "", pnl: -Infinity };
        const monthDailyPnL: Record<string, number> = {};
        monthTrades.forEach(t => {
            if (!t.date) return;
            monthDailyPnL[t.date] = (monthDailyPnL[t.date] || 0) + t.profitLoss;
        });
        Object.entries(monthDailyPnL).forEach(([dateStr, pnl]) => {
            if (pnl > bestDay.pnl) bestDay = { date: dateStr, pnl };
        });

        return {
            totalPnL,
            tradeCount: monthTrades.length,
            winRate,
            bestDay: bestDay.pnl !== -Infinity ? bestDay : null
        };
    }, [trades, viewDate]);

    const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
    const selectedDayTrades = tradesByDate[selectedDateStr] || [];
    const selectedDayStats = dailyStats[selectedDateStr];

    const [notes, setNotes] = useState<Record<string, string> | null>(null);
    const [savingNote, setSavingNote] = useState(false);
    const [notesLoading, setNotesLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setNotes({});
            setNotesLoading(false);
            return;
        }
        setNotesLoading(true);
        const docRef = doc(db, "traders", user.uid, "calendar", "notes");
        const unsubscribe = onSnapshot(docRef, (snap) => {
            if (snap.exists()) {
                setNotes(snap.data() as Record<string, string>);
            } else {
                setDoc(docRef, {}).catch(err => console.error("Error creating calendar doc:", err));
                setNotes({});
            }
            setNotesLoading(false);
        }, (error) => {
            console.error("Error subscribing to notes:", error);
            setNotesLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

    const handleNoteChange = async (newNote: string) => {
        if (!selectedDateStr || !user || !notes) return;
        const updatedNotes = { ...notes, [selectedDateStr]: newNote };
        setNotes(updatedNotes);
        setSavingNote(true);
        try {
            const docRef = doc(db, "traders", user.uid, "calendar", "notes");
            await setDoc(docRef, updatedNotes);
        } catch (error) {
            console.error("Error saving note:", error);
        } finally {
            setSavingNote(false);
        }
    };

    return (
        <div className="space-y-10 pb-24 relative max-w-7xl mx-auto">
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
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 flex items-center gap-2">
                                <span className="text-[10px] font-black tracking-[0.3em] uppercase text-primary">Performance Data Syncing</span>
                            </div>
                        </div>
                        <div>
                            <h1 className="text-5xl font-black tracking-tighter text-white uppercase ">Performance <span className="text-primary not-">Calendar</span></h1>
                            <div className="flex items-center gap-4 mt-2">
                                <button onClick={() => setViewDate(subMonths(viewDate, 1))} className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                                    <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                                </button>
                                <span className="text-white font-black px-4 py-1.5 rounded-2xl bg-white/5 border border-white/10 uppercase  text-lg shadow-inner min-w-[200px] text-center">
                                    {format(viewDate, "MMMM yyyy")}
                                </span>
                                <button onClick={() => setViewDate(addMonths(viewDate, 1))} className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1">Monthly Profit Index</p>
                            <div className="flex items-baseline gap-2">
                                <p className={`text-6xl font-black tracking-tighter shimmer-text ${monthlyStats.totalPnL >= 0 ? 'text-white' : 'text-loss'}`}>
                                    {monthlyStats.totalPnL >= 0 ? "+" : ""}{monthlyStats.totalPnL.toFixed(0)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Tactical Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Net Profit", value: `$${monthlyStats.totalPnL.toFixed(2)}`, icon: Activity, color: monthlyStats.totalPnL >= 0 ? "text-profit" : "text-loss", bg: monthlyStats.totalPnL >= 0 ? "bg-profit/10" : "bg-loss/10" },
                    { label: "Win Probability", value: `${monthlyStats.winRate.toFixed(1)}%`, icon: Target, color: "text-primary", bg: "bg-primary/10" },
                    { label: "Trade Count", value: monthlyStats.tradeCount, icon: CalendarDays, color: "text-white", bg: "bg-white/5" },
                    { label: "Performance Peak", value: monthlyStats.bestDay ? `+$${monthlyStats.bestDay.pnl.toFixed(2)}` : "—", icon: Award, color: "text-profit", bg: "bg-profit/10", sub: monthlyStats.bestDay ? format(parseISO(monthlyStats.bestDay.date), "MMM do") : "" }
                ].map((stat, i) => (
                    <GlassCard key={i} className="p-6 rounded-[2rem] border-white/10 relative overflow-hidden group hover:scale-[1.02] transition-all">
                        <div className={`absolute -right-4 -bottom-4 w-24 h-24 ${stat.bg} rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity`} />
                        <div className="relative z-10 flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                                    <stat.icon className="w-5 h-5" />
                                </div>
                                <div className="text-[8px] font-black uppercase tracking-widest text-muted-foreground opacity-40 ">Performance Node 0{i+1}</div>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{stat.label}</p>
                                <p className={`text-2xl font-black tracking-tight ${stat.color}`}>{stat.value}</p>
                            </div>
                        </div>
                    </GlassCard>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Main Calendar Section (Custom Neural Grid) */}
                <div className="lg:col-span-8 space-y-8">
                    <GlassCard hover={false} className="p-6 rounded-[2.5rem] border-white/10 shadow-3xl bg-black/40 backdrop-blur-3xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full circuit-pattern opacity-[0.05] pointer-events-none" />
                        
                        <div className="relative z-10">
                            {/* Days of Week */}
                            <div className="grid grid-cols-7 mb-4">
                                {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map(day => (
                                    <div key={day} className="text-center text-[10px] font-black text-muted-foreground tracking-widest uppercase py-2">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Calendar Grid */}
                            <div className="grid grid-cols-7 gap-2">
                                {calendarDays.map((day, i) => {
                                    const dateStr = format(day, "yyyy-MM-dd");
                                    const stats = dailyStats[dateStr];
                                    const isCurrentMonth = isSameMonth(day, viewDate);
                                    const isSelected = isSameDay(day, selectedDate);
                                    const hasTrades = stats && stats.count > 0;
                                    const hasNote = notes && notes[dateStr];

                                    return (
                                        <motion.button
                                            key={i}
                                            onClick={() => setSelectedDate(day)}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            className={`
                                                relative h-24 lg:h-32 rounded-2xl border transition-all duration-300 flex flex-col p-3 overflow-hidden group
                                                ${!isCurrentMonth ? 'opacity-20 border-transparent grayscale' : 'border-white/5 hover:border-primary/30'}
                                                ${isSelected ? 'border-primary ring-2 ring-primary/20 bg-primary/5 shadow-glow' : 'bg-white/5'}
                                                ${stats?.status === 'profit' ? 'bg-profit/5 shadow-[inset_0_0_20px_rgba(var(--profit),0.05)]' : ''}
                                                ${stats?.status === 'loss' ? 'bg-loss/5 shadow-[inset_0_0_20px_rgba(var(--loss),0.05)]' : ''}
                                            `}
                                        >
                                            {/* Cell Decorations */}
                                            {stats?.status === 'profit' && <div className="absolute -top-10 -right-10 w-20 h-20 bg-profit/10 rounded-full blur-xl" />}
                                            {stats?.status === 'loss' && <div className="absolute -top-10 -right-10 w-20 h-20 bg-loss/10 rounded-full blur-xl" />}
                                            
                                            <div className="flex justify-between items-start z-10 w-full">
                                                <span className={`text-xs font-black  ${isToday(day) ? 'text-primary' : 'text-muted-foreground/60'}`}>
                                                    {format(day, "d")}
                                                </span>
                                                {hasTrades && (
                                                    <div className="flex gap-0.5">
                                                        {Array.from({ length: Math.min(stats.count, 3) }).map((_, idx) => (
                                                            <div key={idx} className={`w-1 h-1 rounded-full ${stats.status === 'profit' ? 'bg-profit shadow-profit' : 'bg-loss shadow-loss'} animate-pulse`} />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {hasTrades && (
                                                <div className="flex-1 flex flex-col items-center justify-center z-10">
                                                    <p className={`text-lg font-black font-mono tracking-tighter ${stats.status === 'profit' ? 'text-profit shimmer-text' : 'text-loss'}`}>
                                                        {stats.pnl >= 0 ? "+" : ""}{Math.round(stats.pnl)}
                                                    </p>
                                                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Activity className="w-2.5 h-2.5 text-muted-foreground" />
                                                        <span className="text-[8px] font-black text-white">{stats.count} TRADES</span>
                                                    </div>
                                                </div>
                                            )}

                                            {hasNote && !hasTrades && (
                                                <div className="flex-1 flex items-center justify-center z-10 opacity-30">
                                                    <BookOpen className="w-4 h-4 text-primary" />
                                                </div>
                                            )}

                                            {isSelected && (
                                                <motion.div 
                                                    layoutId="neural-pulse"
                                                    className="absolute inset-x-0 bottom-0 h-[3px] bg-primary animate-pulse"
                                                />
                                            )}
                                        </motion.button>
                                    );
                                })}
                            </div>

                            {/* Neural Legend */}
                            <div className="mt-8 pt-6 border-t border-white/5 flex flex-wrap items-center gap-6 justify-center">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-profit animate-pulse shadow-profit" />
                                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Profit</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-loss animate-pulse shadow-loss" />
                                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Drawdown</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-primary shadow-glow" />
                                    <span className="text-[9px] font-black text-primary uppercase tracking-widest">Selected Node</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <BookOpen className="w-3 h-3 text-muted-foreground opacity-50" />
                                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Trade Notes Attached</span>
                                </div>
                            </div>
                        </div>
                    </GlassCard>

                    {/* Neural Notes / Data Log */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={selectedDateStr}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative group"
                        >
                            <div className="absolute -inset-0.5 bg-primary/20 rounded-[2.5rem] blur opacity-0 group-hover:opacity-100 transition duration-500" />
                            <GlassCard className="p-10 rounded-[2.5rem] bg-black/40 border-white/10 relative overflow-hidden">
                                <div className="absolute top-0 right-10 p-4">
                                    <BookOpen className="w-20 h-20 text-primary opacity-5" />
                                </div>
                                
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 rounded-2xl bg-primary/10 text-primary shadow-[0_0_15px_rgba(var(--primary),0.3)]">
                                            <Zap className="w-5 h-5 fill-primary" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black uppercase tracking-tighter ">Trade Notes</h3>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Timestamp:</span>
                                                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{format(selectedDate, "dd-MM-yyyy")}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10">
                                        <span className={`flex h-2 w-2 rounded-full ${savingNote ? 'bg-primary animate-pulse' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'}`} />
                                        <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">
                                            {savingNote ? "Saving Notes..." : "Auto-Save Active"}
                                        </span>
                                    </div>
                                </div>

                                <textarea
                                    className="w-full h-40 p-6 rounded-3xl bg-black/20 border border-white/5 focus:border-primary/40 focus:ring-4 focus:ring-primary/10 resize-none font-medium text-lg leading-relaxed placeholder:text-muted-foreground/20 transition-all outline-none"
                                    placeholder="Enter market observations, emotional triggers, and trading notes..."
                                    value={(notes || {})[selectedDateStr] || ""}
                                    onChange={(e) => handleNoteChange(e.target.value)}
                                    spellCheck={false}
                                    disabled={notesLoading || !user}
                                />
                            </GlassCard>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Right Column: Tactical Audit Details */}
                <div className="lg:col-span-4 space-y-8">
                    <GlassCard className="p-8 rounded-[2.5rem] border-white/10 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <Activity className="w-32 h-32" />
                        </div>
                        
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-3">
                                <Target className="w-5 h-5 text-primary" />
                                Performance Audit
                            </h2>
                            <div className="text-[8px] font-bold text-muted-foreground bg-white/5 px-2 py-1 rounded-md uppercase">Logs Online</div>
                        </div>

                        {selectedDayStats ? (
                            <div className="space-y-6">
                                <motion.div
                                    className="p-10 rounded-3xl bg-black/60 border border-white/10 text-center relative overflow-hidden group shadow-inner"
                                    initial={{ scale: 0.95, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                >
                                    <div className={`absolute inset-0 opacity-20 blur-3xl transition-opacity group-hover:opacity-30 ${selectedDayStats.pnl > 0 ? "bg-profit" : "bg-loss"}`} />
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-3 opacity-60 ">Daily Performance</p>
                                    <p className={`text-6xl font-black tracking-tighter ${selectedDayStats.pnl > 0 ? 'text-profit shimmer-text ' : 'text-loss'}`}>
                                        {selectedDayStats.pnl > 0 ? "+" : ""}{selectedDayStats.pnl.toFixed(0)}
                                    </p>
                                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                                        <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-[8px] font-black text-muted-foreground tracking-widest uppercase">Verified Profit</span>
                                    </div>
                                </motion.div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-[1.5rem] bg-white/5 border border-white/10 text-center group hover:bg-white/10 transition-colors">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">Trades</p>
                                        <p className="text-3xl font-black text-white">{selectedDayStats.count}</p>
                                    </div>
                                    <div className="p-4 rounded-[1.5rem] bg-white/5 border border-white/10 text-center group hover:bg-white/10 transition-colors flex flex-col justify-center">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">Status</p>
                                        <div className={`mt-1 font-black text-xs uppercase tracking-widest ${
                                            selectedDayStats.status === "profit" ? "text-profit" :
                                            selectedDayStats.status === "loss" ? "text-loss" : "text-muted-foreground"
                                        }`}>
                                            {selectedDayStats.status}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="relative mb-6">
                                    <div className="absolute -inset-4 bg-muted/20 rounded-full blur-xl" />
                                    <Activity className="w-12 h-12 text-muted-foreground/20 relative" />
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-30 ">No Data Nodes Found</p>
                            </div>
                        )}
                    </GlassCard>

                    <AnimatePresence mode="popLayout">
                        {selectedDayTrades.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-2">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ">Trade Log <span className="text-primary not-">({selectedDayTrades.length})</span></h3>
                                    <span className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent ml-4" />
                                </div>
                                
                                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                    {selectedDayTrades.map((trade, index) => (
                                        <motion.div
                                            key={trade.id}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                        >
                                            <GlassCard className="p-6 !bg-black/30 hover:!bg-black/50 border-white/5 hover:border-primary/40 transition-all cursor-pointer group rounded-3xl relative overflow-hidden">
                                                <div className={`absolute top-0 right-0 w-1 h-full ${trade.direction === 'BUY' ? 'bg-profit' : 'bg-loss'} opacity-30`} />
                                                
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <h4 className="font-black text-xl tracking-tighter uppercase  group-hover:text-primary transition-colors">{trade.pair}</h4>
                                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                                                            <Zap className="w-3 h-3" />
                                                            {trade.strategy}
                                                        </p>
                                                    </div>
                                                    <div className={`px-3 py-1 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all ${
                                                        trade.direction === "BUY" ? "bg-profit/10 text-profit border-profit/20 group-hover:bg-profit/20" : "bg-loss/10 text-loss border-loss/20 group-hover:bg-loss/20"
                                                    }`}>
                                                        {trade.direction}
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-end">
                                                    <div className="flex flex-col">
                                                        <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest opacity-40 mb-1">Execution Time</p>
                                                        <span className="text-xs font-bold font-mono text-white/80">{trade.time}</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest opacity-40 mb-1 text-right">Trade Profit</p>
                                                        <p className={`font-mono font-black text-xl leading-none ${trade.profitLoss >= 0 ? "text-profit shimmer-text" : "text-loss"}`}>
                                                            {trade.profitLoss > 0 ? "+" : ""}{trade.profitLoss.toFixed(2)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </GlassCard>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
