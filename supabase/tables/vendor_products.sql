CREATE TABLE vendor_products (
    shopify_product_id bigint primary key,
    handle text,
    title text,
    body_html text,
    vendor text,
    product_type text,
    status text,
    tags text[],
    created_at timestamptz,
    updated_at timestamptz
);