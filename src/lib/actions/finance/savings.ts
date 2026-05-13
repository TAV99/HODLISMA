'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type {
    SavingsVault,
    SavingsVaultInput,
    ActionResult,
} from '@/lib/types';

/**
 * Get all savings vaults
 */
export async function getSavingsVaults(includeCompleted = true): Promise<SavingsVault[]> {
    const supabase = await createClient();
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
export async function addSavingsVault(input: SavingsVaultInput): Promise<ActionResult<SavingsVault>> {
    const supabase = await createClient();
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
        return { success: false, error: error.message };
    }

    revalidatePath('/finance');
    return { success: true, data: data as SavingsVault };
}

/**
 * Update a savings vault
 */
export async function updateSavingsVault(
    id: string,
    input: Partial<SavingsVaultInput>
): Promise<ActionResult<SavingsVault>> {
    const supabase = await createClient();
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
        return { success: false, error: error.message };
    }

    revalidatePath('/finance');
    return { success: true, data: data as SavingsVault };
}

/**
 * Delete a savings vault
 */
export async function deleteSavingsVault(id: string): Promise<ActionResult<null>> {
    const supabase = await createClient();
    const { error } = await supabase
        .from('savings_vault')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting savings vault:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/finance');
    return { success: true, data: null };
}

/**
 * Add amount to a savings vault
 */
export async function addToSavingsVault(id: string, amount: number): Promise<ActionResult<SavingsVault>> {
    const supabase = await createClient();
    const { data: vault, error: fetchError } = await supabase
        .from('savings_vault')
        .select('current_amount')
        .eq('id', id)
        .single();

    if (fetchError || !vault) {
        console.error('Error fetching vault:', fetchError);
        return { success: false, error: fetchError?.message ?? 'Vault not found' };
    }

    const newAmount = Number(vault.current_amount) + amount;

    return updateSavingsVault(id, { current_amount: newAmount });
}
