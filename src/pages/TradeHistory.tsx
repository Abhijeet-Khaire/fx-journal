import { useState, useMemo } from "react";
import { useTrades } from "@/hooks/useTrades";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { Link } from "react-router-dom";
import { Trade, PAIRS, STRATEGIES } from "@/lib/tradeTypes";
import { Trash2, ArrowUpRight, ArrowDownRight, Clock, Pencil, Trophy, TrendingDown, TrendingUp, Activity, Filter, Download, ListFilter, Hash, DollarSign, Target, Database, UserCheck, Zap } from "lucide-react";
import { SkeletonCard } from "@/components/SkeletonLoader";
import { TradeFilters, FilterState } from "@/components/TradeFilters";
import { format, isWithinInterval, parseISO } from "date-fns";
import { getTradeQuality } from "@/lib/tradeStore";
import { usePlan } from "@/hooks/usePlan";
import { toast } from "sonner";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

const ITEMS_PER_PAGE = 10;

export default function TradeHistory() {
  const { trades, loading, deleteTrade } = useTrades();
  const { plan } = usePlan();
  const isProPlus = plan === "pro" || plan === "ultimate";

  const [tradeToDelete, setTradeToDelete] = useState<string | null>(null);

  // State for filters
  const [filters, setFilters] = useState<FilterState>({
    dateRange: undefined,
    pair: "ALL",
    direction: "ALL",
    status: "ALL",
    strategy: "ALL",
  });

  // State for sorting
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'date',
    direction: 'desc'
  });

  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Reset filters
  const resetFilters = () => {
    setFilters({
      dateRange: undefined,
      pair: "ALL",
      direction: "ALL",
      status: "ALL",
      strategy: "ALL",
    });
    setCurrentPage(1);
  };

  // Filter and Sort Logic
  const filteredAndSortedTrades = useMemo(() => {
    let result = [...trades];

    // Filter by Date Range
    if (filters.dateRange?.from) {
      result = result.filter((trade) => {
        const tradeDate = parseISO(trade.date);
        const start = filters.dateRange!.from;
        const end = filters.dateRange!.to || filters.dateRange!.from;
        const endOfDay = new Date(end!);
        endOfDay.setHours(23, 59, 59, 999);

        return isWithinInterval(tradeDate, { start: start!, end: endOfDay });
      });
    }

    // Filter by Pair
    if (filters.pair !== "ALL") {
      result = result.filter((trade) => trade.pair === filters.pair);
    }

    // Filter by Direction
    if (filters.direction !== "ALL") {
      result = result.filter((trade) => trade.direction === filters.direction);
    }

    // Filter by Status
    if (filters.status !== "ALL") {
      if (filters.status === "WIN") result = result.filter(t => t.profitLoss > 0);
      else if (filters.status === "LOSS") result = result.filter(t => t.profitLoss < 0);
      else if (filters.status === "BREAKEVEN") result = result.filter(t => t.profitLoss === 0);
    }

    // Filter by Strategy
    if (filters.strategy !== "ALL") {
      result = result.filter((trade) => trade.strategy === filters.strategy);
    }

    // Sorting
    result.sort((a, b) => {
      let valA: any = a[sortConfig.key as keyof Trade];
      let valB: any = b[sortConfig.key as keyof Trade];

      if (sortConfig.key === 'date') {
        valA = new Date(`${a.date}T${a.time}`).getTime();
        valB = new Date(`${b.date}T${b.time}`).getTime();
      }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [trades, filters, sortConfig]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredAndSortedTrades.length / ITEMS_PER_PAGE);
  const paginatedTrades = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedTrades.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredAndSortedTrades, currentPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }

  // Summary Statistics
  const stats = useMemo(() => {
    const totalTrades = filteredAndSortedTrades.length;
    const totalPnL = filteredAndSortedTrades.reduce((acc, t) => acc + t.profitLoss, 0);
    const wins = filteredAndSortedTrades.filter(t => t.profitLoss > 0).length;
    const losses = filteredAndSortedTrades.filter(t => t.profitLoss < 0).length;
    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;

    return { totalTrades, totalPnL, winRate };
  }, [filteredAndSortedTrades]);

  // CSV Export
  const exportToCSV = () => {
    if (!isProPlus) {
      toast.error("CSV Export is a Pro feature. Please upgrade to Pro or Ultimate.");
      return;
    }
    const headers = ["Date", "Time", "Pair", "Direction", "Entry", "Exit", "Pips", "P/L", "Session", "Strategy", "Notes"];
    const csvContent = [
      headers.join(","),
      ...filteredAndSortedTrades.map(t => [
        t.date,
        t.time,
        t.pair,
        t.direction,
        t.entryPrice,
        t.exitPrice,
        t.pips,
        t.profitLoss,
        t.session,
        t.strategy,
        `"${(t.notes || "").replace(/"/g, '""')}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `trade_history_${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
        <div className="h-[400px] w-full rounded-3xl bg-white/5 animate-pulse border border-white/10" />
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20">
      {/* Header - Neural Ledger Aesthetic */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2.5rem] p-10 border border-white/10 bg-black/40 backdrop-blur-3xl group shadow-2xl"
      >
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity text-primary">
          <Database className="w-48 h-48" />
        </div>

        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 flex items-center gap-2">
              <ListFilter className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-black tracking-[0.3em] uppercase text-primary">History Sync: Active</span>
            </div>
          </div>
          <div>
            <h1 className="text-5xl font-black tracking-tighter text-white uppercase ">Trade <span className="text-primary not-">Journal</span></h1>
            <p className="text-muted-foreground text-lg font-medium mt-2 max-w-2xl">
              Detailed log of <span className="text-white font-bold">{trades.length}</span> historical trades.
              Complete statistics for performance review.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <GlassCard className="p-8 border-t-2 border-t-white/10 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <DollarSign className="w-32 h-32 text-white" />
          </div>
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-2 rounded-xl ${stats.totalPnL >= 0 ? "bg-profit/10" : "bg-loss/10"}`}>
              {stats.totalPnL >= 0 ? <TrendingUp className={`w-5 h-5 text-profit`} /> : <TrendingDown className={`w-5 h-5 text-loss`} />}
            </div>
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Net Profit</span>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className={`text-5xl font-black  ${stats.totalPnL >= 0 ? "text-profit" : "text-loss"}`}>
              {stats.totalPnL >= 0 ? "+" : ""}${stats.totalPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
          </div>
        </GlassCard>

        <GlassCard className="p-8 border-t-2 border-t-primary/50 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Target className="w-32 h-32 text-primary" />
          </div>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-primary/10">
              <Trophy className="w-5 h-5 text-primary" />
            </div>
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Win Rate</span>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-5xl font-black text-white ">
              {stats.winRate.toFixed(1)}%
            </h3>
            <span className="text-xs font-black text-primary uppercase tracking-widest">Performance</span>
          </div>
        </GlassCard>

        <GlassCard className="p-8 border-t-2 border-t-white/10 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Activity className="w-32 h-32 text-white" />
          </div>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-white/5">
              <Hash className="w-5 h-5 text-white/60" />
            </div>
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Total Volume</span>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-5xl font-black text-white ">{stats.totalTrades}</h3>
            <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">Trades</span>
          </div>
        </GlassCard>
      </div>

      <div className="space-y-8">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-xl font-black uppercase tracking-widest flex items-center gap-3 text-white">
            <Filter className="w-6 h-6 text-primary" />
            Search & <span className="text-primary not-">Filters</span>
          </h3>
          <span className="h-px flex-1 bg-gradient-to-r from-primary/30 to-transparent ml-6" />
          {isProPlus && (
            <button
              onClick={exportToCSV}
              className="ml-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-widest"
            >
              <Download className="w-3 h-3" />
              Export CSV
            </button>
          )}
        </div>

        <TradeFilters
          filters={filters}
          setFilters={setFilters}
          onReset={resetFilters}
          pairs={[...PAIRS]}
          strategies={[...STRATEGIES]}
          onExport={exportToCSV}
          sortConfig={sortConfig}
          setSortConfig={setSortConfig}
        />
      </div>

      {filteredAndSortedTrades.length === 0 ? (
        <GlassCard hover={false} className="p-20">
          <div className="text-center">
            <div className="p-6 rounded-full bg-white/5 border border-white/10 border-dashed w-fit mx-auto mb-8">
              <Clock className="w-12 h-12 text-muted-foreground opacity-20" />
            </div>
            <h3 className="text-2xl font-black uppercase  tracking-tighter mb-2">No Trades Found</h3>
            <p className="text-muted-foreground text-sm font-medium mb-8">No trade records match the current filter criteria.</p>
            <button
              onClick={resetFilters}
              className="px-8 py-3 rounded-xl bg-primary text-black font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-transform"
            >
              Reset Filters
            </button>
          </div>
        </GlassCard>
      ) : (
        <div className="space-y-8">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-black uppercase tracking-widest flex items-center gap-3 text-white">
              <Database className="w-6 h-6 text-primary" />
              Trade <span className="text-primary not-">Records</span>
            </h3>
            <span className="h-px flex-1 bg-gradient-to-r from-primary/30 to-transparent ml-6" />
            <div className="ml-6 flex items-center gap-4">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                Page {currentPage} of {totalPages}
              </span>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="grid grid-cols-1 gap-6 xl:hidden">
            <AnimatePresence mode="popLayout">
              {paginatedTrades.map((trade, i) => (
                <motion.div
                  key={trade.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <GlassCard hover={false} className="p-8 relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-6">
                      <div className="space-y-1">
                        <span className="text-2xl font-black  text-white uppercase tracking-tighter">{trade.pair}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${getTradeQuality(trade).grade === 'A' ? 'bg-profit/10 text-profit border border-profit/20' :
                            getTradeQuality(trade).grade === 'B' ? 'bg-primary/10 text-primary border border-primary/20' :
                              'bg-loss/10 text-loss border border-loss/20'
                            }`}>
                            GRADE {getTradeQuality(trade).grade}
                          </span>
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{trade.date}</span>
                        </div>
                      </div>
                      <div className={`px-4 py-1.5 rounded-2xl border flex items-center gap-2 ${trade.direction === "BUY" ? "bg-profit/10 border-profit/20 text-profit" : "bg-loss/10 border-loss/20 text-loss"}`}>
                        {trade.direction === "BUY" ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        <span className="text-xs font-black uppercase tracking-widest">{trade.direction}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mb-8">
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Trade Profit</p>
                        <p className={`text-xl font-black  ${trade.profitLoss >= 0 ? "text-profit" : "text-loss"}`}>
                          {trade.profitLoss >= 0 ? "+" : ""}${Math.abs(trade.profitLoss).toFixed(2)}
                        </p>
                      </div>
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Price Move</p>
                        <p className={`text-xl font-black  ${trade.pips >= 0 ? "text-profit" : "text-loss"}`}>
                          {trade.pips > 0 ? "+" : ""}{trade.pips} <span className="text-[10px] not- text-muted-foreground">PIPS</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-white/10">
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{trade.strategy}</span>
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/edit-trade/${trade.id}`}
                          className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-primary transition-all"
                          aria-label="Edit trade"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setTradeToDelete(trade.id)}
                          className="p-3 rounded-xl bg-white/5 hover:bg-loss/10 text-muted-foreground hover:text-loss transition-all"
                          aria-label="Delete trade"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Desktop Table View */}
          <div className="hidden xl:block overflow-hidden rounded-[2.5rem] border border-white/10 bg-black/40 backdrop-blur-3xl shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-white/5 text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em]">
                    {["Trade Date", "Trading Pair", "Quality", "Direction", "Entry Price", "Exit Price", "Profit/Loss", "Outcome", "Action"].map((h) => (
                      <th key={h} className="px-8 py-6 text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <AnimatePresence mode="popLayout">
                    {paginatedTrades.map((trade, i) => (
                      <motion.tr
                        key={trade.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ delay: i * 0.02 }}
                        className="hover:bg-white/5 transition-all group"
                      >
                        <td className="px-8 py-6">
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-white ">{trade.date}</span>
                            <span className="text-[10px] text-muted-foreground font-bold tracking-widest">{trade.time}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-sm font-black text-white uppercase tracking-tighter">{trade.pair}</span>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${getTradeQuality(trade).grade === 'A' ? 'bg-profit/10 text-profit border-profit/20' :
                            getTradeQuality(trade).grade === 'B' ? 'bg-primary/10 text-primary border-primary/20' :
                              'bg-loss/10 text-loss border-loss/20'
                            }`}>
                            {getTradeQuality(trade).grade}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border font-black text-[10px] tracking-widest
                              ${trade.direction === "BUY" ? "bg-profit/10 text-profit border-profit/20" : "bg-loss/10 text-loss border-loss/20"}`}>
                            {trade.direction === "BUY" ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                            {trade.direction}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-xs font-bold text-muted-foreground font-mono">{trade.entryPrice}</span>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-xs font-bold text-muted-foreground font-mono">{trade.exitPrice}</span>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`text-sm font-black  ${trade.pips >= 0 ? "text-profit" : "text-loss"}`}>
                            {trade.pips > 0 ? "+" : ""}{trade.pips}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`text-sm font-black  ${trade.profitLoss >= 0 ? "text-profit" : "text-loss"}`}>
                            {trade.profitLoss >= 0 ? "+" : ""}${trade.profitLoss.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link
                              to={`/edit-trade/${trade.id}`}
                              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-primary transition-all"
                              aria-label="Edit trade"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => setTradeToDelete(trade.id)}
                              className="p-2 rounded-lg bg-white/5 hover:bg-loss/10 text-muted-foreground hover:text-loss transition-all"
                              aria-label="Delete trade"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls - Enhanced */}
          {totalPages > 1 && (
            <div className="flex justify-center pt-10">
              <Pagination>
                <PaginationContent className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-1">
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }}
                      aria-disabled={currentPage === 1}
                      className={cn(
                        "h-10 px-4 rounded-xl font-black uppercase text-[10px] tracking-widest border-none hover:bg-white/5 transition-all",
                        currentPage === 1 ? "pointer-events-none opacity-20" : ""
                      )}
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            href="#"
                            isActive={currentPage === page}
                            onClick={(e) => { e.preventDefault(); handlePageChange(page); }}
                            className={cn(
                              "h-10 w-10 rounded-xl font-black text-[10px] border-none transition-all",
                              currentPage === page ? "bg-primary text-black shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-white/5 hover:text-white"
                            )}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    } else if (
                      (page === currentPage - 2 && page > 1) ||
                      (page === currentPage + 2 && page < totalPages)
                    ) {
                      return <PaginationItem key={page}><PaginationEllipsis className="text-muted-foreground" /></PaginationItem>;
                    }
                    return null;
                  })}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }}
                      aria-disabled={currentPage === totalPages}
                      className={cn(
                        "h-10 px-4 rounded-xl font-black uppercase text-[10px] tracking-widest border-none hover:bg-white/5 transition-all",
                        currentPage === totalPages ? "pointer-events-none opacity-20" : ""
                      )}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      )}

      <AlertDialog open={!!tradeToDelete} onOpenChange={(open) => !open && setTradeToDelete(null)}>
        <AlertDialogContent className="glass border-white/10 rounded-[2.5rem] p-10 max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black uppercase  tracking-tighter">Delete Record?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground font-medium py-4">
              Deletion is irreversible. This trade data will be permanently removed from the history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-4">
            <AlertDialogCancel className="h-12 flex-1 rounded-2xl bg-white/5 border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (tradeToDelete) {
                  deleteTrade(tradeToDelete);
                  setTradeToDelete(null);
                }
              }}
              className={cn(
                buttonVariants({ variant: "destructive" }),
                "h-12 flex-1 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-loss shadow-lg shadow-loss/20 border-none"
              )}
            >
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
