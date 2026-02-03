'use client';

import { useState, useEffect } from 'react';
import { Wallet, Sparkles, Calendar } from 'lucide-react';
import { FinanceSummary } from '@/components/finance/FinanceSummary';
import { TransactionTable } from '@/components/finance/TransactionTable';
import { ExpenseChart } from '@/components/finance/ExpenseChart';
import {
    getMonthlySummary,
    getTransactions
} from '@/lib/actions/finance';
import type { MonthlySummary, PersonalTransaction } from '@/lib/types';

/**
 * Finance Dashboard Page
 * Personal finance management with summary, transactions, and expense analysis
 */
export default function FinancePage() {
    const [summary, setSummary] = useState<MonthlySummary>({
        total_income: 0,
        total_expense: 0,
        total_investment: 0,
        net_balance: 0,
        transaction_count: 0,
    });
    const [transactions, setTransactions] = useState<PersonalTransaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    // Fetch data on mount
    useEffect(() => {
        async function fetchData() {
            setIsLoading(true);
            try {
                const [summaryData, txData] = await Promise.all([
                    getMonthlySummary(currentYear, currentMonth),
                    getTransactions({ limit: 10 }),
                ]);
                setSummary(summaryData);
                setTransactions(txData);
            } catch (error) {
                console.error('Error fetching finance data:', error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, [currentMonth, currentYear]);

    const monthName = new Date(currentYear, currentMonth - 1).toLocaleDateString('vi-VN', {
        month: 'long',
        year: 'numeric'
    });

    return (
        <div className="min-h-screen gradient-bg">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Header */}
                <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 shadow-lg">
                                <Wallet className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-extrabold tracking-tighter bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                                    Personal Finance
                                </h1>
                                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 tracking-widest uppercase">
                                    Quản lý thu chi thông minh
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                        <Calendar className="h-4 w-4" />
                        <span className="capitalize">{monthName}</span>
                    </div>
                </header>

                {/* Summary Cards */}
                <section className="mb-10">
                    <FinanceSummary summary={summary} isLoading={isLoading} />
                </section>

                {/* Charts and Transactions */}
                <section className="grid gap-6 lg:grid-cols-2">
                    {/* Expense Chart */}
                    <ExpenseChart transactions={transactions} isLoading={isLoading} />

                    {/* Transaction Table */}
                    <TransactionTable
                        transactions={transactions}
                        isLoading={isLoading}
                        onAddClick={() => {
                            // TODO: Open add transaction dialog
                            console.log('Add transaction clicked');
                        }}
                    />
                </section>

                {/* Footer */}
                <footer className="mt-16 pt-8 border-t border-white/10">
                    <div className="flex items-center justify-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                        <span>Powered by</span>
                        <span className="font-semibold bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
                            Trinity AI
                        </span>
                        <Sparkles className="h-4 w-4 text-emerald-500" />
                    </div>
                </footer>
            </div>
        </div>
    );
}
