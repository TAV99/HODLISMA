'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { PriceAlert, ActionResult } from '@/lib/types';

/**
 * Create a new price alert for a symbol
 */
export async function createPriceAlert(
    symbol: string,
    condition: 'above' | 'below',
    targetPrice: number
): Promise<ActionResult<PriceAlert>> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { data, error } = await supabase
        .from('price_alerts')
        .insert({
            user_id: user.id,
            symbol,
            condition,
            target_price: targetPrice,
        })
        .select()
        .single();

    if (error) return { success: false, error: error.message };

    revalidatePath('/trends');
    return { success: true, data: data as PriceAlert };
}

/**
 * Delete a price alert by ID (must belong to current user)
 */
export async function deletePriceAlert(id: string): Promise<ActionResult<null>> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { error } = await supabase
        .from('price_alerts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) return { success: false, error: error.message };

    revalidatePath('/trends');
    return { success: true, data: null };
}

/**
 * Get all active (non-triggered) alerts for the current user
 */
export async function getActiveAlerts(): Promise<ActionResult<PriceAlert[]>> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { data, error } = await supabase
        .from('price_alerts')
        .select()
        .eq('user_id', user.id)
        .eq('is_triggered', false)
        .order('created_at', { ascending: false });

    if (error) return { success: false, error: error.message };

    return { success: true, data: data as PriceAlert[] };
}

/**
 * Mark a price alert as triggered
 */
export async function markAlertTriggered(id: string): Promise<ActionResult<PriceAlert>> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { data, error } = await supabase
        .from('price_alerts')
        .update({
            is_triggered: true,
            triggered_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

    if (error) return { success: false, error: error.message };

    revalidatePath('/trends');
    return { success: true, data: data as PriceAlert };
}
