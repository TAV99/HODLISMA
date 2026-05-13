'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { logFinanceAction } from '@/lib/actions/audit';
import type {
    PersonalTransaction,
    TransactionInput,
    ActionResult,
} from '@/lib/types';

/**
 * Add a new transaction
 */
export async function addTransaction(input: TransactionInput): Promise<ActionResult<PersonalTransaction>> {
    const supabase = await createClient();
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
        return { success: false, error: error.message };
    }

    await logFinanceAction(
        'ADD_TRANSACTION',
        'transaction',
        data.id,
        null,
        { amount: data.amount, type: data.type, category: data.category?.name },
        'USER_MANUAL',
        `Added ${data.type} transaction: ${data.amount}`
    );

    revalidatePath('/finance');
    revalidatePath('/');

    return { success: true, data: data as PersonalTransaction };
}

/**
 * Update an existing transaction
 */
export async function updateTransaction(
    id: string,
    input: Partial<TransactionInput>
): Promise<ActionResult<PersonalTransaction>> {
    const supabase = await createClient();
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
        return { success: false, error: error.message };
    }

    revalidatePath('/finance');
    revalidatePath('/');
    return { success: true, data: data as PersonalTransaction };
}

/**
 * Delete a transaction
 */
export async function deleteTransaction(id: string): Promise<ActionResult<null>> {
    const supabase = await createClient();
    const { error } = await supabase
        .from('personal_transactions')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting transaction:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/finance');
    revalidatePath('/');
    return { success: true, data: null };
}
