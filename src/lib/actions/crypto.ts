'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { logCryptoAction } from '@/lib/actions/audit';
import type { Asset, AssetInput } from '@/lib/types';

// ============================================
// CRYPTO ASSET SERVER ACTIONS
// ============================================

/**
 * Add a new crypto asset to portfolio
 */
export async function addCryptoAsset(input: AssetInput): Promise<Asset | null> {
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
        return null;
    }

    // Audit log
    await logCryptoAction(
        'ADD_ASSET',
        data.id,
        null,
        { symbol: data.symbol, quantity: data.quantity, buy_price: data.buy_price },
        'USER_MANUAL',
        `Added ${data.quantity} ${data.symbol} @ $${data.buy_price}`
    );

    // Revalidate for instant UI update
    revalidatePath('/');

    return data as Asset;
}

/**
 * Update crypto asset quantity (for buy more / sell)
 */
export async function updateCryptoQuantity(
    symbol: string,
    newQuantity: number,
    newAvgPrice?: number
): Promise<Asset | null> {
    // Find asset by symbol
    const { data: existing, error: findError } = await supabase
        .from('assets')
        .select('*')
        .eq('symbol', symbol.toUpperCase())
        .single();

    if (findError || !existing) {
        console.error('Asset not found:', findError);
        return null;
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
        return null;
    }

    return data as Asset;
}

/**
 * Buy more of an existing crypto (adds to quantity, recalculates avg price)
 */
export async function buyCrypto(
    symbol: string,
    additionalQuantity: number,
    buyPrice: number
): Promise<Asset | null> {
    // Find existing asset
    const { data: existing, error: findError } = await supabase
        .from('assets')
        .select('*')
        .eq('symbol', symbol.toUpperCase())
        .single();

    if (findError || !existing) {
        // If not found, create new position
        return addCryptoAsset({
            symbol: symbol.toUpperCase(),
            quantity: additionalQuantity,
            buy_price: buyPrice,
        });
    }

    // Calculate new weighted average price
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
        return null;
    }

    // Audit log
    await logCryptoAction(
        'BUY_MORE',
        data.id,
        { quantity: existing.quantity, buy_price: existing.buy_price },
        { quantity: data.quantity, buy_price: data.buy_price },
        'USER_MANUAL',
        `Bought ${additionalQuantity} more ${symbol.toUpperCase()}`
    );

    // Revalidate for instant UI update
    revalidatePath('/');

    return data as Asset;
}

/**
 * Sell portion of a crypto asset
 */
export async function sellCrypto(
    symbol: string,
    sellQuantity: number
): Promise<{ success: boolean; remainingQuantity: number; removed: boolean }> {
    // Find existing asset
    const { data: existing, error: findError } = await supabase
        .from('assets')
        .select('*')
        .eq('symbol', symbol.toUpperCase())
        .single();

    if (findError || !existing) {
        return { success: false, remainingQuantity: 0, removed: false };
    }

    const remainingQuantity = existing.quantity - sellQuantity;

    // If selling all, remove the asset
    if (remainingQuantity <= 0) {
        const { error } = await supabase
            .from('assets')
            .delete()
            .eq('id', existing.id);

        if (error) {
            console.error('Error removing crypto asset:', error);
            return { success: false, remainingQuantity: existing.quantity, removed: false };
        }

        revalidatePath('/');
        return { success: true, remainingQuantity: 0, removed: true };
    }

    // Otherwise update quantity
    const { error } = await supabase
        .from('assets')
        .update({ quantity: remainingQuantity })
        .eq('id', existing.id);

    if (error) {
        console.error('Error selling crypto:', error);
        return { success: false, remainingQuantity: existing.quantity, removed: false };
    }

    revalidatePath('/');
    return { success: true, remainingQuantity, removed: false };
}

/**
 * Remove a crypto asset completely from portfolio
 */
export async function removeCryptoAsset(symbol: string): Promise<boolean> {
    const { error } = await supabase
        .from('assets')
        .delete()
        .eq('symbol', symbol.toUpperCase());

    if (error) {
        console.error('Error removing crypto asset:', error);
        return false;
    }

    return true;
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
