import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { NextRequest } from 'next/server';

export const maxDuration = 30;

// Configure OpenRouter as OpenAI-compatible provider
const openrouter = createOpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
    headers: {
        'HTTP-Referer': 'https://hodlisma.vercel.app', // Required for free tier
        'X-Title': 'HODLISMA Portfolio',
    },
});

export async function POST(req: Request) {
    try {
        const { messages, portfolioContext } = await req.json();

        const systemPrompt = `You are HODLISMA AI, a specialist in crypto portfolio analysis.
    Current Portfolio Data: ${JSON.stringify(portfolioContext)}
    Task: Provide sharp, data-driven financial advice based on the context.
    Style: Professional, elite, and concise.`;

        const result = await streamText({
            model: openrouter('arcee-ai/trinity-large-preview:free'),
            messages: [
                { role: 'system', content: systemPrompt },
                ...messages,
            ],
        });

        return result.toDataStreamResponse();
    } catch (error) {
        console.error("OpenRouter Error:", error);
        return new Response(JSON.stringify({ error: "AI Agent is currently busy. Please try again." }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
