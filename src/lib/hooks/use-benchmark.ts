'use client';

import { useQuery } from '@tanstack/react-query';
import type { BenchmarkPoint } from '@/lib/types';

export function useBenchmark(range: '7d' | '30d' | '90d' = '7d') {
    return useQuery<BenchmarkPoint[]>({
        queryKey: ['benchmark', range],
        queryFn: async () => {
            const res = await fetch(`/api/trends/benchmark?range=${range}`);
            if (!res.ok) throw new Error('Failed to fetch benchmark');
            const json = await res.json();
            return json.data;
        },
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });
}
