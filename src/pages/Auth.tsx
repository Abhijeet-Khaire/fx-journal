import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Shield, Zap, Users, Globe, ChevronRight, Check, Loader2 } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";

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
    const [error, setError] = useState<string | null>(null);

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
            setError("All fields are required");
            return false;
        }
        if (!/^\S+@\S+\.\S+$/.test(email)) {
            setError("Invalid email format");
            return false;
        }
        if (type === "signup" && password.length < 6) {
            setError("Password must be at least 6 characters");
            return false;
        }
        setError(null);
        return true;
    };

    const handleAuth = async (type: "login" | "signup") => {
        if (!validateForm(type)) return;
        setLoading(true);
        try {
            if (type === "signup") {
                await createUserWithEmailAndPassword(auth, email, password);
                toast.success("Account created successfully!");
            } else {
                await signInWithEmailAndPassword(auth, email, password);
                toast.success("Logged in successfully!");
            }
            // Navigation is handled by useEffect when user state updates
        } catch (error: any) {
            console.error("Auth error:", error);
            toast.error(error.message);
            setError(error.message);
            setLoading(false);
        }
    };

    const benefits = [
        { icon: TrendingUp, text: "Advanced Equity Curves" },
        { icon: Shield, text: "AI-Powered Risk Analysis" },
        { icon: Zap, text: "Real-time Trade Journaling" },
        { icon: Globe, text: "Advanced Analytics" },
    ];

    return (
        <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-background overflow-hidden relative">
            {/* Left Side - Hero & Data */}
            <div className="relative hidden lg:flex flex-col justify-center p-12 bg-secondary/10 border-r border-border/50">
                {/* Floating Elements Background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {[...Array(5)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute rounded-full bg-primary/5 blur-3xl"
                            style={{
                                width: Math.random() * 300 + 100,
                                height: Math.random() * 300 + 100,
                                top: `${Math.random() * 100}%`,
                                left: `${Math.random() * 100}%`,
                            }}
                            animate={{
                                y: [0, -50, 0],
                                scale: [1, 1.2, 1],
                                opacity: [0.3, 0.6, 0.3],
                            }}
                            transition={{
                                duration: Math.random() * 5 + 5,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                        />
                    ))}
                </div>

                <div className="relative z-10 max-w-lg mx-auto space-y-12">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-4"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-primary/20 backdrop-blur-md border border-primary/30">
                                <TrendingUp className="w-8 h-8 text-primary" />
                            </div>
                            <h1 className="text-4xl font-bold tracking-tight">Zenith Journal</h1>
                        </div>
                        <p className="text-xl text-muted-foreground leading-relaxed">
                            Master your trading psychology and track your edge with the #1 automated trading journal for serious forex traders.
                        </p>
                    </motion.div>

                    {/* Live Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <GlassCard className="p-6 border-primary/20">
                            <div className="flex items-center gap-3 mb-2">
                                <Users className="w-5 h-5 text-blue-500" />
                                <span className="text-xs font-semibold uppercase text-muted-foreground">Active Traders</span>
                            </div>
                            <div className="text-3xl font-bold tabular-nums">
                                {activeTraders.toLocaleString()}
                            </div>
                        </GlassCard>
                        <GlassCard className="p-6 border-profit/20">
                            <div className="flex items-center gap-3 mb-2">
                                <Globe className="w-5 h-5 text-profit" />
                                <span className="text-xs font-semibold uppercase text-muted-foreground">Total PnL Tracked</span>
                            </div>
                            <div className="text-3xl font-bold tabular-nums text-profit">
                                ${(totalProfit / 1000000).toFixed(1)}M+
                            </div>
                        </GlassCard>
                    </div>

                    {/* Benefits List */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-foreground/80">Why Top Traders Choose Us</h3>
                        <div className="grid grid-cols-1 gap-3">
                            {benefits.map((b, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 + (i * 0.1) }}
                                    className="flex items-center gap-3 p-3 rounded-lg bg-background/40 border border-white/5 backdrop-blur-sm hover:bg-background/60 transition-colors"
                                >
                                    <div className="p-2 rounded-full bg-primary/10 text-primary">
                                        <b.icon className="w-4 h-4" />
                                    </div>
                                    <span className="font-medium">{b.text}</span>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Auth Form */}
            <div className="relative flex items-center justify-center p-4 lg:p-12">
                {/* Mobile Background Effect */}
                <div className="lg:hidden absolute inset-0 overflow-hidden -z-10">
                    <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[100px]" />
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="w-full max-w-md space-y-8"
                >
                    <div className="lg:hidden text-center mb-8">
                        <h1 className="text-3xl font-bold mb-2">Zenith Journal</h1>
                        <p className="text-muted-foreground">Your premium forex trading companion</p>
                    </div>

                    <GlassCard className="p-8 shadow-2xl border-primary/10">
                        <Tabs defaultValue="login" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 mb-8 bg-secondary/50 p-1">
                                <TabsTrigger value="login" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Login</TabsTrigger>
                                <TabsTrigger value="signup" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Sign Up</TabsTrigger>
                            </TabsList>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive flex items-center gap-2"
                                >
                                    <Shield className="w-4 h-4" />
                                    {error}
                                </motion.div>
                            )}

                            <AnimatePresence mode="wait">
                                <TabsContent value="login" key="login" className="mt-0">
                                    <motion.div
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.2 }}
                                        className="space-y-4"
                                    >
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="trader@example.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                disabled={loading}
                                                className="glass-input h-11"
                                                spellCheck={false}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="password">Password</Label>
                                                <button type="button" className="text-xs text-primary hover:underline">Forgot?</button>
                                            </div>
                                            <Input
                                                id="password"
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                disabled={loading}
                                                className="glass-input h-11"
                                            />
                                        </div>
                                        <Button
                                            className="w-full h-11 text-base font-semibold mt-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all duration-200"
                                            onClick={() => handleAuth("login")}
                                            disabled={loading}
                                        >
                                            {loading ? (
                                                <div className="flex items-center gap-2">
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    <span>Verifying Access...</span>
                                                </div>
                                            ) : (
                                                "Login to Dashboard"
                                            )}
                                        </Button>
                                    </motion.div>
                                </TabsContent>

                                <TabsContent value="signup" key="signup" className="mt-0">
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        transition={{ duration: 0.2 }}
                                        className="space-y-4"
                                    >
                                        <div className="space-y-2">
                                            <Label htmlFor="signup-email">Email</Label>
                                            <Input
                                                id="signup-email"
                                                type="email"
                                                placeholder="trader@example.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                disabled={loading}
                                                className="glass-input h-11"
                                                spellCheck={false}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="signup-password">Password</Label>
                                            <Input
                                                id="signup-password"
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                disabled={loading}
                                                className="glass-input h-11"
                                                placeholder="Create a strong password"
                                                spellCheck={false}
                                            />
                                        </div>
                                        <div className="space-y-3 pt-2">
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Check className="w-3 h-3 text-primary" />
                                                <span>Free 14-day Pro trial included</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Check className="w-3 h-3 text-primary" />
                                                <span>No credit card required</span>
                                            </div>
                                        </div>
                                        <Button
                                            className="w-full h-11 text-base font-semibold mt-4 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all duration-200"
                                            onClick={() => handleAuth("signup")}
                                            disabled={loading}
                                        >
                                            {loading ? (
                                                <div className="flex items-center gap-2">
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    <span>Creating Your Account...</span>
                                                </div>
                                            ) : (
                                                "Create Free Account"
                                            )}
                                        </Button>
                                    </motion.div>
                                </TabsContent>
                            </AnimatePresence>
                        </Tabs>

                        <div className="mt-8 text-center text-xs text-muted-foreground">
                            By continuing, you agree to our <Link to="/terms" className="underline hover:text-foreground cursor-pointer">Terms of Service</Link> and <Link to="/privacy" className="underline hover:text-foreground cursor-pointer">Privacy Policy</Link>.
                        </div>
                    </GlassCard>
                </motion.div>
            </div>
        </div>
    );
}
