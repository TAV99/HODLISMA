'use client';

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Bell, ChevronDown, Loader2, Check, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import { useWatchlist } from '@/lib/hooks/use-watchlist';
import { useMarketListings } from '@/lib/hooks/use-market-data';
import { createPriceAlert } from '@/lib/actions/alerts';
import { HoloCardWrapper } from '@/components/ui/HoloCardWrapper';
import type { WatchlistItem, CoinListing } from '@/lib/types';

export function PriceAlertForm({ onClose }: { onClose?: () => void }) {
    const queryClient = useQueryClient();
    const { data: watchlist } = useWatchlist();
    const { data: listings } = useMarketListings();

    const [selectedSymbol, setSelectedSymbol] = useState('');
    const [condition, setCondition] = useState<'above' | 'below'>('above');
    const [targetPrice, setTargetPrice] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setError] = useState('');
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const selectedCoin = listings?.find(
        (c: CoinListing) => c.symbol === selectedSymbol
    );

    const handleSelectCoin = useCallback((symbol: string) => {
        setSelectedSymbol(symbol);
        setDropdownOpen(false);
        setError('');
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!selectedSymbol) {
            setError('Please select a coin');
            return;
        }

        const price = parseFloat(targetPrice);
        if (!targetPrice || isNaN(price) || price <= 0) {
            setError('Target price must be greater than 0');
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await createPriceAlert(selectedSymbol, condition, price);
            if (!result.success) {
                setError(result.error);
                return;
            }

            await queryClient.invalidateQueries({ queryKey: ['price-alerts'] });
            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
                onClose?.();
            }, 1500);
        } catch {
            setError('Failed to create alert');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <HoloCardWrapper intensity={8} glareOpacity={0.1}>
            <div className="glass-card rounded-2xl ring-1 ring-white/20 p-5">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
                        <Bell className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Create Price Alert</h3>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Select Coin</label>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                className={cn(
                                    'flex w-full items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-white/5 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100',
                                    'hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors',
                                    !selectedSymbol && 'text-zinc-400 dark:text-zinc-500'
                                )}
                            >
                                <span>
                                    {selectedSymbol
                                        ? watchlist?.find((w: WatchlistItem) => w.symbol === selectedSymbol)?.name ?? selectedSymbol
                                        : 'Choose a coin...'}
                                </span>
                                <ChevronDown className={cn('h-4 w-4 text-zinc-400 dark:text-zinc-500 transition-transform', dropdownOpen && 'rotate-180')} />
                            </button>

                            {dropdownOpen && (
                                <div className="absolute z-50 mt-1 w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 backdrop-blur-xl shadow-xl max-h-48 overflow-y-auto">
                                    {watchlist && watchlist.length > 0 ? (
                                        watchlist.map((item: WatchlistItem) => (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() => handleSelectCoin(item.symbol)}
                                                className={cn(
                                                    'flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors',
                                                    selectedSymbol === item.symbol ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-900 dark:text-zinc-100'
                                                )}
                                            >
                                                <span>{item.name} ({item.symbol})</span>
                                                {selectedSymbol === item.symbol && <Check className="h-3 w-3" />}
                                            </button>
                                        ))
                                    ) : (
                                        <div className="px-3 py-2 text-sm text-zinc-400 dark:text-zinc-500">No coins in watchlist</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {selectedCoin && (
                        <div className="flex items-center justify-between rounded-lg bg-zinc-100 dark:bg-white/5 px-3 py-2">
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">Current Price</span>
                            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{formatCurrency(selectedCoin.price)}</span>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Condition</label>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setCondition('above')}
                                className={cn(
                                    'flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-all',
                                    condition === 'above'
                                        ? 'border-emerald-300 dark:border-emerald-500/50 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                        : 'border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600'
                                )}
                            >
                                <ArrowUp className="h-3.5 w-3.5" />
                                Above
                            </button>
                            <button
                                type="button"
                                onClick={() => setCondition('below')}
                                className={cn(
                                    'flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-all',
                                    condition === 'below'
                                        ? 'border-rose-300 dark:border-rose-500/50 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400'
                                        : 'border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600'
                                )}
                            >
                                <ArrowDown className="h-3.5 w-3.5" />
                                Below
                            </button>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Target Price</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400 dark:text-zinc-500">$</span>
                            <input
                                type="number"
                                step="any"
                                min="0"
                                value={targetPrice}
                                onChange={(e) => { setTargetPrice(e.target.value); setError(''); }}
                                placeholder="0.00"
                                className={cn(
                                    'w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-white/5 pl-7 pr-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500',
                                    'focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-colors'
                                )}
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>

                    {error && (
                        <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>
                    )}

                    {showSuccess && (
                        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 px-3 py-2">
                            <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-xs text-emerald-600 dark:text-emerald-400">Alert created successfully</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting || showSuccess}
                        className={cn(
                            'w-full rounded-lg py-2.5 text-sm font-medium text-white transition-all',
                            'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600',
                            'disabled:opacity-50 disabled:cursor-not-allowed'
                        )}
                    >
                        {isSubmitting ? (
                            <span className="flex items-center justify-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Creating...
                            </span>
                        ) : (
                            'Create Alert'
                        )}
                    </button>
                </form>
            </div>
        </HoloCardWrapper>
    );
}
