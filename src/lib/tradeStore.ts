import { Trade, Plan, AnalyticsResult } from "./tradeTypes";

// Local storage functions removed in favor of Firestore
// See useTrades hook

export function detectSession(time: string): Trade["session"] {
  const hour = parseInt(time.split(":")[0], 10);
  if (hour >= 0 && hour < 8) return "Asian";
  if (hour >= 8 && hour < 16) return "London";
  return "New York";
}

export function getSymbolProperties(pair: string) {
  // Common Forex pairs (Quote is USD)
  const usdQuotePairs = ["EUR/USD", "GBP/USD", "AUD/USD", "NZD/USD", "XAU/USD", "XAG/USD"];
  // Common Forex pairs (Base is USD)
  const usdBasePairs = ["USD/JPY", "USD/CHF", "USD/CAD"];
  
  if (pair.includes("JPY")) return { pipMultiplier: 100, contractSize: 100000, type: "forex" };
  if (pair === "XAU/USD") return { pipMultiplier: 100, contractSize: 100, type: "metal" };
  if (pair === "XAG/USD") return { pipMultiplier: 100, contractSize: 5000, type: "metal" };
  if (["US30", "NAS100", "SPX500"].includes(pair)) return { pipMultiplier: 1, contractSize: 1, type: "index" };
  if (pair.includes("BTC") || pair.includes("ETH")) return { pipMultiplier: 1, contractSize: 1, type: "crypto" };
  
  return { pipMultiplier: 10000, contractSize: 100000, type: "forex" };
}

export function calculatePips(pair: string, entry: number, exit: number, direction: "BUY" | "SELL"): number {
  const { pipMultiplier } = getSymbolProperties(pair);
  const diff = direction === "BUY" ? exit - entry : entry - exit;
  return Math.round(diff * pipMultiplier * 10) / 10;
}

export function calculatePL(pips: number, lotSize: number, pair: string, entryPrice: number, exitPrice: number): number {
  // If we have entry/exit, calculate exactly based on contract size
  // Formula: (Exit - Entry) * Direction * ContractSize * Lots
  // Then convert Quote Currency to Account Currency (USD)

  // const { contractSize } = getSymbolProperties(pair);
  // Re-derive raw price diff from pips to avoid rounding errors or use entry/exit directly?
  // Using pips is safer if the user manually adjusted pips, but entry/exit is authoritative.
  // Let's use logic derived from pips to honor the "pips" input if it were editable, but here we calculated pips from prices.
  // Actually, better to use prices for PL.

  // Need direction. Since we don't have direction passed here, we can infer sign from pips?
  // Or better, assume pips already carries the sign? No, pips is usually absolute or relative to trade.
  // wait, calculatePips returns signed float.

  // Let's use the pip value approach which is simpler if we trust pips.
  // PL = Pips / PipMultiplier * ContractSize * LotSize
  // Example EURUSD: 10 pips / 10000 * 100000 * 1 = 0.0010 * 100000 = 100. Correct.
  // Example USDJPY: 10 pips / 100 * 100000 * 1 = 0.10 * 100000 = 10000 JPY.

  const { pipMultiplier, contractSize } = getSymbolProperties(pair);
  let rawProfit = (pips / pipMultiplier) * contractSize * lotSize;

  const [base, quote] = pair.split("/");

  // 1. If Quote is USD (Account Currency), no conversion needed
  if (quote === "USD" || !quote) {
    return Math.round(rawProfit * 100) / 100;
  }

  // 2. If Base is USD (e.g., USD/JPY), we need to divide by the exit price
  if (base === "USD" && exitPrice > 0) {
    return Math.round((rawProfit / exitPrice) * 100) / 100;
  }

  // 3. For Cross Pairs (e.g., EUR/JPY, GBP/JPY)
  // We ideally need USD/JPY rate. For now, we use a slightly more intelligent approximation 
  // or the exitPrice if it's the relevant rate (it usually isn't for cross pairs directly to USD).
  if (quote === "JPY") {
    // Fallback rate for JPY cross pairs if we don't have the specific USD/JPY rate
    const usdJpyRate = 150; 
    return Math.round((rawProfit / usdJpyRate) * 100) / 100;
  }

  if (quote === "GBP") {
    const gbpUsdRate = 1.25;
    return Math.round((rawProfit * gbpUsdRate) * 100) / 100;
  }

  if (quote === "EUR") {
    const eurUsdRate = 1.08;
    return Math.round((rawProfit * eurUsdRate) * 100) / 100;
  }

  // Default catch-all
  return Math.round(rawProfit * 100) / 100;
}

// Analytics
export function getWinRate(trades: Trade[]): number {
  if (!trades.length) return 0;
  const wins = trades.filter((t) => t.profitLoss > 0).length;
  return Math.round((wins / trades.length) * 100);
}

export function getNetProfit(trades: Trade[]): number {
  return Math.round(trades.reduce((sum, t) => sum + t.profitLoss, 0) * 100) / 100;
}

export function getEdgeScore(trades: Trade[]): number {
  if (trades.length < 3) return 0;
  const wins = trades.filter((t) => t.profitLoss > 0);
  const losses = trades.filter((t) => t.profitLoss <= 0);
  const winRate = wins.length / trades.length;
  const lossRate = 1 - winRate;
  const avgWin = wins.length ? wins.reduce((s, t) => s + t.profitLoss, 0) / wins.length : 0;
  const avgLoss = losses.length ? Math.abs(losses.reduce((s, t) => s + t.profitLoss, 0) / losses.length) : 0;
  const expectancy = winRate * avgWin - lossRate * avgLoss;
  // Normalize to 0-100
  const raw = Math.min(Math.max(expectancy / 50 + 50, 0), 100);
  return Math.round(raw);
}

export function getProfitFactor(trades: Trade[]): number {
  if (!trades.length) return 0;
  const grossProfit = trades.reduce((sum, t) => sum + (t.profitLoss > 0 ? t.profitLoss : 0), 0);
  const grossLoss = Math.abs(trades.reduce((sum, t) => sum + (t.profitLoss < 0 ? t.profitLoss : 0), 0));
  if (grossLoss === 0) return grossProfit > 0 ? 100 : 0; // Infinite or zero
  return Math.round((grossProfit / grossLoss) * 100) / 100;
}

export function getAverageRR(trades: Trade[]): number {
  const wins = trades.filter((t) => t.profitLoss > 0);
  const losses = trades.filter((t) => t.profitLoss < 0);
  if (!wins.length || !losses.length) return 0;

  const avgWin = wins.reduce((s, t) => s + t.profitLoss, 0) / wins.length;
  const avgLoss = Math.abs(losses.reduce((s, t) => s + t.profitLoss, 0) / losses.length);

  if (avgLoss === 0) return 0;
  return Math.round((avgWin / avgLoss) * 100) / 100;
}

export function getDisciplineScore(trades: Trade[]): number {
  if (!trades.length) return 0;
  let score = 100;
  // Penalty for not following rules
  const ruleViolations = trades.filter((t) => !t.rulesFollowed).length;
  score -= (ruleViolations / trades.length) * 50;
  // Penalty for overtrading (>5 trades per day)
  const dateGroups: Record<string, number> = {};
  trades.forEach((t) => {
    dateGroups[t.date] = (dateGroups[t.date] || 0) + 1;
  });
  const overtradeDays = Object.values(dateGroups).filter((c) => c > 5).length;
  const totalDays = Object.keys(dateGroups).length;
  if (totalDays) score -= (overtradeDays / totalDays) * 50;
  return Math.round(Math.max(0, Math.min(100, score)));
}

export function getBestPair(trades: Trade[]): string {
  if (!trades.length) return "N/A";
  const pairPL: Record<string, number> = {};
  trades.forEach((t) => {
    pairPL[t.pair] = (pairPL[t.pair] || 0) + t.profitLoss;
  });
  return Object.entries(pairPL).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";
}

export function getWorstSession(trades: Trade[]): string {
  if (!trades.length) return "N/A";
  const sessionPL: Record<string, number> = {};
  trades.forEach((t) => {
    sessionPL[t.session] = (sessionPL[t.session] || 0) + t.profitLoss;
  });
  return Object.entries(sessionPL).sort((a, b) => a[1] - b[1])[0]?.[0] || "N/A";
}

export function getBestStrategy(trades: Trade[]): string {
  if (!trades.length) return "N/A";
  const stratPL: Record<string, number> = {};
  trades.forEach((t) => {
    stratPL[t.strategy] = (stratPL[t.strategy] || 0) + t.profitLoss;
  });
  return Object.entries(stratPL).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";
}

export function getEquityCurve(trades: Trade[]): { date: string; equity: number }[] {
  const sorted = [...trades].sort((a, b) => a.date.localeCompare(b.date));
  let equity = 0;
  return sorted.map((t) => {
    equity += t.profitLoss;
    return { date: t.date, equity: Math.round(equity * 100) / 100 };
  });
}

export function getExpectancyBy(trades: Trade[], groupBy: keyof Trade | "hour" | "day"): AnalyticsResult[] {
  const groups: Record<string, Trade[]> = {};

  trades.forEach(t => {
    let key = "";
    if (groupBy === "hour") {
      key = t.time.split(":")[0] + ":00";
    } else if (groupBy === "day") {
      key = new Date(t.date).toLocaleDateString("en-US", { weekday: "long" });
    } else {
      key = String(t[groupBy] || "Unknown");
    }

    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  });

  return Object.entries(groups).map(([group, groupTrades]) => {
    const wins = groupTrades.filter(t => t.profitLoss > 0);
    const losses = groupTrades.filter(t => t.profitLoss <= 0);
    const winRate = (wins.length / groupTrades.length) * 100;
    const avgWin = wins.length ? wins.reduce((s, t) => s + t.profitLoss, 0) / wins.length : 0;
    const avgLoss = losses.length ? Math.abs(losses.reduce((s, t) => s + t.profitLoss, 0) / losses.length) : 0;
    // Expectancy = (Win % * Avg Win) - (Loss % * Avg Loss)
    const expectancy = (winRate / 100 * avgWin) - ((1 - winRate / 100) * avgLoss);

    return {
      group,
      winRate: Math.round(winRate),
      profit: Math.round(groupTrades.reduce((s, t) => s + t.profitLoss, 0) * 100) / 100,
      count: groupTrades.length,
      expectancy: Math.round(expectancy * 100) / 100
    };
  }).sort((a, b) => b.expectancy - a.expectancy);
}

export function getBestTradingWindow(trades: Trade[]): { bestHour: string; bestDay: string } {
  const byHour = getExpectancyBy(trades, "hour");
  const byDay = getExpectancyBy(trades, "day");

  return {
    bestHour: byHour[0]?.group || "N/A",
    bestDay: byDay[0]?.group || "N/A"
  };
}

export function getDrawdownStats(trades: Trade[]) {
  const sorted = [...trades].sort((a, b) => new Date(a.date + "T" + a.time).getTime() - new Date(b.date + "T" + b.time).getTime());

  let currentEquity = 0;
  let maxEquity = 0;
  let maxDrawdown = 0;
  let currentDrawdown = 0;

  const equityCurve = sorted.map(t => {
    currentEquity += t.profitLoss;
    if (currentEquity > maxEquity) maxEquity = currentEquity;

    const drawdown = maxEquity - currentEquity;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    currentDrawdown = drawdown;

    return {
      date: t.date,
      equity: currentEquity,
      drawdown: -drawdown
    };
  });

  // Calculate drawdown percentage if possible (needs starting balance which we don't have, so using absolute $)
  // Assuming a virtual starting balance of 10k for % calculation context if needed, or just return absolute.

  return {
    maxDrawdown: Math.round(maxDrawdown * 100) / 100,
    currentDrawdown: Math.round(currentDrawdown * 100) / 100,
    equityCurve
  };
}

export function getRiskStats(trades: Trade[]) {
  // Risk is effectively Loss amount when SL is hit.
  // We can approximate risk by looking at Average Loss.
  const losses = trades.filter(t => t.profitLoss < 0);
  const avgLoss = losses.length ? Math.abs(losses.reduce((s, t) => s + t.profitLoss, 0) / losses.length) : 0;
  const maxLoss = losses.length ? Math.abs(Math.min(...losses.map(t => t.profitLoss))) : 0;

  // Risk Consistency: Standard Deviation of losses could differ.
  // Simple consistency: 100 - (StdDev / Avg * 100)

  // Recovery Time: Max consecutive losses?
  const dd = getDrawdownStats(trades);

  return {
    avgRisk: Math.round(avgLoss * 100) / 100,
    maxRisk: Math.round(maxLoss * 100) / 100,
    currentDrawdown: dd.currentDrawdown,
    maxDrawdown: dd.maxDrawdown,
    riskConsistency: 85 // Placeholder logic for now
  };
}

export function getTradeQuality(trade: Trade): { score: number; grade: string; issues: string[] } {
  let score = 100;
  const issues: string[] = [];

  // 1. Rules Followed
  if (!trade.rulesFollowed) {
    score -= 30;
    issues.push("Rules not followed");
  }

  // 2. Risk/Reward (Approximate by TP distance vs SL distance)
  // We need entry, sl, tp.
  if (trade.stopLoss > 0 && trade.takeProfit > 0) {
    const risk = Math.abs(trade.entryPrice - trade.stopLoss);
    const reward = Math.abs(trade.takeProfit - trade.entryPrice);
    if (risk > 0) {
      const rr = reward / risk;
      if (rr < 1.0) {
        score -= 20;
        issues.push(`Poor Risk:Reward (< 1:1)`);
      } else if (rr < 2.0) {
        score -= 10;
        issues.push(`Mediocre Risk:Reward (< 1:2)`);
      }
    }
  } else {
    // No SL or TP defined
    score -= 10;
    issues.push("Missing SL or TP targets");
  }

  // 3. Emotion
  if (["Fear", "Greed", "Anxiety"].includes(trade.emotionBefore || "")) {
    score -= 20;
    issues.push(`Negative emotion: ${trade.emotionBefore}`);
  }

  // 4. Confidence
  if ((trade.confidence || 3) < 3) {
    score -= 10;
    issues.push("Low confidence entry");
  }

  // Mistake
  if (trade.mistakes && trade.mistakes.length > 0) {
    score -= 15;
    issues.push("Mistakes recorded");
  }

  let grade = "A";
  if (score < 60) grade = "F";
  else if (score < 70) grade = "D";
  else if (score < 80) grade = "C";
  else if (score < 90) grade = "B";

  return { score: Math.max(0, score), grade, issues };
}

export function detectLosingPatterns(trades: Trade[]) {
  const patterns = [];

  // 1. Consecutive Losses
  let currentStreak = 0;
  let maxStreak = 0;
  [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).forEach(t => {
    if (t.profitLoss < 0) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  });

  if (maxStreak >= 3) {
    patterns.push({
      name: "Tilt Warning",
      description: `You have had a streak of ${maxStreak} consecutive losses.`,
      count: maxStreak,
      impact: 0 // Calc impact later
    });
  }

  // 2. Low Confidence Losses
  const lowConfLosses = trades.filter(t => t.profitLoss < 0 && (t.confidence || 0) < 3);
  if (lowConfLosses.length > 2) {
    patterns.push({
      name: "Hesitation Tax",
      description: "You tend to lose when your confidence is low.",
      count: lowConfLosses.length,
      impact: lowConfLosses.reduce((s, t) => s + t.profitLoss, 0)
    });
  }

  return patterns;
}

export function getStrategyPerformance(trades: Trade[]) {
  const strategies: Record<string, { profit: number; wins: number; total: number }> = {};

  trades.forEach(t => {
    const strat = t.strategy || "Unknown";
    if (!strategies[strat]) {
      strategies[strat] = { profit: 0, wins: 0, total: 0 };
    }
    strategies[strat].profit += t.profitLoss;
    strategies[strat].total += 1;
    if (t.profitLoss > 0) strategies[strat].wins += 1;
  });

  return Object.entries(strategies).map(([strategy, stats]) => ({
    strategy,
    profit: Math.round(stats.profit * 100) / 100,
    trades: stats.total,
    winRate: Math.round((stats.wins / stats.total) * 100)
  })).sort((a, b) => b.profit - a.profit);
}
