'use client';

import { useState, useMemo, useCallback } from 'react';
import { Bell, Plus, Trash2, ChevronUp, ChevronDown, Loader2, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWatchlist } from '@/lib/hooks/use-watchlist';
import { useMarketListings } from '@/lib/hooks/use-market-data';
import { usePriceAlerts } from '@/lib/hooks/use-price-alerts';
import { removeFromWatchlist } from '@/lib/actions/watchlist';
import { useQueryClient } from '@tanstack/react-query';
import { AddToWatchlistModal } from './AddToWatchlistModal';
import { HoloCardWrapper } from '@/components/ui/HoloCardWrapper';
import type { CoinListing, PriceAlert } from '@/lib/types';

function formatPrice(value: number): string {
    if (value >= 1) {
        return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 6, maximumFractionDigits: 6 })}`;
}

function PercentChange({ value }: { value: number | undefined }) {
    if (value === undefined) return <span className="text-zinc-400 dark:text-zinc-500 text-sm">--</span>;
    const isPositive = value >= 0;
    return (
        <span className={cn('flex items-center gap-1 font-mono text-sm', isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
            {isPositive ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {Math.abs(value).toFixed(2)}%
        </span>
    );
}

function SkeletonRows() {
    return (
        <>
            {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3"><div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-700 rounded" /></td>
                    <td className="px-4 py-3 text-right"><div className="ml-auto h-4 w-24 bg-zinc-200 dark:bg-zinc-700 rounded" /></td>
                    <td className="px-4 py-3 text-right"><div className="ml-auto h-4 w-16 bg-zinc-200 dark:bg-zinc-700 rounded" /></td>
                    <td className="px-4 py-3 text-right"><div className="ml-auto h-4 w-16 bg-zinc-200 dark:bg-zinc-700 rounded" /></td>
                    <td className="px-4 py-3 text-center"><div className="mx-auto h-4 w-6 bg-zinc-200 dark:bg-zinc-700 rounded" /></td>
                    <td className="px-4 py-3 text-center"><div className="mx-auto h-4 w-6 bg-zinc-200 dark:bg-zinc-700 rounded" /></td>
                </tr>
            ))}
        </>
    );
}

export function WatchlistTab() {
    const { data: watchlist, isLoading: watchlistLoading, error: watchlistError } = useWatchlist();
    const { data: listings } = useMarketListings();
    const { data: alerts } = usePriceAlerts();
    const queryClient = useQueryClient();

    const [modalOpen, setModalOpen] = useState(false);
    const [removingSymbol, setRemovingSymbol] = useState<string | null>(null);

    const listingsMap = useMemo(() => {
        if (!listings) return new Map<string, CoinListing>();
        const map = new Map<string, CoinListing>();
        for (const coin of listings) {
            map.set(coin.symbol.toUpperCase(), coin);
        }
        return map;
    }, [listings]);

    const activeAlertsBySymbol = useMemo(() => {
        if (!alerts) return new Map<string, PriceAlert[]>();
        const map = new Map<string, PriceAlert[]>();
        for (const alert of alerts) {
            if (!alert.is_triggered) {
                const key = alert.symbol.toUpperCase();
                const existing = map.get(key) ?? [];
                existing.push(alert);
                map.set(key, existing);
            }
        }
        return map;
    }, [alerts]);

    const handleRemove = useCallback(async (symbol: string) => {
        setRemovingSymbol(symbol);
        try {
            await removeFromWatchlist(symbol);
            await queryClient.invalidateQueries({ queryKey: ['watchlist'] });
        } finally {
            setRemovingSymbol(null);
        }
    }, [queryClient]);

    if (watchlistError) {
        return (
            <HoloCardWrapper intensity={8} glareOpacity={0.1}>
                <div className="glass-card rounded-2xl ring-1 ring-white/20 p-8 text-center">
                    <p className="text-rose-600 dark:text-rose-400 font-medium mb-2">Failed to load watchlist</p>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">Please try refreshing the page.</p>
                </div>
            </HoloCardWrapper>
        );
    }

    return (
        <>
            <HoloCardWrapper intensity={8} glareOpacity={0.1}>
                <div className="glass-card rounded-2xl ring-1 ring-white/20 p-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
                                <Star className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Watchlist</h3>
                            {watchlist && (
                                <span className="text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-white/5 px-2 py-0.5 rounded-full">
                                    {watchlist.length} coin{watchlist.length !== 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                        <button
                            onClick={() => setModalOpen(true)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-100 dark:bg-indigo-500/20 hover:bg-indigo-200 dark:hover:bg-indigo-500/30 text-indigo-600 dark:text-indigo-300 rounded-xl text-sm font-medium transition-colors"
                        >
                            <Plus className="h-4 w-4" />
                            Add to Watchlist
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[600px]">
                            <thead>
                                <tr className="border-b border-zinc-200 dark:border-zinc-700/50">
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                        Coin
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                        Price
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                        24h%
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                        7d%
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                        Alerts
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {watchlistLoading ? (
                                    <SkeletonRows />
                                ) : !watchlist || watchlist.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-12 text-center">
                                            <Star className="h-10 w-10 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
                                            <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                                                Your watchlist is empty. Add coins to track their prices.
                                            </p>
                                            <button
                                                onClick={() => setModalOpen(true)}
                                                className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 dark:bg-indigo-500/20 hover:bg-indigo-200 dark:hover:bg-indigo-500/30 text-indigo-600 dark:text-indigo-300 rounded-xl text-sm font-medium transition-colors"
                                            >
                                                <Plus className="h-4 w-4" />
                                                Add your first coin
                                            </button>
                                        </td>
                                    </tr>
                                ) : (
                                    watchlist.map((item, index) => {
                                        const coin = listingsMap.get(item.symbol.toUpperCase());
                                        const coinAlerts = activeAlertsBySymbol.get(item.symbol.toUpperCase());
                                        const hasActiveAlert = coinAlerts && coinAlerts.length > 0;
                                        const isRemoving = removingSymbol === item.symbol;

                                        return (
                                            <tr
                                                key={item.id}
                                                className={cn(
                                                    'hover:bg-indigo-50/50 dark:hover:bg-white/5 transition-colors',
                                                    index % 2 === 1 && 'bg-zinc-50/50 dark:bg-white/[0.02]'
                                                )}
                                            >
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                                            {item.name}
                                                        </span>
                                                        <span className="text-xs text-zinc-500 dark:text-zinc-400 uppercase">
                                                            {item.symbol}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right text-sm font-mono text-zinc-900 dark:text-zinc-100">
                                                    {coin ? formatPrice(coin.price) : (
                                                        <span className="text-zinc-400 dark:text-zinc-500">Price unavailable</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <PercentChange value={coin?.percent_change_24h} />
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <PercentChange value={coin?.percent_change_7d} />
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {hasActiveAlert ? (
                                                        <span title={`${coinAlerts.length} active alert${coinAlerts.length > 1 ? 's' : ''}`}>
                                                            <Bell className="h-4 w-4 text-indigo-600 dark:text-indigo-400 mx-auto" />
                                                        </span>
                                                    ) : (
                                                        <span className="text-zinc-300 dark:text-zinc-600">
                                                            <Bell className="h-4 w-4 mx-auto" />
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        onClick={() => handleRemove(item.symbol)}
                                                        disabled={isRemoving}
                                                        className="p-1.5 rounded-lg text-zinc-400 dark:text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                                                        title="Remove from watchlist"
                                                    >
                                                        {isRemoving ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="h-4 w-4" />
                                                        )}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </HoloCardWrapper>

            <AddToWatchlistModal open={modalOpen} onClose={() => setModalOpen(false)} />
        </>
    );
}
