// ============================================
// CryptoVibe Dashboard - TypeScript Interfaces
// ============================================

/**
 * Asset entity - Represents a crypto holding in the portfolio
 */
export interface Asset {
    id: string;
    symbol: string;
    name: string | null;
    quantity: number;
    buy_price: number;
    created_at: string;
}

/**
 * Form input for creating/updating an asset
 */
export interface AssetInput {
    symbol: string;
    name?: string;
    quantity: number;
    buy_price: number;
}

/**
 * Market data for a single cryptocurrency
 */
export interface MarketData {
    symbol: string;
    price: number;
    percent_change_24h: number;
    percent_change_7d: number;
    market_cap: number;
    last_updated: string;
}

/**
 * Combined asset with market data for display
 */
export interface AssetWithMarketData extends Asset {
    current_price: number;
    percent_change_24h: number;
    total_value: number;
    pnl: number;
    pnl_percent: number;
}

/**
 * Portfolio summary statistics
 */
export interface PortfolioSummary {
    total_balance: number;
    total_invested: number;
    total_pnl: number;
    total_pnl_percent: number;
    asset_count: number;
}

/**
 * API response from CoinMarketCap proxy
 */
export interface MarketPriceResponse {
    [symbol: string]: MarketData;
}

/**
 * API error response
 */
export interface ApiError {
    message: string;
    status?: number;
}
