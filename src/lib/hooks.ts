'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
import { removeCryptoAssetById, updateCryptoAssetById } from '@/lib/actions/crypto';
import type { Asset, AssetInput, MarketPriceResponse } from '@/lib/types';

/**
 * Fetch all assets from Supabase database
 */
export function useAssets() {
    return useQuery<Asset[], Error>({
        queryKey: ['assets'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('assets')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                throw new Error(error.message);
            }

            return data ?? [];
        },
    });
}

/**
 * Fetch cryptocurrency prices from our API proxy
 * @param symbols - Array of crypto symbols (e.g., ['BTC', 'ETH'])
 */
export function useCryptoPrices(symbols: string[]) {
    const symbolString = symbols.join(',');

    return useQuery<MarketPriceResponse, Error>({
        queryKey: ['crypto-prices', symbolString],
        queryFn: async () => {
            const response = await fetch(`/api/crypto?symbol=${encodeURIComponent(symbolString)}`);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `API Error: ${response.status}`);
            }

            return response.json();
        },
        // Only fetch when we have symbols
        enabled: symbols.length > 0,
        // Auto-refresh every 10 minutes to keep data fresh
        refetchInterval: 600000,
        // Keep previous data while refetching
        placeholderData: (previousData) => previousData,
    });
}

/**
 * Combined hook that fetches assets and their prices together
 */
export function usePortfolio() {
    const assetsQuery = useAssets();

    // Extract unique symbols from assets
    const symbols = assetsQuery.data
        ? [...new Set(assetsQuery.data.map((asset) => asset.symbol.toUpperCase()))]
        : [];

    const pricesQuery = useCryptoPrices(symbols);

    return {
        assets: assetsQuery.data ?? [],
        prices: pricesQuery.data ?? {},
        isLoading: assetsQuery.isLoading || pricesQuery.isLoading,
        isRefetching: assetsQuery.isRefetching || pricesQuery.isRefetching,
        error: assetsQuery.error || pricesQuery.error,
        refetch: () => {
            assetsQuery.refetch();
            pricesQuery.refetch();
        },
    };
}

/**
 * Delete an asset from the database
 */
export function useDeleteAsset() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const result = await removeCryptoAssetById(id);
            if (!result.success) throw new Error(result.error);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assets'] });
        },
    });
}

/**
 * Update an existing asset
 */
export function useUpdateAsset() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<AssetInput> }) => {
            const result = await updateCryptoAssetById(id, data);
            if (!result.success) throw new Error(result.error);
            return result.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assets'] });
        },
    });
}

