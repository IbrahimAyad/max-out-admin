// Inventory Management Types

export interface Product {
  id: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  sku?: string;
  handle?: string;
  base_price?: number;
  vendor?: string;
  product_type?: string;
  status?: string;
  visibility?: boolean;
  featured?: boolean;
  requires_shipping?: boolean;
  taxable?: boolean;
  track_inventory?: boolean;
  weight?: number;
  total_inventory?: number;
  primary_image?: string;
  variant_count?: number;
  in_stock?: boolean;
  image_gallery?: string[];
  stripe_product_id?: string;
  stripe_sync_status?: string;
  stripe_sync_error?: string;
  stripe_synced_at?: string;
  details?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  title: string;
  price?: number;
  compare_at_price?: number;
  cost_price?: number;
  sku?: string;
  barcode?: string;
  inventory_quantity?: number;
  allow_backorders?: boolean;
  weight?: number;
  size?: string; // Size field from enhanced_product_variants
  color?: string; // Color field from enhanced_product_variants
  option1?: string; // Size (legacy Shopify compatibility)
  option2?: string; // Color (legacy Shopify compatibility)
  option3?: string; // Piece count (2 or 3 for suits)
  available?: boolean;
  available_quantity?: number;
  reserved_quantity?: number;
  stock_quantity?: number;
  stripe_price_id?: string;
  stripe_active?: boolean;
  created_at: string;
  updated_at: string;
}

// Size constants for different product categories
export const SUIT_SIZES = [
  '34S', '34R',
  '36S', '36R',
  '38S', '38R', '38L',
  '40S', '40R', '40L',
  '42S', '42R', '42L',
  '44S', '44R', '44L',
  '46S', '46R', '46L',
  '48S', '48R', '48L',
  '50S', '50R', '50L',
  '52R', '52L',
  '54R', '54L'
];

export const SHIRT_SIZES = [
  '14.5', '15', '15.5', '16', '16.5', '17', '17.5', '18'
];

export const SUIT_COLORS = [
  'Navy', 'Beige', 'Black', 'Brown', 'Burgundy', 'Charcoal Grey',
  'Dark Brown', 'Emerald', 'Hunter Green', 'Indigo', 'Light Grey',
  'Midnight Blue', 'Sand', 'Tan'
];

// Inventory management component props and state types
export interface InventoryManagementProps {
  // Add props as needed
}

export interface ProductWithVariants extends Product {
  variants: ProductVariant[];
}

export interface InventoryFilters {
  category?: string;
  subcategory?: string;
  search?: string;
  size?: string;
  color?: string;
  stockStatus?: 'all' | 'in-stock' | 'low-stock' | 'out-of-stock';
}

// Size matrix view types
export interface SizeMatrixProps {
  product: ProductWithVariants;
  onStockUpdate: (variantId: string, newQuantity: number) => Promise<void>;
}

// Stock level threshold for visual indicators
export const LOW_STOCK_THRESHOLD = 5; // Default threshold
