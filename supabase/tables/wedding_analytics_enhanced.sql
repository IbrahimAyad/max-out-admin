CREATE TABLE wedding_analytics_enhanced (
    id SERIAL PRIMARY KEY,
    wedding_id INTEGER NOT NULL,
    analysis_type VARCHAR(100) NOT NULL,
    analysis_data JSONB,
    insights TEXT[],
    recommendations TEXT[],
    confidence_score INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    party_member_id UUID
);