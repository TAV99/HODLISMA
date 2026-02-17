'use client';

import { SidebarProvider } from '@/components/layout/SidebarContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { MainContent } from '@/components/layout/MainContent';
import { MobileNav } from '@/components/layout/MobileNav';

/**
 * Client-side layout wrapper with Sidebar context
 */
export function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <div className="flex h-screen overflow-hidden flex-col md:flex-row bg-slate-950">
                <MobileNav />
                <Sidebar />
                <MainContent>{children}</MainContent>
            </div>
        </SidebarProvider>
    );
}
