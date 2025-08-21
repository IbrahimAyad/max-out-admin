-- Migration: extend_variant_types_for_fashion
-- Created at: 1755743548

-- Extend variant_type constraint to support all fashion categories
ALTER TABLE enhanced_product_variants 
DROP CONSTRAINT enhanced_product_variants_variant_type_check;

ALTER TABLE enhanced_product_variants 
ADD CONSTRAINT enhanced_product_variants_variant_type_check 
CHECK (variant_type IN (
  'suit_2piece',
  'suit_3piece', 
  'shirt_slim',
  'shirt_classic',
  'color_only',
  'blazer_single',
  'blazer_double',
  'tuxedo_single',
  'tuxedo_double',
  'tuxedo_tailcoat',
  'accessory_sized',
  'accessory_onesize',
  'pants_formal',
  'vest_formal'
));;