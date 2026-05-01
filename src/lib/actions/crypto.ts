'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { logCryptoAction } from '@/lib/actions/audit';
import type { Asset, AssetInput, ActionResult } from '@/lib/types';

// ============================================
// CRYPTO ASSET SERVER ACTIONS
// ============================================

/**
 * Add a new crypto asset to portfolio
 */
export async function addCryptoAsset(input: AssetInput): Promise<ActionResult<Asset>> {
    const { data, error } = await supabase
        .from('assets')
        .insert({
            symbol: input.symbol.toUpperCase(),
            name: input.name || input.symbol.toUpperCase(),
            quantity: input.quantity,
            buy_price: input.buy_price,
        })
        .select()
        .single();

    if (error) {
        console.error('Error adding crypto asset:', error);
        return { success: false, error: error.message };
    }

    await logCryptoAction(
        'ADD_ASSET',
        data.id,
        null,
        { symbol: data.symbol, quantity: data.quantity, buy_price: data.buy_price },
        'USER_MANUAL',
        `Added ${data.quantity} ${data.symbol} @ $${data.buy_price}`
    );

    revalidatePath('/');

    return { success: true, data: data as Asset };
}

/**
 * Update crypto asset quantity (for buy more / sell)
 */
export async function updateCryptoQuantity(
    symbol: string,
    newQuantity: number,
    newAvgPrice?: number
): Promise<ActionResult<Asset>> {
    const { data: existing, error: findError } = await supabase
        .from('assets')
        .select('*')
        .eq('symbol', symbol.toUpperCase())
        .single();

    if (findError || !existing) {
        console.error('Asset not found:', findError);
        return { success: false, error: findError?.message ?? 'Asset not found' };
    }

    const updateData: { quantity: number; buy_price?: number } = {
        quantity: newQuantity,
    };

    if (newAvgPrice !== undefined) {
        updateData.buy_price = newAvgPrice;
    }

    const { data, error } = await supabase
        .from('assets')
        .update(updateData)
        .eq('id', existing.id)
        .select()
        .single();

    if (error) {
        console.error('Error updating crypto asset:', error);
        return { success: false, error: error.message };
    }

    return { success: true, data: data as Asset };
}

/**
 * Buy more of an existing crypto (adds to quantity, recalculates avg price)
 */
export async function buyCrypto(
    symbol: string,
    additionalQuantity: number,
    buyPrice: number
): Promise<ActionResult<Asset>> {
    const { data: existing, error: findError } = await supabase
        .from('assets')
        .select('*')
        .eq('symbol', symbol.toUpperCase())
        .single();

    if (findError || !existing) {
        return addCryptoAsset({
            symbol: symbol.toUpperCase(),
            quantity: additionalQuantity,
            buy_price: buyPrice,
        });
    }

    const currentTotal = existing.quantity * existing.buy_price;
    const additionTotal = additionalQuantity * buyPrice;
    const newQuantity = existing.quantity + additionalQuantity;
    const newAvgPrice = (currentTotal + additionTotal) / newQuantity;

    const { data, error } = await supabase
        .from('assets')
        .update({
            quantity: newQuantity,
            buy_price: newAvgPrice,
        })
        .eq('id', existing.id)
        .select()
        .single();

    if (error) {
        console.error('Error buying more crypto:', error);
        return { success: false, error: error.message };
    }

    await logCryptoAction(
        'BUY_MORE',
        data.id,
        { quantity: existing.quantity, buy_price: existing.buy_price },
        { quantity: data.quantity, buy_price: data.buy_price },
        'USER_MANUAL',
        `Bought ${additionalQuantity} more ${symbol.toUpperCase()}`
    );

    revalidatePath('/');

    return { success: true, data: data as Asset };
}

/**
 * Sell portion of a crypto asset
 */
export async function sellCrypto(
    symbol: string,
    sellQuantity: number
): Promise<ActionResult<{ remainingQuantity: number; removed: boolean }>> {
    const { data: existing, error: findError } = await supabase
        .from('assets')
        .select('*')
        .eq('symbol', symbol.toUpperCase())
        .single();

    if (findError || !existing) {
        return { success: false, error: findError?.message ?? 'Asset not found' };
    }

    const remainingQuantity = existing.quantity - sellQuantity;

    if (remainingQuantity <= 0) {
        const { error } = await supabase
            .from('assets')
            .delete()
            .eq('id', existing.id);

        if (error) {
            console.error('Error removing crypto asset:', error);
            return { success: false, error: error.message };
        }

        revalidatePath('/');
        return { success: true, data: { remainingQuantity: 0, removed: true } };
    }

    const { error } = await supabase
        .from('assets')
        .update({ quantity: remainingQuantity })
        .eq('id', existing.id);

    if (error) {
        console.error('Error selling crypto:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/');
    return { success: true, data: { remainingQuantity, removed: false } };
}

/**
 * Remove a crypto asset completely from portfolio (by symbol, used by chat route)
 */
export async function removeCryptoAsset(symbol: string): Promise<ActionResult<null>> {
    const { error } = await supabase
        .from('assets')
        .delete()
        .eq('symbol', symbol.toUpperCase());

    if (error) {
        console.error('Error removing crypto asset:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/');
    return { success: true, data: null };
}

export async function removeCryptoAssetById(id: string): Promise<ActionResult<null>> {
    const { data: existing, error: findError } = await supabase
        .from('assets')
        .select('*')
        .eq('id', id)
        .single();

    if (findError || !existing) {
        console.error('Asset not found for deletion:', findError);
        return { success: false, error: findError?.message ?? 'Asset not found' };
    }

    const { error } = await supabase
        .from('assets')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error removing crypto asset:', error);
        return { success: false, error: error.message };
    }

    await logCryptoAction(
        'REMOVE_ASSET',
        id,
        { symbol: existing.symbol, quantity: existing.quantity, buy_price: existing.buy_price },
        null,
        'USER_MANUAL',
        `Removed ${existing.symbol} from portfolio`
    );

    revalidatePath('/');
    return { success: true, data: null };
}

export async function updateCryptoAssetById(
    id: string,
    data: Partial<AssetInput>
): Promise<ActionResult<Asset>> {
    const { data: existing, error: findError } = await supabase
        .from('assets')
        .select('*')
        .eq('id', id)
        .single();

    if (findError || !existing) {
        console.error('Asset not found for update:', findError);
        return { success: false, error: findError?.message ?? 'Asset not found' };
    }

    const updateData: Record<string, unknown> = {};
    if (data.quantity !== undefined) updateData.quantity = data.quantity;
    if (data.buy_price !== undefined) updateData.buy_price = data.buy_price;

    const { data: updated, error } = await supabase
        .from('assets')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating crypto asset:', error);
        return { success: false, error: error.message };
    }

    await logCryptoAction(
        'UPDATE_ASSET',
        id,
        { symbol: existing.symbol, quantity: existing.quantity, buy_price: existing.buy_price },
        { symbol: updated.symbol, quantity: updated.quantity, buy_price: updated.buy_price },
        'USER_MANUAL',
        `Updated ${existing.symbol}: quantity ${existing.quantity} → ${updated.quantity}, price $${existing.buy_price} → $${updated.buy_price}`
    );

    revalidatePath('/');
    return { success: true, data: updated as Asset };
}

/**
 * Get all crypto assets in portfolio
 */
export async function getCryptoAssets(): Promise<Asset[]> {
    const { data, error } = await supabase
        .from('assets')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching crypto assets:', error);
        return [];
    }

    return data as Asset[];
}

/**
 * Get a specific crypto asset by symbol
 */
export async function getCryptoAsset(symbol: string): Promise<Asset | null> {
    const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('symbol', symbol.toUpperCase())
        .single();

    if (error) {
        return null;
    }

    return data as Asset;
}
