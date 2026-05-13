import { NextRequest, NextResponse } from 'next/server';
import type { CoinListing } from '@/lib/types';

const CMC_API_URL = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest';

interface CMCListingItem {
    id: number;
    name: string;
    symbol: string;
    cmc_rank: number;
    quote: {
        USD: {
            price: number;
            percent_change_24h: number;
            percent_change_7d: number;
            market_cap: number;
            volume_24h: number;
            last_updated: string;
        };
    };
}

interface CMCListingsResponse {
    status: {
        error_code: number;
        error_message: string | null;
    };
    data: CMCListingItem[];
}

/**
 * GET /api/trends/listings?start=1&limit=100
 * Paginated proxy to CoinMarketCap listings endpoint
 */
export async function GET(request: NextRequest) {
    try {
        const apiKey = process.env.CMC_PRO_API_KEY;
        if (!apiKey) {
            console.error('CMC_PRO_API_KEY is not configured');
            return NextResponse.json(
                { error: 'Server configuration error: API key not found' },
                { status: 500 }
            );
        }

        const { searchParams } = request.nextUrl;
        const start = Math.max(1, parseInt(searchParams.get('start') ?? '1', 10) || 1);
        const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') ?? '100', 10) || 100));

        const response = await fetch(
            `${CMC_API_URL}?start=${start}&limit=${limit}&convert=USD`,
            {
                method: 'GET',
                headers: {
                    'X-CMC_PRO_API_KEY': apiKey,
                    'Accept': 'application/json',
                },
                next: { revalidate: 60 },
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`CMC API Error [${response.status}]:`, errorText);

            const errorMessages: Record<number, string> = {
                401: 'Invalid API key. Please check your CMC_PRO_API_KEY.',
                402: 'Payment required. Your CMC subscription may have expired.',
                403: 'Access forbidden. API key may not have required permissions.',
                429: 'Rate limit exceeded. Please try again later.',
                500: 'CoinMarketCap server error. Please try again later.',
            };

            return NextResponse.json(
                {
                    error: errorMessages[response.status] || `CMC API error: ${response.status}`,
                    details: process.env.NODE_ENV === 'development' ? errorText : undefined
                },
                { status: response.status >= 500 ? 502 : response.status }
            );
        }

        const cmcData: CMCListingsResponse = await response.json();

        if (cmcData.status.error_code !== 0) {
            console.error('CMC API returned error:', cmcData.status.error_message);
            return NextResponse.json(
                { error: cmcData.status.error_message || 'Unknown CMC error' },
                { status: 400 }
            );
        }

        const data: CoinListing[] = cmcData.data.map((item) => ({
            id: item.id,
            name: item.name,
            symbol: item.symbol,
            cmc_rank: item.cmc_rank,
            price: item.quote.USD.price,
            percent_change_24h: item.quote.USD.percent_change_24h,
            percent_change_7d: item.quote.USD.percent_change_7d,
            market_cap: item.quote.USD.market_cap,
            volume_24h: item.quote.USD.volume_24h,
            last_updated: item.quote.USD.last_updated,
        }));

        const hasMore = data.length === limit;

        return NextResponse.json(
            { data, start, limit, hasMore },
            {
                status: 200,
                headers: {
                    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
                },
            }
        );

    } catch (error) {
        console.error('Unexpected error in /api/trends/listings:', error);

        return NextResponse.json(
            {
                error: 'Failed to fetch listings data',
                details: process.env.NODE_ENV === 'development'
                    ? (error instanceof Error ? error.message : 'Unknown error')
                    : undefined
            },
            { status: 500 }
        );
    }
}
