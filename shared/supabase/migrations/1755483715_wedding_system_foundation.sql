-- Migration: wedding_system_foundation
-- Created at: 1755483715

-- Wedding Party Management System Database Foundation
-- Extends existing KCT Menswear infrastructure for comprehensive wedding coordination

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types for wedding system
CREATE TYPE wedding_status AS ENUM (
  'planning',
  'measurements',
  'selection',
  'orders_placed',
  'production',
  'fulfillment',
  'completed',
  'cancelled'
);

CREATE TYPE formality_level AS ENUM (
  'black_tie',
  'formal',
  'semi_formal',
  'cocktail',
  'casual'
);

CREATE TYPE party_member_role AS ENUM (
  'groom',
  'best_man',
  'groomsman',
  'usher',
  'father',
  'family',
  'coordinator'
);

CREATE TYPE invite_status AS ENUM (
  'pending',
  'sent',
  'accepted',
  'declined',
  'expired'
);

CREATE TYPE measurement_status AS ENUM (
  'pending',
  'submitted',
  'confirmed',
  'fitted',
  'finalized'
);

CREATE TYPE outfit_status AS ENUM (
  'pending',
  'selected',
  'confirmed',
  'ordered',
  'completed'
);

CREATE TYPE payment_status AS ENUM (
  'pending',
  'partial',
  'paid',
  'failed',
  'refunded'
);

CREATE TYPE task_status AS ENUM (
  'pending',
  'in_progress',
  'completed',
  'overdue',
  'skipped'
);

CREATE TYPE task_priority AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

CREATE TYPE message_type AS ENUM (
  'announcement',
  'reminder',
  'update',
  'question',
  'urgent'
);

CREATE TYPE measurement_method AS ENUM (
  'self_measured',
  'professional',
  'ai_assisted',
  'fitting_appointment'
);

-- Extend existing user_profiles table for wedding functionality
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS wedding_preferences JSONB,
ADD COLUMN IF NOT EXISTS measurement_history JSONB,
ADD COLUMN IF NOT EXISTS wedding_role TEXT;

-- Core weddings table
CREATE TABLE weddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wedding_code TEXT UNIQUE NOT NULL,
  primary_customer_id UUID REFERENCES user_profiles(user_id),
  partner_customer_id UUID REFERENCES user_profiles(user_id),
  
  -- Wedding details
  wedding_date DATE NOT NULL,
  venue_name TEXT,
  venue_address TEXT,
  venue_city TEXT,
  venue_state TEXT,
  venue_country TEXT DEFAULT 'US',
  guest_count INTEGER,
  
  -- Style preferences
  wedding_theme TEXT,
  formality_level formality_level NOT NULL,
  color_scheme JSONB, -- Array of hex colors with primary/secondary designations
  style_inspiration JSONB, -- Reference images, Pinterest boards, etc.
  
  -- Budget and logistics
  budget_range TEXT,
  total_budget DECIMAL(10,2),
  allocated_menswear_budget DECIMAL(10,2),
  special_instructions TEXT,
  timeline_preferences JSONB,
  
  -- Coordination settings
  requires_rush_service BOOLEAN DEFAULT FALSE,
  group_discount_applied BOOLEAN DEFAULT FALSE,
  coordination_level TEXT DEFAULT 'standard', -- basic, standard, premium, white_glove
  
  -- Status and tracking
  status wedding_status DEFAULT 'planning',
  completion_percentage INTEGER DEFAULT 0,
  current_phase TEXT,
  next_deadline DATE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT valid_wedding_date CHECK (wedding_date > CURRENT_DATE),
  CONSTRAINT valid_completion_percentage CHECK (completion_percentage >= 0 AND completion_percentage <= 100)
);

-- Wedding party members table
CREATE TABLE wedding_party_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wedding_id UUID REFERENCES weddings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(user_id), -- NULL if not yet signed up
  
  -- Personal information
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role party_member_role NOT NULL,
  custom_role_title TEXT, -- For special roles like "Brother of Groom"
  
  -- Invitation management
  invite_code TEXT UNIQUE,
  invite_status invite_status DEFAULT 'pending',
  invited_at TIMESTAMP WITH TIME ZONE,
  invite_expires_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  reminder_count INTEGER DEFAULT 0,
  last_reminder_sent TIMESTAMP WITH TIME ZONE,
  
  -- Progress tracking
  measurements_status measurement_status DEFAULT 'pending',
  outfit_status outfit_status DEFAULT 'pending',
  payment_status payment_status DEFAULT 'pending',
  overall_completion_percentage INTEGER DEFAULT 0,
  
  -- Personal details
  special_requests TEXT,
  dietary_restrictions TEXT,
  accessibility_needs TEXT,
  emergency_contact JSONB,
  
  -- Address information
  address JSONB,
  shipping_preference TEXT DEFAULT 'standard', -- standard, expedited, pickup
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_completion_percentage CHECK (overall_completion_percentage >= 0 AND overall_completion_percentage <= 100)
);

-- Comprehensive measurements table
CREATE TABLE wedding_measurements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  party_member_id UUID REFERENCES wedding_party_members(id) ON DELETE CASCADE,
  
  -- Measurements data
  measurements JSONB NOT NULL, -- All body measurements in structured format
  fit_preferences JSONB, -- Jacket fit (slim, regular, relaxed), trouser fit, etc.
  size_recommendations JSONB, -- AI-recommended sizes for different brands/products
  
  -- Measurement metadata
  measurement_method measurement_method NOT NULL,
  confidence_score DECIMAL(3,2), -- 0.00 to 1.00 confidence in accuracy
  measured_by TEXT, -- Professional tailor, self, family member, etc.
  measurement_location TEXT, -- Store location, home, etc.
  
  -- Validation and review
  requires_fitting BOOLEAN DEFAULT FALSE,
  professional_review_needed BOOLEAN DEFAULT FALSE,
  reviewed_by_professional BOOLEAN DEFAULT FALSE,
  professional_notes TEXT,
  
  -- Version control
  is_current BOOLEAN DEFAULT TRUE,
  version_number INTEGER DEFAULT 1,
  previous_measurement_id UUID REFERENCES wedding_measurements(id),
  
  -- Notes and special considerations
  notes TEXT,
  special_considerations JSONB, -- Posture, body shape notes, alterations history
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT valid_confidence_score CHECK (confidence_score >= 0.00 AND confidence_score <= 1.00)
);

-- Wedding outfit coordination table
CREATE TABLE wedding_outfits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  party_member_id UUID REFERENCES wedding_party_members(id) ON DELETE CASCADE,
  
  -- Outfit composition
  outfit_template_id UUID, -- Reference to curated outfit collections
  jacket_product_id UUID REFERENCES products(id),
  trouser_product_id UUID REFERENCES products(id),
  shirt_product_id UUID REFERENCES products(id),
  vest_product_id UUID REFERENCES products(id),
  tie_product_id UUID REFERENCES products(id),
  pocket_square_product_id UUID REFERENCES products(id),
  cufflinks_product_id UUID REFERENCES products(id),
  shoes_product_id UUID REFERENCES products(id),
  accessories JSONB, -- Additional accessory product IDs and customizations
  
  -- Customizations and details
  customizations JSONB, -- Monograms, alterations, special requests
  sizing_details JSONB, -- Specific sizes for each item
  color_coordination JSONB, -- Color matching details
  style_notes TEXT,
  
  -- Rental vs purchase breakdown
  rental_items JSONB, -- Which items are rental vs purchase with pricing
  purchase_items JSONB,
  total_rental_cost DECIMAL(10,2),
  total_purchase_cost DECIMAL(10,2),
  alterations_cost DECIMAL(10,2),
  total_outfit_cost DECIMAL(10,2),
  
  -- Coordination and approval
  coordination_score DECIMAL(3,2), -- How well it matches the wedding theme (0-1)
  style_consistency_score DECIMAL(3,2), -- Consistency with other party members
  approved_by_couple BOOLEAN DEFAULT FALSE,
  approved_by_member BOOLEAN DEFAULT FALSE,
  approval_notes TEXT,
  
  -- Timeline
  selection_deadline DATE,
  fitting_scheduled_date DATE,
  order_placed_at TIMESTAMP WITH TIME ZONE,
  expected_delivery_date DATE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_coordination_score CHECK (coordination_score >= 0.00 AND coordination_score <= 1.00),
  CONSTRAINT valid_style_consistency_score CHECK (style_consistency_score >= 0.00 AND style_consistency_score <= 1.00)
);

-- Wedding invitation tracking
CREATE TABLE wedding_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wedding_id UUID REFERENCES weddings(id) ON DELETE CASCADE,
  
  -- Invitation details
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role party_member_role NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  custom_message TEXT,
  
  -- Delivery tracking
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  declined_at TIMESTAMP WITH TIME ZONE,
  
  -- Reminder system
  expires_at TIMESTAMP WITH TIME ZONE,
  reminder_count INTEGER DEFAULT 0,
  last_reminder_sent TIMESTAMP WITH TIME ZONE,
  next_reminder_scheduled TIMESTAMP WITH TIME ZONE,
  
  -- Tracking
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wedding timeline and task management
CREATE TABLE wedding_timeline_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wedding_id UUID REFERENCES weddings(id) ON DELETE CASCADE,
  
  -- Task details
  task_name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- measurements, selection, payment, fitting, delivery
  phase TEXT, -- planning, preparation, execution, completion
  
  -- Assignment and scheduling
  assigned_to TEXT, -- 'couple', 'party', 'coordinator', or specific member ID
  assigned_member_id UUID REFERENCES wedding_party_members(id),
  due_date DATE,
  start_date DATE,
  estimated_duration_hours INTEGER,
  
  -- Priority and status
  priority task_priority DEFAULT 'medium',
  status task_status DEFAULT 'pending',
  completion_percentage INTEGER DEFAULT 0,
  
  -- Automation and dependencies
  auto_created BOOLEAN DEFAULT TRUE,
  parent_task_id UUID REFERENCES wedding_timeline_tasks(id),
  dependent_task_ids JSONB, -- Array of task IDs that must complete first
  triggers_tasks JSONB, -- Array of task IDs that this task triggers
  
  -- Reminders and notifications
  reminder_sent BOOLEAN DEFAULT FALSE,
  reminder_schedule JSONB, -- When to send reminders relative to due date
  last_reminder_sent TIMESTAMP WITH TIME ZONE,
  escalation_level INTEGER DEFAULT 0,
  
  -- Progress tracking
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  completion_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_completion_percentage CHECK (completion_percentage >= 0 AND completion_percentage <= 100)
);

-- Wedding communications and messaging
CREATE TABLE wedding_communications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wedding_id UUID REFERENCES weddings(id) ON DELETE CASCADE,
  
  -- Message details
  sender_id UUID REFERENCES user_profiles(user_id),
  sender_type TEXT, -- 'couple', 'party_member', 'coordinator', 'system'
  recipient_ids JSONB, -- Array of user IDs or 'all_party', 'couple_only'
  recipient_types JSONB, -- Array of recipient types for targeting
  
  -- Content
  message_type message_type NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  html_message TEXT,
  attachments JSONB, -- File URLs and metadata
  
  -- Delivery channels
  sent_via JSONB DEFAULT '["email"]', -- email, sms, in_app, push
  email_template_id TEXT,
  
  -- Tracking
  read_by JSONB DEFAULT '{}', -- Object of user_id: timestamp
  replied_to_by JSONB DEFAULT '{}', -- Object of user_id: timestamp
  delivery_status JSONB DEFAULT '{}', -- Object of channel: status
  
  -- Threading
  thread_id UUID,
  reply_to_id UUID REFERENCES wedding_communications(id),
  
  -- Scheduling
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wedding-specific order tracking
CREATE TABLE wedding_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wedding_id UUID REFERENCES weddings(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id), -- Links to existing order system
  
  -- Party member association
  party_member_ids JSONB NOT NULL, -- Array of party member IDs included in this order
  primary_party_member_id UUID REFERENCES wedding_party_members(id),
  
  -- Order characteristics
  order_type TEXT NOT NULL, -- 'group_order', 'individual_order', 'alterations_only', 'rush_order'
  is_group_discount_order BOOLEAN DEFAULT FALSE,
  group_discount_percentage DECIMAL(5,2),
  group_discount_amount DECIMAL(10,2),
  
  -- Payment management
  split_payment_data JSONB, -- Payment splitting information between members
  payment_coordinator_id UUID REFERENCES wedding_party_members(id),
  deposit_collected BOOLEAN DEFAULT FALSE,
  deposit_amount DECIMAL(10,2),
  
  -- Delivery coordination
  delivery_coordination JSONB, -- Multi-address shipping details
  delivery_preference TEXT, -- 'individual', 'group_venue', 'coordinator'
  delivery_address JSONB,
  delivery_contact_id UUID REFERENCES wedding_party_members(id),
  
  -- Timeline
  order_deadline DATE,
  delivery_deadline DATE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wedding analytics and insights
CREATE TABLE wedding_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wedding_id UUID REFERENCES weddings(id) ON DELETE CASCADE,
  
  -- Performance metrics
  total_party_size INTEGER,
  completed_members INTEGER,
  completion_rate DECIMAL(5,2),
  average_days_to_complete_measurements INTEGER,
  average_days_to_select_outfit INTEGER,
  
  -- Financial metrics
  total_revenue DECIMAL(10,2),
  average_member_spend DECIMAL(10,2),
  rental_vs_purchase_ratio DECIMAL(5,2),
  group_discount_savings DECIMAL(10,2),
  
  -- Efficiency metrics
  coordinator_touch_points INTEGER,
  customer_service_interactions INTEGER,
  revision_requests INTEGER,
  time_to_completion_days INTEGER,
  
  -- Quality metrics
  customer_satisfaction_score DECIMAL(3,2), -- 1-5 rating
  net_promoter_score INTEGER, -- -100 to 100
  issue_count INTEGER,
  resolution_time_hours INTEGER,
  
  -- Snapshot date
  snapshot_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create comprehensive indexes for performance
CREATE INDEX idx_weddings_status ON weddings(status);
CREATE INDEX idx_weddings_wedding_date ON weddings(wedding_date);
CREATE INDEX idx_weddings_primary_customer ON weddings(primary_customer_id);
CREATE INDEX idx_weddings_wedding_code ON weddings(wedding_code);
CREATE INDEX idx_weddings_completion ON weddings(completion_percentage);

CREATE INDEX idx_party_members_wedding_id ON wedding_party_members(wedding_id);
CREATE INDEX idx_party_members_user_id ON wedding_party_members(user_id);
CREATE INDEX idx_party_members_role ON wedding_party_members(role);
CREATE INDEX idx_party_members_invite_code ON wedding_party_members(invite_code);
CREATE INDEX idx_party_members_status_combo ON wedding_party_members(measurements_status, outfit_status, payment_status);

CREATE INDEX idx_measurements_member_id ON wedding_measurements(party_member_id);
CREATE INDEX idx_measurements_current ON wedding_measurements(is_current);
CREATE INDEX idx_measurements_method ON wedding_measurements(measurement_method);

CREATE INDEX idx_outfits_member_id ON wedding_outfits(party_member_id);
CREATE INDEX idx_outfits_approval ON wedding_outfits(approved_by_couple, approved_by_member);
CREATE INDEX idx_outfits_coordination_score ON wedding_outfits(coordination_score);

CREATE INDEX idx_invitations_wedding_id ON wedding_invitations(wedding_id);
CREATE INDEX idx_invitations_invite_code ON wedding_invitations(invite_code);
CREATE INDEX idx_invitations_email ON wedding_invitations(email);

CREATE INDEX idx_tasks_wedding_id ON wedding_timeline_tasks(wedding_id);
CREATE INDEX idx_tasks_assigned_member ON wedding_timeline_tasks(assigned_member_id);
CREATE INDEX idx_tasks_due_date ON wedding_timeline_tasks(due_date);
CREATE INDEX idx_tasks_status ON wedding_timeline_tasks(status);
CREATE INDEX idx_tasks_priority ON wedding_timeline_tasks(priority);

CREATE INDEX idx_communications_wedding_id ON wedding_communications(wedding_id);
CREATE INDEX idx_communications_sender ON wedding_communications(sender_id);
CREATE INDEX idx_communications_thread ON wedding_communications(thread_id);

CREATE INDEX idx_wedding_orders_wedding_id ON wedding_orders(wedding_id);
CREATE INDEX idx_wedding_orders_order_id ON wedding_orders(order_id);
CREATE INDEX idx_wedding_orders_primary_member ON wedding_orders(primary_party_member_id);

-- Create update timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_weddings_updated_at BEFORE UPDATE ON weddings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_party_members_updated_at BEFORE UPDATE ON wedding_party_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_measurements_updated_at BEFORE UPDATE ON wedding_measurements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_outfits_updated_at BEFORE UPDATE ON wedding_outfits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON wedding_timeline_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wedding_orders_updated_at BEFORE UPDATE ON wedding_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on all wedding tables
ALTER TABLE weddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE wedding_party_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE wedding_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE wedding_outfits ENABLE ROW LEVEL SECURITY;
ALTER TABLE wedding_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE wedding_timeline_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE wedding_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE wedding_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE wedding_analytics ENABLE ROW LEVEL SECURITY;

-- Comprehensive RLS policies for secure multi-tenant access
-- Admin users can access all wedding data
CREATE POLICY "Admin access to weddings" ON weddings FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

-- Wedding couples can access their own wedding data
CREATE POLICY "Couple access to weddings" ON weddings FOR ALL USING (
  primary_customer_id = auth.uid() OR partner_customer_id = auth.uid()
);

-- Party members can view their wedding data (read-only for most operations)
CREATE POLICY "Party member view weddings" ON weddings FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM wedding_party_members wpm 
    WHERE wpm.wedding_id = weddings.id 
    AND wpm.user_id = auth.uid()
  )
);

-- Admin access to all wedding party members
CREATE POLICY "Admin access to party members" ON wedding_party_members FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

-- Couple access to their wedding party members
CREATE POLICY "Couple access to party members" ON wedding_party_members FOR ALL USING (
  EXISTS (
    SELECT 1 FROM weddings w 
    WHERE w.id = wedding_party_members.wedding_id 
    AND (w.primary_customer_id = auth.uid() OR w.partner_customer_id = auth.uid())
  )
);

-- Party members can access their own data
CREATE POLICY "Member access to own data" ON wedding_party_members FOR ALL USING (
  user_id = auth.uid()
);

-- Similar policies for other tables (abbreviated for space)
CREATE POLICY "Admin access to measurements" ON wedding_measurements FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "Member access to measurements" ON wedding_measurements FOR ALL USING (
  EXISTS (
    SELECT 1 FROM wedding_party_members wpm 
    WHERE wpm.id = wedding_measurements.party_member_id 
    AND wpm.user_id = auth.uid()
  )
);

CREATE POLICY "Couple access to measurements" ON wedding_measurements FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM wedding_party_members wpm 
    JOIN weddings w ON w.id = wpm.wedding_id 
    WHERE wpm.id = wedding_measurements.party_member_id 
    AND (w.primary_customer_id = auth.uid() OR w.partner_customer_id = auth.uid())
  )
);

-- Grant necessary permissions
GRANT ALL ON weddings TO authenticated;
GRANT ALL ON wedding_party_members TO authenticated;
GRANT ALL ON wedding_measurements TO authenticated;
GRANT ALL ON wedding_outfits TO authenticated;
GRANT ALL ON wedding_invitations TO authenticated;
GRANT ALL ON wedding_timeline_tasks TO authenticated;
GRANT ALL ON wedding_communications TO authenticated;
GRANT ALL ON wedding_orders TO authenticated;
GRANT ALL ON wedding_analytics TO authenticated;

-- Grant sequence permissions
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Comments for documentation
COMMENT ON TABLE weddings IS 'Core wedding events with coordination details and status tracking';
COMMENT ON TABLE wedding_party_members IS 'Wedding party members with role assignments and progress tracking';
COMMENT ON TABLE wedding_measurements IS 'Comprehensive measurement data with version control and validation';
COMMENT ON TABLE wedding_outfits IS 'Complete outfit coordination with approval workflows and cost tracking';
COMMENT ON TABLE wedding_timeline_tasks IS 'Automated and manual task management with dependency tracking';
COMMENT ON TABLE wedding_communications IS 'Multi-channel communication system with delivery tracking';
COMMENT ON TABLE wedding_orders IS 'Integration with existing order system for wedding-specific handling';
COMMENT ON TABLE wedding_analytics IS 'Performance metrics and business intelligence for wedding coordination';;