'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    CheckCircle,
    XCircle,
    AlertCircle,
    Bitcoin,
    Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { getAuditLogs, rollbackFromAuditLog, type AuditLog } from '@/lib/actions/audit';
import { ActivityCardList } from './ActivityCard';

interface ActivityFeedProps {
    initialLogs?: AuditLog[];
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
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-lg shadow-black/5">
                <div className="flex flex-col gap-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div
                            key={i}
                            className="relative bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl animate-pulse overflow-hidden"
                        >
                            {/* Accent bar skeleton */}
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-zinc-700" />
                            <div className="flex items-start gap-4 pl-3">
                                {/* Icon skeleton */}
                                <div className="flex flex-col gap-2">
                                    <div className="h-8 w-8 bg-zinc-700 rounded-xl" />
                                    <div className="h-8 w-8 bg-zinc-700 rounded-xl" />
                                </div>
                                {/* Content skeleton */}
                                <div className="flex-1 space-y-2">
                                    <div className="h-5 w-48 bg-zinc-700 rounded" />
                                    <div className="h-4 w-64 bg-zinc-700 rounded" />
                                    <div className="h-3 w-32 bg-zinc-700 rounded" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (logs.length === 0) {
        return (
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 text-center shadow-lg shadow-black/5">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-zinc-500" />
                <h3 className="text-lg font-semibold text-zinc-100 mb-2">
                    Chưa có hoạt động
                </h3>
                <p className="text-sm text-zinc-500">
                    Các thay đổi sẽ xuất hiện ở đây
                </p>
            </div>
        );
    }

    return (
        <>
            {/* Header Section */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-6 shadow-lg shadow-black/5">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900">
                        Lịch sử hoạt động
                    </h3>
                    <div className="flex items-center gap-4 text-xs">
                        <span className="flex items-center gap-1.5 text-zinc-400">
                            <Bitcoin className="h-3.5 w-3.5 text-yellow-400" />
                            <span className="w-2 h-2 rounded-full bg-yellow-400" />
                            Crypto
                        </span>
                        <span className="flex items-center gap-1.5 text-zinc-400">
                            <Wallet className="h-3.5 w-3.5 text-emerald-500" />
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            Finance
                        </span>
                    </div>
                </div>
            </div>

            {/* Activity Cards List */}
            <div className="max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                <ActivityCardList
                    logs={logs}
                    onRollback={handleRollback}
                    rollingBackId={rollingBackId}
                />
            </div>

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
