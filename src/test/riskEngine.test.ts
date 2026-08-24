import { describe, it, expect } from "vitest";
import {
  calculateRiskOfRuin,
  calculateKellyCriterion,
  calculateStreakProbabilities,
  getSurvivalScore,
} from "../lib/riskEngine";

describe("Risk Engine Calculations", () => {
  describe("calculateRiskOfRuin", () => {
    it("returns 100% when win rate is 0% or edge is negative/zero", () => {
      expect(calculateRiskOfRuin(0, 2, 1)).toBe(100);
      // 30% winrate with 1:1 RR has negative edge (0.30 - 0.70 = -0.40)
      expect(calculateRiskOfRuin(30, 1, 1)).toBe(100);
    });

    it("returns 0% or near 0% when win rate is extremely high", () => {
      expect(calculateRiskOfRuin(100, 2, 1)).toBe(0);
      expect(calculateRiskOfRuin(70, 2, 1)).toBeLessThan(1);
    });

    it("calculates realistic RoR for positive edge systems", () => {
      // 55% win rate, 1.5 RR, 1% risk per trade -> very small RoR
      const ror = calculateRiskOfRuin(55, 1.5, 1);
      expect(ror).toBeGreaterThanOrEqual(0);
      expect(ror).toBeLessThan(10);
    });

    it("clamps output within [0, 100]", () => {
      expect(calculateRiskOfRuin(-10, 1, 1)).toBe(100);
      expect(calculateRiskOfRuin(150, 2, 1)).toBe(0);
    });
  });

  describe("calculateKellyCriterion", () => {
    it("calculates optimal risk correctly for profitable systems", () => {
      // Win Rate: 60%, RR: 1.0 -> Kelly = 0.60 - (0.40 / 1) = 0.20 (20%)
      expect(calculateKellyCriterion(60, 1.0)).toBe(20);

      // Win Rate: 50%, RR: 2.0 -> Kelly = 0.50 - (0.50 / 2) = 0.25 (25%)
      expect(calculateKellyCriterion(50, 2.0)).toBe(25);
    });

    it("returns 0% when system has negative expectancy", () => {
      // 40% win rate, 1.0 RR -> negative expectancy
      expect(calculateKellyCriterion(40, 1.0)).toBe(0);
      expect(calculateKellyCriterion(0, 2.0)).toBe(0);
      expect(calculateKellyCriterion(50, 0)).toBe(0);
    });
  });

  describe("calculateStreakProbabilities", () => {
    it("computes losing streak probabilities for 3, 5, 10, 15 trades", () => {
      // 50% win rate -> loss rate = 50%
      // 3 streak = 0.5^3 = 12.5%
      // 5 streak = 0.5^5 = 3.12% or 3.13%
      const streaks = calculateStreakProbabilities(50);
      expect(streaks).toHaveLength(4);
      expect(streaks[0]).toEqual({ streak: 3, probability: 12.5 });
      expect(streaks[1]).toEqual({ streak: 5, probability: 3.13 });
    });
  });

  describe("getSurvivalScore", () => {
    it("scores 100 for zero RoR, high win rate, and low risk per trade", () => {
      const score = getSurvivalScore(0, 60, 1);
      expect(score).toBe(100);
    });

    it("penalizes high risk per trade (> 3%) and low win rate (< 30%)", () => {
      // 5% risk per trade gives -20 penalty, 20% win rate gives -10 penalty, 10% RoR gives -10 penalty -> 60
      const score = getSurvivalScore(10, 20, 5);
      expect(score).toBe(60);
    });
  });
});
