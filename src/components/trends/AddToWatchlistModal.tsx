'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Search, Plus, X, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMarketListings } from '@/lib/hooks/use-market-data';
import { useWatchlist } from '@/lib/hooks/use-watchlist';
import { addToWatchlist } from '@/lib/actions/watchlist';
import { useQueryClient } from '@tanstack/react-query';

interface AddToWatchlistModalProps {
    open: boolean;
    onClose: () => void;
}

function formatPrice(value: number): string {
    if (value >= 1) {
        return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 6, maximumFractionDigits: 6 })}`;
}

export function AddToWatchlistModal({ open, onClose }: AddToWatchlistModalProps) {
    const { data: listings } = useMarketListings();
    const { data: watchlist } = useWatchlist();
    const queryClient = useQueryClient();

    const [search, setSearch] = useState('');
    const [addingSymbol, setAddingSymbol] = useState<string | null>(null);
    const [addedSymbols, setAddedSymbols] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (open) {
            setSearch('');
            setAddingSymbol(null);
            setAddedSymbols(new Set());
        }
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [open, onClose]);

    const watchlistSymbols = useMemo(() => {
        if (!watchlist) return new Set<string>();
        return new Set(watchlist.map((w) => w.symbol.toUpperCase()));
    }, [watchlist]);

    const filteredCoins = useMemo(() => {
        if (!listings) return [];
        const query = search.toLowerCase().trim();
        if (!query) return listings.slice(0, 10);

        return listings
            .filter(
                (c) =>
                    c.name.toLowerCase().includes(query) ||
                    c.symbol.toLowerCase().includes(query)
            )
            .slice(0, 10);
    }, [listings, search]);

    const handleAdd = useCallback(async (symbol: string, name: string) => {
        setAddingSymbol(symbol);
        try {
            await addToWatchlist(symbol, name);
            await queryClient.invalidateQueries({ queryKey: ['watchlist'] });
            setAddedSymbols((prev) => new Set(prev).add(symbol.toUpperCase()));
        } finally {
            setAddingSymbol(null);
        }
    }, [queryClient]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" />

            <div className="relative w-full max-w-lg glass-card rounded-2xl ring-1 ring-white/20 shadow-2xl">
                <div className="flex items-center justify-between px-6 pt-5 pb-3">
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Add to Watchlist</h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="px-6 pb-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Search by name or symbol..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            autoFocus
                            className="w-full pl-10 pr-4 py-2.5 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition"
                        />
                    </div>
                </div>

                <div className="px-3 pb-4 max-h-[360px] overflow-y-auto">
                    {!listings ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 text-zinc-400 dark:text-zinc-500 animate-spin" />
                        </div>
                    ) : filteredCoins.length === 0 ? (
                        <p className="text-center text-zinc-500 dark:text-zinc-400 text-sm py-8">
                            No coins found matching &quot;{search}&quot;
                        </p>
                    ) : (
                        <ul className="space-y-1">
                            {filteredCoins.map((coin) => {
                                const symbolUpper = coin.symbol.toUpperCase();
                                const alreadyInWatchlist = watchlistSymbols.has(symbolUpper) || addedSymbols.has(symbolUpper);
                                const isAdding = addingSymbol === coin.symbol;

                                return (
                                    <li
                                        key={coin.id}
                                        className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                                                    {coin.name}
                                                </span>
                                                <span className="text-xs text-zinc-500 dark:text-zinc-400 uppercase flex-shrink-0">
                                                    {coin.symbol}
                                                </span>
                                            </div>
                                            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                                                {formatPrice(coin.price)}
                                            </span>
                                        </div>

                                        {alreadyInWatchlist ? (
                                            <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 px-3 py-1.5">
                                                <Check className="h-3.5 w-3.5" />
                                                Added
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => handleAdd(coin.symbol, coin.name)}
                                                disabled={isAdding}
                                                className={cn(
                                                    'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                                                    'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-500/30',
                                                    'disabled:opacity-50'
                                                )}
                                            >
                                                {isAdding ? (
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                ) : (
                                                    <Plus className="h-3.5 w-3.5" />
                                                )}
                                                Add
                                            </button>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
