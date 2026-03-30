import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TradeSchema, TradeValue, PAIRS, STRATEGIES } from "@/lib/tradeTypes";
import { GlassCard } from "@/components/GlassCard";
import { ArrowUpRight, ArrowDownRight, Save, Loader2, BarChart2, Brain, Flame, Target } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AddTradeFormProps {
  initialData?: Partial<TradeValue>;
  onSubmit: (data: TradeValue) => Promise<void>;
  loading?: boolean;
  atLimit?: boolean;
  challenges?: any[];
}

type TabType = 'data' | 'psychology' | 'mistakes' | 'improvement';

export function AddTradeForm({ initialData, onSubmit, loading, atLimit, challenges }: AddTradeFormProps) {
  const [activeTab, setActiveTab] = useState<TabType>('data');
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
      
      marketStructure: initialData?.marketStructure,
      biasBeforeTrade: initialData?.biasBeforeTrade,
      biasReason: initialData?.biasReason || "",
      closeTime: initialData?.closeTime || "",
      targetPips: initialData?.targetPips || 0,
      slPips: initialData?.slPips || 0,
      rrRatio: initialData?.rrRatio || "",
      biggestMistake: initialData?.biggestMistake || "",
      lessonsLearned: initialData?.lessonsLearned || "",
      whatWorkedWell: initialData?.whatWorkedWell || "",
      whatDidntWork: initialData?.whatDidntWork || "",
      moodBefore: initialData?.moodBefore,
      thinkingBefore: initialData?.thinkingBefore || "",
      thinkingDuring: initialData?.thinkingDuring || "",
      thinkingAfter: initialData?.thinkingAfter || "",
      planExplanation: initialData?.planExplanation || "",
      improveTomorrow: initialData?.improveTomorrow || "",
      rulesNextSession: initialData?.rulesNextSession || "",
      focusArea: initialData?.focusArea,
      disciplineRating: initialData?.disciplineRating || 5,
      emotionalControlRating: initialData?.emotionalControlRating || 5,
    },
  });

  React.useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      reset(initialData);
      if (initialData.mistakes) {
        setMistakesInput(initialData.mistakes.join(", "));
      }
    }
  }, [initialData, reset]);

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

  const tabs = [
    { id: 'data', label: 'Trade Data', icon: BarChart2 },
    { id: 'psychology', label: 'Psychology', icon: Brain },
    { id: 'mistakes', label: 'Mistakes & Lessons', icon: Flame },
    { id: 'improvement', label: 'Improvement Plan', icon: Target },
  ] as const;

  return (
    <form onSubmit={handleSubmit(onFormSubmit)}>
      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as TabType)}
              className={cn(
                "flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all",
                isActive 
                  ? "bg-primary text-black shadow-lg shadow-primary/20 scale-[1.02]" 
                  : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <GlassCard hover={false} className="space-y-6">
        
        {/* TAB: TRADE DATA */}
        {activeTab === 'data' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Currency Pair *</label>
                <select {...register("pair")} className={`${inputClass} appearance-none cursor-pointer border-primary/20`}>
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
                <label className={labelClass}>Direction *</label>
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
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Lot Size *</label>
                  <input type="number" step="0.01" {...register("lotSize", { valueAsNumber: true })} className={inputClass} />
                  {errors.lotSize && <p className={errorClass}>{errors.lotSize.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>Strategy / Setup *</label>
                  <select {...register("strategy")} className={`${inputClass} appearance-none cursor-pointer`}>
                    {STRATEGIES.map((s) => <option key={s} value={s} className="bg-[hsl(220,20%,8%)] text-white">{s}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Prices */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { key: "entryPrice", label: "Entry Price *" },
                { key: "exitPrice", label: "Exit Price *" },
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
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <div>
                  <label className={labelClass}>Date *</label>
                  <input type="date" {...register("date")} className={inputClass} />
               </div>
               <div>
                  <label className={labelClass}>Open Time *</label>
                  <input type="time" {...register("time")} className={inputClass} />
               </div>
               <div>
                  <label className={labelClass}>Close Time</label>
                  <input type="time" {...register("closeTime")} className={inputClass} />
               </div>
               <div>
                  <label className={labelClass}>RR Ratio</label>
                  <input type="text" {...register("rrRatio")} placeholder="e.g. 1:2" className={inputClass} />
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Market Structure</label>
                <select {...register("marketStructure")} className={`${inputClass} appearance-none cursor-pointer`}>
                  <option value="">Select Structure</option>
                  {["Trending", "Ranging", "Choppy", "Breakout", "Reversal"].map((s) => (
                    <option key={s} value={s} className="bg-[hsl(220,20%,8%)] text-white">{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Bias Before Trade</label>
                <select {...register("biasBeforeTrade")} className={`${inputClass} appearance-none cursor-pointer`}>
                  <option value="">Select Bias</option>
                  {["Bullish", "Bearish", "Neutral"].map((s) => (
                    <option key={s} value={s} className="bg-[hsl(220,20%,8%)] text-white">{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Bias Reason / Why?</label>
                <input type="text" {...register("biasReason")} placeholder="Why this bias?" className={inputClass} />
              </div>
            </div>
          </div>
        )}

        {/* TAB: PSYCHOLOGY */}
        {activeTab === 'psychology' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Mood Before Trading</label>
                  <select {...register("moodBefore")} className={`${inputClass} appearance-none cursor-pointer`}>
                    <option value="">Select Mood</option>
                    {["Calm", "Confident", "Stressed", "FOMO", "Overexcited"].map((s) => (
                      <option key={s} value={s} className="bg-[hsl(220,20%,8%)] text-white">{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Confidence (1-5)</label>
                  <select {...register("confidence", { valueAsNumber: true })} className={`${inputClass} appearance-none cursor-pointer`}>
                    {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n} className="bg-[hsl(220,20%,8%)] text-white">{n}</option>)}
                  </select>
                </div>
             </div>

             <div>
                <label className={labelClass}>Thinking Before Trade</label>
                <textarea {...register("thinkingBefore")} rows={2} className={`${inputClass} resize-none`} placeholder="Why did I take this trade? Was it planned or impulsive?" />
             </div>
             
             <div>
                <label className={labelClass}>Thinking During Trade</label>
                <textarea {...register("thinkingDuring")} rows={2} className={`${inputClass} resize-none`} placeholder="Emotions while trade was running - fear, greed, doubt?" />
             </div>
             
             <div>
                <label className={labelClass}>Thinking After Trade</label>
                <textarea {...register("thinkingAfter")} rows={2} className={`${inputClass} resize-none`} placeholder="Was I satisfied? Regret? Revenge mindset?" />
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/10">
                <div>
                  <label className={labelClass}>Did I Follow My Plan?</label>
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
                   <label className={labelClass}>Plan Explanation</label>
                   <input type="text" {...register("planExplanation")} placeholder="Explanation on following plan" className={inputClass} />
                </div>
             </div>
          </div>
        )}

        {/* TAB: MISTAKES & LESSONS */}
        {activeTab === 'mistakes' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              <label className={labelClass}>Mistakes Made Today (Comma separated)</label>
              <input
                type="text"
                placeholder="Overtrading, early entry, no SL, emotional trading, etc."
                value={mistakesInput}
                onChange={(e) => {
                  const str = e.target.value;
                  setMistakesInput(str);
                  const val = str.split(",").map(m => m.trim()).filter(Boolean);
                  setValue("mistakes", val);
                }}
                className={inputClass}
              />
            </div>

            <div>
               <label className={labelClass}>Biggest Mistake</label>
               <input type="text" {...register("biggestMistake")} placeholder="Main issue that caused loss or stress" className={inputClass} />
            </div>

            <div>
               <label className={labelClass}>Lessons Learned Today</label>
               <textarea {...register("lessonsLearned")} rows={3} className={`${inputClass} resize-none`} placeholder="What did the market teach me today?" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                  <label className={labelClass}>What Worked Well?</label>
                  <textarea {...register("whatWorkedWell")} rows={3} className={`${inputClass} resize-none`} placeholder="Good decisions, patience, discipline, etc." />
               </div>
               <div>
                  <label className={labelClass}>What Didn't Work?</label>
                  <textarea {...register("whatDidntWork")} rows={3} className={`${inputClass} resize-none`} placeholder="Wrong analysis, bad timing, emotions, etc." />
               </div>
            </div>
          </div>
        )}

        {/* TAB: IMPROVEMENT PLAN */}
        {activeTab === 'improvement' && (
           <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div>
                 <label className={labelClass}>What to Improve Tomorrow</label>
                 <textarea {...register("improveTomorrow")} rows={2} className={`${inputClass} resize-none`} placeholder="Specific actions, not general" />
              </div>
              
              <div>
                 <label className={labelClass}>Rules to Follow Next Session</label>
                 <textarea {...register("rulesNextSession")} rows={2} className={`${inputClass} resize-none`} placeholder="Max trades, confirmation rules, patience, etc." />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className={labelClass}>Focus Area</label>
                    <select {...register("focusArea")} className={`${inputClass} appearance-none cursor-pointer`}>
                      <option value="">Select Focus Area</option>
                      {["Discipline", "Psychology", "Strategy", "Risk Management"].map((s) => (
                        <option key={s} value={s} className="bg-[hsl(220,20%,8%)] text-white">{s}</option>
                      ))}
                    </select>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-white/10">
                 <div>
                    <label className={labelClass}>Discipline Rating (1-10)</label>
                    <select {...register("disciplineRating", { valueAsNumber: true })} className={`${inputClass} appearance-none cursor-pointer`}>
                      {[1,2,3,4,5,6,7,8,9,10].map((n) => <option key={n} value={n} className="bg-[hsl(220,20%,8%)] text-white">{n}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className={labelClass}>Emotional Control Rating (1-10)</label>
                    <select {...register("emotionalControlRating", { valueAsNumber: true })} className={`${inputClass} appearance-none cursor-pointer`}>
                      {[1,2,3,4,5,6,7,8,9,10].map((n) => <option key={n} value={n} className="bg-[hsl(220,20%,8%)] text-white">{n}</option>)}
                    </select>
                 </div>
              </div>
           </div>
        )}

        <div className="pt-4 mt-6 border-t border-white/5">
            <div>
               <label className={labelClass}>General Notes</label>
               <textarea
                 {...register("notes")}
                 rows={2}
                 className={`${inputClass} resize-none mb-4`}
                 placeholder="Any additional thoughts..."
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
        </div>
      </GlassCard>
    </form>
  );
}
