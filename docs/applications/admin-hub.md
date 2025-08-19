# Admin Hub Application - Technical Documentation

## Executive Summary

The Admin Hub is a comprehensive inventory and wedding management system built for KCT Menswear. It serves as the central administrative dashboard providing real-time inventory management, wedding coordination, user administration, and business analytics. The application emphasizes size-specific inventory tracking with visual matrix views, advanced filtering capabilities, and real-time updates across the KCT ecosystem.

## Table of Contents

1. [Application Architecture](#application-architecture)
2. [Main Features and Functionality](#main-features-and-functionality)
3. [Component Library and UI Patterns](#component-library-and-ui-patterns)
4. [Authentication and Authorization](#authentication-and-authorization)
5. [Business Logic and Workflows](#business-logic-and-workflows)
6. [Integration Points](#integration-points)
7. [API Endpoints and Data Management](#api-endpoints-and-data-management)
8. [Code Examples and Usage Patterns](#code-examples-and-usage-patterns)

## Application Architecture

### Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite with hot module replacement
- **Backend Services**: Supabase (PostgreSQL, Authentication, Real-time, Edge Functions)
- **State Management**: React Query (TanStack Query) + React Context
- **UI Framework**: Tailwind CSS + shadcn/ui components
- **Data Validation**: Zod schema validation
- **Form Management**: React Hook Form with Hookform Resolvers

### Project Structure

```
src/
├── components/           # React components
│   ├── AdminLogin.tsx           # Authentication interface
│   ├── DashboardOverview.tsx    # Main dashboard metrics
│   ├── InventoryManagement.tsx  # Primary inventory interface
│   ├── SizeMatrix.tsx           # Size-specific inventory grid
│   ├── WeddingManagement.tsx    # Wedding coordination
│   ├── NotificationCenter.tsx   # Real-time notifications
│   └── ...
├── contexts/             # React contexts
│   └── AuthContext.tsx          # Authentication state management
├── hooks/               # Custom React hooks
│   ├── useAdminQueries.ts       # Admin data fetching
│   ├── useSoundNotification.ts  # Audio notifications
│   └── use-mobile.tsx           # Mobile responsive utilities
├── lib/                 # Utility libraries
│   ├── supabase.ts             # Supabase client configuration
│   ├── unified-auth.ts         # Cross-portal authentication
│   └── utils.ts                # General utilities
├── types/               # TypeScript type definitions
│   ├── admin.ts                # Admin interface types
│   └── inventory.ts            # Inventory data models
├── App.tsx              # Main application component
└── main.tsx             # Application entry point
```

### Architecture Patterns

#### 1. **Multi-View Single Page Application**
The application uses a view-based navigation system with four primary views:
- **Dashboard** (overview and analytics)
- **Inventory Management** (primary focus)
- **Wedding Management** (coordination tools)
- **Admin Settings** (user migration and system tools)

#### 2. **Unified Authentication Architecture**
Implements a sophisticated cross-portal authentication system that bridges multiple applications:

```typescript
export interface AuthContextType {
  user: AuthUser | null
  session: any | null
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<UnifiedAuthResponse>
  signOut: () => Promise<void>
  isAuthenticated: boolean
}
```

#### 3. **Real-time Data Management**
Uses React Query for optimistic updates and real-time synchronization:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10,   // 10 minutes
      retry: 1
    },
  },
})
```

## Main Features and Functionality

### 1. **Inventory Management System**

#### Core Capabilities
- **Size Matrix View**: Visual inventory display by size variants
  - Suits: 34S through 54L (Short, Regular, Long)
  - Dress Shirts: Collar sizes 14.5 through 18
  - Color variants: 14 different suit colors
- **Advanced Filtering**: Category, size, color, and stock level filters
- **Real-time Stock Updates**: Inline editing with immediate persistence
- **Visual Stock Indicators**: Color-coded stock levels (green/yellow/red)
- **Bulk Management**: Multiple item updates
- **Export Capabilities**: Generate inventory reports

#### Size Matrix Features
```typescript
// Suit sizes configuration
export const SUIT_SIZES = [
  '34S', '34R', '36S', '36R', '38S', '38R', '38L',
  '40S', '40R', '40L', '42S', '42R', '42L',
  '44S', '44R', '44L', '46S', '46R', '46L',
  '48S', '48R', '48L', '50S', '50R', '50L',
  '52R', '52L', '54R', '54L'
];

// Stock level thresholds
export const LOW_STOCK_THRESHOLD = 5;
```

### 2. **Wedding Management System**

#### Features
- **Wedding Coordination**: Full lifecycle management from planning to completion
- **Status Tracking**: 8-stage workflow (Planning → Completed)
- **Party Member Management**: Guest measurement tracking
- **Timeline Management**: Task assignment and progress monitoring
- **Communication Tools**: Direct messaging with wedding parties
- **Analytics Dashboard**: Wedding performance metrics

#### Wedding Status Flow
```
Planning → Measurements → Selection → Orders Placed → 
Production → Fulfillment → Completed
```

### 3. **Administrative Dashboard**

#### Overview Metrics
- Today's revenue and order counts
- Pending orders tracking
- Unread notifications counter
- Low stock alerts
- Processing queue status

#### Real-time Notifications
- **Sound Notifications**: Audio alerts for urgent notifications
- **Priority System**: Urgent, High, Normal, Low priority levels
- **Auto-refresh**: 5-second polling for unread notifications
- **Mark as Read**: Individual and bulk read operations

### 4. **User Migration Tools**

#### Capabilities
- **Migration Report Generation**: Identify accounts needing unified system migration
- **Wedding Account Migration**: Migrate existing wedding portal accounts
- **Profile Synchronization**: Cross-portal profile data syncing
- **Measurement Data Sync**: Unified measurement data across systems

## Component Library and UI Patterns

### 1. **Core UI Components**

#### Layout Components
- **AdminHeader**: Navigation with user info, notifications, settings
- **NotificationCenter**: Sliding panel with real-time updates
- **ErrorBoundary**: Application-wide error handling

#### Business Components
- **SizeMatrix**: Interactive size/color inventory grid
- **InventoryManagement**: Main inventory interface with filtering
- **WeddingManagement**: Wedding coordination dashboard
- **DashboardOverview**: Metrics and analytics display

### 2. **Design Patterns**

#### Visual Design
- **Color Scheme**: Black header with white content areas
- **Typography**: Tailwind CSS typography scale
- **Spacing**: Consistent 4px grid system
- **Responsive**: Mobile-first design with tablet/desktop adaptations

#### Interaction Patterns
- **Inline Editing**: Click-to-edit inventory quantities
- **Modal Workflows**: Create/edit operations in overlays
- **Progressive Disclosure**: Expandable details and filters
- **Real-time Feedback**: Loading states and optimistic updates

### 3. **shadcn/ui Integration**

```typescript
// Example component usage
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Toast } from "@/components/ui/toast"
```

## Authentication and Authorization

### 1. **Unified Authentication System**

The application implements a sophisticated cross-portal authentication system that bridges multiple applications in the KCT ecosystem:

#### Authentication Flow
```typescript
export interface UnifiedAuthResponse {
  success: boolean
  data?: {
    user: any
    session: any
    profile: any
    wedding?: any
    invitation?: any
    access_levels?: any
    is_new_user?: boolean
  }
  error?: {
    code: string
    message: string
  }
}
```

#### Authentication Methods
1. **Traditional Email/Password**: Standard Supabase authentication
2. **Wedding Code Authentication**: Couples portal integration
3. **Invitation Code Authentication**: Groomsmen portal integration
4. **Test Credentials**: Development bypass authentication

### 2. **Role-Based Access Control**

#### Access Levels
```typescript
interface AccessLevels {
  enhanced_profile: boolean
  couples_portal: boolean
  groomsmen_portal: boolean
  admin_portal: boolean
}
```

#### Portal Validation
```typescript
const accessCheck = await unifiedAuthAPI.validatePortalAccess(
  userId, 
  'admin_portal'
)
```

### 3. **Session Management**

#### Cross-Portal Sessions
- **Session Persistence**: Automatic token refresh
- **Portal Context Switching**: Seamless navigation between portals
- **Session Validation**: Real-time access verification

#### Security Features
- **Automatic Token Refresh**: Prevents session expiration
- **Portal-Specific Storage**: Isolated session storage keys
- **Secure Logout**: Complete session cleanup across portals

## Business Logic and Workflows

### 1. **Inventory Management Workflow**

#### Stock Update Process
```typescript
const handleStockUpdate = async (variantId: string, newQuantity: number) => {
  try {
    // Update database
    const { error } = await supabase
      .from('product_variants')
      .update({ stock_quantity: newQuantity })
      .eq('id', variantId);

    if (error) throw error;

    // Update local state optimistically
    setProducts(prevProducts => {
      return prevProducts.map(product => {
        const updatedVariants = product.variants.map(variant => {
          if (variant.id === variantId) {
            return { ...variant, stock_quantity: newQuantity };
          }
          return variant;
        });
        return { ...product, variants: updatedVariants };
      });
    });
  } catch (error) {
    console.error('Error updating stock quantity:', error);
  }
};
```

#### Filtering Logic
```typescript
const filteredProducts = React.useMemo(() => {
  return products.filter(product => {
    // Category filter
    if (filters.category && product.category !== filters.category) return false;
    
    // Size filter
    if (filters.size) {
      const hasSizeVariant = product.variants.some(variant => 
        variant.option1 === filters.size
      );
      if (!hasSizeVariant) return false;
    }
    
    // Stock status filter
    if (filters.stockStatus !== 'all') {
      const variantsMatchingStockStatus = product.variants.filter(variant => {
        const stockLevel = variant.stock_quantity || 0;
        switch (filters.stockStatus) {
          case 'in-stock': return stockLevel > 0;
          case 'low-stock': return stockLevel > 0 && stockLevel <= LOW_STOCK_THRESHOLD;
          case 'out-of-stock': return stockLevel === 0;
          default: return true;
        }
      });
      if (variantsMatchingStockStatus.length === 0) return false;
    }
    
    return true;
  });
}, [products, filters]);
```

### 2. **Wedding Management Workflow**

#### Status Progression
```typescript
const statusConfig = {
  planning: { color: 'bg-blue-100 text-blue-800', label: 'Planning' },
  measurements: { color: 'bg-yellow-100 text-yellow-800', label: 'Measurements' },
  selection: { color: 'bg-purple-100 text-purple-800', label: 'Selection' },
  orders_placed: { color: 'bg-orange-100 text-orange-800', label: 'Orders Placed' },
  production: { color: 'bg-indigo-100 text-indigo-800', label: 'Production' },
  fulfillment: { color: 'bg-teal-100 text-teal-800', label: 'Fulfillment' },
  completed: { color: 'bg-green-100 text-green-800', label: 'Completed' },
  cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled' }
}
```

### 3. **Data Validation and Error Handling**

#### Type Safety
```typescript
export interface ProductVariant {
  id: string;
  product_id: string;
  title: string;
  price?: number;
  inventory_quantity?: number;
  option1?: string; // Size
  option2?: string; // Color
  option3?: string; // Piece count (2 or 3 for suits)
  stock_quantity?: number;
  created_at: string;
  updated_at: string;
}
```

#### Error Boundary Implementation
```typescript
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Application error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong. Please refresh the page.</div>;
    }
    return this.props.children;
  }
}
```

## Integration Points

### 1. **Supabase Integration**

#### Database Schema
- **products**: Product catalog with categories and metadata
- **product_variants**: Size/color/piece variants with stock quantities
- **weddings**: Wedding coordination data
- **party_members**: Wedding party member information
- **admin_notifications**: Real-time notification system

#### Edge Functions
```typescript
// Admin Hub API endpoints
export const adminHubAPI = {
  getDashboardOverview: () => supabase.functions.invoke('admin-hub-api/dashboard-overview'),
  getNotifications: (params) => supabase.functions.invoke('admin-hub-api/notifications'),
  getQuickStats: () => supabase.functions.invoke('admin-hub-api/quick-stats'),
  getRecentActivity: () => supabase.functions.invoke('admin-hub-api/recent-activity'),
  markNotificationRead: (id) => supabase.functions.invoke('admin-hub-api/mark-notification-read'),
}
```

### 2. **Cross-Portal Communication**

#### Wedding Portal Integration
```typescript
export const weddingAPI = {
  getAllWeddings: (filters) => supabase.functions.invoke('wedding-management', {
    method: 'POST',
    body: { action: 'get_all_weddings', filters }
  }),
  getWeddingAnalytics: (filters) => supabase.functions.invoke('wedding-management', {
    method: 'POST', 
    body: { action: 'get_wedding_analytics', filters }
  })
}
```

#### Profile Synchronization
```typescript
// Sync profile data across portals
const profileSync = await unifiedAuthAPI.syncProfileData(userId, profileData, 'admin_portal');
const measurementSync = await unifiedAuthAPI.syncMeasurementData(userId, measurements);
```

### 3. **Real-time Subscriptions**

#### Notification Subscriptions
```typescript
export const subscribeToNotifications = (callback: (notification: any) => void) => {
  return supabase
    .channel('admin_notifications')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'admin_notifications'
    }, callback)
    .subscribe()
}
```

## API Endpoints and Data Management

### 1. **React Query Configuration**

#### Query Client Setup
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes  
      retry: 1
    },
  },
})
```

#### Custom Hooks
```typescript
export const useAdminQueries = () => {
  const queryClient = useQueryClient()

  const dashboardOverview = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: adminHubAPI.getDashboardOverview,
    refetchInterval: 30000, // 30 seconds
  })

  const notifications = useQuery({
    queryKey: ['notifications'],
    queryFn: () => adminHubAPI.getNotifications({ limit: 50 }),
    refetchInterval: 10000, // 10 seconds
  })

  const markNotificationRead = useMutation({
    mutationFn: adminHubAPI.markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['unread-notifications'] })
    }
  })

  return {
    dashboardOverview,
    notifications,
    markNotificationRead
  }
}
```

### 2. **Data Models**

#### Inventory Types
```typescript
export interface Product {
  id: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  sku?: string;
  base_price?: number;
  total_inventory?: number;
  variant_count?: number;
  created_at: string;
  updated_at: string;
}

export interface ProductWithVariants extends Product {
  variants: ProductVariant[];
}
```

#### Admin Types
```typescript
export interface DashboardOverview {
  todayRevenue: number
  todayOrdersCount: number
  pendingOrdersCount: number
  unreadNotificationsCount: number
  urgentNotificationsCount: number
  lowStockAlertsCount: number
  lastUpdated: string
}

export interface AdminNotification {
  id: string
  type: string
  title: string
  message: string
  priority: 'urgent' | 'high' | 'normal' | 'low'
  is_read: boolean
  created_at: string
}
```

### 3. **API Client Configuration**

#### Supabase Clients
```typescript
// Regular client for standard operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'kct-admin-auth',
    detectSessionInUrl: false
  }
})

// Admin client with service role for admin operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'kct-admin-auth-admin',
    detectSessionInUrl: false
  }
})
```

## Code Examples and Usage Patterns

### 1. **Component Development Pattern**

#### Size Matrix Component
```typescript
interface SizeMatrixProps {
  product: ProductWithVariants;
  onStockUpdate: (variantId: string, newQuantity: number) => Promise<void>;
}

const SizeMatrix: React.FC<SizeMatrixProps> = ({ product, onStockUpdate }) => {
  const [editingVariant, setEditingVariant] = useState<string | null>(null);
  const [editingQuantity, setEditingQuantity] = useState<number>(0);

  const handleEditClick = (variant: any) => {
    setEditingVariant(variant.id);
    setEditingQuantity(variant.stock_quantity || 0);
  };

  const handleSaveClick = async (variantId: string) => {
    await onStockUpdate(variantId, editingQuantity);
    setEditingVariant(null);
  };

  const getStockLevelClass = (quantity: number | undefined) => {
    if (quantity === undefined) return 'bg-gray-100 text-gray-400';
    if (quantity === 0) return 'bg-red-100 text-red-700';
    if (quantity <= LOW_STOCK_THRESHOLD) return 'bg-yellow-100 text-yellow-700';
    return 'bg-green-100 text-green-700';
  };

  return (
    <div className="p-4 overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        {/* Table implementation */}
      </table>
    </div>
  );
};
```

### 2. **Authentication Usage Pattern**

#### Context Integration
```typescript
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

function AppContent() {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  if (!user) {
    return <AdminLogin />
  }

  return <AuthenticatedApp />
}
```

#### Login Implementation
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSubmitting(true);
  clearError();

  try {
    const response = await signIn(email, password);
    if (!response.success) {
      console.error('Login failed:', response.error);
    }
  } catch (error) {
    console.error('Login error:', error);
  } finally {
    setIsSubmitting(false);
  }
};
```

### 3. **Data Fetching Patterns**

#### Query Hook Usage
```typescript
const InventoryManagement: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [filters, setFilters] = useState<InventoryFilters>({
    category: '',
    search: '',
    stockStatus: 'all'
  });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data: productsData } = await supabase
          .from('products')
          .select('*')
          .order('name');

        const { data: variantsData } = await supabase
          .from('product_variants')
          .select('*');

        // Combine products with variants
        const productsWithVariants = combineProductsWithVariants(productsData, variantsData);
        setProducts(productsWithVariants);
      } catch (error) {
        console.error('Error fetching inventory:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div className="p-4">
      {/* Component implementation */}
    </div>
  );
};
```

### 4. **State Management Patterns**

#### Form State Management
```typescript
const [filters, setFilters] = useState<InventoryFilters>({
  category: '',
  subcategory: '',
  search: '',
  size: '',
  color: '',
  stockStatus: 'all'
});

// Filter update handler
const updateFilter = (key: keyof InventoryFilters, value: string) => {
  setFilters(prev => ({
    ...prev,
    [key]: value
  }));
};
```

#### Optimistic Updates
```typescript
const handleStockUpdate = async (variantId: string, newQuantity: number) => {
  // Optimistically update UI
  setProducts(prevProducts => 
    prevProducts.map(product => ({
      ...product,
      variants: product.variants.map(variant => 
        variant.id === variantId 
          ? { ...variant, stock_quantity: newQuantity }
          : variant
      )
    }))
  );

  try {
    // Persist to database
    await supabase
      .from('product_variants')
      .update({ stock_quantity: newQuantity })
      .eq('id', variantId);
  } catch (error) {
    // Revert on error
    console.error('Error updating stock:', error);
    // Revert optimistic update here
  }
};
```

### 5. **Testing Patterns**

#### Component Testing Setup
```typescript
// Test utilities for component testing
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../contexts/AuthContext';

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {component}
      </AuthProvider>
    </QueryClientProvider>
  );
};
```

### 6. **Performance Optimization Patterns**

#### Memoization
```typescript
const filteredProducts = React.useMemo(() => {
  return products.filter(product => {
    // Expensive filtering logic
    return applyFilters(product, filters);
  });
}, [products, filters]);

const ProductItem = React.memo(({ product, onUpdate }) => {
  return (
    <div>
      {/* Product display */}
    </div>
  );
});
```

#### Virtual Scrolling (for large datasets)
```typescript
import { FixedSizeList as List } from 'react-window';

const VirtualizedProductList = ({ products }) => (
  <List
    height={600}
    itemCount={products.length}
    itemSize={120}
    itemData={products}
  >
    {ProductRow}
  </List>
);
```

---

## Development Guidelines

### 1. **Code Organization**
- Components should be single-responsibility and reusable
- Business logic should be extracted to custom hooks
- Type definitions should be comprehensive and shared
- Error handling should be consistent across components

### 2. **Performance Best Practices**
- Use React.memo for expensive components
- Implement proper dependency arrays in useEffect
- Optimize re-renders with useMemo and useCallback
- Consider virtual scrolling for large datasets

### 3. **Security Considerations**
- Validate all user inputs
- Use environment variables for sensitive configuration
- Implement proper error boundaries
- Follow least-privilege principle for API access

### 4. **Accessibility**
- Implement proper ARIA labels
- Ensure keyboard navigation support
- Maintain proper color contrast ratios
- Provide screen reader-friendly content

---

*This documentation covers the Admin Hub application as of January 2025. For the most current information, refer to the source code and development team.*
