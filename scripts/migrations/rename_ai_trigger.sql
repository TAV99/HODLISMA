-- ============================================
-- MIGRATION: Rename AI_TRINITY to AI_HODLISMA
-- Run this on your Supabase database if you
-- have already deployed the audit_logs table
-- ============================================
-- ⚠️ IMPORTANT: Run in TWO SEPARATE steps!

-- ============================================
-- STEP 1: Add the new enum value (run FIRST)
-- ============================================
ALTER TYPE audit_trigger ADD VALUE IF NOT EXISTS 'AI_HODLISMA';

-- ============================================
-- STEP 2: Update records (run AFTER Step 1)
-- ============================================
-- Run this in a SEPARATE query execution after Step 1 completes!

UPDATE audit_logs 
SET triggered_by = 'AI_HODLISMA'::audit_trigger 
WHERE triggered_by = 'AI_TRINITY'::audit_trigger;

COMMENT ON COLUMN audit_logs.triggered_by IS 'USER_MANUAL or AI_HODLISMA';

-- Note: PostgreSQL doesn't allow removing enum values directly.
-- The old 'AI_TRINITY' value will remain in the enum but won't be used.
-- This is safe and won't affect your application.
