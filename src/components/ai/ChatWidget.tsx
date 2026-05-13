'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useChat, type Message } from 'ai/react';
import { usePathname, useRouter } from 'next/navigation';
import { usePortfolio } from '@/lib/hooks';
import dynamic from 'next/dynamic';
import { Bot, X, Send, Sparkles, Loader2, PanelRightOpen, PanelRightClose, Trash2, RotateCcw, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/components/layout/SidebarContext';

const ReactMarkdown = dynamic(() => import('react-markdown'), {
    ssr: false,
    loading: () => <span className="text-slate-400">...</span>,
});

const STORAGE_KEY_PREFIX = 'hodlisma-chat-';
const MAX_MESSAGES = 50;
const TYPING_SPEED = 18;
const CHARS_PER_TICK = 3;

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

const markdownComponents = {
    p: ({ children }: { children?: React.ReactNode }) => <p className="mb-2 last:mb-0">{children}</p>,
    strong: ({ children }: { children?: React.ReactNode }) => <strong className="text-indigo-300 font-semibold">{children}</strong>,
    ul: ({ children }: { children?: React.ReactNode }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
    li: ({ children }: { children?: React.ReactNode }) => <li className="text-slate-200">{children}</li>,
    code: ({ className, children, ...props }: { className?: string; children?: React.ReactNode }) => {
        const isBlock = className?.includes('language-');
        if (isBlock) {
            return (
                <code className="block bg-black/30 p-3 rounded-lg overflow-x-auto font-mono text-sm text-slate-200 my-2" {...props}>
                    {children}
                </code>
            );
        }
        return (
            <code className="bg-white/10 px-1.5 py-0.5 rounded font-mono text-sm text-indigo-300" {...props}>
                {children}
            </code>
        );
    },
    pre: ({ children }: { children?: React.ReactNode }) => <pre className="my-2">{children}</pre>,
    h1: ({ children }: { children?: React.ReactNode }) => <h1 className="text-lg font-semibold text-white mb-2">{children}</h1>,
    h2: ({ children }: { children?: React.ReactNode }) => <h2 className="text-base font-semibold text-white mb-2">{children}</h2>,
    h3: ({ children }: { children?: React.ReactNode }) => <h3 className="text-sm font-semibold text-white mb-1">{children}</h3>,
    ol: ({ children }: { children?: React.ReactNode }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
    table: ({ children }: { children?: React.ReactNode }) => (
        <div className="overflow-x-auto my-2">
            <table className="min-w-full text-sm">{children}</table>
        </div>
    ),
    thead: ({ children }: { children?: React.ReactNode }) => <thead className="border-b border-white/20">{children}</thead>,
    tbody: ({ children }: { children?: React.ReactNode }) => <tbody>{children}</tbody>,
    tr: ({ children }: { children?: React.ReactNode }) => <tr className="border-b border-white/10">{children}</tr>,
    th: ({ children }: { children?: React.ReactNode }) => <th className="px-3 py-1.5 text-left font-semibold text-white">{children}</th>,
    td: ({ children }: { children?: React.ReactNode }) => <td className="px-3 py-1.5 text-slate-200">{children}</td>,
    a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">
            {children}
        </a>
    ),
    blockquote: ({ children }: { children?: React.ReactNode }) => (
        <blockquote className="border-l-2 border-indigo-400 pl-3 my-2 italic text-zinc-400">
            {children}
        </blockquote>
    ),
};

function TypewriterMessage({ content, isTyping }: { content: string; isTyping: boolean }) {
    const [displayLen, setDisplayLen] = useState(isTyping ? 0 : content.length);
    const targetRef = useRef(content);
    const lenRef = useRef(isTyping ? 0 : content.length);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    targetRef.current = content;

    useEffect(() => {
        if (!isTyping) {
            lenRef.current = content.length;
            setDisplayLen(content.length);
            if (timerRef.current) clearInterval(timerRef.current);
            return;
        }

        if (timerRef.current) return;

        timerRef.current = setInterval(() => {
            const target = targetRef.current;
            if (lenRef.current < target.length) {
                lenRef.current = Math.min(lenRef.current + CHARS_PER_TICK, target.length);
                setDisplayLen(lenRef.current);
            }
        }, TYPING_SPEED);

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [isTyping, content]);

    const displayText = content.slice(0, displayLen);
    const stillTyping = isTyping || displayLen < content.length;

    return (
        <div className="prose prose-sm prose-invert max-w-none">
            <ReactMarkdown components={markdownComponents}>
                {displayText}
            </ReactMarkdown>
            {stillTyping && (
                <span className="inline-block w-0.5 h-4 bg-indigo-400 animate-blink ml-0.5 align-middle" />
            )}
        </div>
    );
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
                    <div className="p-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-indigo-600/20 to-purple-600/20">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600">
                                <Bot className="h-4 w-4 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white text-sm">HODLISMA AI</h3>
                                <p className="text-xs text-slate-400">
                                    {isFinancePage ? 'Trợ lý tài chính' : 'Portfolio Advisor'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleClearHistory}
                                className="text-zinc-400 hover:text-red-400 hover:bg-white/10 h-8 w-8"
                                title="Xóa lịch sử"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="text-slate-400 hover:text-white hover:bg-white/10 h-8 w-8"
                                title={isExpanded ? 'Thu nhỏ' : 'Mở rộng'}
                            >
                                {isExpanded ? <PanelRightClose className="h-3.5 w-3.5" /> : <PanelRightOpen className="h-3.5 w-3.5" />}
                            </Button>
                            {!isExpanded && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => { setIsOpen(false); setIsExpanded(false); }}
                                    className="text-slate-400 hover:text-white hover:bg-white/10 h-8 w-8"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>

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

                        {messages.map((msg) => {
                            const isLastAssistant = msg.role === 'assistant' && msg.id === lastMsg?.id;
                            const shouldType = isLastAssistant && (isLoading || isStreamingText);

                            return (
                                <div
                                    key={msg.id}
                                    className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
                                >
                                    <div
                                        className={cn(
                                            'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm group relative',
                                            msg.role === 'user'
                                                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                                                : 'bg-white/10 backdrop-blur-sm text-slate-100 border border-white/10'
                                        )}
                                    >
                                        {msg.role === 'assistant' && !shouldType && (
                                            <button
                                                onClick={() => handleCopy(msg.id, msg.content)}
                                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white"
                                                title="Copy"
                                            >
                                                {copiedId === msg.id
                                                    ? <Check className="h-3.5 w-3.5 text-green-400" />
                                                    : <Copy className="h-3.5 w-3.5" />}
                                            </button>
                                        )}
                                        {msg.role === 'assistant' ? (
                                            <TypewriterMessage
                                                content={msg.content}
                                                isTyping={shouldType}
                                            />
                                        ) : (
                                            <p className="leading-relaxed">{msg.content}</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

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
