-- Migration: create_notification_triggers
-- Created at: 1755417639

-- Function to create admin notifications
CREATE OR REPLACE FUNCTION create_admin_notification(
    p_type TEXT,
    p_title TEXT,
    p_message TEXT,
    p_order_id UUID DEFAULT NULL,
    p_customer_id UUID DEFAULT NULL,
    p_product_id UUID DEFAULT NULL,
    p_priority TEXT DEFAULT 'normal',
    p_data JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO admin_notifications (
        type, title, message, order_id, customer_id, product_id, priority, data
    ) VALUES (
        p_type, p_title, p_message, p_order_id, p_customer_id, p_product_id, p_priority, p_data
    ) RETURNING id INTO notification_id;
    
    -- Log the creation
    INSERT INTO admin_notification_history (notification_id, action, details)
    VALUES (notification_id, 'created', jsonb_build_object('type', p_type, 'priority', p_priority));
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for new orders
CREATE OR REPLACE FUNCTION trigger_new_order_notification()
RETURNS TRIGGER AS $$
DECLARE
    customer_name TEXT;
    order_total TEXT;
    item_count INTEGER;
    priority_level TEXT;
BEGIN
    -- Get customer information
    SELECT COALESCE(first_name || ' ' || last_name, email, 'Guest Customer')
    INTO customer_name
    FROM customers
    WHERE id = NEW.customer_id;
    
    -- Count items in order
    SELECT COUNT(*)
    INTO item_count
    FROM order_items
    WHERE order_id = NEW.id;
    
    -- Format total amount
    order_total := '$' || CAST(NEW.total_amount AS TEXT);
    
    -- Determine priority based on order value
    priority_level := CASE
        WHEN NEW.total_amount >= 1000 THEN 'high'
        WHEN NEW.total_amount >= 500 THEN 'normal'
        ELSE 'normal'
    END;
    
    -- Create notification
    PERFORM create_admin_notification(
        'new_order',
        'New Order Received',
        'Order #' || NEW.order_number || ' from ' || COALESCE(customer_name, 'Guest') || ' - ' || order_total,
        NEW.id,
        NEW.customer_id,
        NULL,
        priority_level,
        jsonb_build_object(
            'order_number', NEW.order_number,
            'customer_name', customer_name,
            'total_amount', NEW.total_amount,
            'currency', COALESCE(NEW.currency, 'USD'),
            'item_count', item_count,
            'payment_method', NEW.payment_method,
            'order_type', NEW.order_type
        )
    );
    
    -- Check if it's a high-value order
    IF NEW.total_amount >= 1000 THEN
        PERFORM create_admin_notification(
            'new_order',
            'High-Value Order Alert',
            'High-value order #' || NEW.order_number || ' - ' || order_total || ' from ' || COALESCE(customer_name, 'Guest'),
            NEW.id,
            NEW.customer_id,
            NULL,
            'urgent',
            jsonb_build_object(
                'order_number', NEW.order_number,
                'customer_name', customer_name,
                'total_amount', NEW.total_amount,
                'currency', COALESCE(NEW.currency, 'USD'),
                'is_high_value', true
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for payment status changes
CREATE OR REPLACE FUNCTION trigger_payment_notification()
RETURNS TRIGGER AS $$
DECLARE
    customer_name TEXT;
    order_info RECORD;
    notification_type TEXT;
    notification_title TEXT;
    notification_message TEXT;
    priority_level TEXT;
BEGIN
    -- Get order and customer information
    SELECT o.*, COALESCE(c.first_name || ' ' || c.last_name, c.email, 'Guest Customer') as customer_name
    INTO order_info
    FROM orders o
    LEFT JOIN customers c ON c.id = o.customer_id
    WHERE o.id = NEW.order_id;
    
    -- Handle payment status changes
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status != NEW.status) THEN
        CASE NEW.status
            WHEN 'succeeded', 'completed', 'paid' THEN
                notification_type := 'payment_received';
                notification_title := 'Payment Received';
                notification_message := 'Payment confirmed for order #' || order_info.order_number || ' - $' || NEW.amount;
                priority_level := 'normal';
            
            WHEN 'failed', 'declined', 'canceled' THEN
                notification_type := 'payment_failed';
                notification_title := 'Payment Failed';
                notification_message := 'Payment failed for order #' || order_info.order_number || ' - $' || NEW.amount;
                priority_level := 'high';
            
            ELSE
                RETURN NEW; -- No notification for other statuses
        END CASE;
        
        PERFORM create_admin_notification(
            notification_type,
            notification_title,
            notification_message,
            NEW.order_id,
            NEW.customer_id,
            NULL,
            priority_level,
            jsonb_build_object(
                'order_number', order_info.order_number,
                'customer_name', order_info.customer_name,
                'amount', NEW.amount,
                'currency', NEW.currency_code,
                'payment_method', order_info.payment_method,
                'transaction_id', NEW.processor_transaction_id,
                'gateway', NEW.gateway
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for order status changes
CREATE OR REPLACE FUNCTION trigger_order_status_notification()
RETURNS TRIGGER AS $$
DECLARE
    customer_name TEXT;
    status_change_message TEXT;
    priority_level TEXT;
BEGIN
    -- Only trigger on status changes, not new orders
    IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        -- Get customer information
        SELECT COALESCE(first_name || ' ' || last_name, email, 'Guest Customer')
        INTO customer_name
        FROM customers
        WHERE id = NEW.customer_id;
        
        -- Determine priority based on new status
        priority_level := CASE
            WHEN NEW.status IN ('cancelled', 'refunded', 'failed') THEN 'high'
            WHEN NEW.status IN ('shipped', 'delivered') THEN 'normal'
            ELSE 'normal'
        END;
        
        status_change_message := 'Order #' || NEW.order_number || ' status changed from ' || 
                               INITCAP(OLD.status) || ' to ' || INITCAP(NEW.status);
        
        PERFORM create_admin_notification(
            'order_status_change',
            'Order Status Updated',
            status_change_message,
            NEW.id,
            NEW.customer_id,
            NULL,
            priority_level,
            jsonb_build_object(
                'order_number', NEW.order_number,
                'customer_name', customer_name,
                'old_status', OLD.status,
                'new_status', NEW.status,
                'total_amount', NEW.total_amount
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS new_order_notification_trigger ON orders;
CREATE TRIGGER new_order_notification_trigger
    AFTER INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION trigger_new_order_notification();

DROP TRIGGER IF EXISTS payment_notification_trigger ON payment_transactions;
CREATE TRIGGER payment_notification_trigger
    AFTER INSERT OR UPDATE ON payment_transactions
    FOR EACH ROW
    EXECUTE FUNCTION trigger_payment_notification();

DROP TRIGGER IF EXISTS order_status_notification_trigger ON orders;
CREATE TRIGGER order_status_notification_trigger
    AFTER UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION trigger_order_status_notification();;