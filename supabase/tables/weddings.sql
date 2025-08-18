CREATE TABLE weddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    primary_customer_id UUID REFERENCES user_profiles(user_id),
    wedding_date DATE,
    venue_name TEXT,
    venue_address JSONB,
    party_size INTEGER DEFAULT 0,
    status TEXT DEFAULT 'planning',
    budget_range TEXT,
    style_preferences JSONB,
    special_requests TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);