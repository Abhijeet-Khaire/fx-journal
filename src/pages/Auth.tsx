import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
    TrendingUp, Shield, Zap, Globe, Loader2,
    Terminal, Activity, Radio, Cpu, Lock, Eye, EyeOff,
    Check, ChevronRight
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { AnimatedCounter } from "@/components/AnimatedCounter";

export default function Auth() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            navigate("/");
        }
    }, [user, navigate]);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    // Simulated Live Data
    const [activeTraders, setActiveTraders] = useState(12453);
    const [totalProfit, setTotalProfit] = useState(4523000);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveTraders(prev => prev + Math.floor(Math.random() * 3));
            setTotalProfit(prev => prev + Math.floor(Math.random() * 500));
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const validateForm = (type: "login" | "signup") => {
        if (!email || !password) {
            setError("All credentials required");
            return false;
        }
        if (type === "signup" && !displayName) {
            setError("Trader Name required for registration");
            return false;
        }
        if (!/^\S+@\S+\.\S+$/.test(email)) {
            setError("Invalid format: Email address error");
            return false;
        }
        if (type === "signup" && password.length < 6) {
            setError("Security: Password too short");
            return false;
        }
        setError(null);
        return true;
    };

    const handleKeyDown = (e: React.KeyboardEvent, type: "login" | "signup") => {
        if (e.key === "Enter") {
            handleAuth(type);
        }
    };

    const handleAuth = async (type: "login" | "signup") => {
        if (!validateForm(type)) return;
        setLoading(true);
        try {
            if (type === "signup") {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await updateProfile(userCredential.user, {
                    displayName: displayName
                });
                toast.success("Identity established successfully!");
            } else {
                await signInWithEmailAndPassword(auth, email, password);
                toast.success("Access granted. Welcome back, Trader.");
            }
        } catch (error: any) {
            console.error("Authentication error:", error);
            const message = error.code === 'auth/user-not-found' ? "Account not found" :
                error.code === 'auth/wrong-password' ? "Invalid password" :
                    error.message;
            toast.error(message);
            setError(message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#020406] overflow-hidden relative font-sans">
            {/* Global Immersive Background System */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div 
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
                    style={{ backgroundImage: "url('/images/auth-bg.png')" }}
                />
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
                
                {/* Cyberpunk Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_60%,transparent_100%)] opacity-30" />
            </div>

            {/* Submission Animation Overlay (Global Center) */}
            <AnimatePresence>
                {loading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/60 backdrop-blur-xl"
                    >
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.05)_1px,transparent_1px)] bg-[size:100%_4px] animate-scan" />
                        <div className="relative space-y-6 text-center">
                            <div className="relative">
                                <motion.div
                                    animate={{
                                        rotate: 360,
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: "linear",
                                    }}
                                    className="w-24 h-24 rounded-full border-t-2 border-r-2 border-cyan-500 shadow-[0_0_30px_rgba(34,211,238,0.3)]"
                                />
                                <Terminal className="absolute inset-0 m-auto w-8 h-8 text-cyan-500 animate-pulse" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.4em] animate-pulse">Establishing Link</p>
                                <div className="flex gap-1 justify-center">
                                    {[...Array(3)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            animate={{ opacity: [0.2, 1, 0.2] }}
                                            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                                            className="w-1 h-1 bg-cyan-400 rounded-full"
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content Layout */}
            <div className="relative z-10 w-full min-h-screen py-10 lg:py-0 flex flex-col lg:flex-row lg:divide-x lg:divide-white/5 scrollbar-none overflow-y-auto lg:overflow-hidden">
                
                {/* Left Side: Brand & Visuals */}
                <div className="flex-1 flex flex-col justify-center px-6 md:px-12 lg:px-24 relative overflow-hidden mb-12 lg:mb-0">
                    {/* Animated Wireframe Background */}
                    <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] opacity-10 pointer-events-none" viewBox="0 0 100 100">
                        <path d="M10,10 L90,10 L90,90 L10,90 Z" fill="none" stroke="cyan" strokeWidth="0.1" />
                        <path d="M10,10 L50,50 L90,10" fill="none" stroke="cyan" strokeWidth="0.1" />
                        <circle cx="50" cy="50" r="40" fill="none" stroke="cyan" strokeWidth="0.05" />
                        {/* More grid-like lines could be added here */}
                        {[...Array(10)].map((_, i) => (
                            <line key={i} x1="0" y1={i * 10} x2="100" y2={i * 10} stroke="cyan" strokeWidth="0.02" />
                        ))}
                    </svg>

                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 1 }}
                        className="space-y-12 relative z-10"
                    >
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 backdrop-blur-md"
                        >
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">PROTOCOL 7.42 // ACTIVE</span>
                        </motion.div>

                        <div className="space-y-4">
                            <h1 className="text-[4rem] sm:text-[6rem] lg:text-[9rem] font-black leading-[0.8] tracking-tighter uppercase text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                                <span className="block ">ZENITH</span>
                                <span className="block text-cyan-400">JOURNAL</span>
                            </h1>
                            <p className="text-lg lg:text-2xl text-white/40 font-light max-w-xl  leading-relaxed">
                                The pinnacle of <span className="text-white font-medium">quantitative trading</span> psychology. Master the markets from within.
                            </p>
                        </div>

                        {/* Interactive Stats */}
                        <div className="flex flex-wrap gap-4 md:gap-8">
                            <div className="flex flex-col gap-4 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] bg-white/[0.03] border border-white/10 backdrop-blur-2xl flex-1 md:min-w-[200px] hover:border-cyan-500/40 transition-all group">
                                <div className="flex items-center gap-3 text-white/40">
                                    <Activity className="w-4 md:w-5 h-4 md:h-5 text-cyan-500" />
                                    <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-nowrap">NETWORK ACTIVITY</span>
                                </div>
                                <div className="text-3xl md:text-5xl font-black  tracking-tighter text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.3)]">
                                    <AnimatedCounter value={activeTraders} />
                                </div>
                            </div>

                            <div className="flex items-center gap-6 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] bg-white/[0.03] border border-white/10 backdrop-blur-2xl flex-1 md:min-w-[280px] hover:border-emerald-500/40 transition-all group overflow-hidden relative">
                                <div className="flex flex-col gap-4 relative z-10">
                                    <div className="flex items-center gap-3 text-white/40">
                                        <TrendingUp className="w-4 md:w-5 h-4 md:h-5 text-emerald-400" />
                                        <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-nowrap">LIQUIDITY LOGGED</span>
                                    </div>
                                    <div className="text-3xl md:text-5xl font-black  tracking-tighter text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                                        ${(totalProfit / 1000000).toFixed(1)}M+
                                    </div>
                                </div>
                                {/* Globe Visualizer */}
                                <div className="absolute right-[-10%] top-1/2 -translate-y-1/2 w-24 md:w-32 h-24 md:h-32 opacity-40 group-hover:scale-110 transition-transform duration-700">
                                    <div className="w-full h-full rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin-slow" />
                                    <Globe className="absolute inset-0 m-auto w-12 md:w-16 h-12 md:h-16 text-emerald-500/60" />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Right Side: Access Terminal */}
                <div className="w-full lg:w-[450px] bg-black/40 backdrop-blur-[60px] flex flex-col items-center justify-center p-6 md:p-8 relative overflow-hidden">
                    {/* Terminal Frame Decor */}
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
                    <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
                    
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-[340px] space-y-10"
                    >
                        <div className="text-center space-y-2">
                            <h2 className="text-3xl font-black  uppercase tracking-tighter text-white">ACCESS TERMINAL</h2>
                            <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.4em]">IDENTITY VERIFICATION REQUIRED</p>
                        </div>

                        <div className="relative p-1 rounded-[2.5rem] bg-gradient-to-b from-white/10 to-transparent border border-white/5">
                            <Tabs defaultValue="login" className="w-full">
                                <TabsList className="grid w-full grid-cols-2 mb-8 bg-black/40 p-1.5 rounded-[1.8rem] h-14 border border-white/5">
                                    <TabsTrigger
                                        value="login"
                                        className="rounded-[1.4rem] h-full text-[11px] font-black uppercase tracking-widest  transition-all data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                                    >
                                        LOGIN
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="signup"
                                        className="rounded-[1.4rem] h-full text-[11px] font-black uppercase tracking-widest  transition-all data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                                    >
                                        JOIN
                                    </TabsTrigger>
                                </TabsList>

                                <AnimatePresence mode="wait">
                                    <TabsContent value="login" key="login" className="mt-0 space-y-8 p-1">
                                        <div className="space-y-6">
                                            <div className="space-y-2.5">
                                                <Label className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] ml-2">TRADER_ID</Label>
                                                <div className="relative group">
                                                    <Input
                                                        type="email"
                                                        placeholder="EMAIL@PROTOCOL.AI"
                                                        value={email}
                                                        onChange={(e) => setEmail(e.target.value)}
                                                        onKeyDown={(e) => handleKeyDown(e, "login")}
                                                        className="h-14 bg-white/[0.03] border-white/5 rounded-2xl px-6 focus:ring-cyan-500/20 focus:border-cyan-500/40 transition-all font-bold tracking-tight text-white placeholder:text-white/10"
                                                        disabled={loading}
                                                    />
                                                    <Globe className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/10 group-focus-within:text-cyan-500/30" />
                                                </div>
                                            </div>

                                            <div className="space-y-2.5">
                                                <div className="flex justify-between items-center ml-2">
                                                    <Label className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em]">SEC_KEY</Label>
                                                    <button type="button" className="text-[8px] font-bold text-cyan-500/40 hover:text-cyan-400 uppercase tracking-widest ">RECOVER</button>
                                                </div>
                                                <div className="relative group">
                                                    <Input
                                                        type={showPassword ? "text" : "password"}
                                                        placeholder="••••••••"
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                        onKeyDown={(e) => handleKeyDown(e, "login")}
                                                        className="h-14 bg-white/[0.03] border-white/5 rounded-2xl px-6 focus:ring-cyan-500/20 focus:border-cyan-500/40 transition-all font-bold text-white placeholder:text-white/10 pr-14"
                                                        disabled={loading}
                                                    />
                                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-3">
                                                        <button 
                                                            type="button" 
                                                            onClick={() => setShowPassword(!showPassword)}
                                                            className="text-white/20 hover:text-white/60 transition-colors"
                                                        >
                                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                        </button>
                                                        <Lock className="w-4 h-4 text-white/10 group-focus-within:text-cyan-500/30" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 ml-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setRememberMe(!rememberMe)}
                                                    className={cn(
                                                        "w-4 h-4 rounded border flex items-center justify-center transition-all",
                                                        rememberMe ? "base-cyan border-cyan-500 text-black shadow-[0_0_15px_rgba(34,211,238,0.4)]" : "bg-white/5 border-white/10 text-transparent"
                                                    )}
                                                >
                                                    <Check className="w-3 h-3" />
                                                </button>
                                                <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest cursor-pointer" onClick={() => setRememberMe(!rememberMe)}>
                                                    PERSIST_LOCAL_STATE
                                                </span>
                                            </div>

                                            <Button
                                                onClick={() => handleAuth("login")}
                                                disabled={loading}
                                                className="w-full h-16 rounded-[2rem] bg-cyan-400 text-black font-black  uppercase tracking-[0.4em] hover:bg-cyan-300 hover:scale-[1.02] active:scale-[0.98] transition-all duration-500 shadow-[0_10px_40px_-5px_rgba(34,211,238,0.5)] text-sm group"
                                            >
                                                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                                                    <span className="flex items-center gap-2">
                                                        INITIATE_SESSION
                                                    </span>
                                                )}
                                            </Button>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="signup" key="signup" className="mt-0 space-y-6 p-1">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] ml-2">ALIAS</Label>
                                                <Input
                                                    type="text"
                                                    placeholder="ALPHA_TRADER"
                                                    value={displayName}
                                                    onChange={(e) => setDisplayName(e.target.value)}
                                                    onKeyDown={(e) => handleKeyDown(e, "signup")}
                                                    className="h-14 bg-white/[0.03] border-white/5 rounded-2xl px-6 focus:ring-cyan-500/20 focus:border-cyan-500/40 text-white font-bold"
                                                    disabled={loading}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] ml-2">EMAIL</Label>
                                                <Input
                                                    type="email"
                                                    placeholder="TRADER@ZENITH.AI"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    onKeyDown={(e) => handleKeyDown(e, "signup")}
                                                    className="h-14 bg-white/[0.03] border-white/5 rounded-2xl px-6 focus:ring-cyan-500/20 focus:border-cyan-500/40 text-white font-bold"
                                                    disabled={loading}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] ml-2">SEC_CODE</Label>
                                                <Input
                                                    type="password"
                                                    placeholder="••••••••"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    onKeyDown={(e) => handleKeyDown(e, "signup")}
                                                    className="h-14 bg-white/[0.03] border-white/5 rounded-2xl px-6 focus:ring-cyan-500/20 focus:border-cyan-500/40 text-white font-bold"
                                                    disabled={loading}
                                                />
                                            </div>
                                            <Button
                                                onClick={() => handleAuth("signup")}
                                                disabled={loading}
                                                className="w-full h-16 rounded-[2rem] bg-cyan-400 text-black font-black  uppercase tracking-[0.4em] hover:bg-cyan-300 transition-all shadow-[0_10px_40px_-5px_rgba(34,211,238,0.5)] mt-4"
                                            >
                                                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "ESTABLISH_IDENTITY"}
                                            </Button>
                                        </div>
                                    </TabsContent>
                                </AnimatePresence>
                            </Tabs>
                        </div>

                        {/* Social Auth */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="h-px flex-1 bg-white/5" />
                                <span className="text-[8px] font-black text-white/10 uppercase tracking-[0.5em]">OR CONNECT VIA</span>
                                <div className="h-px flex-1 bg-white/5" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <button className="h-12 flex items-center justify-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all group">
                                    <Globe className="w-4 h-4 text-white/20 group-hover:text-white transition-colors" />
                                    <span className="text-[9px] font-black text-white/30 group-hover:text-white uppercase tracking-widest">GOOGLE NODE</span>
                                </button>
                                <button className="h-12 flex items-center justify-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all group">
                                    <Lock className="w-4 h-4 text-white/20 group-hover:text-white transition-colors" />
                                    <span className="text-[9px] font-black text-white/30 group-hover:text-white uppercase tracking-widest">APPLE AUTH</span>
                                </button>
                            </div>
                        </div>

                        <div className="text-center">
                            <p className="text-[8px] font-bold text-white/10 uppercase tracking-[0.6em]  leading-tight">
                                LINK SECURED. <span className="text-cyan-500/30">PROTOCOL_EXT</span>
                            </p>
                            <Link to="/" className="mt-8 inline-block opacity-20 hover:opacity-100 transition-opacity">
                                <img src="/favicon.svg" alt="Zenith" className="w-6 h-6 grayscale brightness-200" />
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Scanline Effect */}
            <div className="absolute inset-0 pointer-events-none z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[size:100%_4px,3px_100%]" />
        </div>
    );
}
