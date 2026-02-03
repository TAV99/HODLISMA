'use client';

import { useState } from 'react';
import {
    ArrowUpCircle,
    ArrowDownCircle,
    TrendingUp as InvestIcon,
    Calendar,
    MoreHorizontal,
    Plus,
} from 'lucide-react';
import { HoloCardWrapper } from '@/components/ui/HoloCardWrapper';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { PersonalTransaction } from '@/lib/types';

interface TransactionTableProps {
    transactions: PersonalTransaction[];
    isLoading?: boolean;
    onAddClick?: () => void;
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
 * Format date to Vietnamese locale
 */
function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

/**
 * Transaction type badge
 */
function TypeBadge({ type }: { type: string }) {
    const config = {
        income: {
            label: 'Thu',
            icon: ArrowUpCircle,
            className: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
        },
        expense: {
            label: 'Chi',
            icon: ArrowDownCircle,
            className: 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300',
        },
        investment: {
            label: 'Đầu tư',
            icon: InvestIcon,
            className: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300',
        },
    };

    const { label, icon: Icon, className } = config[type as keyof typeof config] || config.expense;

    return (
        <span className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
            className
        )}>
            <Icon className="h-3.5 w-3.5" />
            {label}
        </span>
    );
}

/**
 * Empty state
 */
function EmptyState({ onAddClick }: { onAddClick?: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 rounded-full bg-zinc-100 dark:bg-zinc-800 mb-4">
                <Calendar className="h-8 w-8 text-zinc-400" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                Chưa có giao dịch
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                Bắt đầu ghi chép thu chi của bạn
            </p>
            {onAddClick && (
                <Button onClick={onAddClick} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Thêm giao dịch
                </Button>
            )}
        </div>
    );
}

/**
 * Loading skeleton
 */
function TableSkeleton() {
    return (
        <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
                    <div className="h-10 w-10 bg-zinc-200 dark:bg-zinc-700 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-700 rounded" />
                        <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-700 rounded" />
                    </div>
                    <div className="h-5 w-20 bg-zinc-200 dark:bg-zinc-700 rounded" />
                </div>
            ))}
        </div>
    );
}

/**
 * Transaction Table Component
 * Displays list of transactions with type badges and category info
 */
export function TransactionTable({ transactions, isLoading, onAddClick }: TransactionTableProps) {
    if (isLoading) {
        return (
            <HoloCardWrapper intensity={8} glareOpacity={0.1}>
                <div className="glass-card rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                            Giao dịch gần đây
                        </h3>
                    </div>
                    <TableSkeleton />
                </div>
            </HoloCardWrapper>
        );
    }

    return (
        <HoloCardWrapper intensity={8} glareOpacity={0.1}>
            <div className="glass-card rounded-2xl p-6">
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                        Giao dịch gần đây
                    </h3>
                </div>

                {transactions.length === 0 ? (
                    <EmptyState onAddClick={onAddClick} />
                ) : (
                    <div className="space-y-2">
                        {transactions.map((tx) => (
                            <div
                                key={tx.id}
                                className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/50 dark:hover:bg-white/5 transition-colors group"
                            >
                                {/* Type Badge */}
                                <TypeBadge type={tx.type} />

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                                        {tx.category?.name || 'Không phân loại'}
                                    </p>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                        {tx.note || formatDate(tx.date)}
                                    </p>
                                </div>

                                {/* Amount */}
                                <div className="text-right">
                                    <p className={cn(
                                        "font-mono font-semibold tabular-nums",
                                        tx.type === 'income'
                                            ? "text-emerald-600 dark:text-emerald-400"
                                            : "text-rose-600 dark:text-rose-400"
                                    )}>
                                        {tx.type === 'income' ? '+' : '-'}{formatVND(tx.amount)}
                                    </p>
                                    <p className="text-xs text-zinc-400">
                                        {formatDate(tx.date)}
                                    </p>
                                </div>

                                {/* Actions */}
                                <button className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreHorizontal className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </HoloCardWrapper>
    );
}
