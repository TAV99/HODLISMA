'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { TrendingUp, BarChart3, Brain, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const MarketTable = dynamic(
    () => import('@/components/trends/MarketTable').then(m => ({ default: m.MarketTable })),
    { loading: () => <TabSkeleton /> },
);

const FearGreedGauge = dynamic(
    () => import('@/components/trends/FearGreedGauge').then(m => ({ default: m.FearGreedGauge })),
    { loading: () => <TabSkeleton /> },
);

const BenchmarkChart = dynamic(
    () => import('@/components/trends/BenchmarkChart').then(m => ({ default: m.BenchmarkChart })),
    { loading: () => <TabSkeleton /> },
);

const AIAnalysis = dynamic(
    () => import('@/components/trends/AIAnalysis').then(m => ({ default: m.AIAnalysis })),
    { loading: () => <TabSkeleton /> },
);

const SentimentCard = dynamic(
    () => import('@/components/trends/SentimentCard').then(m => ({ default: m.SentimentCard })),
    { loading: () => <TabSkeleton /> },
);

const WatchlistTab = dynamic(
    () => import('@/components/trends/WatchlistTab').then(m => ({ default: m.WatchlistTab })),
    { loading: () => <TabSkeleton /> },
);

const AlertNotification = dynamic(
    () => import('@/components/trends/AlertNotification').then(m => ({ default: m.AlertNotification })),
);

function TabSkeleton() {
    return (
        <div className="animate-pulse space-y-4">
            <div className="h-8 bg-zinc-200 dark:bg-zinc-700 rounded-xl w-1/3" />
            <div className="h-64 bg-zinc-200 dark:bg-zinc-700 rounded-xl" />
        </div>
    );
}

const TABS = [
    { key: 'overview', label: 'Overview', icon: TrendingUp },
    { key: 'benchmark', label: 'Benchmark', icon: BarChart3 },
    { key: 'ai-insights', label: 'AI Insights', icon: Brain },
    { key: 'watchlist', label: 'Watchlist', icon: Star },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export default function TrendsPage() {
    const [activeTab, setActiveTab] = useState<TabKey>('overview');

    return (
        <div className="min-h-screen">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <header className="mb-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-lg">
                            <TrendingUp className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-extrabold tracking-tighter bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                                Market Trends
                            </h1>
                            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 tracking-widest uppercase">
                                Real-time crypto market analysis
                            </p>
                        </div>
                    </div>
                </header>

                <nav className="mb-8 overflow-x-auto scrollbar-hide">
                    <div className="glass-card ring-1 ring-white/20 rounded-2xl p-1 inline-flex min-w-full sm:min-w-0">
                        {TABS.map(({ key, label, icon: Icon }) => (
                            <button
                                key={key}
                                onClick={() => setActiveTab(key)}
                                className={cn(
                                    'relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200',
                                    activeTab === key
                                        ? 'bg-gradient-to-r from-indigo-500/80 to-purple-500/80 text-white shadow-lg shadow-indigo-500/20'
                                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white',
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                {label}
                            </button>
                        ))}
                    </div>
                </nav>

                <div className="min-h-[500px]">
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2">
                                <MarketTable />
                            </div>
                            <div className="lg:col-span-1">
                                <FearGreedGauge />
                            </div>
                        </div>
                    )}

                    {activeTab === 'benchmark' && <BenchmarkChart />}

                    {activeTab === 'ai-insights' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <AIAnalysis />
                            <SentimentCard />
                        </div>
                    )}

                    {activeTab === 'watchlist' && (
                        <>
                            <WatchlistTab />
                            <AlertNotification />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
