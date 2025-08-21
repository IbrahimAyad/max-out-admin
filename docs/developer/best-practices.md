# KCT Ecosystem - Best Practices Guide

## 📋 Table of Contents

1. [Development Best Practices](#development-best-practices)
2. [Code Organization](#code-organization)
3. [React Best Practices](#react-best-practices)
4. [TypeScript Best Practices](#typescript-best-practices)
5. [Database Best Practices](#database-best-practices)
6. [Testing Best Practices](#testing-best-practices)
7. [Performance Best Practices](#performance-best-practices)
8. [Security Best Practices](#security-best-practices)
9. [Git and Version Control](#git-and-version-control)
10. [Documentation Best Practices](#documentation-best-practices)

## Development Best Practices

### Development Environment Standards

#### Consistent Tooling
```json
{
  "recommended-tools": {
    "editor": "VS Code with recommended extensions",
    "package-manager": "pnpm (v8.x)",
    "node-version": "18.x LTS",
    "terminal": "Modern terminal (iTerm2, Windows Terminal, etc.)"
  },
  "vs-code-extensions": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

#### Environment Configuration
```bash
# .env.local template for all applications
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_ENV=development
VITE_ENABLE_DEBUG_MODE=true

# Never commit .env files with real credentials
# Use .env.example for templates
# Store production secrets in Vercel environment variables
```

### Development Workflow

#### Daily Development Routine
```bash
# Morning startup routine
git checkout main
git pull origin main
pnpm install # Update dependencies if needed
supabase status # Check if Supabase is running
supabase start # Start if needed

# Before starting work on a feature
git checkout -b feature/descriptive-feature-name
pnpm run dev # Start development server

# During development
git add . && git commit -m "feat: descriptive commit message"
git push origin feature/descriptive-feature-name

# End of day
git push origin feature/descriptive-feature-name # Ensure work is backed up
```

#### Code Review Preparation
```bash
# Before creating PR
pnpm run lint # Fix linting issues
pnpm run type-check # Fix TypeScript errors
pnpm run test # Ensure tests pass
pnpm run build # Verify build works

# Self-review checklist:
# - Is the code readable and well-commented?
# - Are there any console.log statements to remove?
# - Is error handling appropriate?
# - Are TypeScript types properly defined?
# - Is the PR description clear and complete?
```

## Code Organization

### File and Folder Structure

#### Consistent Naming Conventions
```typescript
// Files and folders: kebab-case
components/user-profile-form.tsx
pages/order-management.tsx
hooks/use-product-catalog.ts

// Components: PascalCase
export const UserProfileForm = () => {}
export const OrderManagementDashboard = () => {}

// Functions and variables: camelCase
const handleSubmit = () => {}
const isUserAuthenticated = true

// Constants: SCREAMING_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3
const API_BASE_URL = 'https://api.kctmenswear.com'

// Types and interfaces: PascalCase
interface UserProfile {}
type OrderStatus = 'pending' | 'confirmed' | 'shipped'
```

#### Import Organization
```typescript
// 1. React and React ecosystem imports
import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'

// 2. Third-party library imports
import { toast } from 'sonner'
import { format } from 'date-fns'
import { z } from 'zod'

// 3. Internal imports - shared
import { Button } from '@shared/components/ui/button'
import { useAuth } from '@shared/hooks/use-auth'
import { User } from '@shared/types'

// 4. Internal imports - local
import { OrderSummary } from '@/components/order-summary'
import { useOrderManagement } from '@/hooks/use-order-management'
import { calculateOrderTotal } from '@/lib/calculations'

// 5. Type-only imports at the end
import type { OrderItem } from '@/types/order'
```

#### Component File Structure
```typescript
// ProductCard.tsx - Complete component file example

import React, { memo, useCallback } from 'react'
import { toast } from 'sonner'
import { Button } from '@shared/components/ui/button'
import { Card } from '@shared/components/ui/card'
import { formatPrice } from '@shared/utils/formatters'
import { useAppStore } from '@/lib/store'
import type { Product } from '@shared/types'

// 1. Types and interfaces
interface ProductCardProps {
  product: Product
  className?: string
  showActions?: boolean
  onAddToCart?: (product: Product) => void
}

// 2. Component implementation
export const ProductCard = memo<ProductCardProps>(({
  product,
  className = '',
  showActions = true,
  onAddToCart
}) => {
  // 3. Hooks
  const addToCart = useAppStore(state => state.addToCart)

  // 4. Event handlers
  const handleAddToCart = useCallback(() => {
    try {
      if (onAddToCart) {
        onAddToCart(product)
      } else {
        addToCart({
          id: product.id,
          name: product.name,
          price: product.base_price_cents,
          quantity: 1
        })
      }
      toast.success(`${product.name} added to cart`)
    } catch (error) {
      toast.error('Failed to add item to cart')
    }
  }, [product, onAddToCart, addToCart])

  // 5. Derived state
  const isOutOfStock = product.stock_quantity === 0
  const priceDisplay = formatPrice(product.base_price_cents)

  // 6. Render
  return (
    <Card className={`product-card ${className}`}>
      <div className="aspect-square overflow-hidden rounded-t-lg">
        <img 
          src={product.image_url} 
          alt={product.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-lg">{product.name}</h3>
        <p className="text-gray-600 text-sm mt-1">{product.description}</p>
        <p className="font-bold text-xl mt-2">{priceDisplay}</p>
        
        {showActions && (
          <div className="mt-4">
            <Button 
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="w-full"
            >
              {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
})

// 7. Display name for debugging
ProductCard.displayName = 'ProductCard'

// 8. Default export
export default ProductCard
```

## React Best Practices

### Component Design Principles

#### Single Responsibility Principle
```typescript
// ❌ Bad: Component doing too many things
const UserDashboard = () => {
  // User management logic
  // Order processing logic  
  // Inventory management logic
  // Analytics calculations
  // All in one component
}

// ✅ Good: Focused components
const UserProfile = () => {
  // Only user profile related logic
}

const UserOrders = () => {
  // Only order history logic
}

const UserDashboard = () => {
  return (
    <div>
      <UserProfile />
      <UserOrders />
      <UserAnalytics />
    </div>
  )
}
```

#### Composition over Inheritance
```typescript
// ✅ Good: Composition pattern
interface FormFieldProps {
  label: string
  error?: string
  required?: boolean
  children: React.ReactNode
}

const FormField = ({ label, error, required, children }: FormFieldProps) => (
  <div className="form-field">
    <label className={required ? 'required' : ''}>
      {label}
    </label>
    {children}
    {error && <span className="error">{error}</span>}
  </div>
)

// Usage
<FormField label="Email" required error={emailError}>
  <input type="email" value={email} onChange={handleEmailChange} />
</FormField>

<FormField label="Comments">
  <textarea value={comments} onChange={handleCommentsChange} />
</FormField>
```

#### State Management Best Practices
```typescript
// ✅ Good: Appropriate state management
const useOrderForm = () => {
  // Local state for form-specific data
  const [formData, setFormData] = useState<OrderFormData>({
    items: [],
    shippingAddress: null,
    paymentMethod: null
  })

  // Global state for app-wide data
  const user = useAppStore(state => state.user)
  const addOrder = useAppStore(state => state.addOrder)

  // Server state with React Query
  const { data: products } = useQuery(['products'], getProducts)

  const updateFormField = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  return { formData, updateFormField, user, products, addOrder }
}
```

### Hooks Best Practices

#### Custom Hook Design
```typescript
// ✅ Good: Well-designed custom hook
export const useProductCatalog = (filters?: ProductFilters) => {
  const [localFilters, setLocalFilters] = useState(filters || {})
  
  // Query with stable key
  const queryKey = ['products', localFilters]
  
  const {
    data: products,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey,
    queryFn: () => getProducts(localFilters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: Boolean(localFilters.category) // Conditional fetching
  })

  // Derived state
  const hasProducts = products && products.length > 0
  const totalProducts = products?.length || 0

  // Actions
  const updateFilters = useCallback((newFilters: Partial<ProductFilters>) => {
    setLocalFilters(prev => ({ ...prev, ...newFilters }))
  }, [])

  const resetFilters = useCallback(() => {
    setLocalFilters({})
  }, [])

  return {
    products,
    isLoading,
    error,
    hasProducts,
    totalProducts,
    filters: localFilters,
    updateFilters,
    resetFilters,
    refetch
  }
}
```

#### Performance Optimization
```typescript
// ✅ Good: Optimized component with proper memoization
const ExpensiveProductList = memo<ProductListProps>(({ 
  products, 
  onProductSelect 
}) => {
  // Memoize expensive calculations
  const sortedProducts = useMemo(() => {
    return products
      .filter(p => p.active)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
  }, [products])

  // Memoize callback to prevent child re-renders
  const handleProductSelect = useCallback((product: Product) => {
    onProductSelect(product)
  }, [onProductSelect])

  return (
    <div className="product-grid">
      {sortedProducts.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          onSelect={handleProductSelect}
        />
      ))}
    </div>
  )
})
```

## TypeScript Best Practices

### Type Definitions

#### Comprehensive Type Coverage
```typescript
// ✅ Good: Comprehensive type definitions
export interface Product {
  readonly id: string
  name: string
  description: string
  category: ProductCategory
  base_price_cents: number
  image_url: string | null
  active: boolean
  created_at: string
  updated_at: string
  
  // Optional relationships
  variants?: ProductVariant[]
  reviews?: ProductReview[]
}

export type ProductCategory = 
  | 'suits' 
  | 'shirts' 
  | 'ties' 
  | 'shoes' 
  | 'accessories'

export interface CreateProductData {
  name: string
  description: string
  category: ProductCategory
  base_price_cents: number
  image_url?: string
}

export interface UpdateProductData extends Partial<CreateProductData> {
  active?: boolean
}

// API response types
export interface ApiResponse<T> {
  data: T
  error: string | null
  success: boolean
  meta?: {
    total: number
    page: number
    limit: number
  }
}

// Form types
export interface ProductFormData extends CreateProductData {
  variants: ProductVariantFormData[]
}

// Utility types
export type ProductWithVariants = Product & {
  variants: ProductVariant[]
}

export type ProductSummary = Pick<Product, 'id' | 'name' | 'base_price_cents'>
```

#### Generic Types and Utilities
```typescript
// ✅ Good: Reusable generic types
export interface Repository<T, CreateData = Partial<T>, UpdateData = Partial<T>> {
  findById(id: string): Promise<T | null>
  findMany(filters?: Record<string, any>): Promise<T[]>
  create(data: CreateData): Promise<T>
  update(id: string, data: UpdateData): Promise<T>
  delete(id: string): Promise<void>
}

// Usage
export interface ProductRepository extends Repository<
  Product, 
  CreateProductData, 
  UpdateProductData
> {
  findByCategory(category: ProductCategory): Promise<Product[]>
  findActiveProducts(): Promise<Product[]>
}

// Utility type for form states
export type FormState<T> = {
  data: T
  errors: Partial<Record<keyof T, string>>
  isValid: boolean
  isDirty: boolean
  isSubmitting: boolean
}

// Usage
const [formState, setFormState] = useState<FormState<ProductFormData>>({
  data: initialProductData,
  errors: {},
  isValid: false,
  isDirty: false,
  isSubmitting: false
})
```

#### Type Guards and Validation
```typescript
// ✅ Good: Type guards for runtime validation
export const isProduct = (value: unknown): value is Product => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    'base_price_cents' in value
  )
}

export const isValidProductCategory = (value: string): value is ProductCategory => {
  const validCategories: ProductCategory[] = ['suits', 'shirts', 'ties', 'shoes', 'accessories']
  return validCategories.includes(value as ProductCategory)
}

// Usage with type narrowing
const processProductData = (data: unknown) => {
  if (!isProduct(data)) {
    throw new Error('Invalid product data')
  }
  
  // TypeScript now knows data is Product
  console.log(`Processing product: ${data.name}`)
  return data.base_price_cents / 100 // Safe to access properties
}
```

## Database Best Practices

### Query Optimization

#### Efficient Supabase Queries
```typescript
// ✅ Good: Optimized queries with specific selects
export const getProductsWithVariants = async (
  category?: ProductCategory,
  limit = 20
) => {
  let query = supabase
    .from('products')
    .select(`
      id,
      name,
      description,
      base_price_cents,
      image_url,
      enhanced_product_variants (
        id,
        sku,
        color,
        size,
        price_cents,
        inventory_quantity,
        stock_status
      )
    `)
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (category) {
    query = query.eq('category', category)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch products: ${error.message}`)
  }

  return data || []
}

// ✅ Good: Pagination with count
export const getProductsPaginated = async (
  page = 1,
  limit = 20,
  category?: ProductCategory
) => {
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('products')
    .select('*, enhanced_product_variants(*)', { count: 'exact' })
    .eq('active', true)
    .range(from, to)

  if (category) {
    query = query.eq('category', category)
  }

  const { data, error, count } = await query

  if (error) {
    throw new Error(`Failed to fetch products: ${error.message}`)
  }

  return {
    products: data || [],
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit)
  }
}
```

#### Database Schema Best Practices
```sql
-- ✅ Good: Proper indexing strategy
CREATE INDEX CONCURRENTLY idx_products_category_active 
ON products(category, active) 
WHERE active = true;

CREATE INDEX CONCURRENTLY idx_product_variants_inventory 
ON enhanced_product_variants(inventory_quantity) 
WHERE inventory_quantity > 0;

CREATE INDEX CONCURRENTLY idx_orders_customer_date 
ON orders(customer_id, created_at DESC);

-- ✅ Good: Efficient RLS policies
CREATE POLICY "Authenticated users can view active products" 
ON products FOR SELECT 
USING (active = true AND auth.role() = 'authenticated');

CREATE POLICY "Admin users can manage products" 
ON products FOR ALL 
USING (auth.jwt() ->> 'role' = 'admin');
```

### Data Validation and Constraints
```sql
-- ✅ Good: Proper constraints and validation
CREATE TABLE enhanced_product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_type VARCHAR(20) NOT NULL 
    CHECK (variant_type IN ('suit_2piece', 'suit_3piece', 'shirt_slim', 'shirt_classic', 'color_only')),
  color VARCHAR(100) NOT NULL,
  size VARCHAR(10),
  sku VARCHAR(100) NOT NULL UNIQUE,
  price_cents INTEGER NOT NULL CHECK (price_cents > 0),
  inventory_quantity INTEGER DEFAULT 0 CHECK (inventory_quantity >= 0),
  stock_status VARCHAR(20) DEFAULT 'in_stock' 
    CHECK (stock_status IN ('in_stock', 'low_stock', 'out_of_stock', 'discontinued')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_product_variants_updated_at 
  BEFORE UPDATE ON enhanced_product_variants 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Testing Best Practices

### Test Structure and Organization
```typescript
// ✅ Good: Well-organized test file
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { ProductCard } from './ProductCard'
import { mockProduct, createTestQueryClient } from '@/test-utils'

// Test utilities
const renderWithQueryClient = (ui: React.ReactElement) => {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  )
}

describe('ProductCard', () => {
  let mockOnAddToCart: ReturnType<typeof vi.fn>
  
  beforeEach(() => {
    mockOnAddToCart = vi.fn()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Display', () => {
    it('should render product information correctly', () => {
      renderWithQueryClient(
        <ProductCard product={mockProduct} onAddToCart={mockOnAddToCart} />
      )

      expect(screen.getByText(mockProduct.name)).toBeInTheDocument()
      expect(screen.getByText(mockProduct.description)).toBeInTheDocument()
      expect(screen.getByRole('img', { name: mockProduct.name })).toBeInTheDocument()
    })

    it('should format price correctly', () => {
      const product = { ...mockProduct, base_price_cents: 89900 }
      
      renderWithQueryClient(
        <ProductCard product={product} onAddToCart={mockOnAddToCart} />
      )

      expect(screen.getByText('$899.00')).toBeInTheDocument()
    })
  })

  describe('Interactions', () => {
    it('should call onAddToCart when add to cart button is clicked', async () => {
      const user = userEvent.setup()
      
      renderWithQueryClient(
        <ProductCard product={mockProduct} onAddToCart={mockOnAddToCart} />
      )

      await user.click(screen.getByRole('button', { name: /add to cart/i }))

      expect(mockOnAddToCart).toHaveBeenCalledWith(mockProduct)
      expect(mockOnAddToCart).toHaveBeenCalledTimes(1)
    })

    it('should disable add to cart button when out of stock', () => {
      const outOfStockProduct = { ...mockProduct, stock_quantity: 0 }
      
      renderWithQueryClient(
        <ProductCard product={outOfStockProduct} onAddToCart={mockOnAddToCart} />
      )

      expect(screen.getByRole('button', { name: /out of stock/i })).toBeDisabled()
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing image gracefully', () => {
      const productWithoutImage = { ...mockProduct, image_url: null }
      
      renderWithQueryClient(
        <ProductCard product={productWithoutImage} onAddToCart={mockOnAddToCart} />
      )

      // Should still render other product information
      expect(screen.getByText(mockProduct.name)).toBeInTheDocument()
    })
  })
})
```

### API Testing Best Practices
```typescript
// ✅ Good: API integration tests with MSW
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'

import { getProducts, createProduct } from './product-api'
import { mockProducts, mockProduct } from '@/test-utils'

// Mock server setup
const server = setupServer(
  http.get('/api/products', () => {
    return HttpResponse.json({ data: mockProducts, success: true })
  }),

  http.post('/api/products', async ({ request }) => {
    const newProduct = await request.json()
    return HttpResponse.json({ 
      data: { ...mockProduct, ...newProduct }, 
      success: true 
    })
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('Product API', () => {
  describe('getProducts', () => {
    it('should fetch products successfully', async () => {
      const products = await getProducts()
      
      expect(products).toHaveLength(mockProducts.length)
      expect(products[0]).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        base_price_cents: expect.any(Number)
      })
    })

    it('should handle API errors gracefully', async () => {
      server.use(
        http.get('/api/products', () => {
          return new HttpResponse(null, { status: 500 })
        })
      )

      await expect(getProducts()).rejects.toThrow('Failed to fetch products')
    })
  })

  describe('createProduct', () => {
    it('should create product successfully', async () => {
      const productData = {
        name: 'New Product',
        description: 'A new product',
        category: 'suits' as const,
        base_price_cents: 99900
      }

      const createdProduct = await createProduct(productData)
      
      expect(createdProduct).toMatchObject(productData)
      expect(createdProduct.id).toBeDefined()
    })
  })
})
```

## Performance Best Practices

### Bundle Optimization
```typescript
// ✅ Good: Code splitting and lazy loading
import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'

// Lazy load heavy components
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const ProductCatalog = lazy(() => import('./pages/ProductCatalog'))
const OrderManagement = lazy(() => import('./pages/OrderManagement'))

// Loading components
const PageSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-8 bg-gray-200 rounded mb-4"></div>
    <div className="h-64 bg-gray-200 rounded"></div>
  </div>
)

export const AppRoutes = () => (
  <Routes>
    <Route 
      path="/admin" 
      element={
        <Suspense fallback={<PageSkeleton />}>
          <AdminDashboard />
        </Suspense>
      } 
    />
    <Route 
      path="/products" 
      element={
        <Suspense fallback={<PageSkeleton />}>
          <ProductCatalog />
        </Suspense>
      } 
    />
    <Route 
      path="/orders" 
      element={
        <Suspense fallback={<PageSkeleton />}>
          <OrderManagement />
        </Suspense>
      } 
    />
  </Routes>
)
```

### React Query Optimization
```typescript
// ✅ Good: Optimized React Query usage
export const useOptimizedProducts = (category?: string) => {
  return useQuery({
    queryKey: ['products', category],
    queryFn: () => getProducts(category),
    
    // Performance optimizations
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    
    // Only fetch when category is provided
    enabled: Boolean(category),
    
    // Keep previous data during transitions
    keepPreviousData: true,
    
    // Optimize re-renders
    select: useCallback(
      (data: Product[]) => data.filter(p => p.active),
      []
    )
  })
}

// Prefetch related data
export const usePrefetchRelatedData = () => {
  const queryClient = useQueryClient()

  const prefetchProductVariants = useCallback((productId: string) => {
    queryClient.prefetchQuery({
      queryKey: ['product-variants', productId],
      queryFn: () => getProductVariants(productId),
      staleTime: 10 * 60 * 1000 // 10 minutes
    })
  }, [queryClient])

  return { prefetchProductVariants }
}
```

## Security Best Practices

### Input Validation and Sanitization
```typescript
// ✅ Good: Comprehensive validation with Zod
import { z } from 'zod'

// Schema definitions
export const productSchema = z.object({
  name: z.string()
    .min(1, 'Product name is required')
    .max(200, 'Product name too long')
    .regex(/^[a-zA-Z0-9\s\-'.,()]+$/, 'Invalid characters in product name'),
  
  description: z.string()
    .max(2000, 'Description too long')
    .transform(val => val.trim()),
  
  category: z.enum(['suits', 'shirts', 'ties', 'shoes', 'accessories']),
  
  base_price_cents: z.number()
    .int('Price must be an integer')
    .min(1, 'Price must be greater than 0')
    .max(1000000, 'Price too high'),
  
  image_url: z.string()
    .url('Invalid image URL')
    .optional()
    .or(z.literal(''))
})

// Secure form handling
export const useSecureProductForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const form = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      category: 'suits' as const,
      base_price_cents: 0,
      image_url: ''
    }
  })

  const handleSubmit = form.handleSubmit(async (data) => {
    setIsSubmitting(true)
    
    try {
      // Additional runtime validation
      const validatedData = productSchema.parse(data)
      
      // Sanitize data before submission
      const sanitizedData = {
        ...validatedData,
        description: sanitizedData.description.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      }
      
      await createProduct(sanitizedData)
      form.reset()
      
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  })

  return { form, handleSubmit, isSubmitting }
}
```

### Secure API Communication
```typescript
// ✅ Good: Secure API wrapper with proper error handling
class SecureApiClient {
  private baseURL: string
  private defaultHeaders: Record<string, string>

  constructor(baseURL: string) {
    this.baseURL = baseURL
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    
    // Add authentication header if available
    const token = await this.getAuthToken()
    const headers = {
      ...this.defaultHeaders,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'same-origin' // Prevent CSRF
    })

    // Handle different response types
    if (!response.ok) {
      if (response.status === 401) {
        // Handle authentication errors
        this.handleAuthError()
      }
      
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP ${response.status}`)
    }

    return response.json()
  }

  private async getAuthToken(): Promise<string | null> {
    // Get token from Supabase session
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || null
  }

  private handleAuthError() {
    // Redirect to login or refresh token
    window.location.href = '/login'
  }

  // Public API methods
  async get<T>(endpoint: string): Promise<T> {
    return this.makeRequest<T>(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.makeRequest<T>(endpoint, { method: 'DELETE' })
  }
}

export const apiClient = new SecureApiClient(process.env.VITE_API_BASE_URL!)
```

## Git and Version Control

### Commit Message Standards
```bash
# Format: <type>(<scope>): <description>
# 
# <body>
#
# <footer>

# Types:
feat:     # New feature
fix:      # Bug fix
docs:     # Documentation changes
style:    # Code style changes (formatting, etc.)
refactor: # Code refactoring
perf:     # Performance improvements
test:     # Test-related changes
chore:    # Build process, tooling changes

# Examples:
feat(auth): add password reset functionality

fix(orders): resolve calculation error in tax computation

docs(api): update authentication endpoint documentation

style(components): format code according to prettier rules

refactor(database): optimize product query performance

test(utils): add unit tests for price formatting functions

chore(deps): update React to version 18.3.0
```

### Branching Strategy
```bash
# Branch naming conventions
main                           # Production branch
develop                       # Integration branch
feature/feature-name          # Feature development
feature/admin-user-management
feature/wedding-portal-redesign
feature/inventory-optimization

hotfix/issue-description      # Critical production fixes
hotfix/payment-processing-bug
hotfix/authentication-error

release/version-number        # Release preparation
release/v2.1.0
release/v2.2.0

# Workflow
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name

# Work on feature
git add .
git commit -m "feat(scope): description"
git push origin feature/your-feature-name

# Create PR to develop branch
# After approval and merge, delete feature branch
git checkout develop
git pull origin develop
git branch -d feature/your-feature-name
```

## Documentation Best Practices

### Code Documentation
```typescript
/**
 * Calculates the total price for an order including taxes, shipping, and discounts
 * 
 * @param items - Array of order items with quantity and price
 * @param shippingAddress - Customer's shipping address for tax calculation
 * @param discountCode - Optional discount code to apply
 * @param options - Additional calculation options
 * @returns Order total breakdown with itemized costs
 * 
 * @example
 * ```typescript
 * const total = calculateOrderTotal(
 *   [{ productId: '123', quantity: 2, price: 5000 }],
 *   { state: 'NY', zipCode: '10001' },
 *   'SAVE10'
 * )
 * console.log(total.grandTotal) // Total in cents
 * ```
 * 
 * @throws {ValidationError} When items array is empty
 * @throws {TaxCalculationError} When tax calculation fails
 */
export const calculateOrderTotal = (
  items: OrderItem[],
  shippingAddress: Address,
  discountCode?: string,
  options: CalculationOptions = {}
): OrderTotal => {
  // Validation
  if (!items || items.length === 0) {
    throw new ValidationError('Order must contain at least one item')
  }

  // Calculate subtotal
  const subtotal = items.reduce((sum, item) => {
    return sum + (item.price * item.quantity)
  }, 0)

  // Calculate tax based on shipping address
  const taxRate = getTaxRateForState(shippingAddress.state)
  const taxAmount = Math.round(subtotal * taxRate)

  // Calculate shipping
  const shippingCost = calculateShipping(items, shippingAddress, options)

  // Apply discount
  const discountAmount = discountCode 
    ? calculateDiscount(subtotal, discountCode)
    : 0

  // Calculate grand total
  const grandTotal = subtotal + taxAmount + shippingCost - discountAmount

  return {
    subtotal,
    taxAmount,
    shippingCost,
    discountAmount,
    grandTotal,
    itemCount: items.length
  }
}
```

### README Documentation
```markdown
# Component Name

## Overview
Brief description of what this component does and its purpose in the application.

## Props
| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| `data` | `Product[]` | `[]` | No | Array of products to display |
| `onSelect` | `(product: Product) => void` | - | Yes | Callback when a product is selected |
| `loading` | `boolean` | `false` | No | Whether the component is in loading state |

## Usage Examples

### Basic Usage
```tsx
import { ProductGrid } from './ProductGrid'

function App() {
  const handleProductSelect = (product) => {
    console.log('Selected:', product)
  }

  return (
    <ProductGrid 
      data={products}
      onSelect={handleProductSelect}
    />
  )
}
```

### With Loading State
```tsx
<ProductGrid 
  data={products}
  loading={isLoading}
  onSelect={handleProductSelect}
/>
```

## Styling
The component uses Tailwind CSS classes and can be customized through:
- CSS custom properties
- Tailwind utility classes
- Theme configuration

## Accessibility
- Supports keyboard navigation
- ARIA labels for screen readers
- Focus management

## Testing
Run tests with: `pnpm test ProductGrid`

Key test scenarios:
- Renders products correctly
- Handles selection events
- Shows loading state appropriately
```

---

## Conclusion

Following these best practices ensures:

- **Code Quality**: Consistent, readable, and maintainable code
- **Team Collaboration**: Clear standards everyone can follow
- **Performance**: Optimized applications that scale well
- **Security**: Robust protection against common vulnerabilities
- **Developer Experience**: Smooth onboarding and productive development

Remember to:
- Review and update practices regularly
- Share knowledge with team members
- Adapt practices as the ecosystem evolves
- Measure and monitor the impact of these practices

---

*This guide should be reviewed quarterly and updated as new patterns and tools are adopted.*