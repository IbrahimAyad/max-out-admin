-- Migration: clean_and_fix_suit_sizing
-- Created at: 1755744053

-- First, completely clean existing suit/blazer/tuxedo variants
DELETE FROM enhanced_product_variants 
WHERE variant_type IN ('suit_2piece', 'suit_3piece', 'blazer_single', 'blazer_double', 'tuxedo_single', 'tuxedo_double')
OR sku LIKE 'BLZ-%' OR sku LIKE 'TUX-%' OR sku LIKE 'SUIT-%' OR sku LIKE 'DB-%' OR sku LIKE 'STR-%' OR sku LIKE 'FORM-%';;