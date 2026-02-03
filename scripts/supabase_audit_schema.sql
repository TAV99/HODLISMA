-- ============================================
-- AUDIT LOGS TABLE
-- Unified logging for Crypto and Finance modules
-- ============================================

-- Create enum types
CREATE TYPE audit_module AS ENUM ('CRYPTO', 'FINANCE', 'SYSTEM');
CREATE TYPE audit_trigger AS ENUM ('USER_MANUAL', 'AI_TRINITY');

-- Main audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Classification
    module audit_module NOT NULL,
    action VARCHAR(100) NOT NULL,
    
    -- Entity tracking
    entity_type VARCHAR(50) NOT NULL,  -- 'asset', 'transaction', 'category', etc.
    entity_id UUID,                     -- ID of affected record
    
    -- Change data
    old_data JSONB,                     -- State before change
    new_data JSONB,                     -- State after change
    
    -- Metadata
    triggered_by audit_trigger NOT NULL DEFAULT 'USER_MANUAL',
    description TEXT,                   -- Human-readable summary
    ip_address INET,                    -- Optional: for security tracking
    user_agent TEXT,                    -- Optional: browser/device info
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for common queries
CREATE INDEX idx_audit_logs_module ON audit_logs(module);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_triggered_by ON audit_logs(triggered_by);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Composite index for filtering by module + time range
CREATE INDEX idx_audit_logs_module_time ON audit_logs(module, created_at DESC);

-- ============================================
-- HELPER FUNCTION: Insert audit log
-- ============================================
CREATE OR REPLACE FUNCTION log_audit(
    p_module audit_module,
    p_action VARCHAR(100),
    p_entity_type VARCHAR(50),
    p_entity_id UUID DEFAULT NULL,
    p_old_data JSONB DEFAULT NULL,
    p_new_data JSONB DEFAULT NULL,
    p_triggered_by audit_trigger DEFAULT 'USER_MANUAL',
    p_description TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_log_id UUID;
BEGIN
    INSERT INTO audit_logs (
        module, action, entity_type, entity_id,
        old_data, new_data, triggered_by, description
    ) VALUES (
        p_module, p_action, p_entity_type, p_entity_id,
        p_old_data, p_new_data, p_triggered_by, p_description
    )
    RETURNING id INTO new_log_id;
    
    RETURN new_log_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VIEW: Recent audit logs with summary
-- ============================================
CREATE OR REPLACE VIEW recent_audit_logs AS
SELECT 
    id,
    module,
    action,
    entity_type,
    entity_id,
    triggered_by,
    description,
    CASE 
        WHEN old_data IS NULL THEN 'CREATE'
        WHEN new_data IS NULL THEN 'DELETE'
        ELSE 'UPDATE'
    END as change_type,
    created_at
FROM audit_logs
ORDER BY created_at DESC
LIMIT 100;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE audit_logs IS 'Unified audit logging for all modules';
COMMENT ON COLUMN audit_logs.module IS 'CRYPTO, FINANCE, or SYSTEM';
COMMENT ON COLUMN audit_logs.action IS 'Specific action like ADD_ASSET, DELETE_TRANSACTION';
COMMENT ON COLUMN audit_logs.old_data IS 'JSON snapshot before change (for rollback)';
COMMENT ON COLUMN audit_logs.new_data IS 'JSON snapshot after change';
COMMENT ON COLUMN audit_logs.triggered_by IS 'USER_MANUAL or AI_TRINITY';
