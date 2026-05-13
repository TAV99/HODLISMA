'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type {
    FinanceCategory,
    CategoryInput,
    ActionResult,
} from '@/lib/types';

/**
 * Get all categories
 */
export async function getCategories(type?: 'income' | 'expense'): Promise<FinanceCategory[]> {
    const supabase = await createClient();
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
export async function addCategory(input: CategoryInput): Promise<ActionResult<FinanceCategory>> {
    const supabase = await createClient();
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
        return { success: false, error: error.message };
    }

    revalidatePath('/finance');
    return { success: true, data: data as FinanceCategory };
}

/**
 * Update an existing category
 */
export async function updateCategory(
    id: string,
    input: Partial<CategoryInput>
): Promise<ActionResult<FinanceCategory>> {
    const supabase = await createClient();
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
        return { success: false, error: error.message };
    }

    revalidatePath('/finance');
    return { success: true, data: data as FinanceCategory };
}

/**
 * Check if category has linked transactions
 */
export async function getCategoryTransactionCount(categoryId: string): Promise<number> {
    const supabase = await createClient();
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
): Promise<ActionResult<{ linkedCount?: number }>> {
    const supabase = await createClient();
    const linkedCount = await getCategoryTransactionCount(id);

    if (linkedCount > 0 && !force) {
        return {
            success: false,
            error: `Danh mục này có ${linkedCount} giao dịch liên kết. Bạn có muốn xóa không?`,
        };
    }

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
        return { success: false, error: 'Không thể xóa danh mục' };
    }

    revalidatePath('/finance');
    return { success: true, data: {} };
}

/**
 * Get category by ID
 */
export async function getCategoryById(id: string): Promise<FinanceCategory | null> {
    const supabase = await createClient();
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
    const supabase = await createClient();
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
