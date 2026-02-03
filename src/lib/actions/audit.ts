'use server';

import { supabase } from '@/lib/supabase';

// ============================================
// AUDIT LOG TYPES
// ============================================

export type AuditModule = 'CRYPTO' | 'FINANCE' | 'SYSTEM';
export type AuditTrigger = 'USER_MANUAL' | 'AI_TRINITY';

export interface AuditLogInput {
    module: AuditModule;
    action: string;
    entityType: string;
    entityId?: string;
    oldData?: Record<string, unknown> | null;
    newData?: Record<string, unknown> | null;
    triggeredBy: AuditTrigger;
    description?: string;
}

export interface AuditLog extends AuditLogInput {
    id: string;
    createdAt: string;
}

// ============================================
// HELPER FUNCTION: createAuditLog
// ============================================

/**
 * Create a unified audit log entry
 * Use this for all data mutations across Crypto and Finance modules
 */
export async function createAuditLog(input: AuditLogInput): Promise<string | null> {
    try {
        const { data, error } = await supabase
            .from('audit_logs')
            .insert({
                module: input.module,
                action: input.action,
                entity_type: input.entityType,
                entity_id: input.entityId || null,
                old_data: input.oldData || null,
                new_data: input.newData || null,
                triggered_by: input.triggeredBy,
                description: input.description || null,
            })
            .select('id')
            .single();

        if (error) {
            console.error('Audit log error:', error);
            return null;
        }

        return data.id;
    } catch (err) {
        console.error('Audit log exception:', err);
        return null;
    }
}

// ============================================
// CONVENIENCE WRAPPERS
// ============================================

/**
 * Log a crypto module action
 */
export async function logCryptoAction(
    action: string,
    entityId: string | undefined,
    oldData: Record<string, unknown> | null,
    newData: Record<string, unknown> | null,
    triggeredBy: AuditTrigger = 'USER_MANUAL',
    description?: string
): Promise<string | null> {
    return createAuditLog({
        module: 'CRYPTO',
        action,
        entityType: 'asset',
        entityId,
        oldData,
        newData,
        triggeredBy,
        description,
    });
}

/**
 * Log a finance module action
 */
export async function logFinanceAction(
    action: string,
    entityType: 'transaction' | 'category' | 'savings',
    entityId: string | undefined,
    oldData: Record<string, unknown> | null,
    newData: Record<string, unknown> | null,
    triggeredBy: AuditTrigger = 'USER_MANUAL',
    description?: string
): Promise<string | null> {
    return createAuditLog({
        module: 'FINANCE',
        action,
        entityType,
        entityId,
        oldData,
        newData,
        triggeredBy,
        description,
    });
}

// ============================================
// QUERY FUNCTIONS
// ============================================

/**
 * Get recent audit logs with pagination
 */
export async function getAuditLogs(options?: {
    module?: AuditModule;
    limit?: number;
    offset?: number;
}): Promise<AuditLog[]> {
    let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(options?.limit || 50);

    if (options?.module) {
        query = query.eq('module', options.module);
    }

    if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching audit logs:', error);
        return [];
    }

    return data.map((log) => ({
        id: log.id,
        module: log.module,
        action: log.action,
        entityType: log.entity_type,
        entityId: log.entity_id,
        oldData: log.old_data,
        newData: log.new_data,
        triggeredBy: log.triggered_by,
        description: log.description,
        createdAt: log.created_at,
    }));
}

/**
 * Get audit history for a specific entity
 */
export async function getEntityAuditHistory(
    entityType: string,
    entityId: string
): Promise<AuditLog[]> {
    const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching entity audit history:', error);
        return [];
    }

    return data.map((log) => ({
        id: log.id,
        module: log.module,
        action: log.action,
        entityType: log.entity_type,
        entityId: log.entity_id,
        oldData: log.old_data,
        newData: log.new_data,
        triggeredBy: log.triggered_by,
        description: log.description,
        createdAt: log.created_at,
    }));
}

// ============================================
// ROLLBACK FUNCTIONALITY
// ============================================

/**
 * Rollback an action using the old_data from audit log
 */
export async function rollbackFromAuditLog(
    auditLogId: string
): Promise<{ success: boolean; message: string }> {
    // Get the audit log entry
    const { data: log, error: fetchError } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('id', auditLogId)
        .single();

    if (fetchError || !log) {
        return { success: false, message: 'Không tìm thấy log để rollback' };
    }

    // Check if we have old_data to restore
    if (!log.old_data && log.action.includes('ADD')) {
        // This was a CREATE action - need to delete the entity
        const tableName = log.module === 'CRYPTO' ? 'assets' :
            log.entity_type === 'transaction' ? 'personal_transactions' :
                log.entity_type === 'category' ? 'finance_categories' :
                    'savings_vault';

        if (log.entity_id) {
            const { error } = await supabase
                .from(tableName)
                .delete()
                .eq('id', log.entity_id);

            if (error) {
                return { success: false, message: `Lỗi khi xóa: ${error.message}` };
            }

            // Log the rollback
            await createAuditLog({
                module: log.module,
                action: 'ROLLBACK_DELETE',
                entityType: log.entity_type,
                entityId: log.entity_id,
                oldData: log.new_data,
                newData: null,
                triggeredBy: 'USER_MANUAL',
                description: `Rollback: Xóa ${log.entity_type} được tạo bởi action ${log.action}`,
            });

            return { success: true, message: 'Đã rollback thành công (xóa bản ghi)' };
        }
    }

    if (!log.old_data) {
        return { success: false, message: 'Không có dữ liệu cũ để khôi phục' };
    }

    // Determine target table
    const tableName = log.module === 'CRYPTO' ? 'assets' :
        log.entity_type === 'transaction' ? 'personal_transactions' :
            log.entity_type === 'category' ? 'finance_categories' :
                'savings_vault';

    if (!log.entity_id) {
        return { success: false, message: 'Thiếu entity_id để rollback' };
    }

    // Restore old data
    const { error: updateError } = await supabase
        .from(tableName)
        .update(log.old_data)
        .eq('id', log.entity_id);

    if (updateError) {
        return { success: false, message: `Lỗi khi rollback: ${updateError.message}` };
    }

    // Log the rollback action
    await createAuditLog({
        module: log.module,
        action: 'ROLLBACK',
        entityType: log.entity_type,
        entityId: log.entity_id,
        oldData: log.new_data,
        newData: log.old_data,
        triggeredBy: 'USER_MANUAL',
        description: `Rollback từ action: ${log.action}`,
    });

    return { success: true, message: 'Đã khôi phục dữ liệu thành công' };
}
