'use client';

import {
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

/**
 * Table header with column labels for the asset table
 */
export function AssetTableHeader() {
    return (
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
    );
}
