# Wedding System Frontend Setup Guide

**Date:** 2025-08-18  
**System Status:** V1 - Basic Implementation Ready  
**Frontend Integration:** Ready for Setup  

## Overview

This guide provides everything needed to set up the wedding system frontend. The backend infrastructure is deployed and ready, with basic functionality available for initial frontend integration.

## Backend Infrastructure Status

### ✅ Deployed & Ready

**Supabase Project:** `gvcswimqaxvylgxbklbz.supabase.co`

#### Database Tables
- `weddings` - Core wedding information
- `wedding_party_members` - Party member details
- `user_profiles` - User account management
- `wedding_invitations` - Invitation tracking
- All tables have Row Level Security (RLS) enabled

#### Storage Buckets
- `wedding-photos` - Wedding and party photos
- `measurement-guides` - Fitting and measurement resources
- `style-inspiration` - Design and style references
- All buckets configured with public access policies

#### Edge Functions (Backend APIs)
1. **`wedding-invitation-sender`**
   - URL: `https://gvcswimqaxvylgxbklbz.supabase.co/functions/v1/wedding-invitation-sender`
   - Purpose: Send wedding invitations via email/SMS
   - Status: ✅ Deployed

2. **`measurement-processor`**
   - URL: `https://gvcswimqaxvylgxbklbz.supabase.co/functions/v1/measurement-processor`
   - Purpose: Process and store measurement data
   - Status: ✅ Deployed

3. **`wedding-notifications`**
   - URL: `https://gvcswimqaxvylgxbklbz.supabase.co/functions/v1/wedding-notifications`
   - Purpose: Send real-time wedding updates
   - Status: ✅ Deployed

4. **`shipping-calculator`**
   - URL: `https://gvcswimqaxvylgxbklbz.supabase.co/functions/v1/shipping-calculator`
   - Purpose: Calculate shipping costs via EasyPost
   - Status: ✅ Deployed

5. **`payment-processor`**
   - URL: `https://gvcswimqaxvylgxbklbz.supabase.co/functions/v1/payment-processor`
   - Purpose: Handle wedding-related payments
   - Status: ✅ Deployed

6. **`easypost-webhook`**
   - URL: `https://gvcswimqaxvylgxbklbz.supabase.co/functions/v1/easypost-webhook`
   - Purpose: Receive EasyPost shipping updates
   - Status: ✅ Deployed
   - Webhook Secret: `kct-easypost-webhook-secret-2025`

### ⚠️ Known Issues (V2 Features)

**`wedding-management` Function**
- **Status:** Experiencing HTTP 500 errors
- **Impact:** Wedding code authentication not working
- **Workaround:** Basic wedding access will be implemented
- **Resolution:** Scheduled for V2 with complete architecture

## Frontend Integration Requirements

### Supabase Client Setup

```typescript
// supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gvcswimqaxvylgxbklbz.supabase.co'
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY' // Get from Supabase dashboard

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### Essential API Endpoints

#### Wedding Authentication (Temporary V1 Implementation)
```typescript
// Basic wedding code validation
const validateWeddingCode = async (weddingCode: string) => {
  try {
    const { data, error } = await supabase
      .from('weddings')
      .select('*')
      .eq('wedding_code', weddingCode)
      .single()
    
    if (error) throw error
    return { success: true, wedding: data }
  } catch (error) {
    return { success: false, error: error.message }
  }
}
```

#### Party Member Management
```typescript
// Get wedding party members
const getWeddingPartyMembers = async (weddingId: string) => {
  const { data, error } = await supabase
    .from('wedding_party_members')
    .select('*')
    .eq('wedding_id', weddingId)
  
  return { data, error }
}

// Add party member
const addPartyMember = async (memberData: any) => {
  const { data, error } = await supabase
    .from('wedding_party_members')
    .insert([memberData])
    .select()
  
  return { data, error }
}
```

#### File Upload (Wedding Photos)
```typescript
// Upload to wedding-photos bucket
const uploadWeddingPhoto = async (file: File, fileName: string) => {
  const { data, error } = await supabase.storage
    .from('wedding-photos')
    .upload(fileName, file)
  
  if (error) return { success: false, error }
  
  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('wedding-photos')
    .getPublicUrl(fileName)
  
  return { success: true, url: publicUrl }
}
```

### Backend API Calls

#### Send Invitations
```typescript
const sendWeddingInvitations = async (invitationData: any) => {
  const response = await fetch(
    'https://gvcswimqaxvylgxbklbz.supabase.co/functions/v1/wedding-invitation-sender',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`
      },
      body: JSON.stringify(invitationData)
    }
  )
  
  return await response.json()
}
```

#### Process Measurements
```typescript
const submitMeasurements = async (measurementData: any) => {
  const response = await fetch(
    'https://gvcswimqaxvylgxbklbz.supabase.co/functions/v1/measurement-processor',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`
      },
      body: JSON.stringify(measurementData)
    }
  )
  
  return await response.json()
}
```

#### Calculate Shipping
```typescript
const calculateShipping = async (shippingInfo: any) => {
  const response = await fetch(
    'https://gvcswimqaxvylgxbklbz.supabase.co/functions/v1/shipping-calculator',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`
      },
      body: JSON.stringify(shippingInfo)
    }
  )
  
  return await response.json()
}
```

## Test Data Available

### Wedding Codes for Testing
- `WED-MEGNH86X-EI39` (Note: Currently affected by V2 issue)
- `WED-MEGICOFY-66ZI` (Note: Currently affected by V2 issue)

### Sample Wedding Data Structure
```typescript
interface Wedding {
  id: string
  wedding_code: string
  couple_names: {
    bride: string
    groom: string
  }
  wedding_date: string
  venue_info: {
    name: string
    address: string
    city: string
    state: string
    zip: string
  }
  status: 'active' | 'completed' | 'cancelled'
  created_at: string
}

interface WeddingPartyMember {
  id: string
  wedding_id: string
  member_name: string
  role: 'bride' | 'groom' | 'bridesmaid' | 'groomsman' | 'parent' | 'other'
  email: string
  phone: string
  measurements: object
  permissions: object
  created_at: string
}
```

## Environment Variables Needed

```env
# Add to your .env.local file
NEXT_PUBLIC_SUPABASE_URL=https://gvcswimqaxvylgxbklbz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## Current Limitations & Workarounds

### V1 Limitations
1. **Wedding Code Authentication:** Complex party management features not available
2. **Advanced Permissions:** Role-based access control is simplified
3. **Workflow Automation:** Advanced invitation workflows deferred to V2

### Recommended V1 Frontend Approach
1. **Focus on Core Features:** Wedding information display, basic party member management
2. **Direct Database Access:** Use Supabase client for basic CRUD operations
3. **File Management:** Utilize storage buckets for photos and documents
4. **Simple Authentication:** Basic wedding code validation without complex roles

## Next Steps

1. **Get Supabase Keys:** Access your Supabase dashboard to get the anon key
2. **Set Up Client:** Implement Supabase client in your frontend
3. **Start with Basic Features:** Wedding information display and file uploads
4. **Test Gradually:** Begin with simple database queries before complex workflows
5. **Plan V2 Integration:** Prepare for enhanced features in the next version

## Support & Troubleshooting

- **Database Issues:** Check RLS policies are properly configured
- **Storage Issues:** Verify bucket permissions and public access
- **API Errors:** Use browser dev tools to inspect network requests
- **V2 Features:** Refer to `v2_wedding_management_issues.md` for known limitations

---

**Ready for Frontend Development!** The backend infrastructure is deployed and most features are functional. Start with basic wedding information display and gradually add more complex features as needed.