# R2 to Supabase Image Management Guide

## Overview
This guide explains how to manage product images stored in Cloudflare R2 and sync them with your Supabase database for the KCT Menswear admin system.

## Current Setup
- **Images stored in**: Cloudflare R2 bucket (`kct-products`)
- **CDN URL**: `https://cdn.kctmenswear.com/`
- **Database**: Supabase (product catalog and references)

## Why This Architecture?
- **R2**: Stores actual image files (cost-effective, fast CDN)
- **Supabase**: Stores image URLs and metadata (searchable, relational)
- **Result**: Fast loading + easy management

## Image URL Structure
All product images follow this pattern:
```
https://cdn.kctmenswear.com/[category]/[subcategory]/[product-slug]/[view].webp
```

Example:
```
https://cdn.kctmenswear.com/blazers/prom/mens-black-floral-pattern-prom-blazer/front.webp
```

## Methods to Sync Images

### Method 1: Manual URL Entry (Current)
**When to use**: Adding individual products

1. Upload images to R2 bucket via Cloudflare dashboard
2. Copy the CDN URL
3. Add URL to product in Supabase/Admin panel

**Pros**: Simple, no code needed
**Cons**: Time-consuming for bulk updates

### Method 2: Bulk Import Script (Recommended)
**When to use**: Importing many products at once

We can create a script that:
1. Scans all images in your R2 bucket
2. Automatically generates URLs
3. Updates Supabase with all image URLs
4. Matches images to products by naming convention

**How it works**:
```javascript
// Example: Script finds these files in R2:
blazers/wedding/classic-black-tuxedo/front.webp
blazers/wedding/classic-black-tuxedo/back.webp
blazers/wedding/classic-black-tuxedo/side.webp

// Automatically creates database entries:
{
  product_slug: "classic-black-tuxedo",
  category: "blazers",
  subcategory: "wedding",
  images: {
    front: "https://cdn.kctmenswear.com/blazers/wedding/classic-black-tuxedo/front.webp",
    back: "https://cdn.kctmenswear.com/blazers/wedding/classic-black-tuxedo/back.webp",
    side: "https://cdn.kctmenswear.com/blazers/wedding/classic-black-tuxedo/side.webp"
  }
}
```

### Method 3: Cloudflare Worker API
**When to use**: For automatic, real-time syncing

A Cloudflare Worker can:
- Automatically detect new uploads to R2
- Generate URLs instantly
- Update Supabase immediately
- Provide an API for the admin panel

**Benefits**:
- Fully automated
- Real-time updates
- No manual work needed

## Implementation Options

### Option A: One-Time Bulk Import
```bash
# Run this script to import all existing images
node sync-r2-to-supabase.js

# Output:
# ✓ Found 2,847 images in R2
# ✓ Created 615 product entries
# ✓ Linked 2,847 image URLs
# ✓ Sync complete!
```

### Option B: Admin Panel Integration
Add a button in your admin panel:
- **"Sync R2 Images"** - Scans R2 and updates database
- **"Import New Images"** - Finds only new images
- **"Verify Image Links"** - Checks all URLs are working

### Option C: Automatic Worker
Set up once and forget:
- Monitors R2 for new uploads
- Automatically creates database entries
- Sends notifications when complete

## Naming Convention Requirements

For automatic syncing to work, images must follow this structure:

```
[category]/[subcategory]/[product-slug]/[view].webp

Where:
- category: blazers, suits, mens-shirts, etc.
- subcategory: wedding, prom, casual, etc.
- product-slug: url-friendly product name
- view: front, back, side, detail, etc.
```

## Quick Start Recommendations

### For Immediate Use:
1. **Continue manual process** for now
2. **We prepare bulk import script** for existing images
3. **Run script once** to sync all current images

### For Long-term:
1. **Implement Cloudflare Worker** for automation
2. **Add sync button** to admin panel
3. **Set up automatic monitoring**

## Database Schema

Your Supabase database should have:

```sql
-- Products table
products (
  id uuid,
  slug text,
  name text,
  category text,
  subcategory text,
  main_image_url text
)

-- Product images table
product_images (
  id uuid,
  product_id uuid,
  image_type text, -- 'front', 'back', 'side', etc.
  image_url text,
  cdn_path text,
  display_order int
)
```

## Cost Comparison

### Current Manual Process:
- Time: ~2 minutes per product
- 1000 products = ~33 hours of work

### With Automation:
- Initial setup: 2-4 hours
- Ongoing: 0 minutes (fully automatic)
- ROI: Saves 30+ hours immediately

## Next Steps

1. **Decide on approach** (bulk import vs full automation)
2. **Verify naming convention** in R2 bucket
3. **Run test import** on subset of products
4. **Deploy chosen solution**

## Support

For implementation help:
- Review R2 bucket structure
- Verify Supabase schema
- Test with sample products
- Deploy automation solution

---

**Ready to automate?** The bulk import script can be ready in hours and save days of manual work!