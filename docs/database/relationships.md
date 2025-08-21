# KCT Ecosystem Database Relationships Documentation

## Overview

The KCT Ecosystem Admin Hub database is designed around an inventory management system for men's formal wear. The schema uses PostgreSQL with UUID primary keys and implements a flexible product-variant architecture that supports multiple types of variations (size, color, piece count).

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                            PRODUCTS                             │
├─────────────────────────────────────────────────────────────────┤
│ PK │ id                    │ UUID                               │
│    │ name                  │ TEXT (UNIQUE, NOT NULL)           │
│    │ description           │ TEXT                               │
│    │ category              │ TEXT (NOT NULL)                    │
│    │ stripe_price_id       │ TEXT (UNIQUE)                      │
│    │ has_size_variants     │ BOOLEAN (DEFAULT FALSE)           │
│    │ has_color_variants    │ BOOLEAN (DEFAULT FALSE)           │
│    │ has_piece_variants    │ BOOLEAN (DEFAULT FALSE)           │
│    │ default_low_stock_threshold │ INTEGER (DEFAULT 5)         │
│    │ created_at            │ TIMESTAMP WITH TIME ZONE          │
│    │ updated_at            │ TIMESTAMP WITH TIME ZONE          │
└─────────────────────────────────────────────────────────────────┘
                                   │
                                   │ 1:N
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                       PRODUCT_VARIANTS                          │
├─────────────────────────────────────────────────────────────────┤
│ PK │ id                    │ UUID                               │
│ FK │ product_id            │ UUID → products(id)                │
│    │ size                  │ TEXT                               │
│    │ color                 │ TEXT                               │
│    │ piece_count           │ INTEGER                            │
│    │ stock_quantity        │ INTEGER (DEFAULT 0)                │
│    │ low_stock_threshold   │ INTEGER                            │
│    │ is_available          │ BOOLEAN (DEFAULT TRUE)             │
│    │ stripe_price_id       │ TEXT (UNIQUE)                      │
│    │ created_at            │ TIMESTAMP WITH TIME ZONE          │
│    │ updated_at            │ TIMESTAMP WITH TIME ZONE          │
└─────────────────────────────────────────────────────────────────┘
```

## Relationship Details

### 1. Products to Product Variants (1:N)

**Relationship Type**: One-to-Many  
**Foreign Key**: `product_variants.product_id` → `products.id`  
**Cascade Behavior**: ON DELETE CASCADE  

**Description**: Each product can have multiple variants based on different combinations of size, color, and piece count. This relationship allows for flexible inventory management where:

- A single product (e.g., "Navy Suit") can have multiple variants
- Each variant tracks its own inventory levels independently  
- Variants can be individually enabled/disabled for availability
- Pricing can be set at both product and variant levels via Stripe integration

**Business Logic**:
- Products act as templates or categories
- Variants represent the actual sellable items
- Each variant combination must be unique per product
- Variants inherit default settings from their parent product

### 2. Variant Configuration Logic

The relationship between products and variants is governed by boolean flags in the products table:

- `has_size_variants`: Indicates if the product supports size variations
- `has_color_variants`: Indicates if the product supports color variations  
- `has_piece_variants`: Indicates if the product supports piece count variations

**Constraint Logic**:
```sql
CONSTRAINT product_variants_unique_combination 
  UNIQUE (product_id, size, color, piece_count)
```

This ensures that each combination of attributes is unique per product.

## Data Integrity Constraints

### Primary Key Constraints
- **products.id**: UUID primary key with automatic generation
- **product_variants.id**: UUID primary key with automatic generation

### Foreign Key Constraints
- **product_variants.product_id**: References products(id) with CASCADE DELETE
  - When a product is deleted, all its variants are automatically deleted
  - Maintains referential integrity across the relationship

### Unique Constraints
- **products.name**: Ensures product names are unique across the system
- **products.stripe_price_id**: Ensures Stripe price IDs are unique when present
- **product_variants.stripe_price_id**: Ensures variant-specific price IDs are unique
- **product_variants**: Composite unique constraint on (product_id, size, color, piece_count)

### Check Constraints
- **products.default_low_stock_threshold**: Must be >= 0
- **product_variants.stock_quantity**: Must be >= 0
- **product_variants.low_stock_threshold**: Must be >= 0 when present
- **product_variants.piece_count**: Must be > 0 when present

## Indexing Strategy

### Performance Indexes
- **idx_product_variants_product_id**: Optimizes JOIN operations between products and variants
- **idx_products_category**: Enables fast category-based product searches
- **idx_product_variants_stock_availability**: Optimizes inventory availability queries

### Business Logic Indexes
- **idx_product_variants_low_stock**: Supports low stock monitoring and alerts
- **idx_product_variants_size/color/piece_count**: Enables efficient variant attribute searches

### Integration Indexes  
- **idx_products_stripe_price_id**: Optimizes Stripe integration queries
- **idx_product_variants_stripe_price_id**: Supports variant-specific pricing lookups

## Database Views

### product_catalog View
Provides a comprehensive overview of products with aggregate variant information:
- Total variant count per product
- Count of available variants
- Total stock across all variants

### low_stock_alerts View  
Identifies products and variants that need restocking:
- Compares current stock to thresholds
- Includes both product-level and variant-level thresholds
- Filters for available variants only

### product_variants_detailed View
Denormalized view combining product and variant information:
- Eliminates need for JOINs in common queries
- Includes effective threshold calculations
- Provides complete audit trail information

## Referential Integrity Rules

### Cascade Operations
1. **DELETE CASCADE**: When a product is deleted, all associated variants are automatically removed
2. **UPDATE CASCADE**: Product ID changes would cascade to variants (though UUIDs typically don't change)

### Data Consistency Rules
1. **Variant Attributes**: Only variants with corresponding product flags should have non-null attribute values
2. **Stock Thresholds**: Variant-specific thresholds override product defaults when present
3. **Availability**: Variants can be individually disabled without affecting the parent product

## Business Rules Implementation

### Inventory Management
- Stock quantities are tracked at the variant level
- Each variant maintains its own availability status
- Low stock alerts use variant-specific thresholds when available, falling back to product defaults

### Variant Configuration
- Products define which types of variants are supported via boolean flags
- Actual variants implement these configurations with specific attribute values
- The unique constraint ensures no duplicate variant combinations per product

### Pricing Integration
- Both products and variants can have Stripe price IDs
- Variant-specific pricing takes precedence over product-level pricing
- Unique constraints prevent duplicate price ID assignments

## Query Patterns

### Common Relationships Queries

**Get all variants for a product:**
```sql
SELECT * FROM product_variants WHERE product_id = ?
```

**Get products with their variant counts:**
```sql
SELECT p.*, COUNT(pv.id) as variant_count 
FROM products p 
LEFT JOIN product_variants pv ON p.id = pv.product_id 
GROUP BY p.id
```

**Find low stock items:**
```sql
SELECT p.name, pv.* 
FROM products p 
JOIN product_variants pv ON p.id = pv.product_id 
WHERE pv.stock_quantity <= COALESCE(pv.low_stock_threshold, p.default_low_stock_threshold)
```

## Migration Considerations

### Schema Evolution
- The current schema supports additional variant attributes through ALTER TABLE operations
- New product categories can be added without schema changes
- Additional boolean flags for variant types can be added to the products table

### Data Migration
- When adding new variant types, existing products may need flag updates
- Bulk variant creation should respect the unique constraints
- Historical data preservation requires careful handling of CASCADE operations

## Security Considerations

### Access Patterns
- Product catalog queries typically JOIN both tables
- Inventory updates focus on the product_variants table
- Category-based access control can be implemented via the products.category field

### Data Protection
- UUID primary keys provide security through obscurity
- Stripe price IDs should be treated as sensitive integration data
- Audit timestamps support change tracking and compliance

## Performance Characteristics

### Read Performance
- Category browsing is optimized via dedicated index
- Variant lookups are fast due to the product_id index
- Low stock monitoring has dedicated composite indexes

### Write Performance  
- Trigger-based timestamp updates add minimal overhead
- UUID generation uses PostgreSQL's optimized gen_random_uuid()
- Constraint checking is optimized through strategic indexing

### Storage Efficiency
- Normalized design minimizes data duplication
- Boolean flags are storage-efficient for variant configuration
- UUID keys provide good distribution for sharding if needed