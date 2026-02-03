'use server';

import { supabase } from '@/lib/supabase';
import { logFinanceAction } from '@/lib/actions/audit';
import type {
    PersonalTransaction,
    TransactionInput,
    FinanceCategory,
    CategoryInput,
    SavingsVault,
    SavingsVaultInput,
    MonthlySummary,
} from '@/lib/types';

// ============================================
// TRANSACTION ACTIONS
// ============================================

/**
 * Add a new transaction
 */
export async function addTransaction(input: TransactionInput): Promise<PersonalTransaction | null> {
    const { data, error } = await supabase
        .from('personal_transactions')
        .insert({
            category_id: input.category_id || null,
            amount: input.amount,
            date: input.date,
            note: input.note || null,
            type: input.type,
        })
        .select(`
            *,
            category:finance_categories(*)
        `)
        .single();

    if (error) {
        console.error('Error adding transaction:', error);
        return null;
    }

    // Audit log
    await logFinanceAction(
        'ADD_TRANSACTION',
        'transaction',
        data.id,
        null,
        { amount: data.amount, type: data.type, category: data.category?.name },
        'USER_MANUAL',
        `Added ${data.type} transaction: ${data.amount}`
    );

    return data as PersonalTransaction;
}

/**
 * Update an existing transaction
 */
export async function updateTransaction(
    id: string,
    input: Partial<TransactionInput>
): Promise<PersonalTransaction | null> {
    const { data, error } = await supabase
        .from('personal_transactions')
        .update({
            ...(input.category_id !== undefined && { category_id: input.category_id }),
            ...(input.amount !== undefined && { amount: input.amount }),
            ...(input.date !== undefined && { date: input.date }),
            ...(input.note !== undefined && { note: input.note }),
            ...(input.type !== undefined && { type: input.type }),
        })
        .eq('id', id)
        .select(`
            *,
            category:finance_categories(*)
        `)
        .single();

    if (error) {
        console.error('Error updating transaction:', error);
        return null;
    }

    return data as PersonalTransaction;
}

/**
 * Delete a transaction
 */
export async function deleteTransaction(id: string): Promise<boolean> {
    const { error } = await supabase
        .from('personal_transactions')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting transaction:', error);
        return false;
    }

    return true;
}

/**
 * Get transactions with optional filters
 */
export async function getTransactions(options?: {
    type?: 'income' | 'expense' | 'investment';
    startDate?: string;
    endDate?: string;
    limit?: number;
}): Promise<PersonalTransaction[]> {
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

// ============================================
// CATEGORY ACTIONS
// ============================================

/**
 * Get all categories
 */
export async function getCategories(type?: 'income' | 'expense'): Promise<FinanceCategory[]> {
    let query = supabase
        .from('finance_categories')
        .select('*')
        .order('name');

    if (type) {
        query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching categories:', error);
        return [];
    }

    return data as FinanceCategory[];
}

/**
 * Add a new category
 */
export async function addCategory(input: CategoryInput): Promise<FinanceCategory | null> {
    const { data, error } = await supabase
        .from('finance_categories')
        .insert({
            name: input.name,
            type: input.type,
            icon: input.icon || 'circle',
            color: input.color || '#6366f1',
        })
        .select()
        .single();

    if (error) {
        console.error('Error adding category:', error);
        return null;
    }

    return data as FinanceCategory;
}

/**
 * Update an existing category
 */
export async function updateCategory(
    id: string,
    input: Partial<CategoryInput>
): Promise<FinanceCategory | null> {
    const updateData: Record<string, unknown> = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.type !== undefined) updateData.type = input.type;
    if (input.icon !== undefined) updateData.icon = input.icon;
    if (input.color !== undefined) updateData.color = input.color;

    const { data, error } = await supabase
        .from('finance_categories')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating category:', error);
        return null;
    }

    return data as FinanceCategory;
}

/**
 * Check if category has linked transactions
 */
export async function getCategoryTransactionCount(categoryId: string): Promise<number> {
    const { count, error } = await supabase
        .from('personal_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', categoryId);

    if (error) {
        console.error('Error counting transactions:', error);
        return 0;
    }

    return count || 0;
}

/**
 * Delete a category (with optional force delete)
 */
export async function deleteCategory(
    id: string,
    force: boolean = false
): Promise<{ success: boolean; linkedCount?: number; message: string }> {
    // Check for linked transactions
    const linkedCount = await getCategoryTransactionCount(id);

    if (linkedCount > 0 && !force) {
        return {
            success: false,
            linkedCount,
            message: `Danh mục này có ${linkedCount} giao dịch liên kết. Bạn có muốn xóa không?`,
        };
    }

    // If has transactions and force=true, set their category_id to null
    if (linkedCount > 0) {
        await supabase
            .from('personal_transactions')
            .update({ category_id: null })
            .eq('category_id', id);
    }

    const { error } = await supabase
        .from('finance_categories')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting category:', error);
        return { success: false, message: 'Không thể xóa danh mục' };
    }

    return { success: true, message: 'Đã xóa danh mục thành công' };
}

/**
 * Get category by ID
 */
export async function getCategoryById(id: string): Promise<FinanceCategory | null> {
    const { data, error } = await supabase
        .from('finance_categories')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        return null;
    }

    return data as FinanceCategory;
}

/**
 * Find category by name (fuzzy match)
 */
export async function findCategoryByName(
    name: string,
    type?: 'income' | 'expense'
): Promise<FinanceCategory | null> {
    let query = supabase
        .from('finance_categories')
        .select('*')
        .ilike('name', `%${name}%`);

    if (type) {
        query = query.eq('type', type);
    }

    const { data, error } = await query.limit(1).single();

    if (error) {
        return null;
    }

    return data as FinanceCategory;
}

// ============================================
// SAVINGS VAULT ACTIONS
// ============================================

/**
 * Get all savings vaults
 */
export async function getSavingsVaults(includeCompleted = true): Promise<SavingsVault[]> {
    let query = supabase
        .from('savings_vault')
        .select('*')
        .order('created_at', { ascending: false });

    if (!includeCompleted) {
        query = query.eq('is_completed', false);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching savings vaults:', error);
        return [];
    }

    return data as SavingsVault[];
}

/**
 * Add a new savings vault
 */
export async function addSavingsVault(input: SavingsVaultInput): Promise<SavingsVault | null> {
    const { data, error } = await supabase
        .from('savings_vault')
        .insert({
            name: input.name,
            target_amount: input.target_amount,
            current_amount: input.current_amount || 0,
        })
        .select()
        .single();

    if (error) {
        console.error('Error adding savings vault:', error);
        return null;
    }

    return data as SavingsVault;
}

/**
 * Update a savings vault
 */
export async function updateSavingsVault(
    id: string,
    input: Partial<SavingsVaultInput>
): Promise<SavingsVault | null> {
    const { data, error } = await supabase
        .from('savings_vault')
        .update({
            ...(input.name !== undefined && { name: input.name }),
            ...(input.target_amount !== undefined && { target_amount: input.target_amount }),
            ...(input.current_amount !== undefined && { current_amount: input.current_amount }),
        })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating savings vault:', error);
        return null;
    }

    return data as SavingsVault;
}

/**
 * Delete a savings vault
 */
export async function deleteSavingsVault(id: string): Promise<boolean> {
    const { error } = await supabase
        .from('savings_vault')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting savings vault:', error);
        return false;
    }

    return true;
}

/**
 * Add amount to a savings vault
 */
export async function addToSavingsVault(id: string, amount: number): Promise<SavingsVault | null> {
    // First get current amount
    const { data: vault, error: fetchError } = await supabase
        .from('savings_vault')
        .select('current_amount')
        .eq('id', id)
        .single();

    if (fetchError || !vault) {
        console.error('Error fetching vault:', fetchError);
        return null;
    }

    const newAmount = Number(vault.current_amount) + amount;

    return updateSavingsVault(id, { current_amount: newAmount });
}
