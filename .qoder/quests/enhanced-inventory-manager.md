# Enhanced Inventory Manager Design Document

## 1. Overview

The Enhanced Inventory Manager is a standalone application that provides advanced inventory management capabilities for KCT Menswear products. It offers multiple view modes, comprehensive filtering, real-time statistics, and advanced vendor sync functionality. The application is designed to work with the `enhanced_product_variants` table and provides a more sophisticated interface than the basic inventory management in the Admin Hub.

## 2. Architecture

The Enhanced Inventory Manager is a standalone React application that:
- Connects directly to Supabase for data operations
- Uses a component-based architecture with reusable UI components
- Implements multiple view modes for different inventory management tasks
- Integrates with Shopify vendor systems through the Vendor Inbox feature
- Follows a standalone deployment model rather than being embedded in the Admin Hub

### Component Hierarchy

```
EnhancedInventoryManager (Root Component)
├── ProductVariantCard
├── SizeMatrixView
├── LowStockAlerts
├── VendorInbox
├── BulkEditModal
└── AddVariantModal
```

## 3. Core Features

### 3.1 Multiple View Modes
- **Grid View**: Traditional card-based view of all product variants
- **Size Matrix**: Matrix view showing inventory levels across sizes for each product
- **Low Stock Alerts**: Dedicated view highlighting variants with low inventory
- **Vendor Inbox**: Interface for managing products from Shopify vendor

### 3.2 Advanced Filtering and Search
- Search by SKU, product name, or color
- Filter by product category
- Filter by stock status (in stock, low stock, out of stock)

### 3.3 Real-time Statistics Dashboard
- Total variants count
- In stock variants count
- Low stock variants count
- Out of stock variants count
- Total inventory value

### 3.4 Bulk Operations
- Select multiple variants for bulk editing
- Bulk update inventory quantities
- Bulk update pricing information
- Export data to CSV

### 3.5 Vendor Inbox Integration
- View products from Shopify vendor
- Make import/stage/skip decisions for vendor products
- Bulk actions for vendor product decisions

## 4. Data Models

### 4.1 Enhanced Product Variants
The system uses the `enhanced_product_variants` table which contains:
- `id`: Unique identifier for the variant
- `product_id`: Reference to the parent product
- `sku`: Stock Keeping Unit
- `color`: Color of the variant
- `size`: Size specification
- `inventory_quantity`: Current inventory count
- `available_quantity`: Available for sale count
- `price_cents`: Price in cents
- `stock_status`: Current stock status (in_stock, low_stock, out_of_stock)
- `last_inventory_update`: Timestamp of last inventory update

### 4.2 Vendor Inbox Variants
The system uses the `v_vendor_inbox_variants` database view which contains:
- `shopify_variant_id`: Shopify variant identifier
- `shopify_product_id`: Shopify product identifier
- `sku`: Stock Keeping Unit
- `title`: Product title
- `color_name`: Color name
- `size`: Size specification
- `inventory_quantity`: Current inventory count
- `price`: Product price
- `decision`: Import decision status
- `created_at`: Timestamp of record creation

## 5. Integration with Admin Hub

The Enhanced Inventory Manager is deployed as a standalone application and integrated with the Admin Hub through external navigation:

### 5.1 External Navigation Pattern
- The Admin Hub contains links to the Enhanced Inventory Manager
- Users are redirected to the standalone application when accessing inventory management
- This approach allows for independent deployment and scaling of the inventory management system

### 5.2 Current Integration Points
1. **Quick Navigation**: Links in the Admin Hub dashboard that open the Enhanced Inventory Manager in a new tab
2. **Direct URL Access**: Users can access the inventory manager directly at its deployment URL

## 6. API Endpoints

The Enhanced Inventory Manager interacts directly with Supabase through client-side operations:

### 6.1 Product Variants Operations
- `GET /enhanced_product_variants`: Retrieve all product variants
- `UPDATE /enhanced_product_variants`: Update variant information
- `DELETE /enhanced_product_variants`: Remove variants

### 6.2 Vendor Inbox Operations
- `GET /v_vendor_inbox_variants`: Retrieve vendor inbox variants
- `UPDATE /vendor_inbox_variants`: Update import decisions

## 7. State Management

The application uses React's built-in state management with custom hooks:
- `useInventory`: Manages product variant data and operations
- `useVendorInbox`: Manages vendor inbox data and operations
- Local component state for UI interactions (filters, selections, modals)

## 8. UI Components

### 8.1 Core Components
- `EnhancedInventoryManager`: Main application component
- `ProductVariantCard`: Displays individual product variant information
- `SizeMatrixView`: Shows inventory levels in a matrix format
- `LowStockAlerts`: Highlights variants with low inventory
- `VendorInbox`: Manages vendor product decisions

### 8.2 Modal Components
- `BulkEditModal`: Interface for bulk editing operations
- `AddVariantModal`: Form for adding new product variants

## 9. Deployment Architecture

### 9.1 Standalone Deployment
- Deployed as an independent Vite/React application
- Hosted on Vercel at https://max-out-inventory-manager.vercel.app
- Connects directly to Supabase backend

### 9.2 Environment Configuration
- Uses environment variables for Supabase connection configuration
- Configuration values are stored in `.env` files

## 10. Authentication and Environment Variables

The Enhanced Inventory Manager requires proper environment variable configuration to authenticate with Supabase. The 401 errors you're experiencing are due to missing or incorrect environment variables in the Vercel deployment.

### 10.1 Required Environment Variables
- `VITE_SUPABASE_URL`: The URL of the Supabase project
- `VITE_SUPABASE_ANON_KEY`: The anonymous key for Supabase authentication

### 10.2 Vercel Environment Variable Setup
To fix the 401 errors, you need to set the environment variables in Vercel:

```bash
# Set variables for Enhanced Inventory Manager
vercel env add VITE_SUPABASE_URL production --value="https://gvcswimqaxvylgxbklbz.supabase.co" --project=max-out-inventory-manager
vercel env add VITE_SUPABASE_ANON_KEY production --value="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2Y3N3aW1xYXh2eWxneGJrbGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NjA1MzAsImV4cCI6MjA2OTMzNjUzMH0.UZdiGcJXUV5VYetjWXV26inmbj2yXdiT03Z6t_5Lg24" --project=max-out-inventory-manager
```

### 10.3 Redeployment
After setting the environment variables, you must redeploy the application for the changes to take effect:
- Push a new commit to trigger a new build
- Or manually trigger a redeployment from the Vercel dashboard

## 11. Security Considerations

- Authentication is handled through Supabase authentication
- Row Level Security (RLS) policies protect data access
- Users must have appropriate permissions to view and modify inventory data
