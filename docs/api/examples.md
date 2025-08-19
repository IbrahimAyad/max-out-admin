# KCT Ecosystem API Examples and Integration Patterns

## Table of Contents
- [Quick Start Examples](#quick-start-examples)
- [Request/Response Examples](#request-response-examples)
- [Schema Definitions](#schema-definitions)
- [API Testing Patterns](#api-testing-patterns)
- [Development Patterns](#development-patterns)
- [Integration Best Practices](#integration-best-practices)
- [Common Use Cases](#common-use-cases)
- [Performance Optimization](#performance-optimization)
- [Troubleshooting Guide](#troubleshooting-guide)
- [Code Examples Repository](#code-examples-repository)

## Quick Start Examples

### Basic Setup and Configuration

```javascript
// 1. Install dependencies
npm install @supabase/supabase-js stripe @sendgrid/mail

// 2. Environment configuration (.env.local)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
SENDGRID_API_KEY=your_sendgrid_api_key
EASYPOST_API_KEY=your_easypost_api_key

// 3. Basic client setup
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
)
```

### 30-Second API Integration Example

```javascript
// Complete user authentication and data management in under 30 lines
import { useState, useEffect } from 'react'
import { supabase } from './supabase-client'

function QuickStartApp() {
  const [user, setUser] = useState(null)
  const [data, setData] = useState([])

  useEffect(() => {
    // Check auth state
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
    
    // Auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_, session) => setUser(session?.user || null)
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google' })
  }

  const fetchData = async () => {
    const { data } = await supabase.from('items').select('*')
    setData(data || [])
  }

  const createItem = async (name) => {
    await supabase.from('items').insert({ name, user_id: user.id })
    fetchData() // Refresh data
  }

  if (!user) {
    return <button onClick={signIn}>Sign In with Google</button>
  }

  return (
    <div>
      <h1>Welcome, {user.email}</h1>
      <button onClick={() => createItem('New Item')}>Add Item</button>
      <button onClick={fetchData}>Refresh Data</button>
      <ul>
        {data.map(item => <li key={item.id}>{item.name}</li>)}
      </ul>
    </div>
  )
}
```

## Request/Response Examples

### User Management API Examples

#### 1. User Registration
```bash
# Request
POST /auth/v1/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "options": {
    "data": {
      "full_name": "John Doe",
      "avatar_url": "https://example.com/avatar.jpg"
    },
    "emailRedirectTo": "https://yourapp.com/auth/callback"
  }
}
```

```json
// Response (Success)
{
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "aud": "authenticated",
      "role": "authenticated",
      "email": "user@example.com",
      "email_confirmed_at": null,
      "phone": null,
      "confirmed_at": null,
      "last_sign_in_at": null,
      "app_metadata": {
        "provider": "email",
        "providers": ["email"]
      },
      "user_metadata": {
        "full_name": "John Doe",
        "avatar_url": "https://example.com/avatar.jpg"
      },
      "identities": [],
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    },
    "session": null
  }
}
```

```json
// Response (Error)
{
  "error": {
    "code": "EMAIL_ALREADY_REGISTERED",
    "message": "User already registered",
    "details": {
      "email": "user@example.com"
    },
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

#### 2. Get User Profile
```bash
# Request
GET /rest/v1/profiles?id=eq.550e8400-e29b-41d4-a716-446655440000&select=*
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

```json
// Response
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "full_name": "John Doe",
      "email": "user@example.com",
      "avatar_url": "https://example.com/avatar.jpg",
      "bio": "Software developer passionate about building great products",
      "website": "https://johndoe.dev",
      "location": "San Francisco, CA",
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T12:45:00.000Z"
    }
  ]
}
```

#### 3. Update User Profile
```bash
# Request
PATCH /rest/v1/profiles?id=eq.550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
Prefer: return=representation

{
  "full_name": "John Smith",
  "bio": "Updated bio text",
  "website": "https://johnsmith.dev"
}
```

```json
// Response
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "full_name": "John Smith",
      "bio": "Updated bio text",
      "website": "https://johnsmith.dev",
      "updated_at": "2024-01-15T14:20:00.000Z"
    }
  ]
}
```

### E-commerce API Examples

#### 1. Create Payment Intent
```bash
# Request
POST /functions/v1/create-payment
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "amount": 29.99,
  "currency": "usd",
  "customerEmail": "customer@example.com",
  "cartItems": [
    {
      "product_id": "prod_123",
      "product_name": "Premium Widget",
      "quantity": 2,
      "price": 14.99,
      "product_image_url": "https://example.com/widget.jpg"
    }
  ],
  "shippingAddress": {
    "name": "John Doe",
    "line1": "123 Main St",
    "city": "San Francisco",
    "state": "CA",
    "postal_code": "94102",
    "country": "US"
  }
}
```

```json
// Response
{
  "data": {
    "clientSecret": "pi_1234567890_secret_abcdefghijk",
    "paymentIntentId": "pi_1234567890",
    "orderId": "order_987654321",
    "amount": 29.99,
    "currency": "usd",
    "status": "pending"
  }
}
```

#### 2. Create Subscription
```bash
# Request
POST /functions/v1/create-subscription
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "planType": "premium",
  "customerEmail": "customer@example.com"
}
```

```json
// Response
{
  "data": {
    "checkoutUrl": "https://checkout.stripe.com/pay/cs_test_1234567890",
    "sessionId": "cs_test_1234567890"
  }
}
```

### File Upload Examples

#### 1. Secure File Upload
```bash
# Request
POST /functions/v1/secure-upload
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAAA...",
  "fileName": "profile-picture.jpg",
  "metadata": {
    "category": "profile",
    "tags": ["user", "avatar"],
    "description": "User profile picture"
  }
}
```

```json
// Response
{
  "data": {
    "publicUrl": "https://your-project.supabase.co/storage/v1/object/public/uploads/user123/1642253400-profile-picture.jpg",
    "file": {
      "id": "file_123",
      "filename": "profile-picture.jpg",
      "file_path": "user123/1642253400-profile-picture.jpg",
      "mime_type": "image/jpeg",
      "file_size": 245760,
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### Real-time Subscription Examples

#### 1. WebSocket Connection
```javascript
// Frontend: Subscribe to table changes
const subscription = supabase
  .channel('public:posts')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'posts' },
    (payload) => {
      console.log('Change received:', payload)
      
      switch (payload.eventType) {
        case 'INSERT':
          console.log('New post:', payload.new)
          break
        case 'UPDATE':
          console.log('Updated post:', payload.new)
          break
        case 'DELETE':
          console.log('Deleted post:', payload.old)
          break
      }
    }
  )
  .subscribe()

// Cleanup
subscription.unsubscribe()
```

#### 2. Presence Tracking
```javascript
// Track user presence in a room
const presenceSubscription = supabase.channel('room:123')

presenceSubscription
  .on('presence', { event: 'sync' }, () => {
    const newState = presenceSubscription.presenceState()
    console.log('sync', newState)
  })
  .on('presence', { event: 'join' }, ({ key, newPresences }) => {
    console.log('join', key, newPresences)
  })
  .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
    console.log('leave', key, leftPresences)
  })
  .subscribe(async (status) => {
    if (status !== 'SUBSCRIBED') return

    const presenceTrackStatus = await presenceSubscription.track({
      user: 'user-1',
      online_at: new Date().toISOString(),
    })
    console.log('Presence track status:', presenceTrackStatus)
  })
```

## Schema Definitions

### User Profile Schema
```typescript
interface UserProfile {
  id: string                    // UUID, Primary key
  email: string                 // Email address
  full_name: string | null      // Full display name
  avatar_url: string | null     // Profile picture URL
  bio: string | null            // User biography
  website: string | null        // Personal website URL
  location: string | null       // User location
  social_links: {               // Social media links
    twitter?: string
    linkedin?: string
    github?: string
  } | null
  preferences: {                // User preferences
    theme: 'light' | 'dark'
    notifications: boolean
    email_updates: boolean
  }
  created_at: string            // ISO timestamp
  updated_at: string            // ISO timestamp
}
```

### Order Schema
```typescript
interface Order {
  id: string                    // UUID, Primary key
  user_id: string | null        // User ID (nullable for guest orders)
  stripe_payment_intent_id: string  // Stripe payment intent ID
  status: 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded'
  total_amount: number          // Total order amount
  currency: string              // Currency code (e.g., 'usd')
  customer_email: string | null // Customer email
  shipping_address: {           // Shipping address object
    name: string
    line1: string
    line2?: string
    city: string
    state: string
    postal_code: string
    country: string
  } | null
  billing_address: {            // Billing address object
    name: string
    line1: string
    line2?: string
    city: string
    state: string
    postal_code: string
    country: string
  } | null
  metadata: Record<string, any> // Additional metadata
  created_at: string            // ISO timestamp
  updated_at: string            // ISO timestamp
}

interface OrderItem {
  id: string                    // UUID, Primary key
  order_id: string              // Foreign key to orders table
  product_id: string            // Product identifier
  product_name: string          // Product name at time of purchase
  product_image_url: string | null  // Product image URL
  quantity: number              // Quantity ordered
  price_at_time: number         // Price at time of purchase
  created_at: string            // ISO timestamp
}
```

### Subscription Schema
```typescript
interface Subscription {
  id: string                    // UUID, Primary key
  user_id: string               // Foreign key to auth.users
  stripe_subscription_id: string    // Stripe subscription ID
  stripe_customer_id: string    // Stripe customer ID
  price_id: string              // Stripe price ID
  status: 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'trialing' | 'unpaid'
  current_period_start: string  // ISO timestamp
  current_period_end: string    // ISO timestamp
  created_at: string            // ISO timestamp
  updated_at: string            // ISO timestamp
}

interface Plan {
  id: string                    // UUID, Primary key
  price_id: string              // Stripe price ID
  plan_type: string             // Plan identifier (e.g., 'basic', 'premium')
  name: string                  // Display name
  description: string | null    // Plan description
  price: number                 // Price in cents
  currency: string              // Currency code
  interval: 'month' | 'year'    // Billing interval
  monthly_limit: number | null  // Usage limit per month
  features: string[]            // Array of feature descriptions
  created_at: string            // ISO timestamp
  updated_at: string            // ISO timestamp
}
```

### File Upload Schema
```typescript
interface UploadedFile {
  id: string                    // UUID, Primary key
  user_id: string               // User who uploaded the file
  filename: string              // Original filename
  file_path: string             // Storage path
  public_url: string            // Public access URL
  mime_type: string             // File MIME type
  file_size: number             // File size in bytes
  metadata: {                   // Additional file metadata
    category?: string
    tags?: string[]
    description?: string
    alt_text?: string
  }
  created_at: string            // ISO timestamp
}
```

## API Testing Patterns

### 1. Unit Testing API Functions

```javascript
// api.test.js - Testing API utility functions
import { describe, test, expect, beforeEach, afterEach } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'
import { UserAPI } from '../lib/api/users'

// Mock Supabase client
jest.mock('@supabase/supabase-js')

describe('UserAPI', () => {
  let mockSupabase
  let userAPI

  beforeEach(() => {
    mockSupabase = {
      from: jest.fn(() => mockSupabase),
      select: jest.fn(() => mockSupabase),
      eq: jest.fn(() => mockSupabase),
      insert: jest.fn(() => mockSupabase),
      update: jest.fn(() => mockSupabase),
      delete: jest.fn(() => mockSupabase),
      maybeSingle: jest.fn(),
      auth: {
        getUser: jest.fn()
      }
    }

    createClient.mockReturnValue(mockSupabase)
    userAPI = new UserAPI()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should fetch user profile successfully', async () => {
    // Arrange
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      full_name: 'Test User'
    }

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: '123' } },
      error: null
    })

    mockSupabase.maybeSingle.mockResolvedValue({
      data: mockUser,
      error: null
    })

    // Act
    const result = await userAPI.getProfile()

    // Assert
    expect(result).toEqual(mockUser)
    expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
    expect(mockSupabase.select).toHaveBeenCalledWith('*')
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', '123')
  })

  test('should handle user not found error', async () => {
    // Arrange
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: '123' } },
      error: null
    })

    mockSupabase.maybeSingle.mockResolvedValue({
      data: null,
      error: null
    })

    // Act & Assert
    await expect(userAPI.getProfile()).rejects.toThrow('User profile not found')
  })
})
```

### 2. Integration Testing with Test Database

```javascript
// integration.test.js - Testing against real Supabase instance
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

const testSupabase = createClient(
  process.env.TEST_SUPABASE_URL,
  process.env.TEST_SUPABASE_SERVICE_KEY
)

describe('User Management Integration', () => {
  let testUserId

  beforeAll(async () => {
    // Create test user
    const { data, error } = await testSupabase.auth.admin.createUser({
      email: `test-${uuidv4()}@example.com`,
      password: 'testpassword',
      email_confirm: true
    })

    if (error) throw error
    testUserId = data.user.id
  })

  afterAll(async () => {
    // Clean up test user
    if (testUserId) {
      await testSupabase.auth.admin.deleteUser(testUserId)
    }
  })

  test('should create and retrieve user profile', async () => {
    // Create profile
    const profileData = {
      id: testUserId,
      full_name: 'Integration Test User',
      bio: 'This is a test user'
    }

    const { error: insertError } = await testSupabase
      .from('profiles')
      .insert(profileData)

    expect(insertError).toBeNull()

    // Retrieve profile
    const { data, error } = await testSupabase
      .from('profiles')
      .select('*')
      .eq('id', testUserId)
      .maybeSingle()

    expect(error).toBeNull()
    expect(data.full_name).toBe('Integration Test User')
    expect(data.bio).toBe('This is a test user')
  })
})
```

### 3. Edge Function Testing

```javascript
// edge-function.test.js - Testing Supabase Edge Functions
describe('Edge Function Tests', () => {
  const functionUrl = `${process.env.SUPABASE_URL}/functions/v1/test-function`
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  test('should process valid request successfully', async () => {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        test_data: 'valid input'
      })
    })

    expect(response.status).toBe(200)
    
    const result = await response.json()
    expect(result.data).toBeDefined()
    expect(result.success).toBe(true)
  })

  test('should handle invalid request gracefully', async () => {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        invalid_field: 'invalid input'
      })
    })

    expect(response.status).toBe(400)
    
    const result = await response.json()
    expect(result.error).toBeDefined()
    expect(result.error.code).toBe('VALIDATION_FAILED')
  })

  test('should require authentication', async () => {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        test_data: 'test'
      })
    })

    expect(response.status).toBe(401)
    
    const result = await response.json()
    expect(result.error.code).toBe('AUTH_REQUIRED')
  })
})
```

### 4. End-to-End Testing Framework

```javascript
// e2e.test.js - End-to-end workflow testing
import { test, expect } from '@playwright/test'

test.describe('User Registration Flow', () => {
  test('complete user registration and profile setup', async ({ page, context }) => {
    // Navigate to registration page
    await page.goto('/register')

    // Fill registration form
    await page.fill('[data-testid="email-input"]', 'e2e-test@example.com')
    await page.fill('[data-testid="password-input"]', 'SecurePassword123')
    await page.fill('[data-testid="confirm-password-input"]', 'SecurePassword123')
    await page.fill('[data-testid="full-name-input"]', 'E2E Test User')

    // Submit registration
    await page.click('[data-testid="register-button"]')

    // Check for success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Please check your email')

    // Simulate email confirmation (in real test, you'd intercept the email)
    // For testing, we can directly confirm the user using Supabase admin API
    
    // Continue with login after confirmation
    await page.goto('/login')
    await page.fill('[data-testid="email-input"]', 'e2e-test@example.com')
    await page.fill('[data-testid="password-input"]', 'SecurePassword123')
    await page.click('[data-testid="login-button"]')

    // Check successful login
    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('[data-testid="user-name"]')).toContainText('E2E Test User')
  })
})

test.describe('E-commerce Flow', () => {
  test('complete purchase flow', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'password')
    await page.click('[data-testid="login-button"]')

    // Browse products
    await page.goto('/products')
    await page.click('[data-testid="product-123"]')

    // Add to cart
    await page.click('[data-testid="add-to-cart"]')
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('1')

    // Go to checkout
    await page.click('[data-testid="cart-icon"]')
    await page.click('[data-testid="checkout-button"]')

    // Fill checkout form
    await page.fill('[data-testid="shipping-name"]', 'Test User')
    await page.fill('[data-testid="shipping-address"]', '123 Test St')
    await page.fill('[data-testid="shipping-city"]', 'Test City')
    await page.selectOption('[data-testid="shipping-state"]', 'CA')
    await page.fill('[data-testid="shipping-zip"]', '12345')

    // Payment (using Stripe test card)
    await page.frameLocator('[data-testid="stripe-card-element"] iframe').fill('[name="cardnumber"]', '4242424242424242')
    await page.frameLocator('[data-testid="stripe-card-element"] iframe').fill('[name="exp-date"]', '1225')
    await page.frameLocator('[data-testid="stripe-card-element"] iframe').fill('[name="cvc"]', '123')

    // Submit payment
    await page.click('[data-testid="submit-payment"]')

    // Check success page
    await expect(page).toHaveURL(/\/order-confirmation/)
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Order confirmed')
  })
})
```

## Development Patterns

### 1. Local Development Setup

```bash
#!/bin/bash
# dev-setup.sh - Development environment setup script

echo "🚀 Setting up KCT Ecosystem development environment..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Setup environment variables
echo "🔧 Setting up environment variables..."
cp .env.example .env.local

echo "⚠️  Please update .env.local with your actual API keys:"
echo "  - SUPABASE_URL and SUPABASE_ANON_KEY"
echo "  - STRIPE_PUBLISHABLE_KEY and STRIPE_SECRET_KEY"
echo "  - SENDGRID_API_KEY"
echo "  - EASYPOST_API_KEY"

# Start development server
echo "🔥 Starting development server..."
npm run dev

echo "✅ Development environment ready!"
echo "🌐 Access your app at http://localhost:3000"
```

### 2. Git Hooks for API Testing

```javascript
// .husky/pre-commit - Run tests before commits
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🧪 Running API tests before commit..."

# Run unit tests
npm run test:unit

# Run integration tests if environment is available
if [ -n "$TEST_SUPABASE_URL" ]; then
  npm run test:integration
fi

# Run linting
npm run lint

# Run type checking
npm run type-check

echo "✅ Pre-commit checks passed!"
```

### 3. Development Utilities

```javascript
// lib/dev-utils.js - Development helper utilities
export class DevLogger {
  static log(message, data = null) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 [${new Date().toISOString()}] ${message}`)
      if (data) {
        console.log(data)
      }
    }
  }

  static error(message, error = null) {
    if (process.env.NODE_ENV === 'development') {
      console.error(`❌ [${new Date().toISOString()}] ${message}`)
      if (error) {
        console.error(error)
      }
    }
  }

  static apiCall(method, url, data = null) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`📡 API Call: ${method} ${url}`)
      if (data) {
        console.log('Request data:', data)
      }
    }
  }
}

// Mock data generator for development
export class MockDataGenerator {
  static user() {
    return {
      id: crypto.randomUUID(),
      email: `user${Date.now()}@example.com`,
      full_name: 'Development User',
      avatar_url: 'https://via.placeholder.com/150',
      created_at: new Date().toISOString()
    }
  }

  static product() {
    return {
      id: crypto.randomUUID(),
      name: `Test Product ${Date.now()}`,
      description: 'This is a test product for development',
      price: Math.floor(Math.random() * 10000) / 100, // Random price
      image_url: 'https://via.placeholder.com/300',
      created_at: new Date().toISOString()
    }
  }

  static order() {
    return {
      id: crypto.randomUUID(),
      user_id: crypto.randomUUID(),
      total_amount: Math.floor(Math.random() * 10000) / 100,
      status: 'pending',
      created_at: new Date().toISOString()
    }
  }
}

// API response validator for development
export function validateAPIResponse(response, schema) {
  if (process.env.NODE_ENV !== 'development') return true

  try {
    // Simple schema validation (in production, use a proper validator like Joi or Yup)
    for (const [key, type] of Object.entries(schema)) {
      if (!(key in response)) {
        console.warn(`⚠️  Missing field: ${key}`)
        return false
      }

      if (typeof response[key] !== type) {
        console.warn(`⚠️  Type mismatch: ${key} expected ${type}, got ${typeof response[key]}`)
        return false
      }
    }

    return true
  } catch (error) {
    console.error('Schema validation error:', error)
    return false
  }
}
```

### 4. Environment-specific Configurations

```javascript
// config/environments.js - Environment-specific settings
const environments = {
  development: {
    api: {
      timeout: 30000,
      retries: 3,
      logRequests: true,
      mockData: true
    },
    features: {
      enableDebugMode: true,
      enableMockPayments: true,
      enableTestNotifications: true
    },
    supabase: {
      realtime: {
        eventsPerSecond: 50 // Higher limit for development
      }
    }
  },

  staging: {
    api: {
      timeout: 15000,
      retries: 2,
      logRequests: true,
      mockData: false
    },
    features: {
      enableDebugMode: true,
      enableMockPayments: true,
      enableTestNotifications: false
    },
    supabase: {
      realtime: {
        eventsPerSecond: 20
      }
    }
  },

  production: {
    api: {
      timeout: 10000,
      retries: 1,
      logRequests: false,
      mockData: false
    },
    features: {
      enableDebugMode: false,
      enableMockPayments: false,
      enableTestNotifications: false
    },
    supabase: {
      realtime: {
        eventsPerSecond: 10
      }
    }
  }
}

export const config = environments[process.env.NODE_ENV] || environments.development

// Usage
import { config } from './config/environments'

if (config.api.logRequests) {
  console.log('Making API request...')
}
```

## Integration Best Practices

### 1. Multi-Application Architecture

```javascript
// packages/shared-api/src/index.js - Shared API package
export class KCTAPIClient {
  constructor(config) {
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey)
    this.config = config
  }

  // Shared authentication methods
  async signIn(email, password) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw new APIError('AUTH_FAILED', error.message)
    
    return data
  }

  // Shared user management
  async getUser() {
    const { data: { user }, error } = await this.supabase.auth.getUser()
    
    if (error) throw new APIError('AUTH_ERROR', error.message)
    
    return user
  }

  // Shared profile management
  async getProfile(userId = null) {
    const user = userId || await this.getUser()
    
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (error) throw new APIError('PROFILE_ERROR', error.message)
    
    return data
  }
}

// App-specific extensions
// apps/main-app/lib/api.js
import { KCTAPIClient } from '@kct/shared-api'

export class MainAppAPI extends KCTAPIClient {
  constructor(config) {
    super(config)
  }

  // Main app specific methods
  async getMainAppData() {
    return this.supabase.from('main_app_table').select('*')
  }
}

// apps/admin-app/lib/api.js
export class AdminAPI extends KCTAPIClient {
  constructor(config) {
    super(config)
  }

  // Admin app specific methods
  async getAllUsers() {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw new APIError('ADMIN_ERROR', error.message)
    
    return data
  }
}
```

### 2. State Management Integration

```javascript
// stores/api-store.js - Zustand store with API integration
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { KCTAPIClient } from './api-client'

const useAPIStore = create(devtools((set, get) => ({
  // State
  user: null,
  profile: null,
  loading: false,
  error: null,

  // API client
  api: new KCTAPIClient({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  }),

  // Actions
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  // Auth actions
  signIn: async (email, password) => {
    set({ loading: true, error: null })
    
    try {
      const data = await get().api.signIn(email, password)
      set({ user: data.user, loading: false })
      
      // Fetch profile after sign in
      await get().fetchProfile()
      
      return data
    } catch (error) {
      set({ error: error.message, loading: false })
      throw error
    }
  },

  signOut: async () => {
    set({ loading: true })
    
    try {
      await get().api.supabase.auth.signOut()
      set({ user: null, profile: null, loading: false })
    } catch (error) {
      set({ error: error.message, loading: false })
    }
  },

  // Profile actions
  fetchProfile: async () => {
    if (!get().user) return

    set({ loading: true })
    
    try {
      const profile = await get().api.getProfile()
      set({ profile, loading: false })
      return profile
    } catch (error) {
      set({ error: error.message, loading: false })
    }
  },

  updateProfile: async (updates) => {
    set({ loading: true, error: null })
    
    try {
      const updatedProfile = await get().api.updateProfile(updates)
      set({ profile: updatedProfile, loading: false })
      return updatedProfile
    } catch (error) {
      set({ error: error.message, loading: false })
      throw error
    }
  }
})))

export { useAPIStore }

// Usage in components
function ProfileComponent() {
  const { 
    user, 
    profile, 
    loading, 
    error, 
    fetchProfile, 
    updateProfile 
  } = useAPIStore()

  useEffect(() => {
    if (user && !profile) {
      fetchProfile()
    }
  }, [user, profile, fetchProfile])

  const handleUpdateProfile = async (updates) => {
    try {
      await updateProfile(updates)
      toast.success('Profile updated successfully')
    } catch (error) {
      toast.error(error.message)
    }
  }

  if (loading) return <Spinner />
  if (error) return <ErrorMessage message={error} />
  if (!profile) return <div>No profile data</div>

  return (
    <ProfileForm 
      profile={profile} 
      onUpdate={handleUpdateProfile}
    />
  )
}
```

### 3. Caching Strategies

```javascript
// lib/cache.js - API response caching
class APICache {
  constructor(defaultTTL = 300000) { // 5 minutes default
    this.cache = new Map()
    this.ttl = defaultTTL
  }

  set(key, data, ttl = this.ttl) {
    const expiry = Date.now() + ttl
    this.cache.set(key, { data, expiry })
  }

  get(key) {
    const item = this.cache.get(key)
    
    if (!item) return null
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key)
      return null
    }
    
    return item.data
  }

  delete(key) {
    this.cache.delete(key)
  }

  clear() {
    this.cache.clear()
  }

  // Cache with automatic refresh
  async getOrFetch(key, fetchFn, ttl = this.ttl) {
    let data = this.get(key)
    
    if (data === null) {
      data = await fetchFn()
      this.set(key, data, ttl)
    }
    
    return data
  }
}

// Enhanced API client with caching
export class CachedAPIClient extends KCTAPIClient {
  constructor(config) {
    super(config)
    this.cache = new APICache()
  }

  async getProfile(userId = null, useCache = true) {
    const user = userId || await this.getUser()
    const cacheKey = `profile:${user.id}`

    if (useCache) {
      return this.cache.getOrFetch(
        cacheKey,
        () => super.getProfile(userId),
        300000 // 5 minutes
      )
    }

    const profile = await super.getProfile(userId)
    this.cache.set(cacheKey, profile)
    return profile
  }

  async updateProfile(updates) {
    const result = await super.updateProfile(updates)
    
    // Invalidate cache
    const user = await this.getUser()
    this.cache.delete(`profile:${user.id}`)
    
    return result
  }
}

// React hook with caching
function useAPIWithCache() {
  const [cache, setCache] = useState(new Map())

  const getCached = useCallback((key) => {
    const item = cache.get(key)
    if (!item) return null
    
    if (Date.now() > item.expiry) {
      const newCache = new Map(cache)
      newCache.delete(key)
      setCache(newCache)
      return null
    }
    
    return item.data
  }, [cache])

  const setCached = useCallback((key, data, ttl = 300000) => {
    const expiry = Date.now() + ttl
    const newCache = new Map(cache)
    newCache.set(key, { data, expiry })
    setCache(newCache)
  }, [cache])

  return { getCached, setCached }
}
```

## Common Use Cases

### 1. User Dashboard with Real-time Updates

```javascript
// components/Dashboard.js - Complete dashboard with real-time features
import { useState, useEffect } from 'react'
import { useAPIStore } from '../stores/api-store'
import { supabase } from '../lib/supabase'

function Dashboard() {
  const { user, profile } = useAPIStore()
  const [activities, setActivities] = useState([])
  const [notifications, setNotifications] = useState([])
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    activeSubscriptions: 0
  })

  // Fetch initial data
  useEffect(() => {
    if (!user) return

    Promise.all([
      fetchActivities(),
      fetchNotifications(),
      fetchStats()
    ]).catch(console.error)
  }, [user])

  // Real-time subscriptions
  useEffect(() => {
    if (!user) return

    // Subscribe to user activities
    const activitiesSubscription = supabase
      .channel(`user:${user.id}:activities`)
      .on('postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'user_activities',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          setActivities(prev => [payload.new, ...prev.slice(0, 9)]) // Keep latest 10
        }
      )
      .subscribe()

    // Subscribe to notifications
    const notificationsSubscription = supabase
      .channel(`user:${user.id}:notifications`)
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          setNotifications(prev => [payload.new, ...prev])
          // Show toast notification
          toast.info(payload.new.message)
        }
      )
      .subscribe()

    return () => {
      activitiesSubscription.unsubscribe()
      notificationsSubscription.unsubscribe()
    }
  }, [user])

  async function fetchActivities() {
    const { data } = await supabase
      .from('user_activities')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    setActivities(data || [])
  }

  async function fetchNotifications() {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('read_at', null)
      .order('created_at', { ascending: false })

    setNotifications(data || [])
  }

  async function fetchStats() {
    // Fetch user statistics
    const [ordersData, subscriptionsData] = await Promise.all([
      supabase
        .from('orders')
        .select('total_amount')
        .eq('user_id', user.id)
        .eq('status', 'paid'),
      
      supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
    ])

    const totalSpent = ordersData.data?.reduce((sum, order) => sum + order.total_amount, 0) || 0
    
    setStats({
      totalOrders: ordersData.data?.length || 0,
      totalSpent,
      activeSubscriptions: subscriptionsData.data?.length || 0
    })
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Welcome back, {profile?.full_name || user.email}</h1>
        <NotificationBadge count={notifications.length} />
      </header>

      <div className="dashboard-grid">
        <StatsCards stats={stats} />
        <RecentActivities activities={activities} />
        <QuickActions />
      </div>
    </div>
  )
}

function StatsCards({ stats }) {
  return (
    <div className="stats-grid">
      <StatCard 
        title="Total Orders" 
        value={stats.totalOrders} 
        icon="📦" 
      />
      <StatCard 
        title="Total Spent" 
        value={`$${stats.totalSpent.toFixed(2)}`} 
        icon="💰" 
      />
      <StatCard 
        title="Active Subscriptions" 
        value={stats.activeSubscriptions} 
        icon="📅" 
      />
    </div>
  )
}

function RecentActivities({ activities }) {
  return (
    <div className="recent-activities">
      <h3>Recent Activity</h3>
      <ul>
        {activities.map(activity => (
          <li key={activity.id}>
            <span className="activity-icon">{activity.icon}</span>
            <span className="activity-text">{activity.description}</span>
            <span className="activity-time">
              {formatRelativeTime(activity.created_at)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

### 2. E-commerce Checkout Flow

```javascript
// components/CheckoutFlow.js - Complete checkout implementation
import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { useAPIStore } from '../stores/api-store'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)

function CheckoutFlow({ cartItems, onSuccess, onError }) {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm 
        cartItems={cartItems} 
        onSuccess={onSuccess} 
        onError={onError} 
      />
    </Elements>
  )
}

function CheckoutForm({ cartItems, onSuccess, onError }) {
  const stripe = useStripe()
  const elements = useElements()
  const { user } = useAPIStore()
  
  const [loading, setLoading] = useState(false)
  const [clientSecret, setClientSecret] = useState('')
  const [shippingAddress, setShippingAddress] = useState({
    name: '',
    line1: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'US'
  })

  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  // Create payment intent
  useEffect(() => {
    if (cartItems.length === 0) return

    createPaymentIntent()
  }, [cartItems])

  async function createPaymentIntent() {
    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          amount: total,
          currency: 'usd',
          cartItems: cartItems.map(item => ({
            product_id: item.id,
            product_name: item.name,
            quantity: item.quantity,
            price: item.price,
            product_image_url: item.image_url
          })),
          customerEmail: user?.email
        }
      })

      if (error) throw error
      
      setClientSecret(data.clientSecret)
    } catch (error) {
      onError(error.message)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!stripe || !elements || !clientSecret) {
      return
    }

    setLoading(true)

    const cardElement = elements.getElement(CardElement)

    // Confirm payment
    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: {
          name: shippingAddress.name,
          email: user?.email,
          address: {
            line1: shippingAddress.line1,
            city: shippingAddress.city,
            state: shippingAddress.state,
            postal_code: shippingAddress.postal_code,
            country: shippingAddress.country
          }
        }
      },
      shipping: {
        name: shippingAddress.name,
        address: {
          line1: shippingAddress.line1,
          city: shippingAddress.city,
          state: shippingAddress.state,
          postal_code: shippingAddress.postal_code,
          country: shippingAddress.country
        }
      }
    })

    setLoading(false)

    if (error) {
      onError(error.message)
    } else if (paymentIntent.status === 'succeeded') {
      onSuccess({
        paymentIntentId: paymentIntent.id,
        amount: total
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="checkout-form">
      <div className="checkout-section">
        <h3>Shipping Address</h3>
        <AddressForm 
          address={shippingAddress}
          onChange={setShippingAddress}
        />
      </div>

      <div className="checkout-section">
        <h3>Payment Information</h3>
        <CardElement 
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
            },
          }}
        />
      </div>

      <div className="checkout-section">
        <h3>Order Summary</h3>
        <OrderSummary items={cartItems} total={total} />
      </div>

      <button 
        type="submit" 
        disabled={!stripe || loading || !clientSecret}
        className="checkout-submit-button"
      >
        {loading ? 'Processing...' : `Pay $${total.toFixed(2)}`}
      </button>
    </form>
  )
}

function AddressForm({ address, onChange }) {
  const handleChange = (field, value) => {
    onChange(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="address-form">
      <input
        type="text"
        placeholder="Full Name"
        value={address.name}
        onChange={(e) => handleChange('name', e.target.value)}
        required
      />
      <input
        type="text"
        placeholder="Address Line 1"
        value={address.line1}
        onChange={(e) => handleChange('line1', e.target.value)}
        required
      />
      <input
        type="text"
        placeholder="City"
        value={address.city}
        onChange={(e) => handleChange('city', e.target.value)}
        required
      />
      <select
        value={address.state}
        onChange={(e) => handleChange('state', e.target.value)}
        required
      >
        <option value="">Select State</option>
        <option value="CA">California</option>
        <option value="NY">New York</option>
        {/* Add more states */}
      </select>
      <input
        type="text"
        placeholder="ZIP Code"
        value={address.postal_code}
        onChange={(e) => handleChange('postal_code', e.target.value)}
        required
      />
    </div>
  )
}
```

### 3. Content Management System

```javascript
// components/ContentManager.js - CMS with rich editor and file uploads
import { useState, useEffect } from 'react'
import { useAPIStore } from '../stores/api-store'

function ContentManager() {
  const { user } = useAPIStore()
  const [posts, setPosts] = useState([])
  const [editingPost, setEditingPost] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchPosts()
  }, [])

  async function fetchPosts() {
    setLoading(true)
    
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles!posts_author_id_fkey(full_name, avatar_url)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      setPosts(data || [])
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  async function createPost(postData) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .insert({
          ...postData,
          author_id: user.id,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      
      setPosts(prev => [data, ...prev])
      toast.success('Post created successfully')
    } catch (error) {
      toast.error(error.message)
    }
  }

  async function updatePost(id, updates) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      
      setPosts(prev => prev.map(post => 
        post.id === id ? { ...post, ...data } : post
      ))
      
      toast.success('Post updated successfully')
    } catch (error) {
      toast.error(error.message)
    }
  }

  async function deletePost(id) {
    if (!confirm('Are you sure you want to delete this post?')) return

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      setPosts(prev => prev.filter(post => post.id !== id))
      toast.success('Post deleted successfully')
    } catch (error) {
      toast.error(error.message)
    }
  }

  if (loading) {
    return <div className="loading">Loading posts...</div>
  }

  return (
    <div className="content-manager">
      <header className="content-header">
        <h1>Content Manager</h1>
        <button 
          onClick={() => setEditingPost({ isNew: true })}
          className="btn-primary"
        >
          Create New Post
        </button>
      </header>

      {editingPost && (
        <PostEditor
          post={editingPost}
          onSave={(postData) => {
            if (editingPost.isNew) {
              createPost(postData)
            } else {
              updatePost(editingPost.id, postData)
            }
            setEditingPost(null)
          }}
          onCancel={() => setEditingPost(null)}
        />
      )}

      <div className="posts-grid">
        {posts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            onEdit={() => setEditingPost(post)}
            onDelete={() => deletePost(post.id)}
          />
        ))}
      </div>
    </div>
  )
}

function PostEditor({ post, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    title: post?.title || '',
    content: post?.content || '',
    excerpt: post?.excerpt || '',
    featured_image: post?.featured_image || '',
    status: post?.status || 'draft',
    tags: post?.tags || []
  })

  const [uploading, setUploading] = useState(false)

  async function handleImageUpload(file) {
    if (!file) return

    setUploading(true)

    try {
      const { data, error } = await supabase.functions.invoke('secure-upload', {
        body: {
          imageData: await fileToBase64(file),
          fileName: file.name,
          metadata: {
            category: 'blog',
            alt_text: formData.title
          }
        }
      })

      if (error) throw error
      
      setFormData(prev => ({
        ...prev,
        featured_image: data.publicUrl
      }))
    } catch (error) {
      toast.error(error.message)
    } finally {
      setUploading(false)
    }
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  function handleSubmit(e) {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Title and content are required')
      return
    }

    onSave(formData)
  }

  return (
    <div className="post-editor">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Enter post title"
            required
          />
        </div>

        <div className="form-group">
          <label>Featured Image</label>
          <div className="image-upload">
            {formData.featured_image && (
              <img 
                src={formData.featured_image} 
                alt="Featured" 
                className="featured-image-preview"
              />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e.target.files[0])}
              disabled={uploading}
            />
            {uploading && <span>Uploading...</span>}
          </div>
        </div>

        <div className="form-group">
          <label>Content</label>
          <RichTextEditor
            value={formData.content}
            onChange={(content) => setFormData(prev => ({ ...prev, content }))}
          />
        </div>

        <div className="form-group">
          <label>Excerpt</label>
          <textarea
            value={formData.excerpt}
            onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
            placeholder="Brief description of the post"
            rows={3}
          />
        </div>

        <div className="form-actions">
          <button type="button" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn-primary">
            {post?.isNew ? 'Create Post' : 'Update Post'}
          </button>
        </div>
      </form>
    </div>
  )
}
```

## Performance Optimization

### 1. Query Optimization

```javascript
// Optimized data fetching patterns
class OptimizedAPI {
  // Batch requests to reduce round trips
  async batchFetch(queries) {
    const promises = queries.map(query => this.executeQuery(query))
    const results = await Promise.all(promises)
    
    return queries.reduce((acc, query, index) => {
      acc[query.key] = results[index]
      return acc
    }, {})
  }

  // Paginated queries with cursor-based pagination
  async getPaginatedData(table, options = {}) {
    const { 
      limit = 20, 
      cursor = null, 
      orderBy = 'created_at',
      ascending = false,
      filters = {}
    } = options

    let query = supabase
      .from(table)
      .select('*')
      .order(orderBy, { ascending })
      .limit(limit + 1) // Fetch one extra to check if there's more

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        query = query.in(key, value)
      } else {
        query = query.eq(key, value)
      }
    })

    // Apply cursor
    if (cursor) {
      query = ascending 
        ? query.gt(orderBy, cursor)
        : query.lt(orderBy, cursor)
    }

    const { data, error } = await query

    if (error) throw error

    const hasMore = data.length > limit
    const items = hasMore ? data.slice(0, -1) : data
    const nextCursor = hasMore ? data[data.length - 2][orderBy] : null

    return {
      items,
      nextCursor,
      hasMore
    }
  }

  // Optimized search with full-text search
  async searchContent(searchTerm, options = {}) {
    const {
      table = 'posts',
      fields = ['title', 'content', 'excerpt'],
      limit = 10
    } = options

    // Use PostgreSQL full-text search for better performance
    const { data, error } = await supabase
      .rpc('search_content', {
        search_term: searchTerm,
        target_table: table,
        search_fields: fields,
        result_limit: limit
      })

    if (error) throw error
    
    return data
  }
}

// React hook for optimized data fetching
function useOptimizedQuery(queryKey, queryFn, options = {}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [hasMore, setHasMore] = useState(false)
  const [nextCursor, setNextCursor] = useState(null)

  const { enabled = true, cacheTime = 300000, staleTime = 60000 } = options

  const fetchData = useCallback(async (cursor = null, reset = false) => {
    if (!enabled) return

    setLoading(true)
    setError(null)

    try {
      const result = await queryFn(cursor)
      
      if (reset || !cursor) {
        setData(result.items)
      } else {
        setData(prev => [...prev, ...result.items])
      }
      
      setHasMore(result.hasMore)
      setNextCursor(result.nextCursor)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [queryFn, enabled])

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      fetchData(nextCursor, false)
    }
  }, [hasMore, loading, nextCursor, fetchData])

  const refresh = useCallback(() => {
    fetchData(null, true)
  }, [fetchData])

  useEffect(() => {
    fetchData(null, true)
  }, [fetchData])

  return {
    data,
    loading,
    error,
    hasMore,
    loadMore,
    refresh
  }
}
```

### 2. Connection Pooling and Caching

```javascript
// Advanced connection management
class ConnectionManager {
  constructor() {
    this.connections = new Map()
    this.maxConnections = 10
    this.connectionTimeout = 30000
  }

  getConnection(key = 'default') {
    if (!this.connections.has(key)) {
      const connection = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          auth: {
            autoRefreshToken: true,
            persistSession: true
          },
          realtime: {
            params: {
              eventsPerSecond: 10
            }
          },
          global: {
            headers: {
              'X-Connection-Pool': key
            }
          }
        }
      )

      this.connections.set(key, connection)
      
      // Set connection timeout
      setTimeout(() => {
        if (this.connections.has(key)) {
          this.connections.delete(key)
        }
      }, this.connectionTimeout)
    }

    return this.connections.get(key)
  }

  closeConnection(key) {
    const connection = this.connections.get(key)
    if (connection) {
      // Close all channels
      connection.removeAllChannels()
      this.connections.delete(key)
    }
  }

  closeAllConnections() {
    for (const [key] of this.connections) {
      this.closeConnection(key)
    }
  }
}

// Global connection manager instance
export const connectionManager = new ConnectionManager()

// Multi-level caching strategy
class CacheManager {
  constructor() {
    this.memoryCache = new Map()
    this.browserCache = typeof window !== 'undefined' 
      ? window.localStorage 
      : null
    this.defaultTTL = 300000 // 5 minutes
  }

  // Memory cache (fastest)
  setMemory(key, data, ttl = this.defaultTTL) {
    const expiry = Date.now() + ttl
    this.memoryCache.set(key, { data, expiry })
  }

  getMemory(key) {
    const item = this.memoryCache.get(key)
    if (!item) return null
    
    if (Date.now() > item.expiry) {
      this.memoryCache.delete(key)
      return null
    }
    
    return item.data
  }

  // Browser cache (persistent)
  setBrowser(key, data, ttl = this.defaultTTL) {
    if (!this.browserCache) return

    const expiry = Date.now() + ttl
    this.browserCache.setItem(key, JSON.stringify({ data, expiry }))
  }

  getBrowser(key) {
    if (!this.browserCache) return null

    try {
      const item = JSON.parse(this.browserCache.getItem(key))
      if (!item) return null
      
      if (Date.now() > item.expiry) {
        this.browserCache.removeItem(key)
        return null
      }
      
      return item.data
    } catch {
      return null
    }
  }

  // Multi-level get
  get(key) {
    // Try memory first
    let data = this.getMemory(key)
    if (data) return data

    // Try browser cache
    data = this.getBrowser(key)
    if (data) {
      // Promote to memory cache
      this.setMemory(key, data)
      return data
    }

    return null
  }

  // Multi-level set
  set(key, data, ttl = this.defaultTTL, persistent = false) {
    this.setMemory(key, data, ttl)
    
    if (persistent) {
      this.setBrowser(key, data, ttl)
    }
  }
}

export const cacheManager = new CacheManager()
```

## Troubleshooting Guide

### 1. Common Error Patterns and Solutions

```javascript
// Error diagnosis and resolution utilities
class ErrorDiagnostics {
  static async diagnoseSupabaseError(error) {
    const diagnosis = {
      error,
      category: 'unknown',
      severity: 'medium',
      solution: 'Check error details',
      preventive: []
    }

    // Authentication errors
    if (error.message?.includes('JWT expired')) {
      diagnosis.category = 'authentication'
      diagnosis.severity = 'high'
      diagnosis.solution = 'Refresh the user session'
      diagnosis.preventive = [
        'Implement automatic token refresh',
        'Check token expiry before API calls',
        'Handle auth state changes properly'
      ]
    }

    // Permission errors
    if (error.message?.includes('permission denied') || error.message?.includes('RLS')) {
      diagnosis.category = 'authorization'
      diagnosis.severity = 'high'
      diagnosis.solution = 'Check Row Level Security policies and user permissions'
      diagnosis.preventive = [
        'Verify RLS policies are correctly configured',
        'Ensure user has proper role assignments',
        'Test with service role key in development'
      ]
    }

    // Network errors
    if (error.message?.includes('Failed to fetch') || error.message?.includes('Network')) {
      diagnosis.category = 'network'
      diagnosis.severity = 'medium'
      diagnosis.solution = 'Check internet connection and Supabase service status'
      diagnosis.preventive = [
        'Implement retry logic with exponential backoff',
        'Add offline detection',
        'Cache critical data locally'
      ]
    }

    // Validation errors
    if (error.message?.includes('violates') || error.message?.includes('constraint')) {
      diagnosis.category = 'validation'
      diagnosis.severity = 'low'
      diagnosis.solution = 'Fix data validation issues'
      diagnosis.preventive = [
        'Implement client-side validation',
        'Use TypeScript for type safety',
        'Add proper form validation'
      ]
    }

    // Rate limiting
    if (error.message?.includes('rate limit') || error.message?.includes('429')) {
      diagnosis.category = 'rate_limit'
      diagnosis.severity = 'medium'
      diagnosis.solution = 'Reduce request frequency or implement queuing'
      diagnosis.preventive = [
        'Implement request queuing',
        'Add caching to reduce API calls',
        'Use batch requests where possible'
      ]
    }

    return diagnosis
  }

  static logError(error, context = {}) {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Node.js',
      url: typeof window !== 'undefined' ? window.location.href : 'N/A',
      context
    }

    console.error('Application Error:', errorInfo)

    // In production, send to error reporting service
    if (process.env.NODE_ENV === 'production') {
      // this.sendToErrorService(errorInfo)
    }

    return errorInfo
  }
}

// Error boundary with diagnostics
class DiagnosticErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, diagnosis: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  async componentDidCatch(error, errorInfo) {
    const diagnosis = await ErrorDiagnostics.diagnoseSupabaseError(error)
    
    this.setState({ diagnosis })
    
    ErrorDiagnostics.logError(error, {
      componentStack: errorInfo.componentStack,
      diagnosis
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorDisplay 
          error={this.state.error}
          diagnosis={this.state.diagnosis}
          onRetry={() => this.setState({ hasError: false, error: null, diagnosis: null })}
        />
      )
    }

    return this.props.children
  }
}

function ErrorDisplay({ error, diagnosis, onRetry }) {
  return (
    <div className="error-display">
      <h2>Oops! Something went wrong</h2>
      
      {diagnosis && (
        <div className="error-diagnosis">
          <h3>Error Details</h3>
          <p><strong>Category:</strong> {diagnosis.category}</p>
          <p><strong>Severity:</strong> {diagnosis.severity}</p>
          <p><strong>Solution:</strong> {diagnosis.solution}</p>
          
          {diagnosis.preventive.length > 0 && (
            <div>
              <h4>Prevention Tips:</h4>
              <ul>
                {diagnosis.preventive.map((tip, index) => (
                  <li key={index}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      
      <div className="error-actions">
        <button onClick={onRetry}>Try Again</button>
        <button onClick={() => window.location.reload()}>Refresh Page</button>
      </div>
    </div>
  )
}
```

### 2. Debug Utilities and Health Checks

```javascript
// Comprehensive debugging utilities
class DebugUtils {
  static async healthCheck() {
    const checks = {
      supabase: false,
      authentication: false,
      database: false,
      storage: false,
      functions: false,
      realtime: false
    }

    try {
      // Test Supabase connection
      const { data, error } = await supabase.from('health_check').select('count').limit(1)
      checks.supabase = !error
      
      // Test authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      checks.authentication = !authError
      
      // Test database access
      const { error: dbError } = await supabase.from('profiles').select('id').limit(1)
      checks.database = !dbError
      
      // Test storage access
      const { data: buckets, error: storageError } = await supabase.storage.listBuckets()
      checks.storage = !storageError
      
      // Test edge functions
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/health`)
        checks.functions = response.ok
      } catch {
        checks.functions = false
      }
      
      // Test realtime connection
      const channel = supabase.channel('health-check')
      const subscribed = await new Promise((resolve) => {
        channel.subscribe((status) => {
          resolve(status === 'SUBSCRIBED')
          channel.unsubscribe()
        })
      })
      checks.realtime = subscribed
      
    } catch (error) {
      console.error('Health check failed:', error)
    }

    return checks
  }

  static logAPICall(method, url, requestData, responseData, duration) {
    if (process.env.NODE_ENV === 'development') {
      console.group(`📡 API Call: ${method} ${url}`)
      console.log('⏱️ Duration:', `${duration}ms`)
      
      if (requestData) {
        console.log('📤 Request:', requestData)
      }
      
      if (responseData) {
        console.log('📥 Response:', responseData)
      }
      
      console.groupEnd()
    }
  }

  static async profileQuery(queryName, queryFn) {
    const startTime = performance.now()
    
    try {
      const result = await queryFn()
      const duration = performance.now() - startTime
      
      console.log(`⚡ Query "${queryName}" completed in ${duration.toFixed(2)}ms`)
      
      return result
    } catch (error) {
      const duration = performance.now() - startTime
      console.error(`❌ Query "${queryName}" failed after ${duration.toFixed(2)}ms:`, error)
      throw error
    }
  }

  static monitorPerformance() {
    if (typeof window === 'undefined') return

    // Monitor page load performance
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0]
        
        console.log('📊 Page Performance:')
        console.log(`  DNS Lookup: ${perfData.domainLookupEnd - perfData.domainLookupStart}ms`)
        console.log(`  TCP Connection: ${perfData.connectEnd - perfData.connectStart}ms`)
        console.log(`  Request: ${perfData.responseStart - perfData.requestStart}ms`)
        console.log(`  Response: ${perfData.responseEnd - perfData.responseStart}ms`)
        console.log(`  DOM Load: ${perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart}ms`)
        console.log(`  Total Load: ${perfData.loadEventEnd - perfData.navigationStart}ms`)
      }, 0)
    })

    // Monitor resource loading
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name.includes('supabase') || entry.name.includes('stripe')) {
          console.log(`🔗 Resource loaded: ${entry.name} (${entry.duration.toFixed(2)}ms)`)
        }
      }
    })
    
    observer.observe({ entryTypes: ['resource'] })
  }
}

// React hook for debugging
function useDebugInfo(componentName) {
  const renderCount = useRef(0)
  const previousProps = useRef()

  renderCount.current++

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔄 ${componentName} rendered (${renderCount.current} times)`)
    }
  })

  const logPropsChange = useCallback((props) => {
    if (process.env.NODE_ENV === 'development' && previousProps.current) {
      const changes = {}
      
      Object.keys(props).forEach(key => {
        if (props[key] !== previousProps.current[key]) {
          changes[key] = {
            from: previousProps.current[key],
            to: props[key]
          }
        }
      })
      
      if (Object.keys(changes).length > 0) {
        console.log(`📝 ${componentName} props changed:`, changes)
      }
    }
    
    previousProps.current = props
  }, [componentName])

  return {
    renderCount: renderCount.current,
    logPropsChange
  }
}
```

### 3. Testing and Validation Tools

```javascript
// API endpoint testing utility
class APITester {
  constructor(baseURL, authToken = null) {
    this.baseURL = baseURL
    this.authToken = authToken
    this.results = []
  }

  async testEndpoint(name, method, path, data = null, expectedStatus = 200) {
    const startTime = performance.now()
    
    try {
      const response = await fetch(`${this.baseURL}${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(this.authToken && { 'Authorization': `Bearer ${this.authToken}` })
        },
        ...(data && { body: JSON.stringify(data) })
      })

      const responseData = await response.json()
      const duration = performance.now() - startTime

      const result = {
        name,
        method,
        path,
        status: response.status,
        expectedStatus,
        success: response.status === expectedStatus,
        duration,
        response: responseData
      }

      this.results.push(result)
      return result

    } catch (error) {
      const duration = performance.now() - startTime
      
      const result = {
        name,
        method,
        path,
        status: 0,
        expectedStatus,
        success: false,
        duration,
        error: error.message
      }

      this.results.push(result)
      return result
    }
  }

  async runTestSuite() {
    console.log('🧪 Running API Test Suite...')

    // Test authentication endpoints
    await this.testEndpoint('Health Check', 'GET', '/health', null, 200)
    await this.testEndpoint('User Profile', 'GET', '/api/profile', null, 200)
    await this.testEndpoint('Invalid Endpoint', 'GET', '/api/nonexistent', null, 404)

    // Test CRUD operations
    const testData = { name: 'Test Item', description: 'Test description' }
    const createResult = await this.testEndpoint('Create Item', 'POST', '/api/items', testData, 201)
    
    if (createResult.success && createResult.response.id) {
      const itemId = createResult.response.id
      await this.testEndpoint('Get Item', 'GET', `/api/items/${itemId}`, null, 200)
      await this.testEndpoint('Update Item', 'PUT', `/api/items/${itemId}`, { name: 'Updated' }, 200)
      await this.testEndpoint('Delete Item', 'DELETE', `/api/items/${itemId}`, null, 200)
    }

    this.printResults()
    return this.results
  }

  printResults() {
    const passed = this.results.filter(r => r.success).length
    const failed = this.results.length - passed
    
    console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`)
    
    this.results.forEach(result => {
      const icon = result.success ? '✅' : '❌'
      console.log(`${icon} ${result.name}: ${result.status} (${result.duration.toFixed(2)}ms)`)
      
      if (!result.success) {
        console.log(`   Expected ${result.expectedStatus}, got ${result.status}`)
        if (result.error) {
          console.log(`   Error: ${result.error}`)
        }
      }
    })
  }
}

// Schema validation utility
class SchemaValidator {
  static validateUserProfile(profile) {
    const errors = []

    if (!profile.id || typeof profile.id !== 'string') {
      errors.push('Invalid or missing user ID')
    }

    if (!profile.email || !this.isValidEmail(profile.email)) {
      errors.push('Invalid email address')
    }

    if (profile.full_name && typeof profile.full_name !== 'string') {
      errors.push('Full name must be a string')
    }

    if (profile.avatar_url && !this.isValidURL(profile.avatar_url)) {
      errors.push('Invalid avatar URL')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  static validateOrder(order) {
    const errors = []

    if (!order.id || typeof order.id !== 'string') {
      errors.push('Invalid or missing order ID')
    }

    if (!order.total_amount || typeof order.total_amount !== 'number' || order.total_amount <= 0) {
      errors.push('Invalid total amount')
    }

    if (!['pending', 'paid', 'failed', 'cancelled'].includes(order.status)) {
      errors.push('Invalid order status')
    }

    if (!order.created_at || !this.isValidISODate(order.created_at)) {
      errors.push('Invalid created_at timestamp')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  static isValidURL(url) {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  static isValidISODate(dateString) {
    const date = new Date(dateString)
    return date instanceof Date && !isNaN(date) && date.toISOString() === dateString
  }
}
```

---

## Code Examples Repository

The complete code examples and utilities shown in this documentation are available in the KCT ecosystem and can be used as reference implementations for building robust, scalable applications with proper error handling, testing, and performance optimization.

### Key Takeaways

1. **Authentication**: Implement secure JWT-based authentication with proper session management
2. **Database**: Use RLS policies and manual relationship fetching for security and performance  
3. **Real-time**: Leverage WebSocket subscriptions for live data updates
4. **File Upload**: Always use secure Edge Functions for file uploads, never client-side direct uploads
5. **Payments**: Implement comprehensive error handling and order tracking for payment flows
6. **Testing**: Use comprehensive testing strategies from unit to end-to-end tests
7. **Performance**: Implement caching, pagination, and connection pooling for optimal performance
8. **Error Handling**: Provide detailed error diagnostics and recovery mechanisms
9. **Security**: Validate all inputs, use proper authentication, and implement rate limiting
10. **Integration**: Design for multi-application architecture with shared API patterns

This documentation provides a complete foundation for building production-ready applications within the KCT ecosystem using modern API patterns and best practices.
