CREATE TABLE vendor_variants (
    shopify_variant_id bigint primary key,
    shopify_product_id bigint,
    sku text,
    barcode text,
    price numeric(10,2),
    compare_at_price numeric(10,2),
    position int,
    inventory_item_id bigint,
    option1 text,
    option2 text,
    option3 text
);