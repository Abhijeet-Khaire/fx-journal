import { GlassCard } from "@/components/GlassCard";
import { Construction, Rocket } from "lucide-react";
import { motion } from "framer-motion";

export default function Playbook() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                <div className="p-4 rounded-full bg-primary/10 inline-block mb-4">
                    <Construction className="w-12 h-12 text-primary" />
                </div>
                <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-cyan-400 mb-2">
                    Playbook Coming Soon
                </h1>
                <p className="text-muted-foreground max-w-md mx-auto text-lg">
                    We are building the ultimate tool to document your edge and define your trading rules. Stay tuned!
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
            >
                <GlassCard className="p-8 max-w-lg mx-auto border-dashed border-2 border-white/10">
                    <div className="flex items-center gap-4 mb-4">
                        <Rocket className="w-6 h-6 text-purple-400" />
                        <h3 className="text-xl font-bold">What to expect</h3>
                    </div>
                    <ul className="text-left space-y-3 text-sm text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <span className="text-primary">•</span>
                            Create and save multiple trading strategies.
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary">•</span>
                            Define strict entry & exit rules with checklists.
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary">•</span>
                            Link trades to strategies for automated performance tracking.
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary">•</span>
                            Export your playbook as a PDF.
                        </li>
                    </ul>
                </GlassCard>
            </motion.div>
        </div>
    );
}
