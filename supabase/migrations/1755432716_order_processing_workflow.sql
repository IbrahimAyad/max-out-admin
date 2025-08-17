-- Migration: order_processing_workflow
-- Created at: 1755432716

-- Comprehensive Order Processing Workflow Schema
-- Created: 2025-08-17 20:07:05
-- Purpose: Intelligent order management system for KCT Menswear dual product architecture

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types for order management
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

CREATE TYPE product_source AS ENUM (
  'core_stripe',
  'catalog_supabase'
);

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

CREATE TYPE communication_channel AS ENUM (
  'email',
  'sms',
  'push_notification',
  'in_app',
  'phone_call'
);

-- Orders table - Central order management
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(20) UNIQUE NOT NULL,
  
  -- Customer information
  customer_id UUID REFERENCES auth.users(id),
  customer_email VARCHAR(255) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20),
  
  -- Order details
  order_status order_status DEFAULT 'pending_payment',
  order_priority order_priority DEFAULT 'normal',
  
  -- Financial information
  subtotal_amount DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  shipping_amount DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Payment information
  stripe_payment_intent_id VARCHAR(255),
  payment_method VARCHAR(50),
  payment_status VARCHAR(50),
  
  -- Shipping information
  shipping_address_line1 VARCHAR(255),
  shipping_address_line2 VARCHAR(255),
  shipping_city VARCHAR(100),
  shipping_state VARCHAR(100),
  shipping_postal_code VARCHAR(20),
  shipping_country VARCHAR(100),
  
  billing_address_line1 VARCHAR(255),
  billing_address_line2 VARCHAR(255),
  billing_city VARCHAR(100),
  billing_state VARCHAR(100),
  billing_postal_code VARCHAR(20),
  billing_country VARCHAR(100),
  
  -- Logistics
  estimated_delivery_date DATE,
  actual_delivery_date DATE,
  tracking_number VARCHAR(100),
  shipping_carrier VARCHAR(50),
  
  -- Special handling
  is_rush_order BOOLEAN DEFAULT FALSE,
  is_group_order BOOLEAN DEFAULT FALSE,
  group_order_id UUID REFERENCES orders(id),
  special_instructions TEXT,
  
  -- Processing metadata
  processing_notes TEXT,
  assigned_processor_id UUID REFERENCES auth.users(id),
  estimated_processing_time INTEGER, -- in hours
  actual_processing_time INTEGER, -- in hours
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP WITH TIME ZONE,
  shipped_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE
);

-- Order items table - Individual products in orders
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Product identification
  product_source product_source NOT NULL,
  stripe_product_id VARCHAR(255), -- For core products
  stripe_price_id VARCHAR(255),   -- For core products
  catalog_product_id UUID,        -- For catalog products
  
  -- Product details
  product_name VARCHAR(255) NOT NULL,
  product_sku VARCHAR(100),
  product_description TEXT,
  
  -- Variant information
  size VARCHAR(20),
  color VARCHAR(50),
  material VARCHAR(100),
  custom_measurements JSONB, -- For tailored items
  
  -- Pricing and quantity
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  
  -- Bundle information
  is_bundle_item BOOLEAN DEFAULT FALSE,
  bundle_parent_id UUID REFERENCES order_items(id),
  bundle_type VARCHAR(100), -- suit, tuxedo, wedding_package, etc.
  
  -- Processing status
  item_status order_status DEFAULT 'pending_payment',
  production_notes TEXT,
  quality_check_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Order status history - Track all status changes
CREATE TABLE order_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Status change details
  previous_status order_status,
  new_status order_status NOT NULL,
  status_reason VARCHAR(255),
  status_notes TEXT,
  
  -- Processing information
  changed_by_user_id UUID REFERENCES auth.users(id),
  changed_by_system BOOLEAN DEFAULT FALSE,
  processing_duration INTEGER, -- minutes spent in previous status
  
  -- Exception handling
  is_exception BOOLEAN DEFAULT FALSE,
  exception_type VARCHAR(100),
  exception_details TEXT,
  resolution_notes TEXT,
  
  -- Automation tracking
  automated_action_triggered BOOLEAN DEFAULT FALSE,
  automation_type VARCHAR(100),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Customer communication logs - Track all automated and manual communications
CREATE TABLE customer_communication_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES auth.users(id),
  
  -- Communication details
  communication_type communication_type NOT NULL,
  communication_channel communication_channel NOT NULL,
  
  -- Message content
  subject VARCHAR(255),
  message_content TEXT NOT NULL,
  personalized_content JSONB, -- KCT Knowledge API personalization data
  
  -- Delivery tracking
  recipient_email VARCHAR(255),
  recipient_phone VARCHAR(20),
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  
  -- Status and responses
  delivery_status VARCHAR(50) DEFAULT 'pending', -- pending, sent, delivered, failed, bounced
  customer_response TEXT,
  response_received_at TIMESTAMP WITH TIME ZONE,
  
  -- Automation and triggers
  is_automated BOOLEAN DEFAULT TRUE,
  automation_trigger VARCHAR(100),
  scheduled_for TIMESTAMP WITH TIME ZONE,
  
  -- Integration tracking
  external_message_id VARCHAR(255), -- Email service provider ID
  kct_knowledge_api_request_id VARCHAR(255),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Priority queue management - Smart order routing and prioritization
CREATE TABLE order_priority_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Queue management
  queue_position INTEGER NOT NULL,
  priority_score INTEGER NOT NULL, -- Calculated priority score
  queue_type VARCHAR(50) NOT NULL, -- processing, production, shipping, etc.
  
  -- Priority factors
  customer_tier VARCHAR(20), -- vip, premium, standard
  order_value_tier VARCHAR(20), -- high, medium, low
  delivery_urgency INTEGER, -- days until needed
  special_event_type VARCHAR(50), -- wedding, prom, business, etc.
  
  -- Processing assignment
  assigned_to_user_id UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMP WITH TIME ZONE,
  estimated_completion TIMESTAMP WITH TIME ZONE,
  
  -- Queue status
  queue_status VARCHAR(50) DEFAULT 'waiting', -- waiting, assigned, in_progress, completed
  entered_queue_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  started_processing_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Automation flags
  auto_assigned BOOLEAN DEFAULT FALSE,
  requires_manual_review BOOLEAN DEFAULT FALSE,
  escalation_required BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Exception handling records - Track and manage order exceptions
CREATE TABLE order_exceptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Exception details
  exception_type VARCHAR(100) NOT NULL, -- payment_failed, stock_out, quality_issue, etc.
  exception_severity VARCHAR(20) NOT NULL, -- low, medium, high, critical
  exception_description TEXT NOT NULL,
  
  -- Impact assessment
  affects_delivery_date BOOLEAN DEFAULT FALSE,
  estimated_delay_days INTEGER,
  customer_impact_level VARCHAR(20), -- minimal, moderate, significant, severe
  
  -- Resolution tracking
  resolution_status VARCHAR(50) DEFAULT 'open', -- open, in_progress, resolved, escalated
  resolution_notes TEXT,
  resolved_by_user_id UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  
  -- Escalation management
  escalated_to_user_id UUID REFERENCES auth.users(id),
  escalation_reason TEXT,
  escalated_at TIMESTAMP WITH TIME ZONE,
  
  -- Customer communication
  customer_notified BOOLEAN DEFAULT FALSE,
  customer_notification_sent_at TIMESTAMP WITH TIME ZONE,
  customer_acceptance_required BOOLEAN DEFAULT FALSE,
  customer_accepted_at TIMESTAMP WITH TIME ZONE,
  
  -- Prevention and learning
  root_cause_analysis TEXT,
  prevention_measures TEXT,
  similar_exceptions_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Processing time analytics - Track efficiency metrics
CREATE TABLE processing_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Time tracking by stage
  payment_to_processing_minutes INTEGER,
  processing_to_production_minutes INTEGER,
  production_to_quality_minutes INTEGER,
  quality_to_shipping_minutes INTEGER,
  shipping_to_delivery_minutes INTEGER,
  total_fulfillment_minutes INTEGER,
  
  -- Efficiency metrics
  processing_efficiency_score DECIMAL(5,2), -- 0-100 score
  bottleneck_stage VARCHAR(50),
  exceeded_sla BOOLEAN DEFAULT FALSE,
  sla_target_minutes INTEGER,
  
  -- Comparison metrics
  vs_average_performance DECIMAL(5,2), -- percentage vs average
  processor_performance_rank INTEGER,
  similar_orders_avg_time INTEGER,
  
  -- Quality metrics
  quality_issues_count INTEGER DEFAULT 0,
  customer_satisfaction_score INTEGER, -- 1-5 stars
  reprocessing_required BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for optimal performance
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(order_status);
CREATE INDEX idx_orders_priority ON orders(order_priority);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_stripe_payment_intent ON orders(stripe_payment_intent_id);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_source ON order_items(product_source);
CREATE INDEX idx_order_items_stripe_product_id ON order_items(stripe_product_id);
CREATE INDEX idx_order_items_bundle_parent ON order_items(bundle_parent_id);

CREATE INDEX idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX idx_order_status_history_status ON order_status_history(new_status);
CREATE INDEX idx_order_status_history_created_at ON order_status_history(created_at);

CREATE INDEX idx_communication_logs_order_id ON customer_communication_logs(order_id);
CREATE INDEX idx_communication_logs_customer_id ON customer_communication_logs(customer_id);
CREATE INDEX idx_communication_logs_type ON customer_communication_logs(communication_type);
CREATE INDEX idx_communication_logs_sent_at ON customer_communication_logs(sent_at);

CREATE INDEX idx_priority_queue_order_id ON order_priority_queue(order_id);
CREATE INDEX idx_priority_queue_position ON order_priority_queue(queue_position);
CREATE INDEX idx_priority_queue_type ON order_priority_queue(queue_type);
CREATE INDEX idx_priority_queue_status ON order_priority_queue(queue_status);
CREATE INDEX idx_priority_queue_assigned_to ON order_priority_queue(assigned_to_user_id);

CREATE INDEX idx_order_exceptions_order_id ON order_exceptions(order_id);
CREATE INDEX idx_order_exceptions_type ON order_exceptions(exception_type);
CREATE INDEX idx_order_exceptions_status ON order_exceptions(resolution_status);
CREATE INDEX idx_order_exceptions_severity ON order_exceptions(exception_severity);

CREATE INDEX idx_processing_analytics_order_id ON processing_analytics(order_id);
CREATE INDEX idx_processing_analytics_efficiency ON processing_analytics(processing_efficiency_score);
CREATE INDEX idx_processing_analytics_created_at ON processing_analytics(created_at);

-- Create triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_items_updated_at BEFORE UPDATE ON order_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_communication_logs_updated_at BEFORE UPDATE ON customer_communication_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_priority_queue_updated_at BEFORE UPDATE ON order_priority_queue
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_exceptions_updated_at BEFORE UPDATE ON order_exceptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_processing_analytics_updated_at BEFORE UPDATE ON processing_analytics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to generate unique order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    order_number TEXT;
    counter INTEGER;
BEGIN
    -- Generate order number format: KCT-YYYYMMDD-####
    SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 13) AS INTEGER)), 0) + 1
    INTO counter
    FROM orders
    WHERE order_number LIKE 'KCT-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-%';
    
    order_number := 'KCT-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(counter::TEXT, 4, '0');
    
    RETURN order_number;
END;
$$ LANGUAGE plpgsql;

-- Create function to automatically assign order numbers
CREATE OR REPLACE FUNCTION assign_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL THEN
        NEW.order_number := generate_order_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER assign_order_number_trigger BEFORE INSERT ON orders
    FOR EACH ROW EXECUTE FUNCTION assign_order_number();

-- Create RLS policies for secure access
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_communication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_priority_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_analytics ENABLE ROW LEVEL SECURITY;

-- Admin users can access all records
CREATE POLICY "Admin access" ON orders FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "Admin access" ON order_items FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "Admin access" ON order_status_history FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "Admin access" ON customer_communication_logs FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "Admin access" ON order_priority_queue FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "Admin access" ON order_exceptions FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "Admin access" ON processing_analytics FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

-- Customers can only access their own orders
CREATE POLICY "Customer access" ON orders FOR SELECT USING (customer_id = auth.uid());
CREATE POLICY "Customer access" ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.customer_id = auth.uid())
);
CREATE POLICY "Customer access" ON order_status_history FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_status_history.order_id AND orders.customer_id = auth.uid())
);
CREATE POLICY "Customer access" ON customer_communication_logs FOR SELECT USING (customer_id = auth.uid());

-- Create views for common queries
CREATE VIEW order_summary AS
SELECT 
  o.id,
  o.order_number,
  o.customer_name,
  o.customer_email,
  o.order_status,
  o.order_priority,
  o.total_amount,
  o.created_at,
  o.estimated_delivery_date,
  COUNT(oi.id) as item_count,
  CASE 
    WHEN o.is_rush_order THEN 'Rush'
    WHEN o.is_group_order THEN 'Group'
    ELSE 'Standard'
  END as order_type,
  COALESCE(oq.queue_position, 999) as queue_position,
  CASE 
    WHEN COUNT(oe.id) > 0 THEN TRUE 
    ELSE FALSE 
  END as has_exceptions
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN order_priority_queue oq ON o.id = oq.order_id AND oq.queue_status = 'waiting'
LEFT JOIN order_exceptions oe ON o.id = oe.order_id AND oe.resolution_status IN ('open', 'in_progress')
GROUP BY o.id, oq.queue_position;

CREATE VIEW processing_dashboard AS
SELECT 
  DATE(created_at) as date,
  order_status,
  order_priority,
  COUNT(*) as order_count,
  SUM(total_amount) as total_value,
  AVG(total_amount) as avg_order_value,
  COUNT(CASE WHEN is_rush_order THEN 1 END) as rush_orders,
  COUNT(CASE WHEN is_group_order THEN 1 END) as group_orders
FROM orders
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at), order_status, order_priority
ORDER BY date DESC, order_priority DESC;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Comment on key tables
COMMENT ON TABLE orders IS 'Central order management table for KCT Menswear dual product architecture';
COMMENT ON TABLE order_items IS 'Individual product items within orders, supporting both Stripe and Supabase products';
COMMENT ON TABLE order_status_history IS 'Complete audit trail of all order status changes and processing events';
COMMENT ON TABLE customer_communication_logs IS 'Automated and manual customer communications with delivery tracking';
COMMENT ON TABLE order_priority_queue IS 'Smart queue management for order processing prioritization';
COMMENT ON TABLE order_exceptions IS 'Exception handling and resolution tracking for order issues';
COMMENT ON TABLE processing_analytics IS 'Performance metrics and efficiency analytics for order processing';;