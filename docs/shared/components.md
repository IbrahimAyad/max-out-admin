# KCT Ecosystem - Shared Components Library

## Overview

The KCT ecosystem follows a monorepo architecture with shared components, utilities, and patterns across all applications. This document outlines the common React components library, UI patterns, and design system used throughout the ecosystem.

## Directory Structure

```
/workspace/kct-ecosystem-monorepo/shared/
├── components/          # Shared React components (currently empty - components exist in apps)
├── hooks/              # Shared custom hooks (currently empty)
├── types/              # Shared TypeScript interfaces
├── constants/          # Shared constants
├── styles/            # Shared styling
├── supabase/          # Database schemas and configurations
└── utils/             # Shared utility functions
```

## Component Architecture Patterns

### 1. Standard Component Structure

All components in the KCT ecosystem follow a consistent structure:

```typescript
import React from 'react'
import { ComponentProps } from '../types/component-types'

interface ComponentNameProps {
  className?: string
  // ... other props
}

export function ComponentName({ 
  className = "default-classes",
  ...props 
}: ComponentNameProps) {
  return (
    <div className={`base-styles ${className}`}>
      {/* Component content */}
    </div>
  )
}
```

### 2. Loading Components

#### LoadingSpinner Component

A reusable loading spinner component used across all applications:

```typescript
// apps/order-management/src/components/LoadingSpinner.tsx
import React from 'react'

interface LoadingSpinnerProps {
  className?: string
}

export function LoadingSpinner({ className = "w-8 h-8" }: LoadingSpinnerProps) {
  return (
    <div className={`animate-spin rounded-full border-4 border-gray-300 border-t-indigo-600 ${className}`}></div>
  )
}
```

**Usage Pattern:**
- Used in all applications for loading states
- Consistent styling with Tailwind CSS
- Configurable size through className prop
- Standard animation and color scheme

### 3. Authentication Components

#### AdminLogin Component Pattern

```typescript
// Common authentication form pattern used across all admin portals
export function AdminLogin() {
  const [email, setEmail] = useState('admin@kctmenswear.com');
  const [password, setPassword] = useState('127598');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { signIn, error, clearError, loading } = useAuth();

  // Consistent error handling and form submission patterns
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await signIn(email, password);
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Consistent styling and layout */}
    </div>
  )
}
```

### 4. Form Components

#### Common Form Patterns

All forms across the ecosystem follow these patterns:

```typescript
// Standard form field structure
<div className="space-y-2">
  <label htmlFor="fieldName" className="text-sm font-medium text-gray-200">
    Field Label
  </label>
  <input
    id="fieldName"
    type="text"
    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
    placeholder="Placeholder text"
  />
</div>
```

#### Button Components

```typescript
// Standard button patterns
<button
  type="submit"
  disabled={isSubmitting}
  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
>
  {isSubmitting ? (
    <>
      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
      <span>Processing...</span>
    </>
  ) : (
    <>
      <Icon className="w-5 h-5" />
      <span>Action Text</span>
    </>
  )}
</button>
```

## Design System

### 1. Color Palette

The ecosystem uses a consistent color palette:

```css
/* Primary Colors */
--primary-blue: #2563eb
--primary-purple: #9333ea
--primary-indigo: #4f46e5

/* Neutral Colors */
--gray-900: #111827
--gray-800: #1f2937
--gray-700: #374151
--gray-400: #9ca3af
--gray-200: #e5e7eb

/* Status Colors */
--success: #10b981
--warning: #f59e0b
--error: #ef4444
--info: #3b82f6
```

### 2. Typography Scale

```css
/* Heading Sizes */
.text-3xl { font-size: 1.875rem; } /* 30px */
.text-2xl { font-size: 1.5rem; }   /* 24px */
.text-xl { font-size: 1.25rem; }   /* 20px */
.text-lg { font-size: 1.125rem; }  /* 18px */

/* Body Sizes */
.text-base { font-size: 1rem; }    /* 16px */
.text-sm { font-size: 0.875rem; }  /* 14px */
.text-xs { font-size: 0.75rem; }   /* 12px */
```

### 3. Spacing System

```css
/* Consistent spacing using Tailwind's scale */
.space-y-2 { margin-bottom: 0.5rem; }  /* 8px */
.space-y-4 { margin-bottom: 1rem; }    /* 16px */
.space-y-6 { margin-bottom: 1.5rem; }  /* 24px */
.space-y-8 { margin-bottom: 2rem; }    /* 32px */

/* Padding scale */
.p-4 { padding: 1rem; }     /* 16px */
.p-6 { padding: 1.5rem; }   /* 24px */
.p-8 { padding: 2rem; }     /* 32px */
```

## UI Component Library

### 1. Radix UI Components

The ecosystem extensively uses Radix UI primitives for accessibility and consistency:

```typescript
// Standard dependencies across all apps
"@radix-ui/react-dialog": "^1.1.4"
"@radix-ui/react-dropdown-menu": "^2.1.4"
"@radix-ui/react-select": "^2.1.4"
"@radix-ui/react-tabs": "^1.1.2"
"@radix-ui/react-toast": "^1.2.4"
"@radix-ui/react-tooltip": "^1.1.6"
```

### 2. Icon System

Using Lucide React for consistent iconography:

```typescript
import { 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  LogIn,
  User,
  Settings,
  ShoppingCart,
  Package
} from 'lucide-react'
```

### 3. Layout Components

#### Standard Layout Pattern

```typescript
// Common layout structure across all applications
export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        {/* Navigation component */}
      </header>
      <main className="flex-1">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  )
}
```

## Component Categories

### 1. Authentication Components
- `AdminLogin` - Admin portal login forms
- `AuthForm` - Generic authentication forms
- `ProtectedRoute` - Route protection wrapper

### 2. Data Display Components
- `OrdersTable` - Order listing and management
- `DashboardStats` - Statistical data display
- `WeddingDetails` - Wedding information display
- `UserProfile` - User profile information

### 3. Form Components
- `EmailManager` - Email configuration forms
- `ShippingRateCalculator` - Shipping calculation forms
- `CreateWeddingModal` - Wedding creation forms
- `SizeProfileForm` - Size measurement forms

### 4. Navigation Components
- `QuickNavigation` - Quick access navigation
- `Layout` - Application layout wrapper
- `Sidebar` - Side navigation panels

### 5. Utility Components
- `LoadingSpinner` - Loading states
- `ErrorBoundary` - Error handling
- `SystemHealthChecker` - System status monitoring
- `TrackingDisplay` - Order tracking information

## Styling Patterns

### 1. Tailwind CSS Configuration

All applications use consistent Tailwind configuration:

```javascript
// tailwind.config.js (consistent across all apps)
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        }
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

### 2. Class Name Patterns

```typescript
// Consistent class naming patterns
const buttonClasses = "bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
const inputClasses = "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
const cardClasses = "bg-white rounded-lg shadow-md p-6 border border-gray-200"
```

## Component State Management

### 1. React Context Pattern

```typescript
// Standard context setup across applications
interface ContextType {
  state: StateType
  actions: ActionsType
}

const Context = createContext<ContextType | undefined>(undefined)

export function useContext() {
  const context = useContext(Context)
  if (context === undefined) {
    throw new Error('useContext must be used within a Provider')
  }
  return context
}
```

### 2. Form State Management

Using React Hook Form consistently:

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
})

type FormData = z.infer<typeof schema>

function FormComponent() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema)
  })
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  )
}
```

## Responsive Design Patterns

### 1. Mobile-First Approach

```css
/* Standard responsive breakpoints */
.container {
  @apply px-4 sm:px-6 lg:px-8;
  @apply max-w-sm sm:max-w-md md:max-w-lg lg:max-w-7xl;
  @apply mx-auto;
}

/* Grid patterns */
.grid-responsive {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6;
}
```

### 2. Component Responsiveness

```typescript
// Responsive component patterns
export function ResponsiveCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 lg:p-8">
      {children}
    </div>
  )
}
```

## Testing Patterns

### 1. Component Testing Structure

```typescript
// Standard testing approach
import { render, screen, fireEvent } from '@testing-library/react'
import { ComponentName } from './ComponentName'

describe('ComponentName', () => {
  it('renders correctly', () => {
    render(<ComponentName />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
  
  it('handles user interaction', () => {
    const onClickMock = jest.fn()
    render(<ComponentName onClick={onClickMock} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onClickMock).toHaveBeenCalled()
  })
})
```

## Performance Optimization

### 1. Component Optimization

```typescript
import React, { memo, useMemo, useCallback } from 'react'

export const OptimizedComponent = memo(function ComponentName({ 
  data, 
  onAction 
}: ComponentProps) {
  const processedData = useMemo(() => {
    return data.map(item => processItem(item))
  }, [data])
  
  const handleAction = useCallback((id: string) => {
    onAction(id)
  }, [onAction])
  
  return (
    <div>
      {/* Component content */}
    </div>
  )
})
```

### 2. Lazy Loading

```typescript
import { lazy, Suspense } from 'react'

const LazyComponent = lazy(() => import('./ComponentName'))

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <LazyComponent />
    </Suspense>
  )
}
```

## Accessibility Standards

### 1. ARIA Patterns

```typescript
// Standard accessibility patterns
<button
  aria-label="Close dialog"
  aria-expanded={isOpen}
  aria-controls="dialog-content"
  onClick={handleClose}
>
  <X className="w-4 h-4" />
</button>

<div
  id="dialog-content"
  role="dialog"
  aria-modal="true"
  aria-labelledby="dialog-title"
>
  <h2 id="dialog-title">Dialog Title</h2>
</div>
```

### 2. Keyboard Navigation

```typescript
// Keyboard event handling patterns
const handleKeyDown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'Enter':
    case ' ':
      event.preventDefault()
      handleAction()
      break
    case 'Escape':
      event.preventDefault()
      handleClose()
      break
  }
}
```

## Future Component Architecture

### 1. Shared Component Library Plans

The ecosystem is designed to eventually move toward a centralized shared component library:

```
shared/
├── components/
│   ├── ui/              # Basic UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   └── index.ts
│   ├── forms/           # Form components
│   │   ├── AuthForm.tsx
│   │   ├── ProfileForm.tsx
│   │   └── index.ts
│   ├── layout/          # Layout components
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Layout.tsx
│   │   └── index.ts
│   └── business/        # Business logic components
│       ├── OrderTable.tsx
│       ├── WeddingCard.tsx
│       └── index.ts
└── hooks/               # Shared custom hooks
    ├── useAuth.ts
    ├── useApi.ts
    └── index.ts
```

### 2. Component Development Guidelines

- **Single Responsibility**: Each component should have one clear purpose
- **Composability**: Components should be easily composable
- **Prop Interface Design**: Clear, typed interfaces with sensible defaults
- **Styling**: Use Tailwind CSS with consistent class patterns
- **Accessibility**: WCAG 2.1 AA compliance by default
- **Testing**: Unit tests for all components
- **Documentation**: JSDoc comments and usage examples

This shared component library documentation serves as the foundation for maintaining consistency and enabling efficient development across the entire KCT ecosystem.
