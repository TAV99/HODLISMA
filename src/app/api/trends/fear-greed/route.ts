import { NextResponse } from 'next/server';
import type { FearGreedData } from '@/lib/types';

const FNG_API_URL = 'https://api.alternative.me/fng/?limit=1';

interface FNGResponse {
    data: Array<{
        value: string;
        value_classification: string;
        timestamp: string;
    }>;
}

/**
 * GET /api/trends/fear-greed
 * Proxy to Alternative.me Fear & Greed Index
 */
export async function GET() {
    try {
        const response = await fetch(FNG_API_URL, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 300 },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Fear & Greed API Error [${response.status}]:`, errorText);

            return NextResponse.json(
                {
                    error: `Fear & Greed API error: ${response.status}`,
                    details: process.env.NODE_ENV === 'development' ? errorText : undefined
                },
                { status: response.status >= 500 ? 502 : response.status }
            );
        }

        const fngData: FNGResponse = await response.json();

        if (!fngData.data || fngData.data.length === 0) {
            return NextResponse.json(
                { error: 'No Fear & Greed data available' },
                { status: 404 }
            );
        }

        const raw = fngData.data[0];
        const data: FearGreedData = {
            value: Number(raw.value),
            classification: raw.value_classification,
            timestamp: new Date(Number(raw.timestamp) * 1000).toISOString(),
        };

        return NextResponse.json(data, {
            status: 200,
            headers: {
                'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
            },
        });

    } catch (error) {
        console.error('Unexpected error in /api/trends/fear-greed:', error);

        return NextResponse.json(
            {
                error: 'Failed to fetch Fear & Greed data',
                details: process.env.NODE_ENV === 'development'
                    ? (error instanceof Error ? error.message : 'Unknown error')
                    : undefined
            },
            { status: 500 }
        );
    }
}
