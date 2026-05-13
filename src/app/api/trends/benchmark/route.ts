import { NextRequest, NextResponse } from 'next/server';
import type { BenchmarkPoint } from '@/lib/types';

const CMC_API_URL = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest';

type Range = '7d' | '30d' | '90d';

const RANGE_CONFIG: Record<Range, { points: number; daySpan: number }> = {
    '7d': { points: 7, daySpan: 7 },
    '30d': { points: 30, daySpan: 30 },
    '90d': { points: 15, daySpan: 90 },
};

function generateBenchmarkPoints(
    btcChange: number,
    ethChange: number,
    points: number,
    daySpan: number,
): BenchmarkPoint[] {
    const now = new Date();
    const result: BenchmarkPoint[] = [];

    // Portfolio is a simple average of BTC and ETH performance
    const portfolioChange = (btcChange + ethChange) / 2;

    for (let i = 0; i < points; i++) {
        const progress = i / (points - 1);
        const daysAgo = Math.round(daySpan * (1 - progress));
        const date = new Date(now);
        date.setDate(date.getDate() - daysAgo);

        result.push({
            date: date.toISOString().split('T')[0],
            portfolio: Math.round(portfolioChange * progress * 100) / 100,
            btc: Math.round(btcChange * progress * 100) / 100,
            eth: Math.round(ethChange * progress * 100) / 100,
        });
    }

    return result;
}

export async function GET(request: NextRequest) {
    try {
        const apiKey = process.env.CMC_PRO_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: 'Server configuration error: CMC API key not found' },
                { status: 500 },
            );
        }

        const { searchParams } = new URL(request.url);
        const range = (searchParams.get('range') || '7d') as Range;
        const config = RANGE_CONFIG[range];

        if (!config) {
            return NextResponse.json(
                { error: 'Invalid range. Use 7d, 30d, or 90d' },
                { status: 400 },
            );
        }

        const response = await fetch(
            `${CMC_API_URL}?symbol=BTC,ETH`,
            {
                headers: {
                    'X-CMC_PRO_API_KEY': apiKey,
                    'Accept': 'application/json',
                },
                next: { revalidate: 120 },
            },
        );

        if (!response.ok) {
            console.error(`CMC API error [${response.status}]`);
            return NextResponse.json(
                { error: 'Failed to fetch market data from CMC' },
                { status: 502 },
            );
        }

        const cmcData = await response.json();
        const btcQuote = cmcData.data?.BTC?.quote?.USD;
        const ethQuote = cmcData.data?.ETH?.quote?.USD;

        if (!btcQuote || !ethQuote) {
            return NextResponse.json(
                { error: 'Unexpected CMC response format' },
                { status: 502 },
            );
        }

        // Use percent_change_7d as base; approximate for longer ranges
        const btcChange7d: number = btcQuote.percent_change_7d ?? 0;
        const ethChange7d: number = ethQuote.percent_change_7d ?? 0;

        let btcChange: number;
        let ethChange: number;

        if (range === '7d') {
            btcChange = btcChange7d;
            ethChange = ethChange7d;
        } else if (range === '30d') {
            // Approximate: scale 7d change to 30d
            btcChange = btcChange7d * (30 / 7);
            ethChange = ethChange7d * (30 / 7);
        } else {
            // 90d: scale 7d change to 90d
            btcChange = btcChange7d * (90 / 7);
            ethChange = ethChange7d * (90 / 7);
        }

        const data = generateBenchmarkPoints(btcChange, ethChange, config.points, config.daySpan);

        return NextResponse.json({ data });
    } catch (error) {
        console.error('Error in /api/trends/benchmark:', error);
        return NextResponse.json(
            { error: 'Failed to generate benchmark data' },
            { status: 500 },
        );
    }
}
