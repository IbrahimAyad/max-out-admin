#!/bin/bash

echo "🧪 Testing Edge Function Environment Variables"
echo "=============================================="
echo ""

echo "1. 📡 Testing admin-hub-api dashboard-overview endpoint:"
curl -s -w "HTTP Status: %{http_code}\n" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2Y3N3aW1xYXh2eWxneGJrbGJ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mzc2MDUzMCwiZXhwIjoyMDY5MzM2NTMwfQ.LCWdoDoyJ_xo05CbRmM7erHsov8PsNqyo31n-bGvYtg" \
  "https://gvcswimqaxvylgxbklbz.supabase.co/functions/v1/admin-hub-api/dashboard-overview"

echo ""
echo "2. 📧 Testing admin-hub-api notifications endpoint:"
curl -s -w "HTTP Status: %{http_code}\n" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2Y3N3aW1xYXh2eWxneGJrbGJ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mzc2MDUzMCwiZXhwIjoyMDY5MzM2NTMwfQ.LCWdoDoyJ_xo05CbRmM7erHsov8PsNqyo31n-bGvYtg" \
  "https://gvcswimqaxvylgxbklbz.supabase.co/functions/v1/admin-hub-api/notifications"

echo ""
echo "3. 📊 Testing admin-hub-api quick-stats endpoint:"
curl -s -w "HTTP Status: %{http_code}\n" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2Y3N3aW1xYXh2eWxneGJrbGJ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mzc2MDUzMCwiZXhwIjoyMDY5MzM2NTMwfQ.LCWdoDoyJ_xo05CbRmM7erHsov8PsNqyo31n-bGvYtg" \
  "https://gvcswimqaxvylgxbklbz.supabase.co/functions/v1/admin-hub-api/quick-stats"

echo ""
echo "4. 🔍 Analysis:"
echo "   - HTTP 200: Edge Function working correctly ✅"
echo "   - HTTP 401: Missing/incorrect environment variables ❌"
echo "   - HTTP 500: Function error (check logs) ⚠️"
echo ""
echo "5. 🛠️ If you see 401/500 errors, set environment variables:"
echo "   supabase secrets set SUPABASE_URL=https://gvcswimqaxvylgxbklbz.supabase.co"
echo "   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key"