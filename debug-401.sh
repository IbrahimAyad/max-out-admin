#!/bin/bash

echo "🔍 Debugging Enhanced Inventory Manager 401 Errors"
echo "================================================="
echo ""

echo "1. 📂 Checking project structure:"
echo "   Current directory: $(pwd)"
echo "   Enhanced Inventory Manager location:"
ls -la kct-inventory-manager/ 2>/dev/null || echo "   ❌ kct-inventory-manager directory not found"
echo ""

echo "2. 🌐 Testing Supabase API directly:"
echo "   URL: https://gvcswimqaxvylgxbklbz.supabase.co"
echo "   Endpoint: /rest/v1/products"

curl -s -w "HTTP Status: %{http_code}\n" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2Y3N3aW1xYXh2eWxneGJrbGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NjA1MzAsImV4cCI6MjA2OTMzNjUzMH0.UZdiGcJXUV5VYetjWXV26inmbj2yXdiT03Z6t_5Lg24" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2Y3N3aW1xYXh2eWxneGJrbGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NjA1MzAsImV4cCI6MjA2OTMzNjUzMH0.UZdiGcJXUV5VYetjWXV26inmbj2yXdiT03Z6t_5Lg24" \
  "https://gvcswimqaxvylgxbklbz.supabase.co/rest/v1/products?select=id,name&limit=1"

echo ""
echo "3. 🧪 Testing enhanced_product_variants:"

curl -s -w "HTTP Status: %{http_code}\n" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2Y3N3aW1xYXh2eWxneGJrbGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NjA1MzAsImV4cCI6MjA2OTMzNjUzMH0.UZdiGcJXUV5VYetjWXV26inmbj2yXdiT03Z6t_5Lg24" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2Y3N3aW1xYXh2eWxneGJrbGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NjA1MzAsImV4cCI6MjA2OTMzNjUzMH0.UZdiGcJXUV5VYetjWXV26inmbj2yXdiT03Z6t_5Lg24" \
  "https://gvcswimqaxvylgxbklbz.supabase.co/rest/v1/enhanced_product_variants?select=id,sku&limit=1"

echo ""
echo "4. 🔧 Environment check:"
echo "   .env.local exists: $([ -f kct-inventory-manager/.env.local ] && echo "✅ Yes" || echo "❌ No")"

if [ -f kct-inventory-manager/.env.local ]; then
  echo "   .env.local contents:"
  cat kct-inventory-manager/.env.local | sed 's/^/      /'
fi

echo ""
echo "5. 💡 Possible causes of 401 errors:"
echo "   - Environment variables not set in Vercel deployment"
echo "   - Incorrect URL or anon key in production"
echo "   - Authentication state causing issues in frontend"
echo "   - Network or CORS issues"
echo "   - Cache issues in Vercel deployment"