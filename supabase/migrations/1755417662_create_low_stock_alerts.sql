-- Migration: create_low_stock_alerts
-- Created at: 1755417662

-- Function to check and create low stock notifications
CREATE OR REPLACE FUNCTION check_low_stock_alerts()
RETURNS VOID AS $$
DECLARE
    product_record RECORD;
    total_inventory INTEGER;
    threshold INTEGER;
    existing_notification_id UUID;
BEGIN
    -- Loop through all products to check inventory levels
    FOR product_record IN 
        SELECT p.id, p.name, p.sku, 
               COALESCE(SUM(pv.inventory_quantity), 0) as total_stock
        FROM products p
        LEFT JOIN product_variants pv ON pv.product_id = p.id
        WHERE p.status = 'active' AND p.track_inventory = true
        GROUP BY p.id, p.name, p.sku
    LOOP
        total_inventory := product_record.total_stock;
        threshold := 10; -- Default threshold, can be made configurable
        
        -- Check if stock is low
        IF total_inventory <= threshold THEN
            -- Check if we already have an unread low stock notification for this product
            SELECT id INTO existing_notification_id
            FROM admin_notifications
            WHERE type = 'low_stock' 
              AND product_id = product_record.id 
              AND is_read = FALSE
            LIMIT 1;
            
            -- Only create notification if one doesn't already exist
            IF existing_notification_id IS NULL THEN
                PERFORM create_admin_notification(
                    'low_stock',
                    'Low Stock Alert',
                    product_record.name || ' (' || product_record.sku || ') is running low - ' || total_inventory || ' units remaining',
                    NULL,
                    NULL,
                    product_record.id,
                    CASE 
                        WHEN total_inventory = 0 THEN 'urgent'
                        WHEN total_inventory <= 5 THEN 'high'
                        ELSE 'normal'
                    END,
                    jsonb_build_object(
                        'product_name', product_record.name,
                        'product_sku', product_record.sku,
                        'current_stock', total_inventory,
                        'threshold', threshold,
                        'is_out_of_stock', total_inventory = 0
                    )
                );
            END IF;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for inventory changes
CREATE OR REPLACE FUNCTION trigger_inventory_check()
RETURNS TRIGGER AS $$
BEGIN
    -- Defer the stock check to avoid issues during bulk operations
    PERFORM pg_notify('check_low_stock', NEW.product_id::text);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for inventory changes
DROP TRIGGER IF EXISTS inventory_check_trigger ON product_variants;
CREATE TRIGGER inventory_check_trigger
    AFTER UPDATE OF inventory_quantity ON product_variants
    FOR EACH ROW
    WHEN (OLD.inventory_quantity != NEW.inventory_quantity)
    EXECUTE FUNCTION trigger_inventory_check();

-- Function to mark notifications as read
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE admin_notifications 
    SET is_read = TRUE, read_at = NOW(), updated_at = NOW()
    WHERE id = notification_id AND is_read = FALSE;
    
    -- Log the action
    INSERT INTO admin_notification_history (notification_id, action)
    VALUES (notification_id, 'read');
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to mark notifications as unread
CREATE OR REPLACE FUNCTION mark_notification_unread(notification_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE admin_notifications 
    SET is_read = FALSE, read_at = NULL, updated_at = NOW()
    WHERE id = notification_id AND is_read = TRUE;
    
    -- Log the action
    INSERT INTO admin_notification_history (notification_id, action)
    VALUES (notification_id, 'unread');
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to delete notifications
CREATE OR REPLACE FUNCTION delete_admin_notification(notification_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Log the deletion first
    INSERT INTO admin_notification_history (notification_id, action)
    VALUES (notification_id, 'deleted');
    
    DELETE FROM admin_notifications WHERE id = notification_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Run initial low stock check
SELECT check_low_stock_alerts();;