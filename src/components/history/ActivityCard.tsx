'use client';

import { useState, useEffect, MouseEvent } from 'react';
import { RotateCcw, Bitcoin, Wallet, Bot, User, Clock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { type AuditLog } from '@/lib/actions/audit';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';

interface ActivityCardProps {
    log: AuditLog;
    onRollback: (id: string) => void;
    isRollingBack: boolean;
}

/**
 * Check if the log was created within the last 60 seconds
 */
function isRecentLog(dateStr: string): boolean {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    return diffMs < 60000; // 60 seconds
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
 * Get action display name
 */
function getActionTitle(action: string): string {
    const actionMap: Record<string, string> = {
        'ADD_TRANSACTION': 'Thêm giao dịch mới',
        'UPDATE_TRANSACTION': 'Cập nhật giao dịch',
        'DELETE_TRANSACTION': 'Xóa giao dịch',
        'ADD_ASSET': 'Thêm tài sản mới',
        'UPDATE_ASSET': 'Cập nhật tài sản',
        'DELETE_ASSET': 'Xóa tài sản',
        'ROLLBACK_ADD': 'Hoàn tác thêm',
        'ROLLBACK_UPDATE': 'Hoàn tác cập nhật',
        'ROLLBACK_DELETE': 'Hoàn tác xóa',
    };
    return actionMap[action] || action.replace(/_/g, ' ');
}

/**
 * Determine if a transaction is "Rare" (High Value)
 * Thresholds: > 50 (Crypto/USD) or > 1,000,000 (Finance/VND)
 */
function getRareStatus(log: AuditLog): boolean {
    const data = log.newData || log.oldData;
    if (!data) return false;

    // Check standard amount fields
    const value = data.amount || data.price || data.value || data.balance || data.total_value;

    if (typeof value === 'number') {
        if (log.module === 'CRYPTO') {
            return value >= 50; // $50 threshold for Crypto
        } else {
            return value >= 1000000; // 1M VND threshold for Finance
        }
    }

    // Attempt string parsing if needed (e.g. "100000")
    if (typeof value === 'string') {
        const parsed = parseFloat(value);
        if (!isNaN(parsed)) {
            if (log.module === 'CRYPTO') {
                return parsed >= 50;
            } else {
                return parsed >= 1000000;
            }
        }
    }

    return false;
}

/**
 * ActivityCard Component
 * Refined Light-Prisma Style with Holographic Touch & Rare Glow
 */
export function ActivityCard({ log, onRollback, isRollingBack }: ActivityCardProps) {
    const isCrypto = log.module === 'CRYPTO';
    const isAI = log.triggeredBy === 'AI_HODLISMA';
    const canRollback = log.oldData !== null || log.action.includes('ADD');
    const isRollbackAction = log.action.includes('ROLLBACK');
    const isRare = getRareStatus(log);

    // Defer time-dependent values to client to avoid hydration mismatch
    const [isRecent, setIsRecent] = useState(false);
    const [relativeTime, setRelativeTime] = useState<string | null>(null);

    useEffect(() => {
        setIsRecent(isRecentLog(log.createdAt));
        setRelativeTime(formatRelativeTime(log.createdAt));

        // Update relative time every 30 seconds
        const interval = setInterval(() => {
            setIsRecent(isRecentLog(log.createdAt));
            setRelativeTime(formatRelativeTime(log.createdAt));
        }, 30000);
        return () => clearInterval(interval);
    }, [log.createdAt]);

    // 3D Tilt Logic
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    // Smooth spring physics for tilt
    const mouseX = useSpring(x, { stiffness: 400, damping: 35 });
    const mouseY = useSpring(y, { stiffness: 400, damping: 35 });

    // Map tilt angles (Even subtler Max 1.5 degrees)
    const rotateX = useTransform(mouseY, [-0.5, 0.5], ["1.5deg", "-1.5deg"]);
    const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-1.5deg", "1.5deg"]);

    // Holographic sheen position calculation
    const sheenX = useTransform(mouseX, [-0.5, 0.5], ["0%", "100%"]);
    const sheenY = useTransform(mouseY, [-0.5, 0.5], ["0%", "100%"]);

    function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
        const rect = e.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        // Calculate position relative to center (-0.5 to 0.5)
        const xPct = (clickX / width) - 0.5;
        const yPct = (clickY / height) - 0.5;

        x.set(xPct);
        y.set(yPct);
    }

    function handleMouseLeave() {
        x.set(0);
        y.set(0);
    }

    return (
        <motion.div
            style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
            }}
            initial={{ scale: 1 }}
            whileHover={{ scale: 1.005 }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={cn(
                // Light-Prisma Glass Container
                "relative group mb-4",
                "bg-white/70 backdrop-blur-xl",
                // Conditional Border
                isRare
                    ? "border border-yellow-400/60 ring-1 ring-yellow-400/20"
                    : "border border-slate-200/50",
                // Accent Border (Left)
                "border-l-4",
                isCrypto ? "border-l-yellow-400" : "border-l-emerald-500",
                // Spacing and shape
                "p-4 rounded-2xl",
                // Conditional Shadow (Rare Glow vs Soft Shadow)
                isRare
                    ? "shadow-[0_0_30px_-5px_rgba(250,204,21,0.3)] hover:shadow-[0_0_40px_-5px_rgba(250,204,21,0.4)]"
                    : "shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)]",
                // Transition for non-framer props
                "transition-all duration-300 ease-in-out",
                !isRare && "hover:bg-white/80 hover:border-slate-300/60",
                isRare && "hover:bg-yellow-50/30"
            )}
        >
            {/* Rare Pulse Animation */}
            {isRare && (
                <div className="absolute inset-0 rounded-2xl border border-yellow-400/30 animate-pulse pointer-events-none z-0" />
            )}

            {/* Holographic Overlay Layer (Subtler for Light Mode) */}
            <motion.div
                className="absolute inset-0 rounded-2xl pointer-events-none z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                    background: isCrypto
                        ? `linear-gradient(115deg, transparent 30%, rgba(250, 204, 21, 0.2) 45%, rgba(255, 255, 255, 0.6) 50%, rgba(250, 204, 21, 0.2) 55%, transparent 70%)`
                        : `linear-gradient(115deg, transparent 30%, rgba(16, 185, 129, 0.2) 45%, rgba(255, 255, 255, 0.6) 50%, rgba(16, 185, 129, 0.2) 55%, transparent 70%)`,
                    backgroundSize: "200% 200%",
                    backgroundPositionX: sheenX,
                    backgroundPositionY: sheenY,
                    mixBlendMode: "soft-light",
                }}
            />

            {/* Live Indicator - Blinking dot for recent logs */}
            {isRecent && (
                <div className="absolute top-3 right-3 flex items-center justify-center z-50 transform translate-z-10">
                    <span className="absolute inline-flex h-3 w-3 rounded-full bg-emerald-500 opacity-60 animate-ping" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600 shadow-sm" />
                </div>
            )}

            {/* Rare Badge (Optional Visual Queue) */}
            {isRare && (
                <div className="absolute top-[-8px] right-8 z-50 transform translate-z-20">
                    <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-yellow-200 shadow-sm flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        RARE
                    </span>
                </div>
            )}

            {/* Card Content Layout (z-10 to sit above holographic layer) */}
            <div className="relative z-10 flex items-start gap-4 pl-1" style={{ transform: "translateZ(20px)" }}>
                {/* Left Section - Icons (Adapted for Light Mode) */}
                <div className="flex flex-col items-center gap-4 flex-shrink-0">
                    {/* Trigger Icon (AI/User) */}
                    <div
                        className={cn(
                            "p-2 rounded-xl backdrop-blur-sm",
                            isAI
                                ? "bg-purple-100 text-purple-600 ring-1 ring-purple-200"
                                : "bg-slate-100 text-slate-500 ring-1 ring-slate-200"
                        )}
                    >
                        {isAI ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                    </div>
                    {/* Module Icon (Crypto/Finance) */}
                    <div
                        className={cn(
                            "p-2 rounded-xl backdrop-blur-sm",
                            isCrypto
                                ? "bg-yellow-100 text-yellow-600 ring-1 ring-yellow-200"
                                : "bg-emerald-100 text-emerald-600 ring-1 ring-emerald-200"
                        )}
                    >
                        {isCrypto ? <Bitcoin className="h-4 w-4" /> : <Wallet className="h-4 w-4" />}
                    </div>
                </div>

                {/* Middle Section - Content */}
                <div className="flex-1 min-w-0">
                    {/* Title */}
                    <h4 className="font-bold tracking-tight text-slate-900 text-base leading-tight mb-1">
                        {getActionTitle(log.action)}
                    </h4>

                    {/* Subtitle/Description */}
                    {log.description ? (
                        <p className={cn(
                            "text-sm mb-2 line-clamp-2",
                            isRare ? "text-slate-800 font-medium" : "text-slate-600"
                        )}>
                            {log.description}
                        </p>
                    ) : (
                        <p className="text-sm text-slate-500 mb-2 italic">
                            {isCrypto ? 'Crypto' : 'Finance'} • {log.entityType}
                        </p>
                    )}

                    {/* Time and metadata */}
                    <div className="flex items-center gap-4 text-xs text-slate-400 font-medium">
                        <span className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3" />
                            {relativeTime ?? new Date(log.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                        {/* Trigger badge */}
                        <span
                            className={cn(
                                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px]",
                                isAI
                                    ? "bg-purple-50/50 text-purple-600 ring-1 ring-purple-100"
                                    : "bg-slate-50/50 text-slate-500 ring-1 ring-slate-100"
                            )}
                        >
                            {isAI ? '🤖 AI' : '👤 User'}
                        </span>
                    </div>
                </div>

                {/* Right Section - Rollback Button */}
                {canRollback && !isRollbackAction && (
                    <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation(); // Prevent card tilt interaction jumping
                                onRollback(log.id);
                            }}
                            disabled={isRollingBack}
                            className={cn(
                                "h-9 px-3",
                                "bg-amber-50 hover:bg-amber-100",
                                "text-amber-600 hover:text-amber-700",
                                "ring-1 ring-amber-200 hover:ring-amber-300",
                                "rounded-xl transition-all duration-200"
                            )}
                        >
                            <RotateCcw className={cn("h-4 w-4 mr-1", isRollingBack && "animate-spin")} />
                            <span className="text-xs font-medium">Rollback</span>
                        </Button>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

/**
 * ActivityCardList Component
 * Wrapper for list of activity cards with proper spacing
 */
interface ActivityCardListProps {
    logs: AuditLog[];
    onRollback: (id: string) => void;
    rollingBackId: string | null;
}

export function ActivityCardList({ logs, onRollback, rollingBackId }: ActivityCardListProps) {
    return (
        <div className="flex flex-col gap-4 perspective-[1000px]">
            {logs.map((log) => (
                <ActivityCard
                    key={log.id}
                    log={log}
                    onRollback={onRollback}
                    isRollingBack={rollingBackId === log.id}
                />
            ))}
        </div>
    );
}
