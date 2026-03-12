import { z } from "zod";

export const TradeSchema = z.object({
  id: z.string().optional(),
  userId: z.string().optional(),
  createdAt: z.string().optional(),
  pair: z.string().min(1, "Pair is required"),
  direction: z.enum(["BUY", "SELL"]),
  entryPrice: z.number().positive("Entry price must be positive"),
  exitPrice: z.number().positive("Exit price must be positive"),
  stopLoss: z.number().nonnegative().optional(),
  takeProfit: z.number().nonnegative().optional(),
  lotSize: z.number().positive("Lot size must be positive"),
  profitLoss: z.number(),
  pips: z.number(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
  session: z.enum(["Asian", "London", "New York"]),
  strategy: z.string().min(1, "Strategy is required"),
  rulesFollowed: z.boolean(),
  notes: z.string().optional(),
  emotionBefore: z.string().optional(),
  emotionAfter: z.string().optional(),
  confidence: z.number().min(1).max(5).optional(),
  mistakes: z.array(z.string()).optional(),
  challengeId: z.string().optional(),
});

export type TradeValue = z.infer<typeof TradeSchema>;

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
  challengeId?: string;
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
