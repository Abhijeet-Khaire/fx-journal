import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Terminal, Shield, Globe, Lock, Cpu, Activity, Loader2 } from "lucide-react";

interface LoadingScreenProps {
    message?: string;
    subMessage?: string;
    className?: string;
}

const STATUS_MESSAGES = [
    "Initializing Zenith Core...",
    "Establishing neural handshake...",
    "Syncing market liquidity node-04...",
    "Verifying ledger integrity...",
    "Encrypting session protocols...",
    "Zenith Protocol 7.42 // Active",
    "Optimizing data streams...",
    "Identity matrix verified.",
];

const TELEMETRY_POINTS = [
    { label: "LATENCY", value: "12ms", icon: Activity, color: "text-cyan-400" },
    { label: "ENCRYPTION", value: "AES-256", icon: Lock, color: "text-emerald-400" },
    { label: "UPLINK", value: "STABLE", icon: Globe, color: "text-blue-400" },
    { label: "CPU", value: "4.2GHz", icon: Cpu, color: "text-purple-400" },
];

export function LoadingScreen({ message = "ZENITH INITIALIZING", subMessage, className }: LoadingScreenProps) {
    const [statusIndex, setStatusIndex] = useState(0);
    const [displayedText, setDisplayedText] = useState("");
    const [lottieLoaded, setLottieLoaded] = useState(false);
    const [LottieComponent, setLottieComponent] = useState<any>(null);
    const [animationData, setAnimationData] = useState<any>(null);

    // Typing effect for status messages
    useEffect(() => {
        const fullText = subMessage || STATUS_MESSAGES[statusIndex];
        let i = 0;
        setDisplayedText("");
        
        const typingInterval = setInterval(() => {
            if (i < fullText.length) {
                setDisplayedText((prev) => prev + fullText.charAt(i));
                i++;
            } else {
                clearInterval(typingInterval);
                if (!subMessage) {
                    setTimeout(() => {
                        setStatusIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
                    }, 3000);
                }
            }
        }, 30);

        return () => clearInterval(typingInterval);
    }, [statusIndex, subMessage]);

    // Dynamic loading of Lottie and JSON from public animations
    useEffect(() => {
        const loadLottie = import("lottie-react")
            .then((mod) => mod.default)
            .catch(() => null);

        const loadAnimData = fetch("/animations/loading.json")
            .then(res => res.json())
            .catch(() => null);

        Promise.all([loadLottie, loadAnimData]).then(([LottieMod, animData]) => {
            if (LottieMod && animData) {
                setLottieComponent(() => LottieMod);
                setAnimationData(animData);
                setLottieLoaded(true);
            }
        });
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#020406] overflow-hidden ${className}`}
        >
            {/* Immersive Background Layering */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 mesh-gradient opacity-40" />
                <div className="absolute inset-0 hex-grid opacity-20" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,211,238,0.05)_0%,transparent_70%)]" />
                
                {/* Moving Scanline */}
                <div className="absolute inset-x-0 h-px bg-cyan-500/20 animate-scan opacity-40 shadow-[0_0_10px_#22d3ee]" 
                     style={{ top: "0%" }} />
            </div>

            {/* Floating Telemetry Decor */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                {TELEMETRY_POINTS.map((point, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8 + idx * 0.2 }}
                        className="absolute hidden md:flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl animate-drift"
                        style={{
                            top: `${15 + idx * 22}%`,
                            left: idx % 2 === 0 ? "8%" : "auto",
                            right: idx % 2 !== 0 ? "8%" : "auto",
                        }}
                    >
                        <div className={`p-1.5 rounded-lg bg-white/5 ${point.color}`}>
                            <point.icon className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] text-white/30 font-black tracking-[0.2em]">{point.label}</span>
                            <span className="text-[11px] text-white/80 font-mono font-bold">{point.value}</span>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="relative z-10 flex flex-col items-center max-w-lg w-full px-6 text-center">
                {/* Central Animation Hub */}
                <div className="relative mb-12 group">
                    <motion.div 
                        animate={{ 
                            scale: [0.8, 1.2, 0.8],
                            opacity: [0.1, 0.4, 0.1]
                        }}
                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-0 bg-cyan-500 blur-[100px] rounded-full scale-75" 
                    />
                    
                    <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
                        {lottieLoaded && LottieComponent && animationData ? (
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
                                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                                transition={{ type: "spring", stiffness: 100, damping: 20 }}
                                className="w-full h-full relative z-10"
                            >
                                <LottieComponent 
                                    animationData={animationData} 
                                    loop={true} 
                                    className="w-full h-full filter contrast-125 brightness-110 drop-shadow-[0_0_30px_rgba(34,211,238,0.6)]"
                                />
                            </motion.div>
                        ) : (
                            <div className="relative z-10 flex flex-col items-center gap-6">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    className="w-24 h-24 rounded-full border-t-2 border-r-2 border-cyan-500 shadow-[0_0_50px_rgba(34,211,238,0.5)] flex items-center justify-center"
                                >
                                    <Loader2 className="w-10 h-10 text-cyan-400 animate-pulse" />
                                </motion.div>
                                <div className="space-y-1">
                                    <p className="text-[12px] text-cyan-500 font-black tracking-[0.3em] uppercase">LINKING_NODE</p>
                                    <p className="text-[9px] text-white/30 font-mono uppercase tracking-[0.4em]">Secure_Protocol_Sync</p>
                                </div>
                            </div>
                        )}
                        
                        {/* Interactive HUD Elements */}
                        <div className="absolute inset-0 border border-white/5 rounded-full scale-110 animate-spin-slow opacity-20" />
                        <div className="absolute inset-0 border-2 border-dashed border-cyan-500/10 rounded-full scale-125 animate-spin-slow" 
                             style={{ animationDirection: "reverse", animationDuration: "12s" }} />
                    </div>
                </div>

                {/* Status UI Container */}
                <div className="w-full max-w-sm space-y-10 relative">
                    <div className="space-y-3">
                        <motion.h2 
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-3xl md:text-5xl font-black text-white tracking-[0.4em] uppercase drop-shadow-[0_0_15px_rgba(34,211,238,0.4)]"
                        >
                            {message}
                        </motion.h2>
                        <div className="flex justify-center gap-3">
                            {[...Array(5)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    animate={{ 
                                        opacity: [0.1, 1, 0.1],
                                        scale: [1, 1.8, 1],
                                    }}
                                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.15 }}
                                    className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]"
                                />
                            ))}
                        </div>
                    </div>

                    <div className="glass p-6 space-y-5 border-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] relative overflow-hidden group">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.05)_0%,transparent_50%)]" />
                        
                        <div className="flex items-center justify-between text-[11px] text-cyan-400 font-black tracking-[0.25em]">
                            <div className="flex items-center gap-2.5">
                                <Terminal className="w-4 h-4" />
                                <span>TERMINAL_STATUS</span>
                            </div>
                            <span className="opacity-40 font-mono">[{statusIndex + 1}/{STATUS_MESSAGES.length}]</span>
                        </div>
                        
                        <div className="h-6 flex items-center justify-center">
                            <p className="text-[12px] font-mono font-bold text-white/80 tracking-widest flex items-center">
                                {displayedText}
                                <motion.span 
                                    animate={{ opacity: [1, 0, 1] }} 
                                    transition={{ duration: 0.8, repeat: Infinity }}
                                    className="inline-block w-2 h-4 bg-cyan-500 ml-1.5" 
                                />
                            </p>
                        </div>
                        
                        {/* Real-time Progress Bar */}
                        <div className="relative w-full h-1.5 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                            <motion.div
                                initial={{ width: "0%" }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                className="h-full bg-cyan-500 shadow-[0_0_20px_#22d3ee] rounded-full"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer Hardware Info */}
                <div className="mt-16 flex items-center gap-16 text-[10px] font-black text-white/15 tracking-[0.35em] uppercase">
                    <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/30 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                        SECURE_BOOT: ENABLED
                    </div>
                    <div className="flex items-center gap-3">
                        <Shield className="w-4 h-4 opacity-30" />
                        ZENITH_CORE_v7.4
                    </div>
                </div>
            </div>

            {/* Vertical HUD Scanning Pillars */}
            <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-transparent via-cyan-500/10 to-transparent opacity-30" />
            <div className="absolute inset-y-0 right-0 w-1 bg-gradient-to-b from-transparent via-cyan-500/10 to-transparent opacity-30" />
        </motion.div>
    );
}
