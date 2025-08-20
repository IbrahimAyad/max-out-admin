# Vercel Deployment Instructions

## 🚀 **Ready to Deploy!**

Your entire KCT ecosystem is now organized and ready for professional Vercel deployment with custom subdomains.

## 📋 **Next Steps:**

### 1. **Vercel Account Setup**
- Sign up/login at [vercel.com](https://vercel.com)
- Connect your GitHub account

### 2. **Import Repository**
- Click "Add New Project" in Vercel
- Import: `https://github.com/IbrahimAyad/max-out-admin.git`

### 3. **Deploy Each Application**

For **each of the 6 applications**, create separate Vercel projects:

#### **Admin Hub** (`admin.kctmenswear.com`)
```
Project Name: kct-admin-hub
Framework: Vite
Root Directory: apps/admin-hub
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

#### **Inventory Manager** (`inventory.kctmenswear.com`)
```
Project Name: kct-inventory-manager
Framework: Vite
Root Directory: apps/inventory-manager
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

#### **Wedding Portal** (`wedding.kctmenswear.com`)
```
Project Name: kct-wedding-portal
Framework: Vite
Root Directory: apps/wedding-portal
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

#### **Groomsmen Portal** (`groomsmen.kctmenswear.com`)
```
Project Name: kct-groomsmen-portal
Framework: Vite
Root Directory: apps/groomsmen-portal
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

#### **Order Management** (`orders.kctmenswear.com`)
```
Project Name: kct-order-management
Framework: Vite
Root Directory: apps/order-management
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

#### **User Profiles** (`profiles.kctmenswear.com`)
```
Project Name: kct-user-profiles
Framework: Vite
Root Directory: apps/user-profiles
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

### 4. **Environment Variables**

For **each project**, add these environment variables:
```
VITE_SUPABASE_URL=https://gvcswimqaxvylgxbklbz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2Y3N3aW1xYXh2eWxneGJrbGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NjA1MzAsImV4cCI6MjA2OTMzNjUzMH0.UZdiGcJXUV5VYetjWXV26inmbj2yXdiT03Z6t_5Lg24
```

### 5. **Custom Domains (Optional)**

If you own `kctmenswear.com`, add custom domains:
- Go to each project → Settings → Domains
- Add the respective subdomain

### 6. **Deploy & Test**

Once deployed, your applications will be available at:
- **Admin Hub**: https://kct-admin-hub.vercel.app (or admin.kctmenswear.com)
- **Inventory**: https://kct-inventory-manager.vercel.app
- **Wedding**: https://kct-wedding-portal.vercel.app
- **Groomsmen**: https://kct-groomsmen-portal.vercel.app
- **Orders**: https://kct-order-management.vercel.app
- **Profiles**: https://kct-user-profiles.vercel.app

## 🎯 **Result**

You'll have a professional, scalable ecosystem with:
- ✅ 6 distinct applications
- ✅ Professional subdomain structure
- ✅ Unified codebase management
- ✅ Easy maintenance and updates
- ✅ Production-ready deployment

---

**Need help with deployment?** The complete guide is in `/docs/deployment.md`