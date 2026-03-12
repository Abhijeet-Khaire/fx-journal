import { motion } from "framer-motion";
import { Check, X, Loader2, Shield, Zap, Crown, Target, Activity, Lock, ArrowRight, Fingerprint, Cpu } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { usePlan } from "@/hooks/usePlan";
import { toast } from "sonner";
import { useState } from "react";
import { Plan } from "@/lib/tradeTypes";
import { cn } from "@/lib/utils";

export default function Plans() {
    const { plan: currentPlan, upgradePlan } = usePlan();
    const [loading, setLoading] = useState<string | null>(null);

    const handleUpgrade = async (plan: Plan) => {
        if (plan === currentPlan) return;
        setLoading(plan);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        upgradePlan(plan);
        toast.success(`Account Tier Updated: ${plan.toUpperCase()}`);
        setLoading(null);
    };

    const plans = [
        {
            id: "free" as Plan,
            name: "Standard",
            code: "STANDARD_TRADER",
            price: "$0",
            period: "/mo",
            description: "Entry-level journaling for focused traders.",
            icon: Shield,
            color: "text-muted-foreground",
            glow: "group-hover:shadow-white/5",
            features: [
                "50 Trade Journaling",
                "Basic Performance Metrics",
                "Manual Data Entry",
                "Market Insights",
            ],
            notIncluded: [
                "Unlimited Journaling",
                "Advanced Edge Analytics",
                "Equity Curve",
                "Risk Oversight",
                "Psychology Analysis",
            ],
            cta: "Current Plan",
        },
        {
            id: "pro" as Plan,
            name: "Professional",
            code: "PRO_STRATEGIST",
            price: "$12",
            period: "/mo",
            description: "Advanced heuristics and unlimited trade analytics.",
            icon: Zap,
            color: "text-primary",
            glow: "group-hover:shadow-primary/20",
            features: [
                "Unlimited Journaling",
                "Advanced Edge Analytics",
                "Discipline Heuristics",
                "Equity Curve Performance",
                "Strategy Attribution Analysis",
                "Priority Support",
            ],
            notIncluded: [
                "Psychology Analysis",
                "Strategy Playbook",
                "Risk Oversight",
                "External Data Sync",
            ],
            cta: "Upgrade Plan",
            popular: true,
        },
        {
            id: "ultimate" as Plan,
            name: "Institutional",
            code: "INSTITUTIONAL_ACCESS",
            price: "$39",
            period: "/mo",
            description: "Full spectrum AI performance and risk oversight.",
            icon: Crown,
            color: "text-profit",
            glow: "group-hover:shadow-profit/20",
            features: [
                "Everything in Professional",
                "Psychology Analysis",
                "Strategy Playbook",
                "Risk Oversight",
                "Broker API Sync",
                "Risk Guard System",
            ],
            notIncluded: [],
            cta: "Select Institutional",
        },
    ];

    return (
        <div className="space-y-16 pb-20">
            {/* Header - Account Tiers */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-[2.5rem] p-10 border border-white/10 bg-black/40 backdrop-blur-3xl group shadow-2xl text-center"
            >
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity text-primary">
                    <Fingerprint className="w-48 h-48" />
                </div>
                <div className="absolute top-0 left-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity text-primary">
                    <Cpu className="w-48 h-48" />
                </div>

                <div className="relative z-10 space-y-6 max-w-3xl mx-auto">
                    <div className="flex justify-center">
                        <div className="px-4 py-1 rounded-full bg-primary/10 border border-primary/20 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-primary animate-pulse" />
                            <span className="text-[10px] font-black tracking-[0.3em] uppercase text-primary">System Status: Active</span>
                        </div>
                    </div>
                    <div>
                        <h1 className="text-6xl font-black tracking-tighter text-white uppercase italic">Pricing <span className="text-primary not-italic">Tiers</span></h1>
                        <p className="text-muted-foreground text-xl font-medium mt-4">
                            Enhance your trading environment with advanced account tiers. 
                            Unlock <span className="text-white font-bold italic">AI Analytics</span> and <span className="text-white font-bold italic">Risk Oversight</span> modules.
                        </p>
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {plans.map((p, index) => {
                    const isCurrent = p.id === currentPlan;
                    const PlanIcon = p.icon;
                    return (
                        <motion.div
                            key={p.name}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="group"
                        >
                            <GlassCard
                                className={cn(
                                    "h-full flex flex-col relative p-10 rounded-[2.5rem] border-white/5 transition-all duration-500",
                                    p.glow,
                                    isCurrent ? "border-white/20 bg-white/5" : "hover:border-white/20",
                                    p.popular && !isCurrent ? "border-primary/30" : ""
                                )}
                                hover={true}
                            >
                                {p.popular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-black px-6 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 z-20">
                                        Recommended Choice
                                    </div>
                                )}

                                <div className="mb-10">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className={cn("p-4 rounded-3xl bg-white/5 border border-white/10", p.color)}>
                                            <PlanIcon className="w-8 h-8" />
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-4xl font-black italic text-white tracking-tighter">{p.price}</span>
                                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{p.period}</span>
                                        </div>
                                    </div>
                                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2">{p.name}</h3>
                                    <p className="text-[10px] font-black text-primary tracking-[0.2em] mb-4">{p.code}</p>
                                    <p className="text-sm text-muted-foreground font-medium leading-relaxed">{p.description}</p>
                                </div>

                                <div className="flex-1 space-y-5 mb-10">
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b border-white/5 pb-2">Included Features</p>
                                    {p.features.map((feature) => (
                                        <div key={feature} className="flex items-center gap-4 group/item">
                                            <div className="p-1 rounded-full bg-profit/10 text-profit border border-profit/20">
                                                <Check className="w-3 h-3" />
                                            </div>
                                            <span className="text-xs font-bold text-white/80 group-hover/item:text-white transition-colors">{feature}</span>
                                        </div>
                                    ))}
                                    {p.notIncluded.length > 0 && (
                                         <>
                                            <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest border-b border-white/5 pb-2 pt-4">Premium Features</p>
                                            {p.notIncluded.map((feature) => (
                                                <div key={feature} className="flex items-center gap-4 opacity-30 group/item">
                                                    <div className="p-1 rounded-full bg-white/5 text-muted-foreground border border-white/10">
                                                        <Lock className="w-3 h-3" />
                                                    </div>
                                                    <span className="text-xs font-bold">{feature}</span>
                                                </div>
                                            ))}
                                         </>
                                    )}
                                </div>

                                <button
                                    onClick={() => handleUpgrade(p.id)}
                                    disabled={isCurrent || loading !== null}
                                    className={cn(
                                        "w-full h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all duration-300 flex items-center justify-center gap-3 overflow-hidden group/btn relative",
                                        isCurrent
                                            ? "bg-white/5 border border-white/10 text-muted-foreground cursor-default"
                                            : p.id === 'ultimate' 
                                                ? "bg-profit text-black shadow-lg shadow-profit/20 hover:scale-[1.02]"
                                                : "bg-primary text-black shadow-lg shadow-primary/20 hover:scale-[1.02]"
                                    )}
                                >
                                    <span className="relative z-10 flex items-center gap-2">
                                        {loading === p.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : isCurrent ? (
                                            <Shield className="w-4 h-4" />
                                        ) : (
                                            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                        )}
                                        {isCurrent ? "Current Plan" : p.cta}
                                    </span>
                                </button>
                            </GlassCard>
                        </motion.div>
                    )
                })}
            </div>
        </div>
    );
}
