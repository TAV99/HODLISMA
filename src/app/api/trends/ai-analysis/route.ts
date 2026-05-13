import { NextResponse } from 'next/server';
import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import type { Asset, CoinListing } from '@/lib/types';

export const maxDuration = 60;

const systemPrompt = `You are an expert crypto portfolio analyst. Analyze the user's portfolio and market data, then provide a concise report in markdown format with these sections:

## Portfolio Allocation Assessment
Evaluate diversification, concentration risk, and allocation quality.

## Risk Score
Rate the portfolio risk from 1 (very conservative) to 10 (extremely risky). Explain why.

## Rebalance Suggestions
Provide 2-3 actionable suggestions to improve the portfolio.

## Market Sentiment Summary
Based on the provided market data, summarize current market conditions and how they affect this portfolio.

Be data-driven, concise, and actionable. Use numbers from the provided data.`;

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const portfolio: Asset[] | undefined = body.portfolio;
        const marketData: CoinListing[] | undefined = body.marketData;

        if (!portfolio || !Array.isArray(portfolio) || portfolio.length === 0) {
            return NextResponse.json(
                { error: 'Missing or empty portfolio data' },
                { status: 400 },
            );
        }

        if (!marketData || !Array.isArray(marketData)) {
            return NextResponse.json(
                { error: 'Missing market data' },
                { status: 400 },
            );
        }

        const userMessage = `Here is my crypto portfolio:
${JSON.stringify(portfolio, null, 2)}

Current market data for top coins:
${JSON.stringify(marketData, null, 2)}

Please analyze my portfolio and provide your assessment.`;

        const result = await streamText({
            model: google('gemini-2.5-flash'),
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage },
            ],
            maxTokens: 4096,
        });

        return result.toDataStreamResponse();
    } catch (error) {
        console.error('Error in /api/trends/ai-analysis:', error);
        return NextResponse.json(
            { error: 'AI analysis failed' },
            { status: 500 },
        );
    }
}
