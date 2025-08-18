# KCT Menswear Essential Keys & Quick Setup Guide
**Frontend Developer Quick Start - Copy & Paste Ready**

**Updated:** August 18, 2025 | **Author:** MiniMax Agent

---

## 🔑 **Critical API Keys & URLs**

### **Production Backend URLs**
```javascript
// Main Order Processing Dashboard
const ORDER_ADMIN_URL = "https://rtbbsdcrfbha.space.minimax.io"

// Wedding Management System
const WEDDING_PORTAL_URL = "https://tkoylj2fx7f5.space.minimax.io"
const WEDDING_ADMIN_URL = "https://9858w2bjznjh.space.minimax.io"
const GROOMSMEN_PORTAL_URL = "https://qs4j1oh0oweu.space.minimax.io"

// Supabase Backend
const SUPABASE_URL = "https://gvcswimqaxvylgxbklbz.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### **Payment Integration**
```javascript
// Stripe Configuration
const STRIPE_PUBLISHABLE_KEY = "pk_live_51RAMT2CHc12x7sCzz0cBxUwBPONdyvxMnhDRMwC1bgoaFlDgmEmfvcJZT7yk7jOuEo4LpWkFpb5Gv88DJ9fSB49j00QtRac8uW"

// EasyPost Integration
const EASYPOST_API_KEY = "EZAKf82c7d30d3fa4781a76b2b7f1bd85c0a1wfhRGGxu6fZdxxWC9kVjw"
const EASYPOST_WEBHOOK_URL = "https://gvcswimqaxvylgxbklbz.supabase.co/functions/v1/easypost-webhook"

// SendGrid Configuration
const SENDGRID_API_KEY = "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"
const FROM_EMAIL = "noreply@kctmenswear.com"
const ADMIN_EMAIL = "KCTMenswear@gmail.com"
```

---

## 🚀 **Quick Setup Commands**

### **Environment Variables (.env)**
```bash
# Copy-paste into your .env file
NEXT_PUBLIC_SUPABASE_URL=https://gvcswimqaxvylgxbklbz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51RAMT2CHc12x7sCzz0cBxUwBPONdyvxMnhDRMwC1bgoaFlDgmEmfvcJZT7yk7jOuEo4LpWkFpb5Gv88DJ9fSB49j00QtRac8uW

# Backend Only (Never expose on frontend)
SUPABASE_SERVICE_ROLE_KEY=your_service_key
STRIPE_SECRET_KEY=sk_live_...
EASYPOST_API_KEY=EZAK...
SENDGRID_API_KEY=SG...
```

### **Installation Commands**
```bash
# Install required packages
npm install @supabase/supabase-js @stripe/stripe-js

# Initialize Supabase client
npm install @supabase/auth-helpers-nextjs
```

---

## 📋 **Essential API Endpoints**

### **Order Management**
```javascript
// Stripe Payment Intent (Core Products)
POST /functions/v1/stripe-payment-intent

// Direct Order Creation (Catalog Products)
POST /functions/v1/order-management

// Shipping Rates
POST /functions/v1/shipping-rates

// Shipping Labels
POST /functions/v1/shipping-label

// Email Notifications
POST /functions/v1/send-email
```

### **Wedding System**
```javascript
// Wedding Management
POST /functions/v1/wedding-management

// AI Outfit Coordination
POST /functions/v1/ai-outfit-coordinator

// Wedding Shipping
POST /functions/v1/easypost-wedding-shipping

// Wedding Emails
POST /functions/v1/sendgrid-wedding-emails

// Groomsmen Invitation
POST /functions/v1/groomsmen-invitation/validate
```

---

## 💻 **Copy-Paste Code Examples**

### **Supabase Client Setup**
```javascript
// lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)
```

### **Stripe Checkout Creation**
```javascript
// Create Stripe checkout for core products
const createCheckout = async (cartItems, customerEmail) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/stripe-payment-intent`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
        cartItems,
        customerEmail
      })
    }
  )
  
  return await response.json()
}
```

### **Direct Order Creation**
```javascript
// Create direct order for catalog products
const createOrder = async (orderData) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/order-management`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'create_order_queue_entry',
        order_data: orderData
      })
    }
  )
  
  return await response.json()
}
```

### **Shipping Rate Calculation**
```javascript
// Get shipping rates
const getShippingRates = async (shippingData) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/shipping-rates`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(shippingData)
    }
  )
  
  return await response.json()
}
```

---

## ✅ **Implementation Checklist**

### **Must-Have Setup**
- [ ] Add environment variables to your project
- [ ] Install Supabase and Stripe packages
- [ ] Initialize Supabase client
- [ ] Test API connectivity
- [ ] Configure authentication

### **Order Integration**
- [ ] Implement Stripe checkout for core products
- [ ] Create direct order flow for catalog products
- [ ] Add shipping rate calculation
- [ ] Set up order status tracking
- [ ] Configure email notifications

### **Wedding Integration (Optional)**
- [ ] Implement wedding creation flow
- [ ] Add party member management
- [ ] Set up measurement collection
- [ ] Configure outfit coordination
- [ ] Add timeline management

---

## 🔧 **Testing Credentials**

### **Admin Login**
```
Email: admin@kctmenswear.com
Password: KCTAdmin2025!
URL: https://rtbbsdcrfbha.space.minimax.io
```

### **Stripe Test Cards**
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Expiry: Any future date
CVV: Any 3 digits
```

---

## 🆘 **Quick Troubleshooting**

### **Common Issues**
1. **CORS Errors**: Check Supabase URL and API key
2. **Auth Failures**: Verify environment variables
3. **Payment Errors**: Test with Stripe test mode first
4. **API Errors**: Check function logs in Supabase dashboard

### **Support Resources**
- **Order System**: Test at https://rtbbsdcrfbha.space.minimax.io
- **API Documentation**: Reference the 34-page comprehensive guide
- **Webhooks**: Configure in respective service dashboards

---

**🎯 Need Help?** Check the comprehensive documentation files or test the live admin systems first.