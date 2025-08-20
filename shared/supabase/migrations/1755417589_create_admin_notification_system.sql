-- Migration: create_admin_notification_system
-- Created at: 1755417589

-- Admin Notifications Table (separate from customer notifications)
CREATE TABLE IF NOT EXISTS admin_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('new_order', 'payment_received', 'payment_failed', 'order_status_change', 'low_stock', 'high_value_order', 'failed_delivery')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    order_id UUID REFERENCES orders(id),
    customer_id UUID REFERENCES customers(id),
    product_id UUID REFERENCES products(id),
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    sound_played BOOLEAN DEFAULT FALSE,
    delivery_methods TEXT[] DEFAULT ARRAY['in_app'],
    email_sent BOOLEAN DEFAULT FALSE,
    email_sent_at TIMESTAMP WITH TIME ZONE,
    push_sent BOOLEAN DEFAULT FALSE,
    push_sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin Notification Preferences Table
CREATE TABLE IF NOT EXISTS admin_notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID, -- Will reference admin users when auth is implemented
    email TEXT, -- For now, we'll use email as identifier
    -- Notification Type Preferences
    new_order_enabled BOOLEAN DEFAULT TRUE,
    new_order_email BOOLEAN DEFAULT TRUE,
    new_order_sound BOOLEAN DEFAULT TRUE,
    new_order_sound_file TEXT DEFAULT 'new_order.mp3',
    
    payment_received_enabled BOOLEAN DEFAULT TRUE,
    payment_received_email BOOLEAN DEFAULT TRUE,
    payment_received_sound BOOLEAN DEFAULT TRUE,
    payment_received_sound_file TEXT DEFAULT 'payment_success.mp3',
    
    payment_failed_enabled BOOLEAN DEFAULT TRUE,
    payment_failed_email BOOLEAN DEFAULT TRUE,
    payment_failed_sound BOOLEAN DEFAULT TRUE,
    payment_failed_sound_file TEXT DEFAULT 'payment_failed.mp3',
    
    order_status_change_enabled BOOLEAN DEFAULT TRUE,
    order_status_change_email BOOLEAN DEFAULT TRUE,
    order_status_change_sound BOOLEAN DEFAULT TRUE,
    order_status_change_sound_file TEXT DEFAULT 'status_change.mp3',
    
    low_stock_enabled BOOLEAN DEFAULT TRUE,
    low_stock_email BOOLEAN DEFAULT TRUE,
    low_stock_sound BOOLEAN DEFAULT TRUE,
    low_stock_sound_file TEXT DEFAULT 'low_stock.mp3',
    
    high_value_order_enabled BOOLEAN DEFAULT TRUE,
    high_value_order_threshold NUMERIC DEFAULT 1000.00,
    high_value_order_email BOOLEAN DEFAULT TRUE,
    high_value_order_sound BOOLEAN DEFAULT TRUE,
    high_value_order_sound_file TEXT DEFAULT 'high_value.mp3',
    
    -- General Settings
    email_notifications BOOLEAN DEFAULT TRUE,
    browser_notifications BOOLEAN DEFAULT TRUE,
    sound_notifications BOOLEAN DEFAULT TRUE,
    quiet_hours_enabled BOOLEAN DEFAULT FALSE,
    quiet_hours_start TIME DEFAULT '22:00',
    quiet_hours_end TIME DEFAULT '08:00',
    timezone TEXT DEFAULT 'UTC',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification History (for analytics and audit)
CREATE TABLE IF NOT EXISTS admin_notification_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID REFERENCES admin_notifications(id),
    action TEXT NOT NULL CHECK (action IN ('created', 'read', 'unread', 'deleted', 'email_sent', 'push_sent')),
    performed_by TEXT,
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    details JSONB DEFAULT '{}'
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_notifications_type ON admin_notifications(type);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON admin_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_is_read ON admin_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_order_id ON admin_notifications(order_id);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_priority ON admin_notifications(priority);

-- Create default admin notification preferences
INSERT INTO admin_notification_preferences (email) 
VALUES ('admin@kctmenswear.com')
ON CONFLICT DO NOTHING;

-- Enable Real-time for admin notifications
ALTER PUBLICATION supabase_realtime ADD TABLE admin_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE admin_notification_preferences;;