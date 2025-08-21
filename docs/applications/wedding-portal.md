# Wedding Portal - Technical Documentation

## Executive Summary

The Wedding Portal is a sophisticated React-based application designed to coordinate and manage all aspects of wedding party preparation. Built with TypeScript, React Query, and Tailwind CSS, it serves as the central hub for couples to manage their wedding party, coordinate outfits, track timelines, and communicate with all stakeholders. The application integrates seamlessly with the groomsmen portal and admin hub, utilizing advanced AI features for outfit coordination and smart measurement systems.

## Table of Contents

1. [Wedding Management Workflows and Lifecycle](#1-wedding-management-workflows-and-lifecycle)
2. [Timeline and Milestone Tracking Systems](#2-timeline-and-milestone-tracking-systems)
3. [Communication Systems and Party Coordination](#3-communication-systems-and-party-coordination)
4. [Outfit Coordination Logic and Advanced Features](#4-outfit-coordination-logic-and-advanced-features)
5. [Smart Measurement System Integration](#5-smart-measurement-system-integration)
6. [Component Structure and Routing Architecture](#6-component-structure-and-routing-architecture)
7. [Database Schema for Weddings and Parties](#7-database-schema-for-weddings-and-parties)
8. [Integration with Groomsmen Portal and Admin Hub](#8-integration-with-groomsmen-portal-and-admin-hub)
9. [Authentication Flows and Protected Routes](#9-authentication-flows-and-protected-routes)
10. [Code Examples and Implementation Patterns](#10-code-examples-and-implementation-patterns)

---

## 1. Wedding Management Workflows and Lifecycle

### Wedding Lifecycle States

The Wedding Portal manages weddings through several key states:

1. **Created** - Wedding code generated and basic information set
2. **Active** - Party invitations being sent and coordination in progress
3. **Preparation** - All measurements and outfit selections underway
4. **Finalizing** - Final fittings and payment processing
5. **Complete** - All orders processed and ready for event

### Core Workflows

#### Wedding Access and Onboarding
```typescript
// Wedding code validation and authentication flow
const handleWeddingCodeSubmit = async (e: React.FormEvent) => {
  const validationResult = await validateWeddingCode(weddingCode)
  if (validationResult.success) {
    setWeddingData(validationResult.data.wedding)
    setStep('create-account')
  }
}
```

#### Dashboard Overview Workflow
The dashboard provides real-time analytics and progress tracking:

- **Progress Metrics**: Measurements, outfit selection, and payment completion percentages
- **Party Status**: Individual member progress and overall coordination status
- **Timeline Management**: Upcoming deadlines and task priorities
- **Quick Actions**: Direct access to key functionality

#### Wedding Coordination Process
1. **Setup Phase**
   - Wedding code validation and account creation
   - Basic wedding information configuration
   - Party member invitation system initialization

2. **Coordination Phase**
   - Party member invitations and onboarding
   - Measurement collection and validation
   - Outfit selection and approval workflows
   - Communication and update distribution

3. **Completion Phase**
   - Final approvals and payment processing
   - Shipping coordination and delivery tracking
   - Final preparation and event readiness

### Key Business Logic

```typescript
// Wedding dashboard data structure
interface WeddingDashboard {
  wedding: {
    id: string
    wedding_code: string
    wedding_date: string
    completion_percentage: number
    days_until_wedding: number
  }
  party_progress: {
    total_members: number
    measurements_completed: number
    measurements_percentage: number
    outfits_selected: number
    outfits_percentage: number
    payments_completed: number
    payments_percentage: number
  }
}
```

---

## 2. Timeline and Milestone Tracking Systems

### Automated Timeline Generation

The portal features sophisticated timeline management with AI-powered automation:

#### Task Categories and Priorities
- **Setup**: Initial wedding and party configuration
- **Measurements**: Size collection and validation
- **Selection**: Outfit coordination and approval
- **Payment**: Order processing and financial coordination
- **Fitting**: Final adjustments and quality assurance
- **Delivery**: Shipping and logistics coordination

#### Priority Classification System
```typescript
const getPriorityColor = (priority: string) => {
  const colors = {
    critical: 'border-red-500 bg-red-50',    // Immediate attention required
    high: 'border-orange-500 bg-orange-50',  // Important but not urgent
    medium: 'border-yellow-500 bg-yellow-50', // Standard timeline
    low: 'border-gray-300 bg-gray-50'        // Optional/nice-to-have
  }
  return colors[priority as keyof typeof colors] || colors.low
}
```

#### Timeline Features
- **Dynamic Deadlines**: Automatically calculated based on wedding date
- **Progress Tracking**: Real-time updates based on party member actions
- **Automated Reminders**: Smart notification system for upcoming deadlines
- **Milestone Validation**: Dependency checking and workflow enforcement

### Task Management System

#### Task Structure
```typescript
interface WeddingTask {
  id: string
  task_name: string
  description: string
  category: 'setup' | 'measurements' | 'selection' | 'payment' | 'fitting' | 'delivery'
  priority: 'critical' | 'high' | 'medium' | 'low'
  status: 'pending' | 'in_progress' | 'completed' | 'overdue'
  due_date: string
  assigned_to: string
  completion_percentage?: number
}
```

#### AI Timeline Generation
```typescript
const generateTimelineMutation = useMutation({
  mutationFn: () => weddingPortalAPI.generateTimeline(weddingId),
  onSuccess: () => {
    toast.success('AI timeline generated successfully!')
    queryClient.invalidateQueries({ queryKey: ['wedding-tasks'] })
  }
})
```

---

## 3. Communication Systems and Party Coordination

### Multi-Channel Communication

The portal supports comprehensive communication across multiple channels:

#### Communication Types
- **Announcements**: General updates and important information
- **Reminders**: Task deadlines and action items
- **Updates**: Progress notifications and status changes
- **Questions**: Interactive communication with party members

#### Channel Integration
```typescript
// SendGrid email automation integration
const sendAutomatedEmail = async (weddingId: string, emailType: string, partyMemberIds?: string[]) => {
  const { data, error } = await supabase.functions.invoke('sendgrid-wedding-automation', {
    method: 'POST',
    body: { emailType, weddingId, partyMemberIds }
  })
}
```

### Message Management System

#### Message Structure
```typescript
interface WeddingMessage {
  id: string
  wedding_id: string
  subject: string
  message: string
  message_type: 'announcement' | 'reminder' | 'update' | 'question'
  recipient_ids?: string[]
  sent_via: ('email' | 'sms')[]
  created_at: string
  sender_id: string
}
```

#### Template System
The portal includes pre-built message templates for common scenarios:
- Measurement reminders
- Outfit selection updates
- Payment reminders
- Final wedding day details

---

## 4. Outfit Coordination Logic and Advanced Features

### AI-Powered Outfit Coordination

The portal features sophisticated AI coordination capabilities:

#### Core Coordination Metrics
```typescript
interface CoordinationAnalysis {
  overallScore: number
  colorHarmony: number
  styleConsistency: number
  formalityAlignment: number
  strengths: string[]
  issues: string[]
  insights: string[]
}
```

### Advanced Features

#### 1. **AI Analysis Engine**
- **Color Harmony Analysis**: Validates color coordination across party members
- **Style Consistency Checking**: Ensures cohesive style themes
- **Formality Alignment**: Validates appropriate formality levels
- **Budget Optimization**: AI-driven cost management recommendations

#### 2. **Outfit Validation System**
```typescript
const validateOutfitCoordination = async (weddingId: string, preferences?: any) => {
  const { data, error } = await supabase.functions.invoke('ai-outfit-coordination', {
    method: 'POST',
    body: { action: 'validate', weddingId, preferences }
  })
}
```

#### 3. **Recommendation Engine**
- **Foundation Outfit Selection**: AI identifies the optimal base outfit
- **Complementary Recommendations**: Suggests coordinating pieces for party members
- **Budget-Aware Suggestions**: Recommendations within specified budget constraints
- **Style Guide Enforcement**: Maintains consistency with wedding theme

### Coordination Workflow

#### Outfit Status Progression
1. **Pending**: No selection made
2. **Selected**: Party member has chosen outfits
3. **Under Review**: Couple is reviewing selections
4. **Approved**: Final approval granted
5. **Ordered**: Purchase completed

```typescript
const getOutfitStatus = (member: any) => {
  if (member.outfit_status === 'confirmed') {
    return { color: 'text-green-600 bg-green-100', label: 'Approved', icon: CheckCircle }
  } else if (member.outfit_status === 'selected') {
    return { color: 'text-yellow-600 bg-yellow-100', label: 'Pending Approval', icon: AlertTriangle }
  }
  return { color: 'text-gray-600 bg-gray-100', label: 'Not Selected', icon: X }
}
```

---

## 5. Smart Measurement System Integration

### AI-Powered Measurement Validation

The portal integrates advanced measurement validation and recommendation systems:

#### Core Features
- **Measurement Validation**: AI-powered accuracy checking
- **Size Recommendations**: Intelligent sizing based on measurements
- **Photo Analysis**: Computer vision for measurement extraction
- **Fit Optimization**: Personalized fitting recommendations

### Measurement System Architecture

#### Data Structure
```typescript
interface Measurements {
  chest: number
  waist: number
  hips: number
  neck: number
  sleeve: number
  inseam: number
  jacket_length: number
  height: number
  weight: number
}

interface MeasurementValidation {
  isValid: boolean
  confidenceScore: number
  bodyType: string
  fitRecommendations: {
    jacket: string
    pants: string
    notes: string
  }
  issues: string[]
  suggestions: string[]
  insights: string[]
}
```

### Advanced Capabilities

#### 1. **AI Validation Engine**
```typescript
const validateMeasurements = async (partyMemberId: string, measurements: any) => {
  return weddingPortalAPI.validateMeasurements(partyMemberId, measurements, preferences)
}
```

#### 2. **Photo Analysis System**
```typescript
const analyzePhotoMeasurements = async (partyMemberId: string, photoData: any) => {
  return weddingPortalAPI.analyzePhotoMeasurements(partyMemberId, photoData)
}
```

#### 3. **Smart Recommendations**
- Body type classification
- Fit preference optimization
- Size conversion across brands
- Alteration requirement estimation

---

## 6. Component Structure and Routing Architecture

### Application Architecture

The wedding portal follows a well-structured component hierarchy:

```
src/
├── components/
│   ├── ui/                    # Reusable UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── ...
│   ├── Layout.tsx             # Main application layout
│   ├── ProtectedRoute.tsx     # Route protection component
│   └── ErrorBoundary.tsx      # Error handling
├── pages/                     # Page components
│   ├── WeddingAccessPage.tsx  # Authentication and access
│   ├── WeddingDashboard.tsx   # Main dashboard
│   ├── PartyMemberManagement.tsx
│   ├── TimelinePage.tsx
│   ├── CommunicationPage.tsx
│   ├── OutfitCoordination.tsx
│   ├── AdvancedOutfitCoordination.tsx
│   ├── SmartMeasurementSystem.tsx
│   └── WeddingSettings.tsx
├── contexts/
│   └── AuthContext.tsx        # Authentication state management
├── hooks/
│   └── use-mobile.tsx         # Custom hooks
├── lib/
│   ├── supabase.ts           # API client
│   ├── unified-auth.ts       # Authentication utilities
│   └── utils.ts              # Utility functions
└── App.tsx                   # Root application component
```

### Routing System

#### Route Configuration
```typescript
function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<WeddingAccessPage />} />
        <Route path="/access" element={<WeddingAccessPage />} />
        <Route path="/wedding-invitation/:inviteCode" element={<WeddingAccessPage />} />
        
        {/* Protected Wedding Portal Routes */}
        <Route path="/wedding" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<WeddingDashboard />} />
          <Route path="dashboard" element={<WeddingDashboard />} />
          <Route path="party" element={<PartyMemberManagement />} />
          <Route path="timeline" element={<TimelinePage />} />
          <Route path="communication" element={<CommunicationPage />} />
          <Route path="outfits" element={<OutfitCoordination />} />
          <Route path="ai-coordination" element={<AdvancedOutfitCoordination />} />
          <Route path="smart-measurements" element={<SmartMeasurementSystem />} />
          <Route path="settings" element={<WeddingSettings />} />
        </Route>
      </Routes>
    </Router>
  )
}
```

### State Management

#### React Query Integration
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10,   // 10 minutes
    },
  },
})
```

#### Context-Based State Management
The application uses React Context for global state management:
- **AuthContext**: Authentication state and user information
- **Query Client**: Server state management with React Query

---

## 7. Database Schema for Weddings and Parties

### Core Database Entities

#### Wedding Entity
```sql
CREATE TABLE weddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_code VARCHAR(50) UNIQUE NOT NULL,
  wedding_date DATE NOT NULL,
  venue_name VARCHAR(255),
  venue_city VARCHAR(100),
  venue_state VARCHAR(50),
  primary_customer_name VARCHAR(255),
  completion_percentage INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Party Members Entity
```sql
CREATE TABLE party_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID REFERENCES weddings(id),
  user_id UUID REFERENCES auth.users(id),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(50) NOT NULL,
  invite_status VARCHAR(50) DEFAULT 'pending',
  invite_code VARCHAR(50) UNIQUE,
  measurements_status VARCHAR(50) DEFAULT 'pending',
  outfit_status VARCHAR(50) DEFAULT 'pending',
  payment_status VARCHAR(50) DEFAULT 'pending',
  overall_completion_percentage INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Measurement Data Schema

```sql
CREATE TABLE measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_member_id UUID REFERENCES party_members(id),
  measurement_type VARCHAR(50) NOT NULL,
  value DECIMAL(5,2),
  unit VARCHAR(10) DEFAULT 'inches',
  validation_status VARCHAR(50) DEFAULT 'pending',
  ai_confidence_score INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Timeline and Task Management

```sql
CREATE TABLE wedding_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID REFERENCES weddings(id),
  task_name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  priority VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(50) DEFAULT 'pending',
  due_date DATE,
  assigned_to VARCHAR(100),
  completion_percentage INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Communication System Schema

```sql
CREATE TABLE wedding_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID REFERENCES weddings(id),
  sender_id UUID REFERENCES auth.users(id),
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  message_type VARCHAR(50) DEFAULT 'announcement',
  recipient_ids UUID[],
  sent_via TEXT[] DEFAULT ARRAY['email'],
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 8. Integration with Groomsmen Portal and Admin Hub

### Cross-Portal Architecture

The wedding portal integrates seamlessly with other system components through unified authentication and shared data models:

#### Unified Authentication System
```typescript
// Unified authentication API
export const unifiedAuthAPI = {
  authenticateWithWeddingCode: async (weddingCode: string, email: string, password: string, userData?: any) => {
    // Cross-portal authentication logic
  },
  
  createCrossPortalSession: async (userId: string, portalType: string) => {
    // Session management across portals
  },
  
  syncProfileData: async (userId: string, profileData?: any, syncTarget?: string) => {
    // Data synchronization between systems
  }
}
```

### Integration Points

#### 1. **Groomsmen Portal Integration**
- **Shared Authentication**: Users can access both portals with single credentials
- **Data Synchronization**: Measurements and preferences sync automatically
- **Status Updates**: Real-time coordination between couple and groomsmen views
- **Communication Bridge**: Messages flow between portal interfaces

#### 2. **Admin Hub Integration**
- **Administrative Oversight**: Admin users can access wedding coordination data
- **Analytics and Reporting**: Comprehensive wedding progress tracking
- **System Management**: Configuration and workflow administration
- **Support Integration**: Customer service and issue resolution workflows

#### 3. **Data Flow Architecture**
```typescript
// Cross-portal data synchronization
const syncMeasurementData = async (userId: string, measurementData: any, syncTarget?: string) => {
  const { data, error } = await supabase.functions.invoke('profile-sync', {
    body: {
      action: 'sync_measurement_data',
      user_id: userId,
      measurement_data: measurementData,
      sync_target: syncTarget
    }
  })
}
```

---

## 9. Authentication Flows and Protected Routes

### Multi-Method Authentication System

The portal supports multiple authentication methods:

#### 1. **Wedding Code Authentication**
```typescript
const handleWeddingCodeSubmit = async (e: React.FormEvent) => {
  const authResult = await authenticateWithWeddingCode(
    weddingCode, 
    email, 
    password, 
    { wedding_role: 'couple' }
  )
  
  if (authResult.success) {
    localStorage.setItem('wedding_id', weddingData.id)
    localStorage.setItem('wedding_code', weddingCode)
    navigate('/wedding')
  }
}
```

#### 2. **Traditional Email/Password**
```typescript
const handleLogin = async (e: React.FormEvent) => {
  const { data, error } = await signIn(email, password)
  if (!error && data?.user) {
    await syncProfileData(data.user.id)
    navigate('/wedding')
  }
}
```

### Route Protection System

#### Protected Route Component
```typescript
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-rose-600"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/access" replace />
  }

  return <>{children}</>
}
```

### Authentication Context

```typescript
interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<any>
  signUp: (email: string, password: string, metadata?: any) => Promise<any>
  signOut: () => Promise<any>
  authenticateWithWeddingCode: (weddingCode: string, email: string, password: string, userData?: any) => Promise<any>
  validateWeddingCode: (weddingCode: string) => Promise<any>
  linkUserToWedding: (userId: string, weddingCode: string) => Promise<any>
  syncProfileData: (userId: string, profileData?: any) => Promise<any>
}
```

---

## 10. Code Examples and Implementation Patterns

### API Integration Patterns

#### 1. **React Query Integration**
```typescript
// Wedding dashboard data fetching
const { data: weddingDashboard, isLoading } = useQuery({
  queryKey: ['wedding-dashboard', weddingId],
  queryFn: () => weddingPortalAPI.getWeddingDashboard(weddingId),
  enabled: !!weddingId
})

// Mutation for updating data
const inviteMutation = useMutation({
  mutationFn: weddingPortalAPI.invitePartyMember,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['party-members'] })
    toast.success('Invitation sent successfully!')
  }
})
```

#### 2. **Error Handling Pattern**
```typescript
const validateMeasurementsMutation = useMutation({
  mutationFn: (data: { partyMemberId: string; measurements: any }) => 
    weddingPortalAPI.validateMeasurements(data.partyMemberId, data.measurements),
  onSuccess: (data) => {
    toast.success('Measurements validated successfully!')
  },
  onError: (error: any) => {
    toast.error('Validation failed: ' + error.message)
  }
})
```

### UI Component Patterns

#### 1. **Progress Card Component**
```typescript
const ProgressCard = ({ title, completed, total, icon: Icon, color }) => (
  <div className="bg-white rounded-lg shadow-lg p-6">
    <div className="flex items-center space-x-3 mb-4">
      <div className={`${color} p-3 rounded-lg`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">Progress tracking</p>
      </div>
    </div>
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Completed</span>
        <span className="font-semibold">{completed}/{total}</span>
      </div>
      <div className="bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${color.replace('100', '600')}`}
          style={{ width: `${(completed / total) * 100}%` }}
        />
      </div>
    </div>
  </div>
)
```

#### 2. **Form Handling Pattern**
```typescript
const [formData, setFormData] = useState({
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  role: 'groomsman'
})

const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault()
  inviteMutation.mutate({
    ...formData,
    wedding_id: weddingId
  })
}
```

### Advanced Feature Implementations

#### 1. **AI Coordination Tab System**
```typescript
const tabs = [
  { id: 'analysis', label: 'AI Analysis', icon: Brain },
  { id: 'recommendations', label: 'Recommendations', icon: Lightbulb },
  { id: 'validation', label: 'Validation', icon: CheckCircle },
  { id: 'optimization', label: 'Budget Optimizer', icon: DollarSign }
]

const TabContent = ({ activeTab, data, loading }) => {
  if (loading) return <LoadingSpinner />
  
  switch (activeTab) {
    case 'analysis':
      return <AnalysisContent data={data} />
    case 'recommendations':
      return <RecommendationsContent data={data} />
    default:
      return <DefaultContent />
  }
}
```

#### 2. **Real-time Updates Pattern**
```typescript
// WebSocket integration for real-time updates
useEffect(() => {
  const subscription = supabase
    .channel(`wedding-${weddingId}`)
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'party_members',
        filter: `wedding_id=eq.${weddingId}` 
      }, 
      (payload) => {
        queryClient.invalidateQueries({ queryKey: ['party-members'] })
      }
    )
    .subscribe()

  return () => {
    subscription.unsubscribe()
  }
}, [weddingId])
```

### Performance Optimization Patterns

#### 1. **Lazy Loading**
```typescript
const AdvancedOutfitCoordination = lazy(() => import('@/pages/AdvancedOutfitCoordination'))
const SmartMeasurementSystem = lazy(() => import('@/pages/SmartMeasurementSystem'))
```

#### 2. **Memoization**
```typescript
const memoizedPartyMembers = useMemo(() => 
  partyMembers?.filter(member => member.status === 'active') || [],
  [partyMembers]
)
```

### Build and Deployment Configuration

#### Vite Configuration
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [
    react(), 
    sourceIdentifierPlugin({
      enabled: !isProd,
      attributePrefix: 'data-matrix',
      includeProps: true,
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
```

This comprehensive technical documentation provides a complete overview of the Wedding Portal application, covering all architectural aspects, implementation patterns, and integration points necessary for development, maintenance, and future enhancements.
