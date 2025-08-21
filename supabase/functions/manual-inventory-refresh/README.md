# Manual Inventory Refresh Edge Function

This function provides professional-grade manual inventory refresh capabilities for the Vendor Inbox system, addressing rate limiting issues and supporting batch operations.

## Features

### Rate Limiting Protection
- **Batched API Calls**: Processes up to 50 inventory items per Shopify API request
- **Rate Limit Handling**: Automatic detection and handling of 429 responses
- **Exponential Backoff**: Intelligent retry strategy with jitter to avoid thundering herd
- **Request Spacing**: 2-second delays between API calls to prevent rate limiting

### Queue System & Asynchronous Processing
- **Batch Processing**: Divides large product lists into manageable batches
- **Progress Tracking**: Real-time progress updates in the sync log
- **Error Isolation**: Individual batch failures don't stop the entire process
- **Resume Capability**: Failed batches can be retried independently

### Scalability
- **High Volume Support**: Designed to handle 823+ products without errors
- **Memory Efficient**: Processes data in batches to minimize memory usage
- **Database Optimization**: Uses efficient upsert operations with conflict resolution

### Error Handling & Recovery
- **Graceful Degradation**: Continues processing even when some batches fail
- **Detailed Error Logging**: Comprehensive error tracking with batch-level details
- **Retry Logic**: Automatic retries with exponential backoff for transient failures
- **Status Monitoring**: Complete visibility into sync status and progress

## API Interface

### Request Format
```json
{
  "productIds": [123456789, 987654321, ...],
  "mode": "batch" // optional, defaults to "batch"
}
```

### Response Format
```json
{
  "data": {
    "syncLogId": "uuid-of-sync-operation",
    "totalProducts": 50,
    "successfulProducts": 48,
    "failedProducts": 2,
    "totalVariantsProcessed": 150,
    "inventoryUpdates": 147,
    "processingTime": 45000,
    "errors": [
      {
        "batch": 3,
        "error": "Rate limit exceeded",
        "inventoryItems": [789, 790, 791]
      }
    ]
  }
}
```

## Configuration

### Required Environment Variables
- `SHOPIFY_STORE_DOMAIN`: Your Shopify store domain (e.g., "mystore.myshopify.com")
- `SHOPIFY_ADMIN_TOKEN`: Shopify Admin API access token with inventory read permissions
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key

### Rate Limiting Settings
- **Batch Size**: 50 inventory items per API call
- **Max Retries**: 5 attempts per failed request
- **Base Delay**: 1 second (exponentially increased on retry)
- **Max Delay**: 30 seconds maximum retry delay
- **Rate Limit Delay**: 2 seconds between API calls

## Database Schema

The function works with the following tables:

### vendor_variants
Stores variant information and inventory item IDs:
```sql
CREATE TABLE vendor_variants (
    shopify_variant_id bigint primary key,
    shopify_product_id bigint,
    inventory_item_id bigint,
    -- other fields...
);
```

### vendor_inventory_levels
Tracks current inventory levels:
```sql
CREATE TABLE vendor_inventory_levels (
    inventory_item_id bigint,
    location_id bigint,
    available int,
    last_change_at timestamptz,
    sync_batch_id uuid,
    updated_at timestamptz default now(),
    primary key (inventory_item_id, location_id)
);
```

### inventory_sync_log
Logs all sync operations:
```sql
CREATE TABLE inventory_sync_log (
    id uuid primary key default gen_random_uuid(),
    sync_type text check (sync_type in ('scheduled', 'manual', 'webhook')),
    status text check (status in ('running', 'completed', 'failed')),
    products_synced int default 0,
    errors_count int default 0,
    error_details jsonb,
    triggered_by text not null,
    started_at timestamptz default now(),
    completed_at timestamptz
);
```

## Usage Examples

### Frontend Integration
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Refresh inventory for specific products
const { data, error } = await supabase.functions.invoke('manual-inventory-refresh', {
  body: {
    productIds: [123456789, 987654321, 555444333],
    mode: 'batch'
  }
});

if (error) {
  console.error('Inventory refresh failed:', error);
} else {
  console.log('Inventory refresh completed:', data);
}
```

### Progress Monitoring
```typescript
// Get sync status
const { data: syncStatus } = await supabase.functions.invoke('inventory-sync-status');

// Check if manual refresh is available
if (syncStatus.data.scheduling.canManualRefresh) {
  // Proceed with refresh
} else {
  // Show cooldown message
  console.log('Manual refresh on cooldown until:', syncStatus.data.scheduling.manualRefreshCooldown);
}
```

## Error Codes

- `INVENTORY_REFRESH_FAILED`: General failure in the refresh process
- `SHOPIFY_RATE_LIMITED`: Shopify API rate limits exceeded (handled automatically)
- `MISSING_CREDENTIALS`: Shopify credentials not configured
- `INVALID_PRODUCT_IDS`: Product IDs array is empty or invalid

## Monitoring & Debugging

### Sync Logs
All operations are logged in the `inventory_sync_log` table with:
- Sync type and trigger information
- Start/completion timestamps
- Success/failure status
- Product counts and error details
- Batch tracking IDs

### Performance Metrics
- Processing time per batch
- Total variants processed
- Inventory updates applied
- Error rates and retry counts

### Health Checks
Use the `inventory-sync-status` function to monitor:
- Current sync operations
- Rate limiting status
- Historical performance
- Error trends

## Backward Compatibility

The function maintains full backward compatibility with existing UI implementations:
- Same API endpoint format
- Compatible request/response structure
- No breaking changes to frontend integration
- Enhanced error handling improves reliability

## Deployment

Use the Supabase CLI or batch deployment tools:

```bash
supabase functions deploy manual-inventory-refresh
```

Or use the batch deployment tool:
```typescript
batch_deploy_edge_functions([
  {
    slug: "manual-inventory-refresh",
    file_path: "supabase/functions/manual-inventory-refresh/index.ts",
    type: "normal",
    description: "Professional inventory refresh with rate limiting protection"
  }
]);
```