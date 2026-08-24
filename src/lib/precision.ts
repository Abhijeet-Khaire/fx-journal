/**
 * Financial & Trading Precision Math Utilities
 * Prevents floating-point drift across trade journals, P&L calculations, and drawdown tracking.
 */

/**
 * Rounds a number to a specified number of decimal places using standard epsilon correction.
 */
export function roundTo(val: number, decimals: number = 2): number {
  if (isNaN(val) || !isFinite(val)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round((val + Number.EPSILON) * factor) / factor;
}

/**
 * Rounds currency to 2 decimal places (standard fiat / USD / EUR).
 */
export function roundCurrency(val: number): number {
  return roundTo(val, 2);
}

/**
 * Rounds Forex pip / crypto precision (defaults to 4 decimal places).
 */
export function roundPips(val: number, decimals: number = 4): number {
  return roundTo(val, decimals);
}

/**
 * Rounds percentage to 2 decimal places (e.g. 5.25%).
 */
export function roundPercent(val: number, decimals: number = 2): number {
  return roundTo(val, decimals);
}

/**
 * Safely adds multiple currency values, eliminating floating-point accumulation errors.
 */
export function addCurrency(...vals: number[]): number {
  const sumInCents = vals.reduce((acc, v) => {
    if (isNaN(v) || !isFinite(v)) return acc;
    return acc + Math.round((v + Number.EPSILON) * 100);
  }, 0);
  return sumInCents / 100;
}

/**
 * Safely subtracts currency b from a (a - b).
 */
export function subtractCurrency(a: number, b: number): number {
  const aCents = Math.round(((isNaN(a) || !isFinite(a) ? 0 : a) + Number.EPSILON) * 100);
  const bCents = Math.round(((isNaN(b) || !isFinite(b) ? 0 : b) + Number.EPSILON) * 100);
  return (aCents - bCents) / 100;
}

/**
 * Calculates P&L from entry, exit, lotSize, direction, and contract size.
 */
export function calculateTradePnL(
  entryPrice: number,
  exitPrice: number,
  lotSize: number,
  direction: "BUY" | "SELL" | "Long" | "Short" | "LONG" | "SHORT",
  contractSize: number = 100000
): number {
  if (isNaN(entryPrice) || isNaN(exitPrice) || isNaN(lotSize) || lotSize <= 0) {
    return 0;
  }
  const isLong = direction.toUpperCase() === "BUY" || direction.toUpperCase() === "LONG";
  const diff = isLong ? exitPrice - entryPrice : entryPrice - exitPrice;
  const pnl = diff * lotSize * contractSize;
  return roundCurrency(pnl);
}
