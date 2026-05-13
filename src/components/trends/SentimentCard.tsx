'use client';

import { Signal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMarketListings } from '@/lib/hooks/use-market-data';
import { HoloCardWrapper } from '@/components/ui/HoloCardWrapper';
import type { CoinListing } from '@/lib/types';

type Sentiment = 'Bullish' | 'Bearish' | 'Neutral';

function deriveSentiment(coin: CoinListing): Sentiment {
    if (coin.percent_change_24h > 3 && coin.percent_change_7d > 5) return 'Bullish';
    if (coin.percent_change_24h < -3 && coin.percent_change_7d < -5) return 'Bearish';
    return 'Neutral';
}

const badgeStyles: Record<Sentiment, string> = {
    Bullish: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30',
    Bearish: 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30',
    Neutral: 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-500/30',
};

function formatPrice(price: number): string {
    if (price >= 1) {
        return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`;
}

function formatPercent(value: number): string {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
}

function SkeletonRow() {
    return (
        <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
                <div className="h-4 w-16 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
                <div className="h-4 w-20 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
            </div>
            <div className="flex items-center gap-3">
                <div className="h-5 w-16 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-700" />
                <div className="h-4 w-14 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
                <div className="h-4 w-14 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
            </div>
        </div>
    );
}

export function SentimentCard() {
    const { data, isLoading } = useMarketListings();

    const coins = data?.slice(0, 10) ?? [];

    return (
        <HoloCardWrapper intensity={8} glareOpacity={0.1}>
            <div className="glass-card rounded-2xl ring-1 ring-white/20 p-6">
                <div className="flex items-center gap-3 mb-5">
                    <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
                        <Signal className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Market Sentiment</h3>
                </div>

                {isLoading && (
                    <div className="divide-y divide-zinc-200 dark:divide-zinc-700/50">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <SkeletonRow key={i} />
                        ))}
                    </div>
                )}

                {!isLoading && coins.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 text-zinc-400 dark:text-zinc-500">
                        <Signal className="h-8 w-8 mb-2 opacity-40" />
                        <p className="text-sm">No market data available</p>
                    </div>
                )}

                {!isLoading && coins.length > 0 && (
                    <div className="divide-y divide-zinc-200 dark:divide-zinc-700/50">
                        {coins.map((coin) => {
                            const sentiment = deriveSentiment(coin);
                            return (
                                <div
                                    key={coin.id}
                                    className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                                            {coin.symbol}
                                        </span>
                                        <span className="text-sm text-zinc-500 dark:text-zinc-400">
                                            {formatPrice(coin.price)}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0">
                                        <span
                                            className={cn(
                                                'text-xs font-medium px-2 py-0.5 rounded-full',
                                                badgeStyles[sentiment],
                                            )}
                                        >
                                            {sentiment}
                                        </span>
                                        <span
                                            className={cn(
                                                'text-xs tabular-nums w-16 text-right',
                                                coin.percent_change_24h >= 0
                                                    ? 'text-emerald-600 dark:text-emerald-400'
                                                    : 'text-rose-600 dark:text-rose-400',
                                            )}
                                        >
                                            {formatPercent(coin.percent_change_24h)}
                                        </span>
                                        <span
                                            className={cn(
                                                'text-xs tabular-nums w-16 text-right',
                                                coin.percent_change_7d >= 0
                                                    ? 'text-emerald-600 dark:text-emerald-400'
                                                    : 'text-rose-600 dark:text-rose-400',
                                            )}
                                        >
                                            {formatPercent(coin.percent_change_7d)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </HoloCardWrapper>
    );
}
