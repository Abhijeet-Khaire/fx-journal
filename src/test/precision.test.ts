import { describe, it, expect } from "vitest";
import {
  roundTo,
  roundCurrency,
  roundPips,
  roundPercent,
  addCurrency,
  subtractCurrency,
  calculateTradePnL,
} from "../lib/precision";

describe("Financial Math Precision Utilities", () => {
  it("handles basic rounding and epsilon corrections", () => {
    expect(roundTo(1.005, 2)).toBe(1.01);
    expect(roundCurrency(123.456)).toBe(123.46);
    expect(roundCurrency(123.454)).toBe(123.45);
    expect(roundPips(1.08456, 4)).toBe(1.0846);
    expect(roundPercent(4.5678)).toBe(4.57);
  });

  it("handles NaN and non-finite numbers safely", () => {
    expect(roundCurrency(NaN)).toBe(0);
    expect(roundCurrency(Infinity)).toBe(0);
    expect(addCurrency(10, NaN, 20)).toBe(30);
    expect(subtractCurrency(NaN, 10)).toBe(-10);
  });

  it("prevents floating-point accumulation drift over 100 additions", () => {
    // 0.1 + 0.2 in JS float arithmetic is 0.30000000000000004
    expect(0.1 + 0.2).not.toBe(0.3);
    expect(addCurrency(0.1, 0.2)).toBe(0.3);

    // Summing 0.07 one hundred times
    const floatSum = Array(100).fill(0.07).reduce((a, b) => a + b, 0);
    expect(floatSum).not.toBe(7.0);

    const safeSum = addCurrency(...Array(100).fill(0.07));
    expect(safeSum).toBe(7.0);
  });

  it("safely subtracts currency values", () => {
    expect(subtractCurrency(100.55, 50.25)).toBe(50.3);
    expect(subtractCurrency(100.0, 99.99)).toBe(0.01);
  });

  it("calculates trade P&L accurately for BUY and SELL", () => {
    // Long EUR/USD: Entry 1.0850, Exit 1.0900 (50 pips), 1.0 standard lot (100,000) = $500.00
    const buyPnL = calculateTradePnL(1.0850, 1.0900, 1.0, "BUY", 100000);
    expect(buyPnL).toBe(500);

    // Short EUR/USD: Entry 1.0900, Exit 1.0850 (50 pips profit), 2.0 lots = $1,000.00
    const sellPnL = calculateTradePnL(1.0900, 1.0850, 2.0, "SELL", 100000);
    expect(sellPnL).toBe(1000);

    // Short Loss: Entry 1.0850, Exit 1.0900 (50 pips loss), 1.0 lot = -$500.00
    const sellLoss = calculateTradePnL(1.0850, 1.0900, 1.0, "Short", 100000);
    expect(sellLoss).toBe(-500);

    // Invalid input fallback
    expect(calculateTradePnL(NaN, 1.0900, 1.0, "BUY")).toBe(0);
  });
});
