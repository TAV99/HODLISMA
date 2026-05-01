import { tool } from 'ai';
import { z } from 'zod';
import {
    addTransaction,
    deleteTransaction,
    getTransactions,
    getMonthlySummary,
    getCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    findCategoryByName,
    getSavingsVaults,
    addToSavingsVault,
} from '@/lib/actions/finance';
import { createAuditLog } from '@/lib/actions/audit';

export function getFinanceToolDefinitions(currentMonth: number, currentYear: number) {
    return {
        addTransaction: tool({
            description: 'Ghi lại một khoản thu hoặc chi mới vào sổ tài chính. Sử dụng khi người dùng muốn ghi nhận một giao dịch.',
            parameters: z.object({
                amount: z.number().positive().describe('Số tiền giao dịch (VND)'),
                type: z.enum(['income', 'expense', 'investment']).describe('Loại: income (thu), expense (chi), investment (đầu tư)'),
                category: z.string().optional().describe('Tên hạng mục (VD: Ăn uống, Lương, Mua sắm)'),
                note: z.string().optional().describe('Ghi chú thêm về giao dịch'),
                date: z.string().optional().describe('Ngày giao dịch (YYYY-MM-DD), mặc định là hôm nay'),
            }),
            execute: async ({ amount, type, category, note, date }) => {
                let categoryId: string | undefined;
                if (category) {
                    const categories = await getCategories(type === 'investment' ? undefined : type as 'income' | 'expense');
                    const found = categories.find(c =>
                        c.name.toLowerCase().includes(category.toLowerCase()) ||
                        category.toLowerCase().includes(c.name.toLowerCase())
                    );
                    categoryId = found?.id;
                }

                const result = await addTransaction({
                    amount,
                    type,
                    category_id: categoryId,
                    note: note || undefined,
                    date: date || new Date().toISOString().split('T')[0],
                });

                if (result.success) {
                    await createAuditLog({
                        module: 'FINANCE',
                        action: 'ADD_TRANSACTION',
                        entityType: 'transaction',
                        entityId: result.data.id,
                        oldData: null,
                        newData: { amount: result.data.amount, type: result.data.type, category: result.data.category?.name },
                        triggeredBy: 'AI_HODLISMA',
                        description: `HODLISMA: Added ${type} ${amount.toLocaleString('vi-VN')}đ`,
                    });

                    return {
                        success: true,
                        message: `Đã ghi nhận ${type === 'income' ? 'thu' : type === 'expense' ? 'chi' : 'đầu tư'} ${amount.toLocaleString('vi-VN')}đ`,
                        data: {
                            id: result.data.id,
                            amount: result.data.amount,
                            type: result.data.type,
                            category: result.data.category?.name,
                            date: result.data.date,
                        },
                    };
                }
                return { success: false, message: result.error };
            },
        }),

        deleteTransaction: tool({
            description: 'Xóa một giao dịch đã ghi. Cần có ID của giao dịch.',
            parameters: z.object({
                transactionId: z.string().uuid().describe('ID của giao dịch cần xóa'),
            }),
            execute: async ({ transactionId }) => {
                const result = await deleteTransaction(transactionId);

                if (result.success) {
                    await createAuditLog({
                        module: 'FINANCE',
                        action: 'DELETE_TRANSACTION',
                        entityType: 'transaction',
                        entityId: transactionId,
                        oldData: null,
                        newData: null,
                        triggeredBy: 'AI_HODLISMA',
                        description: `HODLISMA: Deleted transaction ${transactionId}`,
                    });
                }

                return {
                    success: result.success,
                    message: result.success ? 'Đã xóa giao dịch thành công' : result.error,
                };
            },
        }),

        getTransactions: tool({
            description: 'Lấy danh sách các giao dịch gần đây. Có thể lọc theo loại và thời gian.',
            parameters: z.object({
                type: z.enum(['income', 'expense', 'investment']).optional().describe('Lọc theo loại giao dịch'),
                limit: z.number().max(20).optional().describe('Số lượng giao dịch tối đa (mặc định 10)'),
            }),
            execute: async ({ type, limit }) => {
                const transactions = await getTransactions({
                    type,
                    limit: limit || 10,
                });

                return {
                    success: true,
                    count: transactions.length,
                    transactions: transactions.map(tx => ({
                        id: tx.id,
                        amount: tx.amount,
                        type: tx.type,
                        category: tx.category?.name || 'Không phân loại',
                        date: tx.date,
                        note: tx.note,
                    })),
                };
            },
        }),

        getFinancialSummary: tool({
            description: 'Lấy tổng hợp thu/chi của một tháng. Sử dụng để phân tích tình hình tài chính.',
            parameters: z.object({
                month: z.number().min(1).max(12).optional().describe('Tháng (1-12), mặc định là tháng hiện tại'),
                year: z.number().optional().describe('Năm, mặc định là năm hiện tại'),
            }),
            execute: async ({ month, year }) => {
                const targetMonth = month || currentMonth;
                const targetYear = year || currentYear;

                const summary = await getMonthlySummary(targetYear, targetMonth);

                return {
                    success: true,
                    period: `${targetMonth}/${targetYear}`,
                    summary: {
                        totalIncome: summary.total_income,
                        totalExpense: summary.total_expense,
                        totalInvestment: summary.total_investment,
                        netBalance: summary.net_balance,
                        transactionCount: summary.transaction_count,
                    },
                    formatted: {
                        totalIncome: `${summary.total_income.toLocaleString('vi-VN')}đ`,
                        totalExpense: `${summary.total_expense.toLocaleString('vi-VN')}đ`,
                        totalInvestment: `${summary.total_investment.toLocaleString('vi-VN')}đ`,
                        netBalance: `${summary.net_balance.toLocaleString('vi-VN')}đ`,
                    },
                };
            },
        }),

        getFinanceCategories: tool({
            description: 'Lấy danh sách đầy đủ các danh mục thu chi hiện có. LUÔN gọi tool này TRƯỚC KHI thực hiện thêm/sửa/xóa giao dịch để đảm bảo chính xác ID và Tên danh mục.',
            parameters: z.object({
                type: z.enum(['income', 'expense']).optional().describe('Lọc theo loại: income hoặc expense'),
            }),
            execute: async ({ type }) => {
                const categories = await getCategories(type);
                return {
                    success: true,
                    count: categories.length,
                    categories: categories.map(c => ({
                        id: c.id,
                        name: c.name,
                        type: c.type,
                        icon: c.icon,
                        color: c.color,
                    })),
                    hint: 'Sử dụng chính xác tên danh mục từ danh sách này khi thêm giao dịch.',
                };
            },
        }),

        manageCategory: tool({
            description: 'Tạo, sửa hoặc xóa danh mục thu/chi. Tự động gán icon và type phù hợp.',
            parameters: z.object({
                action: z.enum(['create', 'update', 'delete']).describe('Hành động: create, update, delete'),
                name: z.string().describe('Tên danh mục'),
                type: z.enum(['income', 'expense']).optional().describe('Loại: income hoặc expense'),
                icon: z.string().optional().describe('Icon (VD: utensils, coffee, car, home)'),
                color: z.string().optional().describe('Màu sắc (hex)'),
                forceDelete: z.boolean().optional().describe('Xóa kể cả khi có giao dịch liên kết'),
            }),
            execute: async ({ action, name, type, icon, color, forceDelete }) => {
                const iconMap: Record<string, string> = {
                    'ăn': 'utensils', 'thức ăn': 'utensils', 'cơm': 'utensils',
                    'cà phê': 'coffee', 'trà': 'coffee', 'uống': 'coffee',
                    'xe': 'car', 'xăng': 'fuel', 'đi lại': 'car',
                    'nhà': 'home', 'thuê': 'home', 'điện nước': 'zap',
                    'lương': 'banknote', 'thu nhập': 'banknote',
                    'mua sắm': 'shopping-bag', 'quần áo': 'shirt',
                    'sức khỏe': 'heart', 'thuốc': 'pill',
                    'giải trí': 'gamepad-2', 'phim': 'film',
                };

                const incomeKeywords = ['lương', 'thu nhập', 'thưởng', 'bonus', 'tiền lãi'];

                const smartType = type || (
                    incomeKeywords.some(k => name.toLowerCase().includes(k)) ? 'income' : 'expense'
                );

                const smartIcon = icon || Object.entries(iconMap).find(
                    ([key]) => name.toLowerCase().includes(key)
                )?.[1] || 'circle';

                if (action === 'create') {
                    const result = await addCategory({
                        name,
                        type: smartType,
                        icon: smartIcon,
                        color: color || (smartType === 'income' ? '#10b981' : '#f43f5e'),
                    });

                    if (result.success) {
                        return {
                            success: true,
                            message: `Đã tạo danh mục "${result.data.name}" (${result.data.type})`,
                            category: result.data,
                        };
                    }
                    return { success: false, message: result.error };
                }

                if (action === 'update') {
                    const existing = await findCategoryByName(name);
                    if (!existing) {
                        return { success: false, message: `Không tìm thấy danh mục "${name}"` };
                    }

                    const result = await updateCategory(existing.id, {
                        name,
                        type: type || existing.type,
                        icon: icon || existing.icon,
                        color: color || existing.color,
                    });

                    if (result.success) {
                        return {
                            success: true,
                            message: `Đã cập nhật danh mục "${result.data.name}"`,
                            category: result.data,
                        };
                    }
                    return { success: false, message: result.error };
                }

                if (action === 'delete') {
                    const existing = await findCategoryByName(name);
                    if (!existing) {
                        return { success: false, message: `Không tìm thấy danh mục "${name}"` };
                    }

                    const result = await deleteCategory(existing.id, forceDelete || false);
                    if (result.success) {
                        return { success: true, message: 'Đã xóa danh mục thành công' };
                    }
                    return { success: false, message: result.error };
                }

                return { success: false, message: 'Hành động không hợp lệ' };
            },
        }),

        getSavings: tool({
            description: 'Xem danh sách các quỹ tiết kiệm và tiến độ.',
            parameters: z.object({
                includeCompleted: z.boolean().optional().describe('Có bao gồm quỹ đã hoàn thành không (mặc định: có)'),
            }),
            execute: async ({ includeCompleted }) => {
                const vaults = await getSavingsVaults(includeCompleted !== false);
                return {
                    success: true,
                    count: vaults.length,
                    vaults: vaults.map(v => ({
                        id: v.id,
                        name: v.name,
                        targetAmount: v.target_amount,
                        currentAmount: v.current_amount,
                        progress: Math.round((v.current_amount / v.target_amount) * 100),
                        isCompleted: v.is_completed,
                        formatted: {
                            target: `${v.target_amount.toLocaleString('vi-VN')}đ`,
                            current: `${v.current_amount.toLocaleString('vi-VN')}đ`,
                        },
                    })),
                };
            },
        }),

        updateSavings: tool({
            description: 'Nạp thêm tiền vào một quỹ tiết kiệm.',
            parameters: z.object({
                vaultId: z.string().uuid().describe('ID của quỹ tiết kiệm'),
                amount: z.number().positive().describe('Số tiền muốn nạp thêm'),
            }),
            execute: async ({ vaultId, amount }) => {
                const result = await addToSavingsVault(vaultId, amount);
                if (result.success) {
                    const progress = Math.round((result.data.current_amount / result.data.target_amount) * 100);
                    return {
                        success: true,
                        message: `Đã nạp ${amount.toLocaleString('vi-VN')}đ vào quỹ "${result.data.name}"`,
                        vault: {
                            name: result.data.name,
                            currentAmount: result.data.current_amount,
                            targetAmount: result.data.target_amount,
                            progress: `${progress}%`,
                            isCompleted: result.data.is_completed,
                        },
                    };
                }
                return { success: false, message: result.error };
            },
        }),
    };
}
