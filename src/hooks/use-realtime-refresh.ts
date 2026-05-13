'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export function useRealtimeRefresh(tables: string[] = ['personal_transactions', 'assets']) {
    const router = useRouter();

    useEffect(() => {
        const channels = tables.map(table => {
            const channel = supabase
                .channel(`realtime_${table}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: table,
                    },
                    () => {
                        router.refresh();
                    }
                )
                .subscribe();

            return channel;
        });

        return () => {
            channels.forEach(channel => supabase.removeChannel(channel));
        };
    }, [tables, router]);
}
