-- Migration: enhance_style_profiles_schema
-- Created at: 1755529013

-- Enhance style_profiles table for comprehensive style system
ALTER TABLE style_profiles 
ADD COLUMN IF NOT EXISTS user_profile_id UUID,
ADD COLUMN IF NOT EXISTS lifestyle_preferences JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS occasion_preferences JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS budget_preferences JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS brand_preferences JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS fabric_preferences JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS pattern_preferences JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS style_goals JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS inspiration_sources JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS seasonal_preferences JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS recommendation_history JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS last_style_update TIMESTAMPTZ DEFAULT NOW();

-- Create comprehensive menswear measurements table
CREATE TABLE IF NOT EXISTS menswear_measurements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_profile_id UUID NOT NULL,
    
    -- Standard Suit Measurements
    suit_size VARCHAR(10), -- 38S, 40R, 42L, etc.
    chest DECIMAL(5,2), -- inches
    waist DECIMAL(5,2),
    inseam DECIMAL(5,2),
    sleeve DECIMAL(5,2),
    neck DECIMAL(5,2),
    shoulder_width DECIMAL(5,2),
    jacket_length DECIMAL(5,2),
    trouser_rise DECIMAL(5,2),
    
    -- Physical Measurements
    height INTEGER, -- inches
    weight INTEGER, -- pounds
    shoe_size DECIMAL(4,1),
    
    -- Additional Measurements
    hips DECIMAL(5,2),
    thigh DECIMAL(5,2),
    bicep DECIMAL(5,2),
    forearm DECIMAL(5,2),
    wrist DECIMAL(5,2),
    
    -- Preferences & Fit
    preferred_fit VARCHAR(20) DEFAULT 'regular', -- slim/regular/relaxed
    measurement_unit VARCHAR(10) DEFAULT 'imperial', -- imperial/metric
    notes TEXT,
    
    -- Tracking
    last_measured DATE,
    measured_by VARCHAR(20) DEFAULT 'self', -- self/professional
    measurement_accuracy VARCHAR(20) DEFAULT 'estimated', -- estimated/professional/tailored
    
    -- System
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);;