'use client';

import { Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatInputProps {
    input: string;
    isLoading: boolean;
    portfolioLoading: boolean;
    isFinancePage: boolean;
    onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSubmit: (e: React.FormEvent) => void;
}

export function ChatInput({ input, isLoading, portfolioLoading, isFinancePage, onInputChange, onSubmit }: ChatInputProps) {
    return (
        <form onSubmit={onSubmit} className="p-4 border-t border-white/10 bg-slate-900/50">
            <div className="flex gap-2">
                <input
                    value={input}
                    onChange={onInputChange}
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
    );
}
