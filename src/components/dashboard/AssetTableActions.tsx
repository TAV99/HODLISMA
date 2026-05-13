'use client';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatCurrency, formatPercent, cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import type { Asset } from '@/lib/types';

interface AssetTableActionsProps {
    deleteAsset: Asset | null;
    isDeleteOpen: boolean;
    onDeleteOpenChange: (open: boolean) => void;
    onDeleteConfirm: () => void;
    isPending: boolean;
    totals: { totalInvested: number; totalValue: number; totalPnl: number };
    totalPnlPercent: number;
}

/**
 * Portfolio totals footer and delete confirmation dialog
 */
export function AssetTableActions({
    deleteAsset,
    isDeleteOpen,
    onDeleteOpenChange,
    onDeleteConfirm,
    isPending,
    totals,
    totalPnlPercent,
}: AssetTableActionsProps) {
    return (
        <>
            {/* Portfolio Totals */}
            <div className="mt-6 flex items-center justify-end gap-8 p-4 rounded-2xl bg-white/30 dark:bg-white/5 backdrop-blur-lg border border-white/20">
                <div className="text-right">
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Total Invested</p>
                    <p className="text-lg font-bold font-mono tabular-nums text-slate-800 dark:text-slate-200">
                        {formatCurrency(totals.totalInvested)}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Total Value</p>
                    <p className="text-lg font-bold font-mono tabular-nums text-slate-800 dark:text-slate-200">
                        {formatCurrency(totals.totalValue)}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Total PnL</p>
                    <p
                        className={cn(
                            "text-xl font-bold font-mono tabular-nums",
                            totals.totalPnl >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                        )}
                    >
                        {totals.totalPnl >= 0 ? '+' : ''}{formatCurrency(totals.totalPnl)}
                        <span className="text-sm font-semibold ml-2 opacity-80">
                            ({formatPercent(totalPnlPercent)})
                        </span>
                    </p>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteOpen} onOpenChange={onDeleteOpenChange}>
                <AlertDialogContent className="backdrop-blur-xl bg-white/90 dark:bg-slate-900/90">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Asset</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete{' '}
                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                                {deleteAsset?.symbol.toUpperCase()}
                            </span>
                            ? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={onDeleteConfirm}
                            disabled={isPending}
                            className="bg-rose-600 hover:bg-rose-700 focus:ring-rose-600"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                'Delete'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
