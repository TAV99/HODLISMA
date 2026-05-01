import { tool } from 'ai';
import { z } from 'zod';
import {
    addCryptoAsset,
    buyCrypto,
    sellCrypto,
    removeCryptoAsset,
    getCryptoAssets,
} from '@/lib/actions/crypto';
import { createAuditLog } from '@/lib/actions/audit';

export function getCryptoToolDefinitions() {
    return {
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
                    if (result.success) {
                        await createAuditLog({
                            module: 'CRYPTO',
                            action: 'ADD_ASSET',
                            entityType: 'asset',
                            entityId: result.data.id,
                            oldData: null,
                            newData: { symbol: result.data.symbol, quantity, buyPrice },
                            triggeredBy: 'AI_HODLISMA',
                            description: `HODLISMA: Added ${quantity} ${symbol.toUpperCase()} @ $${buyPrice}`,
                        });

                        return {
                            success: true,
                            message: `Đã thêm ${quantity} ${symbol.toUpperCase()} vào portfolio với giá $${buyPrice}`,
                            asset: {
                                symbol: result.data.symbol,
                                quantity: result.data.quantity,
                                buyPrice: result.data.buy_price,
                            },
                        };
                    }
                    return { success: false, message: result.error };
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
                if (result.success) {
                    return {
                        success: true,
                        message: `Đã mua thêm ${quantity} ${symbol.toUpperCase()} với giá $${buyPrice}`,
                        asset: {
                            symbol: result.data.symbol,
                            totalQuantity: result.data.quantity,
                            newAvgPrice: result.data.buy_price.toFixed(2),
                        },
                    };
                }
                return { success: false, message: result.error };
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
                    if (result.data.removed) {
                        return {
                            success: true,
                            message: `Đã bán hết ${symbol.toUpperCase()} và xóa khỏi portfolio`,
                            removed: true,
                        };
                    }
                    return {
                        success: true,
                        message: `Đã bán ${quantity} ${symbol.toUpperCase()}`,
                        remainingQuantity: result.data.remainingQuantity,
                    };
                }
                return { success: false, message: result.error };
            },
        }),

        removeCryptoAsset: tool({
            description: 'Xóa hoàn toàn một loại coin khỏi danh mục (không cần số lượng).',
            parameters: z.object({
                symbol: z.string().describe('Mã coin cần xóa'),
            }),
            execute: async ({ symbol }) => {
                const result = await removeCryptoAsset(symbol);
                return {
                    success: result.success,
                    message: result.success
                        ? `Đã xóa ${symbol.toUpperCase()} khỏi portfolio`
                        : result.error,
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
    };
}
