-- Migration: create_shipping_package_templates
-- Created at: 1755468517

-- Create shipping package templates table
CREATE TABLE IF NOT EXISTS shipping_package_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  template_code VARCHAR(100) NOT NULL UNIQUE,
  length_inches DECIMAL(8,2) NOT NULL,
  width_inches DECIMAL(8,2) NOT NULL,
  height_inches DECIMAL(8,2) NOT NULL,
  max_weight_lbs DECIMAL(8,2) NOT NULL,
  package_type VARCHAR(50) NOT NULL DEFAULT 'Box',
  description TEXT,
  recommended_for TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert the 11 KCT Menswear shipping templates
INSERT INTO shipping_package_templates (name, template_code, length_inches, width_inches, height_inches, max_weight_lbs, package_type, description, recommended_for) VALUES
('KCT Blazer Box', 'KCT_BLAZER_BOX', 24.00, 16.00, 3.00, 3.00, 'Box', 'Perfect for blazers and suit jackets', ARRAY['blazer', 'suit jacket', 'formal wear']),
('Big Big Box - 13 Suits', 'BIG_BIG_BOX_13_SUITS', 29.00, 17.00, 12.00, 46.00, 'Box', 'Large capacity box for multiple suits', ARRAY['multiple suits', 'bulk orders', 'formal sets']),
('big box 2', 'BIG_BOX_2', 30.00, 20.00, 14.00, 25.00, 'Box', 'Large box for multiple items', ARRAY['multiple items', 'large orders', 'bulk clothing']),
('Bowtie soft package', 'BOWTIE_SOFT_PACKAGE', 2.00, 1.00, 2.00, 0.06, 'Softpack', 'Small soft package for accessories', ARRAY['bowtie', 'tie', 'small accessories', 'jewelry']),
('Express - Small Box', 'EXPRESS_SMALL_BOX', 13.00, 11.00, 2.00, 1.00, 'Box', 'Small box for quick shipping', ARRAY['small items', 'accessories', 'express shipping']),
('FedEx Box', 'FEDEX_BOX', 17.00, 17.00, 7.00, 3.00, 'Box', 'Standard FedEx compatible box', ARRAY['standard items', 'general shipping', 'formal wear']),
('KCT Suit Set Box', 'KCT_SUIT_SET_BOX', 16.00, 16.00, 6.00, 3.00, 'Box', 'Standard box for suit sets', ARRAY['suit set', 'complete outfit', 'formal wear']),
('Shoe Box', 'SHOE_BOX', 13.00, 7.00, 5.00, 1.00, 'Box', 'Dedicated shoe packaging', ARRAY['shoes', 'footwear', 'dress shoes']),
('KCT Suit Set Box 2', 'KCT_SUIT_SET_BOX_2', 20.00, 20.00, 8.00, 2.00, 'Box', 'Larger suit set box', ARRAY['suit set', 'larger sizes', 'complete formal outfit']),
('Suspender', 'SUSPENDER_BOX', 10.80, 4.00, 10.00, 1.00, 'Box', 'Box for suspenders and similar accessories', ARRAY['suspenders', 'belts', 'accessories']),
('Vest Soft pack', 'VEST_SOFT_PACK', 11.00, 9.00, 1.00, 0.50, 'Softpack', 'Soft package for vests', ARRAY['vest', 'waistcoat', 'lightweight formal wear']);

-- Enable RLS (Row Level Security)
ALTER TABLE shipping_package_templates ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON shipping_package_templates
    FOR ALL USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT ALL ON shipping_package_templates TO authenticated;
GRANT ALL ON shipping_package_templates TO service_role;;