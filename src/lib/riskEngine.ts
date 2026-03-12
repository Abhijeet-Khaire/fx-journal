/**
 * Advanced Risk Management Engine
 * Calculates critical survival metrics for traders
 */

export interface RiskStats {
    riskOfRuin: number;
    kellyCriterion: number;
    streakProbabilities: {
        streak: number;
        probability: number;
    }[];
    survivalScore: number;
}

/**
 * Calculates Risk of Ruin (Probability of account failure)
 * Formula: ((1 - Edge) / (1 + Edge))^CapitalUnits
 * Edge = (WinRate * AvgWin) - (LossRate * AvgLoss)
 * For simplicity in a trade journal, we use the standard ruin formula: 
 * RoR = ((1 - (W-L)) / (1 + (W-L))) ^ units
 */
export function calculateRiskOfRuin(winRate: number, avgRR: number, riskPerTrade: number): number {
    if (winRate === 0) return 100;
    if (winRate >= 1 && avgRR > 0) return 0;

    // Convert winRate to decimal if it's 0-100
    const w = winRate > 1 ? winRate / 100 : winRate;
    const q = 1 - w;
    
    // Simplistic but effective RoR formula for trading
    // P = ((1 - a) / (1 + a)) ^ n
    // where a is the advantage (edge)
    // For trading: a = (w * avgRR) - q
    const edge = (w * (avgRR || 1)) - q;
    
    if (edge <= 0) return 100;

    // units of risk before "ruin" (e.g. 50% drawdown)
    // If risk per trade is 1%, and we define ruin as 50% loss, units = 50
    const unitsToRuin = 50 / (riskPerTrade || 1); 
    
    const ror = Math.pow((q / w), unitsToRuin) * 100;
    return Math.min(Math.max(ror, 0), 100);
}

/**
 * Calculates Kelly Criterion (Optimal % to risk)
 * Formula: K% = W - [(1 - W) / R]
 */
export function calculateKellyCriterion(winRate: number, avgRR: number): number {
    const w = winRate > 1 ? winRate / 100 : winRate;
    const r = avgRR || 1;
    
    if (r === 0) return 0;
    
    const kelly = w - ((1 - w) / r);
    return Math.max(kelly * 100, 0); // Return as percentage, cap at 0
}

/**
 * Calculates the probability of experiencing a losing streak
 * Probability = (1 - WinRate) ^ Length
 */
export function calculateStreakProbabilities(winRate: number) {
    const w = winRate > 1 ? winRate / 100 : winRate;
    const q = 1 - w;
    
    return [3, 5, 10, 15].map(streak => ({
        streak,
        probability: Math.pow(q, streak) * 100
    }));
}

export function getSurvivalScore(ror: number, winRate: number, riskPerTrade: number): number {
    let score = 100;
    
    // Penalize high RoR
    score -= ror;
    
    // Penalize extremely high risk per trade (> 3%)
    if (riskPerTrade > 3) score -= (riskPerTrade - 3) * 10;
    
    // Penalize low win rate
    if (winRate < 30) score -= (30 - winRate);
    
    return Math.max(Math.min(score, 100), 0);
}
