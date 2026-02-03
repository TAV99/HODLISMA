import { createOpenAI } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';

// Import finance Server Actions
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

// Import crypto Server Actions
import {
    addCryptoAsset,
    buyCrypto,
    sellCrypto,
    removeCryptoAsset,
    getCryptoAssets,
} from '@/lib/actions/crypto';

// Import audit logging
import { createAuditLog } from '@/lib/actions/audit';

export const maxDuration = 30;

// Configure OpenRouter as OpenAI-compatible provider
const openrouter = createOpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
    headers: {
        'HTTP-Referer': 'https://hodlisma.vercel.app',
        'X-Title': 'HODLISMA Portfolio',
    },
});

export async function POST(req: Request) {
    try {
        const { messages, portfolioContext } = await req.json();

        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();
        const currentPage = portfolioContext?.currentPage || 'crypto';
        const isFinancePage = currentPage === 'finance';

        const systemPrompt = isFinancePage
            ? `Bạn là Trinity AI, trợ lý tài chính cá nhân thông minh.

**Người dùng đang ở trang Personal Finance.**

**Khả năng của bạn:**
- Ghi lại thu/chi: Dùng tool addTransaction
- Tra cứu giao dịch: Dùng tool getTransactions
- Tổng hợp tháng: Dùng tool getFinancialSummary
- Quản lý tiết kiệm: Dùng getSavings và updateSavings
- Quản lý danh mục: Dùng getCategories và manageCategory

**Quy tắc quản lý danh mục:**
1. Bạn có quyền tạo, sửa, xóa danh mục thu/chi
2. Khi tạo danh mục mới, tự động gán type phù hợp (thức ăn = expense, lương = income)
3. Khi đổi tên danh mục, tìm ID chính xác trước khi sửa
4. Trước khi XÓA danh mục, LUÔN cảnh báo nếu có giao dịch liên kết
5. Sau khi thay đổi, xác nhận danh sách danh mục mới

**Ngày hiện tại:** ${currentDate.toLocaleDateString('vi-VN')}
**Tháng/Năm:** ${currentMonth}/${currentYear}

**Phong cách:** Thân thiện, ngắn gọn. Luôn xác nhận sau khi thực hiện.
**Ưu tiên:** Sử dụng tools để thao tác với database.`
            : `You are HODLISMA AI, an elite crypto Portfolio Executor.

**ROLE:** You have DIRECT ACCESS to the user's crypto database. You can add, update, and remove assets.

**Current Portfolio:** ${JSON.stringify(portfolioContext)}
**Current Date:** ${currentDate.toLocaleDateString('en-US')}

**CRITICAL RULES:**
1. Before REMOVING an asset, ALWAYS ask for final confirmation: "Are you sure you want to remove [SYMBOL] from your portfolio?"
2. After ANY update (add/buy/sell), ALWAYS summarize the new state: "Your new [SYMBOL] balance is now [QUANTITY] @ avg $[PRICE]"
3. When user says "buy more", use the buyCrypto tool (auto-calculates weighted average price)
4. When user says "sell", use sellCrypto tool
5. Be professional, data-driven, and concise

**Available Tools:** addCryptoAsset, buyCrypto, sellCrypto, removeCryptoAsset, getCryptoPortfolio`;

        const result = await streamText({
            model: openrouter('arcee-ai/trinity-large-preview:free'),
            messages: [
                { role: 'system', content: systemPrompt },
                ...messages,
            ],
            tools: {
                // ============================================
                // TRANSACTION TOOLS
                // ============================================
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
                        // Get category ID if category name provided
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

                        if (result) {
                            // Log to audit
                            await createAuditLog({
                                module: 'FINANCE',
                                action: 'ADD_TRANSACTION',
                                entityType: 'transaction',
                                entityId: result.id,
                                oldData: null,
                                newData: { amount: result.amount, type: result.type, category: result.category?.name },
                                triggeredBy: 'AI_TRINITY',
                                description: `Trinity: Added ${type} ${amount.toLocaleString('vi-VN')}đ`,
                            });

                            return {
                                success: true,
                                message: `Đã ghi nhận ${type === 'income' ? 'thu' : type === 'expense' ? 'chi' : 'đầu tư'} ${amount.toLocaleString('vi-VN')}đ`,
                                data: {
                                    id: result.id,
                                    amount: result.amount,
                                    type: result.type,
                                    category: result.category?.name,
                                    date: result.date,
                                },
                            };
                        }
                        return { success: false, message: 'Không thể ghi giao dịch. Vui lòng thử lại.' };
                    },
                }),

                deleteTransaction: tool({
                    description: 'Xóa một giao dịch đã ghi. Cần có ID của giao dịch.',
                    parameters: z.object({
                        transactionId: z.string().uuid().describe('ID của giao dịch cần xóa'),
                    }),
                    execute: async ({ transactionId }) => {
                        const success = await deleteTransaction(transactionId);

                        if (success) {
                            await createAuditLog({
                                module: 'FINANCE',
                                action: 'DELETE_TRANSACTION',
                                entityType: 'transaction',
                                entityId: transactionId,
                                oldData: null,
                                newData: null,
                                triggeredBy: 'AI_TRINITY',
                                description: `Trinity: Deleted transaction ${transactionId}`,
                            });
                        }

                        return {
                            success,
                            message: success ? 'Đã xóa giao dịch thành công' : 'Không tìm thấy giao dịch để xóa',
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

                // ============================================
                // FINANCIAL SUMMARY
                // ============================================
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

                // ============================================
                // CATEGORIES
                // ============================================
                getCategories: tool({
                    description: 'Lấy danh sách các hạng mục thu/chi. Dùng khi cần biết các category có sẵn.',
                    parameters: z.object({
                        type: z.enum(['income', 'expense']).optional().describe('Lọc theo loại: income hoặc expense'),
                    }),
                    execute: async ({ type }) => {
                        const categories = await getCategories(type);
                        return {
                            success: true,
                            categories: categories.map(c => ({
                                id: c.id,
                                name: c.name,
                                type: c.type,
                                icon: c.icon,
                                color: c.color,
                            })),
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
                        // Smart icon mapping
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

                        // Smart type mapping
                        const expenseKeywords = ['ăn', 'mua', 'chi', 'thuê', 'xe', 'xăng', 'điện', 'giải trí'];
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

                            if (result) {
                                return {
                                    success: true,
                                    message: `Đã tạo danh mục "${result.name}" (${result.type})`,
                                    category: result,
                                };
                            }
                            return { success: false, message: 'Không thể tạo danh mục' };
                        }

                        if (action === 'update') {
                            // Find category by name first
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

                            if (result) {
                                return {
                                    success: true,
                                    message: `Đã cập nhật danh mục "${result.name}"`,
                                    category: result,
                                };
                            }
                            return { success: false, message: 'Không thể cập nhật danh mục' };
                        }

                        if (action === 'delete') {
                            const existing = await findCategoryByName(name);
                            if (!existing) {
                                return { success: false, message: `Không tìm thấy danh mục "${name}"` };
                            }

                            const result = await deleteCategory(existing.id, forceDelete || false);
                            return result;
                        }

                        return { success: false, message: 'Hành động không hợp lệ' };
                    },
                }),

                // ============================================
                // SAVINGS VAULT
                // ============================================
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
                        if (result) {
                            const progress = Math.round((result.current_amount / result.target_amount) * 100);
                            return {
                                success: true,
                                message: `Đã nạp ${amount.toLocaleString('vi-VN')}đ vào quỹ "${result.name}"`,
                                vault: {
                                    name: result.name,
                                    currentAmount: result.current_amount,
                                    targetAmount: result.target_amount,
                                    progress: `${progress}%`,
                                    isCompleted: result.is_completed,
                                },
                            };
                        }
                        return { success: false, message: 'Không tìm thấy quỹ tiết kiệm' };
                    },
                }),

                // ============================================
                // CRYPTO PORTFOLIO TOOLS
                // ============================================
                addCryptoAsset: tool({
                    description: 'Thêm một loại coin mới vào danh mục đầu tư crypto.',
                    parameters: z.object({
                        symbol: z.string().describe('Mã coin (VD: BTC, ETH, SOL)'),
                        quantity: z.number().positive().describe('Số lượng coin'),
                        buyPrice: z.number().positive().describe('Giá mua trung bình (USD)'),
                        name: z.string().optional().describe('Tên đầy đủ của coin'),
                    }),
                    execute: async ({ symbol, quantity, buyPrice, name }) => {
                        try {
                            const result = await addCryptoAsset({
                                symbol,
                                quantity,
                                buy_price: buyPrice,
                                name,
                            });
                            if (result) {
                                await createAuditLog({
                                    module: 'CRYPTO',
                                    action: 'ADD_ASSET',
                                    entityType: 'asset',
                                    entityId: result.id,
                                    oldData: null,
                                    newData: { symbol: result.symbol, quantity, buyPrice },
                                    triggeredBy: 'AI_TRINITY',
                                    description: `Trinity: Added ${quantity} ${symbol.toUpperCase()} @ $${buyPrice}`,
                                });

                                return {
                                    success: true,
                                    message: `Đã thêm ${quantity} ${symbol.toUpperCase()} vào portfolio với giá $${buyPrice}`,
                                    asset: {
                                        symbol: result.symbol,
                                        quantity: result.quantity,
                                        buyPrice: result.buy_price,
                                    },
                                };
                            }
                            return { success: false, message: 'Không thể thêm coin. Vui lòng thử lại.' };
                        } catch (error) {
                            console.error('addCryptoAsset error:', error);
                            return { success: false, message: 'Lỗi hệ thống khi thêm coin. Vui lòng thử lại.' };
                        }
                    },
                }),

                buyCrypto: tool({
                    description: 'Mua thêm một loại coin đã có trong portfolio. Tự động tính lại giá trung bình.',
                    parameters: z.object({
                        symbol: z.string().describe('Mã coin (VD: BTC, ETH)'),
                        quantity: z.number().positive().describe('Số lượng mua thêm'),
                        buyPrice: z.number().positive().describe('Giá mua lần này (USD)'),
                    }),
                    execute: async ({ symbol, quantity, buyPrice }) => {
                        const result = await buyCrypto(symbol, quantity, buyPrice);
                        if (result) {
                            return {
                                success: true,
                                message: `Đã mua thêm ${quantity} ${symbol.toUpperCase()} với giá $${buyPrice}`,
                                asset: {
                                    symbol: result.symbol,
                                    totalQuantity: result.quantity,
                                    newAvgPrice: result.buy_price.toFixed(2),
                                },
                            };
                        }
                        return { success: false, message: 'Không thể mua thêm. Vui lòng thử lại.' };
                    },
                }),

                sellCrypto: tool({
                    description: 'Bán một phần hoặc toàn bộ coin đang nắm giữ.',
                    parameters: z.object({
                        symbol: z.string().describe('Mã coin cần bán'),
                        quantity: z.number().positive().describe('Số lượng muốn bán'),
                    }),
                    execute: async ({ symbol, quantity }) => {
                        const result = await sellCrypto(symbol, quantity);
                        if (result.success) {
                            if (result.removed) {
                                return {
                                    success: true,
                                    message: `Đã bán hết ${symbol.toUpperCase()} và xóa khỏi portfolio`,
                                    removed: true,
                                };
                            }
                            return {
                                success: true,
                                message: `Đã bán ${quantity} ${symbol.toUpperCase()}`,
                                remainingQuantity: result.remainingQuantity,
                            };
                        }
                        return { success: false, message: `Không tìm thấy ${symbol.toUpperCase()} trong portfolio` };
                    },
                }),

                removeCryptoAsset: tool({
                    description: 'Xóa hoàn toàn một loại coin khỏi danh mục (không cần số lượng).',
                    parameters: z.object({
                        symbol: z.string().describe('Mã coin cần xóa'),
                    }),
                    execute: async ({ symbol }) => {
                        const success = await removeCryptoAsset(symbol);
                        return {
                            success,
                            message: success
                                ? `Đã xóa ${symbol.toUpperCase()} khỏi portfolio`
                                : `Không tìm thấy ${symbol.toUpperCase()} trong portfolio`,
                        };
                    },
                }),

                getCryptoPortfolio: tool({
                    description: 'Lấy danh sách tất cả coin trong portfolio crypto.',
                    parameters: z.object({}),
                    execute: async () => {
                        const assets = await getCryptoAssets();
                        return {
                            success: true,
                            count: assets.length,
                            assets: assets.map(a => ({
                                symbol: a.symbol,
                                name: a.name,
                                quantity: a.quantity,
                                buyPrice: a.buy_price,
                            })),
                        };
                    },
                }),
            },
            maxSteps: 5, // Allow multiple tool calls if needed
        });

        return result.toDataStreamResponse();
    } catch (error) {
        console.error("Trinity AI Error:", error);
        return new Response(JSON.stringify({ error: "AI Agent is currently busy. Please try again." }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
