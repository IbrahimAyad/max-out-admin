-- Migration: create_comprehensive_indexes
-- Created at: 1755529014

-- Create comprehensive indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_customer_segment ON user_profiles(customer_segment);
CREATE INDEX IF NOT EXISTS idx_user_profiles_vip_status ON user_profiles(vip_status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_migrated_from ON user_profiles(migrated_from_customers_id);

CREATE INDEX IF NOT EXISTS idx_style_profiles_user_profile_id ON style_profiles(user_profile_id);
CREATE INDEX IF NOT EXISTS idx_style_profiles_body_type ON style_profiles(body_type);
CREATE INDEX IF NOT EXISTS idx_style_profiles_style_personality ON style_profiles(style_personality);

CREATE INDEX IF NOT EXISTS idx_menswear_measurements_user_profile_id ON menswear_measurements(user_profile_id);
CREATE INDEX IF NOT EXISTS idx_menswear_measurements_is_active ON menswear_measurements(is_active);
CREATE INDEX IF NOT EXISTS idx_menswear_measurements_suit_size ON menswear_measurements(suit_size);;