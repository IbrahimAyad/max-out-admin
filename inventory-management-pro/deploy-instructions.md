# Deployment Instructions for Inventory Management Pro

## Pre-Deployment Checklist

### 1. Environment Variables
Ensure the following environment variables are set in your deployment environment:

```env
VITE_SUPABASE_URL=https://gvcswimqaxvylgxbklbz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2Y3N3aW1xYXh2eWxneGJrbGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NjA1MzAsImV4cCI6MjA2OTMzNjUzMH0.UZdiGcJXUV5VYetjWXV26inmbj2yXdiT03Z6t_5Lg24
```

### 2. Database Setup
Ensure your Supabase database has all required tables:
- `inventory_products`
- `inventory_variants` 
- `smart_collections`
- `collection_products`
- `product_recommendations`
- `analytics_page_views`
- `analytics_events`
- `analytics_product_performance`

### 3. RLS Policies
Verify that Row Level Security policies are configured properly for your use case.

## Build and Deploy

### 1. Build the Application
```bash
cd inventory-management-pro
npm install
npm run build
```

### 2. Deploy to Vercel (Recommended)
```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Deploy
vercel --prod
```

### 3. Alternative: Deploy to Netlify
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

## Post-Deployment Setup

### 1. Seed AI Features (Optional)
To populate the system with sample AI data for demonstration:

```bash
# Set your Supabase service key
export SUPABASE_SERVICE_KEY=your_service_key_here

# Run the population script
node populate-ai-features.js
```

### 2. Test Core Features
1. Navigate to the deployed URL
2. Test dashboard loading
3. Create/edit a product to verify database connectivity
4. Check that analytics are being tracked
5. Verify smart recommendations appear on product pages

### 3. Authentication Setup (If Needed)
If you need user authentication:
1. Configure Supabase Auth providers
2. Update RLS policies to require authentication
3. Add login/signup components

## Monitoring

### Health Check Endpoints
The application doesn't have dedicated health check endpoints, but you can monitor:
- Main dashboard loads without errors
- API calls to Supabase succeed
- Analytics data is being recorded

### Performance Monitoring
- Monitor Supabase usage in the Supabase dashboard
- Check browser console for JavaScript errors
- Monitor page load times

## Troubleshooting

### Common Issues

1. **401 Errors on Product Operations**
   - Check RLS policies
   - Verify user authentication if required
   - Ensure proper permissions are set

2. **Analytics Not Working**
   - Check browser network tab for failed requests
   - Verify analytics tables exist in database
   - Check console for JavaScript errors

3. **Recommendations Not Showing**
   - Verify product_recommendations table has data
   - Run the AI seeding script
   - Check that products exist in the inventory

4. **Build Failures**
   - Ensure all dependencies are installed
   - Check TypeScript compilation errors
   - Verify environment variables are set

### Debug Mode
Enable debug logging in production:
```javascript
// In browser console
localStorage.setItem('debug', 'analytics')
```

## Security Considerations

1. **Environment Variables**: Never commit sensitive keys to version control
2. **RLS Policies**: Ensure proper row-level security is configured
3. **CORS**: Verify CORS settings in Supabase for your domain
4. **Rate Limiting**: Consider implementing rate limiting for API calls

## Performance Optimization

1. **Caching**: Implement query caching for frequently accessed data
2. **Image Optimization**: Ensure product images are optimized and compressed
3. **Code Splitting**: Consider implementing route-based code splitting
4. **CDN**: Use a CDN for static assets if needed

## Maintenance

### Regular Tasks
1. Monitor Supabase usage and costs
2. Review analytics data for insights
3. Update dependencies regularly
4. Backup database regularly

### Scaling Considerations
- Monitor database performance as data grows
- Consider implementing pagination for large datasets
- Optimize queries with proper indexing
- Consider caching strategies for high-traffic scenarios
