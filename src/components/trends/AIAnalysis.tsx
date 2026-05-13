'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Brain, Sparkles, AlertCircle } from 'lucide-react';
import type { Asset } from '@/lib/types';
import { useMarketListings } from '@/lib/hooks/use-market-data';
import { HoloCardWrapper } from '@/components/ui/HoloCardWrapper';

const ReactMarkdown = dynamic(() => import('react-markdown'), {
    ssr: false,
    loading: () => <span className="text-zinc-400 dark:text-zinc-500">...</span>,
});

const markdownComponents = {
    p: ({ children }: { children?: React.ReactNode }) => <p className="mb-2 last:mb-0">{children}</p>,
    strong: ({ children }: { children?: React.ReactNode }) => <strong className="text-indigo-600 dark:text-indigo-300 font-semibold">{children}</strong>,
    ul: ({ children }: { children?: React.ReactNode }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
    li: ({ children }: { children?: React.ReactNode }) => <li className="text-zinc-700 dark:text-zinc-200">{children}</li>,
    code: ({ className, children, ...props }: { className?: string; children?: React.ReactNode }) => {
        const isBlock = className?.includes('language-');
        if (isBlock) {
            return (
                <code className="block bg-zinc-100 dark:bg-black/30 p-3 rounded-lg overflow-x-auto font-mono text-sm text-zinc-800 dark:text-zinc-200 my-2" {...props}>
                    {children}
                </code>
            );
        }
        return (
            <code className="bg-zinc-100 dark:bg-white/10 px-1.5 py-0.5 rounded font-mono text-sm text-indigo-600 dark:text-indigo-300" {...props}>
                {children}
            </code>
        );
    },
    pre: ({ children }: { children?: React.ReactNode }) => <pre className="my-2">{children}</pre>,
    h1: ({ children }: { children?: React.ReactNode }) => <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">{children}</h1>,
    h2: ({ children }: { children?: React.ReactNode }) => <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2">{children}</h2>,
    h3: ({ children }: { children?: React.ReactNode }) => <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">{children}</h3>,
    ol: ({ children }: { children?: React.ReactNode }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
    table: ({ children }: { children?: React.ReactNode }) => (
        <div className="overflow-x-auto my-2">
            <table className="min-w-full text-sm">{children}</table>
        </div>
    ),
    thead: ({ children }: { children?: React.ReactNode }) => <thead className="border-b border-zinc-200 dark:border-white/20">{children}</thead>,
    tbody: ({ children }: { children?: React.ReactNode }) => <tbody>{children}</tbody>,
    tr: ({ children }: { children?: React.ReactNode }) => <tr className="border-b border-zinc-100 dark:border-white/10">{children}</tr>,
    th: ({ children }: { children?: React.ReactNode }) => <th className="px-3 py-1.5 text-left font-semibold text-zinc-900 dark:text-zinc-100">{children}</th>,
    td: ({ children }: { children?: React.ReactNode }) => <td className="px-3 py-1.5 text-zinc-700 dark:text-zinc-200">{children}</td>,
    a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">
            {children}
        </a>
    ),
    blockquote: ({ children }: { children?: React.ReactNode }) => (
        <blockquote className="border-l-2 border-indigo-400 pl-3 my-2 italic text-zinc-500 dark:text-zinc-400">
            {children}
        </blockquote>
    ),
};

interface AIAnalysisProps {
    portfolio?: Asset[];
}

export function AIAnalysis({ portfolio }: AIAnalysisProps) {
    const [analysis, setAnalysis] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { data: listings } = useMarketListings();

    const analyze = useCallback(async () => {
        if (!portfolio?.length || !listings?.length) return;

        setIsAnalyzing(true);
        setAnalysis('');
        setError(null);

        try {
            const res = await fetch('/api/trends/ai-analysis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ portfolio, marketData: listings }),
            });

            if (!res.ok) {
                throw new Error(`Analysis failed (${res.status})`);
            }

            const reader = res.body?.getReader();
            const decoder = new TextDecoder();

            while (reader) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');
                for (const line of lines) {
                    if (line.startsWith('0:')) {
                        try {
                            const text = JSON.parse(line.slice(2));
                            setAnalysis(prev => prev + text);
                        } catch {
                            // Skip malformed SSE chunks
                        }
                    }
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Analysis failed');
        } finally {
            setIsAnalyzing(false);
        }
    }, [portfolio, listings]);

    const hasPortfolio = portfolio && portfolio.length > 0;

    return (
        <HoloCardWrapper intensity={8} glareOpacity={0.1}>
            <div className="glass-card rounded-2xl ring-1 ring-white/20 p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
                            <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">AI Portfolio Analysis</h2>
                    </div>
                    {hasPortfolio && (
                        <button
                            onClick={analyze}
                            disabled={isAnalyzing}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium hover:from-indigo-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Brain className="h-4 w-4" />
                            {isAnalyzing ? 'Analyzing...' : 'Analyze Portfolio'}
                        </button>
                    )}
                </div>

                {!hasPortfolio && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Brain className="h-10 w-10 text-zinc-300 dark:text-zinc-500 mb-3" />
                        <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                            Add assets to your portfolio for AI analysis
                        </p>
                    </div>
                )}

                {error && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-300 text-sm mb-4">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        {error}
                    </div>
                )}

                {isAnalyzing && !analysis && (
                    <div className="space-y-3 animate-pulse">
                        <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                            <div className="h-4 w-4 border-2 border-indigo-500 dark:border-indigo-400 border-t-transparent rounded-full animate-spin" />
                            Analyzing your portfolio...
                        </div>
                        <div className="h-4 bg-zinc-200 dark:bg-white/5 rounded w-3/4" />
                        <div className="h-4 bg-zinc-200 dark:bg-white/5 rounded w-full" />
                        <div className="h-4 bg-zinc-200 dark:bg-white/5 rounded w-5/6" />
                        <div className="h-4 bg-zinc-200 dark:bg-white/5 rounded w-2/3" />
                        <div className="h-4 bg-zinc-200 dark:bg-white/5 rounded w-full" />
                        <div className="h-4 bg-zinc-200 dark:bg-white/5 rounded w-1/2" />
                    </div>
                )}

                {analysis && (
                    <div className="prose prose-sm prose-zinc dark:prose-invert max-w-none text-zinc-700 dark:text-zinc-200">
                        <ReactMarkdown components={markdownComponents}>
                            {analysis}
                        </ReactMarkdown>
                        {isAnalyzing && (
                            <span className="inline-block w-0.5 h-4 bg-indigo-500 dark:bg-indigo-400 animate-pulse ml-0.5 align-middle" />
                        )}
                    </div>
                )}
            </div>
        </HoloCardWrapper>
    );
}
