import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { PAIRS, STRATEGIES, FREE_TRADE_LIMIT, PRO_TRADE_LIMIT } from "@/lib/tradeTypes";
import { AddTradeForm } from "@/components/AddTrade/AddTradeForm";
import { TradeValue } from "@/lib/tradeTypes";
import { calculatePips, calculatePL, detectSession } from "@/lib/tradeStore";
import { useTrades } from "@/hooks/useTrades";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowUpRight, ArrowDownRight, Save, AlertTriangle, X, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { usePlan } from "@/hooks/usePlan";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function AddTrade() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const challengeIdParam = searchParams.get('challengeId');
  const { addTrade, updateTrade, trades } = useTrades();
  const { plan } = usePlan();
  const { user } = useAuth();

  const atLimit = !id && plan === "free" && trades.length >= FREE_TRADE_LIMIT;

  const [uploading, setUploading] = useState(false);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [form, setForm] = useState({
    pair: PAIRS[0],
    direction: "BUY" as "BUY" | "SELL",
    entryPrice: "",
    exitPrice: "",
    stopLoss: "",
    takeProfit: "",
    lotSize: "0.1",
    date: new Date().toISOString().split("T")[0],
    time: new Date().toTimeString().slice(0, 5),
    strategy: STRATEGIES[0],
    rulesFollowed: true,
    confidence: "3",
    emotionBefore: "Neutral",
    mistakes: "",
    notes: "",
    challengeId: "",
  });

  useEffect(() => {
    const fetchChallenges = async () => {
      if (!user) return;
      try {
        const docRef = doc(db, "traders", user.uid, "challenges", "config");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().data) {
          setChallenges(docSnap.data().data);
        }
      } catch (error) {
        console.error("Error fetching challenges:", error);
      }
    };
    fetchChallenges();
  }, [user]);

  useEffect(() => {
    const fetchChallengeTrade = async () => {
      if (!user || !challengeIdParam || !id) return;
      try {
        const docRef = doc(db, "traders", user.uid, "trade-history", "challenge_" + challengeIdParam);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const challengeTrades = docSnap.data().trades || [];
          const trade = challengeTrades.find((t: any) => t.id === id);
          if (trade) {
            setForm({
              pair: trade.pair as any,
              direction: trade.direction,
              entryPrice: trade.entryPrice.toString(),
              exitPrice: trade.exitPrice.toString(),
              stopLoss: trade.stopLoss.toString(),
              takeProfit: trade.takeProfit.toString(),
              lotSize: trade.lotSize.toString(),
              date: typeof trade.date === 'string' ? trade.date : new Date(trade.date?.seconds * 1000 || Date.now()).toISOString().split('T')[0],
              time: trade.time,
              strategy: trade.strategy as any,
              rulesFollowed: trade.rulesFollowed,
              confidence: (trade.confidence || 3).toString(),
              emotionBefore: trade.emotionBefore || "Neutral",
              mistakes: trade.mistakes ? trade.mistakes.join(", ") : "",
              notes: trade.notes,
              challengeId: trade.challengeId || "",
            });
          }
        }
      } catch (error) {
        console.error("Error fetching challenge trade", error);
      }
    };

    if (id) {
      if (challengeIdParam) {
        fetchChallengeTrade();
      } else if (trades.length > 0) {
        const trade = trades.find((t) => t.id === id);
        if (trade) {
          setForm({
            pair: trade.pair as any,
            direction: trade.direction,
            entryPrice: trade.entryPrice.toString(),
            exitPrice: trade.exitPrice.toString(),
            stopLoss: trade.stopLoss.toString(),
            takeProfit: trade.takeProfit.toString(),
            lotSize: trade.lotSize.toString(),
            date: trade.date,
            time: trade.time,
            strategy: trade.strategy as any,
            rulesFollowed: trade.rulesFollowed,
            confidence: (trade.confidence || 3).toString(),
            emotionBefore: trade.emotionBefore || "Neutral",
            mistakes: trade.mistakes ? trade.mistakes.join(", ") : "",
            notes: trade.notes,
            challengeId: trade.challengeId || "",
          });
        }
      }
    } else if (challengeIdParam) {
      // For a NEW trade with a challenge context
      setForm(f => ({ ...f, challengeId: challengeIdParam }));
    }
  }, [id, trades, challengeIdParam, user, challenges.length]);

  const update = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));



  const onAddTradeSubmit = async (data: TradeValue) => {
    if (atLimit) {
      const limit = plan === "free" ? FREE_TRADE_LIMIT : PRO_TRADE_LIMIT;
      toast.error(`Trade limit reached (${limit}). Upgrade your plan.`);
      return;
    }

    const pips = calculatePips(data.pair, data.entryPrice, data.exitPrice, data.direction);
    const profitLoss = calculatePL(pips, data.lotSize, data.pair, data.entryPrice, data.exitPrice);
    const session = detectSession(data.time);

    const tradeData = {
      ...data,
      profitLoss,
      pips,
      session,
    };

    try {
      setUploading(true);
      if (id) {
        await updateTrade(id, tradeData as any, challengeIdParam || undefined);
        navigate(tradeData.challengeId ? "/challenges" : "/trade-history");
      } else {
        await addTrade(tradeData as any);
        toast.success("Trade added successfully!");
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Failed to save trade.");
    } finally {
      setUploading(false);
    }
  };

  const handleSeed = async () => {
    if (atLimit) {
      toast.error("Limit reached. Seed aborted.");
      return;
    }

    setUploading(true);
    const seedTrades = [
      { pair: "XAU/USD", direction: "BUY", entryPrice: 2050.5, exitPrice: 2065.0, stopLoss: 2040, takeProfit: 2080, lotSize: 0.1, strategy: "Breakout", session: "London", emotionBefore: "Confidence", rulesFollowed: true, date: "2024-03-01", time: "10:00" },
      { pair: "EUR/USD", direction: "SELL", entryPrice: 1.0850, exitPrice: 1.0820, stopLoss: 1.0880, takeProfit: 1.0750, lotSize: 0.5, strategy: "Trend Following", session: "New York", emotionBefore: "Neutral", rulesFollowed: true, date: "2024-03-02", time: "14:30" },
      { pair: "BTC/USD", direction: "BUY", entryPrice: 65000, exitPrice: 67000, stopLoss: 63000, takeProfit: 70000, lotSize: 0.01, strategy: "Scalping", session: "Asian", emotionBefore: "Excitement", rulesFollowed: true, date: "2024-03-03", time: "05:00" },
      { pair: "XAU/USD", direction: "SELL", entryPrice: 2100, exitPrice: 2110, stopLoss: 2090, takeProfit: 2050, lotSize: 0.1, strategy: "Breakout", session: "London", emotionBefore: "Fear", rulesFollowed: false, date: "2024-03-04", time: "11:00" }, // Loss
      { pair: "XAU/USD", direction: "BUY", entryPrice: 2110, exitPrice: 2090, stopLoss: 2115, takeProfit: 2150, lotSize: 0.25, strategy: "Breakout", session: "London", emotionBefore: "Greed", rulesFollowed: false, date: "2024-03-04", time: "11:30" }, // Revenge Loss
      { pair: "EUR/USD", direction: "BUY", entryPrice: 1.0900, exitPrice: 1.0950, stopLoss: 1.0850, takeProfit: 1.1000, lotSize: 0.1, strategy: "Trend Following", session: "London", emotionBefore: "Confidence", rulesFollowed: true, date: "2024-03-05", time: "09:00" },
      { pair: "BTC/USD", direction: "SELL", entryPrice: 68000, exitPrice: 67500, stopLoss: 69000, takeProfit: 65000, lotSize: 0.05, strategy: "Scalping", session: "New York", emotionBefore: "Neutral", rulesFollowed: true, date: "2024-03-06", time: "16:00" },
      { pair: "XAU/USD", direction: "BUY", entryPrice: 2080, exitPrice: 2100, stopLoss: 2070, takeProfit: 2120, lotSize: 0.1, strategy: "Breakout", session: "London", emotionBefore: "Confidence", rulesFollowed: true, date: "2024-03-07", time: "10:15" },
      { pair: "EUR/USD", direction: "SELL", entryPrice: 1.0920, exitPrice: 1.0940, stopLoss: 1.0900, takeProfit: 1.0850, lotSize: 0.1, strategy: "Trend Following", session: "London", emotionBefore: "Fear", rulesFollowed: true, date: "2024-03-08", time: "10:30" },
      { pair: "BTC/USD", direction: "BUY", entryPrice: 66000, exitPrice: 65000, stopLoss: 65500, takeProfit: 68000, lotSize: 0.1, strategy: "Scalping", session: "New York", emotionBefore: "Anxiety", rulesFollowed: false, date: "2024-03-09", time: "15:00" },
      { pair: "BTC/USD", direction: "BUY", entryPrice: 65000, exitPrice: 63000, stopLoss: 64500, takeProfit: 68000, lotSize: 0.3, strategy: "Scalping", session: "New York", emotionBefore: "Fear", rulesFollowed: false, date: "2024-03-09", time: "15:30" }, // Revenge
      { pair: "XAU/USD", direction: "BUY", entryPrice: 2120, exitPrice: 2140, stopLoss: 2100, takeProfit: 2160, lotSize: 0.1, strategy: "Breakout", session: "London", emotionBefore: "Confidence", rulesFollowed: true, date: "2024-03-10", time: "09:45" },
      { pair: "EUR/USD", direction: "BUY", entryPrice: 1.0950, exitPrice: 1.0980, stopLoss: 1.0920, takeProfit: 1.1050, lotSize: 0.2, strategy: "Trend Following", session: "London", emotionBefore: "Confidence", rulesFollowed: true, date: "2024-03-11", time: "10:00" },
      { pair: "BTC/USD", direction: "SELL", entryPrice: 72000, exitPrice: 71000, stopLoss: 73000, takeProfit: 68000, lotSize: 0.05, strategy: "Scalping", session: "Asian", emotionBefore: "Neutral", rulesFollowed: true, date: "2024-03-12", time: "04:00" },
      { pair: "XAU/USD", direction: "SELL", entryPrice: 2150, exitPrice: 2140, stopLoss: 2160, takeProfit: 2120, lotSize: 0.1, strategy: "Breakout", session: "New York", emotionBefore: "Confidence", rulesFollowed: true, date: "2024-03-13", time: "14:00" },
      { pair: "EUR/USD", direction: "SELL", entryPrice: 1.1000, exitPrice: 1.0970, stopLoss: 1.1030, takeProfit: 1.0900, lotSize: 0.1, strategy: "Trend Following", session: "London", emotionBefore: "Neutral", rulesFollowed: true, date: "2024-03-14", time: "09:30" },
      { pair: "BTC/USD", direction: "BUY", entryPrice: 70000, exitPrice: 72500, stopLoss: 69000, takeProfit: 75000, lotSize: 0.02, strategy: "Scalping", session: "London", emotionBefore: "Confidence", rulesFollowed: true, date: "2024-03-15", time: "11:00" },
      { pair: "XAU/USD", direction: "BUY", entryPrice: 2130, exitPrice: 2150, stopLoss: 2110, takeProfit: 2170, lotSize: 0.1, strategy: "Trend Following", session: "Asian", emotionBefore: "Confidence", rulesFollowed: true, date: "2024-03-16", time: "06:00" },
      { pair: "EUR/USD", direction: "BUY", entryPrice: 1.0980, exitPrice: 1.1020, stopLoss: 1.0940, takeProfit: 1.1100, lotSize: 0.1, strategy: "Breakout", session: "New York", emotionBefore: "Excitement", rulesFollowed: true, date: "2024-03-17", time: "15:00" },
      { pair: "BTC/USD", direction: "SELL", entryPrice: 73000, exitPrice: 72000, stopLoss: 74000, takeProfit: 70000, lotSize: 0.05, strategy: "Trend Following", session: "London", emotionBefore: "Neutral", rulesFollowed: true, date: "2024-03-18", time: "10:00" },
    ];

    try {
      for (const t of seedTrades) {
        const pips = calculatePips(t.pair, t.entryPrice, t.exitPrice, t.direction as any);
        const profitLoss = calculatePL(pips, t.lotSize, t.pair, t.entryPrice, t.exitPrice);

        await addTrade({
          ...t,
          direction: t.direction as any,
          profitLoss,
          pips,
          session: t.session as any,
          notes: "Auto-seeded trade for AI Coach evaluation.",
          confidence: 4,
          mistakes: t.rulesFollowed ? [] : ["Revenge Trade", "Poor Risk Management"]
        });
      }
      toast.success("Successfully seeded 20 trades!");
      navigate("/ai-coach");
    } catch (e) {
      toast.error("Seeding failed");
    } finally {
      setUploading(false);
    }
  };

  const inputClass = "glass-input w-full px-4 py-3 text-sm rounded-xl font-medium";
  const labelClass = "text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block";

  return (
    <div className="max-w-3xl mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <motion.h1
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-2xl font-bold text-foreground"
        >
          {id ? "Edit Trade" : "Add Trade"}
        </motion.h1>

        {!id && (
          <button
            type="button"
            onClick={handleSeed}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-primary"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Seed 20 Trades
          </button>
        )}
      </div>

      {atLimit && (
        <GlassCard className="mb-6 border-warning/30 bg-warning/5">
          <div className="flex items-center gap-3 text-warning">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">
              Free plan limit reached ({FREE_TRADE_LIMIT} trades). Upgrade to Pro for Unlimited Trades.
            </p>
          </div>
        </GlassCard>
      )}

      <AddTradeForm 
        onSubmit={onAddTradeSubmit} 
        loading={uploading} 
        atLimit={atLimit} 
        initialData={form as any}
      />
    </div>
  );
}
