export interface Trade {
  id: string;
  userId: string;
  createdAt?: string;
  pair: string;
  direction: "BUY" | "SELL";
  entryPrice: number;
  exitPrice: number;
  stopLoss: number;
  takeProfit: number;
  lotSize: number;
  profitLoss: number;
  pips: number;
  date: string;
  time: string;
  session: "Asian" | "London" | "New York";
  strategy: string;
  rulesFollowed: boolean;
  notes: string;
  emotionBefore?: string;
  emotionAfter?: string;
  confidence?: number;
  mistakes?: string[];
}


// Plan type defined below


export const STRATEGIES = [
  "Breakout",
  "Trend Following",
  "Scalping",
  "Swing Trading",
  "News Trading"
] as const;

export type Plan = "free" | "pro" | "ultimate";

export const PAIRS = [
  "EUR/USD", "GBP/USD", "USD/JPY", "USD/CHF", "AUD/USD", "USD/CAD", "NZD/USD",
  "EUR/GBP", "EUR/JPY", "GBP/JPY", "XAU/USD", "XAG/USD", // Metals
  "BTC/USD", "ETH/USD", // Crypto
  "US30", "NAS100", "SPX500" // Indices
] as const;

export const FREE_TRADE_LIMIT = 50;
// Pro is now unlimited, so we can set this to a very high number or handle it in logic
export const PRO_TRADE_LIMIT = 1000000;

export interface PlaybookRule {
  id: string;
  strategyId: string;
  condition: string;
  type: "entry" | "exit" | "risk";
}

export interface StrategyPlaybook {
  id: string;
  name: string;
  description: string;
  rules: PlaybookRule[];
}

export interface AnalyticsResult {
  group: string;
  winRate: number;
  profit: number;
  count: number;
  expectancy: number;
}

export interface RiskStats {
  avgRisk: number;
  maxRisk: number;
  riskConsistency: number; // 0-100
  currentDrawdown: number;
  maxDrawdown: number;
  recoveryTime: number; // in trades
}

export interface TradeQuality {
  score: number; // 0-100
  grade: "A" | "B" | "C" | "D" | "F";
  issues: string[];
}

export interface LosingPattern {
  name: string;
  description: string;
  count: number;
  impact: number; // Total loss amount
}
