import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "./GlassCard";
import { Terminal, Volume2, VolumeX, Cpu, Activity, ShieldAlert, Award, RefreshCw, Send, Play } from "lucide-react";
import { cn } from "@/lib/utils";

// Web Audio synthesizer for premium tech sounds
const playSynthSound = (type: "click" | "beep" | "processing" | "success") => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === "click") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.16);
    } else if (type === "beep") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    } else if (type === "processing") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(100, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(300, ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.03, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start();
      osc.stop(ctx.currentTime + 0.51);
    } else if (type === "success") {
      // High-low-high electronic chime
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.setValueAtTime(900, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(1200, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.36);
    }
  } catch (e) {
    // Fail silently if browser blocks audio autoplay
  }
};

// Web Speech Synth helper
const speakJarvisVoice = (text: string, isMuted: boolean) => {
  if (isMuted) return;
  try {
    if (!window.speechSynthesis) return;
    // Cancel currently speaking voices
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    // Try to find a nice futuristic sounding voice (e.g. Google UK English Male/Female or standard)
    const voices = window.speechSynthesis.getVoices();
    const jarvisVoice = voices.find(voice => 
      voice.name.includes("Google") || 
      voice.name.includes("Natural") || 
      voice.name.includes("UK English") ||
      voice.name.includes("Daniel")
    );
    if (jarvisVoice) {
      utterance.voice = jarvisVoice;
    }
    utterance.pitch = 0.95; // slightly lower pitch for a structured voice
    utterance.rate = 1.05;  // slightly faster pacing
    utterance.volume = 0.6;
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    // Speech synthesis blocked/failed
  }
};

const DEFAULT_LOGS = [
  "FX-JARVIS // COGNITIVE CORE INITIALIZED...",
  "SECURE QUANTUM ENCRYPTION ESTABLISHED ON LOCAL DATA.",
  "AI ANALYTIC ENGINE CALIBRATED // NEURAL BANDWIDTH: OPTIMAL.",
  "PROTOCOL 7.42 COGNITIVE ANALYTICS: ONLINE // READY FOR DATASTREAM INTERCEPT."
];

interface JarvisHUDProps {
  winRate?: number;
  netProfit?: number;
}

export function JarvisHUD({ winRate = 62.4, netProfit = 4580 }: JarvisHUDProps) {
  const [isAudioMuted, setIsAudioMuted] = useState(true);
  const [logs, setLogs] = useState<string[]>(DEFAULT_LOGS);
  const [inputText, setInputText] = useState("");
  const [hudState, setHudState] = useState<"idle" | "diagnostics" | "optimizing" | "voice">("idle");
  const [systemHealth, setSystemHealth] = useState(98);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal logs
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Periodic random system logs to feel "alive"
  useEffect(() => {
    const addSimulatedFeed = () => {
      if (hudState === "optimizing") return;
      const feeds = [
        `DIAGNOSTICS: Memory core running within nominal limits. Health: ${systemHealth}%`,
        "NETWORK STREAM: Connected to global FX liquidity servers. Latency: 12ms",
        "AI DEEP INSIGHTS: High volume detected in USD pairs. Maintain margin discipline.",
        "RISK GUARD: Drawdown constraints locked at 2.0% max loss per trade.",
        "CALCULATING: Machine learning edge patterns currently matching market structure."
      ];
      const randomFeed = feeds[Math.floor(Math.random() * feeds.length)];
      setLogs(prev => [...prev, randomFeed]);
      
      // Keep logs at max 30 entries
      if (logs.length > 30) {
        setLogs(prev => prev.slice(prev.length - 20));
      }
      
      if (!isAudioMuted) {
        playSynthSound("beep");
      }
    };

    const interval = setInterval(addSimulatedFeed, 12000);
    return () => clearInterval(interval);
  }, [hudState, isAudioMuted, systemHealth, logs]);

  // Toggle voice greeting
  const handleToggleMute = () => {
    const nextMuted = !isAudioMuted;
    setIsAudioMuted(nextMuted);
    if (!nextMuted) {
      playSynthSound("success");
      speakJarvisVoice("Jarvis cognitive voice interface online. Systems fully operational, Operator.", false);
      setLogs(prev => [...prev, "JARVIS // SPEECH SYNTH MODULE ENABLED."]);
    } else {
      setLogs(prev => [...prev, "JARVIS // SPEECH SYNTH MODULE MUTED."]);
    }
  };

  // Process operational command console
  const handleSendCommand = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const cmd = inputText.trim().toLowerCase();
    setInputText("");
    setLogs(prev => [...prev, `OPERATOR> ${inputText.toUpperCase()}`]);
    
    if (!isAudioMuted) {
      playSynthSound("click");
    }

    setTimeout(() => {
      if (cmd === "help") {
        setLogs(prev => [
          ...prev, 
          "SYSTEM INSTRUCTION MANUAL:",
          "  - STATUS      : Returns general diagnostic state",
          "  - RISK        : Calculates portfolio risk boundaries",
          "  - OPTIMIZE    : Triggers algorithmic margin advisory",
          "  - DIAGNOSTICS : Analyzes system hardware load",
          "  - CLEAR       : Flushes terminal stack buffer"
        ]);
        speakJarvisVoice("Here are the active protocol instructions for terminal overrides.", isAudioMuted);
      } else if (cmd === "status") {
        setLogs(prev => [
          ...prev,
          "--- SECURITY PROFILE STATUS ---",
          `COGNITIVE STATUS: FUNCTIONAL // EDGE SCORE: ${winRate}%`,
          `TOTAL ADVISORY MATRIX: ONLINE`,
          `RISK PARAMETERS: LOCKED & INTEGRATED`
        ]);
        speakJarvisVoice(`Systems are running at full operational capacity. Edge score is registered at ${winRate.toFixed(1)} percent.`, isAudioMuted);
      } else if (cmd === "risk") {
        setLogs(prev => [
          ...prev,
          "--- RISK ARCHITECT PARAMETERS ---",
          "  [MAX DD TARGET] : 2% maximum target",
          "  [LEVERAGE MAX]  : 1:30 recommended cap",
          "  [STOP LOSSES]   : 100% adherence checked"
        ]);
        speakJarvisVoice("Risk parameters stabilized. Max drawdown limits are securely constrained.", isAudioMuted);
      } else if (cmd === "optimize") {
        setHudState("optimizing");
        setLogs(prev => [...prev, "JARVIS // ADVISORY OPTIMIZATION PIPELINE TRIGGERED..."]);
        speakJarvisVoice("Advisory optimization pipeline triggered. Recalculating market expectancy indices.", isAudioMuted);
        
        if (!isAudioMuted) {
          playSynthSound("processing");
        }

        let step = 0;
        const optInterval = setInterval(() => {
          step++;
          if (step === 1) {
            setLogs(prev => [...prev, "  >> RUNNING ADVANTAGE EDGE INTEGRATOR... [MATCH]"]);
          } else if (step === 2) {
            setLogs(prev => [...prev, "  >> ALIGNING RISK REWARD RATIOS... [RECOMMEND 1:2.4]"]);
          } else if (step === 3) {
            setLogs(prev => [
              ...prev, 
              "  >> ENTIRE PLAYBOOK RECALIBRATED.",
              "JARVIS // ADVISORY PROFILE SECURED. OPTIMIZED STATUS: COMPLETE."
            ]);
            setHudState("idle");
            if (!isAudioMuted) {
              playSynthSound("success");
            }
            speakJarvisVoice("Recalibration successful. Trading playbook has been fully optimized.", isAudioMuted);
            clearInterval(optInterval);
          }
        }, 1500);
      } else if (cmd === "diagnostics") {
        setHudState("diagnostics");
        setLogs(prev => [...prev, "JARVIS // FULL DIAGNOSTICS AUDIT INITIATED..."]);
        speakJarvisVoice("Initiating system core diagnostics sweep.", isAudioMuted);
        
        setTimeout(() => {
          const randHealth = 95 + Math.floor(Math.random() * 5);
          setSystemHealth(randHealth);
          setLogs(prev => [
            ...prev,
            `  [CORE TEMPS]     : 42°C (Optimal)`,
            `  [NEURAL ENGINE]  : Functional // Health ${randHealth}%`,
            `  [DATA PIPELINE]  : Synchronized`
          ]);
          setHudState("idle");
          if (!isAudioMuted) {
            playSynthSound("success");
          }
          speakJarvisVoice(`Diagnostics complete. Core health level stands at ${randHealth} percent.`, isAudioMuted);
        }, 2000);
      } else if (cmd === "clear") {
        setLogs(["TERMINAL BUFFER FLUSHED // PORT OVERRIDE READY"]);
      } else {
        setLogs(prev => [...prev, `ERROR: COMMAND "${cmd.toUpperCase()}" NOT FOUND. TYPE "HELP" FOR COMMAND LIST.`]);
        speakJarvisVoice("Command unrecognized. Please review the command menu.", isAudioMuted);
      }
    }, 400);
  };

  return (
    <GlassCard className="p-8 border-primary/20 bg-black/40 backdrop-blur-3xl overflow-hidden relative shadow-2xl">
      {/* Dynamic Cyber Grid Background */}
      <div className="absolute inset-0 circuit-pattern opacity-10 pointer-events-none z-0" />
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none z-0" />

      {/* Futuristic Scanline */}
      <div className="absolute inset-x-0 h-1.5 bg-primary/20 opacity-30 animate-scan pointer-events-none z-0" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Concentric rotating Jarvis HUD center (LHS) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center relative min-h-[300px]">
          {/* Holographic Radar/Sweeper container */}
          <div className="relative w-64 h-64 flex items-center justify-center">
            
            {/* Ambient Inner Glow Core */}
            <motion.div 
              animate={{
                scale: hudState === "optimizing" ? [1, 1.2, 1] : [1, 1.05, 1],
                opacity: [0.6, 0.9, 0.6]
              }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              className="absolute w-28 h-28 rounded-full bg-primary/10 blur-xl"
            />

            {/* Radar Sweeper beam */}
            <div className="absolute inset-0 rounded-full border border-primary/10 overflow-hidden pointer-events-none">
              <div className="absolute top-1/2 left-1/2 w-[200%] h-[200%] -translate-x-1/2 -translate-y-1/2 animate-radar-sweep pointer-events-none origin-center"
                   style={{
                     background: "conic-gradient(from 0deg, hsl(var(--primary)/0.25) 0deg, transparent 90deg, transparent)"
                   }}
              />
            </div>

            {/* Concentric Ring 1: Speed Orbit (Clockwise) */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
              className="absolute inset-0 border border-primary/20 rounded-full border-dashed"
            >
              {/* Target bracket notches */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-1 bg-primary/50" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-1 bg-primary/50" />
            </motion.div>

            {/* Concentric Ring 2: Core Ring (Counter-Clockwise) */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
              className="absolute inset-4 border border-dashed border-primary/30 rounded-full"
            >
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-primary/60" />
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-primary/60" />
            </motion.div>

            {/* Concentric Ring 3: Data Ring (Clockwise) */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
              className="absolute inset-10 border-2 border-primary/40 rounded-full border-dotted"
            />

            {/* Inner Core: Digital Heartbeat */}
            <div className="absolute w-24 h-24 rounded-full border border-primary/60 bg-black/60 flex flex-col items-center justify-center shadow-[0_0_20px_hsl(var(--primary)/0.3)] z-10">
              <Cpu className={cn(
                "w-8 h-8 text-primary transition-transform duration-300",
                hudState === "optimizing" ? "animate-spin" : "animate-pulse"
              )} />
              <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mt-1">Jarvis.Core</span>
              <span className="text-[10px] font-black text-white font-mono">{systemHealth}% SYS</span>
            </div>

            {/* Orbital stats floating nodes */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-md bg-black/80 border border-primary/30 text-primary text-[8px] font-black uppercase font-mono tracking-widest">
              expectancy // positive
            </div>
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-md bg-black/80 border border-primary/30 text-white text-[8px] font-black uppercase font-mono tracking-widest">
              profit // ${netProfit.toLocaleString()}
            </div>
          </div>

          {/* Interactive controls */}
          <div className="mt-8 flex items-center gap-3 w-full justify-center">
            <button
              onClick={handleToggleMute}
              className={cn(
                "p-3 rounded-xl border transition-all text-xs font-bold uppercase tracking-widest flex items-center gap-2",
                isAudioMuted
                  ? "bg-white/5 border-white/10 text-white/40 hover:text-white"
                  : "bg-primary/20 border-primary text-primary shadow-lg shadow-primary/10 animate-pulse-glow"
              )}
            >
              {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span>Voice Interface {isAudioMuted ? "Muted" : "Active"}</span>
            </button>
            
            <button
              onClick={() => {
                setInputText("optimize");
                setTimeout(() => handleSendCommand(), 100);
              }}
              className="p-3 rounded-xl bg-primary text-primary-foreground border border-primary text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_hsl(var(--primary)/0.3)] flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
              <span>Recalibrate</span>
            </button>
          </div>
        </div>

        {/* Real-time Diagnostics log terminal & interactive commands console (RHS) */}
        <div className="lg:col-span-7 flex flex-col h-[320px] bg-black/50 border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
          {/* Glowing HUD headers */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white">Advisory Systems Terminal</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
              <span className="text-[8px] font-black text-green-400 uppercase tracking-widest">Operator Linked</span>
            </div>
          </div>

          {/* Scrolling Terminal stream */}
          <div className="flex-1 overflow-y-auto font-mono text-[10px] space-y-2 mb-4 scrollbar-thin scrollbar-thumb-white/10 pr-2">
            {logs.map((log, idx) => (
              <div key={idx} className={cn(
                "leading-relaxed transition-all duration-300",
                log.startsWith("OPERATOR>") ? "text-primary font-bold" : 
                log.includes("ERROR:") ? "text-destructive" :
                log.includes(">>") ? "text-yellow-400/90 pl-3" : "text-white/60 hover:text-white"
              )}>
                {log}
              </div>
            ))}
            <div ref={terminalEndRef} />
          </div>

          {/* Voice audio visualizer simulation */}
          {!isAudioMuted && (
            <div className="absolute right-6 top-16 flex items-end gap-0.5 h-8">
              <div className="w-[1.5px] bg-primary animate-sound-bar" style={{ animationDelay: "0.1s" }} />
              <div className="w-[1.5px] bg-primary animate-sound-bar" style={{ animationDelay: "0.4s" }} />
              <div className="w-[1.5px] bg-primary animate-sound-bar" style={{ animationDelay: "0.2s" }} />
              <div className="w-[1.5px] bg-primary animate-sound-bar" style={{ animationDelay: "0.5s" }} />
              <div className="w-[1.5px] bg-primary animate-sound-bar" style={{ animationDelay: "0.3s" }} />
            </div>
          )}

          {/* Command override input */}
          <form onSubmit={handleSendCommand} className="flex gap-2">
            <div className="flex-1 relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-mono text-xs font-black select-none pointer-events-none">&gt;</span>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="INPUT OVERRIDE PROTOCOL (E.G. STATUS, RISK, OPTIMIZE)..."
                className="w-full h-11 bg-white/[0.03] border border-white/10 rounded-xl pl-8 pr-4 font-mono text-[9px] uppercase tracking-widest text-white placeholder:text-white/15 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 focus:bg-white/[0.05] transition-all"
              />
            </div>
            <button
              type="submit"
              className="h-11 w-11 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all flex items-center justify-center cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </GlassCard>
  );
}
