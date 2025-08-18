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
        // Get environment variables with fallback
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://gvcswimqaxvylgxbklbz.supabase.co';
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY');
        
        if (!supabaseKey) {
            console.error('No Supabase key available in environment');
            throw new Error('Supabase configuration missing');
        }
        
        console.log('Environment check:', {
            hasUrl: !!supabaseUrl,
            hasKey: !!supabaseKey,
            method: req.method
        });
        
        // Handle different HTTP methods
        if (req.method === 'GET') {
            // Get wedding by code from URL params
            const url = new URL(req.url);
            const weddingCode = url.searchParams.get('code');
            
            console.log('GET request for wedding code:', weddingCode);
            
            if (!weddingCode) {
                return new Response(JSON.stringify({
                    success: false,
                    error: 'Wedding code is required as query parameter: ?code=YOUR_CODE'
                }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
            
            // Fetch wedding data from Supabase
            console.log('Fetching wedding with code:', weddingCode);
            const weddingResponse = await fetch(`${supabaseUrl}/rest/v1/weddings?wedding_code=eq.${weddingCode}&select=*`, {
                headers: {
                    'Authorization': `Bearer ${supabaseKey}`,
                    'apikey': supabaseKey,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('Wedding response status:', weddingResponse.status);
            
            if (!weddingResponse.ok) {
                const errorText = await weddingResponse.text();
                console.error('Failed to fetch wedding data:', errorText);
                throw new Error(`Failed to fetch wedding data: ${weddingResponse.statusText}`);
            }
            
            const weddings = await weddingResponse.json();
            console.log('Found weddings:', weddings.length);
            
            if (weddings.length === 0) {
                return new Response(JSON.stringify({
                    success: false,
                    error: 'Wedding not found with provided code',
                    code: weddingCode
                }), {
                    status: 404,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
            
            const wedding = weddings[0];
            console.log('Found wedding:', wedding.id);
            
            // Get wedding party members
            const membersResponse = await fetch(`${supabaseUrl}/rest/v1/wedding_party_members?wedding_id=eq.${wedding.id}&select=*`, {
                headers: {
                    'Authorization': `Bearer ${supabaseKey}`,
                    'apikey': supabaseKey,
                    'Content-Type': 'application/json'
                }
            });
            
            let partyMembers = [];
            if (membersResponse.ok) {
                partyMembers = await membersResponse.json();
                console.log('Found party members:', partyMembers.length);
            } else {
                console.warn('Failed to fetch party members:', membersResponse.status);
            }
            
            return new Response(JSON.stringify({
                success: true,
                wedding: wedding,
                party_members: partyMembers
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
            
        } else if (req.method === 'POST') {
            // Create or update wedding data
            const requestData = await req.json();
            const { action, wedding_data, wedding_id } = requestData;
            
            console.log('POST request action:', action);
            
            switch (action) {
                case 'create_wedding':
                    // Generate wedding code
                    const weddingCode = `WED-${generateCode()}`;
                    
                    const newWedding = {
                        wedding_code: weddingCode,
                        venue_name: wedding_data.venue_name,
                        wedding_date: wedding_data.wedding_date,
                        venue_address: wedding_data.venue_address,
                        guest_count: wedding_data.guest_count,
                        budget_range: wedding_data.budget_range,
                        style_inspiration: wedding_data.style_inspiration,
                        special_instructions: wedding_data.special_instructions,
                        status: 'planning'
                    };
                    
                    const createResponse = await fetch(`${supabaseUrl}/rest/v1/weddings`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${supabaseKey}`,
                            'apikey': supabaseKey,
                            'Content-Type': 'application/json',
                            'Prefer': 'return=representation'
                        },
                        body: JSON.stringify(newWedding)
                    });
                    
                    if (!createResponse.ok) {
                        const errorText = await createResponse.text();
                        console.error('Failed to create wedding:', errorText);
                        throw new Error(`Failed to create wedding: ${errorText}`);
                    }
                    
                    const createdWedding = await createResponse.json();
                    
                    return new Response(JSON.stringify({
                        success: true,
                        wedding: createdWedding[0],
                        wedding_code: weddingCode
                    }), {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                    
                case 'update_wedding':
                    if (!wedding_id) {
                        throw new Error('Wedding ID is required for updates');
                    }
                    
                    const updateResponse = await fetch(`${supabaseUrl}/rest/v1/weddings?id=eq.${wedding_id}`, {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Bearer ${supabaseKey}`,
                            'apikey': supabaseKey,
                            'Content-Type': 'application/json',
                            'Prefer': 'return=representation'
                        },
                        body: JSON.stringify(wedding_data)
                    });
                    
                    if (!updateResponse.ok) {
                        const errorText = await updateResponse.text();
                        console.error('Failed to update wedding:', errorText);
                        throw new Error(`Failed to update wedding: ${errorText}`);
                    }
                    
                    const updatedWedding = await updateResponse.json();
                    
                    return new Response(JSON.stringify({
                        success: true,
                        wedding: updatedWedding[0]
                    }), {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                    
                default:
                    throw new Error(`Unknown action: ${action}`);
            }
        } else {
            throw new Error(`Unsupported HTTP method: ${req.method}`);
        }
        
    } catch (error) {
        console.error('Wedding management error:', error);
        
        const errorResponse = {
            error: {
                code: 'WEDDING_MANAGEMENT_ERROR',
                message: error.message,
                details: error.stack
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// Generate random code for wedding
function generateCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}