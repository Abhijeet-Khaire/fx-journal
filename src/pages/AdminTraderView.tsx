import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Trade } from "@/lib/tradeTypes";
import { getNetProfit, getWinRate, getProfitFactor, getDrawdownStats } from "@/lib/tradeStore";
import { GlassCard } from "@/components/GlassCard";
import { ArrowLeft, TrendingUp, TrendingDown, Trophy, Activity, ArrowUpRight, ArrowDownRight, Clock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { motion, AnimatePresence } from "framer-motion";

interface Trader {
    uid: string;
    email: string;
    displayName: string;
    photoURL: string | null;
}

export default function AdminTraderView() {
    const { uid } = useParams();
    const navigate = useNavigate();
    const [trader, setTrader] = useState<Trader | null>(null);
    const [trades, setTrades] = useState<Trade[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTraderData = async () => {
            if (!uid) return;
            try {
                // Fetch trader info
                const traderDoc = await getDoc(doc(db, "traders", uid));
                if (traderDoc.exists()) {
                    setTrader(traderDoc.data() as Trader);
                }

                // Fetch trade history
                const tradesDoc = await getDoc(doc(db, "traders", uid, "trade-history", "main"));
                if (tradesDoc.exists() && tradesDoc.data().trades) {
                    const sortedTrades = (tradesDoc.data().trades as Trade[]).sort((a, b) => {
                        return new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime();
                    });
                    setTrades(sortedTrades);
                }
            } catch (error) {
                console.error("Failed to fetch trader details", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTraderData();
    }, [uid]);

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
        );
    }

    if (!trader) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold mb-2">Trader Not Found</h2>
                <button onClick={() => navigate('/admin')} className="text-primary hover:underline">Return to Dashboard</button>
            </div>
        );
    }

    const netProfit = getNetProfit(trades);
    const winRate = getWinRate(trades);
    const profitFactor = getProfitFactor(trades);
    const totalTrades = trades.length;

    return (
        <div className="space-y-6">
            <button
                onClick={() => navigate('/admin')}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
            </button>

            <div className="flex items-center gap-4 py-2">
                {trader.photoURL ? (
                    <img src={trader.photoURL} alt={trader.displayName} className="w-16 h-16 rounded-full border-2 border-primary/50" />
                ) : (
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary text-2xl font-bold">
                        {trader.displayName?.charAt(0) || "T"}
                    </div>
                )}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">{trader.displayName}</h1>
                    <p className="text-muted-foreground">{trader.email}</p>
                </div>
            </div>

            {/* Stats Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <GlassCard className="p-4 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground">Net Profit</p>
                        <h3 className={`text-2xl font-bold font-mono ${netProfit >= 0 ? "text-profit" : "text-loss"}`}>
                            {netProfit >= 0 ? "+" : ""}${netProfit.toFixed(2)}
                        </h3>
                    </div>
                    <div className={`p-3 rounded-full ${netProfit >= 0 ? "bg-profit/20 text-profit" : "bg-loss/20 text-loss"}`}>
                        {netProfit >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                    </div>
                </GlassCard>

                <GlassCard className="p-4 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground">Win Rate</p>
                        <h3 className={`text-2xl font-bold font-mono ${winRate >= 50 ? "text-profit" : "text-loss"}`}>
                            {winRate.toFixed(1)}%
                        </h3>
                    </div>
                    <div className="p-3 rounded-full bg-primary/20 text-primary">
                        <Trophy className="w-5 h-5" />
                    </div>
                </GlassCard>

                <GlassCard className="p-4 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground">Total Trades</p>
                        <h3 className="text-2xl font-bold font-mono text-foreground">{totalTrades}</h3>
                    </div>
                    <div className="p-3 rounded-full bg-secondary text-secondary-foreground">
                        <Activity className="w-5 h-5" />
                    </div>
                </GlassCard>

                <GlassCard className="p-4 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground">Profit Factor</p>
                        <h3 className="text-2xl font-bold font-mono text-foreground">{profitFactor.toFixed(2)}</h3>
                    </div>
                    <div className="p-3 rounded-full bg-secondary text-secondary-foreground">
                        <Activity className="w-5 h-5" />
                    </div>
                </GlassCard>
            </div>

            {/* Trades Table */}
            <Card className="bg-card shadow-lg border-border">
                <CardHeader>
                    <CardTitle>Trade History</CardTitle>
                </CardHeader>
                <CardContent>
                    {trades.length === 0 ? (
                        <div className="text-center py-12">
                            <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">This trader has not recorded any trades yet.</p>
                        </div>
                    ) : (
                        <div className="rounded-md border border-border overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-secondary/20">
                                        <TableHead>Date</TableHead>
                                        <TableHead>Pair</TableHead>
                                        <TableHead>Dir</TableHead>
                                        <TableHead>Entry</TableHead>
                                        <TableHead>Exit</TableHead>
                                        <TableHead>Pips</TableHead>
                                        <TableHead>P/L</TableHead>
                                        <TableHead>Strategy</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {trades.map((trade) => (
                                        <TableRow key={trade.id} className="hover:bg-secondary/30 transition-colors">
                                            <TableCell className="text-muted-foreground font-mono text-xs whitespace-nowrap">
                                                <div>{trade.date}</div>
                                                <div className="text-[10px] opacity-70">{trade.time}</div>
                                            </TableCell>
                                            <TableCell className="font-semibold text-foreground">{trade.pair}</TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full border
                                                    ${trade.direction === "BUY" ? "bg-profit/10 text-profit border-profit/20" : "bg-loss/10 text-loss border-loss/20"}`}>
                                                    {trade.direction === "BUY" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                                    {trade.direction}
                                                </span>
                                            </TableCell>
                                            <TableCell className="font-mono text-xs text-muted-foreground">{trade.entryPrice}</TableCell>
                                            <TableCell className="font-mono text-xs text-muted-foreground">{trade.exitPrice}</TableCell>
                                            <TableCell className={`font-mono font-semibold ${trade.pips >= 0 ? "text-profit" : "text-loss"}`}>
                                                {trade.pips > 0 ? "+" : ""}{trade.pips}
                                            </TableCell>
                                            <TableCell className={`font-mono font-bold ${trade.profitLoss >= 0 ? "text-profit" : "text-loss"}`}>
                                                {trade.profitLoss > 0 ? "+" : ""}${trade.profitLoss.toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">{trade.strategy}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
