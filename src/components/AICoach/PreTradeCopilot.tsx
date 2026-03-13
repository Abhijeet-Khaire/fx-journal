import React, { useState, useMemo } from "react";
import { GlassCard } from "../GlassCard";
import { Trade } from "@/lib/tradeTypes";
import { predictTradeSuccessProbability } from "@/lib/mlEngine";
import { BrainCircuit, AlertTriangle, CheckCircle2, Info, Crosshair, Zap, BarChart3, Fingerprint } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PreTradeCopilotProps {
  trades: Trade[];
}

export function PreTradeCopilot({ trades }: PreTradeCopilotProps) {
  const [pair, setPair] = useState("EUR/USD");
  const [session, setSession] = useState("London");
  const [emotion, setEmotion] = useState("Neutral");

  const prediction = useMemo(() => 
    predictTradeSuccessProbability(trades, { pair, session, emotion }),
    [trades, pair, session, emotion]
  );

  return (
    <GlassCard className="p-0 relative overflow-hidden group border-white/10 shadow-2xl rounded-[2rem]">
      {/* Neural Background Decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-[100px] -mr-40 -mt-40 transition-opacity group-hover:bg-primary/10" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-indigo-500/5 rounded-full blur-[80px] -ml-32 -mb-32 transition-opacity group-hover:bg-indigo-500/10" />
      </div>

      <div className="p-6 border-b border-white/10 bg-white/5 backdrop-blur-md flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-[0_0_20px_rgba(var(--primary),0.3)]">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black tracking-tight text-white uppercase">Trading Assistant</h3>
            <div className="flex items-center gap-2">
                <span className="flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Probability Engine</span>
            </div>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-3">
            <div className="flex -space-x-2">
                {[1,2,3].map(i => <div key={i} className="w-6 h-6 rounded-full border-2 border-background bg-white/10" />)}
            </div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Data Verified</span>
        </div>
      </div>

      <div className="p-8 space-y-8 relative z-10">
        {/* Input Parameters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
                { label: "Execution Asset", value: pair, setter: setPair, options: ["EUR/USD", "GBP/USD", "USD/JPY", "XAU/USD", "BTC/USD", "NAS100"], icon: Crosshair },
                { label: "Active Window", value: session, setter: setSession, options: ["Asian", "London", "New York"], icon: BarChart3 },
                { label: "Trader Mindset", value: emotion, setter: setEmotion, options: ["Neutral", "Confidence", "Fear", "Greed", "Anxiety", "Excitement"], icon: Fingerprint }
            ].map((input, idx) => (
                <div key={idx} className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                        <input.icon className="w-3.5 h-3.5 text-primary opacity-60" />
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{input.label}</label>
                    </div>
                    <div className="relative group/select">
                        <select 
                            value={input.value} 
                            onChange={(e) => input.setter(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-5 text-sm font-bold focus:ring-2 focus:ring-primary/40 focus:border-primary/40 outline-none transition-all appearance-none hover:bg-white/10 cursor-pointer"
                        >
                            {input.options.map(opt => <option key={opt} value={opt} className="bg-background text-foreground">{opt}</option>)}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                             <Zap className="w-3 h-3 text-primary fill-primary" />
                        </div>
                    </div>
                </div>
            ))}
        </div>

        {/* Results Engine */}
        <div className="relative p-8 rounded-[2rem] bg-gradient-to-br from-white/5 to-transparent border border-white/10 overflow-hidden shadow-inner">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-[60px]" />
            
            <div className="flex flex-col lg:flex-row items-center gap-10">
                {/* Radial Probability */}
                <div className="relative w-40 h-40 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle
                            cx="80"
                            cy="80"
                            r="70"
                            fill="transparent"
                            stroke="currentColor"
                            strokeWidth="12"
                            className="text-white/5"
                        />
                        <motion.circle
                            cx="80"
                            cy="80"
                            r="70"
                            fill="transparent"
                            stroke="currentColor"
                            strokeWidth="12"
                            strokeDasharray={440}
                            initial={{ strokeDashoffset: 440 }}
                            animate={{ strokeDashoffset: 440 - (440 * prediction.probability) / 100 }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            strokeLinecap="round"
                            className={prediction.probability >= 50 ? 'text-primary' : 'text-loss'}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <motion.span 
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            key={prediction.probability}
                            className="text-3xl font-black text-white leading-none"
                        >
                            {prediction.probability}%
                        </motion.span>
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter mt-1">Probability</span>
                    </div>
                </div>

                <div className="flex-1 space-y-6 w-full">
                    <div className="flex items-center gap-8 px-4">
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Recommended Risk</span>
                            <div className="flex items-baseline gap-2">
                                <span className={`text-4xl font-black ${prediction.recommendedRisk >= 1 ? 'text-primary' : 'text-loss'}`}>
                                    {prediction.recommendedRisk.toFixed(2)}%
                                </span>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase">of Capital</span>
                            </div>
                        </div>
                        <div className="h-10 w-px bg-white/10" />
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Confidence</span>
                            <div className="flex gap-1 mt-1">
                                {[1,2,3,4,5].map(i => (
                                    <div key={i} className={`h-1.5 w-6 rounded-full ${i <= (prediction.probability / 20) ? 'bg-primary' : 'bg-white/10'}`} />
                                ))}
                            </div>
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div 
                            key={prediction.warning || "success"}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className={`p-6 rounded-3xl border ${
                                prediction.warning 
                                    ? 'bg-loss/10 border-loss/20 text-loss' 
                                    : 'bg-primary/10 border-primary/20 text-primary'
                            }`}
                        >
                            <div className="flex items-start gap-4">
                                <div className={`p-2 rounded-xl scale-125 ${prediction.warning ? 'bg-loss/20' : 'bg-primary/20'}`}>
                                    {prediction.warning ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                                </div>
                                <div className="space-y-1">
                                    <p className="font-bold text-sm leading-relaxed">
                                        {prediction.warning || "System signals are optimal. Strategic execution is highly recommended."}
                                    </p>
                                    <p className="text-[11px] opacity-70 ">
                                        {prediction.warning ? "AI Engine identifies significant psychological or statistical friction." : "Statistical edge detected on the current asset and time window."}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {trades.length < 5 && (
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/5 w-fit">
                            <Info className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Dataset limited - Feed AI more trades for accuracy</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </GlassCard>
  );
}
