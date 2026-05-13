import { tool } from 'ai';
import { z } from 'zod';

interface GeminiPart {
    text?: string;
}

interface GeminiGroundingChunk {
    web?: { title?: string; uri?: string };
}

interface GeminiResponse {
    candidates?: Array<{
        content?: { parts?: GeminiPart[] };
        groundingMetadata?: { groundingChunks?: GeminiGroundingChunk[] };
    }>;
    error?: { message?: string };
}

async function searchWithGemini(query: string): Promise<{
    success: boolean;
    answer?: string;
    sources?: Array<{ title: string; url: string }>;
    message?: string;
}> {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
        return { success: false, message: 'Gemini API key chưa được cấu hình.' };
    }

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: query }] }],
                    tools: [{ googleSearch: {} }],
                }),
            }
        );

        if (!response.ok) {
            return { success: false, message: `Lỗi tìm kiếm: ${response.status}` };
        }

        const data: GeminiResponse = await response.json();

        if (data.error) {
            return { success: false, message: data.error.message || 'Lỗi Gemini API' };
        }

        const candidate = data.candidates?.[0];
        const text = candidate?.content?.parts
            ?.filter((p) => p.text)
            .map((p) => p.text)
            .join('\n') || '';

        const sources = (candidate?.groundingMetadata?.groundingChunks || [])
            .filter((c) => c.web?.uri)
            .slice(0, 5)
            .map((c) => ({
                title: c.web!.title || '',
                url: c.web!.uri || '',
            }));

        return { success: true, answer: text, sources };
    } catch (error) {
        console.error('searchWithGemini error:', error);
        return { success: false, message: 'Lỗi kết nối khi tìm kiếm.' };
    }
}

export function getExternalToolDefinitions() {
    return {
        webSearch: tool({
            description: 'Tìm kiếm thông tin trên web qua Google. Dùng khi cần tin tức, giá, sự kiện, hoặc bất kỳ thông tin bên ngoài nào.',
            parameters: z.object({
                query: z.string().describe('Từ khóa tìm kiếm (VD: "Bitcoin ETF news today", "lãi suất ngân hàng 2026")'),
            }),
            execute: async ({ query }) => searchWithGemini(query),
        }),

        getCryptoNews: tool({
            description: 'Lấy tin tức crypto mới nhất. Có thể lọc theo coin cụ thể.',
            parameters: z.object({
                symbol: z.string().optional().describe('Mã coin để lọc tin (VD: BTC, ETH). Bỏ trống để lấy tin chung.'),
            }),
            execute: async ({ symbol }) => {
                const query = symbol
                    ? `${symbol.toUpperCase()} cryptocurrency latest news today`
                    : 'cryptocurrency market latest news today';
                return searchWithGemini(query);
            },
        }),
    };
}
