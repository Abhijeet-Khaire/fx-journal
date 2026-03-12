import React, { useState, useMemo } from "react";
import { GlassCard } from "./GlassCard";
import { Trade } from "@/lib/tradeTypes";
import { Target, AlertCircle, ShieldCheck, TrendingUp, Calendar, Trophy, Zap } from "lucide-react";
import { motion } from "framer-motion";

interface PropFirmChallengeProps {
  trades: Trade[];
}

export function PropFirmChallenge({ trades }: PropFirmChallengeProps) {
  const [targetProfit, setTargetProfit] = useState<string>("10000");
  const [dailyDDLimit, setDailyDDLimit] = useState<string>("5000");
  const [maxDDLimit, setMaxDDLimit] = useState<string>("10000");
  const [startingBalance, setStartingBalance] = useState<string>("100000");

  const today = new Date().toISOString().split("T")[0];
  const todayTrades = trades.filter(t => t.date === today);
  const todayPnL = todayTrades.reduce((s, t) => s + t.profitLoss, 0);
  const totalPnL = trades.reduce((s, t) => s + t.profitLoss, 0);

  const profitProgress = Math.min(100, Math.max(0, (totalPnL / parseFloat(targetProfit)) * 100));
  const dailyDDProgress = Math.min(100, Math.max(0, (Math.abs(Math.min(0, todayPnL)) / parseFloat(dailyDDLimit)) * 100));
  
  // Simple check for days traded
  const daysTraded = new Set(trades.map(t => t.date)).size;

  return (
    <GlassCard className="p-6 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 transition-opacity group-hover:bg-primary/10" />
      
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/20 text-primary">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Prop-Firm Challenge Tracker</h3>
            <p className="text-xs text-muted-foreground">Monitoring FTMO, MFF, or custom targets</p>
          </div>
        </div>
        <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black text-primary uppercase tracking-widest">
            Challenge Mode
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 relative z-10">
        <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-muted-foreground">Account Balance</label>
            <input 
                type="number" 
                value={startingBalance} 
                onChange={(e) => setStartingBalance(e.target.value)} 
                className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm focus:ring-1 focus:ring-primary/50 outline-none"
            />
        </div>
        <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-muted-foreground">Profit Target ($)</label>
            <input 
                type="number" 
                value={targetProfit} 
                onChange={(e) => setTargetProfit(e.target.value)} 
                className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm focus:ring-1 focus:ring-primary/50 outline-none"
            />
        </div>
        <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-muted-foreground">Daily Drawdown Limit ($)</label>
            <input 
                type="number" 
                value={dailyDDLimit} 
                onChange={(e) => setDailyDDLimit(e.target.value)} 
                className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm focus:ring-1 focus:ring-primary/50 outline-none"
            />
        </div>
        <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-muted-foreground">Max Drawdown Limit ($)</label>
            <input 
                type="number" 
                value={maxDDLimit} 
                onChange={(e) => setMaxDDLimit(e.target.value)} 
                className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm focus:ring-1 focus:ring-primary/50 outline-none"
            />
        </div>
      </div>

      <div className="space-y-6 relative z-10">
        {/* Profit Progress */}
        <div className="space-y-2">
            <div className="flex justify-between items-end">
                <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-profit" />
                    <span className="text-sm font-semibold">Profit Progress</span>
                </div>
                <span className="text-xs font-mono font-bold">${totalPnL.toFixed(2)} / ${targetProfit} ({profitProgress.toFixed(1)}%)</span>
            </div>
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${profitProgress}%` }}
                    className="h-full bg-gradient-to-r from-profit/40 to-profit"
                />
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Daily Drawdown */}
            <div className={`p-4 rounded-2xl border transition-colors ${todayPnL <= -parseFloat(dailyDDLimit) * 0.8 ? 'bg-loss/10 border-loss/30' : 'bg-white/5 border-white/5'}`}>
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-loss" />
                        <span className="text-xs font-bold uppercase tracking-wider">Today's Risk</span>
                    </div>
                    <span className="text-xs font-mono font-bold">${Math.abs(Math.min(0, todayPnL)).toFixed(2)} / ${dailyDDLimit}</span>
                </div>
                <div className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${dailyDDProgress}%` }}
                        className={`h-full ${dailyDDProgress >= 80 ? 'bg-loss' : 'bg-primary'}`}
                    />
                </div>
                {todayPnL <= -parseFloat(dailyDDLimit) * 0.8 && (
                    <div className="mt-3 flex items-center gap-2 text-[10px] text-loss font-bold uppercase animate-pulse">
                        <AlertCircle className="w-3 h-3" /> Close to Daily Limit!
                    </div>
                )}
            </div>

            {/* Trading Days */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold uppercase tracking-wider">Evaluation Period</span>
                </div>
                <div className="flex items-end gap-2">
                    <span className="text-2xl font-black text-foreground">{daysTraded}</span>
                    <span className="text-xs text-muted-foreground mb-1 uppercase tracking-widest font-bold">Days Traded</span>
                </div>
            </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="w-4 h-4 text-profit" />
            Rules followed: <span className="text-foreground font-bold">{trades.filter(t => t.rulesFollowed).length} / {trades.length}</span>
        </div>
        <div className="flex gap-4">
            <div className="text-right">
                <p className="text-[10px] text-muted-foreground uppercase">Equity</p>
                <p className="text-sm font-bold font-mono">${(parseFloat(startingBalance) + totalPnL).toFixed(2)}</p>
            </div>
            <div className="text-right">
                <p className="text-[10px] text-muted-foreground uppercase">Consistency</p>
                <p className="text-sm font-bold font-mono text-primary">88%</p>
            </div>
        </div>
      </div>
    </GlassCard>
  );
}
