import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb } from "lucide-react";

interface InsightsPanelProps {
  insights: { label: string; value: string }[];
  locked?: boolean;
}

export function InsightsPanel({ insights, locked }: InsightsPanelProps) {
  const [visibleIndex, setVisibleIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");

  const currentInsight = insights[visibleIndex];

  useEffect(() => {
    if (locked || !currentInsight) return;
    setDisplayText("");
    const text = `${currentInsight.label}: ${currentInsight.value}`;
    let i = 0;
    const interval = setInterval(() => {
      setDisplayText(text.slice(0, i + 1));
      i++;
      if (i >= text.length) {
        clearInterval(interval);
        setTimeout(() => {
          setVisibleIndex((prev) => (prev + 1) % insights.length);
        }, 3000);
      }
    }, 40);
    return () => clearInterval(interval);
  }, [visibleIndex, insights, locked, currentInsight]);

  if (locked) {
    return (
      <div className="glass p-6 relative overflow-hidden">
        <div className="blur-sm pointer-events-none">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">AI Insights</h3>
          </div>
          <p className="text-muted-foreground text-sm">Upgrade to unlock automated insights...</p>
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-sm">
          <span className="text-primary font-semibold text-sm">🔒 Pro Feature</span>
        </div>
      </div>
    );
  }

  return (
    <div className="glass p-6">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="w-5 h-5 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">AI Insights</h3>
      </div>
      <AnimatePresence mode="wait">
        <motion.p
          key={visibleIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="text-sm text-muted-foreground font-mono min-h-[20px]"
        >
          {displayText}
          <span className="animate-pulse">▌</span>
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
