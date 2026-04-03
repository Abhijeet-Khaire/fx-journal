/**
 * Professional Prop Firm Challenge Engine
 * ────────────────────────────────────────
 * Pure business logic for all challenge calculations.
 * No UI, no Firebase — just math.
 */

import { Trade } from "./tradeTypes";
import { getSymbolProperties } from "./tradeStore";

// ─── Types ──────────────────────────────────────────────────────────

export interface ChallengeConfig {
  id: string;
  name: string;
  firmName: string;
  accountSize: number;
  profitTarget: number;
  profitTargetPercent: number;
  dailyDrawdownLimit: number;
  maxDrawdownLimit: number;
  maxRiskPerTrade: number;        // default 3%
  startDate: string;
  endDate: string;
  minTradingDays: number;
  maxTradingDays: number;         // max calendar days, 0 = unlimited
  phase: string;
  isActive: boolean;
  status: "active" | "passed" | "failed" | "expired";
  failReason?: string;
  passedDate?: string;
  failedDate?: string;

  // Prop Firm Rules
  maxDailyLossPercent: number;
  maxTotalLossPercent: number;
  consistencyRule: boolean;
  consistencyPercent: number;     // e.g. 30 means no single trade > 30% of total profit
  trailingDrawdownType: "none" | "trailing-to-breakeven" | "full-trailing";
  noNewsTrading: boolean;
  noWeekendHolding: boolean;
  noHedging: boolean;
  maxLotSize: number;             // 0 = unlimited

  // Metadata
  createdAt: string;
  archivedAt?: string;
  notes?: string;
}

export interface DailyPnL {
  date: string;
  pnl: number;
  tradeCount: number;
  breachedDailyDD: boolean;
}

export interface RuleCheck {
  rule: string;
  passed: boolean;
  detail: string;
  severity: "ok" | "warning" | "critical";
}

export interface TradeRiskInfo {
  tradeId: string;
  pair: string;
  date: string;
  riskDollars: number;
  riskPercent: number;
  isValid: boolean;
  lotSize: number;
}

export interface ChallengeEvaluation {
  status: "active" | "passed" | "failed" | "expired";
  failReason?: string;
  ruleChecks: RuleCheck[];
  tradeRiskWarnings: TradeRiskInfo[];
  dailyPnL: DailyPnL[];
  equityCurve: { date: string; equity: number; drawdown: number }[];
  totalPnL: number;
  currentEquity: number;
  maxDD: number;
  currentDD: number;
  trailingDDLevel: number;
  profitProgress: number;
  daysTraded: number;
  calendarDays: number;
  winRate: number;
  wins: number;
  losses: number;
}

export interface ChallengeStats {
  bestDay: { date: string; pnl: number };
  worstDay: { date: string; pnl: number };
  avgDailyPnL: number;
  avgTradeResult: number;
  avgWin: number;
  avgLoss: number;
  largestWin: number;
  largestLoss: number;
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
  profitFactor: number;
  avgRiskPerTrade: number;
  avgRMultiple: number;
  sharpeRatio: number;
  winRate: number;
  totalTrades: number;
  avgTradesPerDay: number;
  riskDistribution: { bucket: string; count: number }[];
}

// ─── Per-Trade Risk ─────────────────────────────────────────────────

/**
 * Calculates the dollar risk of a single trade.
 * Risk = |entryPrice - stopLoss| × lotSize × contractSize
 */
export function calculatePerTradeRiskDollars(trade: Trade): number {
  if (!trade.stopLoss || trade.stopLoss <= 0) return 0;
  const { contractSize } = getSymbolProperties(trade.pair);
  const priceDiff = Math.abs(trade.entryPrice - trade.stopLoss);
  return Math.round(priceDiff * trade.lotSize * contractSize * 100) / 100;
}

/**
 * Calculates the risk % of a single trade relative to account size.
 */
export function calculatePerTradeRiskPercent(trade: Trade, accountSize: number): number {
  if (accountSize <= 0) return 0;
  const riskDollars = calculatePerTradeRiskDollars(trade);
  return Math.round((riskDollars / accountSize) * 10000) / 100; // 2 decimal places
}

/**
 * Checks if a trade's risk is within the allowed max % per trade.
 */
export function isTradeRiskValid(trade: Trade, maxRiskPercent: number, accountSize: number): boolean {
  const riskPct = calculatePerTradeRiskPercent(trade, accountSize);
  return riskPct <= maxRiskPercent;
}

/**
 * Gets risk info for all trades in a challenge.
 */
export function getTradeRiskBreakdown(trades: Trade[], config: ChallengeConfig): TradeRiskInfo[] {
  return trades.map(t => {
    const riskDollars = calculatePerTradeRiskDollars(t);
    const riskPercent = calculatePerTradeRiskPercent(t, config.accountSize);
    return {
      tradeId: t.id,
      pair: t.pair,
      date: t.date,
      riskDollars,
      riskPercent,
      isValid: riskPercent <= config.maxRiskPerTrade,
      lotSize: t.lotSize,
    };
  });
}

// ─── Daily P/L ──────────────────────────────────────────────────────

export function calculateDailyPnL(trades: Trade[], dailyDDLimit: number): DailyPnL[] {
  const byDate: Record<string, Trade[]> = {};
  trades.forEach(t => {
    if (!byDate[t.date]) byDate[t.date] = [];
    byDate[t.date].push(t);
  });

  return Object.entries(byDate)
    .map(([date, dayTrades]) => {
      const pnl = dayTrades.reduce((sum, t) => sum + t.profitLoss, 0);
      return {
        date,
        pnl: Math.round(pnl * 100) / 100,
        tradeCount: dayTrades.length,
        breachedDailyDD: pnl <= -dailyDDLimit,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

// ─── Equity Curve & Drawdown ────────────────────────────────────────

export function calculateEquityCurve(
  trades: Trade[],
  accountSize: number
): { date: string; equity: number; drawdown: number }[] {
  const sorted = [...trades].sort(
    (a, b) => new Date(`${a.date}T${a.time || "00:00"}`).getTime() - new Date(`${b.date}T${b.time || "00:00"}`).getTime()
  );

  let cumPnL = 0;
  let peak = 0;

  return sorted.map(t => {
    cumPnL += t.profitLoss;
    if (cumPnL > peak) peak = cumPnL;
    const dd = peak - cumPnL;
    return {
      date: t.date,
      equity: Math.round((accountSize + cumPnL) * 100) / 100,
      drawdown: Math.round(dd * 100) / 100,
    };
  });
}

/**
 * Calculate trailing drawdown level.
 * trailing-to-breakeven: DD limit trails up with equity until equity reaches accountSize (break-even), then locks.
 * full-trailing: DD limit always trails with highest equity.
 */
export function calculateTrailingDrawdown(
  trades: Trade[],
  accountSize: number,
  maxDDLimit: number,
  type: ChallengeConfig["trailingDrawdownType"]
): number {
  if (type === "none") return accountSize - maxDDLimit;

  const sorted = [...trades].sort(
    (a, b) => new Date(`${a.date}T${a.time || "00:00"}`).getTime() - new Date(`${b.date}T${b.time || "00:00"}`).getTime()
  );

  let cumPnL = 0;
  let highestEquity = accountSize;

  for (const t of sorted) {
    cumPnL += t.profitLoss;
    const equity = accountSize + cumPnL;
    if (equity > highestEquity) highestEquity = equity;
  }

  if (type === "trailing-to-breakeven") {
    // Trail up but lock at accountSize (initial balance)
    const trailedPeak = Math.min(highestEquity, accountSize);
    // Actually: trail from initial. If equity goes up, the DD floor rises.
    // Once equity reaches accountSize, floor = accountSize - maxDDLimit stays.
    // Formula: floor = min(highestEquity, accountSize) - maxDDLimit
    // But that's not quite right either. Let me implement the FTMO-style:
    // The max DD floor starts at (accountSize - maxDDLimit).
    // As equity grows, the floor trails up: floor = highestEquity - maxDDLimit
    // But it caps at: accountSize (i.e., floor caps at accountSize - 0 = accountSize... no)
    // FTMO trailing: starts at accountSize - maxDD.
    // Trails up with highest equity. 
    // Locks once highest equity reaches accountSize + maxDD (floor = accountSize).
    const maxFloor = accountSize; // floor can never exceed initial balance
    const trailingFloor = highestEquity - maxDDLimit;
    return Math.min(trailingFloor, maxFloor);
  }

  if (type === "full-trailing") {
    // Floor always trails highest equity
    return highestEquity - maxDDLimit;
  }

  return accountSize - maxDDLimit;
}

// ─── Consistency Rule ───────────────────────────────────────────────

/**
 * Checks if any single winning trade exceeds `maxPercent`% of total profit.
 * Returns list of violating trade IDs.
 */
export function checkConsistencyRule(
  trades: Trade[],
  maxPercent: number
): { violated: boolean; violatingTrades: string[]; highestSinglePct: number } {
  const totalProfit = trades.reduce((sum, t) => sum + (t.profitLoss > 0 ? t.profitLoss : 0), 0);
  if (totalProfit <= 0) return { violated: false, violatingTrades: [], highestSinglePct: 0 };

  const threshold = totalProfit * (maxPercent / 100);
  const violating: string[] = [];
  let highestPct = 0;

  trades.forEach(t => {
    if (t.profitLoss > 0) {
      const pct = (t.profitLoss / totalProfit) * 100;
      if (pct > highestPct) highestPct = pct;
      if (t.profitLoss > threshold) {
        violating.push(t.id);
      }
    }
  });

  return {
    violated: violating.length > 0,
    violatingTrades: violating,
    highestSinglePct: Math.round(highestPct * 100) / 100,
  };
}

// ─── Calendar/Trading Days ──────────────────────────────────────────

export function getDaysTradedCount(trades: Trade[]): number {
  return new Set(trades.map(t => t.date)).size;
}

export function getCalendarDaysElapsed(startDate: string): number {
  const start = new Date(startDate);
  const now = new Date();
  const diff = now.getTime() - start.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// ─── Weekend Holding Check ──────────────────────────────────────────

export function checkWeekendHolding(trades: Trade[]): string[] {
  // Trades opened on Friday after 21:00 UTC or that have no close time on Friday
  // This is a simplified check: if a trade's date is Friday and direction suggests it's held
  const violating: string[] = [];
  trades.forEach(t => {
    const d = new Date(t.date);
    const day = d.getDay(); // 0=Sun, 5=Fri, 6=Sat
    if (day === 5 || day === 6 || day === 0) {
      // Trade logged on weekend or Friday
      if (day === 6 || day === 0) {
        violating.push(t.id);
      }
    }
  });
  return violating;
}

// ─── Max Lot Size Check ─────────────────────────────────────────────

export function checkMaxLotSize(trades: Trade[], maxLotSize: number): string[] {
  if (maxLotSize <= 0) return []; // 0 = unlimited
  return trades.filter(t => t.lotSize > maxLotSize).map(t => t.id);
}

// ─── Master Evaluation ─────────────────────────────────────────────

export function evaluateChallenge(config: ChallengeConfig, trades: Trade[]): ChallengeEvaluation {
  const totalPnL = trades.reduce((sum, t) => sum + t.profitLoss, 0);
  const currentEquity = config.accountSize + totalPnL;
  const daysTraded = getDaysTradedCount(trades);
  const calendarDays = getCalendarDaysElapsed(config.startDate);
  const wins = trades.filter(t => t.profitLoss > 0).length;
  const losses = trades.filter(t => t.profitLoss < 0).length;
  const winRate = trades.length > 0 ? Math.round((wins / trades.length) * 100) : 0;

  // Equity curve & drawdown
  const equityCurve = calculateEquityCurve(trades, config.accountSize);
  const maxDD = equityCurve.length > 0 ? Math.max(...equityCurve.map(e => e.drawdown)) : 0;
  const currentDD = equityCurve.length > 0 ? equityCurve[equityCurve.length - 1].drawdown : 0;

  // Trailing drawdown
  const trailingDDLevel = calculateTrailingDrawdown(
    trades, config.accountSize, config.maxDrawdownLimit, config.trailingDrawdownType
  );

  // Daily P/L
  const dailyPnL = calculateDailyPnL(trades, config.dailyDrawdownLimit);

  // Per-trade risk
  const riskBreakdown = getTradeRiskBreakdown(trades, config);
  const tradeRiskWarnings = riskBreakdown.filter(r => !r.isValid);

  // Profit progress
  const profitProgress = config.profitTarget > 0
    ? Math.min(100, Math.max(0, (totalPnL / config.profitTarget) * 100))
    : 0;

  // ── Rule Checks ──

  const ruleChecks: RuleCheck[] = [];

  // 1. Profit Target
  const profitTargetHit = totalPnL >= config.profitTarget;
  ruleChecks.push({
    rule: "Profit Target",
    passed: profitTargetHit,
    detail: `$${totalPnL.toFixed(2)} / $${config.profitTarget.toLocaleString()} (${profitProgress.toFixed(1)}%)`,
    severity: profitTargetHit ? "ok" : "warning",
  });

  // 2. Min Trading Days
  const minDaysHit = daysTraded >= config.minTradingDays;
  ruleChecks.push({
    rule: `Min ${config.minTradingDays} Trading Days`,
    passed: minDaysHit,
    detail: `${daysTraded} / ${config.minTradingDays} days`,
    severity: minDaysHit ? "ok" : "warning",
  });

  // 3. Daily Drawdown
  const dailyDDBreached = dailyPnL.some(d => d.breachedDailyDD);
  const todayStr = new Date().toISOString().split("T")[0];
  const todayPnL = dailyPnL.find(d => d.date === todayStr)?.pnl ?? 0;
  const dailyDDPercent = config.dailyDrawdownLimit > 0
    ? (Math.abs(Math.min(0, todayPnL)) / config.dailyDrawdownLimit) * 100
    : 0;
  ruleChecks.push({
    rule: "Daily Drawdown",
    passed: !dailyDDBreached,
    detail: dailyDDBreached
      ? `BREACHED on ${dailyPnL.filter(d => d.breachedDailyDD).map(d => d.date).join(", ")}`
      : `Today: $${Math.abs(Math.min(0, todayPnL)).toFixed(2)} / $${config.dailyDrawdownLimit.toLocaleString()} (${dailyDDPercent.toFixed(1)}%)`,
    severity: dailyDDBreached ? "critical" : dailyDDPercent >= 80 ? "warning" : "ok",
  });

  // 4. Max Drawdown
  const maxDDBreached = config.trailingDrawdownType !== "none"
    ? currentEquity <= trailingDDLevel
    : maxDD > config.maxDrawdownLimit;
  ruleChecks.push({
    rule: `Max Drawdown${config.trailingDrawdownType !== "none" ? " (Trailing)" : ""}`,
    passed: !maxDDBreached,
    detail: config.trailingDrawdownType !== "none"
      ? `Equity: $${currentEquity.toFixed(0)} | Floor: $${trailingDDLevel.toFixed(0)}`
      : `$${maxDD.toFixed(2)} / $${config.maxDrawdownLimit.toLocaleString()}`,
    severity: maxDDBreached ? "critical" : (maxDD / config.maxDrawdownLimit) * 100 >= 80 ? "warning" : "ok",
  });

  // 5. Max Risk Per Trade (3%)
  const riskViolations = tradeRiskWarnings.length;
  ruleChecks.push({
    rule: `Max ${config.maxRiskPerTrade}% Risk/Trade`,
    passed: riskViolations === 0,
    detail: riskViolations === 0
      ? `All ${trades.length} trades within limit`
      : `${riskViolations} trade(s) exceeded ${config.maxRiskPerTrade}%`,
    severity: riskViolations > 0 ? "warning" : "ok",
  });

  // 6. Consistency Rule
  if (config.consistencyRule && totalPnL > 0) {
    const consistency = checkConsistencyRule(trades, config.consistencyPercent);
    ruleChecks.push({
      rule: `Consistency (< ${config.consistencyPercent}%)`,
      passed: !consistency.violated,
      detail: consistency.violated
        ? `Highest single trade = ${consistency.highestSinglePct.toFixed(1)}% of total profit`
        : `Highest = ${consistency.highestSinglePct.toFixed(1)}% (within ${config.consistencyPercent}%)`,
      severity: consistency.violated ? "warning" : "ok",
    });
  }

  // 7. Max Calendar Days
  if (config.maxTradingDays > 0) {
    const expired = calendarDays > config.maxTradingDays;
    ruleChecks.push({
      rule: `Max ${config.maxTradingDays} Calendar Days`,
      passed: !expired,
      detail: `${calendarDays} / ${config.maxTradingDays} days elapsed`,
      severity: expired ? "critical" : calendarDays >= config.maxTradingDays * 0.9 ? "warning" : "ok",
    });
  }

  // 8. No Weekend Holding
  if (config.noWeekendHolding) {
    const weekendViolations = checkWeekendHolding(trades);
    ruleChecks.push({
      rule: "No Weekend Holding",
      passed: weekendViolations.length === 0,
      detail: weekendViolations.length === 0
        ? "No weekend trades detected"
        : `${weekendViolations.length} trade(s) on weekend`,
      severity: weekendViolations.length > 0 ? "warning" : "ok",
    });
  }

  // 9. Max Lot Size
  if (config.maxLotSize > 0) {
    const lotViolations = checkMaxLotSize(trades, config.maxLotSize);
    ruleChecks.push({
      rule: `Max Lot Size (${config.maxLotSize})`,
      passed: lotViolations.length === 0,
      detail: lotViolations.length === 0
        ? "All trades within lot limit"
        : `${lotViolations.length} trade(s) exceeded max lot`,
      severity: lotViolations.length > 0 ? "warning" : "ok",
    });
  }

  // ── Determine Status ──

  let status: ChallengeEvaluation["status"] = "active";
  let failReason: string | undefined;

  // Check failures first (these are hard fails)
  if (dailyDDBreached) {
    status = "failed";
    failReason = "Daily drawdown limit breached";
  } else if (maxDDBreached) {
    status = "failed";
    failReason = "Max drawdown limit breached";
  } else if (config.maxTradingDays > 0 && calendarDays > config.maxTradingDays && !profitTargetHit) {
    status = "expired";
    failReason = "Time limit exceeded without reaching profit target";
  }

  // Check pass conditions (only if not failed)
  if (status === "active") {
    const passConditions = profitTargetHit && minDaysHit;
    if (passConditions) {
      // Check consistency rule doesn't block passage
      if (config.consistencyRule) {
        const consistency = checkConsistencyRule(trades, config.consistencyPercent);
        if (!consistency.violated) {
          status = "passed";
        }
      } else {
        status = "passed";
      }
    }
  }

  return {
    status,
    failReason,
    ruleChecks,
    tradeRiskWarnings,
    dailyPnL,
    equityCurve,
    totalPnL: Math.round(totalPnL * 100) / 100,
    currentEquity: Math.round(currentEquity * 100) / 100,
    maxDD: Math.round(maxDD * 100) / 100,
    currentDD: Math.round(currentDD * 100) / 100,
    trailingDDLevel: Math.round(trailingDDLevel * 100) / 100,
    profitProgress: Math.round(profitProgress * 100) / 100,
    daysTraded,
    calendarDays,
    winRate,
    wins,
    losses,
  };
}

// ─── Advanced Statistics ────────────────────────────────────────────

export function calculateChallengeStatistics(
  config: ChallengeConfig,
  trades: Trade[]
): ChallengeStats {
  if (trades.length === 0) {
    return {
      bestDay: { date: "—", pnl: 0 },
      worstDay: { date: "—", pnl: 0 },
      avgDailyPnL: 0,
      avgTradeResult: 0,
      avgWin: 0,
      avgLoss: 0,
      largestWin: 0,
      largestLoss: 0,
      maxConsecutiveWins: 0,
      maxConsecutiveLosses: 0,
      profitFactor: 0,
      avgRiskPerTrade: 0,
      avgRMultiple: 0,
      sharpeRatio: 0,
      winRate: 0,
      totalTrades: 0,
      avgTradesPerDay: 0,
      riskDistribution: [],
    };
  }

  const dailyPnL = calculateDailyPnL(trades, config.dailyDrawdownLimit);
  const riskBreakdown = getTradeRiskBreakdown(trades, config);

  // Best/Worst Day
  const bestDay = dailyPnL.reduce((best, d) => (d.pnl > best.pnl ? d : best), dailyPnL[0]);
  const worstDay = dailyPnL.reduce((worst, d) => (d.pnl < worst.pnl ? d : worst), dailyPnL[0]);

  // Averages
  const avgDailyPnL = dailyPnL.length > 0
    ? dailyPnL.reduce((sum, d) => sum + d.pnl, 0) / dailyPnL.length
    : 0;

  const avgTradeResult = trades.reduce((sum, t) => sum + t.profitLoss, 0) / trades.length;

  const winningTrades = trades.filter(t => t.profitLoss > 0);
  const losingTrades = trades.filter(t => t.profitLoss < 0);

  const avgWin = winningTrades.length > 0
    ? winningTrades.reduce((sum, t) => sum + t.profitLoss, 0) / winningTrades.length
    : 0;

  const avgLoss = losingTrades.length > 0
    ? Math.abs(losingTrades.reduce((sum, t) => sum + t.profitLoss, 0) / losingTrades.length)
    : 0;

  const largestWin = winningTrades.length > 0
    ? Math.max(...winningTrades.map(t => t.profitLoss))
    : 0;

  const largestLoss = losingTrades.length > 0
    ? Math.abs(Math.min(...losingTrades.map(t => t.profitLoss)))
    : 0;

  // Consecutive wins/losses
  const sorted = [...trades].sort(
    (a, b) => new Date(`${a.date}T${a.time || "00:00"}`).getTime() - new Date(`${b.date}T${b.time || "00:00"}`).getTime()
  );

  let maxConsWins = 0, maxConsLosses = 0, currWins = 0, currLosses = 0;
  sorted.forEach(t => {
    if (t.profitLoss > 0) {
      currWins++;
      currLosses = 0;
      maxConsWins = Math.max(maxConsWins, currWins);
    } else if (t.profitLoss < 0) {
      currLosses++;
      currWins = 0;
      maxConsLosses = Math.max(maxConsLosses, currLosses);
    } else {
      currWins = 0;
      currLosses = 0;
    }
  });

  // Profit Factor
  const grossProfit = winningTrades.reduce((sum, t) => sum + t.profitLoss, 0);
  const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.profitLoss, 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0;

  // Average Risk Per Trade
  const validRisks = riskBreakdown.filter(r => r.riskPercent > 0);
  const avgRiskPerTrade = validRisks.length > 0
    ? validRisks.reduce((sum, r) => sum + r.riskPercent, 0) / validRisks.length
    : 0;

  // R-Multiple: profitLoss / riskDollars
  const rMultiples: number[] = [];
  trades.forEach(t => {
    const risk = calculatePerTradeRiskDollars(t);
    if (risk > 0) {
      rMultiples.push(t.profitLoss / risk);
    }
  });
  const avgRMultiple = rMultiples.length > 0
    ? rMultiples.reduce((sum, r) => sum + r, 0) / rMultiples.length
    : 0;

  // Sharpe-like ratio (daily returns)
  let sharpeRatio = 0;
  if (dailyPnL.length > 1) {
    const dailyReturns = dailyPnL.map(d => d.pnl);
    const mean = dailyReturns.reduce((s, r) => s + r, 0) / dailyReturns.length;
    const variance = dailyReturns.reduce((s, r) => s + Math.pow(r - mean, 2), 0) / dailyReturns.length;
    const stdDev = Math.sqrt(variance);
    sharpeRatio = stdDev > 0 ? (mean / stdDev) * Math.sqrt(252) : 0; // Annualized
  }

  // Win Rate
  const winRate = trades.length > 0
    ? Math.round((winningTrades.length / trades.length) * 100)
    : 0;

  // Avg trades per day
  const daysTraded = getDaysTradedCount(trades);
  const avgTradesPerDay = daysTraded > 0 ? trades.length / daysTraded : 0;

  // Risk Distribution Buckets
  const buckets = [
    { bucket: "0-1%", min: 0, max: 1, count: 0 },
    { bucket: "1-2%", min: 1, max: 2, count: 0 },
    { bucket: "2-3%", min: 2, max: 3, count: 0 },
    { bucket: "3-4%", min: 3, max: 4, count: 0 },
    { bucket: "4%+", min: 4, max: 999, count: 0 },
    { bucket: "No SL", min: -1, max: 0, count: 0 },
  ];

  riskBreakdown.forEach(r => {
    if (r.riskPercent === 0) {
      buckets[5].count++;
    } else {
      const bucket = buckets.find(b => r.riskPercent >= b.min && r.riskPercent < b.max);
      if (bucket) bucket.count++;
    }
  });

  return {
    bestDay: { date: bestDay.date, pnl: Math.round(bestDay.pnl * 100) / 100 },
    worstDay: { date: worstDay.date, pnl: Math.round(worstDay.pnl * 100) / 100 },
    avgDailyPnL: Math.round(avgDailyPnL * 100) / 100,
    avgTradeResult: Math.round(avgTradeResult * 100) / 100,
    avgWin: Math.round(avgWin * 100) / 100,
    avgLoss: Math.round(avgLoss * 100) / 100,
    largestWin: Math.round(largestWin * 100) / 100,
    largestLoss: Math.round(largestLoss * 100) / 100,
    maxConsecutiveWins: maxConsWins,
    maxConsecutiveLosses: maxConsLosses,
    profitFactor: Math.round(profitFactor * 100) / 100,
    avgRiskPerTrade: Math.round(avgRiskPerTrade * 100) / 100,
    avgRMultiple: Math.round(avgRMultiple * 100) / 100,
    sharpeRatio: Math.round(sharpeRatio * 100) / 100,
    winRate,
    totalTrades: trades.length,
    avgTradesPerDay: Math.round(avgTradesPerDay * 100) / 100,
    riskDistribution: buckets.map(b => ({ bucket: b.bucket, count: b.count })),
  };
}

// ─── Firm Presets (Accurate) ────────────────────────────────────────

export const FIRM_PRESETS: Record<string, Partial<ChallengeConfig>> = {
  "FTMO Phase 1": {
    firmName: "FTMO",
    phase: "Phase 1",
    accountSize: 100000,
    profitTarget: 10000,
    profitTargetPercent: 10,
    dailyDrawdownLimit: 5000,
    maxDrawdownLimit: 10000,
    maxDailyLossPercent: 5,
    maxTotalLossPercent: 10,
    maxRiskPerTrade: 3,
    minTradingDays: 4,
    maxTradingDays: 30,
    consistencyRule: false,
    consistencyPercent: 50,
    trailingDrawdownType: "none",
    noNewsTrading: false,
    noWeekendHolding: false,
    noHedging: false,
    maxLotSize: 0,
  },
  "FTMO Phase 2": {
    firmName: "FTMO",
    phase: "Phase 2 (Verification)",
    accountSize: 100000,
    profitTarget: 5000,
    profitTargetPercent: 5,
    dailyDrawdownLimit: 5000,
    maxDrawdownLimit: 10000,
    maxDailyLossPercent: 5,
    maxTotalLossPercent: 10,
    maxRiskPerTrade: 3,
    minTradingDays: 4,
    maxTradingDays: 60,
    consistencyRule: false,
    consistencyPercent: 50,
    trailingDrawdownType: "none",
    noNewsTrading: false,
    noWeekendHolding: false,
    noHedging: false,
    maxLotSize: 0,
  },
  "MFF Phase 1": {
    firmName: "MyForexFunds",
    phase: "Phase 1",
    accountSize: 100000,
    profitTarget: 8000,
    profitTargetPercent: 8,
    dailyDrawdownLimit: 5000,
    maxDrawdownLimit: 12000,
    maxDailyLossPercent: 5,
    maxTotalLossPercent: 12,
    maxRiskPerTrade: 3,
    minTradingDays: 5,
    maxTradingDays: 30,
    consistencyRule: false,
    consistencyPercent: 50,
    trailingDrawdownType: "none",
    noNewsTrading: false,
    noWeekendHolding: false,
    noHedging: false,
    maxLotSize: 0,
  },
  "TFT Phase 1": {
    firmName: "The Funded Trader",
    phase: "Phase 1",
    accountSize: 100000,
    profitTarget: 8000,
    profitTargetPercent: 8,
    dailyDrawdownLimit: 4000,
    maxDrawdownLimit: 8000,
    maxDailyLossPercent: 4,
    maxTotalLossPercent: 8,
    maxRiskPerTrade: 3,
    minTradingDays: 3,
    maxTradingDays: 35,
    consistencyRule: true,
    consistencyPercent: 40,
    trailingDrawdownType: "none",
    noNewsTrading: false,
    noWeekendHolding: false,
    noHedging: false,
    maxLotSize: 0,
  },
  "Funding Pips Phase 1": {
    firmName: "Funding Pips",
    phase: "Phase 1",
    accountSize: 100000,
    profitTarget: 8000,
    profitTargetPercent: 8,
    dailyDrawdownLimit: 5000,
    maxDrawdownLimit: 10000,
    maxDailyLossPercent: 5,
    maxTotalLossPercent: 10,
    maxRiskPerTrade: 3,
    minTradingDays: 0,
    maxTradingDays: 0,
    consistencyRule: false,
    consistencyPercent: 50,
    trailingDrawdownType: "none",
    noNewsTrading: true,
    noWeekendHolding: false,
    noHedging: false,
    maxLotSize: 0,
  },
  "Funding Pips Phase 2": {
    firmName: "Funding Pips",
    phase: "Phase 2",
    accountSize: 100000,
    profitTarget: 5000,
    profitTargetPercent: 5,
    dailyDrawdownLimit: 5000,
    maxDrawdownLimit: 10000,
    maxDailyLossPercent: 5,
    maxTotalLossPercent: 10,
    maxRiskPerTrade: 3,
    minTradingDays: 0,
    maxTradingDays: 0,
    consistencyRule: false,
    consistencyPercent: 50,
    trailingDrawdownType: "none",
    noNewsTrading: true,
    noWeekendHolding: false,
    noHedging: false,
    maxLotSize: 0,
  },
  "Goat Funded Phase 1": {
    firmName: "Goat Funded",
    phase: "Phase 1",
    accountSize: 100000,
    profitTarget: 8000,
    profitTargetPercent: 8,
    dailyDrawdownLimit: 4000,
    maxDrawdownLimit: 8000,
    maxDailyLossPercent: 4,
    maxTotalLossPercent: 8,
    maxRiskPerTrade: 3,
    minTradingDays: 0,
    maxTradingDays: 0,
    consistencyRule: true,
    consistencyPercent: 30,
    trailingDrawdownType: "none",
    noNewsTrading: false,
    noWeekendHolding: false,
    noHedging: false,
    maxLotSize: 0,
  },
  "Topstep": {
    firmName: "Topstep",
    phase: "Trading Combine",
    accountSize: 150000,
    profitTarget: 9000,
    profitTargetPercent: 6,
    dailyDrawdownLimit: 4500,
    maxDrawdownLimit: 4500,
    maxDailyLossPercent: 3,
    maxTotalLossPercent: 3,
    maxRiskPerTrade: 2,
    minTradingDays: 5,
    maxTradingDays: 0,
    consistencyRule: false,
    consistencyPercent: 50,
    trailingDrawdownType: "full-trailing",
    noNewsTrading: false,
    noWeekendHolding: true,
    noHedging: false,
    maxLotSize: 0,
  },
  "Apex Phase 1": {
    firmName: "Apex Trader Funding",
    phase: "Evaluation",
    accountSize: 100000,
    profitTarget: 6000,
    profitTargetPercent: 6,
    dailyDrawdownLimit: 0,
    maxDrawdownLimit: 3000,
    maxDailyLossPercent: 0,
    maxTotalLossPercent: 3,
    maxRiskPerTrade: 2,
    minTradingDays: 7,
    maxTradingDays: 0,
    consistencyRule: false,
    consistencyPercent: 50,
    trailingDrawdownType: "trailing-to-breakeven",
    noNewsTrading: false,
    noWeekendHolding: false,
    noHedging: false,
    maxLotSize: 0,
  },
  "E8 Phase 1": {
    firmName: "E8 Funding",
    phase: "Phase 1",
    accountSize: 100000,
    profitTarget: 8000,
    profitTargetPercent: 8,
    dailyDrawdownLimit: 4000,
    maxDrawdownLimit: 8000,
    maxDailyLossPercent: 4,
    maxTotalLossPercent: 8,
    maxRiskPerTrade: 3,
    minTradingDays: 0,
    maxTradingDays: 30,
    consistencyRule: false,
    consistencyPercent: 50,
    trailingDrawdownType: "trailing-to-breakeven",
    noNewsTrading: false,
    noWeekendHolding: false,
    noHedging: false,
    maxLotSize: 0,
  },
  "The5ers Phase 1": {
    firmName: "The5ers",
    phase: "Hyper Growth",
    accountSize: 100000,
    profitTarget: 8000,
    profitTargetPercent: 8,
    dailyDrawdownLimit: 3000,
    maxDrawdownLimit: 6000,
    maxDailyLossPercent: 3,
    maxTotalLossPercent: 6,
    maxRiskPerTrade: 2,
    minTradingDays: 3,
    maxTradingDays: 0,
    consistencyRule: true,
    consistencyPercent: 30,
    trailingDrawdownType: "none",
    noNewsTrading: false,
    noWeekendHolding: false,
    noHedging: true,
    maxLotSize: 0,
  },
  Custom: {},
};

// ─── Default Challenge Config ───────────────────────────────────────

export const DEFAULT_CHALLENGE: Omit<ChallengeConfig, "id"> = {
  name: "My Challenge",
  firmName: "FTMO",
  accountSize: 100000,
  profitTarget: 10000,
  profitTargetPercent: 10,
  dailyDrawdownLimit: 5000,
  maxDrawdownLimit: 10000,
  maxRiskPerTrade: 3,
  startDate: new Date().toISOString().split("T")[0],
  endDate: "",
  minTradingDays: 4,
  maxTradingDays: 30,
  phase: "Phase 1",
  isActive: true,
  status: "active",
  maxDailyLossPercent: 5,
  maxTotalLossPercent: 10,
  consistencyRule: false,
  consistencyPercent: 50,
  trailingDrawdownType: "none",
  noNewsTrading: false,
  noWeekendHolding: false,
  noHedging: false,
  maxLotSize: 0,
  createdAt: new Date().toISOString(),
};

// ─── Export Challenge Report ────────────────────────────────────────

export function generateChallengeReport(
  config: ChallengeConfig,
  evaluation: ChallengeEvaluation,
  stats: ChallengeStats,
  trades: Trade[]
): object {
  return {
    challenge: {
      name: config.name,
      firm: config.firmName,
      phase: config.phase,
      accountSize: config.accountSize,
      profitTarget: config.profitTarget,
      status: evaluation.status,
      failReason: evaluation.failReason,
      startDate: config.startDate,
      endDate: config.endDate || new Date().toISOString().split("T")[0],
    },
    performance: {
      totalPnL: evaluation.totalPnL,
      currentEquity: evaluation.currentEquity,
      profitProgress: evaluation.profitProgress,
      winRate: evaluation.winRate,
      wins: evaluation.wins,
      losses: evaluation.losses,
      daysTraded: evaluation.daysTraded,
      calendarDays: evaluation.calendarDays,
    },
    riskMetrics: {
      maxDrawdown: evaluation.maxDD,
      currentDrawdown: evaluation.currentDD,
      profitFactor: stats.profitFactor,
      sharpeRatio: stats.sharpeRatio,
      avgRiskPerTrade: stats.avgRiskPerTrade,
      avgRMultiple: stats.avgRMultiple,
    },
    statistics: stats,
    ruleChecks: evaluation.ruleChecks,
    tradeRiskWarnings: evaluation.tradeRiskWarnings,
    dailyPnL: evaluation.dailyPnL,
    trades: trades.map(t => ({
      id: t.id,
      date: t.date,
      time: t.time,
      pair: t.pair,
      direction: t.direction,
      entryPrice: t.entryPrice,
      exitPrice: t.exitPrice,
      stopLoss: t.stopLoss,
      takeProfit: t.takeProfit,
      lotSize: t.lotSize,
      profitLoss: t.profitLoss,
      pips: t.pips,
    })),
    exportedAt: new Date().toISOString(),
  };
}
