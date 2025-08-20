# KCT Ecosystem API Endpoints Documentation

## Table of Contents
- [API Overview](#api-overview)
- [RESTful API Patterns](#restful-api-patterns)
- [Supabase Database Integration](#supabase-database-integration)
- [Supabase Edge Functions](#supabase-edge-functions)
- [Real-time Subscriptions](#real-time-subscriptions)
- [Third-party API Integrations](#third-party-api-integrations)
- [Error Handling Patterns](#error-handling-patterns)
- [Rate Limiting and Security](#rate-limiting-and-security)
- [API Versioning](#api-versioning)
- [Response Formats](#response-formats)

## API Overview

The KCT ecosystem provides a comprehensive API layer built on Supabase infrastructure, featuring RESTful endpoints, real-time subscriptions, and secure Edge Functions for complex business logic and third-party integrations.

### Core Architecture
- **Database Layer**: Supabase PostgreSQL with Row Level Security (RLS)
- **API Layer**: Auto-generated REST endpoints + Custom Edge Functions
- **Real-time Layer**: WebSocket connections for live data updates
- **Authentication**: JWT-based authentication with role-based access
- **Integration Layer**: Secure Edge Functions for third-party services

### Base Configuration
```javascript
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
)
```

## RESTful API Patterns

### Standard HTTP Methods and Conventions

#### 1. GET Requests (Read Operations)
```javascript
// Get all records with filtering and pagination
GET /rest/v1/{table}?select=*&limit=20&offset=0

// Frontend implementation
async function getUsers(filters = {}, pagination = {}) {
  let query = supabase
    .from('users')
    .select('id, email, full_name, created_at')

  // Apply filters
  if (filters.status) {
    query = query.eq('status', filters.status)
  }

  if (filters.search) {
    query = query.ilike('full_name', `%${filters.search}%`)
  }

  if (filters.dateRange) {
    query = query
      .gte('created_at', filters.dateRange.start)
      .lte('created_at', filters.dateRange.end)
  }

  // Apply pagination
  const { limit = 10, offset = 0 } = pagination
  query = query.range(offset, offset + limit - 1)

  // Apply ordering
  query = query.order('created_at', { ascending: false })

  const { data, error, count } = await query

  if (error) {
    throw new Error(`Failed to fetch users: ${error.message}`)
  }

  return {
    data,
    count,
    hasMore: count > offset + limit
  }
}

// Get single record
async function getUserById(id) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .maybeSingle() // Use maybeSingle() instead of single()

  if (error) {
    throw new Error(`Failed to fetch user: ${error.message}`)
  }

  return data
}
```

#### 2. POST Requests (Create Operations)
```javascript
// Create new record
POST /rest/v1/{table}

async function createUser(userData) {
  // Validate user is authenticated
  const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !currentUser) {
    throw new Error('Authentication required')
  }

  const { data, error } = await supabase
    .from('users')
    .insert({
      ...userData,
      created_by: currentUser.id,
      created_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create user: ${error.message}`)
  }

  return data
}

// Bulk create
async function createMultipleUsers(usersData) {
  const { data, error } = await supabase
    .from('users')
    .insert(usersData)
    .select()

  if (error) {
    throw new Error(`Failed to create users: ${error.message}`)
  }

  return data
}
```

#### 3. PUT/PATCH Requests (Update Operations)
```javascript
// Update record
PATCH /rest/v1/{table}?id=eq.{id}

async function updateUser(id, updates) {
  // Security check - ensure user can only update their own data
  const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !currentUser) {
    throw new Error('Authentication required')
  }

  const { data, error } = await supabase
    .from('users')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('created_by', currentUser.id) // Ensure user can only update their own records
    .select()
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to update user: ${error.message}`)
  }

  if (!data) {
    throw new Error('User not found or insufficient permissions')
  }

  return data
}

// Partial update with validation
async function updateUserProfile(updates) {
  const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !currentUser) {
    throw new Error('Authentication required')
  }

  // Validate updates
  const allowedFields = ['full_name', 'avatar_url', 'bio', 'website']
  const sanitizedUpdates = Object.keys(updates)
    .filter(key => allowedFields.includes(key))
    .reduce((obj, key) => {
      obj[key] = updates[key]
      return obj
    }, {})

  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...sanitizedUpdates,
      updated_at: new Date().toISOString()
    })
    .eq('id', currentUser.id)
    .select()
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to update profile: ${error.message}`)
  }

  return data
}
```

#### 4. DELETE Requests (Delete Operations)
```javascript
// Delete record
DELETE /rest/v1/{table}?id=eq.{id}

async function deleteUser(id) {
  const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !currentUser) {
    throw new Error('Authentication required')
  }

  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', id)
    .eq('created_by', currentUser.id)

  if (error) {
    throw new Error(`Failed to delete user: ${error.message}`)
  }

  return { success: true }
}

// Soft delete pattern
async function softDeleteUser(id) {
  return updateUser(id, {
    status: 'deleted',
    deleted_at: new Date().toISOString()
  })
}
```

### Query Operators and Filters

```javascript
// Advanced querying patterns
async function searchUsers(searchParams) {
  let query = supabase.from('users').select('*')

  // Text search
  if (searchParams.search) {
    query = query.or(`full_name.ilike.%${searchParams.search}%,email.ilike.%${searchParams.search}%`)
  }

  // Range queries
  if (searchParams.ageMin || searchParams.ageMax) {
    if (searchParams.ageMin) query = query.gte('age', searchParams.ageMin)
    if (searchParams.ageMax) query = query.lte('age', searchParams.ageMax)
  }

  // Array operations
  if (searchParams.tags) {
    query = query.overlaps('tags', searchParams.tags)
  }

  // JSON operations
  if (searchParams.metadataKey) {
    query = query.contains('metadata', { [searchParams.metadataKey]: searchParams.metadataValue })
  }

  // Null checks
  if (searchParams.hasAvatar !== undefined) {
    query = searchParams.hasAvatar 
      ? query.not('avatar_url', 'is', null)
      : query.is('avatar_url', null)
  }

  return await query
}
```

## Supabase Database Integration

### Row Level Security (RLS) Patterns

#### 1. User-owned Data Pattern
```sql
-- Enable RLS
ALTER TABLE user_posts ENABLE ROW LEVEL SECURITY;

-- Users can only access their own posts
CREATE POLICY "Users can manage own posts" ON user_posts
  FOR ALL USING (auth.uid() = user_id);

-- Public read access
CREATE POLICY "Public posts are viewable by everyone" ON user_posts
  FOR SELECT USING (is_public = true);
```

#### 2. Role-based Access Pattern
```sql
-- Admin access
CREATE POLICY "Admins have full access" ON sensitive_data
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );
```

### Database Functions and Triggers

```sql
-- Auto-update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to tables
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Complex Queries with Manual Joins

```javascript
// Manual relationship fetching (recommended approach)
async function getUserPostsWithComments(userId) {
  // Fetch user posts
  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (postsError) throw postsError

  if (!posts || posts.length === 0) {
    return []
  }

  // Fetch comments for posts
  const postIds = posts.map(post => post.id)
  const { data: comments, error: commentsError } = await supabase
    .from('comments')
    .select('*')
    .in('post_id', postIds)
    .order('created_at', { ascending: true })

  if (commentsError) throw commentsError

  // Group comments by post_id
  const commentsByPost = comments.reduce((acc, comment) => {
    if (!acc[comment.post_id]) acc[comment.post_id] = []
    acc[comment.post_id].push(comment)
    return acc
  }, {})

  // Combine posts with comments
  return posts.map(post => ({
    ...post,
    comments: commentsByPost[post.id] || []
  }))
}
```

## Supabase Edge Functions

### Edge Function Development Patterns

#### 1. Basic Edge Function Structure
```javascript
// supabase/functions/example-function/index.ts
Deno.serve(async (req) => {
  // CORS headers for all responses
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'false'
  }

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    // Parse request body
    const body = await req.json()
    
    // Validate authentication if required
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      throw new Error('Authorization required')
    }

    const token = authHeader.replace('Bearer ', '')
    const user = await validateUser(token)

    // Function logic here
    const result = await processRequest(body, user)

    return new Response(JSON.stringify({
      data: result,
      success: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Function error:', error)

    return new Response(JSON.stringify({
      error: {
        code: 'FUNCTION_ERROR',
        message: error.message,
        timestamp: new Date().toISOString()
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

// Helper function for user validation
async function validateUser(token) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'apikey': serviceRoleKey
    }
  })

  if (!userResponse.ok) {
    throw new Error('Invalid authentication token')
  }

  return await userResponse.json()
}
```

#### 2. File Upload Edge Function
```javascript
// supabase/functions/secure-upload/index.ts
Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const { imageData, fileName, metadata } = await req.json()

    if (!imageData || !fileName) {
      throw new Error('Image data and filename are required')
    }

    // Validate user
    const authHeader = req.headers.get('authorization')
    const user = await validateUser(authHeader?.replace('Bearer ', ''))

    // Environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    // Process base64 image
    const base64Data = imageData.split(',')[1]
    const mimeType = imageData.split(';')[0].split(':')[1]
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))

    // Generate unique filename
    const timestamp = Date.now()
    const uniqueFileName = `${user.id}/${timestamp}-${fileName}`

    // Upload to Supabase Storage
    const uploadResponse = await fetch(
      `${supabaseUrl}/storage/v1/object/uploads/${uniqueFileName}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': mimeType,
          'x-upsert': 'true'
        },
        body: binaryData
      }
    )

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      throw new Error(`Upload failed: ${errorText}`)
    }

    // Get public URL
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/uploads/${uniqueFileName}`

    // Save metadata to database
    const fileRecord = {
      user_id: user.id,
      filename: fileName,
      file_path: uniqueFileName,
      public_url: publicUrl,
      mime_type: mimeType,
      file_size: binaryData.length,
      metadata: metadata || {},
      created_at: new Date().toISOString()
    }

    const dbResponse = await fetch(`${supabaseUrl}/rest/v1/files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(fileRecord)
    })

    if (!dbResponse.ok) {
      throw new Error('Failed to save file metadata')
    }

    const fileData = await dbResponse.json()

    return new Response(JSON.stringify({
      data: {
        publicUrl,
        file: fileData[0]
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Upload error:', error)

    return new Response(JSON.stringify({
      error: {
        code: 'UPLOAD_FAILED',
        message: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
```

#### 3. Frontend Edge Function Integration
```javascript
// Frontend usage
async function uploadFile(file, metadata = {}) {
  if (!file) throw new Error('No file provided')

  // Convert file to base64
  const base64Data = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

  // Call edge function
  const { data, error } = await supabase.functions.invoke('secure-upload', {
    body: {
      imageData: base64Data,
      fileName: file.name,
      metadata: {
        ...metadata,
        originalSize: file.size,
        uploadedAt: new Date().toISOString()
      }
    }
  })

  if (error) {
    throw new Error(error.message || 'Upload failed')
  }

  return data
}

// Usage in React component
function FileUploader() {
  const [uploading, setUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState(null)

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    setUploading(true)
    
    try {
      const result = await uploadFile(file, {
        category: 'user-uploads',
        tags: ['profile']
      })
      
      setUploadedFile(result)
      toast.success('File uploaded successfully!')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <input 
        type="file" 
        onChange={handleFileUpload}
        disabled={uploading}
      />
      {uploading && <p>Uploading...</p>}
      {uploadedFile && (
        <img src={uploadedFile.publicUrl} alt="Uploaded file" />
      )}
    </div>
  )
}
```

## Real-time Subscriptions

### WebSocket Connection Patterns

#### 1. Basic Real-time Subscription
```javascript
// Subscribe to table changes
function useRealtimeTable(tableName, filters = {}) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initial data fetch
    async function fetchInitialData() {
      let query = supabase.from(tableName).select('*')
      
      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value)
      })

      const { data: initialData, error } = await query.order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching initial data:', error)
      } else {
        setData(initialData || [])
      }
      
      setLoading(false)
    }

    fetchInitialData()

    // Set up real-time subscription
    const subscription = supabase
      .channel(`realtime:${tableName}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: tableName },
        (payload) => {
          console.log('Real-time change:', payload)

          switch (payload.eventType) {
            case 'INSERT':
              // Check if new record matches filters
              if (matchesFilters(payload.new, filters)) {
                setData(prev => [payload.new, ...prev])
              }
              break
              
            case 'UPDATE':
              setData(prev => prev.map(item => 
                item.id === payload.new.id ? payload.new : item
              ))
              break
              
            case 'DELETE':
              setData(prev => prev.filter(item => item.id !== payload.old.id))
              break
          }
        })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [tableName, JSON.stringify(filters)])

  return { data, loading }
}

// Helper function to check if record matches filters
function matchesFilters(record, filters) {
  return Object.entries(filters).every(([key, value]) => record[key] === value)
}
```

#### 2. Chat/Messaging Real-time Pattern
```javascript
// Real-time chat implementation
function useChatRoom(roomId) {
  const [messages, setMessages] = useState([])
  const [users, setUsers] = useState([])
  const { user } = useAuth()

  useEffect(() => {
    if (!roomId || !user) return

    // Fetch initial messages
    async function fetchMessages() {
      const { data } = await supabase
        .from('messages')
        .select(`
          *,
          user_profiles!messages_user_id_fkey(
            id, full_name, avatar_url
          )
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(50)

      setMessages(data || [])
    }

    // Fetch active users
    async function fetchActiveUsers() {
      const { data } = await supabase
        .from('room_participants')
        .select(`
          user_profiles!room_participants_user_id_fkey(
            id, full_name, avatar_url, status
          )
        `)
        .eq('room_id', roomId)
        .eq('is_active', true)

      setUsers(data?.map(p => p.user_profiles) || [])
    }

    fetchMessages()
    fetchActiveUsers()

    // Subscribe to new messages
    const messagesSubscription = supabase
      .channel(`room:${roomId}:messages`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
        async (payload) => {
          // Fetch user profile for new message
          const { data: userProfile } = await supabase
            .from('user_profiles')
            .select('id, full_name, avatar_url')
            .eq('id', payload.new.user_id)
            .single()

          const messageWithUser = {
            ...payload.new,
            user_profiles: userProfile
          }

          setMessages(prev => [...prev, messageWithUser])
        }
      )
      .subscribe()

    // Subscribe to user presence
    const presenceSubscription = supabase
      .channel(`room:${roomId}:presence`)
      .on('presence', { event: 'sync' }, () => {
        const presenceState = presenceSubscription.presenceState()
        const activeUserIds = Object.keys(presenceState)
        // Update active users based on presence
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('User joined:', newPresences)
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('User left:', leftPresences)
      })
      .subscribe()

    // Track user presence
    presenceSubscription.track({
      user_id: user.id,
      username: user.email,
      joined_at: new Date().toISOString()
    })

    return () => {
      messagesSubscription.unsubscribe()
      presenceSubscription.unsubscribe()
    }
  }, [roomId, user])

  const sendMessage = async (content) => {
    if (!content.trim() || !user) return

    const { error } = await supabase
      .from('messages')
      .insert({
        room_id: roomId,
        user_id: user.id,
        content: content.trim(),
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error sending message:', error)
      throw error
    }
  }

  return { messages, users, sendMessage }
}
```

#### 3. Real-time Notifications System
```javascript
// Global notifications system
function useNotifications() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return

    // Fetch initial notifications
    async function fetchNotifications() {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      setNotifications(data || [])
      setUnreadCount(data?.filter(n => !n.read_at).length || 0)
    }

    fetchNotifications()

    // Subscribe to new notifications
    const subscription = supabase
      .channel(`user:${user.id}:notifications`)
      .on('postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          setNotifications(prev => [payload.new, ...prev])
          setUnreadCount(prev => prev + 1)
          
          // Show toast notification
          toast.info(payload.new.message)
        }
      )
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          setNotifications(prev => 
            prev.map(n => n.id === payload.new.id ? payload.new : n)
          )
          
          // Update unread count if notification was marked as read
          if (payload.new.read_at && !payload.old.read_at) {
            setUnreadCount(prev => Math.max(0, prev - 1))
          }
        }
      )
      .subscribe()

    return () => subscription.unsubscribe()
  }, [user])

  const markAsRead = async (notificationId) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .is('read_at', null)

    if (error) {
      console.error('Error marking all notifications as read:', error)
    } else {
      setUnreadCount(0)
    }
  }

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead
  }
}
```

## Third-party API Integrations

### Stripe Payment Integration

#### 1. Single Payment Edge Function
```javascript
// supabase/functions/create-payment/index.ts
Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const { amount, currency = 'usd', cartItems, customerEmail, metadata = {} } = await req.json()

    // Validate required parameters
    if (!amount || amount <= 0) {
      throw new Error('Valid amount is required')
    }

    if (!cartItems || !Array.isArray(cartItems)) {
      throw new Error('Cart items are required')
    }

    // Validate cart items
    for (const item of cartItems) {
      if (!item.product_id || !item.quantity || !item.price || !item.product_name) {
        throw new Error('Invalid cart item structure')
      }
    }

    // Get environment variables
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    // Verify amount matches cart total
    const calculatedAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    if (Math.abs(calculatedAmount - amount) > 0.01) {
      throw new Error('Amount mismatch')
    }

    // Get user if authenticated
    let userId = null
    const authHeader = req.headers.get('authorization')
    if (authHeader) {
      const user = await validateUser(authHeader.replace('Bearer ', ''))
      userId = user.id
    }

    // Create Stripe payment intent
    const stripeParams = new URLSearchParams()
    stripeParams.append('amount', Math.round(amount * 100).toString())
    stripeParams.append('currency', currency)
    stripeParams.append('payment_method_types[]', 'card')
    stripeParams.append('metadata[customer_email]', customerEmail || '')
    stripeParams.append('metadata[user_id]', userId || '')
    
    // Add cart metadata
    cartItems.forEach((item, index) => {
      stripeParams.append(`metadata[item_${index}_name]`, item.product_name)
      stripeParams.append(`metadata[item_${index}_quantity]`, item.quantity.toString())
    })

    const stripeResponse = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: stripeParams.toString()
    })

    if (!stripeResponse.ok) {
      const errorData = await stripeResponse.text()
      throw new Error(`Stripe API error: ${errorData}`)
    }

    const paymentIntent = await stripeResponse.json()

    // Create order record
    const orderData = {
      user_id: userId,
      stripe_payment_intent_id: paymentIntent.id,
      status: 'pending',
      total_amount: amount,
      currency,
      customer_email: customerEmail,
      metadata,
      created_at: new Date().toISOString()
    }

    const orderResponse = await fetch(`${supabaseUrl}/rest/v1/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(orderData)
    })

    if (!orderResponse.ok) {
      // Cancel payment intent if order creation fails
      await fetch(`https://api.stripe.com/v1/payment_intents/${paymentIntent.id}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stripeSecretKey}`
        }
      })
      throw new Error('Failed to create order')
    }

    const order = await orderResponse.json()

    // Create order items
    const orderItems = cartItems.map(item => ({
      order_id: order[0].id,
      product_id: item.product_id,
      quantity: item.quantity,
      price_at_time: item.price,
      product_name: item.product_name,
      product_image_url: item.product_image_url || null
    }))

    await fetch(`${supabaseUrl}/rest/v1/order_items`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderItems)
    })

    return new Response(JSON.stringify({
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        orderId: order[0].id
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Payment creation error:', error)

    return new Response(JSON.stringify({
      error: {
        code: 'PAYMENT_FAILED',
        message: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
```

#### 2. Subscription Payment Edge Function
```javascript
// supabase/functions/create-subscription/index.ts
Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const { planType, customerEmail } = await req.json()

    if (!planType || !customerEmail) {
      throw new Error('Plan type and customer email are required')
    }

    // Validate user
    const authHeader = req.headers.get('authorization')
    const user = await validateUser(authHeader?.replace('Bearer ', ''))

    // Get environment variables
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    // Get plan details from database
    const planResponse = await fetch(`${supabaseUrl}/rest/v1/plans?plan_type=eq.${planType}`, {
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey
      }
    })

    if (!planResponse.ok) {
      throw new Error('Plan not found')
    }

    const plans = await planResponse.json()
    const plan = plans[0]

    if (!plan) {
      throw new Error('Invalid plan type')
    }

    // Create or get Stripe customer
    const customerParams = new URLSearchParams()
    customerParams.append('email', customerEmail)
    customerParams.append('metadata[user_id]', user.id)

    const customerResponse = await fetch('https://api.stripe.com/v1/customers', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: customerParams.toString()
    })

    if (!customerResponse.ok) {
      throw new Error('Failed to create Stripe customer')
    }

    const customer = await customerResponse.json()

    // Create checkout session
    const checkoutParams = new URLSearchParams()
    checkoutParams.append('mode', 'subscription')
    checkoutParams.append('customer', customer.id)
    checkoutParams.append('line_items[0][price]', plan.price_id)
    checkoutParams.append('line_items[0][quantity]', '1')
    checkoutParams.append('success_url', `${req.headers.get('origin')}/subscription?status=success`)
    checkoutParams.append('cancel_url', `${req.headers.get('origin')}/subscription?status=cancelled`)
    checkoutParams.append('metadata[user_id]', user.id)
    checkoutParams.append('metadata[plan_type]', planType)

    const checkoutResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: checkoutParams.toString()
    })

    if (!checkoutResponse.ok) {
      const errorData = await checkoutResponse.text()
      throw new Error(`Stripe checkout error: ${errorData}`)
    }

    const checkoutSession = await checkoutResponse.json()

    return new Response(JSON.stringify({
      data: {
        checkoutUrl: checkoutSession.url,
        sessionId: checkoutSession.id
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Subscription creation error:', error)

    return new Response(JSON.stringify({
      error: {
        code: 'SUBSCRIPTION_FAILED',
        message: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
```

### SendGrid Email Integration

```javascript
// supabase/functions/send-email/index.ts
Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const { 
      to, 
      subject, 
      html, 
      text, 
      templateId, 
      templateData,
      from = null
    } = await req.json()

    if (!to || !subject || (!html && !text && !templateId)) {
      throw new Error('Missing required email parameters')
    }

    // Validate user
    const authHeader = req.headers.get('authorization')
    const user = await validateUser(authHeader?.replace('Bearer ', ''))

    const sendGridApiKey = Deno.env.get('SENDGRID_API_KEY')
    const defaultFromEmail = Deno.env.get('DEFAULT_FROM_EMAIL') || 'noreply@yourapp.com'

    if (!sendGridApiKey) {
      throw new Error('SendGrid API key not configured')
    }

    // Prepare email data
    const emailData = {
      personalizations: [{
        to: Array.isArray(to) ? to : [{ email: to }],
        ...(templateData && { dynamic_template_data: templateData })
      }],
      from: { email: from || defaultFromEmail },
      ...(templateId ? { template_id: templateId } : {
        subject,
        content: [
          ...(text ? [{ type: 'text/plain', value: text }] : []),
          ...(html ? [{ type: 'text/html', value: html }] : [])
        ]
      }),
      tracking_settings: {
        click_tracking: { enable: true },
        open_tracking: { enable: true }
      }
    }

    // Send email via SendGrid
    const sendGridResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendGridApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    })

    if (!sendGridResponse.ok) {
      const errorData = await sendGridResponse.text()
      throw new Error(`SendGrid API error: ${errorData}`)
    }

    // Log email to database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    const emailLogData = {
      user_id: user.id,
      to_email: Array.isArray(to) ? to[0].email : to,
      subject,
      template_id: templateId || null,
      status: 'sent',
      sent_at: new Date().toISOString()
    }

    await fetch(`${supabaseUrl}/rest/v1/email_logs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailLogData)
    })

    return new Response(JSON.stringify({
      data: {
        message: 'Email sent successfully',
        messageId: sendGridResponse.headers.get('X-Message-Id')
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Email sending error:', error)

    return new Response(JSON.stringify({
      error: {
        code: 'EMAIL_FAILED',
        message: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
```

### EasyPost Shipping Integration

```javascript
// supabase/functions/create-shipment/index.ts
Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const {
      orderId,
      fromAddress,
      toAddress,
      parcel,
      service = 'Ground'
    } = await req.json()

    if (!orderId || !fromAddress || !toAddress || !parcel) {
      throw new Error('Missing required shipment parameters')
    }

    // Validate user
    const authHeader = req.headers.get('authorization')
    const user = await validateUser(authHeader?.replace('Bearer ', ''))

    const easyPostApiKey = Deno.env.get('EASYPOST_API_KEY')
    if (!easyPostApiKey) {
      throw new Error('EasyPost API key not configured')
    }

    // Create shipment with EasyPost
    const shipmentData = {
      to_address: toAddress,
      from_address: fromAddress,
      parcel: parcel,
      service: service,
      carrier_accounts: ['usps'], // Specify carriers as needed
      options: {
        label_format: 'PDF',
        delivery_confirmation: 'SIGNATURE'
      }
    }

    const easyPostResponse = await fetch('https://api.easypost.com/v2/shipments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${easyPostApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ shipment: shipmentData })
    })

    if (!easyPostResponse.ok) {
      const errorData = await easyPostResponse.text()
      throw new Error(`EasyPost API error: ${errorData}`)
    }

    const shipment = await easyPostResponse.json()

    // Select best rate (cheapest by default)
    const bestRate = shipment.rates.reduce((prev, current) => 
      parseFloat(prev.rate) < parseFloat(current.rate) ? prev : current
    )

    // Buy the shipment
    const buyResponse = await fetch(`https://api.easypost.com/v2/shipments/${shipment.id}/buy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${easyPostApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ rate: bestRate })
    })

    if (!buyResponse.ok) {
      const errorData = await buyResponse.text()
      throw new Error(`EasyPost buy error: ${errorData}`)
    }

    const boughtShipment = await buyResponse.json()

    // Save shipment to database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    const shipmentRecord = {
      order_id: orderId,
      user_id: user.id,
      easypost_shipment_id: boughtShipment.id,
      tracking_code: boughtShipment.tracking_code,
      label_url: boughtShipment.postage_label.label_url,
      carrier: bestRate.carrier,
      service: bestRate.service,
      rate: parseFloat(bestRate.rate),
      status: 'created',
      created_at: new Date().toISOString()
    }

    await fetch(`${supabaseUrl}/rest/v1/shipments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(shipmentRecord)
    })

    return new Response(JSON.stringify({
      data: {
        shipmentId: boughtShipment.id,
        trackingCode: boughtShipment.tracking_code,
        labelUrl: boughtShipment.postage_label.label_url,
        rate: bestRate.rate,
        carrier: bestRate.carrier,
        service: bestRate.service
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Shipment creation error:', error)

    return new Response(JSON.stringify({
      error: {
        code: 'SHIPMENT_FAILED',
        message: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
```

## Error Handling Patterns

### Standard Error Response Format
```javascript
// Standardized error response structure
const ErrorResponse = {
  error: {
    code: 'ERROR_CODE',           // Machine-readable error code
    message: 'Human readable message',  // User-friendly message
    details: {                    // Additional error context
      field: 'field_name',        // Field that caused error (if applicable)
      value: 'invalid_value',     // Invalid value (if applicable)
      constraint: 'validation_rule' // Constraint that was violated
    },
    timestamp: '2024-01-15T10:30:00Z', // ISO timestamp
    requestId: 'uuid',            // Request tracking ID
    stack: 'error_stack'          // Stack trace (development only)
  }
}

// Error codes enumeration
const ERROR_CODES = {
  // Authentication errors
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  AUTH_INVALID: 'AUTH_INVALID',
  AUTH_EXPIRED: 'AUTH_EXPIRED',
  
  // Authorization errors
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  INSUFFICIENT_ROLE: 'INSUFFICIENT_ROLE',
  
  // Validation errors
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  REQUIRED_FIELD: 'REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  
  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // Server errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR'
}
```

### Frontend Error Handling Utilities
```javascript
// API error handler class
class APIError extends Error {
  constructor(code, message, details = {}, status = 500) {
    super(message)
    this.name = 'APIError'
    this.code = code
    this.details = details
    this.status = status
    this.timestamp = new Date().toISOString()
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
        timestamp: this.timestamp
      }
    }
  }
}

// API client with error handling
class APIClient {
  constructor(baseURL, defaultHeaders = {}) {
    this.baseURL = baseURL
    this.defaultHeaders = defaultHeaders
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...this.defaultHeaders,
        ...options.headers
      },
      ...options
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        await this.handleErrorResponse(response)
      }

      const contentType = response.headers.get('content-type')
      
      if (contentType && contentType.includes('application/json')) {
        return await response.json()
      }
      
      return await response.text()

    } catch (error) {
      if (error instanceof APIError) {
        throw error
      }

      // Network or other errors
      throw new APIError(
        'NETWORK_ERROR',
        'Network request failed',
        { originalError: error.message },
        0
      )
    }
  }

  async handleErrorResponse(response) {
    let errorData

    try {
      errorData = await response.json()
    } catch {
      errorData = {
        error: {
          code: 'UNKNOWN_ERROR',
          message: `HTTP ${response.status} ${response.statusText}`
        }
      }
    }

    const { error } = errorData
    
    throw new APIError(
      error.code || 'UNKNOWN_ERROR',
      error.message || 'An error occurred',
      error.details || {},
      response.status
    )
  }

  // Convenience methods
  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' })
  }

  post(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body)
    })
  }

  put(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body)
    })
  }

  patch(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(body)
    })
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' })
  }
}

// Usage example
const apiClient = new APIClient('https://your-api.com/api/v1', {
  'Authorization': `Bearer ${token}`
})

// React hook for API calls with error handling
function useAPICall() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const callAPI = useCallback(async (apiCall) => {
    setLoading(true)
    setError(null)

    try {
      const result = await apiCall()
      return result
    } catch (error) {
      if (error instanceof APIError) {
        setError(error)
        
        // Handle specific error codes
        switch (error.code) {
          case 'AUTH_EXPIRED':
            // Redirect to login
            window.location.href = '/login'
            break
          case 'PERMISSION_DENIED':
            toast.error('You do not have permission to perform this action')
            break
          case 'VALIDATION_FAILED':
            // Show field-specific errors
            if (error.details.field) {
              toast.error(`${error.details.field}: ${error.message}`)
            } else {
              toast.error(error.message)
            }
            break
          case 'RATE_LIMIT_EXCEEDED':
            toast.error('Too many requests. Please wait before trying again.')
            break
          default:
            toast.error(error.message || 'An unexpected error occurred')
        }
      } else {
        const unknownError = new APIError('UNKNOWN_ERROR', 'An unexpected error occurred')
        setError(unknownError)
        toast.error('An unexpected error occurred')
      }
      
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  return { callAPI, loading, error }
}
```

## Rate Limiting and Security

### Rate Limiting Implementation

#### 1. Edge Function Rate Limiting
```javascript
// Rate limiting utility for Edge Functions
class RateLimiter {
  constructor(windowMs = 60000, maxRequests = 100) {
    this.windowMs = windowMs
    this.maxRequests = maxRequests
    this.requests = new Map()
  }

  isAllowed(identifier) {
    const now = Date.now()
    const windowStart = now - this.windowMs

    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, [])
    }

    const userRequests = this.requests.get(identifier)
    
    // Remove old requests
    const recentRequests = userRequests.filter(timestamp => timestamp > windowStart)
    
    if (recentRequests.length >= this.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: Math.min(...userRequests) + this.windowMs
      }
    }

    recentRequests.push(now)
    this.requests.set(identifier, recentRequests)

    return {
      allowed: true,
      remaining: this.maxRequests - recentRequests.length,
      resetTime: now + this.windowMs
    }
  }

  cleanup() {
    const now = Date.now()
    
    for (const [identifier, requests] of this.requests.entries()) {
      const recentRequests = requests.filter(timestamp => timestamp > now - this.windowMs)
      
      if (recentRequests.length === 0) {
        this.requests.delete(identifier)
      } else {
        this.requests.set(identifier, recentRequests)
      }
    }
  }
}

// Usage in Edge Function
const rateLimiter = new RateLimiter(60000, 100) // 100 requests per minute

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    // Get client identifier (IP or user ID)
    const clientIP = req.headers.get('x-forwarded-for') || 'unknown'
    const authHeader = req.headers.get('authorization')
    
    let identifier = clientIP
    if (authHeader) {
      try {
        const user = await validateUser(authHeader.replace('Bearer ', ''))
        identifier = user.id
      } catch {
        // Use IP if auth fails
      }
    }

    // Check rate limit
    const rateLimit = rateLimiter.isAllowed(identifier)
    
    if (!rateLimit.allowed) {
      return new Response(JSON.stringify({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.',
          details: {
            resetTime: rateLimit.resetTime
          }
        }
      }), {
        status: 429,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': rateLimiter.maxRequests.toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': Math.ceil(rateLimit.resetTime / 1000).toString()
        }
      })
    }

    // Process request
    const result = await processRequest(req)

    return new Response(JSON.stringify(result), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': rateLimiter.maxRequests.toString(),
        'X-RateLimit-Remaining': rateLimit.remaining.toString()
      }
    })

  } catch (error) {
    console.error('Request processing error:', error)

    return new Response(JSON.stringify({
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

// Periodic cleanup
setInterval(() => {
  rateLimiter.cleanup()
}, 60000) // Cleanup every minute
```

### Security Best Practices

#### 1. Input Validation and Sanitization
```javascript
// Input validation utilities
const validators = {
  email: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email) && email.length <= 254
  },

  password: (password) => {
    return password.length >= 8 && 
           password.length <= 128 &&
           /(?=.*[a-z])/.test(password) &&
           /(?=.*[A-Z])/.test(password) &&
           /(?=.*\d)/.test(password)
  },

  uuid: (uuid) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(uuid)
  },

  sanitizeString: (str) => {
    if (typeof str !== 'string') return ''
    return str.trim()
             .replace(/[<>]/g, '') // Remove potential HTML
             .substring(0, 1000)   // Limit length
  },

  sanitizeHTML: (html) => {
    // In a real implementation, use a proper HTML sanitizer like DOMPurify
    return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
               .replace(/on\w+="[^"]*"/g, '') // Remove event handlers
  }
}

// Request validation middleware
function validateRequest(schema) {
  return async (req) => {
    const body = await req.json()
    const errors = []

    for (const [field, rules] of Object.entries(schema)) {
      const value = body[field]

      // Required field check
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push({
          field,
          code: 'REQUIRED_FIELD',
          message: `${field} is required`
        })
        continue
      }

      // Skip validation if field is optional and not provided
      if (!rules.required && (value === undefined || value === null)) {
        continue
      }

      // Type validation
      if (rules.type && typeof value !== rules.type) {
        errors.push({
          field,
          code: 'INVALID_TYPE',
          message: `${field} must be of type ${rules.type}`
        })
        continue
      }

      // Custom validation
      if (rules.validator && !rules.validator(value)) {
        errors.push({
          field,
          code: 'VALIDATION_FAILED',
          message: rules.message || `${field} is invalid`
        })
      }

      // Sanitization
      if (rules.sanitize && typeof value === 'string') {
        body[field] = rules.sanitize(value)
      }
    }

    if (errors.length > 0) {
      throw new APIError('VALIDATION_FAILED', 'Validation failed', { errors })
    }

    return body
  }
}

// Usage example
const createUserSchema = {
  email: {
    required: true,
    type: 'string',
    validator: validators.email,
    message: 'Please provide a valid email address'
  },
  password: {
    required: true,
    type: 'string',
    validator: validators.password,
    message: 'Password must be at least 8 characters with uppercase, lowercase, and number'
  },
  full_name: {
    required: true,
    type: 'string',
    sanitize: validators.sanitizeString
  },
  bio: {
    required: false,
    type: 'string',
    sanitize: validators.sanitizeHTML
  }
}

// In Edge Function
const validatedBody = await validateRequest(createUserSchema)(req)
```

#### 2. SQL Injection Prevention
```javascript
// Always use parameterized queries with Supabase
// ✅ CORRECT: Using Supabase client (automatically parameterized)
async function getUsersByStatus(status) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('status', status) // This is safe - Supabase handles parameterization
    
  return data
}

// ✅ CORRECT: Using .in() for multiple values
async function getUsersByIds(userIds) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .in('id', userIds) // Safe for arrays
    
  return data
}

// ❌ INCORRECT: Never build raw SQL strings
async function unsafeQuery(userInput) {
  // DON'T DO THIS - vulnerable to SQL injection
  const query = `SELECT * FROM users WHERE name = '${userInput}'`
  // This would be dangerous if we could execute raw SQL
}

// ✅ CORRECT: Complex queries using Supabase operators
async function searchUsers(searchTerm, filters) {
  let query = supabase.from('users').select('*')

  if (searchTerm) {
    query = query.ilike('full_name', `%${searchTerm}%`)
  }

  if (filters.status) {
    query = query.eq('status', filters.status)
  }

  if (filters.dateRange) {
    query = query
      .gte('created_at', filters.dateRange.start)
      .lte('created_at', filters.dateRange.end)
  }

  return await query
}
```

#### 3. XSS Prevention
```javascript
// Content Security Policy headers
const securityHeaders = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://js.stripe.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://api.stripe.com"
  ].join('; '),
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
}

// Apply security headers in Next.js
export default function handler(req, res) {
  // Apply security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    res.setHeader(key, value)
  })

  // Your API logic here
  res.json({ message: 'API response' })
}
```

## API Versioning

### URL-based Versioning Strategy
```javascript
// API versioning structure
const API_VERSIONS = {
  v1: '/api/v1',
  v2: '/api/v2'
}

// Version-specific client
class VersionedAPIClient {
  constructor(version = 'v1') {
    this.version = version
    this.baseURL = `${API_VERSIONS[version]}`
  }

  // Version-specific endpoints
  getUsers(options = {}) {
    if (this.version === 'v1') {
      return this.request('/users', options)
    } else if (this.version === 'v2') {
      // v2 might have different response format
      return this.request('/users', {
        ...options,
        headers: { 'Accept': 'application/vnd.api+json' }
      })
    }
  }
}

// Backward compatibility handling
async function handleVersionedRequest(req, res, version) {
  switch (version) {
    case 'v1':
      return handleV1Request(req, res)
    case 'v2':
      return handleV2Request(req, res)
    default:
      return res.status(400).json({
        error: {
          code: 'UNSUPPORTED_VERSION',
          message: `API version ${version} is not supported`
        }
      })
  }
}
```

## Response Formats

### Standard Success Response
```javascript
// Consistent success response format
const SuccessResponse = {
  data: {}, // or [] for arrays
  meta: {
    count: 0,
    page: 1,
    limit: 10,
    total: 0
  },
  links: {
    self: 'https://api.example.com/users?page=1',
    next: 'https://api.example.com/users?page=2',
    prev: null,
    first: 'https://api.example.com/users?page=1',
    last: 'https://api.example.com/users?page=10'
  }
}

// Response builder utility
class ResponseBuilder {
  static success(data, meta = {}, links = {}) {
    return {
      data,
      ...(Object.keys(meta).length > 0 && { meta }),
      ...(Object.keys(links).length > 0 && { links })
    }
  }

  static error(code, message, details = {}) {
    return {
      error: {
        code,
        message,
        details,
        timestamp: new Date().toISOString()
      }
    }
  }

  static paginated(data, pagination, baseUrl) {
    const { page, limit, total } = pagination
    const totalPages = Math.ceil(total / limit)

    return {
      data,
      meta: {
        count: data.length,
        page,
        limit,
        total,
        totalPages
      },
      links: {
        self: `${baseUrl}?page=${page}&limit=${limit}`,
        next: page < totalPages ? `${baseUrl}?page=${page + 1}&limit=${limit}` : null,
        prev: page > 1 ? `${baseUrl}?page=${page - 1}&limit=${limit}` : null,
        first: `${baseUrl}?page=1&limit=${limit}`,
        last: `${baseUrl}?page=${totalPages}&limit=${limit}`
      }
    }
  }
}

// Usage in API handlers
export default async function handler(req, res) {
  try {
    const users = await getUsers(req.query)
    
    res.json(ResponseBuilder.success(users))
  } catch (error) {
    res.status(500).json(
      ResponseBuilder.error('INTERNAL_ERROR', error.message)
    )
  }
}
```

---

This comprehensive API endpoints documentation covers all the core patterns, integrations, and best practices needed for building robust APIs within the KCT ecosystem. The examples provided are production-ready and follow modern API design principles with proper error handling, security considerations, and scalability patterns.
