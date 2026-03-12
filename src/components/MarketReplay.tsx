import React, { useState, useEffect, useMemo, useRef } from "react";
import { GlassCard } from "./GlassCard";
import { 
    Play, 
    Pause, 
    RotateCcw, 
    Target, 
    Activity, 
    Sparkles, 
    Terminal, 
    ShieldCheck, 
    Zap, 
    Clock, 
    BarChart3,
    ArrowUpRight,
    ArrowDownRight,
    XCircle,
    Cpu,
    Fingerprint
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Trade } from "@/lib/tradeTypes";
import { generateGoldenPlaybook } from "@/lib/mlEngine";

interface MarketReplayProps {
  trades: Trade[];
}

interface Tick {
    price: number;
    time: number;
    isHigh?: boolean;
    isLow?: boolean;
}

export function MarketReplay({ trades }: MarketReplayProps) {
  const [bootStatus, setBootStatus] = useState<'idle' | 'booting' | 'active'>('idle');
  const [bootText, setBootText] = useState("");
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(trades[0] || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTickIndex, setCurrentTickIndex] = useState(0);
  
  // Paper Trading State
  const [position, setPosition] = useState<'LONG' | 'SHORT' | null>(null);
  const [entryPrice, setEntryPrice] = useState<number | null>(null);
  const [paperPnL, setPaperPnL] = useState(0);
  const [realizedPnL, setRealizedPnL] = useState(0);

  const playbook = useMemo(() => trades.length >= 5 ? generateGoldenPlaybook(trades) : null, [trades]);

  // Generate simulated candle ticks for the selected trade
  const ticks = useMemo(() => {
    if (!selectedTrade) return [];
    const base = selectedTrade.entryPrice;
    const exit = selectedTrade.exitPrice;
    const count = 40;
    const arr: Tick[] = [];
    
    // Simulate some volatility around entry and exit
    for (let i = 0; i < count; i++) {
        const progress = i / count;
        const volatility = (Math.random() - 0.5) * (base * 0.002);
        const trend = (exit - base) * progress;
        arr.push({
            price: base + trend + volatility,
            time: i
        });
    }
    return arr;
  }, [selectedTrade]);

  const currentPrice = ticks[currentTickIndex]?.price || 0;

  // Boot Sequence Logic
  const startBoot = () => {
    setBootStatus('booting');
    const lines = [
        "> INITIALIZING TRADE_SIM_V4.0...",
        "> LOADING HISTORICAL MARKET DATA...",
        "> SYNCING PERFORMANCE PATTERNS...",
        "> BUFFERING PRICE HISTORY...",
        "> ACCESS GRANTED. SIMULATION READY."
    ];
    let lineIdx = 0;
    const interval = setInterval(() => {
        if (lineIdx >= lines.length) {
            clearInterval(interval);
            setTimeout(() => setBootStatus('active'), 1000);
            return;
        }
        setBootText(lines[lineIdx]);
        lineIdx++;
    }, 600);
  };

  // Replay Animation Loop
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && bootStatus === 'active') {
        timer = setInterval(() => {
            setCurrentTickIndex(prev => {
                if (prev >= ticks.length - 1) {
                    setIsPlaying(false);
                    return prev;
                }
                return prev + 1;
            });
        }, 300);
    }
    return () => clearInterval(timer);
  }, [isPlaying, bootStatus, ticks.length]);

  // Daily PnL Tracking
  useEffect(() => {
    if (position && entryPrice) {
        const diff = currentPrice - entryPrice;
        const multiplier = position === 'LONG' ? 1 : -1;
        setPaperPnL(diff * 100 * multiplier); // Simplified scaling
    } else {
        setPaperPnL(0);
    }
  }, [currentPrice, position, entryPrice]);

  const handleOrder = (type: 'LONG' | 'SHORT') => {
    if (position) {
        // Close existing
        setRealizedPnL(prev => prev + paperPnL);
        setPosition(null);
        setEntryPrice(null);
    } else {
        setPosition(type);
        setEntryPrice(currentPrice);
    }
  };

  const isGoldenAlignment = selectedTrade && playbook && 
    (selectedTrade.pair === playbook.bestPair && selectedTrade.strategy === playbook.strategyName);

  if (bootStatus === 'booting') {
    return (
        <GlassCard className="h-[500px] flex flex-col items-center justify-center bg-black/80 font-mono p-10 overflow-hidden relative">
            <div className="absolute inset-0 circuit-pattern opacity-10 animate-pulse" />
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="z-10 text-center space-y-6"
            >
                <Cpu className="w-12 h-12 text-primary mx-auto animate-spin-slow" />
                <div className="space-y-2">
                    <p className="text-primary text-xs tracking-[0.3em] font-black uppercase">Simulator Boot Sequence</p>
                    <p className="text-white text-lg font-bold min-h-[1.5em]">{bootText}</p>
                </div>
                <div className="w-64 h-1 bg-white/5 rounded-full overflow-hidden mx-auto">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 3 }}
                        className="h-full bg-primary shadow-glow" 
                    />
                </div>
            </motion.div>
        </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Control Panel */}
            <GlassCard className="lg:col-span-1 p-8 rounded-[2.5rem] border-white/10 shadow-2xl relative overflow-hidden group">
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
                
                <div className="relative z-10 space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                            <Target className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-tighter italic">Simulator Hub</h3>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Performance Training v4.0</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-2">Trade History Selection</label>
                        <select 
                            className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/40 appearance-none hover:bg-black/60 transition-all cursor-pointer"
                            onChange={(e) => {
                                const t = trades.find(tr => tr.id === e.target.value);
                                if (t) {
                                    setSelectedTrade(t);
                                    setBootStatus('idle');
                                    setCurrentTickIndex(0);
                                    setIsPlaying(false);
                                }
                            }}
                            value={selectedTrade?.id}
                        >
                            {trades.slice(0, 10).map(t => (
                                <option key={t.id} value={t.id} className="bg-[#0a0a0a] text-white">
                                    {t.pair} @ {t.date} ({t.profitLoss >= 0 ? '+' : ''}${Math.round(t.profitLoss)})
                                </option>
                            ))}
                        </select>
                    </div>

                    {bootStatus === 'idle' ? (
                        <button 
                            onClick={startBoot}
                            className="w-full py-5 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-[0.2em] italic hover:scale-[1.03] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(var(--primary),0.3)] flex items-center justify-center gap-3"
                        >
                            <Zap className="w-5 h-5 fill-current" />
                            Launch Session
                        </button>
                    ) : (
                        <div className="pt-6 border-t border-white/5 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Simulator Profit</p>
                                    <p className={`text-2xl font-black italic tracking-tighter ${realizedPnL >= 0 ? 'text-profit shimmer-text' : 'text-loss'}`}>
                                        {realizedPnL >= 0 ? '+' : ''}${realizedPnL.toFixed(2)}
                                    </p>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center min-w-[100px]">
                                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1 italic">Speed Phase</p>
                                    <p className="text-xl font-black text-primary">1.0x</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <button 
                                    onClick={() => handleOrder('LONG')}
                                    className={`py-4 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all ${
                                        position === 'LONG' ? 'bg-profit text-white shadow-profit' : 'bg-white/5 text-profit border border-profit/20 hover:bg-profit/10'
                                    }`}
                                >
                                    {position === 'LONG' ? 'CLOSE LONG' : 'BUY MARKET'}
                                </button>
                                <button 
                                    onClick={() => handleOrder('SHORT')}
                                    className={`py-4 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all ${
                                        position === 'SHORT' ? 'bg-loss text-white shadow-loss' : 'bg-white/5 text-loss border border-loss/20 hover:bg-loss/10'
                                    }`}
                                >
                                    {position === 'SHORT' ? 'CLOSE SHORT' : 'SELL MARKET'}
                                </button>
                            </div>

                            <button 
                                onClick={() => {
                                    setBootStatus('idle');
                                    setIsPlaying(false);
                                    setCurrentTickIndex(0);
                                    setRealizedPnL(0);
                                    setPosition(null);
                                }}
                                className="w-full py-3 text-[10px] font-black uppercase text-muted-foreground hover:text-white transition-colors tracking-widest border-t border-white/5 pt-6"
                            >
                                <RotateCcw className="w-3 h-3 inline mr-2" /> Reset Simulator
                            </button>
                        </div>
                    )}
                </div>
            </GlassCard>

            {/* Simulation Canvas */}
            <div className="lg:col-span-2 space-y-6">
                <GlassCard className="p-8 rounded-[3rem] border-white/10 bg-black/40 backdrop-blur-3xl relative overflow-hidden h-full flex flex-col min-h-[500px]">
                    <div className="absolute top-0 left-0 w-full h-full circuit-pattern opacity-[0.03] pointer-events-none" />
                    
                    <div className="relative z-10 flex-1 flex flex-col">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                                    <Activity className="w-3.5 h-3.5 text-primary animate-pulse" />
                                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] italic">Executing Live Stream</span>
                                </div>
                                {isGoldenAlignment && (
                                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-profit/10 border border-profit/20">
                                        <ShieldCheck className="w-3.5 h-3.5 text-profit" />
                                        <span className="text-[10px] font-black text-profit uppercase tracking-[0.2em] italic">Golden Setup Match</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest font-mono">{selectedTrade?.pair} / 5M</span>
                                <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/10 text-xs font-bold font-mono">
                                    ${currentPrice.toFixed(4)}
                                </div>
                            </div>
                        </div>

                        {/* Custom SVG Display */}
                        <div className="flex-1 relative bg-black/20 rounded-[2rem] border border-white/5 overflow-hidden flex flex-col items-center justify-center group">
                            {bootStatus === 'active' ? (
                                <>
                                    <svg className="w-full h-full p-10 opacity-80" viewBox="0 0 100 100" preserveAspectRatio="none">
                                        {/* Grid Lines */}
                                        <line x1="0" y1="20" x2="100" y2="20" stroke="white" strokeWidth="0.05" strokeOpacity="0.1" />
                                        <line x1="0" y1="50" x2="100" y2="50" stroke="white" strokeWidth="0.05" strokeOpacity="0.1" />
                                        <line x1="0" y1="80" x2="100" y2="80" stroke="white" strokeWidth="0.05" strokeOpacity="0.1" />
                                        
                                        {/* Dynamic Replay Path */}
                                        <motion.polyline
                                            fill="none"
                                            stroke="url(#lineGradient)"
                                            strokeWidth="0.8"
                                            points={ticks.slice(0, currentTickIndex + 1).map((t, idx) => {
                                                const x = (idx / (ticks.length - 1)) * 100;
                                                const y = 100 - ((t.price - Math.min(...ticks.map(x => x.price))) / (Math.max(...ticks.map(x => x.price)) - Math.min(...ticks.map(x => x.price)))) * 100;
                                                return `${x},${y}`;
                                            }).join(' ')}
                                        />
                                        <defs>
                                            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.2" />
                                                <stop offset="100%" stopColor="var(--primary)" />
                                            </linearGradient>
                                        </defs>

                                        {/* Current Marker */}
                                        {ticks[currentTickIndex] && (
                                            <circle 
                                                cx={(currentTickIndex / (ticks.length - 1)) * 100} 
                                                cy={100 - ((ticks[currentTickIndex].price - Math.min(...ticks.map(x => x.price))) / (Math.max(...ticks.map(x => x.price)) - Math.min(...ticks.map(x => x.price)))) * 100}
                                                r="1.2"
                                                fill="var(--primary)"
                                                className="shadow-glow"
                                            />
                                        )}
                                    </svg>
                                    
                                    {/* Position HUD */}
                                    {position && (
                                        <motion.div 
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className={`absolute top-10 right-10 p-6 rounded-3xl backdrop-blur-3xl border border-white/10 shadow-2xl ${
                                                paperPnL >= 0 ? 'bg-profit/10 border-profit/20' : 'bg-loss/10 border-loss/20'
                                            }`}
                                        >
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Live Float Yield</p>
                                            <div className="flex items-center gap-3">
                                                <p className={`text-4xl font-black tracking-tighter shimmer-text ${paperPnL >= 0 ? 'text-profit' : 'text-loss'}`}>
                                                    {paperPnL >= 0 ? '+' : ''}${paperPnL.toFixed(2)}
                                                </p>
                                                {paperPnL >= 0 ? <ArrowUpRight className="text-profit" /> : <ArrowDownRight className="text-loss" />}
                                            </div>
                                            <div className="mt-4 flex items-center gap-2">
                                                <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${position === 'LONG' ? 'bg-profit/20 text-profit' : 'bg-loss/20 text-loss'}`}>
                                                    Position: {position}
                                                </span>
                                                <span className="text-[8px] font-bold text-muted-foreground uppercase opacity-60">Entry: {entryPrice?.toFixed(4)}</span>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Playback Controls Overlay */}
                                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-6 px-8 py-4 bg-black/60 rounded-[2rem] border border-white/10 backdrop-blur-xl opacity-0 group-hover:opacity-100 transition-all">
                                        <button className="text-muted-foreground hover:text-white transition-colors" title="Rewind Step"><RotateCcw className="w-5 h-5" /></button>
                                        <button 
                                            onClick={() => setIsPlaying(!isPlaying)}
                                            className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.4)] group/btn"
                                        >
                                            {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current translate-x-0.5" />}
                                        </button>
                                        <button className="text-muted-foreground hover:text-white transition-colors rotate-180" title="Skip Step"><RotateCcw className="w-5 h-5" /></button>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center text-center p-10 space-y-4">
                                    <div className="p-5 rounded-full bg-white/5 border border-white/10 relative">
                                        <Fingerprint className="w-12 h-12 text-muted-foreground/20" />
                                        <div className="absolute inset-0 border-2 border-primary/20 rounded-full animate-ping" />
                                    </div>
                                    <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Awaiting Authentication</p>
                                </div>
                            )}
                        </div>

                        {/* Performance Details Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                            {[
                                { label: "Asset Pair", value: selectedTrade?.pair, icon: BarChart3 },
                                { label: "Trade Result", value: `$${selectedTrade?.profitLoss.toFixed(2)}`, icon: Activity, color: selectedTrade?.profitLoss && selectedTrade.profitLoss >= 0 ? "text-profit" : "text-loss" },
                                { label: "Trade Time", value: selectedTrade?.time, icon: Clock },
                                { label: "Strategy", value: selectedTrade?.strategy, icon: Zap }
                            ].map((item, i) => (
                                <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/10 group hover:bg-white/10 transition-colors">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-2">
                                        <item.icon className="w-3 h-3 text-primary opacity-60" />
                                        {item.label}
                                    </p>
                                    <p className={`text-sm font-black italic tracking-tight ${item.color || 'text-white'}`}>{item.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </GlassCard>
            </div>
        </div>
    </div>
  );
}
