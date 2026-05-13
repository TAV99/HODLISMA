'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { TrendingUp } from 'lucide-react';
import { useBenchmark } from '@/lib/hooks/use-benchmark';
import { cn } from '@/lib/utils';
import { HoloCardWrapper } from '@/components/ui/HoloCardWrapper';

const LineChart = dynamic(() => import('recharts').then(m => ({ default: m.LineChart })), { ssr: false });
const Line = dynamic(() => import('recharts').then(m => ({ default: m.Line })), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(m => ({ default: m.XAxis })), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(m => ({ default: m.YAxis })), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(m => ({ default: m.Tooltip })), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then(m => ({ default: m.ResponsiveContainer })), { ssr: false });
const Legend = dynamic(() => import('recharts').then(m => ({ default: m.Legend })), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then(m => ({ default: m.CartesianGrid })), { ssr: false });

const ranges = ['7d', '30d', '90d'] as const;
type Range = typeof ranges[number];

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; color: string; value: number }>; label?: string }) {
    if (!active || !payload) return null;
    return (
        <div className="glass-card rounded-xl p-3 shadow-xl ring-1 ring-white/20">
            <p className="text-zinc-500 dark:text-zinc-400 text-xs mb-2">{label}</p>
            {payload.map((entry) => (
                <p key={entry.name} style={{ color: entry.color }} className="text-sm font-medium">
                    {entry.name}: {entry.value >= 0 ? '+' : ''}{entry.value.toFixed(2)}%
                </p>
            ))}
        </div>
    );
}

function formatYAxis(value: number): string {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

export function BenchmarkChart() {
    const [range, setRange] = useState<Range>('30d');
    const { data, isLoading, error } = useBenchmark(range);

    if (isLoading) {
        return (
            <div className="glass-card rounded-2xl ring-1 ring-white/20 p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="h-6 w-48 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                    <div className="flex gap-2">
                        {ranges.map(r => (
                            <div key={r} className="h-8 w-12 bg-zinc-200 dark:bg-zinc-700 rounded-lg animate-pulse" />
                        ))}
                    </div>
                </div>
                <div className="h-[400px] bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />
            </div>
        );
    }

    if (error) {
        return (
            <HoloCardWrapper intensity={8} glareOpacity={0.1}>
                <div className="glass-card rounded-2xl ring-1 ring-white/20 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/30">
                            <TrendingUp className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Benchmark</h3>
                    </div>
                    <div className="h-[400px] flex items-center justify-center">
                        <p className="text-rose-600 dark:text-rose-400 text-sm">Failed to load benchmark data. Please try again later.</p>
                    </div>
                </div>
            </HoloCardWrapper>
        );
    }

    if (!data || data.length === 0) {
        return (
            <HoloCardWrapper intensity={8} glareOpacity={0.1}>
                <div className="glass-card rounded-2xl ring-1 ring-white/20 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800">
                            <TrendingUp className="h-5 w-5 text-zinc-400 dark:text-zinc-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Benchmark</h3>
                    </div>
                    <div className="h-[400px] flex flex-col items-center justify-center gap-3">
                        <TrendingUp className="h-10 w-10 text-zinc-300 dark:text-zinc-600" />
                        <p className="text-zinc-500 dark:text-zinc-400 text-sm text-center">
                            Add assets to your portfolio to compare performance
                        </p>
                    </div>
                </div>
            </HoloCardWrapper>
        );
    }

    return (
        <HoloCardWrapper intensity={8} glareOpacity={0.1}>
            <div className="glass-card rounded-2xl ring-1 ring-white/20 p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
                            <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Benchmark</h3>
                    </div>
                    <div className="flex gap-2">
                        {ranges.map(r => (
                            <button
                                key={r}
                                onClick={() => setRange(r)}
                                className={cn(
                                    'px-3 py-1.5 text-xs font-medium rounded-lg transition-all',
                                    range === r
                                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                                        : 'bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-white/10'
                                )}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                </div>

                <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(161,161,170,0.15)" />
                        <XAxis
                            dataKey="date"
                            tick={{ fill: '#71717a', fontSize: 12 }}
                            axisLine={{ stroke: 'rgba(161,161,170,0.2)' }}
                            tickLine={false}
                        />
                        <YAxis
                            tickFormatter={formatYAxis}
                            tick={{ fill: '#71717a', fontSize: 12 }}
                            axisLine={{ stroke: 'rgba(161,161,170,0.2)' }}
                            tickLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            verticalAlign="bottom"
                            iconType="circle"
                            wrapperStyle={{ paddingTop: 16, color: '#71717a', fontSize: 12 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="portfolio"
                            name="Portfolio"
                            stroke="#818cf8"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4, strokeWidth: 0 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="btc"
                            name="BTC"
                            stroke="#f59e0b"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4, strokeWidth: 0 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="eth"
                            name="ETH"
                            stroke="#06b6d4"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4, strokeWidth: 0 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </HoloCardWrapper>
    );
}
