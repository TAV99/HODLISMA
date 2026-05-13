'use client';

import { Bot, X, PanelRightOpen, PanelRightClose, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatHeaderProps {
    isFinancePage: boolean;
    isExpanded: boolean;
    onClearHistory: () => void;
    onToggleExpand: () => void;
    onClose: () => void;
}

export function ChatHeader({ isFinancePage, isExpanded, onClearHistory, onToggleExpand, onClose }: ChatHeaderProps) {
    return (
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
                    onClick={onClearHistory}
                    className="text-zinc-400 hover:text-red-400 hover:bg-white/10 h-8 w-8"
                    title="Xóa lịch sử"
                >
                    <Trash2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggleExpand}
                    className="text-slate-400 hover:text-white hover:bg-white/10 h-8 w-8"
                    title={isExpanded ? 'Thu nhỏ' : 'Mở rộng'}
                >
                    {isExpanded ? <PanelRightClose className="h-3.5 w-3.5" /> : <PanelRightOpen className="h-3.5 w-3.5" />}
                </Button>
                {!isExpanded && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="text-slate-400 hover:text-white hover:bg-white/10 h-8 w-8"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}
