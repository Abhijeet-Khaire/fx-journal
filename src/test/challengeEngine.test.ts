import { describe, it, expect } from "vitest";
import {
  evaluateChallenge,
  calculateEquityCurve,
  calculateTrailingDrawdown,
  calculateDailyPnL,
  checkConsistencyRule,
  checkWeekendHolding,
  checkMaxLotSize,
  ChallengeConfig,
} from "../lib/challengeEngine";
import { Trade } from "../lib/tradeTypes";

const baseConfig: ChallengeConfig = {
  id: "test-challenge",
  name: "FTMO $100k Challenge",
  firmName: "FTMO",
  accountSize: 100000,
  profitTarget: 10000,
  profitTargetPercent: 10,
  dailyDrawdownLimit: 5000,
  maxDrawdownLimit: 10000,
  maxRiskPerTrade: 3,
  startDate: "2024-01-01",
  endDate: "2024-02-01",
  minTradingDays: 4,
  maxTradingDays: 0, // 0 = unlimited
  phase: "Phase 1",
  isActive: true,
  status: "active",
  maxDailyLossPercent: 5,
  maxTotalLossPercent: 10,
  consistencyRule: false,
  consistencyPercent: 30,
  trailingDrawdownType: "none",
  noNewsTrading: false,
  noWeekendHolding: false,
  noHedging: false,
  maxLotSize: 50,
  createdAt: "2024-01-01T00:00:00Z",
};

function createMockTrade(overrides: Partial<Trade>): Trade {
  return {
    id: `trade-${Math.random().toString(36).substr(2, 9)}`,
    date: "2024-01-01",
    time: "10:00",
    pair: "EURUSD",
    type: "BUY",
    lotSize: 1.0,
    entryPrice: 1.0850,
    exitPrice: 1.0900,
    profitLoss: 500,
    pips: 50,
    status: "CLOSED",
    riskRewardRatio: 2.0,
    notes: "",
    tags: [],
    ...overrides,
  };
}

describe("Challenge Engine - Max Drawdown & Equity Curve", () => {
  it("calculates sequential peak-to-trough max drawdown accurately", () => {
    const trades: Trade[] = [
      createMockTrade({ date: "2024-01-01", time: "10:00", profitLoss: 1000 }),
      createMockTrade({ date: "2024-01-01", time: "11:00", profitLoss: -2000 }),
      createMockTrade({ date: "2024-01-01", time: "12:00", profitLoss: 3000 }),
      createMockTrade({ date: "2024-01-01", time: "13:00", profitLoss: -4000 }),
    ];

    // Cumulative PnL sequence:
    // +1000 (Peak 1000, DD 0)
    // -1000 (Peak 1000, DD 2000)
    // +2000 (Peak 2000, DD 0)
    // -2000 (Peak 2000, DD 4000)
    const evaluation = evaluateChallenge(baseConfig, trades);
    expect(evaluation.maxDD).toBe(4000);
    expect(evaluation.currentEquity).toBe(98000);
    expect(evaluation.status).toBe("active");
  });

  it("sorts out-of-order trades chronologically and handles missing time strings", () => {
    const outOfOrderTrades: Trade[] = [
      createMockTrade({ date: "2024-01-01", time: "13:00", profitLoss: -4000 }),
      createMockTrade({ date: "2024-01-01", time: undefined, profitLoss: 1000 }), // defaults to 00:00
      createMockTrade({ date: "2024-01-01", time: "12:00", profitLoss: 3000 }),
      createMockTrade({ date: "2024-01-01", time: "11:00", profitLoss: -2000 }),
    ];

    const evaluation = evaluateChallenge(baseConfig, outOfOrderTrades);
    expect(evaluation.maxDD).toBe(4000);
    expect(evaluation.totalPnL).toBe(-2000);
  });
});

describe("Challenge Engine - Trailing Drawdown", () => {
  it("calculates static drawdown floor when trailingDrawdownType is none", () => {
    const trades = [createMockTrade({ profitLoss: 5000 })];
    const floor = calculateTrailingDrawdown(trades, 100000, 10000, "none");
    expect(floor).toBe(90000);
  });

  it("calculates full-trailing drawdown floor with rising high-water mark", () => {
    const trades = [
      createMockTrade({ date: "2024-01-01", time: "10:00", profitLoss: 5000 }), // Equity 105k -> Floor 95k
      createMockTrade({ date: "2024-01-01", time: "11:00", profitLoss: 3000 }), // Equity 108k -> Floor 98k
      createMockTrade({ date: "2024-01-01", time: "12:00", profitLoss: -2000 }), // Equity 106k -> Floor remains 98k
    ];
    const floor = calculateTrailingDrawdown(trades, 100000, 10000, "full-trailing");
    expect(floor).toBe(98000);
  });

  it("calculates trailing-to-breakeven floor and locks at initial balance", () => {
    const trades = [
      createMockTrade({ date: "2024-01-01", time: "10:00", profitLoss: 6000 }), // Equity 106k -> Floor 96k
      createMockTrade({ date: "2024-01-01", time: "11:00", profitLoss: 8000 }), // Equity 114k -> Floor caps at 100k
    ];
    const floor = calculateTrailingDrawdown(trades, 100000, 10000, "trailing-to-breakeven");
    expect(floor).toBe(100000);
  });

  it("triggers failure when equity dips below full-trailing floor", () => {
    const config: ChallengeConfig = {
      ...baseConfig,
      trailingDrawdownType: "full-trailing",
    };

    const trades = [
      createMockTrade({ date: "2024-01-01", time: "10:00", profitLoss: 5000 }), // Equity 105k, Floor 95k
      createMockTrade({ date: "2024-01-01", time: "11:00", profitLoss: -11000 }), // Equity 94k -> Below 95k
    ];

    const evaluation = evaluateChallenge(config, trades);
    expect(evaluation.status).toBe("failed");
    expect(evaluation.failReason).toContain("drawdown");
  });
});

describe("Challenge Engine - Daily Drawdown & Status Transitions", () => {
  it("detects single-day cumulative loss breaching daily limit", () => {
    const trades = [
      createMockTrade({ date: "2024-01-01", time: "09:00", profitLoss: -3000 }),
      createMockTrade({ date: "2024-01-01", time: "14:00", profitLoss: -2500 }), // Daily sum = -5500 (limit is 5000)
    ];

    const dailyPnL = calculateDailyPnL(trades, 5000);
    expect(dailyPnL).toHaveLength(1);
    expect(dailyPnL[0].pnl).toBe(-5500);
    expect(dailyPnL[0].breachedDailyDD).toBe(true);

    const evaluation = evaluateChallenge(baseConfig, trades);
    expect(evaluation.status).toBe("failed");
    expect(evaluation.failReason).toBe("Daily drawdown limit breached");
  });

  it("passes challenge when profit target and min trading days are met", () => {
    const trades = [
      createMockTrade({ date: "2024-01-01", profitLoss: 2500 }),
      createMockTrade({ date: "2024-01-02", profitLoss: 2500 }),
      createMockTrade({ date: "2024-01-03", profitLoss: 2500 }),
      createMockTrade({ date: "2024-01-04", profitLoss: 2500 }), // Total PnL = 10000, 4 distinct days
    ];

    const evaluation = evaluateChallenge(baseConfig, trades);
    expect(evaluation.status).toBe("passed");
    expect(evaluation.profitProgress).toBe(100);
    expect(evaluation.daysTraded).toBe(4);
  });

  it("keeps status active if profit target is hit but min trading days are not yet met", () => {
    const trades = [
      createMockTrade({ date: "2024-01-01", profitLoss: 10000 }), // 1 day traded, need 4
    ];

    const evaluation = evaluateChallenge(baseConfig, trades);
    expect(evaluation.status).toBe("active");
    expect(evaluation.totalPnL).toBe(10000);
    expect(evaluation.daysTraded).toBe(1);
  });
});

describe("Challenge Engine - Consistency & Trading Rules", () => {
  it("flags consistency violation if a single trade exceeds consistency threshold", () => {
    const trades = [
      createMockTrade({ id: "t1", profitLoss: 8000 }), // 80% of total profit (10,000)
      createMockTrade({ id: "t2", profitLoss: 2000 }),
    ];

    const result = checkConsistencyRule(trades, 30);
    expect(result.violated).toBe(true);
    expect(result.violatingTrades).toContain("t1");
    expect(result.highestSinglePct).toBe(80);
  });

  it("passes consistency check if all trades are within limit", () => {
    const trades = [
      createMockTrade({ id: "t1", profitLoss: 2500 }),
      createMockTrade({ id: "t2", profitLoss: 2500 }),
      createMockTrade({ id: "t3", profitLoss: 2500 }),
      createMockTrade({ id: "t4", profitLoss: 2500 }),
    ];

    const result = checkConsistencyRule(trades, 30);
    expect(result.violated).toBe(false);
    expect(result.highestSinglePct).toBe(25);
  });

  it("checks weekend holding and max lot size violations", () => {
    // 2024-01-06 is Saturday
    const weekendTrade = createMockTrade({ id: "w1", date: "2024-01-06" });
    const weekdayTrade = createMockTrade({ id: "w2", date: "2024-01-08" }); // Monday

    const weekendViolations = checkWeekendHolding([weekendTrade, weekdayTrade]);
    expect(weekendViolations).toEqual(["w1"]);

    const largeLotTrade = createMockTrade({ id: "l1", lotSize: 60 });
    const normalLotTrade = createMockTrade({ id: "l2", lotSize: 10 });
    const lotViolations = checkMaxLotSize([largeLotTrade, normalLotTrade], 50);
    expect(lotViolations).toEqual(["l1"]);
  });

  it("marks challenge as expired if calendar days exceed maxTradingDays without hitting target", () => {
    const expiredConfig: ChallengeConfig = {
      ...baseConfig,
      startDate: "2020-01-01",
      maxTradingDays: 30,
      profitTarget: 10000,
    };
    const trades = [createMockTrade({ profitLoss: 2000 })];
    const evaluation = evaluateChallenge(expiredConfig, trades);
    expect(evaluation.status).toBe("expired");
    expect(evaluation.failReason).toContain("Time limit exceeded");
  });
});

