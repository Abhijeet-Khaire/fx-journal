import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query, getDoc, doc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { Users, Key, Clock, Mail, TrendingUp, Activity, Target, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Trade } from "@/lib/tradeTypes";
import { getNetProfit, getWinRate, getProfitFactor, getDrawdownStats } from "@/lib/tradeStore";

interface Trader {
    uid: string;
    email: string;
    displayName: string;
    photoURL: string | null;
    lastSeen: string;
    isAnonymous: boolean;
    role?: string;
}

interface TraderPerformance {
    uid: string;
    displayName: string;
    email: string;
    photoURL: string | null;
    totalTrades: number;
    winRate: number;
    netProfit: number;
    profitFactor: number;
    maxDrawdown: number;
}

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [traders, setTraders] = useState<Trader[]>([]);
    const [performanceData, setPerformanceData] = useState<TraderPerformance[]>([]);
    const [loading, setLoading] = useState(true);
    const [perfLoading, setPerfLoading] = useState(false);

    useEffect(() => {
        const fetchTraders = async () => {
            try {
                const trRef = collection(db, "traders");
                const q = query(trRef, orderBy("lastSeen", "desc"));
                const snapshot = await getDocs(q);
                const data = snapshot.docs.map(d => d.data() as Trader);
                setTraders(data);
            } catch (error) {
                console.error("Failed to fetch traders", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTraders();
    }, []);

    const loadPerformanceData = async () => {
        if (performanceData.length > 0 || traders.length === 0) return;
        setPerfLoading(true);
        try {
            const promises = traders.map(async (trader) => {
                const docRef = doc(db, "traders", trader.uid, "trade-history", "main");
                const docSnap = await getDoc(docRef);
                let trades: Trade[] = [];
                if (docSnap.exists() && docSnap.data().trades) {
                    trades = docSnap.data().trades as Trade[];
                }

                return {
                    uid: trader.uid,
                    displayName: trader.displayName,
                    email: trader.email,
                    photoURL: trader.photoURL,
                    totalTrades: trades.length,
                    winRate: getWinRate(trades),
                    netProfit: getNetProfit(trades),
                    profitFactor: getProfitFactor(trades),
                    maxDrawdown: trades.length ? getDrawdownStats(trades).maxDrawdown : 0,
                };
            });

            const results = await Promise.all(promises);
            // Sort by net profit descending
            results.sort((a, b) => b.netProfit - a.netProfit);
            setPerformanceData(results);
        } catch (error) {
            console.error("Failed to fetch performance data", error);
        } finally {
            setPerfLoading(false);
        }
    };

    const totalUsers = traders.length;
    const adminUsers = traders.filter(t => t.role === "superadmin").length;
    const recentUsers = traders.filter(t => {
        const lastSeenDate = new Date(t.lastSeen);
        const now = new Date();
        return (now.getTime() - lastSeenDate.getTime()) < 1000 * 60 * 60 * 24 * 7;
    }).length;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Super Admin Dashboard</h1>
                <p className="text-muted-foreground mt-1 text-lg">Manage all traders and platform metrics</p>
            </div>

            <Tabs defaultValue="overview" className="w-full" onValueChange={(v) => v === "performance" && loadPerformanceData()}>
                <TabsList className="grid w-full max-w-md grid-cols-2 mb-8 bg-secondary/50 p-1 rounded-xl">
                    <TabsTrigger value="overview" className="rounded-lg">Users Overview</TabsTrigger>
                    <TabsTrigger value="performance" className="rounded-lg">Performance</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                            <Card className="bg-card">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Traders</CardTitle>
                                    <Users className="w-4 h-4 text-primary" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{totalUsers}</div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                            <Card className="bg-card">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Admins</CardTitle>
                                    <Key className="w-4 h-4 text-primary" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{adminUsers}</div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                            <Card className="bg-card">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Active (7 Days)</CardTitle>
                                    <Clock className="w-4 h-4 text-primary" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{recentUsers}</div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>

                    <Card className="bg-card shadow-lg border-border">
                        <CardHeader>
                            <CardTitle>Registered Users</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="py-8 text-center text-muted-foreground animate-pulse">
                                    Loading traders data...
                                </div>
                            ) : (
                                <div className="rounded-md border border-border overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="hover:bg-transparent">
                                                <TableHead>User</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Role</TableHead>
                                                <TableHead>Last Seen</TableHead>
                                                <TableHead className="text-right">UID</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {traders.map((trader) => (
                                                <TableRow key={trader.uid}>
                                                    <TableCell className="font-medium">
                                                        <div className="flex items-center gap-2 min-w-[150px]">
                                                            {trader.photoURL ? (
                                                                <img src={trader.photoURL} alt={trader.displayName} className="w-8 h-8 rounded-full" />
                                                            ) : (
                                                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                                                                    {trader.displayName?.charAt(0) || "T"}
                                                                </div>
                                                            )}
                                                            {trader.displayName}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2 text-muted-foreground text-sm min-w-[200px]">
                                                            <Mail className="w-4 h-4" />
                                                            {trader.email || "No email"}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {trader.role === "superadmin" ? (
                                                            <span className="px-2 py-1 rounded bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
                                                                Admin
                                                            </span>
                                                        ) : (
                                                            <span className="px-2 py-1 rounded bg-secondary/50 text-muted-foreground text-xs font-medium tracking-wider">
                                                                Trader
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground text-sm min-w-[150px]">
                                                        {trader.lastSeen ? format(new Date(trader.lastSeen), "PPp") : "Unknown"}
                                                    </TableCell>
                                                    <TableCell className="text-right text-xs font-mono text-muted-foreground">
                                                        {trader.uid.substring(0, 8)}...
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {traders.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                        No users found
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="performance" className="space-y-6">
                    <Card className="bg-card shadow-lg border-border">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-primary" />
                                    Trader Performance Metrics
                                </CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">Aggregated statistics across all recorded trades</p>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {perfLoading ? (
                                <div className="py-12 flex flex-col items-center justify-center gap-4">
                                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                                    <p className="text-muted-foreground animate-pulse">Aggregating trade histories...</p>
                                </div>
                            ) : (
                                <div className="rounded-md border border-border overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="hover:bg-transparent bg-secondary/20">
                                                <TableHead>Trader</TableHead>
                                                <TableHead className="text-right">Total Trades</TableHead>
                                                <TableHead className="text-right">Win Rate</TableHead>
                                                <TableHead className="text-right">Net Profit</TableHead>
                                                <TableHead className="text-right">Profit Factor</TableHead>
                                                <TableHead className="text-right">Max Drawdown</TableHead>
                                                <TableHead className="w-[50px]"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {performanceData.map((perf) => (
                                                <TableRow
                                                    key={perf.uid}
                                                    className="group cursor-pointer hover:bg-secondary/40 transition-colors"
                                                    onClick={() => navigate(`/admin/trader/${perf.uid}`)}
                                                >
                                                    <TableCell className="font-medium">
                                                        <div className="flex items-center gap-3 min-w-[200px]">
                                                            {perf.photoURL ? (
                                                                <img src={perf.photoURL} alt={perf.displayName} className="w-10 h-10 rounded-full border-2 border-transparent group-hover:border-primary transition-all" />
                                                            ) : (
                                                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold border-2 border-transparent group-hover:border-primary transition-all">
                                                                    {perf.displayName?.charAt(0) || "T"}
                                                                </div>
                                                            )}
                                                            <div>
                                                                <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{perf.displayName}</p>
                                                                <p className="text-xs text-muted-foreground">{perf.email}</p>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-1 font-mono">
                                                            <Activity className="w-4 h-4 text-muted-foreground" />
                                                            <span>{perf.totalTrades}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full rounded-full ${perf.winRate >= 50 ? 'bg-profit' : 'bg-loss'}`}
                                                                    style={{ width: `${perf.winRate}%` }}
                                                                />
                                                            </div>
                                                            <span className={`font-mono font-bold ${perf.winRate >= 50 ? 'text-profit' : 'text-loss'}`}>
                                                                {perf.winRate}%
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <span className={`font-mono text-lg font-bold tracking-tight ${perf.netProfit >= 0 ? "text-profit" : "text-loss"}`}>
                                                            {perf.netProfit >= 0 ? "+" : ""}${perf.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <span className={`font-mono px-2 py-1 rounded ${perf.profitFactor >= 2 ? "bg-profit/10 text-profit" : perf.profitFactor >= 1 ? "bg-primary/10 text-primary" : "bg-loss/10 text-loss"} font-semibold`}>
                                                            {perf.profitFactor.toFixed(2)}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <span className="font-mono text-loss font-medium">
                                                            -${perf.maxDrawdown.toLocaleString()}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {performanceData.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={7} className="text-center py-12">
                                                        <Target className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                                                        <p className="text-lg font-medium text-foreground">No Performance Data</p>
                                                        <p className="text-muted-foreground">Traders haven't logged any trades yet.</p>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

