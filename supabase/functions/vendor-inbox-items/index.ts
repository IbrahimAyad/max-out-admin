Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        // Get Supabase credentials
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        
        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Missing Supabase environment variables');
        }

        const headers = {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
            'Content-Type': 'application/json'
        };

        // Parse query parameters from both URL and request body
        const url = new URL(req.url);
        
        let page, limit, search, status, decision;
        
        if (req.method === 'POST') {
            // Try to parse JSON body, fallback to URL params
            try {
                const body = await req.text();
                if (body) {
                    const requestData = JSON.parse(body);
                    page = requestData.page || 1;
                    limit = requestData.limit || 20;
                    search = requestData.search || '';
                    status = requestData.status || '';
                    decision = requestData.decision || '';
                } else {
                    throw new Error('Empty body');
                }
            } catch {
                // Fallback to URL params
                page = parseInt(url.searchParams.get('page') || '1');
                limit = parseInt(url.searchParams.get('limit') || '20');
                search = url.searchParams.get('search') || '';
                status = url.searchParams.get('status') || '';
                decision = url.searchParams.get('decision') || '';
            }
        } else {
            // GET request - use URL params
            page = parseInt(url.searchParams.get('page') || '1');
            limit = parseInt(url.searchParams.get('limit') || '20');
            search = url.searchParams.get('search') || '';
            status = url.searchParams.get('status') || '';
            decision = url.searchParams.get('decision') || '';
        }
        
        // Calculate pagination
        const from = (page - 1) * limit;

        // Use PostgreSQL function instead of view to get inbox items
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/get_vendor_inbox_items`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                search_term: search || '',
                status_filter: status || '',
                decision_filter: decision || '',
                page_offset: from,
                page_limit: limit
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Database error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        
        // Get total count with a separate query since RPC doesn't support count
        const countResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/get_vendor_inbox_count`, {
            method: 'POST',
            headers,
            body: JSON.stringify({})
        });
        
        const countData = await countResponse.json();
        const total = countData.length > 0 ? countData[0].inbox_count : 0;

        const result = {
            items: data,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        };

        return new Response(JSON.stringify({
            data: result
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Vendor inbox items error:', error);
        
        const errorResponse = {
            error: {
                code: 'VENDOR_INBOX_ITEMS_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});