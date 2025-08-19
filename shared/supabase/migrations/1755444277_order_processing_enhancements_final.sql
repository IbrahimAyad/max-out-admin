-- Migration: order_processing_enhancements_final
-- Created at: 1755444277

-- Final Order Processing Workflow Enhancements
-- Created: 2025-08-17 23:15:00
-- Purpose: Complete order management system with dual product architecture

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types for order management (with IF NOT EXISTS equivalent)
DO $$ BEGIN
    CREATE TYPE order_status AS ENUM (
      'pending_payment',
      'payment_confirmed', 
      'processing',
      'in_production',
      'quality_check',
      'packaging',
      'shipped',
      'out_for_delivery',
      'delivered',
      'completed',
      'cancelled',
      'refunded',
      'on_hold',
      'exception'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_priority AS ENUM (
      'low',
      'normal',
      'high',
      'urgent',
      'rush',
      'wedding_party',
      'prom_group',
      'vip_customer'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE product_source AS ENUM (
      'core_stripe',
      'catalog_supabase'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE communication_type AS ENUM (
      'order_confirmation',
      'payment_confirmation',
      'processing_update',
      'shipping_notification',
      'delivery_confirmation',
      'delay_notification',
      'exception_alert',
      'review_request',
      'satisfaction_survey',
      'custom_message'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE communication_channel AS ENUM (
      'email',
      'sms',
      'push_notification',
      'in_app',
      'phone_call'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add all missing columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_priority order_priority DEFAULT 'normal';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address_line1 VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address_line2 VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_city VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_state VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_postal_code VARCHAR(20);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_country VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS billing_address_line1 VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS billing_address_line2 VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS billing_city VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS billing_state VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS billing_postal_code VARCHAR(20);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS billing_country VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_delivery_date DATE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS actual_delivery_date DATE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_carrier VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_rush_order BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_group_order BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS group_order_id UUID REFERENCES orders(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS special_instructions TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS processing_notes TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS assigned_processor_id UUID REFERENCES auth.users(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_processing_time INTEGER;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS actual_processing_time INTEGER;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE;

-- Rename existing status column to order_status if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'status') THEN
        ALTER TABLE orders RENAME COLUMN status TO order_status;
    END IF;
EXCEPTION
    WHEN others THEN NULL;
END $$;

-- Add order_status column if it doesn't exist
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_status order_status DEFAULT 'pending_payment';

-- Add order_number column if it doesn't exist
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number VARCHAR(20);

-- Update order_number for existing orders without one
UPDATE orders SET order_number = CONCAT('KCT-', extract(epoch from created_at)::bigint, '-', substring(id::text, 1, 4)) 
WHERE order_number IS NULL;

-- Make order_number NOT NULL and UNIQUE
ALTER TABLE orders ALTER COLUMN order_number SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS orders_order_number_idx ON orders(order_number);

-- Add customer_name if it doesn't exist
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255);

-- Update customer_name for existing orders
UPDATE orders SET customer_name = COALESCE(customer_email, 'Customer') WHERE customer_name IS NULL;

-- Make customer_name NOT NULL
ALTER TABLE orders ALTER COLUMN customer_name SET DEFAULT 'Customer';
UPDATE orders SET customer_name = 'Customer' WHERE customer_name IS NULL;
ALTER TABLE orders ALTER COLUMN customer_name SET NOT NULL;

-- Add missing columns to order_items table
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_source product_source;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS stripe_product_id VARCHAR(255);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS stripe_price_id VARCHAR(255);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS catalog_product_id UUID;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_sku VARCHAR(100);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_description TEXT;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS size VARCHAR(20);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS color VARCHAR(50);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS material VARCHAR(100);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS custom_measurements JSONB;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS unit_price DECIMAL(10,2);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS total_price DECIMAL(10,2);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS is_bundle_item BOOLEAN DEFAULT FALSE;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS bundle_parent_id UUID REFERENCES order_items(id);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS bundle_type VARCHAR(100);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS item_status order_status DEFAULT 'pending_payment';
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS production_notes TEXT;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS quality_check_notes TEXT;

-- Rename existing price column to unit_price if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'price_at_time') THEN
        UPDATE order_items SET unit_price = price_at_time WHERE unit_price IS NULL;
    END IF;
EXCEPTION
    WHEN others THEN NULL;
END $$;

-- Update missing values
UPDATE order_items SET unit_price = 0 WHERE unit_price IS NULL;
UPDATE order_items SET total_price = unit_price * quantity WHERE total_price IS NULL;
UPDATE order_items SET product_source = 'catalog_supabase' WHERE product_source IS NULL;

-- Create order_status_history table if it doesn't exist
CREATE TABLE IF NOT EXISTS order_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  previous_status order_status,
  new_status order_status NOT NULL,
  status_reason VARCHAR(255),
  status_notes TEXT,
  changed_by_user_id UUID REFERENCES auth.users(id),
  changed_by_system BOOLEAN DEFAULT FALSE,
  processing_duration INTEGER,
  is_exception BOOLEAN DEFAULT FALSE,
  exception_type VARCHAR(100),
  exception_details TEXT,
  resolution_notes TEXT,
  automated_action_triggered BOOLEAN DEFAULT FALSE,
  automation_type VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create customer_communication_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS customer_communication_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES auth.users(id),
  communication_type communication_type NOT NULL,
  communication_channel communication_channel NOT NULL,
  subject VARCHAR(255),
  message_content TEXT NOT NULL,
  personalized_content JSONB,
  recipient_email VARCHAR(255),
  recipient_phone VARCHAR(20),
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  delivery_status VARCHAR(50) DEFAULT 'pending',
  customer_response TEXT,
  response_received_at TIMESTAMP WITH TIME ZONE,
  is_automated BOOLEAN DEFAULT TRUE,
  automation_trigger VARCHAR(100),
  scheduled_for TIMESTAMP WITH TIME ZONE,
  external_message_id VARCHAR(255),
  kct_knowledge_api_request_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create order_priority_queue table if it doesn't exist
CREATE TABLE IF NOT EXISTS order_priority_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  queue_position INTEGER NOT NULL,
  priority_score INTEGER NOT NULL,
  queue_type VARCHAR(50) NOT NULL,
  customer_tier VARCHAR(20),
  order_value_tier VARCHAR(20),
  delivery_urgency INTEGER,
  special_event_type VARCHAR(50),
  assigned_to_user_id UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMP WITH TIME ZONE,
  estimated_completion TIMESTAMP WITH TIME ZONE,
  queue_status VARCHAR(50) DEFAULT 'waiting',
  entered_queue_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  started_processing_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  auto_assigned BOOLEAN DEFAULT FALSE,
  requires_manual_review BOOLEAN DEFAULT FALSE,
  escalation_required BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create order_exceptions table if it doesn't exist
CREATE TABLE IF NOT EXISTS order_exceptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  exception_type VARCHAR(100) NOT NULL,
  exception_severity VARCHAR(20) NOT NULL,
  exception_description TEXT NOT NULL,
  affects_delivery_date BOOLEAN DEFAULT FALSE,
  estimated_delay_days INTEGER,
  customer_impact_level VARCHAR(20),
  resolution_status VARCHAR(50) DEFAULT 'open',
  resolution_notes TEXT,
  resolved_by_user_id UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  escalated_to_user_id UUID REFERENCES auth.users(id),
  escalation_reason TEXT,
  escalated_at TIMESTAMP WITH TIME ZONE,
  customer_notified BOOLEAN DEFAULT FALSE,
  customer_notification_sent_at TIMESTAMP WITH TIME ZONE,
  customer_acceptance_required BOOLEAN DEFAULT FALSE,
  customer_accepted_at TIMESTAMP WITH TIME ZONE,
  root_cause_analysis TEXT,
  prevention_measures TEXT,
  similar_exceptions_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create processing_analytics table if it doesn't exist
CREATE TABLE IF NOT EXISTS processing_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  payment_to_processing_minutes INTEGER,
  processing_to_production_minutes INTEGER,
  production_to_quality_minutes INTEGER,
  quality_to_shipping_minutes INTEGER,
  shipping_to_delivery_minutes INTEGER,
  total_fulfillment_minutes INTEGER,
  processing_efficiency_score DECIMAL(5,2),
  bottleneck_stage VARCHAR(50),
  exceeded_sla BOOLEAN DEFAULT FALSE,
  sla_target_minutes INTEGER,
  vs_average_performance DECIMAL(5,2),
  processor_performance_rank INTEGER,
  similar_orders_avg_time INTEGER,
  quality_issues_count INTEGER DEFAULT 0,
  customer_satisfaction_score INTEGER,
  reprocessing_required BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for timestamp updates
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_items_updated_at BEFORE UPDATE ON order_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_communication_logs_updated_at BEFORE UPDATE ON customer_communication_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_priority_queue_updated_at BEFORE UPDATE ON order_priority_queue
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_exceptions_updated_at BEFORE UPDATE ON order_exceptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_processing_analytics_updated_at BEFORE UPDATE ON processing_analytics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_order_priority ON orders(order_priority);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_rush_order ON orders(is_rush_order);
CREATE INDEX IF NOT EXISTS idx_orders_group_order ON orders(is_group_order);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_source ON order_items(product_source);
CREATE INDEX IF NOT EXISTS idx_order_items_stripe_product_id ON order_items(stripe_product_id);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_created_at ON order_status_history(created_at);

CREATE INDEX IF NOT EXISTS idx_communication_logs_order_id ON customer_communication_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_communication_logs_customer_id ON customer_communication_logs(customer_id);

CREATE INDEX IF NOT EXISTS idx_priority_queue_order_id ON order_priority_queue(order_id);
CREATE INDEX IF NOT EXISTS idx_priority_queue_position ON order_priority_queue(queue_position);
CREATE INDEX IF NOT EXISTS idx_priority_queue_status ON order_priority_queue(queue_status);

CREATE INDEX IF NOT EXISTS idx_order_exceptions_order_id ON order_exceptions(order_id);
CREATE INDEX IF NOT EXISTS idx_order_exceptions_status ON order_exceptions(resolution_status);

CREATE INDEX IF NOT EXISTS idx_processing_analytics_order_id ON processing_analytics(order_id);
CREATE INDEX IF NOT EXISTS idx_processing_analytics_created_at ON processing_analytics(created_at);

-- Enable RLS (Row Level Security) on all tables
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_communication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_priority_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admin access
CREATE POLICY "Admin access orders" ON orders FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "Admin access order_items" ON order_items FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "Admin access order_status_history" ON order_status_history FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "Admin access customer_communication_logs" ON customer_communication_logs FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "Admin access order_priority_queue" ON order_priority_queue FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "Admin access order_exceptions" ON order_exceptions FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "Admin access processing_analytics" ON processing_analytics FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);;