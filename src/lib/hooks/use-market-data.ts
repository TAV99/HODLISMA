'use client';

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import type { CoinListing } from '@/lib/types';

const PAGE_LIMIT = 100;

interface ListingsPage {
    data: CoinListing[];
    start: number;
    limit: number;
    hasMore: boolean;
}

export function useMarketListings() {
    return useQuery<CoinListing[]>({
        queryKey: ['market-listings'],
        queryFn: async () => {
            const res = await fetch('/api/trends/listings');
            if (!res.ok) throw new Error('Failed to fetch listings');
            const json: ListingsPage = await res.json();
            return json.data;
        },
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });
}

export function useInfiniteMarketListings() {
    return useInfiniteQuery<ListingsPage>({
        queryKey: ['market-listings-infinite'],
        queryFn: async ({ pageParam }) => {
            const res = await fetch(`/api/trends/listings?start=${pageParam}&limit=${PAGE_LIMIT}`);
            if (!res.ok) throw new Error('Failed to fetch listings');
            return res.json();
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage) => {
            if (!lastPage.hasMore) return undefined;
            return lastPage.start + lastPage.limit;
        },
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });
}
