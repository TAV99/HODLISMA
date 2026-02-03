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
