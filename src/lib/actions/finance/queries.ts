'use server';

import { createClient } from '@/lib/supabase/server';
import type {
    PersonalTransaction,
    MonthlySummary,
} from '@/lib/types';

/**
 * Get transactions with optional filters
 */
export async function getTransactions(options?: {
    type?: 'income' | 'expense' | 'investment';
    startDate?: string;
    endDate?: string;
    limit?: number;
}): Promise<PersonalTransaction[]> {
    const supabase = await createClient();
    let query = supabase
        .from('personal_transactions')
        .select(`
            *,
            category:finance_categories(*)
        `)
        .order('date', { ascending: false });

    if (options?.type) {
        query = query.eq('type', options.type);
    }

    if (options?.startDate) {
        query = query.gte('date', options.startDate);
    }

    if (options?.endDate) {
        query = query.lte('date', options.endDate);
    }

    if (options?.limit) {
        query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching transactions:', error);
        return [];
    }

    return data as PersonalTransaction[];
}

/**
 * Get monthly summary for income/expense
 */
export async function getMonthlySummary(
    year: number,
    month: number
): Promise<MonthlySummary> {
    const supabase = await createClient();
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const { data, error } = await supabase
        .from('personal_transactions')
        .select('amount, type')
        .gte('date', startDate)
        .lte('date', endDate);

    if (error) {
        console.error('Error fetching monthly summary:', error);
        return {
            total_income: 0,
            total_expense: 0,
            total_investment: 0,
            net_balance: 0,
            transaction_count: 0,
        };
    }

    const summary = data.reduce(
        (acc, tx) => {
            const amount = Number(tx.amount);
            if (tx.type === 'income') {
                acc.total_income += amount;
            } else if (tx.type === 'expense') {
                acc.total_expense += amount;
            } else if (tx.type === 'investment') {
                acc.total_investment += amount;
            }
            return acc;
        },
        { total_income: 0, total_expense: 0, total_investment: 0 }
    );

    return {
        ...summary,
        net_balance: summary.total_income - summary.total_expense - summary.total_investment,
        transaction_count: data.length,
    };
}
