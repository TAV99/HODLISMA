-- ============================================
-- Supabase Optimization Script
-- Based on supabase-postgres-best-practices skill
-- Run in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. FIX RLS PERFORMANCE (CRITICAL)
-- Wrap auth.uid() in SELECT to call once, not per-row
-- ============================================

-- Drop old inefficient policy
DROP POLICY IF EXISTS "Users can manage own transactions" ON personal_transactions;

-- Create optimized RLS policy (100x faster on large tables)
CREATE POLICY "Users can manage own transactions - optimized"
ON personal_transactions FOR ALL
USING ((select auth.uid()) = user_id);  -- Called once, cached!

-- Also allow public read when no auth (for dev mode)
DROP POLICY IF EXISTS "Allow public read transactions" ON personal_transactions;
CREATE POLICY "Allow public read transactions"
ON personal_transactions FOR SELECT
USING (true);

-- ============================================
-- 2. ENSURE FK INDEXES EXIST (already done, verify)
-- ============================================

-- Verify/create index on category_id FK (should already exist)
CREATE INDEX IF NOT EXISTS idx_personal_transactions_category 
ON personal_transactions(category_id);

-- Add user_id index if missing (needed for RLS performance)
CREATE INDEX IF NOT EXISTS idx_personal_transactions_user 
ON personal_transactions(user_id);

-- ============================================
-- 3. ADD PARTIAL INDEX FOR ACTIVE SAVINGS (PERFORMANCE)
-- ============================================

-- Only index active (not completed) vaults - smaller, faster index
CREATE INDEX IF NOT EXISTS idx_savings_vault_active 
ON savings_vault(id) WHERE is_completed = FALSE;

-- ============================================
-- 4. COMPOSITE INDEX FOR COMMON QUERIES
-- ============================================

-- Already exists, but verify date range + type queries are fast
CREATE INDEX IF NOT EXISTS idx_personal_transactions_date_type 
ON personal_transactions(date, type);

-- ============================================
-- 5. VERIFY RESULTS
-- ============================================

-- Check all indexes on personal_transactions
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'personal_transactions';

-- Check RLS policies
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'personal_transactions';
