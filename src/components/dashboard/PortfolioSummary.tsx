'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrency, formatPercent, cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Wallet, PiggyBank, BarChart3, Sparkles } from 'lucide-react';
import { HoloCardWrapper } from '@/components/ui/HoloCardWrapper';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import type { Asset, MarketPriceResponse } from '@/lib/types';

// Chart colors - High Contrast Vibrant Fintech Palette
const CHART_COLORS = [
    '#6366f1', // Indigo (Primary)
    '#ec4899', // Pink (Vibrant contrast)
    '#10b981', // Emerald (Money/Profit)
    '#f59e0b', // Amber (Warning/Bitcoin)
    '#06b6d4', // Cyan (Tech)
    '#8b5cf6', // Violet (Secondary)
    '#ef4444', // Red (Accent)
    '#84cc16', // Lime (Growth)
];

interface PortfolioSummaryProps {
    assets: Asset[];
    prices: MarketPriceResponse;
    isLoading?: boolean;
}

interface PortfolioMetrics {
    totalInvested: number;
    currentBalance: number;
    totalPnl: number;
    pnlPercent: number;
    allocations: AllocationData[];
}

interface AllocationData {
    name: string;
    symbol: string;
    value: number;
    percent: number;
}

/**
 * Calculate portfolio metrics from assets and prices
 */
function calculatePortfolioMetrics(
    assets: Asset[],
    prices: MarketPriceResponse
): PortfolioMetrics {
    let totalInvested = 0;
    let currentBalance = 0;
    const allocations: AllocationData[] = [];

    for (const asset of assets) {
        const priceData = prices[asset.symbol.toUpperCase()];
        const currentPrice = priceData?.price ?? 0;

        const invested = asset.quantity * asset.buy_price;
        const value = asset.quantity * currentPrice;

        totalInvested += invested;
        currentBalance += value;

        if (value > 0) {
            allocations.push({
                name: asset.name || asset.symbol,
                symbol: asset.symbol.toUpperCase(),
                value,
                percent: 0,
            });
        }
    }

    for (const allocation of allocations) {
        allocation.percent = currentBalance > 0
            ? (allocation.value / currentBalance) * 100
            : 0;
    }

    allocations.sort((a, b) => b.value - a.value);

    const totalPnl = currentBalance - totalInvested;
    const pnlPercent = totalInvested > 0
        ? ((currentBalance - totalInvested) / totalInvested) * 100
        : 0;

    return {
        totalInvested,
        currentBalance,
        totalPnl,
        pnlPercent,
        allocations,
    };
}

/**
 * Custom tooltip for the pie chart
 */
function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: AllocationData }[] }) {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="glass-card rounded-xl shadow-xl p-4">
                <p className="font-bold text-zinc-900 dark:text-zinc-100 text-lg">
                    {data.symbol}
                </p>
                <p className="text-base font-mono text-zinc-700 dark:text-zinc-300">
                    {formatCurrency(data.value)}
                </p>
                <p className="text-sm font-mono text-indigo-600 dark:text-indigo-400">
                    {data.percent.toFixed(1)}% of portfolio
                </p>
            </div>
        );
    }
    return null;
}

/**
 * Premium Metric Card Component with Holographic Effect
 */
function MetricCard({
    title,
    value,
    format,
    subtitle,
    icon: Icon,
    variant = 'default',
    sparkle = false,
}: {
    title: string;
    value: string | number;
    format?: (value: number) => string;
    subtitle?: string;
    icon: React.ElementType;
    variant?: 'default' | 'positive' | 'negative';
    sparkle?: boolean;
}) {
    return (
        <HoloCardWrapper
            intensity={12}
            glareOpacity={variant === 'positive' ? 0.2 : variant === 'negative' ? 0.15 : 0.18}
        >
            <div className={cn(
                "glass-card rounded-2xl p-6 h-full",
                "ring-1 ring-white/20",
                variant === 'positive' && "glow-emerald",
                variant === 'negative' && "glow-rose"
            )}>
                <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        {title}
                    </span>
                    <div className={cn(
                        "p-2 rounded-xl",
                        variant === 'positive' && "bg-emerald-100 dark:bg-emerald-900/30",
                        variant === 'negative' && "bg-rose-100 dark:bg-rose-900/30",
                        variant === 'default' && "bg-indigo-100 dark:bg-indigo-900/30"
                    )}>
                        <Icon className={cn(
                            "h-5 w-5",
                            variant === 'positive' && "text-emerald-600 dark:text-emerald-400",
                            variant === 'negative' && "text-rose-600 dark:text-rose-400",
                            variant === 'default' && "text-indigo-600 dark:text-indigo-400"
                        )} />
                    </div>
                </div>

                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className={cn(
                            "text-3xl font-bold font-mono tracking-tight tabular-nums",
                            variant === 'positive' && "text-emerald-600 dark:text-emerald-400",
                            variant === 'negative' && "text-rose-600 dark:text-rose-400",
                            variant === 'default' && "text-zinc-900 dark:text-zinc-100"
                        )}>
                            {typeof value === 'number' && format ? (
                                <AnimatedNumber value={value} format={format} />
                            ) : (
                                value
                            )}
                        </span>
                        {sparkle && (
                            <Sparkles className="h-5 w-5 text-amber-500 pulse-live" />
                        )}
                    </div>
                    {subtitle && (
                        <div className={cn(
                            "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-mono font-medium",
                            variant === 'positive' && "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
                            variant === 'negative' && "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300",
                            variant === 'default' && "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                        )}>
                            {variant === 'positive' && <TrendingUp className="h-3 w-3" />}
                            {variant === 'negative' && <TrendingDown className="h-3 w-3" />}
                            {subtitle}
                        </div>
                    )}
                </div>
            </div>
        </HoloCardWrapper>
    );
}

/**
 * Loading skeleton for metrics with shimmer
 */
function MetricsSkeleton() {
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
 * Portfolio Summary Component
 * Displays key metrics with holographic cards and allocation pie chart
 */
export function PortfolioSummary({ assets, prices, isLoading }: PortfolioSummaryProps) {
    const metrics = useMemo(
        () => calculatePortfolioMetrics(assets, prices),
        [assets, prices]
    );

    const isProfitable = metrics.totalPnl >= 0;

    if (isLoading) {
        return <MetricsSkeleton />;
    }

    if (assets.length === 0) {
        return null;
    }

    return (
        <div className="space-y-8">
            {/* Holographic Metric Cards */}
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4 md:grid md:grid-cols-3 md:overflow-visible md:pb-0 md:mx-0 md:px-0 scrollbar-hide">
                <div className="snap-center min-w-[280px] w-[85vw] md:w-auto md:min-w-0">
                    <MetricCard
                        title="Current Balance"
                        value={metrics.currentBalance}
                        format={formatCurrency}
                        icon={Wallet}
                        variant="default"
                        sparkle
                    />
                </div>
                <div className="snap-center min-w-[280px] w-[85vw] md:w-auto md:min-w-0">
                    <MetricCard
                        title="Total Invested"
                        value={formatCurrency(metrics.totalInvested)}
                        icon={PiggyBank}
                        variant="default"
                    />
                </div>
                <div className="snap-center min-w-[280px] w-[85vw] md:w-auto md:min-w-0">
                    <MetricCard
                        title="Net Profit/Loss"
                        value={`${isProfitable ? '+' : ''}${formatCurrency(metrics.totalPnl)}`}
                        subtitle={formatPercent(metrics.pnlPercent)}
                        icon={isProfitable ? TrendingUp : TrendingDown}
                        variant={isProfitable ? 'positive' : 'negative'}
                    />
                </div>
            </div>

            {/* Allocation Chart */}
            {metrics.allocations.length > 0 && (
                <HoloCardWrapper intensity={8} glareOpacity={0.1}>
                    <div className="glass-card rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
                                <BarChart3 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                                Asset Allocation
                            </h3>
                        </div>

                        <div className="flex flex-col lg:flex-row items-center gap-8">
                            {/* Pie Chart */}
                            <div className="w-full lg:w-1/2 h-[280px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={metrics.allocations}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={70}
                                            outerRadius={110}
                                            paddingAngle={3}
                                            dataKey="value"
                                            nameKey="symbol"
                                            stroke="none"
                                        >
                                            {metrics.allocations.map((_, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={CHART_COLORS[index % CHART_COLORS.length]}
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
                                {metrics.allocations.map((item, index) => (
                                    <div
                                        key={item.symbol}
                                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/50 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                                    >
                                        <div
                                            className="w-4 h-4 rounded-full flex-shrink-0 ring-2 ring-white/50 group-hover:scale-110 transition-transform"
                                            style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                                                {item.symbol}
                                            </p>
                                            <p className="text-xs text-zinc-500 font-mono tabular-nums">
                                                <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                                                    {item.percent.toFixed(1)}%
                                                </span>
                                                {' · '}
                                                {formatCurrency(item.value)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </HoloCardWrapper>
            )}
        </div>
    );
}
