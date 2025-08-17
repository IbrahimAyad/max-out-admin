-- Incremental Order Processing Workflow Enhancements
-- Created: 2025-08-17 20:07:05
-- Purpose: Add missing components for intelligent order management system

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

-- Add missing columns to existing orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_priority order_priority DEFAULT 'normal';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_rush_order BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_group_order BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS group_order_id UUID REFERENCES orders(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS assigned_processor_id UUID REFERENCES auth.users(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_processing_time INTEGER; -- in hours
ALTER TABLE orders ADD COLUMN IF NOT EXISTS actual_processing_time INTEGER; -- in hours
ALTER TABLE orders ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_carrier VARCHAR(50);

-- Add missing columns to existing order_items table
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_source product_source;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS stripe_product_id VARCHAR(255);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS stripe_price_id VARCHAR(255);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS catalog_product_id UUID;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS custom_measurements JSONB;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS is_bundle_item BOOLEAN DEFAULT FALSE;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS bundle_parent_id UUID REFERENCES order_items(id);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS bundle_type VARCHAR(100);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS item_status order_status DEFAULT 'pending_payment';
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS production_notes TEXT;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS quality_check_notes TEXT;

-- Update existing customer_communication_logs table structure if needed
DO $$
BEGIN
    -- Check if the table has the new structure
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customer_communication_logs' 
                   AND column_name = 'communication_type') THEN
        
        -- Add new columns to existing table
        ALTER TABLE customer_communication_logs ADD COLUMN communication_type communication_type;
        ALTER TABLE customer_communication_logs ADD COLUMN communication_channel communication_channel DEFAULT 'email';
        ALTER TABLE customer_communication_logs ADD COLUMN personalized_content JSONB;
        ALTER TABLE customer_communication_logs ADD COLUMN delivery_status VARCHAR(50) DEFAULT 'pending';
        ALTER TABLE customer_communication_logs ADD COLUMN opened_at TIMESTAMP WITH TIME ZONE;
        ALTER TABLE customer_communication_logs ADD COLUMN clicked_at TIMESTAMP WITH TIME ZONE;
        ALTER TABLE customer_communication_logs ADD COLUMN customer_response TEXT;
        ALTER TABLE customer_communication_logs ADD COLUMN response_received_at TIMESTAMP WITH TIME ZONE;
        ALTER TABLE customer_communication_logs ADD COLUMN is_automated BOOLEAN DEFAULT TRUE;
        ALTER TABLE customer_communication_logs ADD COLUMN automation_trigger VARCHAR(100);
        ALTER TABLE customer_communication_logs ADD COLUMN scheduled_for TIMESTAMP WITH TIME ZONE;
        ALTER TABLE customer_communication_logs ADD COLUMN external_message_id VARCHAR(255);
        ALTER TABLE customer_communication_logs ADD COLUMN kct_knowledge_api_request_id VARCHAR(255);
        
    END IF;
END $$;

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

-- Create indexes for optimal performance on new tables
CREATE INDEX idx_orders_priority ON orders(order_priority);
CREATE INDEX idx_orders_rush_order ON orders(is_rush_order);
CREATE INDEX idx_orders_group_order ON orders(is_group_order);
CREATE INDEX idx_orders_assigned_processor ON orders(assigned_processor_id);

CREATE INDEX idx_order_items_product_source ON order_items(product_source);
CREATE INDEX idx_order_items_stripe_product_id ON order_items(stripe_product_id);
CREATE INDEX idx_order_items_bundle_parent ON order_items(bundle_parent_id);
CREATE INDEX idx_order_items_item_status ON order_items(item_status);

CREATE INDEX idx_priority_queue_order_id ON order_priority_queue(order_id);
CREATE INDEX idx_priority_queue_position ON order_priority_queue(queue_position);
CREATE INDEX idx_priority_queue_type ON order_priority_queue(queue_type);
CREATE INDEX idx_priority_queue_status ON order_priority_queue(queue_status);
CREATE INDEX idx_priority_queue_assigned_to ON order_priority_queue(assigned_to_user_id);

CREATE INDEX idx_processing_analytics_order_id ON processing_analytics(order_id);
CREATE INDEX idx_processing_analytics_efficiency ON processing_analytics(processing_efficiency_score);
CREATE INDEX idx_processing_analytics_created_at ON processing_analytics(created_at);

-- Create triggers for automatic timestamp updates on new tables
CREATE TRIGGER update_priority_queue_updated_at BEFORE UPDATE ON order_priority_queue
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_processing_analytics_updated_at BEFORE UPDATE ON processing_analytics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies for secure access on new tables
ALTER TABLE order_priority_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_analytics ENABLE ROW LEVEL SECURITY;

-- Admin users can access all records
CREATE POLICY "Admin access" ON order_priority_queue FOR ALL USING (
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

-- Create function to calculate priority score
CREATE OR REPLACE FUNCTION calculate_priority_score(
  p_order_id UUID
) RETURNS INTEGER AS $$
DECLARE
  base_score INTEGER := 100;
  priority_bonus INTEGER := 0;
  urgency_bonus INTEGER := 0;
  value_bonus INTEGER := 0;
  customer_bonus INTEGER := 0;
  total_score INTEGER;
  order_rec RECORD;
BEGIN
  -- Get order details
  SELECT o.*, c.raw_user_meta_data->>'tier' as customer_tier
  INTO order_rec
  FROM orders o
  LEFT JOIN auth.users c ON o.customer_id = c.id
  WHERE o.id = p_order_id;
  
  -- Priority level bonus
  CASE order_rec.order_priority
    WHEN 'vip_customer' THEN priority_bonus := 500;
    WHEN 'wedding_party' THEN priority_bonus := 400;
    WHEN 'prom_group' THEN priority_bonus := 350;
    WHEN 'rush' THEN priority_bonus := 300;
    WHEN 'urgent' THEN priority_bonus := 200;
    WHEN 'high' THEN priority_bonus := 100;
    WHEN 'normal' THEN priority_bonus := 50;
    WHEN 'low' THEN priority_bonus := 0;
    ELSE priority_bonus := 50;
  END CASE;
  
  -- Rush order bonus
  IF order_rec.is_rush_order THEN
    urgency_bonus := urgency_bonus + 200;
  END IF;
  
  -- Order value bonus
  IF order_rec.total_amount >= 2000 THEN
    value_bonus := 150;
  ELSIF order_rec.total_amount >= 1000 THEN
    value_bonus := 100;
  ELSIF order_rec.total_amount >= 500 THEN
    value_bonus := 50;
  END IF;
  
  -- Customer tier bonus
  CASE order_rec.customer_tier
    WHEN 'vip' THEN customer_bonus := 200;
    WHEN 'premium' THEN customer_bonus := 100;
    WHEN 'standard' THEN customer_bonus := 50;
    ELSE customer_bonus := 25;
  END CASE;
  
  total_score := base_score + priority_bonus + urgency_bonus + value_bonus + customer_bonus;
  
  RETURN total_score;
END;
$$ LANGUAGE plpgsql;

-- Create function to automatically add orders to priority queue
CREATE OR REPLACE FUNCTION add_to_priority_queue()
RETURNS TRIGGER AS $$
DECLARE
  calc_priority_score INTEGER;
  queue_pos INTEGER;
BEGIN
  -- Calculate priority score
  calc_priority_score := calculate_priority_score(NEW.id);
  
  -- Get next queue position
  SELECT COALESCE(MAX(queue_position), 0) + 1
  INTO queue_pos
  FROM order_priority_queue
  WHERE queue_type = 'processing' AND queue_status = 'waiting';
  
  -- Insert into priority queue
  INSERT INTO order_priority_queue (
    order_id,
    queue_position,
    priority_score,
    queue_type,
    customer_tier,
    order_value_tier,
    delivery_urgency,
    special_event_type
  ) VALUES (
    NEW.id,
    queue_pos,
    calc_priority_score,
    'processing',
    CASE 
      WHEN NEW.total_amount >= 2000 THEN 'premium'
      WHEN NEW.total_amount >= 1000 THEN 'standard'
      ELSE 'basic'
    END,
    CASE 
      WHEN NEW.total_amount >= 2000 THEN 'high'
      WHEN NEW.total_amount >= 1000 THEN 'medium'
      ELSE 'low'
    END,
    CASE 
      WHEN NEW.estimated_delivery_date IS NOT NULL 
      THEN EXTRACT(DAY FROM NEW.estimated_delivery_date - CURRENT_DATE)
      ELSE 30
    END,
    CASE 
      WHEN NEW.order_priority IN ('wedding_party', 'prom_group') 
      THEN NEW.order_priority::text
      ELSE 'standard'
    END
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically add new orders to priority queue
CREATE TRIGGER add_order_to_priority_queue
  AFTER INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION add_to_priority_queue();

-- Create views for order management dashboard
CREATE VIEW order_management_dashboard AS
SELECT 
  o.id,
  o.order_number,
  o.customer_name,
  o.customer_email,
  o.status as current_status,
  o.order_priority,
  o.total_amount,
  o.created_at,
  o.estimated_delivery_date,
  o.is_rush_order,
  o.is_group_order,
  COUNT(oi.id) as item_count,
  CASE 
    WHEN o.is_rush_order THEN 'Rush'
    WHEN o.is_group_order THEN 'Group'
    ELSE 'Standard'
  END as order_type,
  COALESCE(oq.queue_position, 999) as queue_position,
  oq.priority_score,
  CASE 
    WHEN COUNT(oe.id) > 0 THEN TRUE 
    ELSE FALSE 
  END as has_exceptions,
  CASE 
    WHEN o.estimated_delivery_date < CURRENT_DATE + INTERVAL '3 days' THEN 'urgent'
    WHEN o.estimated_delivery_date < CURRENT_DATE + INTERVAL '7 days' THEN 'high'
    ELSE 'normal'
  END as delivery_urgency
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN order_priority_queue oq ON o.id = oq.order_id AND oq.queue_status = 'waiting'
LEFT JOIN order_exceptions oe ON o.id = oe.order_id AND oe.resolution_status IN ('open', 'in_progress')
GROUP BY o.id, oq.queue_position, oq.priority_score;

-- Create view for processing performance metrics
CREATE VIEW processing_performance_metrics AS
SELECT 
  DATE_TRUNC('day', o.created_at) as processing_date,
  o.status,
  o.order_priority,
  COUNT(*) as order_count,
  SUM(o.total_amount) as total_value,
  AVG(o.total_amount) as avg_order_value,
  COUNT(CASE WHEN o.is_rush_order THEN 1 END) as rush_orders,
  COUNT(CASE WHEN o.is_group_order THEN 1 END) as group_orders,
  AVG(pa.total_fulfillment_minutes) as avg_fulfillment_time,
  AVG(pa.processing_efficiency_score) as avg_efficiency_score,
  COUNT(CASE WHEN pa.exceeded_sla THEN 1 END) as sla_violations
FROM orders o
LEFT JOIN processing_analytics pa ON o.id = pa.order_id
WHERE o.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', o.created_at), o.status, o.order_priority
ORDER BY processing_date DESC;

-- Create function for intelligent order routing
CREATE OR REPLACE FUNCTION route_order_intelligently(
  p_order_id UUID
) RETURNS TEXT AS $$
DECLARE
  order_rec RECORD;
  routing_decision TEXT;
BEGIN
  -- Get order details with items
  SELECT o.*, 
         COUNT(oi.id) as item_count,
         BOOL_OR(oi.product_source = 'core_stripe') as has_core_products,
         BOOL_OR(oi.product_source = 'catalog_supabase') as has_catalog_products,
         BOOL_OR(oi.is_bundle_item) as has_bundle_items
  INTO order_rec
  FROM orders o
  LEFT JOIN order_items oi ON o.id = oi.order_id
  WHERE o.id = p_order_id
  GROUP BY o.id;
  
  -- Determine routing based on order characteristics
  IF order_rec.is_rush_order OR order_rec.order_priority IN ('urgent', 'rush', 'vip_customer') THEN
    routing_decision := 'express_lane';
  ELSIF order_rec.has_bundle_items OR order_rec.is_group_order THEN
    routing_decision := 'specialized_processing';
  ELSIF order_rec.has_core_products AND order_rec.has_catalog_products THEN
    routing_decision := 'hybrid_fulfillment';
  ELSIF order_rec.has_core_products THEN
    routing_decision := 'stripe_fulfillment';
  ELSIF order_rec.has_catalog_products THEN
    routing_decision := 'catalog_fulfillment';
  ELSE
    routing_decision := 'standard_processing';
  END IF;
  
  -- Update order with routing decision
  UPDATE orders SET 
    internal_notes = COALESCE(internal_notes, '') || 
    E'\nRouting Decision: ' || routing_decision || ' (' || NOW() || ')'
  WHERE id = p_order_id;
  
  RETURN routing_decision;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT ALL ON order_priority_queue TO authenticated;
GRANT ALL ON processing_analytics TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Comment on new tables
COMMENT ON TABLE order_priority_queue IS 'Smart queue management for order processing prioritization with automated routing';
COMMENT ON TABLE processing_analytics IS 'Performance metrics and efficiency analytics for order processing workflow';
