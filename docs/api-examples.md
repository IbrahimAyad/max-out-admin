# API Integration Examples

## Quick Reference

### Import the API
```javascript
import { ProfileAPI, profileUtils } from '../lib/profile-api'
```

### Basic Profile Operations

#### Get Current User Profile
```javascript
const profile = await ProfileAPI.getProfile()
if (profile) {
  console.log('Customer:', profile.first_name, profile.last_name)
  console.log('Wedding customer:', profile.is_wedding_customer)
}
```

#### Update Profile
```javascript
const updatedProfile = await ProfileAPI.updateProfile({
  first_name: 'John',
  last_name: 'Doe',
  phone: '+1234567890',
  is_wedding_customer: true,
  wedding_role: 'groom'
})
```

#### Get Size Measurements
```javascript
const measurements = await ProfileAPI.getMeasurements()
if (measurements) {
  console.log('Suit size:', measurements.suit_size)
  console.log('Chest:', measurements.chest)
  console.log('Preferred fit:', measurements.preferred_fit)
}
```

#### Save Measurements
```javascript
const newMeasurements = await ProfileAPI.saveMeasurements({
  suit_size: '42R',
  chest: 42,
  waist: 34,
  height: 72,
  weight: 180,
  preferred_fit: 'slim',
  measurement_unit: 'imperial',
  measured_by: 'professional'
})
```

### Authentication Checks

#### Check if User is Logged In
```javascript
const isAuth = await ProfileAPI.isAuthenticated()
if (!isAuth) {
  // Redirect to login
  router.push('/auth/login')
}
```

#### Get Current User
```javascript
const user = await ProfileAPI.getCurrentUser()
if (user) {
  console.log('User ID:', user.id)
  console.log('Email:', user.email)
}
```

### Utility Functions

#### Calculate Profile Completion
```javascript
const completionPercentage = profileUtils.calculateCompletionPercentage(profile)
console.log(`Profile is ${completionPercentage}% complete`)
```

#### Get Display Name
```javascript
const displayName = profileUtils.getDisplayName(profile)
console.log('Welcome,', displayName)
```

#### Check Measurements Completeness
```javascript
const isComplete = profileUtils.areMeasurementsComplete(measurements)
if (!isComplete) {
  // Prompt user to complete measurements
}
```

#### Format Measurements for Display
```javascript
const chestDisplay = profileUtils.formatMeasurement(
  measurements.chest, 
  measurements.measurement_unit, 
  'length'
)
console.log('Chest:', chestDisplay) // "42"" or "107 cm"
```

## Product Page Integration

### Size Guide Button
```javascript
// components/ProductSizeGuide.js
import { useState } from 'react'
import { SizeProfileModal } from './profile/SizeProfileModal'
import { ProfileAPI } from '../lib/profile-api'

export function ProductSizeGuide({ productId }) {
  const [showModal, setShowModal] = useState(false)
  const [userMeasurements, setUserMeasurements] = useState(null)

  const checkUserMeasurements = async () => {
    const measurements = await ProfileAPI.getMeasurements()
    setUserMeasurements(measurements)
    setShowModal(true)
  }

  return (
    <>
      <button 
        onClick={checkUserMeasurements}
        className="text-blue-600 underline text-sm"
      >
        📏 Find My Size
      </button>
      
      {showModal && (
        <SizeProfileModal 
          onClose={() => setShowModal(false)}
          productId={productId}
          onMeasurementsSaved={(measurements) => {
            setUserMeasurements(measurements)
            // You can add size recommendation logic here
          }}
        />
      )}
    </>
  )
}
```

### Size Recommendation Logic
```javascript
// utils/sizeRecommendation.js
export function recommendSize(measurements, productSizes) {
  if (!measurements || !measurements.chest) return null
  
  const chest = measurements.chest
  const preferredFit = measurements.preferred_fit || 'regular'
  
  // Adjust for fit preference
  const adjustedChest = {
    'slim': chest - 1,
    'regular': chest,
    'relaxed': chest + 1
  }[preferredFit]
  
  // Find closest size
  const sizeMap = {
    36: '36R', 38: '38R', 40: '40R', 
    42: '42R', 44: '44R', 46: '46R'
  }
  
  const closestSize = Object.keys(sizeMap)
    .map(Number)
    .reduce((prev, curr) => 
      Math.abs(curr - adjustedChest) < Math.abs(prev - adjustedChest) ? curr : prev
    )
  
  return sizeMap[closestSize]
}
```

## Checkout Integration

### Add Size Data to Cart
```javascript
// During checkout, include size profile data
const addToCart = async (productId, selectedSize) => {
  const measurements = await ProfileAPI.getMeasurements()
  
  const cartItem = {
    productId,
    selectedSize,
    userMeasurements: measurements ? {
      chest: measurements.chest,
      waist: measurements.waist,
      preferred_fit: measurements.preferred_fit,
      measurement_unit: measurements.measurement_unit
    } : null
  }
  
  // Add to your existing cart system
  addItemToCart(cartItem)
}
```

## Wedding Customer Detection

### Check Wedding Status
```javascript
const profile = await ProfileAPI.getProfile()

if (profile?.is_wedding_customer) {
  // Show wedding-specific UI
  console.log('Wedding role:', profile.wedding_role)
  
  // Redirect to wedding portal for enhanced features
  if (profile.wedding_role === 'wedding_planner') {
    router.push('/wedding-portal')
  }
}
```

## Error Handling Patterns

### Safe API Calls
```javascript
async function safeProfileUpdate(data) {
  try {
    const updatedProfile = await ProfileAPI.updateProfile(data)
    
    // Success
    showSuccessMessage('Profile updated successfully')
    return updatedProfile
    
  } catch (error) {
    // Handle specific errors
    if (error.message.includes('authentication')) {
      router.push('/auth/login')
    } else {
      showErrorMessage(error.message || 'Failed to update profile')
    }
    
    return null
  }
}
```

### Loading States
```javascript
function ProfileSection() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true)
        setError(null)
        
        const profileData = await ProfileAPI.getProfile()
        setProfile(profileData)
        
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    
    loadProfile()
  }, [])

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} />
  if (!profile) return <EmptyState />
  
  return <ProfileDisplay profile={profile} />
}
```

## Performance Optimization

### Cache Profile Data
```javascript
// Use React Query or SWR for caching
import { useQuery } from 'react-query'

function useProfile() {
  return useQuery('profile', ProfileAPI.getProfile, {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  })
}

function useMeasurements() {
  return useQuery('measurements', ProfileAPI.getMeasurements, {
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}
```

### Batch Operations
```javascript
// Load multiple data types at once
async function loadCustomerData() {
  const [profile, measurements, styleProfile] = await Promise.all([
    ProfileAPI.getProfile(),
    ProfileAPI.getMeasurements(),
    ProfileAPI.getStyleProfile()
  ])
  
  return { profile, measurements, styleProfile }
}
```