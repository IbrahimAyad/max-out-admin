-- Migration: unified_authentication_system_v1
-- Created at: 1755549769

-- Migration: unified_authentication_system_v1
-- Purpose: Add fields to user_profiles for unified authentication across wedding portals

-- Add fields to user_profiles for cross-portal session management
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS last_portal_accessed TEXT,
ADD COLUMN IF NOT EXISTS portal_context JSONB,
ADD COLUMN IF NOT EXISTS cross_portal_session_data JSONB,
ADD COLUMN IF NOT EXISTS unified_auth_enabled BOOLEAN DEFAULT TRUE;

-- Create table for invitation code mapping
CREATE TABLE IF NOT EXISTS invitation_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invite_code TEXT UNIQUE NOT NULL,
    wedding_id UUID REFERENCES weddings(id) ON DELETE CASCADE,
    party_member_id UUID REFERENCES wedding_party_members(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(user_id),
    status TEXT DEFAULT 'active', -- active, used, expired
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_invitation_codes_code ON invitation_codes(invite_code);
CREATE INDEX IF NOT EXISTS idx_invitation_codes_user ON invitation_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_invitation_codes_status ON invitation_codes(status);

-- Create table for authentication sessions across portals
CREATE TABLE IF NOT EXISTS cross_portal_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    portal_access_levels JSONB NOT NULL,
    session_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Create indexes for session management
CREATE INDEX IF NOT EXISTS idx_cross_portal_sessions_user ON cross_portal_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_cross_portal_sessions_token ON cross_portal_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_cross_portal_sessions_expires ON cross_portal_sessions(expires_at);

-- Create table for migration tracking
CREATE TABLE IF NOT EXISTS account_migrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_portal TEXT NOT NULL, -- 'couples_portal', 'groomsmen_portal', 'admin_portal'
    source_account_id TEXT,
    target_user_id UUID REFERENCES user_profiles(user_id) ON DELETE SET NULL,
    migration_status TEXT DEFAULT 'pending', -- pending, completed, failed
    migration_data JSONB,
    error_details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for migration tracking
CREATE INDEX IF NOT EXISTS idx_account_migrations_source ON account_migrations(source_portal);
CREATE INDEX IF NOT EXISTS idx_account_migrations_target ON account_migrations(target_user_id);
CREATE INDEX IF NOT EXISTS idx_account_migrations_status ON account_migrations(migration_status);

-- Update user_profiles with additional wedding-related fields if not already present
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS is_wedding_customer BOOLEAN DEFAULT FALSE;

-- Enable RLS on new tables
ALTER TABLE invitation_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cross_portal_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_migrations ENABLE ROW LEVEL SECURITY;

-- RLS policies for invitation_codes
CREATE POLICY "Users can view their own invitation codes" ON invitation_codes FOR SELECT USING (
  user_id = auth.uid()
);

CREATE POLICY "Admin access to invitation codes" ON invitation_codes FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

-- RLS policies for cross_portal_sessions
CREATE POLICY "Users can manage their own sessions" ON cross_portal_sessions FOR ALL USING (
  user_id = auth.uid()
);

CREATE POLICY "Admin access to all sessions" ON cross_portal_sessions FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

-- RLS policies for account_migrations (admin only)
CREATE POLICY "Admin access to migrations" ON account_migrations FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

-- Create function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM cross_portal_sessions 
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to generate unique invitation codes
CREATE OR REPLACE FUNCTION generate_invitation_code()
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    exists BOOLEAN := TRUE;
BEGIN
    WHILE exists LOOP
        code := substr(md5(random()::text), 1, 12);
        SELECT EXISTS(SELECT 1 FROM invitation_codes WHERE invite_code = code) INTO exists;
    END LOOP;
    
    RETURN upper(code);
END;
$$ LANGUAGE plpgsql;;