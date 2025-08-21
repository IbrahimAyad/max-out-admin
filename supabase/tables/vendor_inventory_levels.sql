CREATE TABLE vendor_inventory_levels (
    inventory_item_id bigint,
    location_id bigint,
    available int,
    updated_at timestamptz default now(),
    primary key (inventory_item_id,
    location_id)
);