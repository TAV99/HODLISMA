'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    RotateCcw,
    Bitcoin,
    Wallet,
    Bot,
    User,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
} from 'lucide-react';
import { HoloCardWrapper } from '@/components/ui/HoloCardWrapper';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { getAuditLogs, rollbackFromAuditLog, type AuditLog } from '@/lib/actions/audit';

interface ActivityFeedProps {
    initialLogs?: AuditLog[];
}

/**
 * Format relative time
 */
function formatRelativeTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
}

/**
 * Activity Event Item
 */
function ActivityEvent({
    log,
    onRollback,
    isRollingBack,
}: {
    log: AuditLog;
    onRollback: (id: string) => void;
    isRollingBack: boolean;
}) {
    const isCrypto = log.module === 'CRYPTO';
    const isAI = log.triggeredBy === 'AI_TRINITY';
    const canRollback = log.oldData !== null || log.action.includes('ADD');
    const isRollbackAction = log.action.includes('ROLLBACK');

    return (
        <div
            className={cn(
                "relative flex gap-4 p-4 rounded-xl transition-all duration-200",
                "hover:bg-white/50 dark:hover:bg-white/5",
                "border-l-4",
                isCrypto ? "border-l-blue-500" : "border-l-emerald-500"
            )}
        >
            {/* Icon */}
            <div
                className={cn(
                    "flex-shrink-0 p-2.5 rounded-xl",
                    isCrypto
                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                        : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                )}
            >
                {isCrypto ? (
                    <Bitcoin className="h-5 w-5" />
                ) : (
                    <Wallet className="h-5 w-5" />
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        {log.action.replace(/_/g, ' ')}
                    </span>
                    {/* Trigger Badge */}
                    <span
                        className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium",
                            isAI
                                ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                        )}
                    >
                        {isAI ? <Bot className="h-3 w-3" /> : <User className="h-3 w-3" />}
                        {isAI ? 'AI' : 'Manual'}
                    </span>
                </div>

                {log.description && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                        {log.description}
                    </p>
                )}

                <div className="flex items-center gap-3 text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatRelativeTime(log.createdAt)}
                    </span>
                    <span className="capitalize">{log.entityType}</span>
                </div>
            </div>

            {/* Rollback Button */}
            {canRollback && !isRollbackAction && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRollback(log.id)}
                    disabled={isRollingBack}
                    className="flex-shrink-0 text-zinc-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                >
                    <RotateCcw className={cn("h-4 w-4", isRollingBack && "animate-spin")} />
                </Button>
            )}
        </div>
    );
}

/**
 * Toast notification
 */
function Toast({
    message,
    type,
    onClose,
}: {
    message: string;
    type: 'success' | 'error';
    onClose: () => void;
}) {
    useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div
            className={cn(
                "fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg",
                "animate-in slide-in-from-bottom-5 fade-in duration-300",
                type === 'success'
                    ? "bg-emerald-600 text-white"
                    : "bg-rose-600 text-white"
            )}
        >
            {type === 'success' ? (
                <CheckCircle className="h-5 w-5" />
            ) : (
                <XCircle className="h-5 w-5" />
            )}
            <span className="text-sm font-medium">{message}</span>
        </div>
    );
}

/**
 * Activity Feed Component
 * Displays real-time activity timeline with rollback capability
 */
export function ActivityFeed({ initialLogs = [] }: ActivityFeedProps) {
    const [logs, setLogs] = useState<AuditLog[]>(initialLogs);
    const [isLoading, setIsLoading] = useState(initialLogs.length === 0);
    const [rollingBackId, setRollingBackId] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Fetch initial logs
    useEffect(() => {
        if (initialLogs.length === 0) {
            getAuditLogs({ limit: 50 }).then((data) => {
                setLogs(data);
                setIsLoading(false);
            });
        }
    }, [initialLogs.length]);

    // Real-time subscription
    useEffect(() => {
        const channel = supabase
            .channel('audit_logs_realtime')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'audit_logs',
                },
                (payload) => {
                    const newLog: AuditLog = {
                        id: payload.new.id,
                        module: payload.new.module,
                        action: payload.new.action,
                        entityType: payload.new.entity_type,
                        entityId: payload.new.entity_id,
                        oldData: payload.new.old_data,
                        newData: payload.new.new_data,
                        triggeredBy: payload.new.triggered_by,
                        description: payload.new.description,
                        createdAt: payload.new.created_at,
                    };
                    setLogs((prev) => [newLog, ...prev]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // Handle rollback
    const handleRollback = useCallback(async (logId: string) => {
        setRollingBackId(logId);
        try {
            const result = await rollbackFromAuditLog(logId);
            setToast({
                message: result.message,
                type: result.success ? 'success' : 'error',
            });
        } catch {
            setToast({
                message: 'Lỗi khi thực hiện rollback',
                type: 'error',
            });
        } finally {
            setRollingBackId(null);
        }
    }, []);

    if (isLoading) {
        return (
            <HoloCardWrapper intensity={8} glareOpacity={0.1}>
                <div className="glass-card rounded-2xl p-6">
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex gap-4 animate-pulse">
                                <div className="h-10 w-10 bg-zinc-200 dark:bg-zinc-700 rounded-xl" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-48 bg-zinc-200 dark:bg-zinc-700 rounded" />
                                    <div className="h-3 w-32 bg-zinc-200 dark:bg-zinc-700 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </HoloCardWrapper>
        );
    }

    if (logs.length === 0) {
        return (
            <HoloCardWrapper intensity={8} glareOpacity={0.1}>
                <div className="glass-card rounded-2xl p-8 text-center">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-zinc-400" />
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                        Chưa có hoạt động
                    </h3>
                    <p className="text-sm text-zinc-500">
                        Các thay đổi sẽ xuất hiện ở đây
                    </p>
                </div>
            </HoloCardWrapper>
        );
    }

    return (
        <>
            <HoloCardWrapper intensity={8} glareOpacity={0.1}>
                <div className="glass-card rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                            Lịch sử hoạt động
                        </h3>
                        <div className="flex items-center gap-4 text-xs">
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-blue-500" />
                                Crypto
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                Finance
                            </span>
                        </div>
                    </div>

                    <div className="space-y-2 max-h-[600px] overflow-y-auto">
                        {logs.map((log) => (
                            <ActivityEvent
                                key={log.id}
                                log={log}
                                onRollback={handleRollback}
                                isRollingBack={rollingBackId === log.id}
                            />
                        ))}
                    </div>
                </div>
            </HoloCardWrapper>

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </>
    );
}
