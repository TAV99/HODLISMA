'use client';

import { useState, useMemo, useCallback } from 'react';
import { Search, ArrowUpDown, ChevronUp, ChevronDown, Star, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useInfiniteMarketListings } from '@/lib/hooks/use-market-data';
import { HoloCardWrapper } from '@/components/ui/HoloCardWrapper';

type SortKey = 'cmc_rank' | 'name' | 'price' | 'percent_change_24h' | 'percent_change_7d' | 'market_cap' | 'volume_24h';
type SortDirection = 'asc' | 'desc';

const ROWS_PER_VIEW = 10;

interface MarketTableProps {
    portfolioSymbols?: string[];
}

function formatPrice(value: number): string {
    if (value >= 1) return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 6, maximumFractionDigits: 6 })}`;
}

function formatAbbreviated(value: number): string {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    return `$${value.toLocaleString('en-US')}`;
}

const COL_DEFS = [
    { key: 'cmc_rank' as SortKey, label: '#', align: 'left' as const, w: 'w-12' },
    { key: 'name' as SortKey, label: 'Name', align: 'left' as const, w: 'min-w-[160px]' },
    { key: 'price' as SortKey, label: 'Price', align: 'right' as const, w: 'w-[120px]' },
    { key: 'percent_change_24h' as SortKey, label: '24h %', align: 'right' as const, w: 'w-[90px]' },
    { key: 'percent_change_7d' as SortKey, label: '7d %', align: 'right' as const, w: 'w-[90px]' },
    { key: 'market_cap' as SortKey, label: 'Market Cap', align: 'right' as const, w: 'w-[110px]' },
    { key: 'volume_24h' as SortKey, label: 'Volume 24h', align: 'right' as const, w: 'w-[110px]' },
];

export function MarketTable({ portfolioSymbols = [] }: MarketTableProps) {
    const {
        data: infiniteData,
        isLoading,
        error,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteMarketListings();

    const [search, setSearch] = useState('');
    const [sortKey, setSortKey] = useState<SortKey>('cmc_rank');
    const [sortDir, setSortDir] = useState<SortDirection>('asc');
    const [visibleCount, setVisibleCount] = useState(ROWS_PER_VIEW);

    const portfolioSet = useMemo(() => new Set(portfolioSymbols.map(s => s.toUpperCase())), [portfolioSymbols]);

    const allCoins = useMemo(() => {
        if (!infiniteData) return [];
        return infiniteData.pages.flatMap(page => page.data);
    }, [infiniteData]);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortKey(key);
            setSortDir(key === 'cmc_rank' ? 'asc' : 'desc');
        }
    };

    const handleSearch = useCallback((value: string) => {
        setSearch(value);
        setVisibleCount(ROWS_PER_VIEW);
    }, []);

    const sortedRows = useMemo(() => {
        const q = search.toLowerCase().trim();
        const filtered = q
            ? allCoins.filter(c => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q))
            : allCoins;

        return [...filtered].sort((a, b) => {
            const aVal = a[sortKey];
            const bVal = b[sortKey];
            if (typeof aVal === 'string' && typeof bVal === 'string')
                return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
            return sortDir === 'asc' ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal);
        });
    }, [allCoins, search, sortKey, sortDir]);

    const visibleRows = useMemo(() => sortedRows.slice(0, visibleCount), [sortedRows, visibleCount]);
    const hasMoreVisible = visibleCount < sortedRows.length;

    const handleLoadMore = useCallback(() => {
        const nextCount = visibleCount + ROWS_PER_VIEW;
        setVisibleCount(nextCount);

        if (nextCount >= sortedRows.length - ROWS_PER_VIEW && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [visibleCount, sortedRows.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

    const showLoadMore = hasMoreVisible || hasNextPage;

    if (error) {
        return (
            <HoloCardWrapper intensity={4} glareOpacity={0.06}>
                <div className="glass-card rounded-2xl ring-1 ring-white/20 p-8 text-center">
                    <p className="text-rose-600 dark:text-rose-400 font-medium mb-1">Failed to load market data</p>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">Please try refreshing the page.</p>
                </div>
            </HoloCardWrapper>
        );
    }

    return (
        <HoloCardWrapper intensity={4} glareOpacity={0.06}>
            <div className="glass-card rounded-2xl ring-1 ring-white/20 overflow-hidden">
                <div className="px-5 pt-5 pb-3 flex items-center justify-between">
                    <div className="relative max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Search coins..."
                            value={search}
                            onChange={e => handleSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/60 transition"
                        />
                    </div>
                    {!isLoading && allCoins.length > 0 && (
                        <span className="text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
                            {visibleRows.length} / {sortedRows.length}{hasNextPage ? '+' : ''}
                        </span>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] border-collapse">
                        <thead>
                            <tr className="border-y border-zinc-200 dark:border-zinc-700/50 bg-zinc-50 dark:bg-white/[0.02]">
                                {COL_DEFS.map(col => {
                                    const active = sortKey === col.key;
                                    return (
                                        <th
                                            key={col.key}
                                            onClick={() => handleSort(col.key)}
                                            className={cn(
                                                'px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider cursor-pointer select-none transition-colors whitespace-nowrap',
                                                col.align === 'right' ? 'text-right' : 'text-left',
                                                active ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300',
                                                col.w,
                                            )}
                                        >
                                            <span className={cn('inline-flex items-center gap-1', col.align === 'right' && 'justify-end')}>
                                                {col.label}
                                                {active
                                                    ? (sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)
                                                    : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                                            </span>
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-700/30">
                            {isLoading ? (
                                Array.from({ length: ROWS_PER_VIEW }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        {COL_DEFS.map(col => (
                                            <td key={col.key} className="px-5 py-3">
                                                <div className={cn('h-4 bg-zinc-200 dark:bg-zinc-700 rounded', col.align === 'right' ? 'ml-auto w-16' : 'w-20')} />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : visibleRows.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-5 py-12 text-center text-zinc-500 dark:text-zinc-400 text-sm">
                                        No coins found matching &quot;{search}&quot;
                                    </td>
                                </tr>
                            ) : (
                                visibleRows.map(coin => {
                                    const inPortfolio = portfolioSet.has(coin.symbol.toUpperCase());
                                    const pct24 = coin.percent_change_24h;
                                    const pct7d = coin.percent_change_7d;
                                    return (
                                        <tr
                                            key={coin.id}
                                            className={cn(
                                                'transition-colors hover:bg-indigo-50/50 dark:hover:bg-white/[0.04]',
                                                inPortfolio && 'border-l-2 border-l-indigo-500 bg-indigo-50/30 dark:bg-indigo-500/[0.03]',
                                            )}
                                        >
                                            <td className="px-5 py-3 text-sm tabular-nums text-zinc-400 dark:text-zinc-500 w-12">
                                                {coin.cmc_rank}
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 leading-none">{coin.name}</span>
                                                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">{coin.symbol}</span>
                                                    {inPortfolio && (
                                                        <span className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 text-[10px] font-semibold px-1.5 py-0.5 rounded-md inline-flex items-center gap-0.5 leading-none">
                                                            <Star className="h-2.5 w-2.5" />
                                                            Portfolio
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 text-right text-sm tabular-nums font-medium text-zinc-900 dark:text-zinc-100">
                                                {formatPrice(coin.price)}
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <span className={cn('text-sm tabular-nums font-medium inline-flex items-center gap-0.5 justify-end', pct24 >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
                                                    {pct24 >= 0 ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                                    {Math.abs(pct24).toFixed(2)}%
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <span className={cn('text-sm tabular-nums font-medium inline-flex items-center gap-0.5 justify-end', pct7d >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
                                                    {pct7d >= 0 ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                                    {Math.abs(pct7d).toFixed(2)}%
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-right text-sm tabular-nums text-zinc-600 dark:text-zinc-300">
                                                {formatAbbreviated(coin.market_cap)}
                                            </td>
                                            <td className="px-5 py-3 text-right text-sm tabular-nums text-zinc-500 dark:text-zinc-400">
                                                {formatAbbreviated(coin.volume_24h)}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {showLoadMore && !isLoading && (
                    <div className="px-5 py-3 border-t border-zinc-200 dark:border-zinc-700/50">
                        <button
                            onClick={handleLoadMore}
                            disabled={isFetchingNextPage}
                            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors disabled:opacity-50"
                        >
                            {isFetchingNextPage ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Loading...
                                </>
                            ) : (
                                <>
                                    Load More
                                    <ChevronRight className="h-4 w-4" />
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </HoloCardWrapper>
    );
}
