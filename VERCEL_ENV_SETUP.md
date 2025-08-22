# 🚀 Complete Environment Variables Setup for All 6 Vercel Apps

## 📋 Summary

**GOOD NEWS**: Only 2 apps need environment variables in Vercel!

### Apps That Need Environment Variables:
1. **max-out-orders** (Order Management)
2. **max-out-inventory-manager** (Enhanced Inventory) 

### Apps That Don't Need Environment Variables:
3. **max-out-admin** (Admin Hub) - ✅ Hardcoded
4. **max-out-groomsmen-portal** - ✅ Hardcoded  
5. **max-out-user-profiles** - ✅ Hardcoded
6. **max-out-wedding-portal** - ✅ Hardcoded

---

## 🔧 Environment Variables Needed

For the 2 apps that need them, add these **exact** variables:

```env
VITE_SUPABASE_URL=https://gvcswimqaxvylgxbklbz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2Y3N3aW1xYXh2eWxneGJrbGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NjA1MzAsImV4cCI6MjA2OTMzNjUzMH0.UZdiGcJXUV5VYetjWXV26inmbj2yXdiT03Z6t_5Lg24
```

---

## ⚡ Fastest Way to Add Environment Variables in Vercel

### Method 1: Vercel CLI (Fastest)
```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Set variables for Order Management
vercel env add VITE_SUPABASE_URL production --value="https://gvcswimqaxvylgxbklbz.supabase.co" --project=max-out-orders
vercel env add VITE_SUPABASE_ANON_KEY production --value="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2Y3N3aW1xYXh2eWxneGJrbGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NjA1MzAsImV4cCI6MjA2OTMzNjUzMH0.UZdiGcJXUV5VYetjWXV26inmbj2yXdiT03Z6t_5Lg24" --project=max-out-orders

# Set variables for Enhanced Inventory
vercel env add VITE_SUPABASE_URL production --value="https://gvcswimqaxvylgxbklbz.supabase.co" --project=max-out-inventory-manager
vercel env add VITE_SUPABASE_ANON_KEY production --value="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2Y3N3aW1xYXh2eWxneGJrbGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NjA1MzAsImV4cCI6MjA2OTMzNjUzMH0.UZdiGcJXUV5VYetjWXV26inmbj2yXdiT03Z6t_5Lg24" --project=max-out-inventory-manager
```

### Method 2: Vercel Dashboard (Manual)
1. Go to **Vercel Dashboard**
2. For each project (max-out-orders, max-out-inventory-manager):
   - Navigate to **Settings** → **Environment Variables**
   - Click **Add New**
   - Add both variables above
   - Set to **Production** environment

### Method 3: Bulk Import (If Available)
Some Vercel projects allow importing `.env` files directly in the dashboard.

---

## 🎯 After Adding Variables

1. **Redeploy both apps**:
   - Either push a new commit
   - Or click "Redeploy" in Vercel dashboard

2. **Verify the fix**:
   - Visit https://max-out-inventory-manager.vercel.app
   - The 401 errors should disappear
   - Debug components will show "✅ CORRECT" for environment variables

---

## 🔍 Why Only 2 Apps Need This

**Apps with hardcoded values** (no env vars needed):
- Admin Hub: `const supabaseUrl = 'https://gvcswimqaxvylgxbklbz.supabase.co'`
- Groomsmen Portal: `const supabaseUrl = 'https://gvcswimqaxvylgxbklbz.supabase.co'`
- User Profiles: `const supabaseUrl = 'https://gvcswimqaxvylgxbklbz.supabase.co'`
- Wedding Portal: `const supabaseUrl = 'https://gvcswimqaxvylgxbklbz.supabase.co'`

**Apps with environment variable setup** (need env vars):
- Order Management: `const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '...'`
- Enhanced Inventory: `const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '...'`

The 401 error is definitely coming from the Enhanced Inventory Manager missing these environment variables in Vercel!