'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';
import { HoloCardWrapper } from '@/components/ui/HoloCardWrapper';
import type { PersonalTransaction } from '@/lib/types';

interface ExpenseChartProps {
    transactions: PersonalTransaction[];
    isLoading?: boolean;
}

// Vibrant expense category colors
const EXPENSE_COLORS = [
    '#f97316', // Orange - Food
    '#ef4444', // Red - Bills
    '#ec4899', // Pink - Shopping
    '#a855f7', // Purple - Entertainment
    '#06b6d4', // Cyan - Transport
    '#14b8a6', // Teal - Health
    '#3b82f6', // Blue - Education
    '#64748b', // Slate - Other
];

interface CategoryData {
    name: string;
    value: number;
    percent: number;
    color: string;
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
 * Custom tooltip for the pie chart
 */
function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: CategoryData }[] }) {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="glass-card rounded-xl shadow-xl p-4">
                <p className="font-bold text-zinc-900 dark:text-zinc-100 text-lg">
                    {data.name}
                </p>
                <p className="text-base font-mono text-zinc-700 dark:text-zinc-300">
                    {formatVND(data.value)}
                </p>
                <p className="text-sm font-mono text-rose-600 dark:text-rose-400">
                    {data.percent.toFixed(1)}% tổng chi
                </p>
            </div>
        );
    }
    return null;
}

/**
 * Loading skeleton
 */
function ChartSkeleton() {
    return (
        <div className="glass-card rounded-2xl p-6 animate-pulse">
            <div className="flex items-center gap-3 mb-6">
                <div className="h-9 w-9 bg-zinc-200 dark:bg-zinc-700 rounded-xl" />
                <div className="h-6 w-40 bg-zinc-200 dark:bg-zinc-700 rounded" />
            </div>
            <div className="h-[280px] flex items-center justify-center">
                <div className="h-48 w-48 bg-zinc-200 dark:bg-zinc-700 rounded-full" />
            </div>
        </div>
    );
}

/**
 * Expense Chart Component
 * Pie chart showing expense breakdown by category
 */
export function ExpenseChart({ transactions, isLoading }: ExpenseChartProps) {
    const categoryData = useMemo(() => {
        // Filter only expense transactions
        const expenses = transactions.filter(tx => tx.type === 'expense');

        // Group by category
        const categoryMap = new Map<string, number>();
        let totalExpense = 0;

        for (const tx of expenses) {
            const categoryName = tx.category?.name || 'Khác';
            const current = categoryMap.get(categoryName) || 0;
            categoryMap.set(categoryName, current + Number(tx.amount));
            totalExpense += Number(tx.amount);
        }

        // Convert to array and calculate percentages
        const data: CategoryData[] = [];
        let colorIndex = 0;

        categoryMap.forEach((value, name) => {
            data.push({
                name,
                value,
                percent: totalExpense > 0 ? (value / totalExpense) * 100 : 0,
                color: EXPENSE_COLORS[colorIndex % EXPENSE_COLORS.length],
            });
            colorIndex++;
        });

        // Sort by value descending
        data.sort((a, b) => b.value - a.value);

        return data;
    }, [transactions]);

    if (isLoading) {
        return <ChartSkeleton />;
    }

    if (categoryData.length === 0) {
        return (
            <HoloCardWrapper intensity={8} glareOpacity={0.1}>
                <div className="glass-card rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/30">
                            <PieChartIcon className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                            Phân tích chi tiêu
                        </h3>
                    </div>
                    <div className="h-[280px] flex items-center justify-center text-zinc-500">
                        Chưa có dữ liệu chi tiêu
                    </div>
                </div>
            </HoloCardWrapper>
        );
    }

    return (
        <HoloCardWrapper intensity={8} glareOpacity={0.1}>
            <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/30">
                        <PieChartIcon className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                        Phân tích chi tiêu
                    </h3>
                </div>

                <div className="flex flex-col lg:flex-row items-center gap-8">
                    {/* Pie Chart */}
                    <div className="w-full lg:w-1/2 h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={110}
                                    paddingAngle={3}
                                    dataKey="value"
                                    nameKey="name"
                                    stroke="none"
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.color}
                                            className="transition-all duration-300 hover:opacity-80 cursor-pointer"
                                            style={{
                                                filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))'
                                            }}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Legend */}
                    <div className="w-full lg:w-1/2 grid grid-cols-2 gap-3">
                        {categoryData.map((item) => (
                            <div
                                key={item.name}
                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/50 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                            >
                                <div
                                    className="w-4 h-4 rounded-full flex-shrink-0 ring-2 ring-white/50 group-hover:scale-110 transition-transform"
                                    style={{ backgroundColor: item.color }}
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                                        {item.name}
                                    </p>
                                    <p className="text-xs text-zinc-500 font-mono tabular-nums">
                                        <span className="text-rose-600 dark:text-rose-400 font-medium">
                                            {item.percent.toFixed(1)}%
                                        </span>
                                        {' · '}
                                        {formatVND(item.value)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </HoloCardWrapper>
    );
}
