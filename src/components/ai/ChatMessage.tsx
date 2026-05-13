'use client';

import { useState, useEffect, useRef } from 'react';
import type { Message } from 'ai/react';
import dynamic from 'next/dynamic';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const ReactMarkdown = dynamic(() => import('react-markdown'), {
    ssr: false,
    loading: () => <span className="text-slate-400">...</span>,
});

export const TYPING_SPEED = 18;
export const CHARS_PER_TICK = 3;

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

interface ChatMessageBubbleProps {
    msg: Message;
    isLastAssistant: boolean;
    isLoading: boolean;
    isStreamingText: boolean;
    copiedId: string | null;
    onCopy: (id: string, content: string) => void;
}

export function ChatMessageBubble({ msg, isLastAssistant, isLoading, isStreamingText, copiedId, onCopy }: ChatMessageBubbleProps) {
    const shouldType = isLastAssistant && (isLoading || isStreamingText);

    return (
        <div
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
                        onClick={() => onCopy(msg.id, msg.content)}
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
}
