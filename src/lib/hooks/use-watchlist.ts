'use client';

import { useQuery } from '@tanstack/react-query';
import { getWatchlist } from '@/lib/actions/watchlist';
import type { WatchlistItem } from '@/lib/types';

export function useWatchlist() {
    return useQuery<WatchlistItem[]>({
        queryKey: ['watchlist'],
        queryFn: async () => {
            const result = await getWatchlist();
            if (!result.success) throw new Error(result.error);
            return result.data;
        },
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });
}
