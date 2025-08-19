# KCT Ecosystem - Shared Utilities and Helper Functions

## Overview

This document covers the shared utilities, helper functions, and API management patterns used across the KCT ecosystem. The utilities provide consistent interfaces for authentication, profile management, database operations, and business logic.

## Directory Structure

```
/workspace/kct-ecosystem-monorepo/shared/utils/
├── unified-auth.ts      # Unified authentication system
├── profile-api.ts       # Profile management utilities
└── index.ts            # Utility exports (future)
```

## Core Utility Modules

### 1. Unified Authentication System (`unified-auth.ts`)

The unified authentication system provides seamless authentication bridging between all portals in the KCT ecosystem.

#### Configuration

```typescript
const supabaseUrl = 'https://gvcswimqaxvylgxbklbz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

#### Core Interfaces

```typescript
export interface UnifiedAuthResponse {
  success: boolean
  data?: {
    user: any
    session: any
    profile: any
    wedding?: any
    invitation?: any
    wedding_code?: string
    invite_code?: string
    access_levels?: any
    is_new_user?: boolean
  }
  error?: {
    code: string
    message: string
  }
}

export interface SessionInfo {
  user_id: string
  profile: any
  access_levels: {
    enhanced_profile: boolean
    couples_portal: boolean
    groomsmen_portal: boolean
    admin_portal: boolean
  }
  couple_wedding: any
  party_member_data: any
  portal_context: {
    current_portal: string
    available_portals: string[]
    primary_role: string
  }
}
```

#### Authentication Methods

**Wedding Code Authentication (Couples Portal)**

```typescript
// Validates wedding code and authenticates/creates user account
await unifiedAuthAPI.authenticateWithWeddingCode(
  weddingCode: string,
  email: string,
  password: string,
  userData?: any
): Promise<UnifiedAuthResponse>

// Example usage
const result = await unifiedAuthAPI.authenticateWithWeddingCode(
  'WED-2024-001',
  'bride@example.com',
  'password123',
  { first_name: 'Jane', last_name: 'Doe' }
)
```

**Invitation Code Authentication (Groomsmen Portal)**

```typescript
// Validates invitation code and authenticates/creates user account
await unifiedAuthAPI.authenticateWithInvitation(
  inviteCode: string,
  email: string,
  password: string,
  userData?: any
): Promise<UnifiedAuthResponse>

// Example usage
const result = await unifiedAuthAPI.authenticateWithInvitation(
  'INV-2024-GRM-001',
  'groomsman@example.com',
  'password123',
  { first_name: 'John', last_name: 'Smith' }
)
```

**Traditional Email/Password Authentication**

```typescript
// Standard Supabase authentication for existing users
await unifiedAuthAPI.signInWithEmail(
  email: string,
  password: string
): Promise<UnifiedAuthResponse>

// Sign up with email/password
await unifiedAuthAPI.signUpWithEmail(
  email: string,
  password: string,
  metadata?: any
): Promise<UnifiedAuthResponse>
```

#### Session Management

**Cross-Portal Session Creation**

```typescript
// Create session that works across all wedding portals
await unifiedAuthAPI.createCrossPortalSession(
  userId: string,
  portalType: string
): Promise<{ sessionInfo: SessionInfo }>

// Example usage
const sessionInfo = await unifiedAuthAPI.createCrossPortalSession(
  'user-123',
  'couples_portal'
)
```

**Portal Access Validation**

```typescript
// Check if user has access to specific portal
await unifiedAuthAPI.validatePortalAccess(
  userId: string,
  portalName: string
): Promise<{ hasAccess: boolean; accessReason: string }>

// Example usage
const access = await unifiedAuthAPI.validatePortalAccess(
  'user-123',
  'admin_portal'
)
```

**Portal Context Switching**

```typescript
// Change user context when switching between portals
await unifiedAuthAPI.switchPortalContext(
  userId: string,
  targetPortal: string,
  contextData?: any
): Promise<any>
```

#### Profile Data Synchronization

**Profile Data Sync**

```typescript
// Synchronize user profile data across all portals
await unifiedAuthAPI.syncProfileData(
  userId: string,
  profileData?: any,
  syncTarget?: string
): Promise<any>

// Example usage
await unifiedAuthAPI.syncProfileData(
  'user-123',
  { first_name: 'Updated Name', phone: '555-0123' },
  'all_portals'
)
```

**Measurement Data Sync**

```typescript
// Synchronize measurement data across wedding and profile systems
await unifiedAuthAPI.syncMeasurementData(
  userId: string,
  measurementData: any,
  syncTarget?: string
): Promise<any>

// Example usage
await unifiedAuthAPI.syncMeasurementData(
  'user-123',
  { chest: 42, waist: 34, height: 72 },
  'wedding_portal'
)
```

#### Validation Utilities

**Wedding Code Validation**

```typescript
// Check if wedding code is valid before authentication
await unifiedAuthAPI.validateWeddingCode(
  weddingCode: string
): Promise<UnifiedAuthResponse>
```

**Invitation Code Validation**

```typescript
// Check if invitation code is valid before authentication
await unifiedAuthAPI.validateInvitationCode(
  inviteCode: string
): Promise<UnifiedAuthResponse>
```

#### Migration Utilities

```typescript
// Generate migration report for accounts needing unified system migration
await unifiedAuthAPI.migration.generateReport(): Promise<any>

// Migrate existing wedding portal accounts to unified system
await unifiedAuthAPI.migration.migrateAccounts(accounts: any[]): Promise<any>
```

### 2. Profile Management API (`profile-api.ts`)

Comprehensive profile management utilities for handling user profiles, measurements, and style preferences.

#### Core Interfaces

**User Profile Interface**

```typescript
export interface UserProfile {
  id?: string
  user_id?: string
  email: string
  display_name?: string
  first_name?: string
  last_name?: string
  phone?: string
  date_of_birth?: string
  gender?: string
  address_line_1?: string
  address_line_2?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
  total_orders: number
  total_spent: number
  average_order_value: number
  lifetime_value: number
  preferred_categories?: string[]
  customer_segment: string
  account_status: string
  acquisition_source?: string
  notes?: string
  last_order_date?: string
  customer_tier: string
  engagement_score: number
  repeat_customer: boolean
  vip_status: boolean
  primary_occasion?: string
  first_purchase_date?: string
  last_purchase_date?: string
  days_since_last_purchase?: number
  tags?: string
  shipping_address?: any
  migrated_from_customers_id?: string
  full_name?: string
  size_profile: any
  notification_preferences: NotificationPreferences
  saved_addresses: any[]
  saved_payment_methods: any[]
  wishlist_items: any[]
  style_preferences: any
  measurements: any
  onboarding_completed: boolean
  email_verified: boolean
  is_wedding_customer: boolean
  wedding_preferences?: any
  measurement_history?: any
  wedding_role?: string
  created_at: string
  updated_at: string
}
```

**Measurement Interface**

```typescript
export interface MenswearMeasurement {
  id?: string
  user_profile_id?: string
  suit_size?: string
  chest?: number
  waist?: number
  inseam?: number
  sleeve?: number
  neck?: number
  shoulder_width?: number
  jacket_length?: number
  trouser_rise?: number
  height?: number
  weight?: number
  shoe_size?: number
  hips?: number
  thigh?: number
  bicep?: number
  forearm?: number
  wrist?: number
  preferred_fit: 'slim' | 'regular' | 'relaxed'
  measurement_unit: 'imperial' | 'metric'
  notes?: string
  last_measured?: string
  measured_by: 'self' | 'professional'
  measurement_accuracy: 'estimated' | 'professional' | 'tailored'
  is_active: boolean
  created_at?: string
  updated_at?: string
}
```

**Style Profile Interface**

```typescript
export interface StyleProfile {
  id?: string
  user_profile_id?: string
  customer_id?: string
  body_type?: string
  style_personality?: string
  color_preferences: string[]
  fit_preferences: any
  size_preferences: any
  ai_insights: any
  lifestyle_preferences: any
  occasion_preferences: any
  budget_preferences: any
  brand_preferences: string[]
  fabric_preferences: string[]
  pattern_preferences: string[]
  style_goals: string[]
  inspiration_sources: string[]
  seasonal_preferences: any
  recommendation_history: any[]
  last_style_update: string
  created_at?: string
  updated_at?: string
}
```

#### API Methods

**Profile Management**

```typescript
// Get current user's profile
const profile = await ProfileAPI.getProfile(): Promise<UserProfile | null>

// Update user profile
const updatedProfile = await ProfileAPI.updateProfile(
  profileData: Partial<UserProfile>
): Promise<UserProfile | null>

// Example usage
const profile = await ProfileAPI.getProfile()
if (profile) {
  const updated = await ProfileAPI.updateProfile({
    first_name: 'John',
    last_name: 'Doe',
    phone: '555-0123'
  })
}
```

**Measurement Management**

```typescript
// Get user's size measurements
const measurements = await ProfileAPI.getMeasurements(): Promise<MenswearMeasurement | null>

// Save user's size measurements
const savedMeasurements = await ProfileAPI.saveMeasurements(
  measurements: Partial<MenswearMeasurement>
): Promise<MenswearMeasurement | null>

// Example usage
const newMeasurements = await ProfileAPI.saveMeasurements({
  chest: 42,
  waist: 34,
  height: 72,
  weight: 180,
  preferred_fit: 'slim',
  measurement_unit: 'imperial',
  measured_by: 'self'
})
```

**Style Profile Management**

```typescript
// Get user's style profile
const styleProfile = await ProfileAPI.getStyleProfile(): Promise<StyleProfile | null>

// Save user's style profile
const savedStyleProfile = await ProfileAPI.saveStyleProfile(
  styleData: Partial<StyleProfile>
): Promise<StyleProfile | null>

// Get style recommendations for user
const recommendations = await ProfileAPI.getRecommendations(): Promise<any[] | null>
```

**Authentication Utilities**

```typescript
// Check if user is authenticated
const isAuth = await ProfileAPI.isAuthenticated(): Promise<boolean>

// Get current authenticated user
const user = await ProfileAPI.getCurrentUser()
```

#### Profile Utility Functions

**Completion Percentage Calculation**

```typescript
// Calculate profile completion percentage
const completionPercentage = profileUtils.calculateCompletionPercentage(
  profile: UserProfile | null
): number

// Example usage
const profile = await ProfileAPI.getProfile()
const completion = profileUtils.calculateCompletionPercentage(profile)
console.log(`Profile is ${completion}% complete`)
```

**Display Name Formatting**

```typescript
// Format display name from profile data
const displayName = profileUtils.getDisplayName(
  profile: UserProfile | null
): string

// Example usage
const profile = await ProfileAPI.getProfile()
const name = profileUtils.getDisplayName(profile)
// Returns: "John Doe", "John", or email prefix
```

**Measurement Validation**

```typescript
// Check if measurements are complete
const isComplete = profileUtils.areMeasurementsComplete(
  measurements: MenswearMeasurement | null
): boolean

// Format measurements for display
const formatted = profileUtils.formatMeasurement(
  value: number | undefined,
  unit: 'imperial' | 'metric',
  type: 'length' | 'weight'
): string

// Example usage
const measurements = await ProfileAPI.getMeasurements()
const isComplete = profileUtils.areMeasurementsComplete(measurements)
const chestSize = profileUtils.formatMeasurement(42, 'imperial', 'length') // "42""
```

## Admin Hub Utilities

### Admin Hub API Functions

Located in individual application's lib directories, these utilities provide admin-specific functionality:

```typescript
// Dashboard overview data
const overview = await adminHubAPI.getDashboardOverview()

// Notification management
const notifications = await adminHubAPI.getNotifications({
  limit: 10,
  priority: 'high',
  unread_only: true
})

// Mark notifications as read
await adminHubAPI.markNotificationRead(notificationId)
await adminHubAPI.markAllNotificationsRead()

// Quick statistics
const stats = await adminHubAPI.getQuickStats()

// Recent activity
const activity = await adminHubAPI.getRecentActivity()
```

### Wedding Management API

```typescript
// Wedding CRUD operations
const wedding = await weddingAPI.createWedding(weddingData)
const allWeddings = await weddingAPI.getAllWeddings(filters)
const wedding = await weddingAPI.getWedding(weddingId)
const updated = await weddingAPI.updateWedding(weddingId, updateData)

// Wedding analytics
const analytics = await weddingAPI.getWeddingAnalytics(filters)

// Party member management
await weddingAPI.invitePartyMember(memberData)
const members = await weddingAPI.getPartyMembers(weddingId)
await weddingAPI.updatePartyMember(memberId, updateData)

// Communication
await weddingAPI.sendMessage(weddingId, messageData)
const messages = await weddingAPI.getMessages(weddingId)
```

## API Response Patterns

### Standard Response Format

All APIs use a consistent response format:

```typescript
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
}

// Usage pattern
try {
  const { data, error } = await supabase.functions.invoke('function-name', {
    body: { action: 'action_name', ...params }
  })
  
  if (error) throw error
  
  const response = data as ApiResponse<ExpectedType>
  
  if (!response.success) {
    throw new Error(response.error?.message || 'Operation failed')
  }
  
  return response.data
} catch (error) {
  console.error('API error:', error)
  throw error
}
```

### Error Handling Patterns

**Graceful Error Handling**

```typescript
// Pattern for operations that should not fail silently
async function safeApiCall<T>(apiFunction: () => Promise<T>): Promise<T | null> {
  try {
    return await apiFunction()
  } catch (error) {
    console.error('API call failed:', error)
    return null
  }
}

// Usage
const profile = await safeApiCall(() => ProfileAPI.getProfile())
if (profile) {
  // Handle successful case
} else {
  // Handle error case
}
```

**Fallback Patterns**

```typescript
// Pattern for APIs with fallback data
async function getDataWithFallback() {
  try {
    const { data, error } = await supabase.functions.invoke('api-endpoint')
    if (error) throw error
    return data
  } catch (error) {
    console.error('API error:', error)
    // Return fallback/mock data
    return {
      data: {
        total_orders: 0,
        pending_orders: 0,
        revenue_today: 0,
        active_customers: 0
      }
    }
  }
}
```

## Supabase Configuration Patterns

### Client Configuration

**Standard Client Setup**

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gvcswimqaxvylgxbklbz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

// Regular client for standard operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'kct-auth',
    detectSessionInUrl: false
  }
})
```

**Admin Client Setup**

```typescript
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

// Admin client with service role for admin dashboard operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'kct-admin-auth',
    detectSessionInUrl: false
  }
})
```

### Real-time Subscriptions

**Notification Subscriptions**

```typescript
// Real-time notifications subscription
export const subscribeToNotifications = (callback: (notification: any) => void) => {
  return supabase
    .channel('admin_notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'admin_notifications'
      },
      callback
    )
    .subscribe()
}

// Usage
const subscription = subscribeToNotifications((notification) => {
  console.log('New notification:', notification)
  // Handle notification
})

// Cleanup
subscription.unsubscribe()
```

## Data Transformation Utilities

### Common Transformation Patterns

**Date Formatting**

```typescript
export const dateUtils = {
  formatDate: (date: string | Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  },
  
  formatDateTime: (date: string | Date): string => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  },
  
  isRecent: (date: string | Date, daysThreshold = 7): boolean => {
    const dateObj = new Date(date)
    const now = new Date()
    const diffInDays = (now.getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24)
    return diffInDays <= daysThreshold
  }
}
```

**Currency Formatting**

```typescript
export const currencyUtils = {
  formatCurrency: (amount: number, currency = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  },
  
  formatCents: (cents: number): string => {
    return currencyUtils.formatCurrency(cents / 100)
  }
}
```

**Text Utilities**

```typescript
export const textUtils = {
  truncate: (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength - 3) + '...'
  },
  
  capitalize: (text: string): string => {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
  },
  
  slugify: (text: string): string => {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }
}
```

## Validation Utilities

### Form Validation Patterns

**Zod Schema Patterns**

```typescript
import { z } from 'zod'

// Standard user profile schema
export const userProfileSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  address_line_1: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postal_code: z.string().optional()
})

// Measurement validation schema
export const measurementSchema = z.object({
  chest: z.number().min(30).max(60),
  waist: z.number().min(28).max(50),
  height: z.number().min(60).max(84),
  weight: z.number().min(100).max(300),
  preferred_fit: z.enum(['slim', 'regular', 'relaxed']),
  measurement_unit: z.enum(['imperial', 'metric'])
})
```

**Custom Validation Functions**

```typescript
export const validationUtils = {
  isValidPhoneNumber: (phone: string): boolean => {
    const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/
    return phoneRegex.test(phone)
  },
  
  isValidPostalCode: (postalCode: string, country = 'US'): boolean => {
    const patterns = {
      US: /^\d{5}(-\d{4})?$/,
      CA: /^[A-Z]\d[A-Z] \d[A-Z]\d$/,
      UK: /^[A-Z]{1,2}\d[A-Z\d]? \d[A-Z]{2}$/
    }
    return patterns[country]?.test(postalCode) || false
  },
  
  isStrongPassword: (password: string): boolean => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/
    return strongPasswordRegex.test(password)
  }
}
```

## Caching and Performance Utilities

### Local Storage Utilities

```typescript
export const storageUtils = {
  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error('Error saving to localStorage:', error)
    }
  },
  
  get: <T>(key: string): T | null => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch (error) {
      console.error('Error reading from localStorage:', error)
      return null
    }
  },
  
  remove: (key: string): void => {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error('Error removing from localStorage:', error)
    }
  },
  
  clear: (): void => {
    try {
      localStorage.clear()
    } catch (error) {
      console.error('Error clearing localStorage:', error)
    }
  }
}
```

### Debouncing Utilities

```typescript
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Usage example
const debouncedSearch = debounce((query: string) => {
  // Perform search
}, 300)
```

## Future Utility Enhancements

### Planned Utility Modules

1. **File Upload Utilities**
   - Image compression and resizing
   - File type validation
   - Progress tracking

2. **Analytics Utilities**
   - Event tracking
   - User behavior analytics
   - Performance metrics

3. **Notification Utilities**
   - Push notification handling
   - Email template utilities
   - SMS integration

4. **Internationalization Utilities**
   - Multi-language support
   - Currency conversion
   - Date/time localization

5. **Testing Utilities**
   - Mock data generators
   - Test helpers
   - API mocking utilities

This comprehensive utility system provides the foundation for consistent, maintainable, and scalable applications across the entire KCT ecosystem.
