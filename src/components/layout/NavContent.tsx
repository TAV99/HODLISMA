'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Bitcoin,
    Wallet,
    Receipt,
    Sparkles,
    TrendingUp,
    PiggyBank,
    Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

interface NavContentProps {
    collapsed?: boolean;
    onNavigate?: () => void; // Callback to close mobile menu
}

export function NavContent({ collapsed = false, onNavigate }: NavContentProps) {
    const pathname = usePathname();

    return (
        <div className="flex flex-col h-full">
            {/* Logo/Header */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-white/10 flex-shrink-0">
                {!collapsed && (
                    <Link href="/" className="flex items-center gap-2" onClick={onNavigate}>
                        <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
                            <Sparkles className="h-4 w-4 text-white" />
                        </div>
                        <span className="font-bold text-lg bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                            HODLISMA
                        </span>
                    </Link>
                )}
                {collapsed && (
                    <Link href="/" className="mx-auto" onClick={onNavigate}>
                        <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
                            <Sparkles className="h-4 w-4 text-white" />
                        </div>
                    </Link>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-6 overflow-y-auto">
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
                                            onClick={onNavigate}
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
        </div>
    );
}
