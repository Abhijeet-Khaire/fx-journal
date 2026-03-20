import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TradeSchema, TradeValue, PAIRS, STRATEGIES } from "@/lib/tradeTypes";
import { GlassCard } from "@/components/GlassCard";
import { ArrowUpRight, ArrowDownRight, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AddTradeFormProps {
  initialData?: Partial<TradeValue>;
  onSubmit: (data: TradeValue) => Promise<void>;
  loading?: boolean;
  atLimit?: boolean;
  challenges?: any[];
}

export function AddTradeForm({ initialData, onSubmit, loading, atLimit, challenges }: AddTradeFormProps) {
  const [mistakesInput, setMistakesInput] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<TradeValue>({
    resolver: zodResolver(TradeSchema),
    defaultValues: {
      pair: initialData?.pair || PAIRS[0],
      direction: initialData?.direction || "BUY",
      entryPrice: initialData?.entryPrice || 0,
      exitPrice: initialData?.exitPrice || 0,
      stopLoss: initialData?.stopLoss || 0,
      takeProfit: initialData?.takeProfit || 0,
      lotSize: initialData?.lotSize || 0.1,
      date: initialData?.date || new Date().toISOString().split("T")[0],
      time: initialData?.time || new Date().toTimeString().slice(0, 5),
      strategy: initialData?.strategy || STRATEGIES[0],
      rulesFollowed: initialData?.rulesFollowed ?? true,
      confidence: initialData?.confidence || 3,
      emotionBefore: initialData?.emotionBefore || "Neutral",
      mistakes: initialData?.mistakes || [],
      notes: initialData?.notes || "",
      challengeId: initialData?.challengeId || "",
    },
  });

  // Re-initialize form when initialData changes (important for async loading in edit mode)
  React.useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      reset(initialData);
      if (initialData.mistakes) {
        setMistakesInput(initialData.mistakes.join(", "));
      }
    }
  }, [initialData, reset]);

  // Effect to show validation errors to the user
  React.useEffect(() => {
    const errorKeys = Object.keys(errors);
    if (errorKeys.length > 0) {
      const firstError = (errors as any)[errorKeys[0]].message;
      toast.error(`Form validation failed: ${firstError || "Please check all fields"}`);
      console.log("Form Validation Errors:", errors);
    }
  }, [errors]);

  const direction = watch("direction");
  const rulesFollowed = watch("rulesFollowed");

  const inputClass = "glass-input w-full px-4 py-3 text-sm rounded-xl font-medium";
  const labelClass = "text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block";
  const errorClass = "text-[10px] text-loss font-bold mt-1";

  const onFormSubmit = async (data: TradeValue) => {
    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)}>
      <GlassCard hover={false} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Currency Pair</label>
            <select {...register("pair")} className={`${inputClass} appearance-none cursor-pointer`}>
              {PAIRS.map((p) => <option key={p} value={p} className="bg-[hsl(220,20%,8%)] text-white">{p}</option>)}
            </select>
            {errors.pair && <p className={errorClass}>{errors.pair.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Target Journal / Challenge</label>
            <select {...register("challengeId")} className={`${inputClass} appearance-none cursor-pointer border-amber-400/20`}>
              <option value="" className="bg-[hsl(220,20%,8%)] text-white">Main Trade Journal</option>
              {challenges?.map((c) => (
                <option key={c.id} value={c.id} className="bg-[hsl(220,20%,8%)] text-white">
                  {c.name} ({c.firmName})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Direction</label>
            <div className="flex gap-2">
              {(["BUY", "SELL"] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setValue("direction", d)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200
                    ${direction === d
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
                {...register(key as any, { valueAsNumber: true })}
                className={inputClass}
                placeholder="0.0000"
              />
              {(errors as any)[key] && <p className={errorClass}>{(errors as any)[key].message}</p>}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Lot Size</label>
            <input
              type="number"
              step="0.01"
              {...register("lotSize", { valueAsNumber: true })}
              className={inputClass}
            />
            {errors.lotSize && <p className={errorClass}>{errors.lotSize.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Date</label>
            <input type="date" {...register("date")} className={inputClass} />
            {errors.date && <p className={errorClass}>{errors.date.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Time</label>
            <input type="time" {...register("time")} className={inputClass} />
            {errors.time && <p className={errorClass}>{errors.time.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Strategy</label>
            <select {...register("strategy")} className={`${inputClass} appearance-none cursor-pointer`}>
              {STRATEGIES.map((s) => <option key={s} value={s} className="bg-[hsl(220,20%,8%)] text-white">{s}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Rules Followed</label>
            <div className="flex gap-2">
              {[true, false].map((val) => (
                <button
                  key={String(val)}
                  type="button"
                  onClick={() => setValue("rulesFollowed", val)}
                  className={`flex-1 px-4 py-3 rounded-lg text-sm font-semibold transition-all
                    ${rulesFollowed === val
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
          <div>
            <label className={labelClass}>Confidence (1-5)</label>
            <select {...register("confidence", { valueAsNumber: true })} className={`${inputClass} appearance-none cursor-pointer`}>
              {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n} className="bg-[hsl(220,20%,8%)] text-white">{n}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>Trade Mistakes (Comma separated)</label>
          <input
            type="text"
            placeholder="e.g. Revenge Trading, Poor Risk, FOMO"
            value={mistakesInput}
            onChange={(e) => {
              const str = e.target.value;
              setMistakesInput(str);
              const val = str.split(",").map(m => m.trim()).filter(Boolean);
              setValue("mistakes", val);
            }}
            className={inputClass}
          />
          {errors.mistakes && <p className={errorClass}>{errors.mistakes.message}</p>}
        </div>

        <div>
          <label className={labelClass}>Notes</label>
          <textarea
            {...register("notes")}
            rows={4}
            className={`${inputClass} resize-none`}
            placeholder="Analysis, feelings, or key takeaways..."
          />
        </div>

        <button
          type="submit"
          disabled={atLimit || loading}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest
            bg-primary text-primary-foreground hover:brightness-110 shadow-lg shadow-primary/20 
            hover:scale-[1.01] active:scale-[0.99] transition-all duration-200
            disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {initialData?.id ? "Update Trade Record" : "Save Trade Record"}
        </button>
      </GlassCard>
    </form>
  );
}
