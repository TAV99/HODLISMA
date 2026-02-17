'use client';

import { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
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
import { Button } from '@/components/ui/button';
import { usePortfolio, useDeleteAsset } from '@/lib/hooks';
import { formatCurrency, formatPercent, cn } from '@/lib/utils';
import { Loader2, RefreshCw, TrendingUp, TrendingDown, Pencil, Trash2, Coins } from 'lucide-react';
import { EditAssetDialog } from '@/components/dashboard/EditAssetDialog';
import { AddAssetDialog } from '@/components/dashboard/AddAssetDialog';
import type { Asset, MarketData } from '@/lib/types';

/**
 * Calculate asset metrics based on current market price
 */
function calculateMetrics(asset: Asset, priceData: MarketData | undefined) {
    const currentPrice = priceData?.price ?? 0;
    const totalValue = asset.quantity * currentPrice;
    const investedValue = asset.quantity * asset.buy_price;
    const pnl = totalValue - investedValue;
    const pnlPercent = asset.buy_price > 0 ? ((currentPrice - asset.buy_price) / asset.buy_price) * 100 : 0;

    return {
        currentPrice,
        totalValue,
        investedValue,
        pnl,
        pnlPercent,
        percentChange24h: priceData?.percent_change_24h ?? 0,
    };
}

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

    // Calculate portfolio totals
    const totals = assets.reduce(
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

    const totalPnlPercent = totals.totalInvested > 0
        ? ((totals.totalValue - totals.totalInvested) / totals.totalInvested) * 100
        : 0;

    // Handle edit click
    const handleEdit = (asset: Asset) => {
        setEditAsset(asset);
        setIsEditOpen(true);
    };

    // Handle delete click
    const handleDeleteClick = (asset: Asset) => {
        setDeleteAsset(asset);
        setIsDeleteOpen(true);
    };

    // Handle delete confirm
    const handleDeleteConfirm = () => {
        if (deleteAsset) {
            deleteMutation.mutate(deleteAsset.id, {
                onSuccess: () => {
                    setIsDeleteOpen(false);
                    setDeleteAsset(null);
                },
            });
        }
    };

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
                            <TableHeader>
                                <TableRow className="border-b border-slate-200/50 dark:border-slate-700/50 hover:bg-transparent">
                                    <TableHead className="font-semibold text-slate-700 dark:text-slate-300 bg-transparent">
                                        Asset
                                    </TableHead>
                                    <TableHead className="text-right font-semibold text-slate-700 dark:text-slate-300 bg-transparent">
                                        Quantity
                                    </TableHead>
                                    <TableHead className="text-right font-semibold text-slate-700 dark:text-slate-300 bg-transparent">
                                        Buy Price
                                    </TableHead>
                                    <TableHead className="text-right font-semibold text-slate-700 dark:text-slate-300 bg-transparent">
                                        Current Price
                                    </TableHead>
                                    <TableHead className="text-right font-semibold text-slate-700 dark:text-slate-300 bg-transparent">
                                        24h Change
                                    </TableHead>
                                    <TableHead className="text-right font-semibold text-slate-700 dark:text-slate-300 bg-transparent">
                                        Total Value
                                    </TableHead>
                                    <TableHead className="text-right font-semibold text-slate-700 dark:text-slate-300 bg-transparent">
                                        PnL
                                    </TableHead>
                                    <TableHead className="text-center font-semibold text-slate-700 dark:text-slate-300 bg-transparent w-24">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {assets.map((asset, index) => {
                                    const priceData = prices[asset.symbol.toUpperCase()];
                                    const metrics = calculateMetrics(asset, priceData);
                                    const isProfitable = metrics.pnl >= 0;
                                    const isPositive24h = metrics.percentChange24h >= 0;
                                    const isLast = index === assets.length - 1;

                                    return (
                                        <TableRow
                                            key={asset.id}
                                            className={cn(
                                                "transition-colors duration-200 hover:bg-white/60 dark:hover:bg-white/10",
                                                !isLast && "border-b border-slate-200/50 dark:border-slate-700/50"
                                            )}
                                        >
                                            {/* Asset Info */}
                                            <TableCell className="py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                                                        {asset.symbol.slice(0, 2).toUpperCase()}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                                                            {asset.symbol.toUpperCase()}
                                                        </span>
                                                        <span className="text-xs text-slate-500 dark:text-slate-400">
                                                            {asset.name || asset.symbol}
                                                        </span>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            {/* Quantity */}
                                            <TableCell className="text-right font-mono tabular-nums text-slate-700 dark:text-slate-300 font-medium">
                                                {asset.quantity.toLocaleString('en-US', { maximumFractionDigits: 8 })}
                                            </TableCell>

                                            {/* Buy Price */}
                                            <TableCell className="text-right font-mono tabular-nums text-slate-500 dark:text-slate-400">
                                                {formatCurrency(asset.buy_price)}
                                            </TableCell>

                                            {/* Current Price */}
                                            <TableCell className="text-right font-mono tabular-nums text-slate-700 dark:text-slate-300 font-medium">
                                                {priceData ? formatCurrency(metrics.currentPrice) : (
                                                    <span className="text-slate-400">--</span>
                                                )}
                                            </TableCell>

                                            {/* 24h Change */}
                                            <TableCell className="text-right">
                                                {priceData ? (
                                                    <span
                                                        className={cn(
                                                            "inline-flex items-center gap-1 px-2 py-1 rounded-lg font-mono text-sm tabular-nums font-medium",
                                                            isPositive24h
                                                                ? "bg-emerald-100/60 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                                                : "bg-rose-100/60 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                                                        )}
                                                    >
                                                        {isPositive24h ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                                        {formatPercent(metrics.percentChange24h)}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400">--</span>
                                                )}
                                            </TableCell>

                                            {/* Total Value */}
                                            <TableCell className="text-right font-mono tabular-nums text-slate-900 dark:text-slate-100 font-semibold">
                                                {priceData ? formatCurrency(metrics.totalValue) : (
                                                    <span className="text-slate-400">--</span>
                                                )}
                                            </TableCell>

                                            {/* PnL */}
                                            <TableCell className="text-right">
                                                {priceData ? (
                                                    <div className="flex flex-col items-end">
                                                        <span
                                                            className={cn(
                                                                "font-mono tabular-nums font-bold",
                                                                isProfitable ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                                                            )}
                                                        >
                                                            {isProfitable ? '+' : ''}{formatCurrency(metrics.pnl)}
                                                        </span>
                                                        <span
                                                            className={cn(
                                                                "text-xs font-mono tabular-nums",
                                                                isProfitable ? "text-emerald-500" : "text-rose-500"
                                                            )}
                                                        >
                                                            {formatPercent(metrics.pnlPercent)}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400">--</span>
                                                )}
                                            </TableCell>

                                            {/* Actions */}
                                            <TableCell>
                                                <div className="flex items-center justify-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-9 w-9 rounded-xl hover:bg-indigo-100/80 dark:hover:bg-indigo-900/40 transition-colors"
                                                        onClick={() => handleEdit(asset)}
                                                    >
                                                        <Pencil className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-9 w-9 rounded-xl hover:bg-rose-100/80 dark:hover:bg-rose-900/40 transition-colors"
                                                        onClick={() => handleDeleteClick(asset)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>

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

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
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
                        <AlertDialogCancel disabled={deleteMutation.isPending}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            disabled={deleteMutation.isPending}
                            className="bg-rose-600 hover:bg-rose-700 focus:ring-rose-600"
                        >
                            {deleteMutation.isPending ? (
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
        </div>
    );
}
