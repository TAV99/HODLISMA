'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useCallback } from 'react';
import { getActiveAlerts, markAlertTriggered } from '@/lib/actions/alerts';
import type { PriceAlert, CoinListing } from '@/lib/types';

export function usePriceAlerts() {
    return useQuery<PriceAlert[]>({
        queryKey: ['price-alerts'],
        queryFn: async () => {
            const result = await getActiveAlerts();
            if (!result.success) throw new Error(result.error);
            return result.data;
        },
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });
}

export function useAlertChecker(
    prices: CoinListing[] | undefined,
    alerts: PriceAlert[] | undefined,
    onAlertTriggered?: (alert: PriceAlert, currentPrice: number) => void
) {
    const queryClient = useQueryClient();
    const checkedRef = useRef<Set<string>>(new Set());

    const checkAlerts = useCallback(async () => {
        if (!prices || !alerts || alerts.length === 0) return;

        for (const alert of alerts) {
            if (checkedRef.current.has(alert.id)) continue;

            const coin = prices.find(p => p.symbol === alert.symbol);
            if (!coin) continue;

            const triggered =
                (alert.condition === 'above' && coin.price >= alert.target_price) ||
                (alert.condition === 'below' && coin.price <= alert.target_price);

            if (triggered) {
                checkedRef.current.add(alert.id);
                await markAlertTriggered(alert.id);
                queryClient.invalidateQueries({ queryKey: ['price-alerts'] });
                onAlertTriggered?.(alert, coin.price);
            }
        }
    }, [prices, alerts, queryClient, onAlertTriggered]);

    useEffect(() => {
        checkAlerts(); // check immediately
        const interval = setInterval(checkAlerts, 60 * 1000); // then every 60s
        return () => clearInterval(interval);
    }, [checkAlerts]);
}
