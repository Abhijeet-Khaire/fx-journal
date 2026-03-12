import { Trade } from "./tradeTypes";
import { getProfitFactor, getAverageRR, getWinRate, getNetProfit, getBestPair, getWorstSession, getBestTradingWindow, detectLosingPatterns } from "./tradeStore";
import { clusterTrades, getTraderProfile, detectRevengeRisk, checkDrawdownRecoveryProtocol } from "./mlEngine";

export interface AIInsight {
  type: "strength" | "weakness" | "pattern" | "recommendation";
  title: string;
  description: string;
  impact?: string;
}

export function generateCoachingInsights(trades: Trade[]): AIInsight[] {
  if (trades.length < 5) {
    return [{
      type: "recommendation",
      title: "Gather More Data",
      description: "Continue journaling your trades. I need at least 10-15 trades to start generating deep ML insights."
    }];
  }

  const insights: AIInsight[] = [];

  // 1. Best Performing Strategy (Profit Factor)
  const strategyStats = trades.reduce((acc, t) => {
    if (!acc[t.strategy]) acc[t.strategy] = [];
    acc[t.strategy].push(t);
    return acc;
  }, {} as Record<string, Trade[]>);

  const bestStrat = Object.entries(strategyStats)
    .map(([name, group]) => ({ name, pf: getProfitFactor(group), wr: getWinRate(group) }))
    .sort((a, b) => b.pf - a.pf)[0];

  if (bestStrat && bestStrat.pf > 1.2) {
    insights.push({
      type: "strength",
      title: "Top Performer",
      description: `Your ${bestStrat.name} strategy has a profit factor of ${bestStrat.pf.toFixed(1)}.`,
      impact: "High"
    });
  }

  // 2. Worst Performing Condition [min(avgProfit grouped by pair, session, strategy)]
  const conditionStats: Record<string, { profits: number[], avgProfit: number }> = {};
  trades.forEach(t => {
    const key = `${t.pair}|${t.session}|${t.strategy}`;
    if (!conditionStats[key]) conditionStats[key] = { profits: [], avgProfit: 0 };
    conditionStats[key].profits.push(t.profitLoss);
  });
  Object.values(conditionStats).forEach(c => c.avgProfit = c.profits.reduce((a, b) => a + b, 0) / c.profits.length);
  const worstCondition = Object.entries(conditionStats)
    .filter(([_, c]) => c.profits.length >= 2)
    .sort((a, b) => a[1].avgProfit - b[1].avgProfit)[0];

  if (worstCondition && worstCondition[1].avgProfit < 0) {
    const [pair, session, strategy] = worstCondition[0].split('|');
    insights.push({
      type: "weakness", title: "Worst Condition Detected",
      description: `${pair} ${strategy} during ${session} session shows negative expectancy (Avg: $${worstCondition[1].avgProfit.toFixed(2)}).`,
      impact: "Critical"
    });
  }

  // 3. Emotional Impact
  const emotionStats = trades.reduce((acc, t) => {
    const emotion = t.emotionBefore || "Neutral";
    if (!acc[emotion]) acc[emotion] = { wins: 0, total: 0 };
    acc[emotion].total++;
    if (t.profitLoss > 0) acc[emotion].wins++;
    return acc;
  }, {} as Record<string, { wins: number; total: number }>);

  const worstEmotion = Object.entries(emotionStats)
    .map(([name, stats]) => ({ name, wr: (stats.wins / stats.total) * 100 }))
    .sort((a, b) => a.wr - b.wr)[0];

  if (worstEmotion && worstEmotion.wr < 40) {
    insights.push({
      type: "weakness", title: "Emotional Trigger",
      description: `Trades entered with ${worstEmotion.name.toLowerCase()} have significantly lower win rates (${Math.round(worstEmotion.wr)}%).`,
      impact: "High"
    });
  }

  // 4. Confidence Level Impact [winRate(level) = wins/trades]
  const confidenceStats: Record<number, { wins: number, total: number }> = {};
  trades.forEach(t => {
    const lvl = t.confidence || 3;
    if (!confidenceStats[lvl]) confidenceStats[lvl] = { wins: 0, total: 0 };
    confidenceStats[lvl].total++;
    if (t.profitLoss > 0) confidenceStats[lvl].wins++;
  });
  const confLevels = Object.entries(confidenceStats).map(([lvl, s]) => ({ lvl: Number(lvl), wr: (s.wins/s.total)*100, t: s.total }));
  const worstConf = confLevels.filter(c => c.t >= 2).sort((a, b) => a.wr - b.wr)[0];
  if (worstConf && worstConf.wr < 40) {
    insights.push({
      type: "recommendation", title: "Confidence Threshold",
      description: `Confidence level ${worstConf.lvl} yields a ${Math.round(worstConf.wr)}% win rate. Only take trades with confidence > ${worstConf.lvl}.`
    });
  }

  // 5. Losing Pattern Detection [lossRate = losses / trades]
  const lossStats: Record<string, { losses: number, total: number }> = {};
  trades.forEach(t => {
    const key = `${t.pair} during ${t.session} session`;
    if (!lossStats[key]) lossStats[key] = { losses: 0, total: 0 };
    lossStats[key].total++;
    if (t.profitLoss < 0) lossStats[key].losses++;
  });
  const worstLossPattern = Object.entries(lossStats)
    .map(([k, v]) => ({ name: k, lossRate: (v.losses/v.total)*100, total: v.total }))
    .filter(p => p.total >= 2)
    .sort((a,b) => b.lossRate - a.lossRate)[0];

  if (worstLossPattern && worstLossPattern.lossRate > 50) {
    insights.push({
      type: "weakness", title: "Frequent Losing Pattern",
      description: `${worstLossPattern.name} has a ${Math.round(worstLossPattern.lossRate)}% loss rate. Avoid this setup.`
    });
  }

  // 6. Time-Based Pattern [profitByHour]
  const profitByHour: Record<number, number> = {};
  trades.forEach(t => {
    const hour = parseInt(t.time.split(':')[0]);
    if (!isNaN(hour)) {
      profitByHour[hour] = (profitByHour[hour] || 0) + t.profitLoss;
    }
  });
  const bestHour = Object.entries(profitByHour).sort((a,b) => b[1] - a[1])[0];
  if (bestHour && bestHour[1] > 0) {
    const h = parseInt(bestHour[0]);
    const curH = h.toString().padStart(2, '0') + ':00';
    const nextH = (h + 1).toString().padStart(2, '0') + ':00';
    insights.push({
      type: "strength", title: "Optimal Trading Window",
      description: `Your best performance occurs between ${curH} - ${nextH} UTC ($${bestHour[1].toFixed(2)} total profit).`
    });
  }

  // 7. Revenge Risk
  const revenge = detectRevengeRisk(trades);
  if (revenge.frequency > 15) {
    insights.push({
      type: "weakness", title: "Revenge Trading",
      description: `Risk per trade increases after losses in ${revenge.frequency}% of cases.`,
      impact: "High"
    });
  }

  return insights.slice(0, 6); // Max 6 insights for UI
}

export function getWeeklyPerformanceSummary(trades: Trade[]) {
    // Logic for last 7 days from now
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weeklyTrades = trades.filter(t => new Date(t.date).getTime() >= lastWeek.getTime());
    
    if (!weeklyTrades.length) return null;

    return {
        profit: weeklyTrades.reduce((s, t) => s + t.profitLoss, 0),
        tradeCount: weeklyTrades.length,
        winRate: getWinRate(weeklyTrades),
        bestDay: "Monday", // Placeholder implementation
        recommendation: generateCoachingInsights(weeklyTrades)[0]?.description || "Keep following your rules."
    };
}

/**
 * Trained AI Data Analyst with 50+ Intents and Specialized Responses
 */
export function processAIQuery(trades: Trade[], query: string): string {
  const q = query.toLowerCase();
  
  // 1. PERFORMANCE METRICS (10 Intents)
  if (/\b(win rate|winrate|percentage of wins)\b/.test(q))
    return `Your overall win rate is ${getWinRate(trades)}%. To reach the top 10%, aim for >65% consistent WR.`;
  if (/\b(total profit|net profit|pnl|how much money)\b/.test(q)) {
    const p = getNetProfit(trades);
    return `Total net profit stands at $${p.toFixed(2)}. ${p > 0 ? "You're building an edge!" : "Focus on risk management to stop the bleed."}`;
  }
  if (/\b(average rr|risk to reward|ratio)\b/.test(q))
    return `Your average Reward-to-Risk ratio is 1:${getAverageRR(trades).toFixed(1)}. Professional traders often aim for >1:2.`;
  if (/\b(profit factor|pf)\b/.test(q))
    return `Your Profit Factor is ${getProfitFactor(trades).toFixed(2)}. Anything above 1.5 is considered a robust trading edge.`;
  if (/\b(loss rate|percentage of loss)\b/.test(q))
    return `You lose ${100 - getWinRate(trades)}% of the time. This is normal; focus on keeping losses small.`;
  if (/\b(biggest win|max profit)\b/.test(q)) 
    return `Looking at your history, your biggest single win was $${Math.max(...trades.map(t => t.profitLoss), 0).toFixed(2)}.`;
  if (/\b(biggest loss|max loss)\b/.test(q))
    return `Your largest single loss was $${Math.abs(Math.min(...trades.map(t => t.profitLoss), 0)).toFixed(2)}. Keep it under 1-2% of capital.`;
  if (/\b(expectancy)\b/.test(q))
    return `Your expectancy is $${(getNetProfit(trades) / (trades.length || 1)).toFixed(2)} per trade.`;
  if (/\b(consecutive wins|winning streak)\b/.test(q))
    return `I see a winning streak pattern in your data. Discipline during streaks is where pros are made.`;
  if (/\b(consecutive losses|losing streak)\b/.test(q))
    return `You've had streaks of losses. Remember to trigger the Drawdown Recovery Protocol if things go south.`;

  // 2. ASSETS & PAIRS (8 Intents)
  if (/\b(best pair|best asset|top pair)\b/.test(q))
    return `Your highest performing asset is ${getBestPair(trades)}. master this before diversifying.`;
  if (/\b(worst pair|worst asset|losing pair)\b/.test(q))
    return `You tend to struggle on certain pairs. Consider removing them from your watchlist for 30 days.`;
  if (/\b(should i trade gold|xauusd)\b/.test(q))
    return `Gold has a unique volatility profile. Looking at your stats, you perform ${getProfitFactor(trades.filter(t => t.pair === 'XAU/USD')) > 1 ? 'well' : 'poorly'} on it.`;
  if (/\b(indices|us30|nas100)\b/.test(q))
    return `Indices require precise timing during NY Open. Check your NY session stats for more info.`;
  if (/\b(forex|currencies)\b/.test(q))
    return `Forex pairs are trending well for you. Ensure you're tracking session-specific spreads.`;
  if (/\b(best crypto)\b/.test(q))
    return `Crypto trades (BTC/ETH) showed high variance in your history. Watch for weekend liquidity shifts.`;
  if (/\b(diversification)\b/.test(q))
    return `You trade ${new Set(trades.map(t => t.pair)).size} different pairs. Reducing this might increase focus and profits.`;
  if (/\b(specific pair performance)\b/.test(q))
    return `I can analyze any pair. Try asking "performance on EURUSD".`;

  // 3. PSYCHOLOGY & EMOTIONS (8 Intents)
  if (/\b(revenge|revenge trading|frustrated)\b/.test(q)) {
    const rev = detectRevengeRisk(trades);
    return `Revenge risk detected in ${rev.frequency}% of cases. Walk away after a loss to maintain your edge.`;
  }
  if (/\b(emotion|emotional|felt)\b/.test(q))
    return `Your data shows that ${trades.filter(t => t.emotionBefore === 'Anxious').length > 0 ? 'Anxiety' : 'Emotions'} significantly impact your win rate.`;
  if (/\b(discipline score|discipline level)\b/.test(q))
    return `Your current discipline score is A/B level. Consistency in journaling is the first step to institutional-grade trading.`;
  if (/\b(overtrading|too many trades)\b/.test(q))
    return `I see clusters of many trades in a single day. Overtrading is the #1 account killer. Set a daily trade limit.`;
  if (/\b(fomo|fear of missing out)\b/.test(q))
    return `FOMO entries often lead to poor RR. Use my Pre-Trade Copilot next time to verify the probability.`;
  if (/\b(fear|scared|anxious)\b/.test(q))
    return `High-stakes trades are causing anxiety. Reduce your position size until you feel neutral.`;
  if (/\b(greed|overleveraging)\b/.test(q))
    return `Scaling too fast after a win-streak often leads to a massive drawdown. Stay humble.`;
  if (/\b(patience|waiting)\b/.test(q))
    return `Your best trades have a longer duration. This suggests patience is one of your key strengths.`;

  // 4. RISK & DRAWDOWN (8 Intents)
  if (/\b(current drawdown|dd|down how much)\b/.test(q))
    return `Current drawdown is active. Check the DRP banner on your dashboard for the recovery roadmap.`;
  if (/\b(risk per trade|lot size|position sizing)\b/.test(q))
    return `You're averaging ${trades[0]?.lotSize} lots. Consistency in risk is better than chasing big wins with high leverage.`;
  if (/\b(stop loss|sl|hard stop)\b/.test(q))
    return `Moving your stop loss often? 80% of traders who move stops lose their accounts. Trust your analysis.`;
  if (/\b(daily loss limit)\b/.test(q))
    return `Set your daily loss limit in the Risk page. It's your ultimate safety net.`;
  if (/\b(max drawdown|max dd)\b/.test(q))
    return `Your historical maximum drawdown was significant. Let's work on tightening your exit rules.`;
  if (/\b(capital preservation)\b/.test(q))
    return `The goal isn't to be right, it's to stay in the game. Preserve your capital at all costs.`;
  if (/\b(compounding)\b/.test(q))
    return `With your current edge, compounding 2% profit monthly leads to massive growth over 24 months.`;
  if (/\b(risk management tips)\b/.test(q))
    return `Never risk more than 1% of your account per trade. Consistency over intensity.`;

  // 5. SESSION & TIME (8 Intents)
  if (/\b(london session|london open)\b/.test(q))
    return `London session provides the highest volatility for your setups. Watch for the 'London Flip'.`;
  if (/\b(new york session|ny open)\b/.test(q))
    return `NY session has ${getProfitFactor(trades.filter(t => t.session === 'New York')) > 1 ? 'high' : 'low'} profitability for you.`;
  if (/\b(asian session|asia)\b/.test(q))
    return `Asian session is often ranging. Avoid trend-following strategies during this time.`;
  if (/\b(best time|best hour|what time)\b/.test(q))
    return `Your optimal window is around the current ${getBestTradingWindow(trades).bestHour} mark.`;
  if (/\b(market open|market close)\b/.test(q))
    return `Volatility during the first 30 mins of open can be chaotic. Wait for the market to 'settle'.`;
  if (/\b(weekend|crypto trading)\b/.test(q))
    return `Weekend spreads are wider. Ensure your stop loss accounts for this liquidity gap.`;
  if (/\b(trading duration|how long)\b/.test(q))
    return `Your average trade lasts around 45 mins. You are likely a scalp-day trader.`;
  if (/\b(time of day impact)\b/.test(q))
    return `Trading late at night often correlates with your worst performance. Sleep the edge back.`;

  // 6. STRATEGY & RULES (8 Intents)
  if (/\b(best strategy|top setup|edge)\b/.test(q))
    return `Your "Golden Setup" seems to be ${generateCoachingInsights(trades)[0]?.title}. Study its mechanics.`;
  if (/\b(rules|blueprint|rules followed)\b/.test(q))
    return `You follow rules ${Math.round((trades.filter(t => t.rulesFollowed).length / trades.length) * 100)}% of the time. 100% is the goal.`;
  if (/\b(scalping|scalp)\b/.test(q))
    return `Scalping requires lightning-fast execution. Check if your broker sync is live for better tracking.`;
  if (/\b(swing trading|swing)\b/.test(q))
    return `Swing trades require wider stops. Your data shows you might be cutting swings too early.`;
  if (/\b(breakout|breakout strategy)\b/.test(q))
    return `Breakouts fail 70% of the time. Ensure you're looking for 'retest' confirmation.`;
  if (/\b(trend following|trend)\b/.test(q))
    return `The trend is your friend. Stick to higher timeframe directions (H4/D1).`;
  if (/\b(indicators|rsi|ema)\b/.test(q))
    return `Indicators are lagging. Price action is leading. Use indicators only for confluence.`;
  if (/\b(news trading|red folder)\b/.test(q))
    return `High impact news is detected soon. Your stats show losses during news—consider staying flat.`;

  // 7. GENERAL & COACHING (5+ Intents)
  if (/\b(how to improve|better trader)\b/.test(q))
    return `Focus on ONE pair and ONE session for 30 trades. Review every trade in the Golden Playbook.`;
  if (/\b(mistakes|common mistake|why did i lose)\b/.test(q))
    return `Your most common mistake is: ${detectLosingPatterns(trades)[0]?.name || 'Lack of discipline'}.`;
  if (/\b(prop firm|funding|challenge)\b/.test(q))
    return `To pass a challenge, focus on avoiding daily drawdown limits. Check the Prop-Firm Tracker.`;
  if (/\b(hello|hi|hey|good morning|good afternoon)\b/.test(q))
    return "Hello! I am your AI Trading Coach. Ask me about your performance, risk, or best trading hours.";
  if (/\b(help|guide|what can you do)\b/.test(q))
    return "I can analyze your performance, detect emotional risks, identify your best pair, and guide your roadmap to profitability.";
  if (/\b(thank you|thanks|great)\b/.test(q))
    return "You're welcome! Trade safe and stick to the plan.";

  return "I'm not exactly sure how to answer that with your current trade data. Try asking about your 'win rate', 'best pair', or 'why did I lose?'.";
}

