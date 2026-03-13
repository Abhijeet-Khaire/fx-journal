import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Timer, Zap, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TrialTimerProps {
    joinedDate: string | null;
    isTrial: boolean;
    isSidebar?: boolean;
}

export function TrialTimer({ joinedDate, isTrial, isSidebar }: TrialTimerProps) {
    const navigate = useNavigate();
    const [timeLeft, setTimeLeft] = useState<string>("72:00:00");
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        if (!joinedDate || !isTrial) return;

        const calculateTime = () => {
            const joinedAt = new Date(joinedDate).getTime();
            const now = new Date().getTime();
            const seventyTwoHours = 72 * 60 * 60 * 1000;
            const expiryTime = joinedAt + seventyTwoHours;
            const diff = expiryTime - now;

            if (diff <= 0) {
                setTimeLeft("00:00:00");
                setIsExpired(true);
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeLeft(
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
            );
        };

        calculateTime();
        const interval = setInterval(calculateTime, 1000);
        return () => clearInterval(interval);
    }, [joinedDate, isTrial]);

    if (isExpired || !joinedDate || !isTrial) return null;

    if (isSidebar) {
        return (
            <div className="px-3 pb-2 -mt-1 mb-1">
                <div className="glass border-primary/20 p-2 rounded-xl flex items-center justify-between gap-2 shadow-[0_0_15px_rgba(var(--primary),0.1)]">
                    <div className="flex flex-col">
                        <span className="text-[8px] font-black text-primary uppercase tracking-[0.15em] leading-none mb-1">
                            Trial Expires In
                        </span>
                        <div className="flex items-center gap-1.5 min-h-[1.5rem]">
                            <Zap className="w-3.5 h-3.5 text-primary shadow-glow" />
                            <span className="text-sm font-black text-white  font-mono tracking-tighter">
                                {timeLeft}
                            </span>
                        </div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20 shrink-0">
                        <Timer className="w-4 h-4 text-primary" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
        >
            <div className="glass border-primary/30 p-4 rounded-3xl shadow-[0_0_50px_rgba(var(--primary),0.2)] relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/5 opacity-50" />
                
                <div className="relative z-10 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-primary/20 border border-primary/30 animate-pulse">
                            <Zap className="w-5 h-5 text-primary shadow-glow" />
                        </div>
                        <div>
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Professional Trial Active</h4>
                            <div className="flex items-center gap-2">
                                <Timer className="w-4 h-4 text-white/40" />
                                <span className="text-xl font-black text-white  font-mono tracking-tighter">
                                    {timeLeft}
                                </span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => navigate("/plans")}
                        className="px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-[1.05] transition-transform flex items-center gap-2 shadow-[0_0_20px_rgba(var(--primary),0.4)]"
                    >
                        Upgrade Now
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
