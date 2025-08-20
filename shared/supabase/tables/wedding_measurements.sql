CREATE TABLE wedding_measurements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    party_member_id UUID REFERENCES wedding_party_members(id) ON DELETE CASCADE,
    measurements JSONB NOT NULL,
    measurement_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_by UUID REFERENCES user_profiles(user_id),
    notes TEXT
);