
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Filter, X, ArrowUpDown, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

export interface FilterState {
    dateRange: DateRange | undefined;
    pair: string;
    direction: "ALL" | "BUY" | "SELL";
    status: "ALL" | "WIN" | "LOSS" | "BREAKEVEN";
    strategy: string;
}

interface TradeFiltersProps {
    filters: FilterState;
    setFilters: (filters: FilterState) => void;
    onReset: () => void;
    pairs: string[];
    strategies: string[];
    onExport: () => void;
    sortConfig: { key: string; direction: 'asc' | 'desc' };
    setSortConfig: (config: { key: string; direction: 'asc' | 'desc' }) => void;
}

export function TradeFilters({
    filters,
    setFilters,
    onReset,
    pairs,
    strategies,
    onExport,
    sortConfig,
    setSortConfig
}: TradeFiltersProps) {

    const handleSortChange = (value: string) => {
        const [key, direction] = value.split("-");
        setSortConfig({ key, direction: direction as 'asc' | 'desc' });
    };

    return (
        <div className="space-y-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Filter className="w-5 h-5" />
                        Filters
                    </h2>
                    {(filters.pair !== "ALL" || filters.direction !== "ALL" || filters.status !== "ALL" || filters.strategy !== "ALL" || filters.dateRange?.from) && (
                        <Button variant="ghost" size="sm" onClick={onReset} className="h-8 px-2 text-muted-foreground hover:text-foreground">
                            <X className="w-4 h-4 mr-1" />
                            Reset
                        </Button>
                    )}
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Button variant="outline" size="sm" onClick={onExport} className="ml-auto">
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {/* Date Range Picker */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                                "w-full justify-start text-left font-normal",
                                !filters.dateRange && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {filters.dateRange?.from ? (
                                filters.dateRange.to ? (
                                    <>
                                        {format(filters.dateRange.from, "LLL dd, y")} -{" "}
                                        {format(filters.dateRange.to, "LLL dd, y")}
                                    </>
                                ) : (
                                    format(filters.dateRange.from, "LLL dd, y")
                                )
                            ) : (
                                <span>Pick a date range</span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={filters.dateRange?.from}
                            selected={filters.dateRange}
                            onSelect={(range) => setFilters({ ...filters, dateRange: range })}
                            numberOfMonths={2}
                        />
                    </PopoverContent>
                </Popover>

                {/* Pair Filter */}
                <Select
                    value={filters.pair}
                    onValueChange={(value) => setFilters({ ...filters, pair: value })}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="All Pairs" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Pairs</SelectItem>
                        {pairs.map((pair) => (
                            <SelectItem key={pair} value={pair}>
                                {pair}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Direction Filter */}
                <Select
                    value={filters.direction}
                    onValueChange={(value) => setFilters({ ...filters, direction: value as any })}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="All Directions" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Directions</SelectItem>
                        <SelectItem value="BUY">Buy</SelectItem>
                        <SelectItem value="SELL">Sell</SelectItem>
                    </SelectContent>
                </Select>

                {/* Status Filter */}
                <Select
                    value={filters.status}
                    onValueChange={(value) => setFilters({ ...filters, status: value as any })}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="All Outcomes" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Outcomes</SelectItem>
                        <SelectItem value="WIN">Win</SelectItem>
                        <SelectItem value="LOSS">Loss</SelectItem>
                        <SelectItem value="BREAKEVEN">Breakeven</SelectItem>
                    </SelectContent>
                </Select>

                {/* Strategy Filter */}
                <Select
                    value={filters.strategy}
                    onValueChange={(value) => setFilters({ ...filters, strategy: value })}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="All Strategies" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Strategies</SelectItem>
                        {strategies.map((strategy) => (
                            <SelectItem key={strategy} value={strategy}>
                                {strategy}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex justify-end">
                <Select value={`${sortConfig.key}-${sortConfig.direction}`} onValueChange={handleSortChange}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Sort By" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="date-desc">Date (Newest)</SelectItem>
                        <SelectItem value="date-asc">Date (Oldest)</SelectItem>
                        <SelectItem value="profitLoss-desc">Profit (Highest)</SelectItem>
                        <SelectItem value="profitLoss-asc">Profit (Lowest)</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
