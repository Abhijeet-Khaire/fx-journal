import { Trade, AnalyticsResult } from "./tradeTypes";
import {
  roundCurrency,
  roundPercent,
  roundPips,
  addCurrency,
  subtractCurrency,
} from "./precision";

export function detectSession(time: string): Trade["session"] {
  const hour = parseInt((time || "00:00").split(":")[0], 10);
  if (hour >= 0 && hour < 8) return "Asian";
  if (hour >= 8 && hour < 16) return "London";
  return "New York";
}

export function getSymbolProperties(pair: string) {
  if (pair.includes("JPY")) return { pipMultiplier: 100, contractSize: 100000, type: "forex" };
  if (pair === "XAU/USD") return { pipMultiplier: 100, contractSize: 100, type: "metal" };
  if (pair === "XAG/USD") return { pipMultiplier: 100, contractSize: 5000, type: "metal" };
  if (["US30", "NAS100", "SPX500"].includes(pair)) return { pipMultiplier: 1, contractSize: 1, type: "index" };
  if (pair.includes("BTC") || pair.includes("ETH")) return { pipMultiplier: 1, contractSize: 1, type: "crypto" };

  return { pipMultiplier: 10000, contractSize: 100000, type: "forex" };
}

export function calculatePips(
  pair: string,
  entry: number,
  exit: number,
  direction: "BUY" | "SELL" | "Long" | "Short" | "LONG" | "SHORT"
): number {
  const { pipMultiplier } = getSymbolProperties(pair);
  const isLong = direction.toUpperCase() === "BUY" || direction.toUpperCase() === "LONG";
  const diff = isLong ? exit - entry : entry - exit;
  return roundPips(diff * pipMultiplier, 1);
}

export function calculatePL(
  pips: number,
  lotSize: number,
  pair: string,
  entryPrice: number,
  exitPrice: number
): number {
  const { pipMultiplier, contractSize } = getSymbolProperties(pair);
  const rawProfit = (pips / pipMultiplier) * contractSize * lotSize;

  const [base, quote] = pair.split("/");

  // 1. If Quote is USD (Account Currency), no conversion needed
  if (quote === "USD" || !quote) {
    return roundCurrency(rawProfit);
  }

  // 2. If Base is USD (e.g., USD/JPY), divide by exit price
  if (base === "USD" && exitPrice > 0) {
    return roundCurrency(rawProfit / exitPrice);
  }

  // 3. Common Cross Pairs
  if (quote === "JPY") {
    const usdJpyRate = 150;
    return roundCurrency(rawProfit / usdJpyRate);
  }
  if (quote === "GBP") {
    const gbpUsdRate = 1.25;
    return roundCurrency(rawProfit * gbpUsdRate);
  }
  if (quote === "EUR") {
    const eurUsdRate = 1.08;
    return roundCurrency(rawProfit * eurUsdRate);
  }

  return roundCurrency(rawProfit);
}

export function getWinRate(trades: Trade[]): number {
  if (!trades.length) return 0;
  const wins = trades.filter((t) => t.profitLoss > 0).length;
  return roundPercent((wins / trades.length) * 100);
}

export function getNetProfit(trades: Trade[]): number {
  if (!trades.length) return 0;
  return addCurrency(...trades.map((t) => t.profitLoss));
}

export function getProfitFactor(trades: Trade[]): number {
  if (!trades.length) return 0;
  const grossProfit = addCurrency(...trades.filter((t) => t.profitLoss > 0).map((t) => t.profitLoss));
  const grossLoss = Math.abs(addCurrency(...trades.filter((t) => t.profitLoss < 0).map((t) => t.profitLoss)));
  if (grossLoss === 0) return grossProfit > 0 ? 100 : 0;
  return roundCurrency(grossProfit / grossLoss);
}

export function getAverageRR(trades: Trade[]): number {
  const wins = trades.filter((t) => t.profitLoss > 0);
  const losses = trades.filter((t) => t.profitLoss < 0);
  if (!wins.length || !losses.length) return 0;

  const avgWin = addCurrency(...wins.map((t) => t.profitLoss)) / wins.length;
  const avgLoss = Math.abs(addCurrency(...losses.map((t) => t.profitLoss))) / losses.length;

  if (avgLoss === 0) return 0;
  return roundCurrency(avgWin / avgLoss);
}

export function getEdgeScore(trades: Trade[]): number {
  if (trades.length < 3) return 0;
  const wins = trades.filter((t) => t.profitLoss > 0);
  const losses = trades.filter((t) => t.profitLoss <= 0);
  const winRate = wins.length / trades.length;
  const lossRate = 1 - winRate;
  const avgWin = wins.length ? addCurrency(...wins.map((t) => t.profitLoss)) / wins.length : 0;
  const avgLoss = losses.length ? Math.abs(addCurrency(...losses.map((t) => t.profitLoss))) / losses.length : 0;
  const expectancy = winRate * avgWin - lossRate * avgLoss;
  const raw = Math.min(Math.max(expectancy / 50 + 50, 0), 100);
  return roundPercent(raw, 0);
}

export function getDisciplineScore(trades: Trade[]): number {
  if (!trades.length) return 0;
  let score = 100;
  const ruleViolations = trades.filter((t) => !t.rulesFollowed).length;
  score -= (ruleViolations / trades.length) * 50;

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
    pairPL[t.pair] = addCurrency(pairPL[t.pair] || 0, t.profitLoss);
  });
  return Object.entries(pairPL).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";
}

export function getWorstSession(trades: Trade[]): string {
  if (!trades.length) return "N/A";
  const sessionPL: Record<string, number> = {};
  trades.forEach((t) => {
    sessionPL[t.session] = addCurrency(sessionPL[t.session] || 0, t.profitLoss);
  });
  return Object.entries(sessionPL).sort((a, b) => a[1] - b[1])[0]?.[0] || "N/A";
}

export function getBestStrategy(trades: Trade[]): string {
  if (!trades.length) return "N/A";
  const stratPL: Record<string, number> = {};
  trades.forEach((t) => {
    stratPL[t.strategy] = addCurrency(stratPL[t.strategy] || 0, t.profitLoss);
  });
  return Object.entries(stratPL).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";
}

export function getEquityCurve(trades: Trade[]): { date: string; equity: number }[] {
  const sorted = [...trades].sort((a, b) => a.date.localeCompare(b.date));
  let equity = 0;
  return sorted.map((t) => {
    equity = addCurrency(equity, t.profitLoss);
    return { date: t.date, equity: roundCurrency(equity) };
  });
}

export function getExpectancyBy(trades: Trade[], groupBy: keyof Trade | "hour" | "day"): AnalyticsResult[] {
  const groups: Record<string, Trade[]> = {};

  trades.forEach((t) => {
    let key = "";
    if (groupBy === "hour") {
      key = (t.time || "00:00").split(":")[0] + ":00";
    } else if (groupBy === "day") {
      key = new Date(t.date).toLocaleDateString("en-US", { weekday: "long" });
    } else {
      key = String(t[groupBy] || "Unknown");
    }

    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  });

  return Object.entries(groups)
    .map(([group, groupTrades]) => {
      const wins = groupTrades.filter((t) => t.profitLoss > 0);
      const losses = groupTrades.filter((t) => t.profitLoss <= 0);
      const winRate = (wins.length / groupTrades.length) * 100;
      const avgWin = wins.length ? addCurrency(...wins.map((t) => t.profitLoss)) / wins.length : 0;
      const avgLoss = losses.length ? Math.abs(addCurrency(...losses.map((t) => t.profitLoss))) / losses.length : 0;
      const expectancy = (winRate / 100) * avgWin - (1 - winRate / 100) * avgLoss;

      return {
        group,
        winRate: roundPercent(winRate, 0),
        profit: addCurrency(...groupTrades.map((t) => t.profitLoss)),
        count: groupTrades.length,
        expectancy: roundCurrency(expectancy),
      };
    })
    .sort((a, b) => b.expectancy - a.expectancy);
}

export function getBestTradingWindow(trades: Trade[]): { bestHour: string; bestDay: string } {
  const byHour = getExpectancyBy(trades, "hour");
  const byDay = getExpectancyBy(trades, "day");

  return {
    bestHour: byHour[0]?.group || "N/A",
    bestDay: byDay[0]?.group || "N/A",
  };
}

export function getDrawdownStats(trades: Trade[]) {
  const sorted = [...trades].sort(
    (a, b) =>
      new Date(`${a.date}T${a.time || "00:00"}`).getTime() -
      new Date(`${b.date}T${b.time || "00:00"}`).getTime()
  );

  let currentEquity = 0;
  let maxEquity = 0;
  let maxDrawdown = 0;
  let currentDrawdown = 0;

  const equityCurve = sorted.map((t) => {
    currentEquity = addCurrency(currentEquity, t.profitLoss);
    if (currentEquity > maxEquity) maxEquity = currentEquity;

    const drawdown = subtractCurrency(maxEquity, currentEquity);
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    currentDrawdown = drawdown;

    return {
      date: t.date,
      equity: currentEquity,
      drawdown: -drawdown,
    };
  });

  return {
    maxDrawdown: roundCurrency(maxDrawdown),
    currentDrawdown: roundCurrency(currentDrawdown),
    equityCurve,
  };
}

export function getRiskStats(trades: Trade[]) {
  const losses = trades.filter((t) => t.profitLoss < 0);
  const avgLoss = losses.length ? Math.abs(addCurrency(...losses.map((t) => t.profitLoss))) / losses.length : 0;
  const maxLoss = losses.length ? Math.abs(Math.min(...losses.map((t) => t.profitLoss))) : 0;
  const dd = getDrawdownStats(trades);

  return {
    avgRisk: roundCurrency(avgLoss),
    maxRisk: roundCurrency(maxLoss),
    currentDrawdown: dd.currentDrawdown,
    maxDrawdown: dd.maxDrawdown,
    riskConsistency: 85,
  };
}

export function getTradeQuality(trade: Trade): { score: number; grade: string; issues: string[] } {
  let score = 100;
  const issues: string[] = [];

  if (!trade.rulesFollowed) {
    score -= 30;
    issues.push("Rules not followed");
  }

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
    score -= 10;
    issues.push("Missing SL or TP targets");
  }

  if (["Fear", "Greed", "Anxiety"].includes(trade.emotionBefore || "")) {
    score -= 20;
    issues.push(`Negative emotion: ${trade.emotionBefore}`);
  }

  if ((trade.confidence || 3) < 3) {
    score -= 10;
    issues.push("Low confidence entry");
  }

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

  let currentStreak = 0;
  let maxStreak = 0;
  [...trades]
    .sort(
      (a, b) =>
        new Date(`${a.date}T${a.time || "00:00"}`).getTime() -
        new Date(`${b.date}T${b.time || "00:00"}`).getTime()
    )
    .forEach((t) => {
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
      impact: 0,
    });
  }

  const lowConfLosses = trades.filter((t) => t.profitLoss < 0 && (t.confidence || 0) < 3);
  if (lowConfLosses.length > 2) {
    patterns.push({
      name: "Hesitation Tax",
      description: "You tend to lose when your confidence is low.",
      count: lowConfLosses.length,
      impact: addCurrency(...lowConfLosses.map((t) => t.profitLoss)),
    });
  }

  return patterns;
}

export function getStrategyPerformance(trades: Trade[]) {
  const strategies: Record<string, { profit: number; wins: number; total: number }> = {};

  trades.forEach((t) => {
    const strat = t.strategy || "Unknown";
    if (!strategies[strat]) {
      strategies[strat] = { profit: 0, wins: 0, total: 0 };
    }
    strategies[strat].profit = addCurrency(strategies[strat].profit, t.profitLoss);
    strategies[strat].total += 1;
    if (t.profitLoss > 0) strategies[strat].wins += 1;
  });

  return Object.entries(strategies)
    .map(([strategy, stats]) => ({
      strategy,
      profit: roundCurrency(stats.profit),
      trades: stats.total,
      winRate: roundPercent((stats.wins / stats.total) * 100, 0),
    }))
    .sort((a, b) => b.profit - a.profit);
}
