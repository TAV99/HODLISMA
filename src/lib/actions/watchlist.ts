'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { WatchlistItem, ActionResult } from '@/lib/types';

/**
 * Add a symbol to the user's watchlist
 */
export async function addToWatchlist(symbol: string, name: string): Promise<ActionResult<WatchlistItem>> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { data, error } = await supabase
        .from('watchlist')
        .insert({ user_id: user.id, symbol, name })
        .select()
        .single();

    if (error) {
        // Handle duplicate: unique constraint violation
        if (error.code === '23505') {
            const { data: existing, error: fetchError } = await supabase
                .from('watchlist')
                .select()
                .eq('user_id', user.id)
                .eq('symbol', symbol)
                .single();

            if (fetchError || !existing) {
                return { success: false, error: fetchError?.message ?? 'Failed to fetch existing watchlist item' };
            }

            return { success: true, data: existing as WatchlistItem };
        }

        return { success: false, error: error.message };
    }

    revalidatePath('/trends');
    return { success: true, data: data as WatchlistItem };
}

/**
 * Remove a symbol from the user's watchlist
 */
export async function removeFromWatchlist(symbol: string): Promise<ActionResult<null>> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { error } = await supabase
        .from('watchlist')
        .delete()
        .eq('user_id', user.id)
        .eq('symbol', symbol);

    if (error) return { success: false, error: error.message };

    revalidatePath('/trends');
    return { success: true, data: null };
}

/**
 * Get all watchlist items for the current user
 */
export async function getWatchlist(): Promise<ActionResult<WatchlistItem[]>> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { data, error } = await supabase
        .from('watchlist')
        .select()
        .eq('user_id', user.id)
        .order('added_at', { ascending: false });

    if (error) return { success: false, error: error.message };

    return { success: true, data: data as WatchlistItem[] };
}
