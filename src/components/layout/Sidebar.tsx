'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Bitcoin,
    Wallet,
    Receipt,
    Sparkles,
    ChevronLeft,
    ChevronRight,
    TrendingUp,
    PiggyBank,
    Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebar } from './SidebarContext';

interface NavItem {
    label: string;
    href: string;
    icon: React.ElementType;
}

interface NavSection {
    title: string;
    items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
    {
        title: 'INVESTMENTS',
        items: [
            { label: 'Portfolio', href: '/', icon: Bitcoin },
            { label: 'Market Trends', href: '/trends', icon: TrendingUp },
        ],
    },
    {
        title: 'PERSONAL FINANCE',
        items: [
            { label: 'Dashboard', href: '/finance', icon: Wallet },
            { label: 'Transactions', href: '/finance/transactions', icon: Receipt },
            { label: 'Savings', href: '/finance/savings', icon: PiggyBank },
        ],
    },
    {
        title: 'SYSTEM',
        items: [
            { label: 'Activity Log', href: '/history', icon: Clock },
        ],
    },
];

/**
 * Sidebar Navigation Component
 * Collapsible sidebar with two distinct sections for Investments and Personal Finance
 */
export function Sidebar() {
    const pathname = usePathname();
    const { collapsed, toggle } = useSidebar();

    return (
        <aside
            className={cn(
                "fixed left-0 top-0 z-40 h-screen transition-all duration-300 ease-in-out",
                "bg-slate-900/95 backdrop-blur-xl border-r border-white/10",
                collapsed ? "w-20" : "w-64"
            )}
        >
            {/* Logo/Header */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
                {!collapsed && (
                    <Link href="/" className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
                            <Sparkles className="h-4 w-4 text-white" />
                        </div>
                        <span className="font-bold text-lg bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                            HODLISMA
                        </span>
                    </Link>
                )}
                {collapsed && (
                    <Link href="/" className="mx-auto">
                        <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
                            <Sparkles className="h-4 w-4 text-white" />
                        </div>
                    </Link>
                )}
            </div>

            {/* Navigation */}
            <nav className="p-3 space-y-6 overflow-y-auto h-[calc(100vh-8rem)]">
                {NAV_SECTIONS.map((section) => (
                    <div key={section.title}>
                        {!collapsed && (
                            <h3 className="px-3 mb-2 text-[10px] font-semibold tracking-widest text-slate-500 uppercase">
                                {section.title}
                            </h3>
                        )}
                        <ul className="space-y-1">
                            {section.items.map((item) => {
                                const isActive = pathname === item.href ||
                                    (item.href !== '/' && pathname.startsWith(item.href));
                                const Icon = item.icon;

                                return (
                                    <li key={item.href}>
                                        <Link
                                            href={item.href}
                                            className={cn(
                                                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                                                "hover:bg-white/10",
                                                isActive
                                                    ? "bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-white border border-indigo-500/30"
                                                    : "text-slate-400 hover:text-white",
                                                collapsed && "justify-center px-2"
                                            )}
                                            title={collapsed ? item.label : undefined}
                                        >
                                            <Icon className={cn(
                                                "h-5 w-5 flex-shrink-0",
                                                isActive && "text-indigo-400"
                                            )} />
                                            {!collapsed && (
                                                <span className="text-sm font-medium">
                                                    {item.label}
                                                </span>
                                            )}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </nav>

            {/* Collapse Toggle */}
            <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-white/10">
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
