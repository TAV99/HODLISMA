import { NextRequest, NextResponse } from 'next/server';
import type { MarketData, MarketPriceResponse } from '@/lib/types';

// CoinMarketCap API endpoint
const CMC_API_URL = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest';

// Cache configuration: revalidate every 60 seconds
export const revalidate = 60;

/**
 * CMC API Response Types (partial, only what we need)
 */
interface CMCQuote {
    price: number;
    percent_change_24h: number;
    percent_change_7d: number;
    market_cap: number;
    last_updated: string;
}

interface CMCCryptoData {
    id: number;
    name: string;
    symbol: string;
    quote: {
        USD: CMCQuote;
    };
}

interface CMCResponse {
    status: {
        error_code: number;
        error_message: string | null;
    };
    data: {
        [symbol: string]: CMCCryptoData;
    };
}

/**
 * GET /api/crypto?symbol=BTC,ETH,DOGE
 * Fetches latest cryptocurrency prices from CoinMarketCap
 */
export async function GET(request: NextRequest) {
    try {
        // 1. Extract and validate symbol parameter
        const { searchParams } = new URL(request.url);
        const symbol = searchParams.get('symbol');

        if (!symbol || symbol.trim() === '') {
            return NextResponse.json(
                { error: 'Missing required parameter: symbol' },
                { status: 400 }
            );
        }

        // 2. Validate API key exists
        const apiKey = process.env.CMC_PRO_API_KEY;
        if (!apiKey) {
            console.error('CMC_PRO_API_KEY is not configured');
            return NextResponse.json(
                { error: 'Server configuration error: API key not found' },
                { status: 500 }
            );
        }

        // 3. Fetch data from CoinMarketCap
        const response = await fetch(
            `${CMC_API_URL}?symbol=${encodeURIComponent(symbol.toUpperCase())}`,
            {
                method: 'GET',
                headers: {
                    'X-CMC_PRO_API_KEY': apiKey,
                    'Accept': 'application/json',
                },
                // Next.js caching
                next: { revalidate: 60 },
            }
        );

        // 4. Handle CMC API errors
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`CMC API Error [${response.status}]:`, errorText);

            // Map common error codes to user-friendly messages
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

        // 5. Parse and validate response
        const cmcData: CMCResponse = await response.json();

        if (cmcData.status.error_code !== 0) {
            console.error('CMC API returned error:', cmcData.status.error_message);
            return NextResponse.json(
                { error: cmcData.status.error_message || 'Unknown CMC error' },
                { status: 400 }
            );
        }

        // 6. Transform data to lightweight response
        const transformedData: MarketPriceResponse = {};

        for (const [sym, crypto] of Object.entries(cmcData.data)) {
            const quote = crypto.quote.USD;

            transformedData[sym] = {
                symbol: sym,
                price: quote.price,
                percent_change_24h: quote.percent_change_24h,
                percent_change_7d: quote.percent_change_7d,
                market_cap: quote.market_cap,
                last_updated: quote.last_updated,
            } satisfies MarketData;
        }

        // 7. Return successful response with cache headers
        return NextResponse.json(transformedData, {
            status: 200,
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
            },
        });

    } catch (error) {
        // Handle network errors and unexpected exceptions
        console.error('Unexpected error in /api/crypto:', error);

        return NextResponse.json(
            {
                error: 'Failed to fetch cryptocurrency data',
                details: process.env.NODE_ENV === 'development'
                    ? (error instanceof Error ? error.message : 'Unknown error')
                    : undefined
            },
            { status: 500 }
        );
    }
}
