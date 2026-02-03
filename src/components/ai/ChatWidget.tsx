'use client';

import { useState, useEffect, useRef } from 'react';
import { useChat } from 'ai/react';
import { usePathname } from 'next/navigation';
import { usePortfolio } from '@/lib/hooks';
import ReactMarkdown from 'react-markdown';
import { Bot, X, Send, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Holographic Chat Widget Component
 * Floating AI assistant for portfolio analysis with automatic context injection
 */
export function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();
    const { assets, prices, isLoading: portfolioLoading } = usePortfolio();

    // Determine current page context
    const pageContext = pathname.startsWith('/finance') ? 'finance' : 'crypto';
    const isFinancePage = pageContext === 'finance';

    // Calculate portfolio totals and metrics
    const portfolioContext = {
        currentPage: pageContext,
        assets: assets.map(asset => {
            const priceData = prices[asset.symbol.toUpperCase()];
            const currentPrice = priceData?.price ?? 0;
            const totalValue = asset.quantity * currentPrice;
            const investedValue = asset.quantity * asset.buy_price;
            const pnl = totalValue - investedValue;
            const pnlPercent = asset.buy_price > 0 ? ((currentPrice - asset.buy_price) / asset.buy_price) * 100 : 0;

            return {
                symbol: asset.symbol,
                name: asset.name,
                quantity: asset.quantity,
                buyPrice: asset.buy_price,
                currentPrice,
                totalValue,
                pnl,
                pnlPercent,
                percentChange24h: priceData?.percent_change_24h ?? 0,
            };
        }),
        totals: assets.reduce(
            (acc, asset) => {
                const priceData = prices[asset.symbol.toUpperCase()];
                const currentPrice = priceData?.price ?? 0;
                const totalValue = asset.quantity * currentPrice;
                const investedValue = asset.quantity * asset.buy_price;
                const pnl = totalValue - investedValue;

                acc.totalInvested += investedValue;
                acc.totalValue += totalValue;
                acc.totalPnl += pnl;

                return acc;
            },
            { totalInvested: 0, totalValue: 0, totalPnl: 0, totalPnlPercent: 0 }
        ),
    };

    // Calculate total PnL percentage
    portfolioContext.totals.totalPnlPercent =
        portfolioContext.totals.totalInvested > 0
            ? ((portfolioContext.totals.totalValue - portfolioContext.totals.totalInvested) /
                portfolioContext.totals.totalInvested) *
            100
            : 0;

    const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
        api: '/api/chat',
        body: {
            portfolioContext,
        },
    });

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <>
            {/* Floating Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/60 hover:scale-110 transition-all duration-300 animate-pulse"
                    aria-label="Open AI Chat"
                >
                    <Sparkles className="h-6 w-6" />
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 w-96 h-[32rem] max-w-[calc(100vw-3rem)] max-h-[calc(100vh-3rem)] sm:w-96 sm:h-[32rem] z-50 backdrop-blur-xl bg-slate-900/90 border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="p-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-indigo-600/20 to-purple-600/20">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600">
                                <Bot className="h-4 w-4 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white text-sm">
                                    {isFinancePage ? 'Trinity AI' : 'HODLISMA AI'}
                                </h3>
                                <p className="text-xs text-slate-400">
                                    {isFinancePage ? 'Trợ lý tài chính' : 'Portfolio Advisor'}
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsOpen(false)}
                            className="text-slate-400 hover:text-white hover:bg-white/10"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-center text-slate-400">
                                <Sparkles className="h-12 w-12 mb-3 text-indigo-400" />
                                <p className="text-sm font-medium text-white mb-1">
                                    {isFinancePage ? 'Xin chào! Tôi là Trinity AI' : "Hi! I'm HODLISMA AI"}
                                </p>
                                <p className="text-xs max-w-xs">
                                    {isFinancePage
                                        ? 'Hỏi tôi về thu chi, tiết kiệm, hoặc ghi chép giao dịch!'
                                        : 'Ask me about your portfolio, market trends, or get investment advice!'}
                                </p>
                            </div>
                        )}

                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
                            >
                                <div
                                    className={cn(
                                        'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm',
                                        msg.role === 'user'
                                            ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                                            : 'bg-white/10 backdrop-blur-sm text-slate-100 border border-white/10'
                                    )}
                                >
                                    {msg.role === 'assistant' ? (
                                        <div className="prose prose-sm prose-invert max-w-none">
                                            <ReactMarkdown
                                                components={{
                                                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                                    strong: ({ children }) => <strong className="text-indigo-300 font-semibold">{children}</strong>,
                                                    ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                                                    li: ({ children }) => <li className="text-slate-200">{children}</li>,
                                                }}
                                            >
                                                {msg.content}
                                            </ReactMarkdown>
                                        </div>
                                    ) : (
                                        <p className="leading-relaxed">{msg.content}</p>
                                    )}
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3">
                                    <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSubmit} className="p-4 border-t border-white/10 bg-slate-900/50">
                        <div className="flex gap-2">
                            <input
                                value={input}
                                onChange={handleInputChange}
                                placeholder={isFinancePage ? 'Ghi chi 50k ăn trưa...' : 'Ask about your portfolio...'}
                                disabled={isLoading || portfolioLoading}
                                className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <Button
                                type="submit"
                                disabled={isLoading || !input.trim() || portfolioLoading}
                                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed px-4"
                            >
                                {isLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                        {portfolioLoading && (
                            <p className="text-xs text-slate-500 mt-2">Loading portfolio data...</p>
                        )}
                    </form>
                </div>
            )}
        </>
    );
}
