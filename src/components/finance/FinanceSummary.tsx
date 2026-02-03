'use client';

import { useMemo } from 'react';
import { Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Scale } from 'lucide-react';
import { HoloCardWrapper } from '@/components/ui/HoloCardWrapper';
import { cn } from '@/lib/utils';
import type { MonthlySummary } from '@/lib/types';

interface FinanceSummaryProps {
    summary: MonthlySummary;
    isLoading?: boolean;
}

/**
 * Format number as VND currency
 */
function formatVND(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
        style: 'decimal',
        maximumFractionDigits: 0,
    }).format(amount) + 'đ';
}

/**
 * Premium Metric Card for Finance
 */
function MetricCard({
    title,
    value,
    icon: Icon,
    variant = 'default',
    trend,
}: {
    title: string;
    value: string;
    icon: React.ElementType;
    variant?: 'default' | 'income' | 'expense' | 'balance';
    trend?: 'up' | 'down';
}) {
    const colorMap = {
        default: {
            bg: 'bg-indigo-100 dark:bg-indigo-900/30',
            icon: 'text-indigo-600 dark:text-indigo-400',
            value: 'text-zinc-900 dark:text-zinc-100',
        },
        income: {
            bg: 'bg-emerald-100 dark:bg-emerald-900/30',
            icon: 'text-emerald-600 dark:text-emerald-400',
            value: 'text-emerald-600 dark:text-emerald-400',
        },
        expense: {
            bg: 'bg-rose-100 dark:bg-rose-900/30',
            icon: 'text-rose-600 dark:text-rose-400',
            value: 'text-rose-600 dark:text-rose-400',
        },
        balance: {
            bg: 'bg-amber-100 dark:bg-amber-900/30',
            icon: 'text-amber-600 dark:text-amber-400',
            value: 'text-amber-600 dark:text-amber-400',
        },
    };

    const colors = colorMap[variant];

    return (
        <HoloCardWrapper intensity={12} glareOpacity={0.18}>
            <div className={cn(
                "glass-card rounded-2xl p-6 h-full",
                "ring-1 ring-white/20",
                variant === 'income' && "glow-emerald",
                variant === 'expense' && "glow-rose"
            )}>
                <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        {title}
                    </span>
                    <div className={cn("p-2 rounded-xl", colors.bg)}>
                        <Icon className={cn("h-5 w-5", colors.icon)} />
                    </div>
                </div>

                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className={cn(
                            "text-3xl font-bold font-mono tracking-tight tabular-nums",
                            colors.value
                        )}>
                            {value}
                        </span>
                        {trend && (
                            trend === 'up' ? (
                                <ArrowUpRight className="h-5 w-5 text-emerald-500" />
                            ) : (
                                <ArrowDownRight className="h-5 w-5 text-rose-500" />
                            )
                        )}
                    </div>
                </div>
            </div>
        </HoloCardWrapper>
    );
}

/**
 * Loading skeleton for summary cards
 */
function SummarySkeleton() {
    return (
        <div className="grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
                <div key={i} className="glass-card rounded-2xl p-6 animate-pulse">
                    <div className="flex items-center justify-between mb-4">
                        <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-700 rounded" />
                        <div className="h-9 w-9 bg-zinc-200 dark:bg-zinc-700 rounded-xl" />
                    </div>
                    <div className="h-10 w-40 bg-zinc-200 dark:bg-zinc-700 rounded mt-2" />
                </div>
            ))}
        </div>
    );
}

/**
 * Finance Summary Component
 * Displays key financial metrics with holographic card effect
 */
export function FinanceSummary({ summary, isLoading }: FinanceSummaryProps) {
    const netBalance = useMemo(() => {
        return summary.total_income - summary.total_expense;
    }, [summary]);

    const isPositive = netBalance >= 0;

    if (isLoading) {
        return <SummarySkeleton />;
    }

    return (
        <div className="grid gap-6 md:grid-cols-3">
            <MetricCard
                title="Thu nhập tháng"
                value={formatVND(summary.total_income)}
                icon={TrendingUp}
                variant="income"
            />
            <MetricCard
                title="Chi tiêu tháng"
                value={formatVND(summary.total_expense)}
                icon={TrendingDown}
                variant="expense"
            />
            <MetricCard
                title="Số dư"
                value={`${isPositive ? '+' : ''}${formatVND(netBalance)}`}
                icon={isPositive ? Wallet : Scale}
                variant={isPositive ? 'income' : 'expense'}
                trend={isPositive ? 'up' : 'down'}
            />
        </div>
    );
}
