import { describe, it, expect } from "vitest";
import {
  getWinRate,
  getNetProfit,
  getProfitFactor,
  getAverageRR,
  getEdgeScore,
  getDisciplineScore,
  getBestPair,
  getWorstSession,
  getBestStrategy,
  getEquityCurve,
  calculatePips,
  calculatePL,
  getTradeQuality,
  detectLosingPatterns,
  getStrategyPerformance,
} from "../lib/tradeAnalytics";
import { Trade } from "../lib/tradeTypes";

function createMockTrade(overrides: Partial<Trade>): Trade {
  return {
    id: `trade-${Math.random().toString(36).substr(2, 9)}`,
    date: "2024-01-01",
    time: "10:00",
    pair: "EUR/USD",
    type: "BUY",
    lotSize: 1.0,
    entryPrice: 1.0850,
    exitPrice: 1.0900,
    profitLoss: 500,
    pips: 50,
    status: "CLOSED",
    riskRewardRatio: 2.0,
    strategy: "Breakout",
    session: "London",
    rulesFollowed: true,
    confidence: 4,
    notes: "",
    tags: [],
    ...overrides,
  };
}

describe("Trade Analytics Engine", () => {
  it("calculates win rate, net profit, and profit factor accurately", () => {
    const trades: Trade[] = [
      createMockTrade({ profitLoss: 600 }),
      createMockTrade({ profitLoss: 400 }),
      createMockTrade({ profitLoss: -500 }),
    ];

    expect(getWinRate(trades)).toBe(66.67);
    expect(getNetProfit(trades)).toBe(500);
    // Profit factor = 1000 / 500 = 2.0
    expect(getProfitFactor(trades)).toBe(2);
  });

  it("handles edge cases for profit factor when no losses exist", () => {
    const winningTrades = [createMockTrade({ profitLoss: 500 })];
    expect(getProfitFactor(winningTrades)).toBe(100);

    const emptyTrades: Trade[] = [];
    expect(getProfitFactor(emptyTrades)).toBe(0);
    expect(getWinRate(emptyTrades)).toBe(0);
    expect(getNetProfit(emptyTrades)).toBe(0);
  });

  it("calculates average R:R and edge score", () => {
    const trades = [
      createMockTrade({ profitLoss: 1000 }), // win
      createMockTrade({ profitLoss: -500 }), // loss
      createMockTrade({ profitLoss: 500 }),  // win
    ];

    // Avg Win = 750, Avg Loss = 500 -> Avg RR = 1.5
    expect(getAverageRR(trades)).toBe(1.5);
    expect(getEdgeScore(trades)).toBeGreaterThan(50);
  });

  it("computes discipline score with rule violations and overtrading penalties", () => {
    // 2 trades, 1 violated rules -> 50% penalty = 75 score
    const trades = [
      createMockTrade({ rulesFollowed: true, date: "2024-01-01" }),
      createMockTrade({ rulesFollowed: false, date: "2024-01-01" }),
    ];

    const score = getDisciplineScore(trades);
    expect(score).toBe(75);
  });

  it("calculates pips and P&L across standard forex, JPY, and metal pairs", () => {
    // EUR/USD BUY: 1.0850 -> 1.0900 = +50.0 pips
    expect(calculatePips("EUR/USD", 1.0850, 1.0900, "BUY")).toBe(50);
    // EUR/USD SELL: 1.0900 -> 1.0850 = +50.0 pips
    expect(calculatePips("EUR/USD", 1.0900, 1.0850, "SELL")).toBe(50);

    // USD/JPY BUY: 150.00 -> 150.50 = +50.0 pips
    expect(calculatePips("USD/JPY", 150.00, 150.50, "BUY")).toBe(50);

    // XAU/USD (Gold) BUY: 2000.00 -> 2010.00 = +1000.0 pips (multiplier 100)
    expect(calculatePips("XAU/USD", 2000.00, 2010.00, "BUY")).toBe(1000);

    // P&L for EUR/USD: 50 pips, 1 lot -> $500.00
    expect(calculatePL(50, 1.0, "EUR/USD", 1.0850, 1.0900)).toBe(500);
  });

  it("evaluates trade quality score and issues", () => {
    const goodTrade = createMockTrade({
      rulesFollowed: true,
      stopLoss: 1.0800,
      takeProfit: 1.0950,
      entryPrice: 1.0850,
      confidence: 5,
    });
    const quality = getTradeQuality(goodTrade);
    expect(quality.score).toBe(100);
    expect(quality.grade).toBe("A");
    expect(quality.issues).toHaveLength(0);

    const badTrade = createMockTrade({
      rulesFollowed: false,
      stopLoss: 0,
      takeProfit: 0,
      confidence: 1,
      emotionBefore: "Fear",
    });
    const badQuality = getTradeQuality(badTrade);
    expect(badQuality.score).toBeLessThan(50);
    expect(badQuality.grade).toBe("F");
    expect(badQuality.issues).toContain("Rules not followed");
  });

  it("detects losing patterns like Tilt Warning and Hesitation Tax", () => {
    const tiltTrades = [
      createMockTrade({ date: "2024-01-01", time: "10:00", profitLoss: -100 }),
      createMockTrade({ date: "2024-01-01", time: "11:00", profitLoss: -200 }),
      createMockTrade({ date: "2024-01-01", time: "12:00", profitLoss: -300 }),
    ];

    const patterns = detectLosingPatterns(tiltTrades);
    expect(patterns.some((p) => p.name === "Tilt Warning")).toBe(true);
  });

  it("aggregates strategy performance", () => {
    const trades = [
      createMockTrade({ strategy: "Trend", profitLoss: 500 }),
      createMockTrade({ strategy: "Trend", profitLoss: 300 }),
      createMockTrade({ strategy: "Scalp", profitLoss: -200 }),
    ];

    const perf = getStrategyPerformance(trades);
    expect(perf[0].strategy).toBe("Trend");
    expect(perf[0].profit).toBe(800);
    expect(perf[0].winRate).toBe(100);
  });
});
