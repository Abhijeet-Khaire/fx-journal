import { useState, useMemo } from "react";
import { useTrades } from "@/hooks/useTrades";
import { usePlan } from "@/hooks/usePlan";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import {
    getExpectancyBy,
    getBestTradingWindow,
    detectLosingPatterns,
    getWinRate,
    getProfitFactor,
    getAverageRR,
    getNetProfit,
    getEquityCurve,
} from "@/lib/tradeStore";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, AreaChart, Area, PieChart, Pie
} from "recharts";
import {
    Brain, Clock, AlertTriangle, TrendingUp, Lock, Calendar as CalendarIcon, Filter, DollarSign, Target, Scale, Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, isWithinInterval, parseISO } from "date-fns";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { SkeletonCard, SkeletonChart } from "@/components/SkeletonLoader";

export default function Analytics() {
    const { trades: allTrades, loading } = useTrades();
    const { plan } = usePlan();
    const isPro = plan === "pro" || plan === "ultimate";
    const [date, setDate] = useState<DateRange | undefined>(undefined);
    const [expectancyGroup, setExpectancyGroup] = useState<"session" | "pair" | "strategy">("session");

    // Filter Logic
    const trades = useMemo(() => {
        if (!date?.from) return allTrades;
        return allTrades.filter((t) => {
            const tradeDate = parseISO(t.date);
            const end = date.to || date.from;
            const endOfDay = new Date(end!);
            endOfDay.setHours(23, 59, 59, 999);
            return isWithinInterval(tradeDate, { start: date.from!, end: endOfDay });
        });
    }, [allTrades, date]);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SkeletonChart /><SkeletonChart />
                </div>
            </div>
        );
    }

    // Metrics Calculation
    const winRate = getWinRate(trades);
    const profitFactor = getProfitFactor(trades);
    const avgRR = getAverageRR(trades);
    const netProfit = getNetProfit(trades);
    const equityData = getEquityCurve(trades);
    const expectancyData = getExpectancyBy(trades, expectancyGroup);

    // Distribution Data
    const wins = trades.filter(t => t.profitLoss > 0).length;
    const losses = trades.filter(t => t.profitLoss < 0).length;
    const be = trades.filter(t => t.profitLoss === 0).length;
    const distributionData = [
        { name: "Wins", value: wins, color: "hsl(160, 70%, 45%)" },
        { name: "Losses", value: losses, color: "hsl(0, 72%, 55%)" },
        { name: "BE", value: be, color: "hsl(220, 15%, 55%)" },
    ].filter(d => d.value > 0);

    // Insights
    const bestWindow = getBestTradingWindow(trades);
    const losingPatterns = detectLosingPatterns(trades);

    return (
        <div className="space-y-6 pb-10">
            {/* Header & Date Filter */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-cyan-400">
                        Analytics
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Deep dive into your trading performance.
                    </p>
                </motion.div>

                <div className="flex items-center gap-2 bg-secondary/30 p-1 rounded-lg border border-white/5">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-[240px] justify-start text-left font-normal border-none bg-transparent hover:bg-white/5",
                                    !date && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date?.from ? (
                                    date.to ? (
                                        <>
                                            {format(date.from, "LLL dd, y")} -{" "}
                                            {format(date.to, "LLL dd, y")}
                                        </>
                                    ) : (
                                        format(date.from, "LLL dd, y")
                                    )
                                ) : (
                                    <span>All Time</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={date?.from}
                                selected={date}
                                onSelect={setDate}
                                numberOfMonths={2}
                            />
                        </PopoverContent>
                    </Popover>
                    {date?.from && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => setDate(undefined)}
                        >
                            <Filter className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <GlassCard className="p-4 flex items-center justify-between" glow={netProfit > 0}>
                    <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Net Profit</p>
                        <span className={`text-2xl font-bold font-mono ${netProfit >= 0 ? "text-profit" : "text-loss"}`}>
                            {netProfit >= 0 ? "+" : ""}${netProfit.toLocaleString()}
                        </span>
                    </div>
                    <div className={`p-3 rounded-full ${netProfit >= 0 ? "bg-profit/10 text-profit" : "bg-loss/10 text-loss"}`}>
                        <DollarSign className="w-5 h-5" />
                    </div>
                </GlassCard>

                <GlassCard className="p-4 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Win Rate</p>
                        <span className={`text-2xl font-bold font-mono ${winRate >= 50 ? "text-profit" : "text-warning"}`}>
                            {winRate}%
                        </span>
                    </div>
                    <div className="p-3 rounded-full bg-primary/10 text-primary">
                        <Target className="w-5 h-5" />
                    </div>
                </GlassCard>

                <GlassCard className="p-4 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Profit Factor</p>
                        <span className={`text-2xl font-bold font-mono ${profitFactor >= 1.5 ? "text-profit" : "text-muted-foreground"}`}>
                            {profitFactor.toFixed(2)}
                        </span>
                    </div>
                    <div className="p-3 rounded-full bg-indigo-500/10 text-indigo-500">
                        <Scale className="w-5 h-5" />
                    </div>
                </GlassCard>

                <GlassCard className="p-4 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Avg R:R</p>
                        <span className="text-2xl font-bold font-mono text-foreground">
                            1:{avgRR.toFixed(1)}
                        </span>
                    </div>
                    <div className="p-3 rounded-full bg-rose-500/10 text-rose-500">
                        <Activity className="w-5 h-5" />
                    </div>
                </GlassCard>
            </div>

            {/* Main Charts - Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Equity Curve (2/3 width) */}
                <div className="lg:col-span-2 relative">
                    <GlassCard className={`h-[350px] flex flex-col ${!isPro ? "opacity-60 blur-sm pointer-events-none" : ""}`}>
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-primary" />
                            Equity Growth
                        </h3>
                        {equityData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={equityData}>
                                    <defs>
                                        <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} minTickGap={30} />
                                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "hsl(var(--card))",
                                            borderColor: "hsl(var(--border))",
                                            color: "hsl(var(--foreground))",
                                            borderRadius: "8px",
                                            fontSize: "12px"
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="equity"
                                        stroke="hsl(var(--primary))"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorEquity)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-muted-foreground">
                                No trade data available
                            </div>
                        )}
                    </GlassCard>
                    {!isPro && (
                        <div className="absolute inset-0 flex items-center justify-center z-10">
                            <div className="bg-background/80 backdrop-blur-md px-6 py-4 rounded-xl border border-white/10 flex flex-col items-center">
                                <Lock className="w-8 h-8 text-primary mb-2" />
                                <span className="font-bold text-sm">Pro Feature</span>
                                <p className="text-xs text-muted-foreground">Upgrade to view Equity Curve</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Outcome Distribution (1/3 width) */}
                <GlassCard className="h-[350px] flex flex-col">
                    <h3 className="font-semibold mb-2">Outcome Distribution</h3>
                    <div className="flex-1 relative">
                        {distributionData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={distributionData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {distributionData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "hsl(var(--card))",
                                            borderColor: "hsl(var(--border))",
                                            borderRadius: "8px"
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                                No outcomes yet
                            </div>
                        )}
                        {/* Center Text */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-3xl font-bold font-mono">{trades.length}</span>
                            <span className="text-xs text-muted-foreground uppercase">Trades</span>
                        </div>
                    </div>
                    <div className="flex justify-center gap-4 mt-2">
                        {distributionData.map(d => (
                            <div key={d.name} className="flex items-center gap-1.5 text-xs">
                                <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                                {d.name} ({d.value})
                            </div>
                        ))}
                    </div>
                </GlassCard>
            </div>

            {/* Row 2: Expectancy & Psychology */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Expectancy Engine */}
                <div className="relative">
                    <GlassCard className={`h-[400px] flex flex-col ${!isPro ? "opacity-60 blur-sm pointer-events-none" : ""}`}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-semibold">Expectancy Analysis</h3>
                            <div className="flex bg-secondary/30 p-1 rounded-lg">
                                {(["session", "pair", "strategy"] as const).map(g => (
                                    <button
                                        key={g}
                                        onClick={() => setExpectancyGroup(g)}
                                        className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${expectancyGroup === g
                                            ? "bg-primary text-primary-foreground shadow-sm"
                                            : "text-muted-foreground hover:text-foreground"
                                            }`}
                                    >
                                        {g.charAt(0).toUpperCase() + g.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1">
                            {expectancyData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={expectancyData}
                                        layout="vertical"
                                        margin={{ left: 40, right: 20, top: 0, bottom: 0 }}
                                    >
                                        <XAxis type="number" hide />
                                        <YAxis
                                            dataKey="group"
                                            type="category"
                                            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                                            axisLine={false}
                                            tickLine={false}
                                            width={80}
                                        />
                                        <Tooltip
                                            cursor={{ fill: "hsl(var(--primary)/0.1)" }}
                                            contentStyle={{
                                                backgroundColor: "hsl(var(--card))",
                                                borderColor: "hsl(var(--border))",
                                                borderRadius: "8px"
                                            }}
                                        />
                                        <Bar dataKey="expectancy" radius={[0, 4, 4, 0]}>
                                            {expectancyData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.expectancy >= 0 ? "hsl(var(--profit))" : "hsl(var(--loss))"} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                                    Not enough data for expectancy analysis
                                </div>
                            )}
                        </div>
                    </GlassCard>
                    {!isPro && (
                        <div className="absolute inset-0 flex items-center justify-center z-10">
                            <div className="bg-background/80 backdrop-blur-md px-6 py-4 rounded-xl border border-white/10 flex flex-col items-center">
                                <Lock className="w-8 h-8 text-primary mb-2" />
                                <span className="font-bold text-sm">Pro Feature</span>
                                <p className="text-xs text-muted-foreground">Unlock Advanced Analytics</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Psychology & Best Window */}
                <div className="space-y-6">
                    <GlassCard className="p-6 relative overflow-hidden h-[190px]">
                        <div className="flex items-start justify-between z-10 relative">
                            <div>
                                <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                                    Golden Hour
                                </h3>
                                <div className="text-3xl font-bold text-foreground mb-1">
                                    {bestWindow.bestHour !== "N/A" ? bestWindow.bestHour : "--:--"}
                                </div>
                                <p className="text-sm text-foreground/80">
                                    Best trading results on <span className="text-primary font-bold">{bestWindow.bestDay}</span>
                                </p>
                            </div>
                            <div className="p-3 bg-primary/10 rounded-full text-primary">
                                <Clock className="w-6 h-6" />
                            </div>
                        </div>
                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
                    </GlassCard>

                    <GlassCard className="p-6 relative overflow-hidden h-[190px]">
                        <div className="flex items-start justify-between z-10 relative">
                            <div>
                                <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                                    Psychology Check
                                </h3>
                                {losingPatterns.length > 0 ? (
                                    <>
                                        <div className="text-xl font-bold text-loss mb-1 flex items-center gap-2">
                                            {losingPatterns[0].name}
                                        </div>
                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                            {losingPatterns[0].description}
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <div className="text-xl font-bold text-profit mb-1">
                                            Stable Mindset
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            No negative patterns detected. Keep it up!
                                        </p>
                                    </>
                                )}
                            </div>
                            <div className={`p-3 rounded-full ${losingPatterns.length > 0 ? "bg-loss/10 text-loss" : "bg-profit/10 text-profit"}`}>
                                <Brain className="w-6 h-6" />
                            </div>
                        </div>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}
