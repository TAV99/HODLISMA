'use client';

import { TrendingUp, TrendingDown, ArrowRight, ArrowUpRight } from 'lucide-react';

interface TrendIndicatorProps {
    percentChange7d: number;
}

export function TrendIndicator({ percentChange7d }: TrendIndicatorProps) {
    if (percentChange7d > 5) {
        return (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                <TrendingUp className="h-3 w-3" />
                Uptrend 7d
            </span>
        );
    }

    if (percentChange7d > 0) {
        return (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-300">
                <ArrowUpRight className="h-3 w-3" />
                Slight Up
            </span>
        );
    }

    if (percentChange7d >= -5) {
        return (
            <span className="inline-flex items-center gap-1 text-xs text-yellow-400">
                <ArrowRight className="h-3 w-3" />
                Sideways
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1 text-xs text-rose-400">
            <TrendingDown className="h-3 w-3" />
            Downtrend 7d
        </span>
    );
}
