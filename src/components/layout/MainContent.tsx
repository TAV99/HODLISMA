'use client';

import { useSidebar } from '@/components/layout/SidebarContext';
import { cn } from '@/lib/utils';

/**
 * Main Content wrapper that adjusts margin based on sidebar state
 */
export function MainContent({ children }: { children: React.ReactNode }) {
    const { collapsed } = useSidebar();

    return (
        <main
            className={cn(
                "flex-1 overflow-y-auto transition-all duration-300 ease-in-out relative z-10",
                // Mobile: remove left margin
                "ml-0",
                // Desktop: apply margin based on sidebar state
                collapsed ? "md:ml-20" : "md:ml-64"
            )}
        >
            {children}
        </main>
    );
}
