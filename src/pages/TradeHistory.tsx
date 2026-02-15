import { useState, useMemo } from "react";
import { useTrades } from "@/hooks/useTrades";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { Link } from "react-router-dom";
import { Trade, PAIRS, STRATEGIES } from "@/lib/tradeTypes";
import { Trash2, ArrowUpRight, ArrowDownRight, Clock, Pencil, Trophy, TrendingDown, TrendingUp, Activity } from "lucide-react";
import { SkeletonCard } from "@/components/SkeletonLoader";
import { TradeFilters, FilterState } from "@/components/TradeFilters";
import { format, isWithinInterval, parseISO } from "date-fns";
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

const ITEMS_PER_PAGE = 10;

export default function TradeHistory() {
  const { trades, loading, deleteTrade } = useTrades();
  const { plan } = usePlan();
  const isProPlus = plan === "pro" || plan === "ultimate";

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
        // set end of day for the end date to include trades on that day
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

      // Handle special sorting for date combined with time
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
        `"${(t.notes || "").replace(/"/g, '""')}"` // Escape quotes in notes
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
      <div className="space-y-4">
        <SkeletonCard /><SkeletonCard /><SkeletonCard />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-2"
      >
        <h1 className="text-3xl font-bold text-foreground">Trade History</h1>
        <p className="text-muted-foreground">View and manage your trading performance.</p>
      </motion.div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total P/L</p>
            <h3 className={`text-2xl font-bold font-mono ${stats.totalPnL >= 0 ? "text-profit" : "text-loss"}`}>
              {stats.totalPnL >= 0 ? "+" : ""}${stats.totalPnL.toFixed(2)}
            </h3>
          </div>
          <div className={`p-3 rounded-full ${stats.totalPnL >= 0 ? "bg-profit/20 text-profit" : "bg-loss/20 text-loss"}`}>
            {stats.totalPnL >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
          </div>
        </GlassCard>

        <GlassCard className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Win Rate</p>
            <h3 className="text-2xl font-bold font-mono text-foreground">
              {stats.winRate.toFixed(1)}%
            </h3>
          </div>
          <div className="p-3 rounded-full bg-primary/20 text-primary">
            <Trophy className="w-5 h-5" />
          </div>
        </GlassCard>

        <GlassCard className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Filtered Trades</p>
            <h3 className="text-2xl font-bold font-mono text-foreground">{stats.totalTrades}</h3>
          </div>
          <div className="p-3 rounded-full bg-secondary text-secondary-foreground">
            <Activity className="w-5 h-5" />
          </div>
        </GlassCard>
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

      {filteredAndSortedTrades.length === 0 ? (
        <GlassCard hover={false}>
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No trades found matching your filters.</p>
            <button onClick={resetFilters} className="text-primary hover:underline mt-2 text-sm">Clear Filters</button>
          </div>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-lg border border-border/50">
            <table className="w-full text-sm">
              <thead className="bg-secondary/20">
                <tr className="text-muted-foreground text-xs uppercase tracking-wider">
                  {["Date", "Pair", "Dir", "Entry", "Exit", "Pips", "P/L", "Session", "Strategy", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                <AnimatePresence mode="popLayout">
                  {paginatedTrades.map((trade, i) => (
                    <motion.tr
                      key={trade.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: i * 0.03 }}
                      className="hover:bg-secondary/30 transition-colors group"
                    >
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs whitespace-nowrap">
                        <div>{trade.date}</div>
                        <div className="text-[10px] opacity-70">{trade.time}</div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-foreground">{trade.pair}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full border
                            ${trade.direction === "BUY" ? "bg-profit/10 text-profit border-profit/20" : "bg-loss/10 text-loss border-loss/20"}`}>
                          {trade.direction === "BUY" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {trade.direction}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{trade.entryPrice}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{trade.exitPrice}</td>
                      <td className={`px-4 py-3 font-mono font-semibold ${trade.pips >= 0 ? "text-profit" : "text-loss"}`}>
                        {trade.pips > 0 ? "+" : ""}{trade.pips}
                      </td>
                      <td className={`px-4 py-3 font-mono font-bold ${trade.profitLoss >= 0 ? "text-profit" : "text-loss"}`}>
                        {trade.profitLoss > 0 ? "+" : ""}${trade.profitLoss.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{trade.session}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{trade.strategy}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Link
                            to={`/edit-trade/${trade.id}`}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => {
                              if (window.confirm("Are you sure you want to delete this trade?")) {
                                deleteTrade(trade.id);
                              }
                            }}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-loss hover:bg-loss/10 transition-colors"
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }}
                    aria-disabled={currentPage === 1}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  // Simple pagination logic for displaying page numbers
                  // Show first, last, current, and surrounding pages
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
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  } else if (
                    (page === currentPage - 2 && page > 1) ||
                    (page === currentPage + 2 && page < totalPages)
                  ) {
                    return <PaginationItem key={page}><PaginationEllipsis /></PaginationItem>;
                  }
                  return null;
                })}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }}
                    aria-disabled={currentPage === totalPages}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      )}
    </div>
  );
}
