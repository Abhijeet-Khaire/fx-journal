import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { PAIRS, STRATEGIES, FREE_TRADE_LIMIT, PRO_TRADE_LIMIT } from "@/lib/tradeTypes";
import {
  calculatePips,
  calculatePL,
  detectSession,
} from "@/lib/tradeStore";
import { useTrades } from "@/hooks/useTrades";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowUpRight, ArrowDownRight, Save, AlertTriangle, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { usePlan } from "@/hooks/usePlan";

export default function AddTrade() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { addTrade, updateTrade, trades } = useTrades();
  const { plan } = usePlan();

  const atLimit = !id && plan === "free" && trades.length >= FREE_TRADE_LIMIT;

  const [uploading, setUploading] = useState(false);
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
  });

  useEffect(() => {
    if (id && trades.length > 0) {
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
        });
      }
    }
  }, [id, trades]);

  const update = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (atLimit) {
      const limit = plan === "free" ? FREE_TRADE_LIMIT : PRO_TRADE_LIMIT;
      toast.error(`Trade limit reached (${limit}). Upgrade your plan.`);
      return;
    }

    if (uploading) {
      toast.error("Please wait for upload to finish");
      return;
    }

    const entry = parseFloat(form.entryPrice);
    const exit = parseFloat(form.exitPrice);

    if (isNaN(entry) || isNaN(exit)) {
      toast.error("Please enter valid numeric prices");
      return;
    }

    const pips = calculatePips(form.pair, entry, exit, form.direction);
    const profitLoss = calculatePL(pips, parseFloat(form.lotSize), form.pair, entry, exit);
    const session = detectSession(form.time);

    const tradeData = {
      pair: form.pair,
      direction: form.direction,
      entryPrice: entry,
      exitPrice: exit,
      stopLoss: parseFloat(form.stopLoss) || 0,
      takeProfit: parseFloat(form.takeProfit) || 0,
      lotSize: parseFloat(form.lotSize) || 0.01,
      profitLoss: isNaN(profitLoss) ? 0 : profitLoss,
      pips: isNaN(pips) ? 0 : pips,
      date: form.date,
      time: form.time,
      session,
      strategy: form.strategy,
      rulesFollowed: form.rulesFollowed,
      confidence: parseInt(form.confidence) || 3,
      emotionBefore: form.emotionBefore,
      mistakes: form.mistakes ? form.mistakes.split(",").map(s => s.trim()).filter(Boolean) : [],
      notes: form.notes,
    };

    try {
      if (id) {
        await updateTrade(id, tradeData);
      } else {
        await addTrade(tradeData);
      }
      navigate("/history");
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Failed to save trade.");
    }
  };

  const inputClass = "glass-input w-full px-4 py-3 text-sm rounded-lg";
  const labelClass = "text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block";

  return (
    <div className="max-w-3xl mx-auto py-6">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold text-foreground mb-6 hidden lg:block"
      >
        {id ? "Edit Trade" : "Add Trade"}
      </motion.h1>

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

      <form onSubmit={handleSubmit}>
        <GlassCard hover={false} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Currency Pair</label>
              <select value={form.pair} onChange={(e) => update("pair", e.target.value)} className={inputClass}>
                {PAIRS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Direction</label>
              <div className="flex gap-2">
                {(["BUY", "SELL"] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => update("direction", d)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200
                      ${form.direction === d
                        ? d === "BUY"
                          ? "bg-profit/15 text-profit border border-profit/30"
                          : "bg-loss/15 text-loss border border-loss/30"
                        : "glass-input border border-transparent"
                      }`}
                  >
                    {d === "BUY" ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { key: "entryPrice", label: "Entry Price" },
              { key: "exitPrice", label: "Exit Price" },
              { key: "stopLoss", label: "Stop Loss" },
              { key: "takeProfit", label: "Take Profit" },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className={labelClass}>{label}</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={(form as any)[key]}
                  onChange={(e) => update(key, e.target.value)}
                  className={inputClass}
                  placeholder="0.0000"
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Lot Size</label>
              <input
                type="number"
                step="0.01"
                required
                value={form.lotSize}
                onChange={(e) => update("lotSize", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => update("date", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Time</label>
              <input
                type="time"
                value={form.time}
                onChange={(e) => update("time", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Strategy</label>
              <select value={form.strategy} onChange={(e) => update("strategy", e.target.value)} className={inputClass}>
                {STRATEGIES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Rules Followed</label>
              <div className="flex gap-2">
                {[true, false].map((val) => (
                  <button
                    key={String(val)}
                    type="button"
                    onClick={() => update("rulesFollowed", val)}
                    className={`flex-1 px-4 py-3 rounded-lg text-sm font-semibold transition-all
                      ${form.rulesFollowed === val
                        ? val
                          ? "bg-profit/15 text-profit border border-profit/30"
                          : "bg-loss/15 text-loss border border-loss/30"
                        : "glass-input border border-transparent"
                      }`}
                  >
                    {val ? "Yes" : "No"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Confidence (1-5)</label>
              <select value={form.confidence} onChange={(e) => update("confidence", e.target.value)} className={inputClass}>
                {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Emotion Before</label>
              <select value={form.emotionBefore} onChange={(e) => update("emotionBefore", e.target.value)} className={inputClass}>
                {["Neutral", "Greed", "Fear", "Confidence", "Excitement", "Anxiety"].map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Mistakes</label>
              <input
                type="text"
                value={form.mistakes}
                onChange={(e) => update("mistakes", e.target.value)}
                className={inputClass}
                placeholder="FOMO, Early Exit..."
              />
            </div>
          </div>



          <div>
            <label className={labelClass}>Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              rows={4}
              className={`${inputClass} resize-none`}
              placeholder="Analysis, feelings, or key takeaways..."
            />
          </div>

          <button
            type="submit"
            disabled={atLimit || uploading}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-sm
              bg-primary text-primary-foreground hover:brightness-110 shadow-lg shadow-primary/20 
              hover:scale-[1.01] active:scale-[0.99] transition-all duration-200
              disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {id ? "Update Trade Record" : "Save Trade Record"}
          </button>
        </GlassCard>
      </form>
    </div>
  );
}
