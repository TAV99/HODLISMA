'use client';

import { SidebarProvider } from '@/components/layout/SidebarContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { MainContent } from '@/components/layout/MainContent';
import { ChatWidget } from '@/components/ai/ChatWidget';

export function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <div className="flex h-screen overflow-hidden">
                <Sidebar />
                <MainContent>{children}</MainContent>
                <ChatWidget />
            </div>
        </SidebarProvider>
    );
}
