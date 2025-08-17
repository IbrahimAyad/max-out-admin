-- Migration: drop_priority_queue_trigger
-- Created at: 1755444656

-- Drop the specific trigger that's causing the issue
DROP TRIGGER IF EXISTS add_order_to_priority_queue ON orders;
DROP FUNCTION IF EXISTS add_to_priority_queue() CASCADE;

-- Also drop other problematic triggers
DROP TRIGGER IF EXISTS new_order_notification_trigger ON orders;
DROP TRIGGER IF EXISTS order_status_change_trigger ON orders;
DROP TRIGGER IF EXISTS order_status_notification_trigger ON orders;
DROP TRIGGER IF EXISTS reserve_inventory_trigger ON orders;
DROP TRIGGER IF EXISTS trigger_send_order_status_email ON orders;
DROP TRIGGER IF EXISTS trigger_sync_inventory_on_order ON orders;
DROP TRIGGER IF EXISTS update_customer_metrics_trigger ON orders;;