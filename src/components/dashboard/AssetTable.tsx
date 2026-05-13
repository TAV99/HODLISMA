'use client';

import { useState, useCallback, useMemo } from 'react';
import {
    Table,
    TableBody,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { usePortfolio, useDeleteAsset } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import { Loader2, RefreshCw, TrendingDown, Coins } from 'lucide-react';
import { EditAssetDialog } from '@/components/dashboard/EditAssetDialog';
import { AddAssetDialog } from '@/components/dashboard/AddAssetDialog';
import { AssetTableHeader } from '@/components/dashboard/AssetTableHeader';
import { AssetTableRow, calculateMetrics } from '@/components/dashboard/AssetTableRow';
import { AssetTableActions } from '@/components/dashboard/AssetTableActions';
import type { Asset } from '@/lib/types';

/**
 * Loading skeleton for the table
 */
function TableSkeleton() {
    return (
        <div className="space-y-4 p-6">
            {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 animate-pulse">
                    <div className="h-12 w-12 bg-white/40 rounded-xl" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 w-20 bg-white/40 rounded" />
                        <div className="h-3 w-32 bg-white/30 rounded" />
                    </div>
                    <div className="h-10 w-24 bg-white/40 rounded" />
                    <div className="h-10 w-24 bg-white/40 rounded" />
                    <div className="h-10 w-28 bg-white/40 rounded" />
                </div>
            ))}
        </div>
    );
}

/**
 * Empty state when no assets exist
 */
function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-2xl bg-white/40 backdrop-blur-sm p-5 mb-5 ring-1 ring-white/20">
                <Coins className="h-10 w-10 text-slate-500" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                No assets yet
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm">
                Add your first crypto asset to start tracking your portfolio performance.
            </p>
        </div>
    );
}

/**
 * Error state display
 */
function ErrorState({ message }: { message: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-2xl bg-rose-100/50 backdrop-blur-sm p-5 mb-5">
                <TrendingDown className="h-10 w-10 text-rose-500" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                Error loading data
            </h3>
            <p className="text-sm text-rose-500 mt-2 max-w-sm">{message}</p>
        </div>
    );
}

/**
 * Asset Table Component
 * Displays portfolio assets with real-time price and PnL calculations
 * Features glassmorphism design with hover effects
 */
export function AssetTable() {
    const { assets, prices, isLoading, isRefetching, error, refetch } = usePortfolio();
    const deleteMutation = useDeleteAsset();

    // Edit dialog state
    const [editAsset, setEditAsset] = useState<Asset | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);

    // Delete confirmation state
    const [deleteAsset, setDeleteAsset] = useState<Asset | null>(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    const { totals, totalPnlPercent } = useMemo(() => {
        const t = assets.reduce(
            (acc, asset) => {
                const priceData = prices[asset.symbol.toUpperCase()];
                const metrics = calculateMetrics(asset, priceData);
                acc.totalValue += metrics.totalValue;
                acc.totalInvested += metrics.investedValue;
                acc.totalPnl += metrics.pnl;
                return acc;
            },
            { totalValue: 0, totalInvested: 0, totalPnl: 0 }
        );
        const pnlPercent = t.totalInvested > 0
            ? ((t.totalValue - t.totalInvested) / t.totalInvested) * 100
            : 0;
        return { totals: t, totalPnlPercent: pnlPercent };
    }, [assets, prices]);

    const handleEdit = useCallback((asset: Asset) => {
        setEditAsset(asset);
        setIsEditOpen(true);
    }, []);

    const handleDeleteClick = useCallback((asset: Asset) => {
        setDeleteAsset(asset);
        setIsDeleteOpen(true);
    }, []);

    const handleDeleteConfirm = useCallback(() => {
        if (deleteAsset) {
            deleteMutation.mutate(deleteAsset.id, {
                onSuccess: () => {
                    setIsDeleteOpen(false);
                    setDeleteAsset(null);
                },
            });
        }
    }, [deleteAsset, deleteMutation]);

    return (
        <div className="relative">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                {/* Left: Title */}
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                    Portfolio Assets
                </h2>

                {/* Right: Actions Group */}
                <div className="flex gap-2">
                    {/* Refresh Button */}
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => refetch()}
                        disabled={isRefetching}
                        className="bg-white/50 hover:bg-white/70 border-white/30 backdrop-blur-sm"
                    >
                        <RefreshCw className={cn("h-4 w-4", isRefetching && "animate-spin")} />
                    </Button>

                    {/* Add Asset Button */}
                    <AddAssetDialog />
                </div>
            </div>

            {/* Loading State */}
            {isLoading && <TableSkeleton />}

            {/* Error State */}
            {error && !isLoading && <ErrorState message={error.message} />}

            {/* Empty State */}
            {!isLoading && !error && assets.length === 0 && <EmptyState />}

            {/* Data Table */}
            {!isLoading && !error && assets.length > 0 && (
                <>
                    <div className="overflow-hidden rounded-2xl bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/20 shadow-2xl">
                        <Table>
                            <AssetTableHeader />
                            <TableBody>
                                {assets.map((asset, index) => (
                                    <AssetTableRow
                                        key={asset.id}
                                        asset={asset}
                                        priceData={prices[asset.symbol.toUpperCase()]}
                                        isLast={index === assets.length - 1}
                                        onEdit={handleEdit}
                                        onDelete={handleDeleteClick}
                                    />
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <AssetTableActions
                        deleteAsset={deleteAsset}
                        isDeleteOpen={isDeleteOpen}
                        onDeleteOpenChange={setIsDeleteOpen}
                        onDeleteConfirm={handleDeleteConfirm}
                        isPending={deleteMutation.isPending}
                        totals={totals}
                        totalPnlPercent={totalPnlPercent}
                    />
                </>
            )}

            {/* Refetching indicator */}
            {isRefetching && !isLoading && (
                <div className="absolute inset-0 bg-white/30 dark:bg-black/30 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl p-4 shadow-xl">
                        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                    </div>
                </div>
            )}

            {/* Edit Dialog */}
            {editAsset && (
                <EditAssetDialog
                    asset={editAsset}
                    open={isEditOpen}
                    onOpenChange={(open) => {
                        setIsEditOpen(open);
                        if (!open) setEditAsset(null);
                    }}
                />
            )}
        </div>
    );
}
