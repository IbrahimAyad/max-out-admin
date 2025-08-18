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
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'No Authorization header' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Debug token structure
    const parts = token.split('.');
    
    let payload = null;
    let decodedPayload = null;
    
    try {
      if (parts.length === 3) {
        decodedPayload = atob(parts[1]);
        payload = JSON.parse(decodedPayload);
      }
    } catch (e) {
      // Ignore decode errors for debugging
    }
    
    return new Response(JSON.stringify({ 
      success: true,
      debug: {
        hasAuthHeader: !!authHeader,
        tokenLength: token.length,
        tokenParts: parts.length,
        payloadKeys: payload ? Object.keys(payload) : null,
        sub: payload?.sub || null,
        exp: payload?.exp || null,
        iss: payload?.iss || null,
        aud: payload?.aud || null,
        decodedPayload: decodedPayload ? decodedPayload.substring(0, 200) : null
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message,
      stack: error.stack 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});