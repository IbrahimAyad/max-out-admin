CREATE TABLE wedding_party_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wedding_id UUID REFERENCES weddings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(user_id),
    role TEXT NOT NULL,
    invite_status TEXT DEFAULT 'pending',
    measurements JSONB,
    outfit_assigned JSONB,
    fitting_scheduled TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);