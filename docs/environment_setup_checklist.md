# Environment Setup Checklist for Wedding Party Management System

## Overview
This checklist covers all required configurations in Supabase and EasyPost to support the Wedding Party Management System's three deployed portals:

- **Wedding Admin Dashboard**: `https://9858w2bjznjh.space.minimax.io`
- **Wedding Portal (Couples)**: `https://tkoylj2fx7f5.space.minimax.io`
- **Groomsmen Portal**: `https://qs4j1oh0oweu.space.minimax.io`

---

## 🗄️ SUPABASE CONFIGURATION

### Database Schema & Tables

#### ✅ Core Wedding Tables (Required)
```sql
-- Weddings table
CREATE TABLE weddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_customer_id UUID REFERENCES user_profiles(user_id),
  wedding_date DATE,
  venue_name TEXT,
  venue_address JSONB,
  party_size INTEGER DEFAULT 0,
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'measurements', 'production', 'completed')),
  budget_range TEXT,
  style_preferences JSONB,
  special_requests TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wedding party members
CREATE TABLE wedding_party_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID REFERENCES weddings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(user_id),
  role TEXT NOT NULL CHECK (role IN ('groom', 'best_man', 'groomsman', 'father_groom', 'father_bride')),
  invite_status TEXT DEFAULT 'pending' CHECK (invite_status IN ('pending', 'accepted', 'declined')),
  measurements JSONB,
  outfit_assigned JSONB,
  fitting_scheduled TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wedding invitations
CREATE TABLE wedding_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID REFERENCES weddings(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  invited_name TEXT,
  role TEXT NOT NULL,
  invitation_token TEXT UNIQUE,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'viewed', 'accepted', 'declined')),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE
);

-- Wedding measurements
CREATE TABLE wedding_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_member_id UUID REFERENCES wedding_party_members(id) ON DELETE CASCADE,
  measurements JSONB NOT NULL,
  measurement_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified_by UUID REFERENCES user_profiles(user_id),
  notes TEXT
);
```

#### ✅ Extended User Profiles
```sql
-- Add wedding-specific columns to existing user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS wedding_preferences JSONB,
ADD COLUMN IF NOT EXISTS measurement_history JSONB,
ADD COLUMN IF NOT EXISTS is_wedding_customer BOOLEAN DEFAULT FALSE;
```

### Row Level Security (RLS) Policies

#### ✅ Enable RLS on all wedding tables:
```sql
ALTER TABLE weddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE wedding_party_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE wedding_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE wedding_measurements ENABLE ROW LEVEL SECURITY;
```

#### ✅ Create RLS Policies:
```sql
-- Weddings policies
CREATE POLICY "Users can view their own weddings" ON weddings
  FOR SELECT USING (primary_customer_id = auth.uid());

CREATE POLICY "Users can update their own weddings" ON weddings
  FOR UPDATE USING (primary_customer_id = auth.uid());

CREATE POLICY "Users can create weddings" ON weddings
  FOR INSERT WITH CHECK (primary_customer_id = auth.uid());

-- Wedding party members policies
CREATE POLICY "Users can view party members for their weddings" ON wedding_party_members
  FOR SELECT USING (
    wedding_id IN (
      SELECT id FROM weddings WHERE primary_customer_id = auth.uid()
    ) OR user_id = auth.uid()
  );

CREATE POLICY "Users can update party member info" ON wedding_party_members
  FOR UPDATE USING (user_id = auth.uid());

-- Wedding invitations policies
CREATE POLICY "Users can view invitations for their weddings" ON wedding_invitations
  FOR SELECT USING (
    wedding_id IN (
      SELECT id FROM weddings WHERE primary_customer_id = auth.uid()
    )
  );

-- Admin policies (for staff dashboard)
CREATE POLICY "Admin can view all weddings" ON weddings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
```

### Authentication Configuration

#### ✅ Email Templates (Custom)
- **Wedding Invitation Email**: Custom template for wedding party invitations
- **Measurement Reminder**: Follow-up emails for measurements
- **Fitting Appointment**: Confirmation emails for fittings

#### ✅ Auth Settings
- Enable email confirmations
- Set custom redirect URLs for wedding portals
- Configure session timeout (recommended: 7 days for wedding customers)

### Edge Functions

#### ✅ Required Edge Functions:
1. **`wedding-invitation-sender`**: Handles sending wedding party invitations
2. **`measurement-processor`**: Processes and validates measurement data
3. **`wedding-notifications`**: Manages all wedding-related email notifications
4. **`shipping-calculator`**: Integrates with EasyPost for shipping estimates
5. **`payment-processor`**: Handles wedding-specific Stripe payments

#### ✅ Function Environment Variables:
```
EASYPOST_API_KEY=your_easypost_api_key
STRIPE_SECRET_KEY=your_stripe_secret_key
SENDGRID_API_KEY=your_sendgrid_api_key
WEDDING_BASE_URL=https://tkoylj2fx7f5.space.minimax.io
ADMIN_BASE_URL=https://9858w2bjznjh.space.minimax.io
GROOMSMEN_BASE_URL=https://qs4j1oh0oweu.space.minimax.io
```

### Storage Buckets

#### ✅ Required Buckets:
1. **`wedding-photos`**: Store wedding party photos
2. **`measurement-guides`**: Store measurement instruction PDFs
3. **`style-inspiration`**: Store style reference images

#### ✅ Bucket Policies:
```sql
-- Wedding photos bucket policy
CREATE POLICY "Users can upload wedding photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'wedding-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view wedding photos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'wedding-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

---

## 📦 EASYPOST CONFIGURATION

### API Configuration

#### ✅ API Keys
- **Production API Key**: Configure in Supabase Edge Functions
- **Test API Key**: For development/testing

#### ✅ Webhook Endpoints
Set up the following webhook URLs in your EasyPost dashboard:

1. **Shipment Tracking Updates**:
   - URL: `https://your-supabase-project.functions.supabase.co/shipping-webhook`
   - Events: `tracker.updated`, `tracker.delivered`

2. **Address Verification**:
   - URL: `https://your-supabase-project.functions.supabase.co/address-verification`
   - Events: `address.verified`

#### ✅ Address Verification Settings
- Enable address verification for all wedding party members
- Set verification strictness to "strict" for formal wear deliveries
- Configure international address handling if needed

#### ✅ Shipping Services Configuration

**Domestic Shipping Options**:
- FedEx Priority Overnight (for rush orders)
- FedEx 2Day (standard wedding timeline)
- FedEx Ground (budget option)

**International Shipping** (if applicable):
- FedEx International Priority
- FedEx International Economy

#### ✅ Insurance & Delivery Options
- **Default Insurance**: $500 per package (formal wear value)
- **Signature Required**: Enable for all wedding orders
- **Delivery Confirmation**: Email + SMS notifications

### Business Logic Configuration

#### ✅ Shipping Rules by Timeline
```json
{
  "emergency_rush": {
    "timeline_days": "< 7",
    "service": "FEDEX_PRIORITY_OVERNIGHT",
    "surcharge": 50
  },
  "standard_rush": {
    "timeline_days": "7-14",
    "service": "FEDEX_2_DAY",
    "surcharge": 25
  },
  "standard": {
    "timeline_days": "> 14",
    "service": "FEDEX_GROUND",
    "surcharge": 0
  }
}
```

#### ✅ Wedding-Specific Addresses
Configure address types:
- **Home Address**: Individual party member delivery
- **Venue Address**: Group delivery to wedding venue
- **Store Pickup**: Local pickup option

---

## 🔧 INTEGRATION TESTING CHECKLIST

### Pre-Test Setup

#### ✅ Database Verification
- [ ] All wedding tables created successfully
- [ ] RLS policies active and tested
- [ ] Sample wedding data inserted
- [ ] Foreign key relationships working

#### ✅ Authentication Testing
- [ ] User registration works for all portals
- [ ] Email confirmations sending
- [ ] Role-based access working (admin, couple, groomsman)
- [ ] Session persistence across portals

#### ✅ EasyPost Integration
- [ ] API connection established
- [ ] Address verification working
- [ ] Shipping rate calculation functional
- [ ] Label generation tested
- [ ] Tracking webhook receiving updates

#### ✅ Email System
- [ ] Wedding invitations sending via SendGrid
- [ ] Measurement reminders working
- [ ] Appointment confirmations working
- [ ] Order status updates working

### Functional Testing Areas

#### ✅ Wedding Creation Flow
- [ ] Couple can create new wedding
- [ ] Wedding details save correctly
- [ ] Party member invitations send
- [ ] Invitation acceptance updates database

#### ✅ Measurement Collection
- [ ] Groomsmen can submit measurements
- [ ] Measurements save to database
- [ ] Validation rules working
- [ ] Admin can review/approve measurements

#### ✅ Order Management
- [ ] Orders create for each party member
- [ ] Shipping addresses collect correctly
- [ ] EasyPost calculates shipping costs
- [ ] Payment processing works

#### ✅ Communication System
- [ ] Automated reminders send
- [ ] Status updates notify all parties
- [ ] Emergency contact system works
- [ ] Delivery notifications send

---

## 🚨 CRITICAL ITEMS TO VERIFY BEFORE TESTING

### Must-Have Configurations

1. **Supabase Environment Variables**:
   ```
   SUPABASE_URL=your_project_url
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. **EasyPost API Key**:
   - Verify it's the production key
   - Test with a sample address verification

3. **Database Migrations**:
   - Run all wedding table creation scripts
   - Apply all RLS policies
   - Test with sample data

4. **Edge Function Deployment**:
   - All 5 wedding-related functions deployed
   - Environment variables set correctly
   - Test each function individually

5. **Storage Bucket Access**:
   - All buckets created with proper policies
   - Test file upload/download
   - Verify CORS settings

---

## 📋 NEXT STEPS

Once you've completed all configurations above:

1. **Confirm Checklist Completion**: Let me know which items are done
2. **Initial Smoke Test**: I'll run basic functionality tests
3. **Full System Testing**: Comprehensive end-to-end testing
4. **Performance Optimization**: Based on test results
5. **Go-Live Preparation**: Final preparations for production use

---

*Generated on: 2025-08-18 14:42:52*  
*For: KCT Menswear Wedding Party Management System*