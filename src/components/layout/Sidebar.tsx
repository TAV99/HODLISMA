'use client';

import {
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebar } from './SidebarContext';
import { NavContent } from './NavContent';

/**
 * Sidebar Navigation Component (Desktop)
 * Collapsible sidebar with two distinct sections for Investments and Personal Finance
 */
export function Sidebar() {
    const { collapsed, toggle } = useSidebar();

    return (
        <aside
            className={cn(
                "fixed left-0 top-0 z-40 h-screen transition-all duration-300 ease-in-out hidden md:flex flex-col",
                "bg-slate-900/95 backdrop-blur-xl border-r border-white/10",
                collapsed ? "w-20" : "w-64"
            )}
        >
            <NavContent collapsed={collapsed} />

            {/* Collapse Toggle */}
            <div className="p-3 border-t border-white/10 mt-auto">
                <button
                    onClick={toggle}
                    className={cn(
                        "w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl",
                        "text-slate-400 hover:text-white hover:bg-white/10 transition-colors",
                        "text-sm"
                    )}
                >
                    {collapsed ? (
                        <ChevronRight className="h-4 w-4" />
                    ) : (
                        <>
                            <ChevronLeft className="h-4 w-4" />
                            <span>Thu gọn</span>
                        </>
                    )}
                </button>
            </div>
        </aside>
    );
}
