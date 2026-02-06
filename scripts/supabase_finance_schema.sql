-- ============================================
-- JOB-023: Personal Finance Database Schema
-- Run this SQL in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. FINANCE CATEGORIES TABLE
-- Stores income/expense categories
-- ============================================
CREATE TABLE IF NOT EXISTS finance_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
    icon VARCHAR(50) DEFAULT 'circle',
    color VARCHAR(20) DEFAULT '#6366f1',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster type filtering
CREATE INDEX IF NOT EXISTS idx_finance_categories_type ON finance_categories(type);

-- Insert default categories
INSERT INTO finance_categories (name, type, icon, color) VALUES
    -- Income categories
    ('Lương', 'income', 'banknote', '#22c55e'),
    ('Thưởng', 'income', 'gift', '#10b981'),
    ('Đầu tư', 'income', 'trending-up', '#06b6d4'),
    ('Freelance', 'income', 'laptop', '#8b5cf6'),
    ('Khác', 'income', 'plus-circle', '#6366f1'),
    -- Expense categories
    ('Ăn uống', 'expense', 'utensils', '#f97316'),
    ('Di chuyển', 'expense', 'car', '#eab308'),
    ('Mua sắm', 'expense', 'shopping-bag', '#ec4899'),
    ('Giải trí', 'expense', 'gamepad-2', '#a855f7'),
    ('Hóa đơn', 'expense', 'file-text', '#ef4444'),
    ('Sức khỏe', 'expense', 'heart-pulse', '#14b8a6'),
    ('Giáo dục', 'expense', 'book-open', '#3b82f6'),
    ('Khác', 'expense', 'more-horizontal', '#64748b')
ON CONFLICT DO NOTHING;

-- ============================================
-- 2. PERSONAL TRANSACTIONS TABLE
-- Stores all income/expense/investment transactions
-- ============================================
CREATE TABLE IF NOT EXISTS personal_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID DEFAULT gen_random_uuid(), -- For future auth integration
    category_id UUID REFERENCES finance_categories(id) ON DELETE SET NULL,
    amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    note TEXT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'investment')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_personal_transactions_date ON personal_transactions(date);
CREATE INDEX IF NOT EXISTS idx_personal_transactions_type ON personal_transactions(type);
CREATE INDEX IF NOT EXISTS idx_personal_transactions_user ON personal_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_transactions_category ON personal_transactions(category_id);

-- Composite index for monthly summary queries
CREATE INDEX IF NOT EXISTS idx_personal_transactions_monthly 
ON personal_transactions(user_id, date, type);

-- ============================================
-- 3. SAVINGS VAULT TABLE
-- Stores savings goals and progress
-- ============================================
CREATE TABLE IF NOT EXISTS savings_vault (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    target_amount DECIMAL(15, 2) NOT NULL CHECK (target_amount > 0),
    current_amount DECIMAL(15, 2) DEFAULT 0 CHECK (current_amount >= 0),
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Add index for active vaults
CREATE INDEX IF NOT EXISTS idx_savings_vault_completed ON savings_vault(is_completed);

-- ============================================
-- 4. ROW LEVEL SECURITY (Optional - for future auth)
-- ============================================
-- Uncomment these when implementing authentication

ALTER TABLE finance_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_vault ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read for categories"
ON finance_categories FOR SELECT
USING (true);

CREATE POLICY "Users can manage own transactions"
ON personal_transactions FOR ALL
USING (auth.uid() = user_id);

-- ============================================
-- 5. HELPER FUNCTIONS
-- ============================================

-- Function to get monthly summary
CREATE OR REPLACE FUNCTION get_monthly_summary(
    p_user_id UUID,
    p_year INTEGER,
    p_month INTEGER
)
RETURNS TABLE (
    total_income DECIMAL,
    total_expense DECIMAL,
    total_investment DECIMAL,
    net_balance DECIMAL,
    transaction_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense,
        COALESCE(SUM(CASE WHEN type = 'investment' THEN amount ELSE 0 END), 0) as total_investment,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) as net_balance,
        COUNT(*) as transaction_count
    FROM personal_transactions
    WHERE user_id = p_user_id
    AND EXTRACT(YEAR FROM date) = p_year
    AND EXTRACT(MONTH FROM date) = p_month;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-complete savings vault
CREATE OR REPLACE FUNCTION check_savings_completion()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.current_amount >= NEW.target_amount AND NEW.is_completed = FALSE THEN
        NEW.is_completed := TRUE;
        NEW.completed_at := NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_savings_completion
BEFORE UPDATE ON savings_vault
FOR EACH ROW
EXECUTE FUNCTION check_savings_completion();
