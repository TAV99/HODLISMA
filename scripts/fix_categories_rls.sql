-- ============================================
-- JOB-046: Fix RLS for finance_categories
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Drop existing policy if exists (ignore error if not exists)
DROP POLICY IF EXISTS "Allow public read for categories" ON finance_categories;

-- Step 2: Create proper RLS policy for anonymous read access
CREATE POLICY "Enable read access for all users" 
ON finance_categories FOR SELECT
USING (true);

-- Step 3: Check if table has data, if not insert defaults
INSERT INTO finance_categories (name, type, icon, color) 
SELECT * FROM (VALUES
    ('Lương', 'income', 'banknote', '#22c55e'),
    ('Thưởng', 'income', 'gift', '#10b981'),
    ('Đầu tư', 'income', 'trending-up', '#06b6d4'),
    ('Freelance', 'income', 'laptop', '#8b5cf6'),
    ('Khác', 'income', 'plus-circle', '#6366f1'),
    ('Ăn uống', 'expense', 'utensils', '#f97316'),
    ('Di chuyển', 'expense', 'car', '#eab308'),
    ('Mua sắm', 'expense', 'shopping-bag', '#ec4899'),
    ('Giải trí', 'expense', 'gamepad-2', '#a855f7'),
    ('Hóa đơn', 'expense', 'file-text', '#ef4444'),
    ('Sức khỏe', 'expense', 'heart-pulse', '#14b8a6'),
    ('Giáo dục', 'expense', 'book-open', '#3b82f6'),
    ('Khác', 'expense', 'more-horizontal', '#64748b')
) AS t(name, type, icon, color)
WHERE NOT EXISTS (SELECT 1 FROM finance_categories LIMIT 1);

-- Step 4: Verify (run separately to see results)
-- SELECT id, name, type FROM finance_categories ORDER BY type, name;
