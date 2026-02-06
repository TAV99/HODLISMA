'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export function useRealtimeRefresh(tables: string[] = ['personal_transactions', 'assets']) {
    const router = useRouter();

    useEffect(() => {
        const channels = tables.map(table => {
            const channel = supabase
                .channel(`realtime_${table}`)
                .on('system', { event: '*' }, (status) => {
                    console.log(`[Realtime - ${table}] 🔌 System Status:`, status);
                })
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: table,
                    },
                    (payload) => {
                        console.log(`[Realtime - ${table}] 🚀 Payload Received:`, payload);
                        console.log(`[Realtime - ${table}] 🔄 Triggering router.refresh()...`);
                        router.refresh();
                    }
                )
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        console.log(`[Realtime - ${table}] ✅ Subscribed successfully`);
                    } else {
                        console.error(`[Realtime - ${table}] ❌ Subscription failed:`, status);
                    }
                });

            return channel;
        });

        return () => {
            channels.forEach(channel => supabase.removeChannel(channel));
        };
    }, [tables, router]);
}
