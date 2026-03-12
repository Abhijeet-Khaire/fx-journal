import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { TrendingUp, BarChart3, DollarSign, Target, Shield, Calendar as CalendarIcon, X, Zap, Fingerprint, Activity, ArrowUpRight, ArrowDownRight, Brain, Book, Lock } from "lucide-react";
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
import { DRPAlert } from "@/components/DRPAlert";
import { BrokerSync } from "@/components/BrokerSync";

export default function Dashboard() {
  const navigate = useNavigate();
  const { trades: allTrades, loading } = useTrades();
  const [date, setDate] = useState<DateRange | undefined>(undefined);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const { plan } = usePlan();

  const isPro = plan === "pro" || plan === "ultimate";
  const isUltimate = plan === "ultimate";

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
        <div className="h-40 w-full rounded-2xl bg-white/5 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonChart /><SkeletonChart />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20 relative">
      {/* Page Header - Executive Command */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border border-white/10 bg-black/40 backdrop-blur-3xl group shadow-2xl"
      >
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity text-primary">
          <Fingerprint className="w-32 h-32 md:w-48 md:h-48" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 md:gap-10">
          <div className="space-y-4 md:space-y-6">
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary animate-pulse" />
                <span className="text-[10px] font-black tracking-[0.3em] uppercase text-primary">Data Connectivity: Active</span>
              </div>
                <span className="text-[10px] font-black tracking-[0.3em] uppercase text-muted-foreground">
                  • {plan === 'ultimate' ? 'Institutional' : plan === 'pro' ? 'Professional' : 'Standard'} ACCESS
                </span>
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white uppercase italic">Executive <span className="text-primary not-italic">Dashboard</span></h1>
              <p className="text-muted-foreground text-sm md:text-lg font-medium mt-2">
                Statistical analysis of <span className="text-white font-bold">{trades.length}</span> closed trades.
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/10">
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "flex-1 md:w-[260px] h-12 justify-start text-left font-bold border-none bg-transparent hover:bg-white/5 rounded-xl",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-3 h-4 w-4 text-primary" />
                    {date?.from ? (
                      date.to ? (
                        <>
                          {format(date.from, "LLL dd")} — {format(date.to, "LLL dd, yyyy")}
                        </>
                      ) : (
                        format(date.from, "LLL dd, yyyy")
                      )
                    ) : (
                      <span className="uppercase tracking-widest text-[10px]">Filter Time Window</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-3xl overflow-hidden glass border-white/10" align="end">
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
                    className="p-4"
                  />
                </PopoverContent>
              </Popover>
              {date?.from && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-muted-foreground hover:text-white rounded-xl"
                  onClick={() => setDate(undefined)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* DRP Alert */}
      <DRPAlert trades={allTrades} />

      {/* Core Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <GlassCard className="p-8 border-t-2 border-t-primary/50 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <BarChart3 className="w-32 h-32 text-primary" />
          </div>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-primary/10">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Activity</span>
          </div>
          <div className="flex items-baseline gap-2">
            <AnimatedCounter value={trades.length} className="text-5xl font-black text-white italic" />
            <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">Total</span>
          </div>
        </GlassCard>

        <GlassCard className="p-8 border-t-2 border-t-profit/50 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Target className="w-32 h-32 text-profit" />
          </div>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-profit/10">
              <Target className="w-5 h-5 text-profit" />
            </div>
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Performance</span>
          </div>
          <div className="flex items-baseline gap-2">
            <AnimatedCounter value={winRate} suffix="%" className="text-5xl font-black text-white italic" />
            <span className="text-xs font-black text-profit uppercase tracking-widest">Win Rate</span>
          </div>
        </GlassCard>

        <GlassCard className="p-8 border-t-2 border-t-white/10 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <DollarSign className="w-32 h-32 text-white" />
          </div>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-white/5">
              <DollarSign className={`w-5 h-5 ${netProfit >= 0 ? "text-profit" : "text-loss"}`} />
            </div>
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Net Profit</span>
          </div>
          <div className="flex items-baseline gap-2">
            <AnimatedCounter
              value={netProfit}
              prefix="$"
              decimals={2}
              className={`text-5xl font-black italic ${netProfit >= 0 ? "text-profit" : "text-loss"}`}
            />
          </div>
        </GlassCard>
      </div>


      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Equity Curve - Pro Gated */}
        <div className="lg:col-span-8 relative">
          <GlassCard hover={false} className={`p-8 rounded-[2rem] ${!isPro ? "blur-xl pointer-events-none opacity-50" : ""}`}>
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-primary" />
                Equity Curve
              </h3>
              <div className="flex gap-2">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest">Live Updates</span>
              </div>
            </div>

            {equityData.length > 0 ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={equityData}>
                    <XAxis dataKey="date" hide />
                    <YAxis hide domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(0,0,0,0.8)",
                        backdropFilter: "blur(12px)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "16px",
                        padding: "12px",
                        fontSize: "12px",
                        fontWeight: "bold",
                        color: "#fff"
                      }}
                      itemStyle={{ color: "#fff" }}
                      labelStyle={{ color: "#fff" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="equity"
                      stroke="hsl(var(--primary))"
                      strokeWidth={4}
                      dot={false}
                      animationDuration={2000}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground space-y-4">
                <div className="p-4 rounded-full bg-white/5 border border-white/10">
                  <Activity className="w-8 h-8 opacity-20" />
                </div>
                <p className="text-xs font-black uppercase tracking-widest opacity-50">Insufficient Trade History</p>
              </div>
            )}
          </GlassCard>
          {!isPro && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
              <div className="bg-black/40 backdrop-blur-2xl p-10 rounded-[2.5rem] border border-white/10 text-center shadow-2xl max-w-sm">
                <Lock className="w-10 h-10 text-primary mx-auto mb-4" />
                <h3 className="text-2xl font-black uppercase tracking-tighter italic italic">Professional Restricted</h3>
                <p className="text-xs text-muted-foreground mb-8 font-medium leading-relaxed">Advanced equity curve and performance forecasting are reserved for Professional traders.</p>
                <Button 
                  onClick={() => navigate("/plans")}
                  className="w-full bg-primary py-6 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-[0_0_30px_rgba(var(--primary),0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Upgrade Access
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Win Rate Pie */}
        <div className="lg:col-span-4">
          <GlassCard hover={false} className="p-8 rounded-[2rem] h-full">
            <h3 className="text-sm font-black uppercase tracking-widest mb-8">P/L Distribution</h3>
            {trades.length > 0 ? (
              <div className="relative h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "rgba(0,0,0,0.8)",
                        backdropFilter: "blur(12px)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "16px",
                        color: "#fff"
                      }}
                      itemStyle={{ color: "#fff" }}
                      labelStyle={{ color: "#fff" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Win Rate</span>
                  <span className="text-3xl font-black text-white italic">{winRate.toFixed(0)}%</span>
                </div>
              </div>
            ) : (
              <div className="h-[240px] flex items-center justify-center text-muted-foreground">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-20 italic">No Data Available</p>
              </div>
            )}
            <div className="flex justify-center gap-10 mt-8">
              <div className="flex flex-col items-center">
                <span className="h-1.5 w-8 rounded-full bg-profit mb-2" />
                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter">Profit ({wins})</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="h-1.5 w-8 rounded-full bg-loss mb-2" />
                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter">Loss ({losses})</span>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Edge & Discipline Scores - Pro Gated */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="relative">
          <GlassCard hover={false} className={`p-10 rounded-[2.5rem] ${!isPro ? "blur-xl pointer-events-none opacity-50" : ""}`}>
            <div className="flex items-center justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-primary/10">
                    <Zap className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-widest italic">Edge <span className="text-primary not-italic">Score</span></h3>
                </div>
                <p className="text-sm text-muted-foreground font-medium max-w-[240px]">Expectancy and statistical advantage modeling.</p>
              </div>
              <CircularProgress value={edgeScore} label="Edge" />
            </div>
          </GlassCard>
          {!isPro && (
            <div className="absolute top-4 right-4 px-3 py-1 bg-primary/20 backdrop-blur-md rounded-full border border-primary/30 flex items-center gap-2">
              <Lock className="w-3 h-3 text-primary" />
              <span className="text-[8px] font-black uppercase tracking-widest text-primary">Professional Feature</span>
            </div>
          )}
        </div>

        <div className="relative">
          <GlassCard hover={false} className={`p-10 rounded-[2.5rem] ${!isPro ? "blur-xl pointer-events-none opacity-50" : ""}`}>
            <div className="flex items-center justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-cyan-400/10">
                    <Shield className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-widest italic">Rule <span className="text-cyan-400 not-italic">Adherence</span></h3>
                </div>
                <p className="text-sm text-muted-foreground font-medium max-w-[240px]">Behavioral discipline and rule adherence index.</p>
              </div>
              <CircularProgress value={disciplineScore} label="Rule" />
            </div>
          </GlassCard>
          {!isPro && (
            <div className="absolute top-4 right-4 px-3 py-1 bg-cyan-400/20 backdrop-blur-md rounded-full border border-cyan-400/30 flex items-center gap-2">
              <Lock className="w-3 h-3 text-cyan-400" />
              <span className="text-[8px] font-black uppercase tracking-widest text-cyan-400">Professional Feature</span>
            </div>
          )}
        </div>
      </div>

      {/* Ultimate Features: Psychology & Playbook */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[2.5rem]" />
          <GlassCard className={`p-10 rounded-[2.5rem] relative z-10 ${!isUltimate ? "blur-xl pointer-events-none opacity-50" : ""}`}>
            <div className="flex items-center gap-6 mb-8">
              <div className="p-4 rounded-3xl bg-pink-500/10 border border-pink-500/20">
                <Brain className="w-8 h-8 text-pink-500" />
              </div>
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter italic">Trading <span className="text-pink-500 not-italic">Psychology</span></h3>
                <p className="text-sm text-muted-foreground font-medium">Emotional performance analysis.</p>
              </div>
            </div>
            <div className="h-32 flex items-center justify-center p-6 bg-black/20 rounded-3xl border border-white/5 border-dashed">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground italic">Analyzing Mental State...</p>
            </div>
          </GlassCard>
          {!isUltimate && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
              <div className="bg-black/60 backdrop-blur-xl p-8 rounded-[2rem] border border-white/5 text-center shadow-2xl scale-90">
                <Brain className="w-8 h-8 text-pink-500 mx-auto mb-4" />
                <h4 className="text-lg font-black uppercase italic tracking-tighter">Institutional Access Only</h4>
                <p className="text-[10px] text-muted-foreground mt-2 mb-6 font-bold uppercase tracking-widest">Upgrade to initialize psychology module</p>
                <Button 
                  onClick={() => navigate("/plans")}
                  className="w-full bg-pink-500 py-4 h-10 rounded-xl font-black uppercase text-[8px] tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(236,72,153,0.3)]"
                >
                  Upgrade Plan
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[2.5rem]" />
          <GlassCard className={`p-10 rounded-[2.5rem] relative z-10 ${!isUltimate ? "blur-xl pointer-events-none opacity-50" : ""}`}>
            <div className="flex items-center gap-6 mb-8">
              <div className="p-4 rounded-3xl bg-indigo-500/10 border border-indigo-500/20">
                <Book className="w-8 h-8 text-indigo-500" />
              </div>
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter italic">Strategy <span className="text-indigo-500 not-italic">Hub</span></h3>
                <p className="text-sm text-muted-foreground font-medium">Strategic playbook management.</p>
              </div>
            </div>
            <div className="h-32 flex items-center justify-center p-6 bg-black/20 rounded-3xl border border-white/5 border-dashed">
              <Button variant="outline" className="h-12 px-8 rounded-xl bg-white/5 border-white/10 font-black uppercase text-[10px] tracking-[0.2em] hover:bg-indigo-500/20 transition-all">Initialize Playbook</Button>
            </div>
          </GlassCard>
          {!isUltimate && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
              <div className="bg-black/60 backdrop-blur-xl p-8 rounded-[2rem] border border-white/5 text-center shadow-2xl scale-90">
                <Book className="w-8 h-8 text-indigo-500 mx-auto mb-4" />
                <h4 className="text-lg font-black uppercase italic tracking-tighter">Institutional Access Only</h4>
                <p className="text-[10px] text-muted-foreground mt-2 mb-6 font-bold uppercase tracking-widest">Unlock Advanced Strategy Playbook</p>
                <Button 
                  onClick={() => navigate("/plans")}
                  className="w-full bg-indigo-500 py-4 h-10 rounded-xl font-black uppercase text-[8px] tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)]"
                >
                  Upgrade Plan
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Insights Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-xl font-black uppercase tracking-widest flex items-center gap-3 text-white">
            <Activity className="w-6 h-6 text-primary" />
            Performance <span className="text-primary not-italic">Insights</span>
          </h3>
          <span className="h-px flex-1 bg-gradient-to-r from-primary/30 to-transparent ml-6" />
        </div>
        <InsightsPanel insights={insights} locked={!isPro} />
      </div>

      {/* Strategy Performance */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-xl font-black uppercase tracking-widest flex items-center gap-3 italic text-white">
            <Zap className="w-6 h-6 text-primary" />
            Strategy <span className="text-primary not-italic">Breakdown</span>
          </h3>
          <span className="h-px flex-1 bg-gradient-to-r from-primary/30 to-transparent ml-6" />
        </div>

        <div className="relative">
          <GlassCard hover={false} className={`p-10 rounded-[2.5rem] ${!isPro ? "blur-xl pointer-events-none opacity-50" : ""}`}>
            {stratPerf.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stratPerf.map((s) => (
                  <div key={s.strategy} className="p-6 rounded-3xl bg-white/5 border border-white/10 hover:border-primary/50 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{s.strategy}</span>
                      <div className={s.profit >= 0 ? "text-profit" : "text-loss"}>
                        {s.profit >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                      </div>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className={`text-2xl font-black italic ${s.profit >= 0 ? "text-profit" : "text-loss"}`}>
                        ${s.profit > 0 ? "+" : ""}{s.profit.toLocaleString()}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{s.winRate}% WR</span>
                    </div>
                    <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full ${s.profit >= 0 ? "bg-profit" : "bg-loss"}`} style={{ width: `${s.winRate}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : <div className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground py-10 text-center opacity-20 italic">No Strategy Data Available</div>}
          </GlassCard>
          {!isPro && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
              <Lock className="w-8 h-8 text-primary mb-4" />
              <p className="text-xs font-black uppercase tracking-widest text-primary">Professional Account Verification Required</p>
            </div>
          )}
        </div>
      </div>

      {/* Broker Sync - Pro/Ultimate */}
      {isPro && (
        <div className="grid grid-cols-1 gap-8 mt-10">
          <BrokerSync />
        </div>
      )}
    </div>
  );
}
