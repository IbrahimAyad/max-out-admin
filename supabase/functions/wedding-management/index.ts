const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'false'
};

interface DatabaseResponse {
  success: boolean
  data?: any
  error?: string
  count?: number
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with proper environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    // Parse request body
    let requestData;
    try {
      requestData = await req.json();
    } catch (parseError) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid JSON in request body' 
        }), 
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { action, params = {} } = requestData;

    if (!action) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Action parameter is required' 
        }), 
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    let result: DatabaseResponse;

    // Create a simple fetch-based client for database operations
    const supabaseClient = {
      url: supabaseUrl,
      key: supabaseKey,
      async select(table: string, columns = '*', conditions = '', orderBy = '', limit = '') {
        let url = `${supabaseUrl}/rest/v1/${table}?select=${columns}`;
        if (conditions) url += `&${conditions}`;
        if (orderBy) url += `&order=${orderBy}`;
        if (limit) url += `&limit=${limit}`;
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'apikey': supabaseKey
          }
        });
        
        if (!response.ok) {
          throw new Error(`Database query failed: ${response.status} ${response.statusText}`);
        }
        
        return response.json();
      }
    };

    switch (action) {
      case 'get_all_weddings':
        result = await getAllWeddings(supabaseClient, params);
        break;
      case 'get_wedding_details':
        result = await getWeddingDetails(supabaseClient, params);
        break;
      case 'get_wedding_analytics':
        result = await getWeddingAnalytics(supabaseClient, params);
        break;
      case 'update_wedding_status':
        result = await updateWeddingStatus(supabaseClient, params);
        break;
      case 'get_vendor_assignments':
        result = await getVendorAssignments(supabaseClient, params);
        break;
      case 'update_vendor_assignment':
        result = await updateVendorAssignment(supabaseClient, params);
        break;
      default:
        result = { success: false, error: `Unknown action: ${action}` };
    }

    const statusCode = result.success ? 200 : 400;
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: statusCode
    });
  } catch (error) {
    console.error('Critical error in wedding-management:', error);
    const errorResponse = {
      success: false,
      error: error.message || 'Internal server error',
      timestamp: new Date().toISOString()
    };
    
    return new Response(JSON.stringify(errorResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});

// Get all weddings with basic error handling
async function getAllWeddings(client: any, params: any): Promise<DatabaseResponse> {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      search
    } = params;

    // Build conditions string for URL parameters
    let conditions = [];
    if (status) {
      conditions.push(`status=eq.${status}`);
    }
    
    const conditionsStr = conditions.join('&');
    const offset = (page - 1) * limit;
    const orderBy = 'wedding_date.desc';
    const limitStr = `${limit}`;

    // Simple query without complex joins to avoid RLS issues
    const weddings = await client.select(
      'weddings', 
      'id,wedding_date,status,total_budget,guest_count,created_at',
      conditionsStr,
      orderBy,
      limitStr
    );

    return {
      success: true,
      data: weddings || [],
      count: weddings?.length || 0
    };
  } catch (error) {
    console.error('Error in getAllWeddings:', error);
    return { 
      success: false, 
      error: `Failed to fetch weddings: ${error.message}` 
    };
  }
}

// Get detailed wedding information
async function getWeddingDetails(client: any, params: any): Promise<DatabaseResponse> {
  try {
    const { wedding_id } = params;

    if (!wedding_id) {
      return { success: false, error: 'Wedding ID is required' };
    }

    // Simple query without complex joins
    const weddings = await client.select(
      'weddings',
      '*',
      `id=eq.${wedding_id}`,
      '',
      '1'
    );

    if (!weddings || weddings.length === 0) {
      return { success: false, error: 'Wedding not found' };
    }

    return { success: true, data: weddings[0] };
  } catch (error) {
    console.error('Error in getWeddingDetails:', error);
    return { 
      success: false, 
      error: `Failed to fetch wedding details: ${error.message}` 
    };
  }
}

// Get wedding analytics with simplified queries
async function getWeddingAnalytics(client: any, params: any): Promise<DatabaseResponse> {
  try {
    const { period = '30d' } = params;

    // Calculate date range
    const now = new Date();
    let daysBack = 30;
    
    switch (period) {
      case '7d': daysBack = 7; break;
      case '30d': daysBack = 30; break;
      case '90d': daysBack = 90; break;
      case '1y': daysBack = 365; break;
    }
    
    const dateFrom = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Get all weddings for analytics
    const allWeddings = await client.select(
      'weddings',
      'id,status,total_budget,wedding_date,created_at',
      `created_at=gte.${dateFrom}`,
      'created_at.desc',
      '1000'
    );

    // Process analytics data
    const analytics = {
      totalWeddings: allWeddings?.length || 0,
      weddingsByStatus: {},
      recentWeddings: (allWeddings || []).slice(0, 10),
      totalRevenue: 0,
      averageWeddingBudget: 0
    };

    // Process status counts and revenue
    if (allWeddings) {
      const statusCounts: any = {};
      let totalRevenue = 0;
      let confirmedWeddings = 0;

      allWeddings.forEach((wedding: any) => {
        // Count by status
        statusCounts[wedding.status] = (statusCounts[wedding.status] || 0) + 1;
        
        // Calculate revenue for confirmed/completed weddings
        if (wedding.status === 'confirmed' || wedding.status === 'completed') {
          totalRevenue += wedding.total_budget || 0;
          confirmedWeddings++;
        }
      });

      analytics.weddingsByStatus = statusCounts;
      analytics.totalRevenue = totalRevenue;
      analytics.averageWeddingBudget = confirmedWeddings > 0 ? totalRevenue / confirmedWeddings : 0;
    }

    return { success: true, data: analytics };
  } catch (error) {
    console.error('Error in getWeddingAnalytics:', error);
    return { 
      success: false, 
      error: `Failed to fetch analytics: ${error.message}` 
    };
  }
}

// Update wedding status
async function updateWeddingStatus(client: any, params: any): Promise<DatabaseResponse> {
  try {
    const { wedding_id, status, notes } = params;

    if (!wedding_id || !status) {
      return { success: false, error: 'Wedding ID and status are required' };
    }

    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (notes) {
      updateData.notes = notes;
    }

    const response = await fetch(`${client.url}/rest/v1/weddings?id=eq.${wedding_id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${client.key}`,
        'Content-Type': 'application/json',
        'apikey': client.key,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      throw new Error(`Database update failed: ${response.status} ${response.statusText}`);
    }

    const updatedWedding = await response.json();
    return { success: true, data: updatedWedding[0] || { id: wedding_id, status, updated_at: updateData.updated_at } };
  } catch (error) {
    console.error('Error in updateWeddingStatus:', error);
    return { 
      success: false, 
      error: `Failed to update wedding status: ${error.message}` 
    };
  }
}

// Get vendor assignments
async function getVendorAssignments(client: any, params: any): Promise<DatabaseResponse> {
  try {
    const { wedding_id } = params;

    if (!wedding_id) {
      return { success: false, error: 'Wedding ID is required' };
    }

    const assignments = await client.select(
      'vendor_assignments',
      '*',
      `wedding_id=eq.${wedding_id}`,
      'created_at.desc',
      '100'
    );

    return { success: true, data: assignments || [] };
  } catch (error) {
    console.error('Error in getVendorAssignments:', error);
    return { 
      success: false, 
      error: `Failed to fetch vendor assignments: ${error.message}` 
    };
  }
}

// Update vendor assignment
async function updateVendorAssignment(client: any, params: any): Promise<DatabaseResponse> {
  try {
    const { assignment_id, status, notes, assigned_date } = params;

    if (!assignment_id) {
      return { success: false, error: 'Assignment ID is required' };
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (status) updateData.status = status;
    if (notes) updateData.notes = notes;
    if (assigned_date) updateData.assigned_date = assigned_date;

    const response = await fetch(`${client.url}/rest/v1/vendor_assignments?id=eq.${assignment_id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${client.key}`,
        'Content-Type': 'application/json',
        'apikey': client.key,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      throw new Error(`Database update failed: ${response.status} ${response.statusText}`);
    }

    const updatedAssignment = await response.json();
    return { success: true, data: updatedAssignment[0] || { id: assignment_id, ...updateData } };
  } catch (error) {
    console.error('Error in updateVendorAssignment:', error);
    return { 
      success: false, 
      error: `Failed to update vendor assignment: ${error.message}` 
    };
  }
}