CREATE TABLE wedding_outfit_coordination (
    id SERIAL PRIMARY KEY,
    wedding_id INTEGER NOT NULL,
    coordination_data JSONB NOT NULL,
    style_analysis JSONB,
    color_harmony_score INTEGER,
    style_consistency_score INTEGER,
    budget_analysis JSONB,
    recommendations JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);