# SQL Patterns and Examples for KCT Ecosystem Database

## Overview

This document provides practical SQL patterns, query examples, and best practices for working with the KCT Ecosystem inventory management database. All examples are optimized for PostgreSQL and take advantage of the established indexes and views.

## Table of Contents
1. [Basic CRUD Operations](#basic-crud-operations)
2. [Product Management Patterns](#product-management-patterns)
3. [Inventory Management Patterns](#inventory-management-patterns)
4. [Reporting and Analytics Patterns](#reporting-and-analytics-patterns)
5. [Performance Optimization Patterns](#performance-optimization-patterns)
6. [Data Integrity Patterns](#data-integrity-patterns)
7. [Stripe Integration Patterns](#stripe-integration-patterns)
8. [Common Anti-Patterns to Avoid](#common-anti-patterns-to-avoid)

## Basic CRUD Operations

### Creating Products

**Create a basic product:**
```sql
INSERT INTO products (
    name, 
    description, 
    category, 
    has_size_variants, 
    has_color_variants, 
    default_low_stock_threshold
) VALUES (
    'Premium Tuxedo',
    'Elegant black-tie formal tuxedo for special occasions',
    'suits',
    true,
    false,
    3
) RETURNING id, name, created_at;
```

**Create a product with Stripe integration:**
```sql
INSERT INTO products (
    name, 
    description, 
    category, 
    stripe_price_id,
    has_size_variants, 
    has_color_variants, 
    has_piece_variants
) VALUES (
    'Wedding Collection Suit',
    'Complete wedding suit collection',
    'suits',
    'price_1234567890',
    true,
    true,
    true
) RETURNING *;
```

### Creating Product Variants

**Create variants for a suit with size and piece variations:**
```sql
INSERT INTO product_variants (
    product_id, 
    size, 
    piece_count, 
    stock_quantity, 
    stripe_price_id
) VALUES 
    ((SELECT id FROM products WHERE name = 'Premium Tuxedo'), 'S', 2, 10, 'price_tux_s_2pc'),
    ((SELECT id FROM products WHERE name = 'Premium Tuxedo'), 'S', 3, 5, 'price_tux_s_3pc'),
    ((SELECT id FROM products WHERE name = 'Premium Tuxedo'), 'M', 2, 15, 'price_tux_m_2pc'),
    ((SELECT id FROM products WHERE name = 'Premium Tuxedo'), 'M', 3, 8, 'price_tux_m_3pc');
```

**Create color variants for ties:**
```sql
WITH tie_product AS (
    SELECT id FROM products WHERE name = 'Skinny Tie (2.75")'
)
INSERT INTO product_variants (product_id, color, stock_quantity) 
SELECT 
    tie_product.id,
    color_option,
    20 as initial_stock
FROM tie_product
CROSS JOIN (VALUES 
    ('Navy Blue'),
    ('Burgundy'),
    ('Forest Green'),
    ('Charcoal Gray'),
    ('Deep Purple')
) AS colors(color_option);
```

### Reading Data

**Get product with all variants:**
```sql
SELECT 
    p.name as product_name,
    p.category,
    p.description,
    pv.size,
    pv.color,
    pv.piece_count,
    pv.stock_quantity,
    pv.is_available
FROM products p
LEFT JOIN product_variants pv ON p.id = pv.product_id
WHERE p.name = 'Premium Tuxedo'
ORDER BY pv.size, pv.piece_count;
```

**Get available products with stock information:**
```sql
SELECT 
    p.name,
    p.category,
    COUNT(pv.id) as total_variants,
    COUNT(CASE WHEN pv.is_available THEN 1 END) as available_variants,
    SUM(pv.stock_quantity) as total_stock,
    MIN(pv.stock_quantity) as min_variant_stock
FROM products p
JOIN product_variants pv ON p.id = pv.product_id
GROUP BY p.id, p.name, p.category
HAVING COUNT(CASE WHEN pv.is_available THEN 1 END) > 0
ORDER BY p.category, p.name;
```

### Updating Data

**Update stock quantities:**
```sql
UPDATE product_variants 
SET stock_quantity = stock_quantity - 1,
    updated_at = NOW()
WHERE product_id = (SELECT id FROM products WHERE name = 'Navy Suit')
  AND size = 'L' 
  AND color = 'Navy' 
  AND piece_count = 2
  AND stock_quantity > 0
RETURNING stock_quantity, low_stock_threshold;
```

**Bulk update product category:**
```sql
UPDATE products 
SET category = 'formal_suits',
    updated_at = NOW()
WHERE category = 'suits' 
  AND name ILIKE '%tuxedo%'
RETURNING name, category;
```

### Deleting Data

**Safely delete a product (variants will cascade):**
```sql
-- First, check what will be deleted
SELECT 
    p.name,
    COUNT(pv.id) as variant_count,
    SUM(pv.stock_quantity) as total_stock
FROM products p
LEFT JOIN product_variants pv ON p.id = pv.product_id
WHERE p.name = 'Discontinued Suit'
GROUP BY p.id, p.name;

-- Then delete if confirmed
DELETE FROM products 
WHERE name = 'Discontinued Suit'
RETURNING name, category;
```

## Product Management Patterns

### Product Discovery

**Search products by category with availability:**
```sql
SELECT DISTINCT
    p.name,
    p.description,
    p.category,
    CASE 
        WHEN COUNT(pv.id) FILTER (WHERE pv.is_available AND pv.stock_quantity > 0) > 0 
        THEN 'In Stock' 
        ELSE 'Out of Stock' 
    END as availability_status
FROM products p
LEFT JOIN product_variants pv ON p.id = pv.product_id
WHERE p.category = 'suits'
GROUP BY p.id, p.name, p.description, p.category
ORDER BY p.name;
```

**Find products by variant attributes:**
```sql
-- Find all products available in Large size
SELECT DISTINCT 
    p.name,
    p.category,
    COUNT(pv.id) as large_variants
FROM products p
JOIN product_variants pv ON p.id = pv.product_id
WHERE pv.size = 'L' 
  AND pv.is_available = true
  AND pv.stock_quantity > 0
GROUP BY p.id, p.name, p.category
ORDER BY large_variants DESC;
```

**Filter products with specific variant combinations:**
```sql
-- Products available in Navy color with 3-piece options
SELECT 
    p.name,
    p.description,
    pv.size,
    pv.stock_quantity
FROM products p
JOIN product_variants pv ON p.id = pv.product_id
WHERE pv.color ILIKE '%navy%' 
  AND pv.piece_count = 3
  AND pv.is_available = true
  AND pv.stock_quantity > 0
ORDER BY p.category, p.name, pv.size;
```

### Product Catalog Management

**Generate full product catalog with pricing:**
```sql
SELECT 
    p.name as product_name,
    p.description,
    p.category,
    COALESCE(pv.stripe_price_id, p.stripe_price_id) as price_id,
    CONCAT_WS(' | ', 
        CASE WHEN pv.size IS NOT NULL THEN 'Size: ' || pv.size END,
        CASE WHEN pv.color IS NOT NULL THEN 'Color: ' || pv.color END,
        CASE WHEN pv.piece_count IS NOT NULL THEN pv.piece_count || '-piece' END
    ) as variant_description,
    pv.stock_quantity,
    pv.is_available
FROM products p
LEFT JOIN product_variants pv ON p.id = pv.product_id
WHERE p.category IN ('suits', 'shirts', 'ties')
ORDER BY p.category, p.name, pv.size, pv.color, pv.piece_count;
```

## Inventory Management Patterns

### Stock Level Monitoring

**Low stock alerts with details:**
```sql
SELECT 
    p.name as product_name,
    p.category,
    CONCAT_WS(' | ',
        CASE WHEN pv.size IS NOT NULL THEN pv.size END,
        CASE WHEN pv.color IS NOT NULL THEN pv.color END,
        CASE WHEN pv.piece_count IS NOT NULL THEN pv.piece_count || 'pc' END
    ) as variant_info,
    pv.stock_quantity,
    COALESCE(pv.low_stock_threshold, p.default_low_stock_threshold) as threshold,
    CASE 
        WHEN pv.stock_quantity = 0 THEN 'OUT OF STOCK'
        WHEN pv.stock_quantity <= COALESCE(pv.low_stock_threshold, p.default_low_stock_threshold) THEN 'LOW STOCK'
        ELSE 'OK'
    END as status
FROM products p
JOIN product_variants pv ON p.id = pv.product_id
WHERE pv.stock_quantity <= COALESCE(pv.low_stock_threshold, p.default_low_stock_threshold)
  AND pv.is_available = true
ORDER BY pv.stock_quantity ASC, p.category, p.name;
```

**Inventory valuation by category (assuming you have price data):**
```sql
WITH inventory_summary AS (
    SELECT 
        p.category,
        p.name as product_name,
        SUM(pv.stock_quantity) as total_units,
        COUNT(pv.id) as variant_count
    FROM products p
    JOIN product_variants pv ON p.id = pv.product_id
    WHERE pv.is_available = true
    GROUP BY p.category, p.id, p.name
)
SELECT 
    category,
    COUNT(*) as unique_products,
    SUM(variant_count) as total_variants,
    SUM(total_units) as total_inventory_units,
    AVG(total_units) as avg_units_per_product
FROM inventory_summary
GROUP BY category
ORDER BY total_inventory_units DESC;
```

### Stock Movement Simulation

**Simulate order processing:**
```sql
-- Create a temporary function to process an order
CREATE OR REPLACE FUNCTION process_order(
    p_product_name TEXT,
    p_size TEXT DEFAULT NULL,
    p_color TEXT DEFAULT NULL,
    p_piece_count INTEGER DEFAULT NULL,
    p_quantity INTEGER DEFAULT 1
) RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    remaining_stock INTEGER
) AS $$
DECLARE
    variant_record RECORD;
    current_stock INTEGER;
BEGIN
    -- Find the matching variant
    SELECT pv.id, pv.stock_quantity, pv.is_available
    INTO variant_record
    FROM product_variants pv
    JOIN products p ON pv.product_id = p.id
    WHERE p.name = p_product_name
      AND (p_size IS NULL OR pv.size = p_size)
      AND (p_color IS NULL OR pv.color = p_color)
      AND (p_piece_count IS NULL OR pv.piece_count = p_piece_count)
      AND pv.is_available = true
    LIMIT 1;
    
    -- Check if variant exists and has sufficient stock
    IF variant_record.id IS NULL THEN
        RETURN QUERY SELECT false, 'Variant not found or unavailable', 0;
        RETURN;
    END IF;
    
    IF variant_record.stock_quantity < p_quantity THEN
        RETURN QUERY SELECT false, 'Insufficient stock', variant_record.stock_quantity;
        RETURN;
    END IF;
    
    -- Process the order
    UPDATE product_variants 
    SET stock_quantity = stock_quantity - p_quantity
    WHERE id = variant_record.id
    RETURNING stock_quantity INTO current_stock;
    
    RETURN QUERY SELECT true, 'Order processed successfully', current_stock;
END;
$$ LANGUAGE plpgsql;

-- Example usage:
SELECT * FROM process_order('Navy Suit', 'L', 'Navy', 2, 1);
```

### Restocking Patterns

**Bulk restock with validation:**
```sql
WITH restock_data AS (
    VALUES 
        ('Navy Suit', 'S', 'Navy', 2, 20),
        ('Navy Suit', 'M', 'Navy', 2, 25),
        ('Navy Suit', 'L', 'Navy', 2, 30),
        ('Black Suit', 'L', 'Black', 3, 15)
) AS t(product_name, size, color, piece_count, add_quantity)

UPDATE product_variants
SET stock_quantity = product_variants.stock_quantity + restock_data.add_quantity,
    updated_at = NOW()
FROM restock_data
JOIN products p ON p.name = restock_data.product_name
WHERE product_variants.product_id = p.id
  AND product_variants.size = restock_data.size
  AND product_variants.color = restock_data.color
  AND product_variants.piece_count = restock_data.piece_count
RETURNING 
    (SELECT name FROM products WHERE id = product_variants.product_id) as product,
    product_variants.size,
    product_variants.color,
    product_variants.piece_count,
    product_variants.stock_quantity as new_quantity;
```

## Reporting and Analytics Patterns

### Sales Performance Analysis

**Product performance metrics:**
```sql
WITH product_metrics AS (
    SELECT 
        p.category,
        p.name,
        COUNT(pv.id) as total_variants,
        SUM(pv.stock_quantity) as current_stock,
        COUNT(CASE WHEN pv.is_available THEN 1 END) as available_variants,
        COUNT(CASE WHEN pv.stock_quantity = 0 THEN 1 END) as out_of_stock_variants,
        ROUND(
            100.0 * COUNT(CASE WHEN pv.is_available THEN 1 END) / COUNT(pv.id), 
            2
        ) as availability_percentage
    FROM products p
    JOIN product_variants pv ON p.id = pv.product_id
    GROUP BY p.category, p.id, p.name
)
SELECT 
    category,
    COUNT(*) as product_count,
    SUM(current_stock) as total_category_stock,
    ROUND(AVG(availability_percentage), 2) as avg_availability_pct,
    SUM(out_of_stock_variants) as total_out_of_stock
FROM product_metrics
GROUP BY category
ORDER BY total_category_stock DESC;
```

**Variant distribution analysis:**
```sql
SELECT 
    p.category,
    COALESCE(pv.size, 'No Size') as size_category,
    COUNT(pv.id) as variant_count,
    SUM(pv.stock_quantity) as total_stock,
    ROUND(AVG(pv.stock_quantity), 2) as avg_stock_per_variant
FROM products p
JOIN product_variants pv ON p.id = pv.product_id
WHERE pv.is_available = true
GROUP BY ROLLUP(p.category, pv.size)
ORDER BY p.category NULLS LAST, size_category NULLS LAST;
```

### Inventory Trends

**Stock movement analysis (requires historical data):**
```sql
-- This would typically use a separate stock_movements table
-- For demonstration, showing current state analysis
WITH stock_analysis AS (
    SELECT 
        p.category,
        p.name,
        pv.size,
        pv.color,
        pv.stock_quantity,
        COALESCE(pv.low_stock_threshold, p.default_low_stock_threshold) as threshold,
        CASE 
            WHEN pv.stock_quantity = 0 THEN 'Critical'
            WHEN pv.stock_quantity <= COALESCE(pv.low_stock_threshold, p.default_low_stock_threshold) THEN 'Low'
            WHEN pv.stock_quantity <= COALESCE(pv.low_stock_threshold, p.default_low_stock_threshold) * 2 THEN 'Moderate'
            ELSE 'High'
        END as stock_level
    FROM products p
    JOIN product_variants pv ON p.id = pv.product_id
    WHERE pv.is_available = true
)
SELECT 
    category,
    stock_level,
    COUNT(*) as variant_count,
    ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (PARTITION BY category), 2) as percentage
FROM stock_analysis
GROUP BY category, stock_level
ORDER BY category, 
    CASE stock_level 
        WHEN 'Critical' THEN 1 
        WHEN 'Low' THEN 2 
        WHEN 'Moderate' THEN 3 
        WHEN 'High' THEN 4 
    END;
```

## Performance Optimization Patterns

### Efficient Queries

**Using views for common queries:**
```sql
-- Use the pre-defined views for better performance
SELECT * FROM product_catalog 
WHERE category = 'suits' 
  AND total_stock > 0
ORDER BY available_variants DESC;

-- Use low_stock_alerts view
SELECT * FROM low_stock_alerts 
WHERE category IN ('suits', 'shirts')
ORDER BY stock_quantity ASC
LIMIT 20;
```

**Optimized pagination:**
```sql
-- Efficient pagination using cursor-based approach
SELECT 
    id,
    name,
    category,
    created_at
FROM products
WHERE created_at > '2024-01-01'  -- cursor value
ORDER BY created_at, id
LIMIT 20;
```

**Batch operations for better performance:**
```sql
-- Batch variant creation using VALUES
WITH new_variants AS (
    SELECT * FROM (VALUES
        ((SELECT id FROM products WHERE name = 'New Suit'), 'S', 'Blue', 2, 10),
        ((SELECT id FROM products WHERE name = 'New Suit'), 'M', 'Blue', 2, 15),
        ((SELECT id FROM products WHERE name = 'New Suit'), 'L', 'Blue', 2, 20)
    ) AS v(product_id, size, color, piece_count, stock_quantity)
)
INSERT INTO product_variants (product_id, size, color, piece_count, stock_quantity)
SELECT * FROM new_variants
RETURNING id, size, color, stock_quantity;
```

### Index Usage Optimization

**Leveraging partial indexes:**
```sql
-- Query that uses the partial index for available variants
SELECT p.name, pv.size, pv.stock_quantity
FROM products p
JOIN product_variants pv ON p.id = pv.product_id
WHERE pv.is_available = true 
  AND pv.stock_quantity > 10
  AND p.category = 'suits';

-- Query that uses the low stock partial index
SELECT p.name, pv.stock_quantity, 
       COALESCE(pv.low_stock_threshold, p.default_low_stock_threshold) as threshold
FROM products p
JOIN product_variants pv ON p.id = pv.product_id
WHERE pv.stock_quantity <= COALESCE(pv.low_stock_threshold, p.default_low_stock_threshold)
  AND pv.is_available = true;
```

## Data Integrity Patterns

### Validation Queries

**Check for orphaned variants (should return 0 rows):**
```sql
SELECT pv.id, pv.product_id 
FROM product_variants pv
LEFT JOIN products p ON pv.product_id = p.id
WHERE p.id IS NULL;
```

**Validate variant attribute consistency:**
```sql
-- Check for size variants on products that don't support them
SELECT p.name, pv.id, pv.size
FROM products p
JOIN product_variants pv ON p.id = pv.product_id
WHERE p.has_size_variants = false 
  AND pv.size IS NOT NULL;

-- Check for missing required attributes
SELECT p.name, pv.id
FROM products p
JOIN product_variants pv ON p.id = pv.product_id
WHERE p.has_size_variants = true 
  AND pv.size IS NULL;
```

**Data consistency checks:**
```sql
-- Check for negative stock quantities
SELECT p.name, pv.id, pv.stock_quantity
FROM products p
JOIN product_variants pv ON p.id = pv.product_id
WHERE pv.stock_quantity < 0;

-- Check for duplicate Stripe price IDs
SELECT stripe_price_id, COUNT(*)
FROM (
    SELECT stripe_price_id FROM products WHERE stripe_price_id IS NOT NULL
    UNION ALL
    SELECT stripe_price_id FROM product_variants WHERE stripe_price_id IS NOT NULL
) stripe_ids
GROUP BY stripe_price_id
HAVING COUNT(*) > 1;
```

### Constraint Verification

**Test unique constraints:**
```sql
-- This should fail due to unique constraint
-- INSERT INTO products (name, category) 
-- VALUES ('Navy Suit', 'suits');

-- This should fail due to variant combination constraint
-- INSERT INTO product_variants (product_id, size, color, piece_count, stock_quantity)
-- SELECT id, 'L', 'Navy', 2, 5 FROM products WHERE name = 'Navy Suit'
-- WHERE EXISTS (
--     SELECT 1 FROM product_variants 
--     WHERE product_id = (SELECT id FROM products WHERE name = 'Navy Suit')
--       AND size = 'L' AND color = 'Navy' AND piece_count = 2
-- );
```

## Stripe Integration Patterns

### Payment Processing Queries

**Get pricing information for checkout:**
```sql
SELECT 
    p.name as product_name,
    CONCAT_WS(' - ',
        CASE WHEN pv.size IS NOT NULL THEN pv.size END,
        CASE WHEN pv.color IS NOT NULL THEN pv.color END,
        CASE WHEN pv.piece_count IS NOT NULL THEN pv.piece_count || '-piece' END
    ) as variant_description,
    COALESCE(pv.stripe_price_id, p.stripe_price_id) as stripe_price_id,
    pv.stock_quantity,
    pv.is_available
FROM products p
JOIN product_variants pv ON p.id = pv.product_id
WHERE pv.id = $1  -- variant ID from application
  AND pv.is_available = true
  AND pv.stock_quantity > 0
  AND COALESCE(pv.stripe_price_id, p.stripe_price_id) IS NOT NULL;
```

**Bulk price updates:**
```sql
UPDATE products 
SET stripe_price_id = 'price_' || REPLACE(LOWER(name), ' ', '_'),
    updated_at = NOW()
WHERE stripe_price_id IS NULL 
  AND category = 'suits'
RETURNING name, stripe_price_id;
```

### Revenue Analysis with Stripe Integration

**Product revenue potential (stock value by price):**
```sql
-- This would typically JOIN with a separate prices table or Stripe webhook data
SELECT 
    p.category,
    p.name,
    COUNT(pv.id) as variants_with_pricing,
    SUM(CASE WHEN COALESCE(pv.stripe_price_id, p.stripe_price_id) IS NOT NULL 
             THEN pv.stock_quantity ELSE 0 END) as sellable_units
FROM products p
JOIN product_variants pv ON p.id = pv.product_id
WHERE pv.is_available = true
GROUP BY p.category, p.id, p.name
HAVING COUNT(CASE WHEN COALESCE(pv.stripe_price_id, p.stripe_price_id) IS NOT NULL 
                  THEN 1 END) > 0
ORDER BY sellable_units DESC;
```

## Common Anti-Patterns to Avoid

### ❌ Inefficient Queries

**Don't use correlated subqueries when JOINs work better:**
```sql
-- BAD: Correlated subquery
SELECT name FROM products p
WHERE EXISTS (
    SELECT 1 FROM product_variants pv 
    WHERE pv.product_id = p.id 
      AND pv.stock_quantity > 0
);

-- GOOD: Use JOIN or EXISTS with better performance
SELECT DISTINCT p.name 
FROM products p
JOIN product_variants pv ON p.id = pv.product_id
WHERE pv.stock_quantity > 0;
```

**Don't select unnecessary columns:**
```sql
-- BAD: Selecting all columns when only few are needed
SELECT * FROM product_variants_detailed
WHERE category = 'suits';

-- GOOD: Select only required columns
SELECT product_name, size, color, stock_quantity 
FROM product_variants_detailed
WHERE category = 'suits';
```

### ❌ Data Integrity Issues

**Don't update stock without proper validation:**
```sql
-- BAD: Direct stock update without validation
-- UPDATE product_variants SET stock_quantity = stock_quantity - 5 WHERE id = ?;

-- GOOD: Validate before update
UPDATE product_variants 
SET stock_quantity = stock_quantity - 5
WHERE id = $1 
  AND stock_quantity >= 5 
  AND is_available = true
RETURNING stock_quantity;
```

**Don't ignore constraint violations:**
```sql
-- BAD: Using ON CONFLICT DO NOTHING without handling
-- INSERT INTO products (name, category) VALUES ('Duplicate', 'suits')
-- ON CONFLICT (name) DO NOTHING;

-- GOOD: Handle conflicts appropriately
INSERT INTO products (name, category) VALUES ('Duplicate', 'suits')
ON CONFLICT (name) DO UPDATE SET
    updated_at = NOW(),
    category = EXCLUDED.category
RETURNING id, name, 'updated' as action;
```

### ❌ Performance Issues

**Don't create inefficient pagination:**
```sql
-- BAD: OFFSET pagination on large tables
-- SELECT * FROM products ORDER BY name LIMIT 20 OFFSET 1000;

-- GOOD: Cursor-based pagination
SELECT * FROM products 
WHERE name > $1  -- last_name from previous page
ORDER BY name 
LIMIT 20;
```

**Don't overuse views in nested queries:**
```sql
-- BAD: Nested view queries
-- SELECT * FROM product_catalog pc
-- WHERE pc.id IN (SELECT product_id FROM product_variants_detailed WHERE ...);

-- GOOD: Direct table access when appropriate
SELECT p.* FROM products p
JOIN product_variants pv ON p.id = pv.product_id
WHERE pv.stock_quantity > 10;
```

## Advanced Patterns

### Dynamic Query Building

**Flexible product search with optional filters:**
```sql
-- Example of a parameterized search function
CREATE OR REPLACE FUNCTION search_products(
    p_category TEXT DEFAULT NULL,
    p_has_stock BOOLEAN DEFAULT NULL,
    p_size TEXT DEFAULT NULL,
    p_color TEXT DEFAULT NULL,
    p_min_stock INTEGER DEFAULT 0
) RETURNS TABLE(
    product_id UUID,
    product_name TEXT,
    category TEXT,
    variant_count BIGINT,
    total_stock BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.category,
        COUNT(pv.id) as variant_count,
        SUM(pv.stock_quantity) as total_stock
    FROM products p
    LEFT JOIN product_variants pv ON p.id = pv.product_id
    WHERE (p_category IS NULL OR p.category = p_category)
      AND (p_has_stock IS NULL OR 
           (p_has_stock = true AND pv.stock_quantity > p_min_stock) OR
           (p_has_stock = false))
      AND (p_size IS NULL OR pv.size = p_size)
      AND (p_color IS NULL OR pv.color ILIKE '%' || p_color || '%')
      AND (pv.id IS NULL OR pv.is_available = true)
    GROUP BY p.id, p.name, p.category
    ORDER BY p.name;
END;
$$ LANGUAGE plpgsql;

-- Usage examples:
SELECT * FROM search_products('suits', true, 'L');
SELECT * FROM search_products(p_color => 'navy');
```

### Audit and Monitoring

**Create audit trigger for stock changes:**
```sql
-- Create audit table for stock movements
CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID NOT NULL REFERENCES product_variants(id),
    old_quantity INTEGER NOT NULL,
    new_quantity INTEGER NOT NULL,
    change_amount INTEGER NOT NULL,
    change_reason TEXT,
    changed_by TEXT DEFAULT current_user,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create audit trigger
CREATE OR REPLACE FUNCTION audit_stock_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.stock_quantity != NEW.stock_quantity THEN
        INSERT INTO stock_movements (
            variant_id, 
            old_quantity, 
            new_quantity, 
            change_amount
        ) VALUES (
            NEW.id,
            OLD.stock_quantity,
            NEW.stock_quantity,
            NEW.stock_quantity - OLD.stock_quantity
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER stock_audit_trigger
    AFTER UPDATE ON product_variants
    FOR EACH ROW
    EXECUTE FUNCTION audit_stock_changes();
```

This comprehensive guide provides practical SQL patterns and examples for efficiently working with the KCT Ecosystem database schema. Use these patterns as starting points and adapt them to your specific business requirements while maintaining the established performance and data integrity standards.