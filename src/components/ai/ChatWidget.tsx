'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useChat, type Message } from 'ai/react';
import { usePathname, useRouter } from 'next/navigation';
import { usePortfolio } from '@/lib/hooks';
import { Sparkles, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/components/layout/SidebarContext';
import { ChatMessageBubble } from '@/components/ai/ChatMessage';
import { ChatInput } from '@/components/ai/ChatInput';
import { ChatHeader } from '@/components/ai/ChatHeader';

const STORAGE_KEY_PREFIX = 'hodlisma-chat-';
const MAX_MESSAGES = 50;

function loadMessages(pageContext: string): Message[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEY_PREFIX + pageContext);
        if (!stored) return [];
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed.slice(-MAX_MESSAGES) : [];
    } catch {
        return [];
    }
}

function saveMessages(pageContext: string, messages: Message[]) {
    try {
        localStorage.setItem(
            STORAGE_KEY_PREFIX + pageContext,
            JSON.stringify(messages.slice(-MAX_MESSAGES))
        );
    } catch { /* localStorage full */ }
}

export function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();
    const router = useRouter();
    const { assets, prices, isLoading: portfolioLoading } = usePortfolio();
    const { setChatPanelOpen } = useSidebar();

    useEffect(() => {
        setChatPanelOpen(isExpanded);
        return () => setChatPanelOpen(false);
    }, [isExpanded, setChatPanelOpen]);

    const pageContext = pathname.startsWith('/finance') ? 'finance' : 'crypto';
    const isFinancePage = pageContext === 'finance';

    const [initialMessages] = useState<Message[]>(() => loadMessages(pageContext));

    const portfolioContext = useMemo(() => {
        const ctx = {
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
        ctx.totals.totalPnlPercent =
            ctx.totals.totalInvested > 0
                ? ((ctx.totals.totalValue - ctx.totals.totalInvested) /
                    ctx.totals.totalInvested) *
                100
                : 0;
        return ctx;
    }, [assets, prices, pageContext]);

    const { messages, input, handleInputChange, handleSubmit, isLoading, reload, setMessages, error } = useChat({
        api: '/api/chat',
        body: {
            portfolioContext,
        },
        initialMessages,
        onFinish: () => {
            router.refresh();
        },
    });

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (messages.length > 0) {
            saveMessages(pageContext, messages);
        }
    }, [messages, pageContext]);

    const handleClearHistory = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY_PREFIX + pageContext);
        setMessages([]);
    }, [pageContext, setMessages]);

    const handleCopy = useCallback(async (id: string, content: string) => {
        await navigator.clipboard.writeText(content);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    }, []);

    const lastMsg = messages[messages.length - 1];
    const isStreamingText = isLoading && lastMsg?.role === 'assistant' && lastMsg.content.length > 0;
    const isWaitingForResponse = isLoading && (!lastMsg || lastMsg.role !== 'assistant' || !lastMsg.content);

    return (
        <>
            {!isOpen && !isExpanded && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/60 hover:scale-110 transition-all duration-300 animate-pulse"
                    aria-label="Open AI Chat"
                >
                    <Sparkles className="h-6 w-6" />
                </button>
            )}

            {(isOpen || isExpanded) && (
                <div className={cn(
                    'fixed z-50 backdrop-blur-xl bg-slate-900/95 flex flex-col overflow-hidden transition-all duration-300',
                    isExpanded
                        ? 'right-0 top-0 h-screen w-[400px] border-l border-white/10 rounded-none shadow-none'
                        : 'bottom-6 right-6 w-96 h-[36rem] max-w-[calc(100vw-3rem)] max-h-[calc(100vh-3rem)] border border-white/10 rounded-2xl shadow-2xl'
                )}>
                    <ChatHeader
                        isFinancePage={isFinancePage}
                        isExpanded={isExpanded}
                        onClearHistory={handleClearHistory}
                        onToggleExpand={() => setIsExpanded(!isExpanded)}
                        onClose={() => { setIsOpen(false); setIsExpanded(false); }}
                    />

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-center text-slate-400">
                                <Sparkles className="h-12 w-12 mb-3 text-indigo-400" />
                                <p className="text-sm font-medium text-white mb-1">
                                    {isFinancePage ? 'Xin chào! Tôi là HODLISMA AI' : "Hi! I'm HODLISMA AI"}
                                </p>
                                <p className="text-xs max-w-xs">
                                    {isFinancePage
                                        ? 'Hỏi tôi về thu chi, tiết kiệm, hoặc ghi chép giao dịch!'
                                        : 'Ask me about your portfolio, market trends, or get investment advice!'}
                                </p>
                            </div>
                        )}

                        {messages.map((msg) => (
                            <ChatMessageBubble
                                key={msg.id}
                                msg={msg}
                                isLastAssistant={msg.role === 'assistant' && msg.id === lastMsg?.id}
                                isLoading={isLoading}
                                isStreamingText={isStreamingText}
                                copiedId={copiedId}
                                onCopy={handleCopy}
                            />
                        ))}

                        {isWaitingForResponse && (
                            <div className="flex justify-start">
                                <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-2">
                                    <div className="flex gap-1">
                                        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0ms]" />
                                        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:150ms]" />
                                        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:300ms]" />
                                    </div>
                                    <span className="text-xs text-slate-400">Đang suy nghĩ...</span>
                                </div>
                            </div>
                        )}

                        {error && !isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-2.5 text-sm text-red-400 flex items-center gap-2">
                                    <span>Lỗi kết nối AI</span>
                                    <button
                                        onClick={() => reload()}
                                        className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition"
                                    >
                                        <RotateCcw className="h-3.5 w-3.5" />
                                        <span>Thử lại</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    <ChatInput
                        input={input}
                        isLoading={isLoading}
                        portfolioLoading={portfolioLoading}
                        isFinancePage={isFinancePage}
                        onInputChange={handleInputChange}
                        onSubmit={handleSubmit}
                    />
                </div>
            )}
        </>
    );
}
