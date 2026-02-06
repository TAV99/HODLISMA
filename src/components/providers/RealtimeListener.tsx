'use client';

import { useRealtimeRefresh } from '@/hooks/use-realtime-refresh';

export function RealtimeListener() {
    useRealtimeRefresh(['personal_transactions', 'assets', 'finance_categories', 'savings_vault']);
    return null;
}
