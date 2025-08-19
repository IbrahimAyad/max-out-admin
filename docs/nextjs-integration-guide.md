# Next.js Integration Guide: Enhanced Customer Profile System

## Overview
This guide shows how to integrate the Enhanced Customer Profile System with your existing Next.js/Supabase e-commerce site. The system leverages your existing Supabase infrastructure and authentication.

## Architecture

### Your Existing Setup
- **Frontend**: Next.js/React with Supabase client
- **Backend**: Supabase with Edge Functions
- **Auth**: Supabase Auth (existing)
- **Payments**: Stripe integration
- **Database**: customers table + existing schema

### Profile System Integration
- **Edge Functions**: `profile-management` (already deployed)
- **Database**: `user_profiles` table (unified customer/wedding profiles)
- **Additional Tables**: `menswear_measurements`, `style_profiles`
- **Auth Flow**: Uses your existing Supabase Auth

## Quick Start

### 1. Install Dependencies (if not already installed)
```bash
npm install @supabase/supabase-js
```

### 2. Environment Variables
Your existing `.env.local` should already have:
```env
NEXT_PUBLIC_SUPABASE_URL=https://gvcswimqaxvylgxbklbz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

### 3. Supabase Client Setup
Your existing Supabase client setup works as-is:
```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

## API Integration

### Profile Management API
The `profile-management` Edge Function provides these endpoints:

#### Get Customer Profile
```javascript
const { data, error } = await supabase.functions.invoke('profile-management', {
  body: { action: 'get' }
})

if (data?.success) {
  const profile = data.data
  console.log('Customer profile:', profile)
}
```

#### Update Customer Profile
```javascript
const { data, error } = await supabase.functions.invoke('profile-management', {
  body: { 
    action: 'update',
    profile_data: {
      first_name: 'John',
      last_name: 'Doe',
      phone: '+1234567890',
      // ... other profile fields
    }
  }
})
```

#### Get Size Measurements
```javascript
const { data, error } = await supabase.functions.invoke('profile-management', {
  body: { action: 'get_measurements' }
})

if (data?.success) {
  const measurements = data.data
  console.log('Customer measurements:', measurements)
}
```

#### Save Size Measurements
```javascript
const { data, error } = await supabase.functions.invoke('profile-management', {
  body: { 
    action: 'create_measurements',
    measurements: {
      suit_size: '42R',
      chest: 42,
      waist: 34,
      height: 72,
      weight: 180,
      preferred_fit: 'slim',
      measurement_unit: 'imperial'
    }
  }
})
```

## Authentication Flow

### Using Existing Auth
The profile system integrates seamlessly with your existing Supabase Auth:

```javascript
// Get current user (your existing pattern)
const { data: { user } } = await supabase.auth.getUser()

if (user) {
  // User is authenticated, can call profile functions
  const profile = await getCustomerProfile()
}
```

### Protected API Calls
All profile API calls automatically use the current user's session:
```javascript
async function getCustomerProfile() {
  // Supabase automatically includes auth headers
  const { data, error } = await supabase.functions.invoke('profile-management', {
    body: { action: 'get' }
  })
  
  if (error) {
    console.error('Profile error:', error)
    return null
  }
  
  return data?.data
}
```

## Database Schema

### User Profiles Table
The `user_profiles` table stores comprehensive customer data:

```sql
CREATE TABLE user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  -- ... (see full schema in database)
  
  -- Wedding-specific fields
  is_wedding_customer BOOLEAN DEFAULT FALSE,
  wedding_role TEXT, -- 'groom', 'groomsman', 'wedding_planner', etc.
  wedding_preferences JSONB,
  
  -- E-commerce integration
  stripe_customer_id TEXT, -- Links to your Stripe customers
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
```

### Measurements Table
```sql
CREATE TABLE menswear_measurements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_profile_id UUID REFERENCES user_profiles(id),
  suit_size TEXT,
  chest DECIMAL(4,1),
  waist DECIMAL(4,1),
  height DECIMAL(4,1),
  weight DECIMAL(5,1),
  -- ... (full measurement fields)
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
```

## Integration Examples

### Customer Account Page
Add profile management to your existing customer account:

```javascript
// pages/account/profile.js
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { CustomerProfileForm } from '../../components/CustomerProfileForm'

export default function CustomerProfile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    const { data } = await supabase.functions.invoke('profile-management', {
      body: { action: 'get' }
    })
    
    if (data?.success) {
      setProfile(data.data)
    }
    setLoading(false)
  }

  return (
    <div>
      <h1>My Profile</h1>
      {!loading && (
        <CustomerProfileForm 
          profile={profile} 
          onUpdate={loadProfile}
        />
      )}
    </div>
  )
}
```

### Size Guide Integration
Add size profile to product pages:

```javascript
// components/SizeGuide.js
import { useState } from 'react'
import { SizeProfileModal } from './SizeProfileModal'

export function SizeGuide({ productId }) {
  const [showSizeProfile, setShowSizeProfile] = useState(false)

  return (
    <div>
      <button 
        onClick={() => setShowSizeProfile(true)}
        className="text-blue-600 underline"
      >
        Find My Size
      </button>
      
      {showSizeProfile && (
        <SizeProfileModal 
          onClose={() => setShowSizeProfile(false)}
          productId={productId}
        />
      )}
    </div>
  )
}
```

## Error Handling

### Standard Error Patterns
```javascript
async function safeProfileCall(action, data = {}) {
  try {
    const { data: response, error } = await supabase.functions.invoke('profile-management', {
      body: { action, ...data }
    })
    
    if (error) {
      throw new Error(error.message)
    }
    
    if (!response?.success) {
      throw new Error(response?.error?.message || 'Profile operation failed')
    }
    
    return response.data
  } catch (error) {
    console.error('Profile operation error:', error)
    // Handle error appropriately in your app
    throw error
  }
}
```

## Migration from Customers Table

When we migrate your existing customers to user_profiles:

1. **Preserved Data**: All existing customer data, order history, Stripe IDs
2. **Enhanced Fields**: Size profiles, style preferences, wedding data
3. **Backward Compatibility**: Your existing queries will continue to work
4. **Gradual Transition**: Customers will be prompted to complete their enhanced profiles

## Next Steps

1. Review the React components in `/components/profile/`
2. Test integration with your existing auth flow
3. Customize styling to match your design system
4. Plan customer migration timeline

## Support

The profile system is designed to integrate seamlessly with your existing setup. All Edge Functions are already deployed and ready to use with your current Supabase configuration.