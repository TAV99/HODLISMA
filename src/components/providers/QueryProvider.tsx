'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';

interface QueryProviderProps {
    children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
    // Create a new QueryClient instance for each session
    // This prevents data from being shared between different users/requests
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        // Cache market data for 1 minute
                        staleTime: 60 * 1000,
                        // Keep cached data for 5 minutes
                        gcTime: 5 * 60 * 1000,
                        // Retry failed requests 2 times
                        retry: 2,
                        // Refetch on window focus for fresh data
                        refetchOnWindowFocus: true,
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}
