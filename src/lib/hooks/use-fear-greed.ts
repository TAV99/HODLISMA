'use client';

import { useQuery } from '@tanstack/react-query';
import type { FearGreedData } from '@/lib/types';

export function useFearGreed() {
    return useQuery<FearGreedData>({
        queryKey: ['fear-greed'],
        queryFn: async () => {
            const res = await fetch('/api/trends/fear-greed');
            if (!res.ok) throw new Error('Failed to fetch Fear & Greed');
            return res.json();
        },
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });
}
