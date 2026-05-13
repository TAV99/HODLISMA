'use client';

import { useRealtimeRefresh } from '@/hooks/use-realtime-refresh';

const REALTIME_TABLES: string[] = ['personal_transactions', 'assets', 'finance_categories', 'savings_vault', 'audit_logs', 'watchlist', 'price_alerts'];

export function RealtimeListener() {
    useRealtimeRefresh(REALTIME_TABLES);
    return null;
}
