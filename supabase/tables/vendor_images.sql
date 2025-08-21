CREATE TABLE vendor_images (
    shopify_image_id bigint primary key,
    shopify_product_id bigint,
    src text,
    alt text,
    position int,
    width int,
    height int
);