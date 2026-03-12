import React from 'react';
import { GlassCard } from '../GlassCard';
import { motion } from 'framer-motion';
import { AlertTriangle, ShieldCheck, Zap, TrendingDown } from 'lucide-react';
import { 
    calculateRiskOfRuin, 
    calculateKellyCriterion, 
    calculateStreakProbabilities,
    getSurvivalScore 
} from '@/lib/riskEngine';

interface RiskMetricsProps {
    winRate: number;
    avgRR: number;
    avgRiskPerTrade: number;
}

export const RiskMetrics: React.FC<RiskMetricsProps> = ({ winRate, avgRR, avgRiskPerTrade }) => {
    const ror = calculateRiskOfRuin(winRate, avgRR, avgRiskPerTrade || 1);
    const kelly = calculateKellyCriterion(winRate, avgRR);
    const streaks = calculateStreakProbabilities(winRate);
    const survivalScore = getSurvivalScore(ror, winRate, avgRiskPerTrade);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Survival Score & RoR */}
            <GlassCard className="p-8 border-l-4 border-l-primary relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                    <ShieldCheck className="w-24 h-24 text-primary" />
                </div>
                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-6 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    Survival Blueprint
                </h3>
                
                <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-5xl font-black text-white italic">{survivalScore.toFixed(0)}</span>
                    <span className="text-muted-foreground text-xs uppercase font-bold">/ 100 Score</span>
                </div>
                
                <div className="space-y-4 mt-6">
                    <div>
                        <div className="flex justify-between text-[10px] font-black uppercase mb-1">
                            <span>Risk of Ruin (50% DD)</span>
                            <span className={ror > 20 ? "text-loss" : "text-profit"}>{ror.toFixed(2)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${ror}%` }}
                                className={`h-full ${ror > 20 ? "bg-loss" : "bg-profit"}`}
                            />
                        </div>
                    </div>
                </div>
                
                <p className="text-[10px] text-muted-foreground mt-4 leading-relaxed font-medium">
                    {ror < 5 ? 
                        "Mathematically sound. Your edge protects you from total failure." : 
                        "Critical vulnerability detected. High probability of catastrophic drawdown."}
                </p>
            </GlassCard>

            {/* Sizing & Kelly */}
            <GlassCard className="p-8 border-l-4 border-l-cyan-400">
                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-6 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-cyan-400" />
                    Kelly Optimization
                </h3>
                
                <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-5xl font-black text-white">{kelly.toFixed(1)}%</span>
                    <span className="text-muted-foreground text-xs uppercase font-bold">Recommended</span>
                </div>
                
                <p className="text-xs text-muted-foreground mt-4 leading-relaxed mb-6 font-medium">
                    The Kelly Criterion suggests this is your optimal risk per trade to maximize long-term growth.
                </p>
                
                <div className="p-4 rounded-xl bg-cyan-400/5 border border-cyan-400/20">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase text-cyan-400">Current Avg Risk</span>
                        <span className="text-sm font-black text-white">{avgRiskPerTrade.toFixed(2)}%</span>
                    </div>
                </div>
            </GlassCard>

            {/* Streak Probabilities */}
            <GlassCard className="p-8 border-l-4 border-l-yellow-500">
                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-6 flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-yellow-500" />
                    Variance forecast
                </h3>
                
                <div className="space-y-4">
                    {streaks.map((s, i) => (
                        <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black text-muted-foreground uppercase">{s.streak} Losses In Row</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-black text-white italic">{s.probability.toFixed(2)}%</span>
                                <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-yellow-500" style={{ width: `${s.probability}%` }} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                
                <div className="mt-6 flex items-start gap-2 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/10">
                    <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0" />
                    <p className="text-[9px] text-yellow-500 uppercase font-black leading-tight">
                        Expect a {streaks[1].streak}-trade losing streak within your next {Math.round(100/streaks[1].probability)} series.
                    </p>
                </div>
            </GlassCard>
        </div>
    );
};
