import { useState } from "react";
import { useTrades } from "@/hooks/useTrades";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { CircularProgress } from "@/components/CircularProgress";
import { InsightsPanel } from "@/components/InsightsPanel";
import { SkeletonCard, SkeletonChart } from "@/components/SkeletonLoader";
import {
  getWinRate,
  getNetProfit,
  getEdgeScore,
  getDisciplineScore,
  getBestPair,
  getWorstSession,
  getBestStrategy,
  getEquityCurve,
  getStrategyPerformance,
} from "@/lib/tradeStore";
import { Trade } from "@/lib/tradeTypes";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { TrendingUp, BarChart3, DollarSign, Target, Shield, Calendar as CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DateRange } from "react-day-picker";

import { usePlan } from "@/hooks/usePlan";
import { Lock, Brain, MessageSquare, Book } from "lucide-react"; // Additional icons

export default function Dashboard() {
  const { trades: allTrades, loading } = useTrades();
  const [date, setDate] = useState<DateRange | undefined>(undefined);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const { plan } = usePlan(); // Use hook

  // derived checks
  const isPro = plan === "pro" || plan === "ultimate";
  const isUltimate = plan === "ultimate";

  // Filter trades based on date range
  const trades = date?.from ? allTrades.filter(t => {
    const tradeDate = new Date(t.date);
    const from = date.from!;
    const to = date.to || from;
    return tradeDate >= from && tradeDate <= to;
  }) : allTrades;

  const winRate = getWinRate(trades);
  const netProfit = getNetProfit(trades);
  const edgeScore = getEdgeScore(trades);
  const disciplineScore = getDisciplineScore(trades);
  const equityData = getEquityCurve(trades);
  const wins = trades.filter((t) => t.profitLoss > 0).length;
  const losses = trades.length - wins;

  const pieData = [
    { name: "Wins", value: wins },
    { name: "Losses", value: losses },
  ];
  const PIE_COLORS = ["hsl(160, 70%, 45%)", "hsl(0, 72%, 55%)"];

  const insights = [
    { label: "Best Pair", value: getBestPair(trades) },
    { label: "Worst Session", value: getWorstSession(trades) },
    { label: "Top Strategy", value: getBestStrategy(trades) },
  ];

  const stratPerf = getStrategyPerformance(trades);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SkeletonChart /><SkeletonChart />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {trades.length} trade{trades.length !== 1 ? "s" : ""} logged
            <span className="text-primary ml-2 uppercase font-bold text-xs bg-primary/10 px-2 py-0.5 rounded-full">• {plan} Plan</span>
          </p>
        </div>

        <div className="flex items-center gap-2 bg-secondary/50 p-1 rounded-lg border border-border/50">
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[240px] justify-start text-left font-normal border-none bg-transparent hover:bg-transparent",
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
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={(range) => {
                  setDate(range);
                  if (range?.from && range?.to) {
                    setIsCalendarOpen(false);
                  }
                }}
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
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </motion.div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <BarChart3 className="w-4 h-4 text-primary" />
            </div>
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Total Trades</span>
          </div>
          <AnimatedCounter value={trades.length} className="text-3xl font-bold text-foreground" />
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-profit/10">
              <Target className="w-4 h-4 text-profit" />
            </div>
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Win Rate</span>
          </div>
          <AnimatedCounter value={winRate} suffix="%" className="text-3xl font-bold text-foreground" />
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg" style={{ background: netProfit >= 0 ? "hsl(var(--profit) / 0.1)" : "hsl(var(--loss) / 0.1)" }}>
              <DollarSign className={`w-4 h-4 ${netProfit >= 0 ? "text-profit" : "text-loss"}`} />
            </div>
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Net Profit</span>
          </div>
          <AnimatedCounter
            value={netProfit}
            prefix="$"
            decimals={2}
            className={`text-3xl font-bold ${netProfit >= 0 ? "profit-text" : "loss-text"}`}
          />
        </GlassCard>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Equity Curve - Gated for Free */}
        <div className="relative">
          <GlassCard hover={false} className={!isPro ? "blur-sm pointer-events-none" : ""}>
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Equity Curve
            </h3>
            {equityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={equityData}>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(215, 15%, 55%)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(215, 15%, 55%)" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(220, 18%, 12%)",
                      border: "1px solid hsl(220, 15%, 22%)",
                      borderRadius: "8px",
                      color: "hsl(210, 20%, 92%)",
                      fontSize: "12px",
                    }}
                  />
                  <Line type="monotone" dataKey="equity" stroke="hsl(187, 85%, 53%)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                Add trades to see your equity curve
              </div>
            )}
          </GlassCard>
          {!isPro && (
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-background/50 backdrop-blur-[2px] border border-white/5">
              <Lock className="w-8 h-8 text-primary mb-2" />
              <span className="text-foreground font-bold text-sm">Pro Feature</span>
              <p className="text-xs text-muted-foreground mt-1">Upgrade to view Equity Curve</p>
            </div>
          )}
        </div>

        {/* Win/Loss Pie - Available for all */}
        <GlassCard hover={false}>
          <h3 className="text-sm font-semibold text-foreground mb-4">Win / Loss Ratio</h3>
          {trades.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                  animationBegin={200}
                  animationDuration={800}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "hsl(220, 18%, 12%)",
                    border: "1px solid hsl(220, 15%, 22%)",
                    borderRadius: "8px",
                    color: "hsl(210, 20%, 92%)",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
              No data yet
            </div>
          )}
          <div className="flex justify-center gap-6 mt-2">
            <span className="flex items-center gap-1.5 text-xs"><span className="w-2.5 h-2.5 rounded-full bg-profit" /> Wins ({wins})</span>
            <span className="flex items-center gap-1.5 text-xs"><span className="w-2.5 h-2.5 rounded-full bg-loss" /> Losses ({losses})</span>
          </div>
        </GlassCard>
      </div>

      {/* Edge & Discipline Scores - Gated for Free */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Edge Score */}
        <div className="relative">
          <GlassCard hover={false} className={!isPro ? "blur-sm pointer-events-none opacity-50" : ""}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Edge Score
                </h3>
                <p className="text-xs text-muted-foreground mt-1">Based on win rate, avg win/loss & expectancy</p>
              </div>
              <CircularProgress value={edgeScore} label="Score" />
            </div>
          </GlassCard>
          {!isPro && (
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-background/50 backdrop-blur-[2px]">
              <Lock className="w-6 h-6 text-primary mb-1" />
              <span className="text-primary font-semibold text-sm">Pro Feature</span>
            </div>
          )}
        </div>

        {/* Discipline Score */}
        <div className="relative">
          <GlassCard hover={false} className={!isPro ? "blur-sm pointer-events-none opacity-50" : ""}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  Discipline Score
                </h3>
                <p className="text-xs text-muted-foreground mt-1">Rules adherence & overtrading detection</p>
              </div>
              <CircularProgress value={disciplineScore} label="Score" />
            </div>
          </GlassCard>
          {!isPro && (
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-background/50 backdrop-blur-[2px]">
              <Lock className="w-6 h-6 text-primary mb-1" />
              <span className="text-primary font-semibold text-sm">Pro Feature</span>
            </div>
          )}
        </div>
      </div>

      {/* Ultimate Features: AI & Psychology - Gated for non-Ultimate */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <GlassCard className={!isUltimate ? "blur-sm pointer-events-none opacity-60" : ""}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-pink-500/10">
                <Brain className="w-5 h-5 text-pink-500" />
              </div>
              <div>
                <h3 className="font-semibold">Psychology Insights</h3>
                <p className="text-xs text-muted-foreground">AI analysis of your emotional patterns</p>
              </div>
            </div>
            <div className="h-24 flex items-center justify-center text-sm text-muted-foreground bg-secondary/20 rounded-lg border border-white/5">
              No sufficient data for psychology profile yet.
            </div>
          </GlassCard>
          {!isUltimate && (
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-background/50 backdrop-blur-[2px] border border-white/5">
              <Brain className="w-8 h-8 text-pink-500 mb-2" />
              <span className="text-foreground font-bold text-sm">Ultimate Feature</span>
              <p className="text-xs text-muted-foreground mt-1">Upgrade to unlock AI Psychology</p>
            </div>
          )}
        </div>

        <div className="relative">
          <GlassCard className={!isUltimate ? "blur-sm pointer-events-none opacity-60" : ""}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-indigo-500/10">
                <Book className="w-5 h-5 text-indigo-500" />
              </div>
              <div>
                <h3 className="font-semibold">Playbook Builder</h3>
                <p className="text-xs text-muted-foreground">Document your best strategies</p>
              </div>
            </div>
            <div className="h-24 flex items-center justify-center text-sm text-foreground/80 bg-secondary/20 rounded-lg border border-white/5">
              <Button size="sm" variant="outline">Create Strategy</Button>
            </div>
          </GlassCard>
          {!isUltimate && (
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-background/50 backdrop-blur-[2px] border border-white/5">
              <Book className="w-8 h-8 text-indigo-500 mb-2" />
              <span className="text-foreground font-bold text-sm">Ultimate Feature</span>
              <p className="text-xs text-muted-foreground mt-1">Unlock Playbook Builder</p>
            </div>
          )}
        </div>
      </div>

      {/* Insights */}
      <InsightsPanel insights={insights} locked={!isPro} />

      {/* Strategy Performance */}
      <div className="relative">
        <GlassCard hover={false} className={!isPro ? "blur-sm pointer-events-none opacity-50" : ""}>
          <h3 className="text-sm font-semibold text-foreground mb-4">Strategy Performance</h3>
          {stratPerf.length > 0 ? (
            <div className="space-y-3">
              {stratPerf.map((s) => (
                <div key={s.strategy} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                  <div>
                    <span className="text-sm font-medium text-foreground">{s.strategy}</span>
                    <span className="text-xs text-muted-foreground ml-2">({s.trades} trades • {s.winRate}% WR)</span>
                  </div>
                  <span className={`font-mono font-semibold text-sm ${s.profit >= 0 ? "profit-text" : "loss-text"}`}>
                    ${s.profit > 0 ? "+" : ""}{s.profit}
                  </span>
                </div>
              ))}
            </div>
          ) : <div className="text-sm text-muted-foreground py-4">No strategy data</div>}
        </GlassCard>
        {!isPro && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-background/50 backdrop-blur-[2px]">
            <Lock className="w-6 h-6 text-primary mb-1" />
            <span className="text-primary font-semibold text-sm">Pro Feature</span>
          </div>
        )}
      </div>
    </div>
  );
}
