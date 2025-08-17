-- Migration: order_processing_workflow_enhancements
-- Created at: 1755432124

-- Order Processing Workflow Enhancements for KCT Menswear

-- Create order processing queue for intelligent routing
CREATE TABLE IF NOT EXISTS order_processing_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL,
    priority_level TEXT NOT NULL DEFAULT 'standard' CHECK (priority_level IN ('urgent', 'high', 'standard', 'low')),
    queue_status TEXT NOT NULL DEFAULT 'pending' CHECK (queue_status IN ('pending', 'processing', 'completed', 'failed', 'on_hold')),
    product_source TEXT NOT NULL DEFAULT 'catalog' CHECK (product_source IN ('stripe', 'catalog', 'mixed')),
    order_type TEXT NOT NULL DEFAULT 'standard' CHECK (order_type IN ('standard', 'bundle', 'wedding_party', 'group', 'rush', 'custom')),
    assigned_processor UUID,
    estimated_completion_time TIMESTAMP WITH TIME ZONE,
    actual_completion_time TIMESTAMP WITH TIME ZONE,
    processing_notes TEXT,
    retry_count INTEGER DEFAULT 0,
    last_retry_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create customer communication logs
CREATE TABLE IF NOT EXISTS customer_communication_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL,
    customer_id UUID,
    customer_email TEXT NOT NULL,
    communication_type TEXT NOT NULL CHECK (communication_type IN ('order_confirmation', 'payment_confirmation', 'processing_update', 'shipping_notification', 'delivery_confirmation', 'follow_up', 'exception_alert', 'review_request', 'satisfaction_survey')),
    channel TEXT NOT NULL DEFAULT 'email' CHECK (channel IN ('email', 'sms', 'phone', 'push_notification')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'failed', 'bounced')),
    subject TEXT,
    message_content TEXT,
    personalization_data JSONB,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    failed_reason TEXT,
    retry_count INTEGER DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order exceptions for automated issue detection
CREATE TABLE IF NOT EXISTS order_exceptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL,
    exception_type TEXT NOT NULL CHECK (exception_type IN ('payment_failed', 'inventory_shortage', 'shipping_delay', 'fraud_detected', 'customer_issue', 'system_error', 'vendor_issue', 'custom_measurement_required')),
    severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'escalated', 'resolved', 'closed')),
    title TEXT NOT NULL,
    description TEXT,
    resolution_notes TEXT,
    assigned_to UUID,
    auto_resolvable BOOLEAN DEFAULT false,
    resolution_attempted BOOLEAN DEFAULT false,
    customer_notified BOOLEAN DEFAULT false,
    escalation_level INTEGER DEFAULT 1,
    escalated_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    context_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bundle order coordination for complex orders
CREATE TABLE IF NOT EXISTS bundle_order_coordination (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL,
    bundle_type TEXT NOT NULL CHECK (bundle_type IN ('suit', 'tuxedo', 'wedding_party', 'prom_group', 'accessories_set', 'seasonal_collection', 'custom_package')),
    coordination_status TEXT NOT NULL DEFAULT 'pending' CHECK (coordination_status IN ('pending', 'coordinating', 'ready', 'shipped', 'completed')),
    primary_item_id UUID,
    dependent_items JSONB, -- Array of item IDs that must be coordinated
    coordination_requirements JSONB, -- Special requirements for bundle coordination
    special_instructions TEXT,
    estimated_completion_date DATE,
    coordination_priority INTEGER DEFAULT 1,
    requires_custom_fitting BOOLEAN DEFAULT false,
    fitting_scheduled_at TIMESTAMP WITH TIME ZONE,
    fitting_completed_at TIMESTAMP WITH TIME ZONE,
    quality_check_completed BOOLEAN DEFAULT false,
    packaging_requirements JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create wedding party order coordination
CREATE TABLE IF NOT EXISTS wedding_party_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    primary_order_id UUID NOT NULL, -- Groom's order
    event_date DATE NOT NULL,
    event_type TEXT NOT NULL DEFAULT 'wedding' CHECK (event_type IN ('wedding', 'prom', 'formal_event', 'corporate_event')),
    party_size INTEGER NOT NULL DEFAULT 1,
    coordination_status TEXT NOT NULL DEFAULT 'planning' CHECK (coordination_status IN ('planning', 'coordinating', 'fittings_scheduled', 'in_production', 'ready', 'shipped', 'completed')),
    groom_order_id UUID,
    groomsmen_order_ids JSONB, -- Array of order IDs
    wedding_planner_contact JSONB, -- Contact information
    venue_information JSONB,
    special_requirements TEXT,
    fitting_coordinator UUID,
    group_discount_applied NUMERIC DEFAULT 0,
    rush_order_surcharge NUMERIC DEFAULT 0,
    delivery_coordination JSONB, -- Delivery logistics
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order automation rules
CREATE TABLE IF NOT EXISTS order_automation_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rule_name TEXT NOT NULL,
    rule_type TEXT NOT NULL CHECK (rule_type IN ('priority_assignment', 'routing', 'communication', 'exception_handling', 'escalation')),
    conditions JSONB NOT NULL, -- Rule conditions in JSON format
    actions JSONB NOT NULL, -- Actions to take when conditions are met
    is_active BOOLEAN DEFAULT true,
    execution_order INTEGER DEFAULT 1,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    last_executed_at TIMESTAMP WITH TIME ZONE,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order processing metrics for analytics
CREATE TABLE IF NOT EXISTS order_processing_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    metric_date DATE NOT NULL,
    total_orders_processed INTEGER DEFAULT 0,
    average_processing_time_minutes INTEGER DEFAULT 0,
    exception_count INTEGER DEFAULT 0,
    automated_resolutions INTEGER DEFAULT 0,
    manual_interventions INTEGER DEFAULT 0,
    customer_satisfaction_score NUMERIC,
    on_time_delivery_rate NUMERIC,
    bundle_orders_processed INTEGER DEFAULT 0,
    wedding_party_orders_processed INTEGER DEFAULT 0,
    rush_orders_processed INTEGER DEFAULT 0,
    stripe_orders_processed INTEGER DEFAULT 0,
    catalog_orders_processed INTEGER DEFAULT 0,
    mixed_orders_processed INTEGER DEFAULT 0,
    metrics_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_order_processing_queue_status ON order_processing_queue(queue_status);
CREATE INDEX IF NOT EXISTS idx_order_processing_queue_priority ON order_processing_queue(priority_level);
CREATE INDEX IF NOT EXISTS idx_order_processing_queue_order_id ON order_processing_queue(order_id);
CREATE INDEX IF NOT EXISTS idx_customer_communication_order_id ON customer_communication_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_customer_communication_status ON customer_communication_logs(status);
CREATE INDEX IF NOT EXISTS idx_customer_communication_type ON customer_communication_logs(communication_type);
CREATE INDEX IF NOT EXISTS idx_order_exceptions_order_id ON order_exceptions(order_id);
CREATE INDEX IF NOT EXISTS idx_order_exceptions_status ON order_exceptions(status);
CREATE INDEX IF NOT EXISTS idx_order_exceptions_severity ON order_exceptions(severity);
CREATE INDEX IF NOT EXISTS idx_bundle_coordination_order_id ON bundle_order_coordination(order_id);
CREATE INDEX IF NOT EXISTS idx_wedding_party_primary_order ON wedding_party_orders(primary_order_id);
CREATE INDEX IF NOT EXISTS idx_wedding_party_event_date ON wedding_party_orders(event_date);

-- Add constraints to link with existing tables (without foreign keys per best practice)
COMMENT ON TABLE order_processing_queue IS 'Intelligent order routing and priority queue management';
COMMENT ON TABLE customer_communication_logs IS 'Automated customer communication tracking and personalization';
COMMENT ON TABLE order_exceptions IS 'Exception detection and automated resolution tracking';
COMMENT ON TABLE bundle_order_coordination IS 'Complex bundle order coordination and fulfillment';
COMMENT ON TABLE wedding_party_orders IS 'Wedding party and group order coordination';
COMMENT ON TABLE order_automation_rules IS 'Configurable automation rules for order processing';
COMMENT ON TABLE order_processing_metrics IS 'Analytics and performance metrics for order processing';;