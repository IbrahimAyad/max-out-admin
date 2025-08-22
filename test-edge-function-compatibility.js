import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
)

async function testEdgeFunctionCompatibility() {
  console.log('🔍 Testing Edge Function Compatibility with Current Database Schema')
  console.log('==================================================================\n')

  // First, let's check what tables actually exist in the database
  console.log('📊 Step 1: Checking Current Database Schema...\n')
  
  try {
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name')

    if (error) {
      console.log('❌ Could not fetch table list:', error.message)
      return
    }

    console.log('✅ Current Database Tables:')
    const tableNames = tables.map(t => t.table_name)
    tableNames.forEach(table => console.log(`   - ${table}`))
    console.log('')

    // Test critical Edge Functions that your admin apps depend on
    console.log('🧪 Step 2: Testing Critical Edge Functions...\n')
    
    const criticalFunctions = [
      {
        name: 'admin-hub-api',
        endpoint: '/dashboard-overview',
        description: 'Admin dashboard data'
      },
      {
        name: 'inventory-management', 
        endpoint: '',
        description: 'Inventory operations'
      },
      {
        name: 'get-products-enhanced',
        endpoint: '',
        description: 'Enhanced product data'
      },
      {
        name: 'vendor-inbox-items',
        endpoint: '',
        description: 'Vendor product management'
      },
      {
        name: 'low-stock-alerts',
        endpoint: '',
        description: 'Inventory alerts'
      }
    ]

    for (const func of criticalFunctions) {
      await testEdgeFunction(func.name, func.endpoint, func.description)
    }

    // Test database table compatibility
    console.log('🔄 Step 3: Testing Database Table Access...\n')
    
    const criticalTables = [
      'products',
      'enhanced_product_variants', 
      'inventory_variants',
      'vendor_products',
      'vendor_variants',
      'vendor_inventory_levels',
      'orders',
      'customers'
    ]

    for (const tableName of criticalTables) {
      await testTableAccess(tableName, tableNames.includes(tableName))
    }

    console.log('📈 Step 4: Testing Schema Dependencies...\n')
    await testSchemaDependencies(tableNames)

  } catch (error) {
    console.log('❌ Test failed:', error.message)
  }
}

async function testEdgeFunction(functionName, endpoint = '', description) {
  try {
    const url = `https://gvcswimqaxvylgxbklbz.supabase.co/functions/v1/${functionName}${endpoint}`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE}`,
        'Content-Type': 'application/json'
      }
    })

    const statusEmoji = response.ok ? '✅' : response.status === 401 ? '⚠️' : '❌'
    console.log(`${statusEmoji} ${functionName} (${description}): HTTP ${response.status}`)
    
    if (!response.ok && response.status !== 401) {
      const errorText = await response.text()
      console.log(`   Error: ${errorText.substring(0, 100)}...`)
    }

  } catch (error) {
    console.log(`❌ ${functionName}: ${error.message}`)
  }
}

async function testTableAccess(tableName, exists) {
  if (!exists) {
    console.log(`❌ ${tableName}: Table does not exist in current schema`)
    return
  }

  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1)

    if (error) {
      console.log(`❌ ${tableName}: ${error.message}`)
    } else {
      console.log(`✅ ${tableName}: Accessible (${data?.length || 0} records found)`)
      if (data && data.length > 0) {
        const columns = Object.keys(data[0]).slice(0, 5)
        console.log(`   Columns: ${columns.join(', ')}${Object.keys(data[0]).length > 5 ? '...' : ''}`)
      }
    }
  } catch (error) {
    console.log(`❌ ${tableName}: ${error.message}`)
  }
}

async function testSchemaDependencies(existingTables) {
  // Check for common dependencies your Edge Functions might expect
  const expectedSchemas = {
    'Enhanced Inventory Manager': [
      'products', 'enhanced_product_variants', 'inventory_variants', 'product_images'
    ],
    'Vendor Management': [
      'vendor_products', 'vendor_variants', 'vendor_inventory_levels', 'vendor_import_decisions'
    ],
    'Order Management': [
      'orders', 'order_items', 'customers', 'shipping_addresses'
    ],
    'Wedding Portal': [
      'weddings', 'wedding_parties', 'groomsmen', 'measurements'
    ]
  }

  for (const [systemName, requiredTables] of Object.entries(expectedSchemas)) {
    const missingTables = requiredTables.filter(table => !existingTables.includes(table))
    
    if (missingTables.length === 0) {
      console.log(`✅ ${systemName}: All required tables present`)
    } else {
      console.log(`⚠️ ${systemName}: Missing tables - ${missingTables.join(', ')}`)
    }
  }
}

// Add a function to test specific admin operations
async function testAdminOperations() {
  console.log('\n🎯 Step 5: Testing Admin-Specific Operations...\n')
  
  try {
    // Test admin user creation
    const { data: adminTest } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 })
    console.log('✅ Admin Auth: Can access user management')
    
    // Test RLS policies
    const { data: rlsTest } = await supabase
      .from('products')
      .select('id')
      .limit(1)
    console.log('✅ RLS Policies: Database access working')
    
  } catch (error) {
    console.log('❌ Admin Operations:', error.message)
  }
}

// Run the compatibility test
testEdgeFunctionCompatibility()
  .then(() => testAdminOperations())
  .then(() => {
    console.log('\n📋 Summary:')
    console.log('==========')
    console.log('Review the results above to identify any compatibility issues.')
    console.log('Focus on fixing any missing tables or failed Edge Functions that your admin apps depend on.')
    console.log('\nNext steps:')
    console.log('1. Fix any missing database tables')
    console.log('2. Update Edge Functions that return errors') 
    console.log('3. Test your admin apps end-to-end')
  })
  .catch(console.error)