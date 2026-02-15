import { useState } from "react";
import { useTrades } from "@/hooks/useTrades";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { usePlan } from "@/hooks/usePlan";
import { Trade } from "@/lib/tradeTypes";

export function ImportTrades() {
    const { addTrade } = useTrades();
    const { plan } = usePlan();
    const isUltimate = plan === "ultimate";

    const [file, setFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const parseCSV = async (text: string) => {
        // Simple parser assuming generic format: Date,Time,Pair,Direction,Price,Profit
        // In real app, would need robust parsing for MT4/MT5 formats
        const lines = text.split("\n");
        const headers = lines[0].toLowerCase().split(",");

        let successCount = 0;

        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            const cols = lines[i].split(",");

            // Mock mapping logic - strictly for demo purposes
            // Assuming generic CSV from our own export or similar
            try {
                const trade: Partial<Trade> = {
                    date: cols[0] || new Date().toISOString().split("T")[0],
                    time: cols[1] || "12:00",
                    pair: cols[2] || "EUR/USD",
                    direction: cols[3]?.toUpperCase() === "SELL" ? "SELL" : "BUY",
                    entryPrice: parseFloat(cols[4]) || 0,
                    exitPrice: parseFloat(cols[5]) || 0,
                    profitLoss: parseFloat(cols[7]) || 0, // Assuming 7 is P/L
                    // Defaults
                    stopLoss: 0,
                    takeProfit: 0,
                    lotSize: 0.1,
                    pips: 0,
                    session: "London", // better detection needed
                    strategy: "Imported",
                    rulesFollowed: true,
                    notes: "Imported Trade"
                };

                // Validate essential fields
                if (trade.pair && trade.date && !isNaN(trade.profitLoss || 0)) {
                    await addTrade(trade as Omit<Trade, "id" | "userId">);
                    successCount++;
                }
            } catch (err) {
                console.error("Row parse error", err);
            }
        }
        return successCount;
    };

    const handleImport = async () => {
        if (!file) return;
        if (!isUltimate) {
            toast.error("Importing is an Ultimate feature");
            return;
        }

        setImporting(true);
        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target?.result as string;
            try {
                const count = await parseCSV(text);
                toast.success(`Successfully imported ${count} trades`);
                setFile(null);
            } catch (error) {
                toast.error("Failed to parse CSV");
            } finally {
                setImporting(false);
            }
        };
        reader.readAsText(file);
    };

    return (
        <GlassCard className="p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-primary" />
                Import Trades
            </h3>

            {!isUltimate ? (
                <div className="text-center p-6 border border-dashed border-white/10 rounded-xl bg-secondary/10">
                    <p className="text-sm text-muted-foreground mb-2">Unlock MT4/MT5 & CSV Import</p>
                    <div className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded inline-block">Ultimate Feature</div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center justify-center w-full">
                        <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-secondary/50 border-white/10 transition-colors">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> CSV file</p>
                            </div>
                            <input id="dropzone-file" type="file" className="hidden" accept=".csv" onChange={handleFileChange} />
                        </label>
                    </div>

                    {file && (
                        <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                            <div className="flex items-center gap-2 overflow-hidden">
                                <FileText className="w-4 h-4 flex-shrink-0" />
                                <span className="text-sm truncate">{file.name}</span>
                            </div>
                            <Button size="sm" onClick={handleImport} disabled={importing}>
                                {importing ? "Importing..." : "Run Import"}
                            </Button>
                        </div>
                    )}

                    <div className="text-xs text-muted-foreground flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>Supports generic CSV and planned MT4/MT5 formats.</span>
                    </div>
                </div>
            )}
        </GlassCard>
    );
}
