import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { getFinanceToolDefinitions } from './tools/finance-tools';
import { getCryptoToolDefinitions } from './tools/crypto-tools';
import { getExternalToolDefinitions } from './tools/external-tools';

export const maxDuration = 60;

export async function POST(req: Request) {
    try {
        const { messages, portfolioContext } = await req.json();

        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();
        const currentPage = portfolioContext?.currentPage || 'crypto';
        const isFinancePage = currentPage === 'finance';

        const systemPrompt = isFinancePage
            ? `Bạn là HODLISMA AI, trợ lý tài chính cá nhân thông minh.

**Người dùng đang ở trang Personal Finance.**

**Khả năng của bạn:**
- Ghi lại thu/chi: Dùng tool addTransaction
- Tra cứu giao dịch: Dùng tool getTransactions
- Tổng hợp tháng: Dùng tool getFinancialSummary
- Quản lý tiết kiệm: Dùng getSavings và updateSavings
- Quản lý danh mục: Dùng getFinanceCategories và manageCategory

**🚨 QUY TẮC BẮT BUỘC - CRITICAL:**
1. TRƯỚC KHI phân loại BẤT KỲ giao dịch nào, bạn PHẢI gọi tool \`getFinanceCategories\` để xem danh sách danh mục THỰC TẾ trong database
2. KHÔNG BAO GIỜ đoán tên danh mục - chỉ sử dụng tên CHÍNH XÁC từ database
3. Nếu người dùng yêu cầu danh mục không tồn tại, HỎI XÁC NHẬN để tạo mới thay vì đoán

**Quy tắc quản lý danh mục:**
1. Bạn có quyền tạo, sửa, xóa danh mục thu/chi
2. Khi tạo danh mục mới, tự động gán type phù hợp (thức ăn = expense, lương = income)
3. Khi đổi tên danh mục, tìm ID chính xác trước khi sửa
4. Trước khi XÓA danh mục, LUÔN cảnh báo nếu có giao dịch liên kết
5. Sau khi thay đổi, xác nhận danh sách danh mục mới

**Ngày hiện tại:** ${currentDate.toLocaleDateString('vi-VN')}
**Tháng/Năm:** ${currentMonth}/${currentYear}

**Phong cách:** Thân thiện, ngắn gọn. Luôn xác nhận sau khi thực hiện.
**Tìm kiếm web:** Bạn có khả năng tìm kiếm Google Search để tra cứu thông tin bên ngoài (tin tức, giá cả, sự kiện). Hãy chủ động search khi người dùng hỏi về thông tin thời sự.

**Ưu tiên:** Sử dụng tools để thao tác với database.`
            : `You are HODLISMA AI, an elite crypto Portfolio Executor.

**ROLE:** You have DIRECT ACCESS to the user's crypto database. You can add, update, and remove assets.

**Portfolio Summary:** ${portfolioContext?.assets?.length || 0} assets | Total Invested: $${portfolioContext?.totals?.totalInvested?.toFixed(2) || '0'} | Current Value: $${portfolioContext?.totals?.totalValue?.toFixed(2) || '0'} | P&L: ${portfolioContext?.totals?.totalPnlPercent?.toFixed(1) || '0'}%
**Use getCryptoPortfolio tool for detailed asset data.**
**Current Date:** ${currentDate.toLocaleDateString('en-US')}

**CRITICAL RULES:**
1. Before REMOVING an asset, ALWAYS ask for final confirmation: "Are you sure you want to remove [SYMBOL] from your portfolio?"
2. After ANY update (add/buy/sell), ALWAYS summarize the new state: "Your new [SYMBOL] balance is now [QUANTITY] @ avg $[PRICE]"
3. When user says "buy more", use the buyCrypto tool (auto-calculates weighted average price)
4. When user says "sell", use sellCrypto tool
5. Be professional, data-driven, and concise

**Available Tools:** addCryptoAsset, buyCrypto, sellCrypto, removeCryptoAsset, getCryptoPortfolio, webSearch (search the web for any info), getCryptoNews (latest crypto news)`;

        const result = await streamText({
            model: google('gemini-2.5-flash'),
            messages: [
                { role: 'system', content: systemPrompt },
                ...messages,
            ],
            tools: {
                ...getFinanceToolDefinitions(currentMonth, currentYear),
                ...getCryptoToolDefinitions(),
                ...getExternalToolDefinitions(),
            },
            maxTokens: 4096,
            maxSteps: 8,
        });

        return result.toDataStreamResponse();
    } catch (error) {
        console.error("HODLISMA AI Error:", error);
        return new Response(JSON.stringify({ error: "AI Agent is currently busy. Please try again." }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
