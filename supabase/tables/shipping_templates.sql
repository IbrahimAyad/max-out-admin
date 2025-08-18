CREATE TABLE shipping_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    template_code VARCHAR(100) UNIQUE NOT NULL,
    length_inches DECIMAL(8,2) NOT NULL,
    width_inches DECIMAL(8,2) NOT NULL,
    height_inches DECIMAL(8,2) NOT NULL,
    max_weight_lbs DECIMAL(8,2) NOT NULL,
    package_type VARCHAR(50) NOT NULL,
    description TEXT,
    recommended_for JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);