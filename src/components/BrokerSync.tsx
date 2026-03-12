import React, { useState } from "react";
import { GlassCard } from "./GlassCard";
import { Link2, RefreshCw, CheckCircle2, AlertCircle, Shield, Globe, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export function BrokerSync() {
  const [step, setStep] = useState<"select" | "connect" | "syncing" | "done">("select");
  const [selectedBroker, setSelectedBroker] = useState<string | null>(null);

  const brokers = [
    { id: "oanda", name: "OANDA", type: "Forex", icon: "🌐" },
    { id: "bybit", name: "Bybit", type: "Crypto", icon: "💎" },
    { id: "binance", name: "Binance", type: "Crypto/Spot", icon: "🟡" },
    { id: "metatrader", name: "MetaTrader 5", type: "Bridge", icon: "📊" }
  ];

  const handleConnect = () => {
    setStep("connect");
  };

  const startSync = () => {
    setStep("syncing");
    setTimeout(() => {
        setStep("done");
        toast.success(`Successfully imported 12 trades from ${selectedBroker}`);
    }, 2000);
  };

  return (
    <GlassCard className="p-0 overflow-hidden">
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-primary/5">
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold">Automated Broker Sync</h3>
        </div>
        {step === "done" && (
            <div className="flex items-center gap-1 text-[10px] text-profit font-bold uppercase">
                <CheckCircle2 className="w-3 h-3" /> Connected
            </div>
        )}
      </div>

      <div className="p-6">
        <AnimatePresence mode="wait">
          {step === "select" && (
            <motion.div 
                key="select"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
            >
                <p className="text-xs text-muted-foreground mb-4">Select your broker to automatically import your trading history and live trades.</p>
                <div className="grid grid-cols-2 gap-3">
                    {brokers.map(b => (
                        <button
                            key={b.id}
                            onClick={() => setSelectedBroker(b.name)}
                            className={`p-3 rounded-xl border text-left transition-all hover:scale-[1.02] ${selectedBroker === b.name ? 'border-primary bg-primary/10' : 'border-white/5 bg-white/5 hover:bg-white/10'}`}
                        >
                            <span className="text-xl mb-1 block">{b.icon}</span>
                            <p className="text-xs font-bold text-foreground">{b.name}</p>
                            <p className="text-[10px] text-muted-foreground">{b.type}</p>
                        </button>
                    ))}
                </div>
                <button 
                    disabled={!selectedBroker}
                    onClick={handleConnect}
                    className="w-full mt-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                >
                    Continue
                </button>
            </motion.div>
          )}

          {step === "connect" && (
            <motion.div 
                key="connect"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
            >
                <div>
                    <h4 className="text-sm font-bold mb-1">Connect to {selectedBroker}</h4>
                    <p className="text-[10px] text-muted-foreground">Enter your Read-Only API Key to fetch trade data. We never store withdrawal permissions.</p>
                </div>
                <div className="space-y-3">
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground">API Key</label>
                        <input type="password" placeholder="Paste your API key here" className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs outline-none focus:ring-1 focus:ring-primary" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground">API Secret</label>
                        <input type="password" placeholder="Paste your Secret key here" className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs outline-none focus:ring-1 focus:ring-primary" />
                    </div>
                </div>
                <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20 flex gap-2 items-start">
                    <Shield className="w-3 h-3 text-orange-500 mt-0.5 shrink-0" />
                    <p className="text-[9px] text-orange-500/80 leading-tight">
                        Security Notice: Use "Read-Only" keys. Journal Zenith will never ask for "Trade" or "Withdraw" permissions.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setStep("select")} className="flex-1 py-2 bg-white/5 text-foreground rounded-xl text-xs font-bold">Back</button>
                    <button onClick={startSync} className="flex-[2] py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold">Connect & Sync</button>
                </div>
            </motion.div>
          )}

          {step === "syncing" && (
            <motion.div 
                key="syncing"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-8 flex flex-col items-center justify-center text-center"
            >
                <div className="relative">
                    <RefreshCw className="w-12 h-12 text-primary animate-spin mb-4" />
                    <Zap className="w-6 h-6 text-yellow-400 absolute top-0 right-0 animate-pulse" />
                </div>
                <h4 className="font-bold text-lg mb-1">Syncing with {selectedBroker}...</h4>
                <p className="text-xs text-muted-foreground">Fetching 180 days of trade history</p>
            </motion.div>
          )}

          {step === "done" && (
            <motion.div 
                key="done"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-4"
            >
                <div className="w-16 h-16 bg-profit/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-profit" />
                </div>
                <h4 className="font-bold text-lg mb-1">Success!</h4>
                <p className="text-xs text-muted-foreground mb-6">Your {selectedBroker} account is now linked. All new trades will be imported automatically.</p>
                <button onClick={() => setStep("select")} className="px-6 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold hover:bg-white/10 transition-colors">Manage Connection</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </GlassCard>
  );
}
