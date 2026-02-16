import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { Calendar } from "@/components/ui/calendar";
import { useTrades } from "@/hooks/useTrades";
import { Trade } from "@/lib/tradeTypes";
import { format, startOfMonth, endOfMonth, isSameMonth, parseISO } from "date-fns";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { TrendingUp, TrendingDown, Activity, CalendarDays, Award } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function CalendarPage() {
    const { user } = useAuth();
    const { trades } = useTrades();
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

    // Group trades by date
    const tradesByDate = useMemo(() => trades.reduce((acc, trade) => {
        const dateStr = trade.date; // YYYY-MM-DD
        if (!acc[dateStr]) acc[dateStr] = [];
        acc[dateStr].push(trade);
        return acc;
    }, {} as Record<string, Trade[]>), [trades]);

    // Calculate daily PnL and status
    const dailyStats = useMemo(() => Object.entries(tradesByDate).reduce((acc, [dateStr, dayTrades]) => {
        const pnl = dayTrades.reduce((sum, t) => sum + t.profitLoss, 0);
        acc[dateStr] = {
            pnl,
            status: pnl > 0 ? "profit" : pnl < 0 ? "loss" : "breakeven",
            count: dayTrades.length
        };
        return acc;
    }, {} as Record<string, { pnl: number, status: "profit" | "loss" | "breakeven", count: number }>), [tradesByDate]);

    // Calculate Monthly Stats
    const monthlyStats = useMemo(() => {
        // Debug current month
        const targetMonth = currentMonth.getMonth(); // 0-11
        const targetYear = currentMonth.getFullYear();
        console.log("Analyzing month:", targetMonth + 1, targetYear);

        const monthTrades = trades.filter(t => {
            // t.date is YYYY-MM-DD string
            if (!t.date) return false;
            const [y, m, d] = t.date.split('-').map(Number);
            // Check if matches target year and month (m is 1-12)
            const match = y === targetYear && (m - 1) === targetMonth;
            if (match) {
                // console.log("Matched trade:", t.date, t.profitLoss);
            }
            return match;
        });

        const totalPnL = monthTrades.reduce((sum, t) => sum + t.profitLoss, 0);
        const tradeCount = monthTrades.length;
        const wins = monthTrades.filter(t => t.profitLoss > 0).length;
        const losses = monthTrades.filter(t => t.profitLoss < 0).length;
        const winRate = tradeCount > 0 ? (wins / tradeCount) * 100 : 0;

        // Find best and worst days
        let bestDay = { date: "", pnl: -Infinity };
        let worstDay = { date: "", pnl: Infinity };

        // Scan trades specifically for this month to find best/worst days
        // Group *current month* trades by day first
        const monthDailyPnL: Record<string, number> = {};
        monthTrades.forEach(t => {
            if (!t.date) return;
            monthDailyPnL[t.date] = (monthDailyPnL[t.date] || 0) + t.profitLoss;
        });

        // Find best/worst from these
        Object.entries(monthDailyPnL).forEach(([dateStr, pnl]) => {
            if (pnl > bestDay.pnl) bestDay = { date: dateStr, pnl };
            if (pnl < worstDay.pnl) worstDay = { date: dateStr, pnl };
        });

        return {
            totalPnL,
            tradeCount,
            winRate,
            bestDay: bestDay.pnl !== -Infinity ? bestDay : null,
            worstDay: worstDay.pnl !== Infinity ? worstDay : null
        };
    }, [trades, currentMonth, dailyStats]);

    // Selected date details
    const selectedDateStr = date ? format(date, "yyyy-MM-dd") : "";
    const selectedDayTrades = tradesByDate[selectedDateStr] || [];
    const selectedDayStats = dailyStats[selectedDateStr];

    // Calendar notes state
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
        // Path: traders/{uid}/calendar/notes
        const docRef = doc(db, "traders", user.uid, "calendar", "notes");
        console.log("Subscribing to calendar notes at:", docRef.path);

        const unsubscribe = onSnapshot(docRef, (snap) => {
            if (snap.exists()) {
                console.log("Calendar notes loaded:", Object.keys(snap.data()).length);
                setNotes(snap.data() as Record<string, string>);
            } else {
                console.log("Calendar notes doc missing, creating...");
                setDoc(docRef, {}).catch(err => console.error("Error creating calendar doc:", err));
                setNotes({});
            }
            setNotesLoading(false);
        }, (error) => {
            console.error("Error subscribing to calendar notes:", error);
            setNotesLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const handleNoteChange = async (newNote: string) => {
        if (!selectedDateStr || !user || !notes) return;

        const updatedNotes = { ...notes, [selectedDateStr]: newNote };
        setNotes(updatedNotes); // Optimistic update
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

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">

            {/* Monthly Summary Cards */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
            >
                <GlassCard className="p-4 flex items-center justify-between relative overflow-hidden group">
                    <div>
                        <p className="text-sm text-muted-foreground mb-1">Monthly P/L</p>
                        <h3 className={`text-2xl font-bold font-mono ${monthlyStats.totalPnL >= 0 ? "text-profit" : "text-loss"}`}>
                            {monthlyStats.totalPnL >= 0 ? "+" : ""}${monthlyStats.totalPnL.toFixed(2)}
                        </h3>
                    </div>
                    <div className={`p-3 rounded-full ${monthlyStats.totalPnL >= 0 ? "bg-profit/20 text-profit" : "bg-loss/20 text-loss"}`}>
                        {monthlyStats.totalPnL >= 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                    </div>
                    <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full blur-2xl opacity-20 transition-opacity duration-500 group-hover:opacity-40 ${monthlyStats.totalPnL >= 0 ? "bg-profit" : "bg-loss"}`} />
                </GlassCard>

                <GlassCard className="p-4 flex items-center justify-between relative overflow-hidden group">
                    <div>
                        <p className="text-sm text-muted-foreground mb-1">Win Rate</p>
                        <h3 className="text-2xl font-bold font-mono text-foreground">
                            {monthlyStats.winRate.toFixed(1)}%
                        </h3>
                    </div>
                    <div className="p-3 rounded-full bg-primary/20 text-primary">
                        <Activity className="w-6 h-6" />
                    </div>
                    <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-primary blur-2xl opacity-20 transition-opacity duration-500 group-hover:opacity-40" />
                </GlassCard>

                <GlassCard className="p-4 flex items-center justify-between relative overflow-hidden group">
                    <div>
                        <p className="text-sm text-muted-foreground mb-1">Trades</p>
                        <h3 className="text-2xl font-bold font-mono text-foreground">
                            {monthlyStats.tradeCount}
                        </h3>
                    </div>
                    <div className="p-3 rounded-full bg-secondary text-secondary-foreground">
                        <CalendarDays className="w-6 h-6" />
                    </div>
                </GlassCard>

                <GlassCard className="p-4 flex items-center justify-between relative overflow-hidden group">
                    <div>
                        <p className="text-sm text-muted-foreground mb-1">Best Day</p>
                        <h3 className="text-lg font-bold font-mono text-profit">
                            {monthlyStats.bestDay ? `+$${monthlyStats.bestDay.pnl.toFixed(2)}` : "—"}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                            {monthlyStats.bestDay ? format(parseISO(monthlyStats.bestDay.date), "MMM do") : ""}
                        </p>
                    </div>
                    <div className="p-3 rounded-full bg-profit/20 text-profit">
                        <Award className="w-6 h-6" />
                    </div>
                </GlassCard>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="lg:col-span-2"
                >
                    <GlassCard>
                        <div className="p-4">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                month={currentMonth}
                                onMonthChange={setCurrentMonth}
                                className="rounded-md w-full flex justify-center"
                                modifiers={{
                                    profit: (d) => { const k = format(d, "yyyy-MM-dd"); return dailyStats[k]?.status === "profit"; },
                                    loss: (d) => { const k = format(d, "yyyy-MM-dd"); return dailyStats[k]?.status === "loss"; },
                                    breakeven: (d) => { const k = format(d, "yyyy-MM-dd"); return dailyStats[k]?.status === "breakeven"; },
                                    hasNote: (d) => { const k = format(d, "yyyy-MM-dd"); return !!(notes || {})[k]; }
                                }}
                                modifiersClassNames={{
                                    profit: "bg-profit/20 text-profit font-bold hover:bg-profit/30 hover:scale-105 transition-transform duration-200 cursor-pointer",
                                    loss: "bg-loss/20 text-loss font-bold hover:bg-loss/30 hover:scale-105 transition-transform duration-200 cursor-pointer",
                                    breakeven: "bg-muted text-muted-foreground font-bold hover:bg-muted/80 cursor-pointer",
                                    hasNote: "underline decoration-primary decoration-2"
                                }}
                            />
                        </div>
                    </GlassCard>

                    {/* Notes Section with Animation */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={selectedDateStr}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                        >
                            <GlassCard className="mt-6 p-6">
                                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                                    <span>Daily Notes</span>
                                    {date && <span className="text-sm font-normal text-muted-foreground">for {format(date, "MMMM do")}</span>}
                                    {notesLoading && <span className="text-xs text-muted-foreground animate-pulse ml-2">(Loading...)</span>}
                                </h3>
                                {date ? (
                                    <div className="space-y-2 relative">
                                        <textarea
                                            className="w-full h-32 p-4 rounded-xl bg-secondary/30 border border-white/5 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 resize-none placeholder:text-muted-foreground/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                            placeholder="Journal your thoughts, emotions, and market observations..."
                                            value={(notes || {})[selectedDateStr] || ""}
                                            onChange={(e) => handleNoteChange(e.target.value)}
                                            spellCheck={false}
                                            disabled={notesLoading || !user}
                                        />
                                        <div className="absolute bottom-4 right-4 text-xs mx-auto">
                                            <span className={`transition-opacity duration-300 ${savingNote ? "opacity-100 text-primary" : "opacity-50 text-muted-foreground"}`}>
                                                {savingNote ? "Saving..." : "Saved"}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground">Select a date to view or add notes.</p>
                                )}
                            </GlassCard>
                        </motion.div>
                    </AnimatePresence>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="lg:col-span-1 space-y-6"
                >
                    <GlassCard>
                        <h2 className="text-xl font-bold mb-4">
                            {date ? format(date, "MMMM do, yyyy") : "Select a date"}
                        </h2>

                        {selectedDayStats ? (
                            <div className="space-y-4">
                                <motion.div
                                    className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 backdrop-blur-md border border-white/5"
                                    initial={{ scale: 0.95, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                >
                                    <span className="text-muted-foreground">Net P/L</span>
                                    <span className={`text-2xl font-mono font-bold ${selectedDayStats.pnl > 0 ? "text-profit" : selectedDayStats.pnl < 0 ? "text-loss" : "text-muted-foreground"
                                        }`}>
                                        {selectedDayStats.pnl > 0 ? "+" : ""}${selectedDayStats.pnl.toFixed(2)}
                                    </span>
                                </motion.div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col p-3 rounded-lg bg-secondary/30 text-center">
                                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Trades</span>
                                        <span className="font-mono font-bold text-xl">{selectedDayStats.count}</span>
                                    </div>
                                    <div className="flex flex-col p-3 rounded-lg bg-secondary/30 text-center">
                                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Status</span>
                                        <span className={`font-bold text-sm uppercase mt-1 ${selectedDayStats.status === "profit" ? "text-profit" :
                                            selectedDayStats.status === "loss" ? "text-loss" : "text-muted-foreground"
                                            }`}>
                                            {selectedDayStats.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-center opacity-60">
                                <Activity className="w-12 h-12 text-muted-foreground mb-3" />
                                <p className="text-muted-foreground text-sm">No trades recorded for this day.</p>
                            </div>
                        )}
                    </GlassCard>

                    <AnimatePresence mode="popLayout">
                        {selectedDayTrades.length > 0 && (
                            <motion.div
                                className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                <h3 className="font-semibold text-muted-foreground text-xs uppercase tracking-wider sticky top-0 bg-background/80 backdrop-blur-sm py-2 z-10">
                                    Trades ({selectedDayTrades.length})
                                </h3>
                                {selectedDayTrades.map((trade, index) => (
                                    <motion.div
                                        key={trade.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <GlassCard className="p-4 !bg-secondary/20 hover:!bg-secondary/40 transition-all cursor-pointer group hover:border-primary/20">
                                            <div className="flex justify-between items-center mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-sm">{trade.pair}</span>
                                                    <span className="text-xs text-muted-foreground">{trade.strategy}</span>
                                                </div>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${trade.direction === "BUY" ? "bg-profit/10 text-profit border-profit/20" : "bg-loss/10 text-loss border-loss/20"
                                                    }`}>
                                                    {trade.direction}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-muted-foreground font-mono">{trade.time}</span>
                                                <span className={`font-mono font-bold text-sm ${trade.profitLoss >= 0 ? "text-profit" : "text-loss"
                                                    }`}>
                                                    {trade.profitLoss > 0 ? "+" : ""}${trade.profitLoss.toFixed(2)}
                                                </span>
                                            </div>
                                        </GlassCard>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </div>
    );
}
