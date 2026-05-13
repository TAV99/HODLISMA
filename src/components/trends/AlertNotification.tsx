'use client';

import { useState, useCallback } from 'react';
import { Bell, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import { useMarketListings } from '@/lib/hooks/use-market-data';
import { usePriceAlerts, useAlertChecker } from '@/lib/hooks/use-price-alerts';
import type { PriceAlert } from '@/lib/types';

interface Toast {
    id: string;
    symbol: string;
    condition: string;
    targetPrice: number;
    currentPrice: number;
}

export function AlertNotification() {
    const { data: listings } = useMarketListings();
    const { data: alerts } = usePriceAlerts();
    const [toasts, setToasts] = useState<Toast[]>([]);

    const handleAlertTriggered = useCallback((alert: PriceAlert, currentPrice: number) => {
        const id = crypto.randomUUID();
        setToasts(prev => [...prev, {
            id,
            symbol: alert.symbol,
            condition: alert.condition,
            targetPrice: alert.target_price,
            currentPrice,
        }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
    }, []);

    useAlertChecker(listings, alerts, handleAlertTriggered);

    const dismissToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3">
            {toasts.map((toast, index) => (
                <div
                    key={toast.id}
                    className={cn(
                        'w-80 glass-card rounded-xl ring-1 ring-white/20 p-4 shadow-2xl',
                        'animate-in slide-in-from-right-full fade-in duration-300',
                    )}
                    style={{
                        animationDelay: `${index * 50}ms`,
                    }}
                >
                    <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-500/20">
                            <Bell className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                                Price Alert Triggered!
                            </p>
                            <p className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
                                {toast.symbol} is now {toast.condition} {formatCurrency(toast.targetPrice)}
                            </p>
                            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                                Current price: {formatCurrency(toast.currentPrice)}
                            </p>
                        </div>
                        <button
                            onClick={() => dismissToast(toast.id)}
                            className="shrink-0 rounded-lg p-1 text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/10 hover:text-zinc-900 dark:hover:text-white transition-colors"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
