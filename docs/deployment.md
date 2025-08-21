# Vercel Deployment Guide

## Overview
This guide walks you through deploying the entire KCT Ecosystem to Vercel with custom subdomains for a professional setup.

## Prerequisites
1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Custom Domain**: Ensure you own `kctmenswear.com` (or your desired domain)
3. **GitHub Repository**: The ecosystem should be pushed to GitHub
4. **Supabase Project**: Each app needs Supabase credentials

## 🚀 Deployment Strategy

### Professional Subdomain Setup
Each application gets its own subdomain:

| Application | Subdomain | Purpose |
|------------|-----------|----------|
| Admin Hub | `admin.kctmenswear.com` | Main business dashboard |
| Inventory Manager | `inventory.kctmenswear.com` | Inventory management |
| Wedding Portal | `wedding.kctmenswear.com` | Wedding coordination |
| Groomsmen Portal | `groomsmen.kctmenswear.com` | Groomsmen interface |
| Order Management | `orders.kctmenswear.com` | Order processing |
| User Profiles | `profiles.kctmenswear.com` | Customer profiles |

## 🛠️ Step-by-Step Deployment

### Step 1: Domain Setup
1. **Add Domain to Vercel**
   - Go to Vercel Dashboard → Settings → Domains
   - Click "Add Domain" and enter `kctmenswear.com`
   - Follow DNS verification steps

2. **Configure DNS Records**
   ```
   Type: CNAME
   Name: admin
   Value: cname.vercel-dns.com
   
   Type: CNAME
   Name: inventory
   Value: cname.vercel-dns.com
   
   Type: CNAME
   Name: wedding
   Value: cname.vercel-dns.com
   
   Type: CNAME
   Name: groomsmen
   Value: cname.vercel-dns.com
   
   Type: CNAME
   Name: orders
   Value: cname.vercel-dns.com
   
   Type: CNAME
   Name: profiles
   Value: cname.vercel-dns.com
   ```

### Step 2: Deploy Each Application

#### Application 1: Admin Hub
1. **Create New Project**
   - Go to Vercel Dashboard → "Add New" → "Project"
   - Import from GitHub: Select your repository
   - Project Name: `kct-admin-hub`

2. **Configure Build Settings**
   ```
   Framework Preset: Vite
   Root Directory: apps/admin-hub
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

3. **Environment Variables**
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Custom Domain**
   - Go to Project Settings → Domains
   - Add Domain: `admin.kctmenswear.com`

5. **Deploy**
   - Click "Deploy" and wait for completion

#### Application 2: Inventory Manager
Repeat the process with these settings:
```
Project Name: kct-inventory-manager
Root Directory: apps/inventory-manager
Custom Domain: inventory.kctmenswear.com
```

#### Application 3: Wedding Portal
```
Project Name: kct-wedding-portal
Root Directory: apps/wedding-portal
Custom Domain: wedding.kctmenswear.com
```

#### Application 4: Groomsmen Portal
```
Project Name: kct-groomsmen-portal
Root Directory: apps/groomsmen-portal
Custom Domain: groomsmen.kctmenswear.com
```

#### Application 5: Order Management
```
Project Name: kct-order-management
Root Directory: apps/order-management
Custom Domain: orders.kctmenswear.com
```

#### Application 6: User Profiles
```
Project Name: kct-user-profiles
Root Directory: apps/user-profiles
Custom Domain: profiles.kctmenswear.com
```

## 🔧 Automation Scripts

### Deploy All Apps Script
Create this script for easier deployments:

```bash
#!/bin/bash
# deploy-all.sh

echo "Deploying KCT Ecosystem to Vercel..."

# Build all applications
npm run build:all

echo "All applications built successfully!"
echo "Push to GitHub to trigger Vercel deployments"

git add .
git commit -m "Deploy: Updated all applications"
git push origin main

echo "Deployment triggered! Check Vercel dashboard for progress."
```

## 🔍 Verification

### Test Each Deployment
1. **Admin Hub**: https://admin.kctmenswear.com
2. **Inventory**: https://inventory.kctmenswear.com
3. **Wedding Portal**: https://wedding.kctmenswear.com
4. **Groomsmen Portal**: https://groomsmen.kctmenswear.com
5. **Order Management**: https://orders.kctmenswear.com
6. **User Profiles**: https://profiles.kctmenswear.com

### Health Check
For each URL, verify:
- ✅ Site loads correctly
- ✅ Authentication works
- ✅ Database connections active
- ✅ API endpoints responding
- ✅ Mobile responsiveness

## 🚑 Troubleshooting

### Common Issues

**Build Failures**
```bash
# Fix: Update build commands in Vercel
Build Command: cd apps/[app-name] && npm run build
Install Command: cd apps/[app-name] && npm install
```

**Environment Variables**
- Ensure all apps have Supabase credentials
- Variable names must start with `VITE_` for Vite apps

**Domain Issues**
- Wait 24-48 hours for DNS propagation
- Verify CNAME records in your domain provider

**404 Errors**
- Check `outputDirectory` setting points to `dist`
- Ensure `rewrites` are configured for SPA routing

## 🔄 Maintenance

### Regular Updates
1. **Weekly**: Check all deployments are healthy
2. **Monthly**: Review Vercel usage and costs
3. **Quarterly**: Update dependencies and security patches

### Backup Strategy
- GitHub repository serves as code backup
- Supabase handles data backups
- Export Vercel project settings regularly

## 📊 Monitoring

### Vercel Analytics
Enable analytics for each project:
- Go to Project → Analytics
- Monitor page views, performance, errors

### Custom Monitoring
Consider adding:
- Error tracking (Sentry)
- Performance monitoring
- Uptime monitoring

## 💰 Cost Optimization

### Vercel Pricing
- **Hobby Plan**: Free for personal projects
- **Pro Plan**: $20/month for commercial use
- **Team Plan**: $100/month for teams

### Optimization Tips
- Use Vercel's Edge Network for better performance
- Enable Edge Functions for server-side logic
- Optimize images with Vercel Image Optimization

---

**Need Help?** Contact the development team for deployment assistance.