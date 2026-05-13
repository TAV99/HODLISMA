'use client';

import {
    TableCell,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatPercent, cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Pencil, Trash2 } from 'lucide-react';
import type { Asset, MarketData } from '@/lib/types';

/**
 * Calculate asset metrics based on current market price
 */
export function calculateMetrics(asset: Asset, priceData: MarketData | undefined) {
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

interface AssetTableRowProps {
    asset: Asset;
    priceData: MarketData | undefined;
    isLast: boolean;
    onEdit: (asset: Asset) => void;
    onDelete: (asset: Asset) => void;
}

/**
 * Single row in the asset table displaying asset info, price, PnL, and actions
 */
export function AssetTableRow({ asset, priceData, isLast, onEdit, onDelete }: AssetTableRowProps) {
    const metrics = calculateMetrics(asset, priceData);
    const isProfitable = metrics.pnl >= 0;
    const isPositive24h = metrics.percentChange24h >= 0;

    return (
        <TableRow
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
                {asset.quantity.toLocaleString(undefined, { maximumFractionDigits: 8 })}
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
                        onClick={() => onEdit(asset)}
                    >
                        <Pencil className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-xl hover:bg-rose-100/80 dark:hover:bg-rose-900/40 transition-colors"
                        onClick={() => onDelete(asset)}
                    >
                        <Trash2 className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                    </Button>
                </div>
            </TableCell>
        </TableRow>
    );
}
