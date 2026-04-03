import { Trade } from "./tradeTypes";
import { getDrawdownStats } from "./tradeStore";

/**
 * Consistency Score: 1 - (stdDev(equityReturns) / avgReturn)
 * Scaled 0-100.
 */
export function calculateConsistencyScore(trades: Trade[]): number {
  if (trades.length < 5) return 0;

  const returns = trades
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((t) => t.profitLoss);

  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  if (avgReturn === 0) return 0;

  const variance =
    returns.reduce((a, b) => a + Math.pow(b - avgReturn, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);

  const score = 1 - stdDev / Math.abs(avgReturn);
  return Math.max(0, Math.min(100, Math.round(score * 100)));
}

/**
 * Revenge Risk Detection: 
 * If previousTrade == loss and nextTradeRisk > avgRisk: flag revengeRisk
 */
export function detectRevengeRisk(trades: Trade[]): { frequency: number; locations: string[] } {
  const sorted = [...trades].sort((a, b) => new Date(a.date + "T" + a.time).getTime() - new Date(b.date + "T" + b.time).getTime());

  if (sorted.length < 2) return { frequency: 0, locations: [] };

  const averageLotSize = sorted.reduce((sum, t) => sum + t.lotSize, 0) / sorted.length;
  let revengeTrades = 0;
  const locations: string[] = [];

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];

    if (prev.profitLoss < 0 && curr.lotSize > averageLotSize * 1.2) {
      revengeTrades++;
      locations.push(curr.id);
    }
  }

  return {
    frequency: Math.round((revengeTrades / (sorted.length - 1)) * 100),
    locations
  };
}

/**
 * Basic K-Means clustering for trades (Simplified for JS implementation)
 * Groups trades by: Pair, Session, Strategy, RR, Duration (placeholder), Emotion, Confidence
 */
export interface TradeCluster {
  id: string;
  name: string;
  trades: Trade[];
  avgProfit: number;
  winRate: number;
}

export function clusterTrades(trades: Trade[]): TradeCluster[] {
  if (trades.length < 5) return [];

  const pairs = Array.from(new Set(trades.map(t => t.pair)));
  const strategies = Array.from(new Set(trades.map(t => t.strategy)));
  const sessions = Array.from(new Set(trades.map(t => t.session)));

  const getEmotionScore = (emotion: string) => {
    const map: Record<string, number> = { "Fear": -1, "Anxiety": -1, "Neutral": 0, "Confidence": 1, "Excitement": 1, "Greed": -2 };
    return map[emotion || "Neutral"] || 0;
  };

  const calculateRR = (t: Trade) => {
    if (!t.stopLoss || !t.takeProfit || t.stopLoss === t.entryPrice) return 1;
    const risk = Math.abs(t.entryPrice - t.stopLoss);
    const reward = Math.abs(t.takeProfit - t.entryPrice);
    return risk > 0 ? reward / risk : 1;
  };

  const vectors = trades.map(t => [
    pairs.indexOf(t.pair),
    strategies.indexOf(t.strategy),
    sessions.indexOf(t.session),
    calculateRR(t),
    0, // tradeDuration placeholder
    getEmotionScore(t.emotionBefore || "Neutral"),
    t.confidence || 3
  ]);

  // Normalize vectors
  const numFeatures = vectors[0].length;
  const mins = Array(numFeatures).fill(Infinity);
  const maxs = Array(numFeatures).fill(-Infinity);

  for (const v of vectors) {
    for (let i = 0; i < numFeatures; i++) {
      if (v[i] < mins[i]) mins[i] = v[i];
      if (v[i] > maxs[i]) maxs[i] = v[i];
    }
  }

  const normalizedVectors = vectors.map(v =>
    v.map((val, i) => maxs[i] === mins[i] ? 0 : (val - mins[i]) / (maxs[i] - mins[i]))
  );


  const distance = (a: number[], b: number[]) => Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0));

  // K-Means algorithm (Optimized)
  let k = Math.min(3, trades.length);
  let centroids: number[][] = [];

  // K-Means++ style initialization for better stability
  if (normalizedVectors.length > 0) {
    centroids.push([...normalizedVectors[Math.floor(Math.random() * normalizedVectors.length)]]);
    while (centroids.length < k) {
      let maxDist = -1;
      let nextCentroidIdx = 0;
      for (let i = 0; i < normalizedVectors.length; i++) {
        let minDistToCentroid = Infinity;
        for (const c of centroids) {
          const d = distance(normalizedVectors[i], c);
          if (d < minDistToCentroid) minDistToCentroid = d;
        }
        if (minDistToCentroid > maxDist) {
          maxDist = minDistToCentroid;
          nextCentroidIdx = i;
        }
      }
      centroids.push([...normalizedVectors[nextCentroidIdx]]);
    }
  }

  let clustersIndices: number[][] = Array(k).fill(null).map(() => []);

  for (let iter = 0; iter < 50; iter++) {
    let newClustersIndices: number[][] = Array(k).fill(null).map(() => []);
    let changedCount = 0;

    for (let i = 0; i < normalizedVectors.length; i++) {
      let minDist = Infinity;
      let clusterIdx = 0;
      for (let j = 0; j < k; j++) {
        const dist = distance(normalizedVectors[i], centroids[j]);
        if (dist < minDist) {
          minDist = dist;
          clusterIdx = j;
        }
      }
      newClustersIndices[clusterIdx].push(i);
    }

    let centroidShift = 0;
    for (let i = 0; i < k; i++) {
      if (newClustersIndices[i].length === 0) continue;

      const newCentroid = Array(numFeatures).fill(0);
      for (const pointIdx of newClustersIndices[i]) {
        for (let d = 0; d < numFeatures; d++) {
          newCentroid[d] += normalizedVectors[pointIdx][d];
        }
      }

      for (let d = 0; d < numFeatures; d++) {
        newCentroid[d] /= newClustersIndices[i].length;
        centroidShift += Math.abs(newCentroid[d] - centroids[i][d]);
      }
      centroids[i] = newCentroid;
    }

    clustersIndices = newClustersIndices;
    if (centroidShift < 0.001) break;
  }

  const getDominantTrait = (traits: string[]) => {
    if (!traits.length) return "Mixed";
    const counts = traits.reduce((acc, val) => {
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  };

  return clustersIndices.map((indices, i) => {
    const clusterTrades = indices.map(idx => trades[idx]);
    const wins = clusterTrades.filter(t => t.profitLoss > 0).length;

    // Determine the dominant pattern name for the UI
    const dominantStrategy = getDominantTrait(clusterTrades.map(t => t.strategy));
    const dominantSession = getDominantTrait(clusterTrades.map(t => t.session));

    return {
      id: `cluster-${i}`,
      name: `${dominantStrategy} - ${dominantSession}`,
      trades: clusterTrades,
      avgProfit: clusterTrades.length ? clusterTrades.reduce((s, t) => s + t.profitLoss, 0) / clusterTrades.length : 0,
      winRate: clusterTrades.length ? Math.round((wins / clusterTrades.length) * 100) : 0
    };
  }).filter(c => c.trades.length > 0).sort((a, b) => b.avgProfit - a.avgProfit);
}

export function getTraderProfile(trades: Trade[]) {
  const consistency = calculateConsistencyScore(trades);
  const revenge = detectRevengeRisk(trades);
  const avgRisk = trades.length ? trades.reduce((s, t) => s + t.lotSize, 0) / trades.length : 0;
  const ruleAdherence = trades.length ? (trades.filter(t => t.rulesFollowed).length / trades.length) * 100 : 0;

  let profile = "Developing Trader";
  if (ruleAdherence > 90 && consistency > 70) profile = "Disciplined Professional";
  else if (revenge.frequency > 20) profile = "Emotional Scalper";
  else if (avgRisk > 5) profile = "Aggressive Hunter";
  else if (consistency < 30) profile = "Inconsistent Gambler";

  return {
    profile,
    stats: {
      consistency,
      revengeRisk: revenge.frequency,
      ruleAdherence,
      discipline: ruleAdherence
    }
  };
}

/**
 * Predicts the success probability of a pending trade based on historical performance
 * for the given pair, session, and emotion.
 */
export function predictTradeSuccessProbability(
  trades: Trade[],
  setup: { pair: string; session: string; emotion: string }
): { probability: number; warning?: string; recommendedRisk: number } {
  if (trades.length < 5) {
    return {
      probability: 50,
      warning: "Need more historical data for accurate prediction.",
      recommendedRisk: 1.0, // Default 1%
    };
  }

  // Find similar trades
  const similarTrades = trades.filter(
    (t) =>
      t.pair === setup.pair ||
      t.session === setup.session ||
      t.emotionBefore === setup.emotion
  );

  let winRate = 0;
  let matchesCount = similarTrades.length;

  if (matchesCount > 0) {
    const wins = similarTrades.filter((t) => t.profitLoss > 0).length;
    winRate = wins / matchesCount;
  } else {
    // If no similar trades, fallback to overall win rate
    const wins = trades.filter((t) => t.profitLoss > 0).length;
    winRate = wins / trades.length;
  }

  // Adjust probability based on exact matches
  let exactMatches = trades.filter(
    (t) =>
      t.pair === setup.pair &&
      t.session === setup.session &&
      t.emotionBefore === setup.emotion
  );

  let exactWinRate = 0;
  if (exactMatches.length > 0) {
    const exactWins = exactMatches.filter((t) => t.profitLoss > 0).length;
    exactWinRate = exactWins / exactMatches.length;
  }

  // Blend rates, give more weight to exact matches if they exist
  const finalProbability =
    exactMatches.length > 2
      ? exactWinRate * 0.7 + winRate * 0.3
      : winRate;

  const probabilityPercent = Math.round(finalProbability * 100);

  let warning = undefined;
  let recommendedRisk = 1.0;

  if (probabilityPercent < 40) {
    warning = `Warning: You have historically performed poorly with this setup (${probabilityPercent}% win rate). Consider skipping or cutting risk.`;
    recommendedRisk = 0.25;
  } else if (probabilityPercent >= 60) {
    recommendedRisk = 2.0; // High conviction
  }

  // Emotion checks
  if (setup.emotion === "Anxiety" || setup.emotion === "Fear" || setup.emotion === "Greed") {
    warning = `Caution: Trading with ${setup.emotion} historically leads to emotional decisions. Reduce risk.`;
    recommendedRisk = Math.min(recommendedRisk, 0.5);
  }

  return {
    probability: probabilityPercent,
    warning,
    recommendedRisk,
  };
}

/**
 * Checks if the user should enter "Drawdown Recovery Protocol" (DRP)
 * Triggers on significant losing streak or large drawdown.
 */
export function checkDrawdownRecoveryProtocol(trades: Trade[]): {
  isActive: boolean;
  reason?: string;
  recommendedRiskLimit?: number;
  goldenSetup?: { pair: string; session: string; strategy: string };
} {
  if (trades.length < 5) return { isActive: false };

  // 1. Check Losing Streak
  const sorted = [...trades].sort((a, b) => new Date(a.date + "T" + a.time).getTime() - new Date(b.date + "T" + b.time).getTime());
  let consecutiveLosses = 0;
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (sorted[i].profitLoss < 0) {
      consecutiveLosses++;
    } else {
      break;
    }
  }

  // 2. Check current Drawdown
  const { currentDrawdown, maxDrawdown } = getDrawdownStats(trades);

  // Custom thresholds: 3 consecutive losses OR current DD is > 50% of their max historic DD (assuming max DD is significant)
  // Since we don't have account balance, we use a heuristic.
  const isHighDrawdown = currentDrawdown > 0 && maxDrawdown > 0 && (currentDrawdown >= maxDrawdown * 0.8) && currentDrawdown > 100;

  if (consecutiveLosses >= 3 || isHighDrawdown) {
    // Find Golden Setup via clustering
    const clusters = clusterTrades(trades);
    const bestCluster = clusters.length > 0 ? clusters[0] : null; // Already sorted by avgProfit desc

    let goldenSetup;
    if (bestCluster && bestCluster.trades.length > 0) {
      // Find mode of pair, session, strategy in the best cluster
      const getMode = (arr: any[]) => arr.sort((a, b) => arr.filter(v => v === a).length - arr.filter(v => v === b).length).pop();
      goldenSetup = {
        pair: getMode(bestCluster.trades.map(t => t.pair)),
        session: getMode(bestCluster.trades.map(t => t.session)),
        strategy: getMode(bestCluster.trades.map(t => t.strategy)),
      };
    }

    return {
      isActive: true,
      reason: consecutiveLosses >= 3
        ? `You are on a ${consecutiveLosses}-trade losing streak.`
        : `You are nearing your maximum historical drawdown ($${currentDrawdown.toFixed(2)}).`,
      recommendedRiskLimit: 0.25, // Recommend dropping risk to 0.25%
      goldenSetup
    };
  }

  return { isActive: false };
}

export interface GoldenPlaybook {
  strategyName: string;
  bestPair: string;
  bestSession: string;
  recommendedRR: number;
  winRate: number;
  avgProfit: number;
  rules: string[];
  psychologyNote: string;
}

/**
 * Distills the user's best performing cluster into a "Golden Playbook".
 */
export function generateGoldenPlaybook(trades: Trade[]): GoldenPlaybook | null {
  const clusters = clusterTrades(trades);
  if (clusters.length === 0) return null;

  // The best cluster is the first one (sorted by avgProfit)
  const best = clusters[0];

  const getMode = (arr: any[]) => {
    if (arr.length === 0) return "N/A";
    return arr.sort((a, b) => arr.filter(v => v === a).length - arr.filter(v => v === b).length).pop();
  };

  const strategyName = getMode(best.trades.map(t => t.strategy));
  const bestPair = getMode(best.trades.map(t => t.pair));
  const bestSession = getMode(best.trades.map(t => t.session));

  const wins = best.trades.filter(t => t.profitLoss > 0);
  const avgWin = wins.length ? wins.reduce((s, t) => s + t.profitLoss, 0) / wins.length : 0;
  const losses = best.trades.filter(t => t.profitLoss < 0);
  const avgLoss = losses.length ? Math.abs(losses.reduce((s, t) => s + t.profitLoss, 0) / losses.length) : 1;

  const recommendedRR = Math.round((avgWin / avgLoss) * 10) / 10;

  const rules = [
    `Only take trades on ${bestPair} during the ${bestSession} session.`,
    `Focus exclusively on the '${strategyName}' strategy.`,
    `Maintain a minimum Risk:Reward ratio of 1:${recommendedRR >= 1 ? recommendedRR : '1.5'}.`,
    `Always ensure 'Rules Followed' is checked before entry.`,
  ];

  // Ad-hoc psychology note based on dominant emotion in best trades
  const dominantEmotion = getMode(best.trades.filter(t => t.profitLoss > 0).map(t => t.emotionBefore || "Neutral"));

  let psychologyNote = `You perform best when you are feeling ${dominantEmotion}. Maintain this mental state before every entry.`;
  if (dominantEmotion === "Neutral") psychologyNote = "Your best trades happen when you are emotionally detached. Keep your screen time low and execute mechanically.";

  return {
    strategyName,
    bestPair,
    bestSession,
    recommendedRR,
    winRate: best.winRate,
    avgProfit: Math.round(best.avgProfit * 100) / 100,
    rules,
    psychologyNote
  };
}


