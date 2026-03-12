import { describe, it, expect } from "vitest";
import { calculateConsistencyScore, detectRevengeRisk, clusterTrades } from "../lib/mlEngine";
import { generateCoachingInsights } from "../lib/aiCoach";
import { Trade } from "../lib/tradeTypes";

const mockTrades: Trade[] = [
  { id: "1", userId: "u1", pair: "EUR/USD", direction: "BUY", entryPrice: 1.1, exitPrice: 1.2, stopLoss: 1.0, takeProfit: 1.3, lotSize: 1, profitLoss: 100, pips: 10, date: "2024-01-01", time: "10:00", session: "London", strategy: "Breakout", rulesFollowed: true, notes: "" },
  { id: "2", userId: "u1", pair: "EUR/USD", direction: "BUY", entryPrice: 1.1, exitPrice: 1.0, stopLoss: 1.05, takeProfit: 1.2, lotSize: 1, profitLoss: -50, pips: -5, date: "2024-01-02", time: "10:00", session: "London", strategy: "Breakout", rulesFollowed: true, notes: "" },
  { id: "3", userId: "u1", pair: "EUR/USD", direction: "BUY", entryPrice: 1.1, exitPrice: 1.2, stopLoss: 1.0, takeProfit: 1.3, lotSize: 2, profitLoss: 200, pips: 10, date: "2024-01-03", time: "10:00", session: "London", strategy: "Breakout", rulesFollowed: true, notes: "" },
  { id: "4", userId: "u1", pair: "EUR/USD", direction: "BUY", entryPrice: 1.1, exitPrice: 1.0, stopLoss: 1.05, takeProfit: 1.2, lotSize: 1, profitLoss: -50, pips: -5, date: "2024-01-04", time: "10:00", session: "London", strategy: "Breakout", rulesFollowed: false, notes: "" },
  { id: "5", userId: "u1", pair: "EUR/USD", direction: "BUY", entryPrice: 1.1, exitPrice: 1.0, stopLoss: 1.05, takeProfit: 1.2, lotSize: 5, profitLoss: -250, pips: -5, date: "2024-01-05", time: "10:00", session: "London", strategy: "Breakout", rulesFollowed: true, notes: "" },
];

describe("ML Engine", () => {
  it("calculates consistency score", () => {
    const score = calculateConsistencyScore(mockTrades);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("detects revenge risk", () => {
    const revenge = detectRevengeRisk(mockTrades);
    expect(revenge.frequency).toBeGreaterThan(0);
    expect(revenge.locations).toContain("5"); // Lot size 5 after a loss
  });
});

describe("AI Coach", () => {
  it("generates insights", () => {
    const insights = generateCoachingInsights(mockTrades);
    expect(insights.length).toBeGreaterThan(0);
  });
});
