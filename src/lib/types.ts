// ============================================
// CryptoVibe Dashboard - TypeScript Interfaces
// ============================================

export type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

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

// ============================================
// Personal Finance - TypeScript Interfaces
// ============================================

/**
 * Finance category types
 */
export type FinanceCategoryType = 'income' | 'expense';
export type TransactionType = 'income' | 'expense' | 'investment';

/**
 * Finance category entity
 */
export interface FinanceCategory {
    id: string;
    name: string;
    type: FinanceCategoryType;
    icon: string;
    color: string;
    created_at: string;
}

/**
 * Personal transaction entity
 */
export interface PersonalTransaction {
    id: string;
    user_id: string;
    category_id: string | null;
    amount: number;
    date: string;
    note: string | null;
    type: TransactionType;
    created_at: string;
    // Joined data
    category?: FinanceCategory;
}

/**
 * Savings vault entity
 */
export interface SavingsVault {
    id: string;
    name: string;
    target_amount: number;
    current_amount: number;
    is_completed: boolean;
    created_at: string;
    completed_at: string | null;
}

/**
 * Monthly summary statistics
 */
export interface MonthlySummary {
    total_income: number;
    total_expense: number;
    total_investment: number;
    net_balance: number;
    transaction_count: number;
}

/**
 * Form input for creating/updating a transaction
 */
export interface TransactionInput {
    category_id?: string;
    amount: number;
    date: string;
    note?: string;
    type: TransactionType;
}

/**
 * Form input for creating/updating a savings vault
 */
export interface SavingsVaultInput {
    name: string;
    target_amount: number;
    current_amount?: number;
}

/**
 * Form input for creating a category
 */
export interface CategoryInput {
    name: string;
    type: FinanceCategoryType;
    icon?: string;
    color?: string;
}

// ============================================
// Market Trends - TypeScript Interfaces
// ============================================

export interface CoinListing {
    id: number;
    name: string;
    symbol: string;
    cmc_rank: number;
    price: number;
    percent_change_24h: number;
    percent_change_7d: number;
    market_cap: number;
    volume_24h: number;
    last_updated: string;
}

export interface FearGreedData {
    value: number;
    classification: string;
    timestamp: string;
}

export interface BenchmarkPoint {
    date: string;
    portfolio: number;
    btc: number;
    eth: number;
}

export interface WatchlistItem {
    id: string;
    user_id: string;
    symbol: string;
    name: string;
    added_at: string;
}

export interface PriceAlert {
    id: string;
    user_id: string;
    symbol: string;
    condition: 'above' | 'below';
    target_price: number;
    is_triggered: boolean;
    triggered_at: string | null;
    created_at: string;
}
