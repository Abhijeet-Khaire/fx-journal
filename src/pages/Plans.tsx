import { motion } from "framer-motion";
import { Check, X, Loader2 } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { usePlan } from "@/hooks/usePlan";
import { toast } from "sonner";
import { useState } from "react";
import { Plan } from "@/lib/tradeTypes";

export default function Plans() {
    const { plan: currentPlan, upgradePlan } = usePlan();
    const [loading, setLoading] = useState<string | null>(null);

    const handleUpgrade = async (plan: Plan) => {
        if (plan === currentPlan) return;
        setLoading(plan);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        upgradePlan(plan);
        toast.success(`Successfully upgraded to ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan!`);
        setLoading(null);
    };

    const plans = [
        {
            id: "free" as Plan,
            name: "Free",
            price: "$0",
            period: "/month",
            features: [
                "Up to 50 trades",
                "Basic Analytics",
                "Manual Journaling",
                "Community Support",
            ],
            notIncluded: [
                "Unlimited Trades",
                "Edge & Discipline Scores",
                "Equity Curve",
                "Risk Dashboard",
                "AI Psychology Insights",
            ],
            cta: "Current Plan",
        },
        {
            id: "pro" as Plan,
            name: "Pro",
            price: "$12",
            period: "/month",
            features: [
                "Unlimited Trades",
                "Edge Score",
                "Discipline Score",
                "Equity Curve",
                "Strategy Analysis",
                "Priority Support",
            ],
            notIncluded: [
                "AI Psychology Insights",
                "Playbook Builder",
                "Risk Dashboard",
                "MT5 Import",
            ],
            cta: "Upgrade to Pro",
            popular: true,
        },
        {
            id: "ultimate" as Plan,
            name: "Ultimate",
            price: "$39",
            period: "/month",
            features: [
                "Everything in Pro",
                "AI Psychology Insights",
                "Playbook Builder",
                "Risk Dashboard",
                "MT4/MT5 Import",
                "Daily Loss Guard",
            ],
            notIncluded: [],
            cta: "Go Ultimate",
        },
    ];

    return (
        <div className="max-w-6xl mx-auto py-12 px-4">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-16"
            >
                <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-cyan-400">
                    Choose Your Plan
                </h1>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                    Unlock the full potential of your trading journal with our professional tools and insights.
                </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {plans.map((p, index) => {
                    const isCurrent = p.id === currentPlan;
                    return (
                        <motion.div
                            key={p.name}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <GlassCard
                                className={`h-full flex flex-col relative ${p.popular ? "border-primary/50 shadow-lg shadow-primary/10" : ""
                                    }`}
                                hover={true}
                            >
                                {p.popular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                                        Most Popular
                                    </div>
                                )}

                                <div className="mb-8 text-center">
                                    <h3 className="text-xl font-bold mb-2">{p.name}</h3>
                                    <div className="flex items-baseline justify-center gap-1">
                                        <span className="text-4xl font-bold">{p.price}</span>
                                        <span className="text-muted-foreground">{p.period}</span>
                                    </div>
                                </div>

                                <div className="flex-1 space-y-4 mb-8">
                                    {p.features.map((feature) => (
                                        <div key={feature} className="flex items-center gap-3">
                                            <div className="p-1 rounded-full bg-primary/20 text-primary shrink-0">
                                                <Check className="w-3 h-3" />
                                            </div>
                                            <span className="text-sm">{feature}</span>
                                        </div>
                                    ))}
                                    {p.notIncluded.map((feature) => (
                                        <div key={feature} className="flex items-center gap-3 opacity-50">
                                            <div className="p-1 rounded-full bg-muted text-muted-foreground shrink-0">
                                                <X className="w-3 h-3" />
                                            </div>
                                            <span className="text-sm">{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={() => handleUpgrade(p.id)}
                                    disabled={isCurrent || loading !== null}
                                    className={`w-full py-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 ${isCurrent
                                        ? "bg-secondary text-secondary-foreground cursor-default opacity-50"
                                        : "bg-primary text-primary-foreground hover:brightness-110 shadow-lg shadow-primary/20 hover:scale-[1.02]"
                                        }`}
                                >
                                    {loading === p.id && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {isCurrent ? "Current Plan" : p.cta}
                                </button>
                            </GlassCard>
                        </motion.div>
                    )
                })}
            </div>
        </div>
    );
}
