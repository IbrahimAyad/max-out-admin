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
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'get';
    const requestData = req.method !== 'GET' ? await req.json() : null;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    // Get user from JWT token
    const token = authHeader.replace('Bearer ', '');
    const userResponse = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/auth/v1/user`,
      {
        headers: {
          'apikey': Deno.env.get('SUPABASE_ANON_KEY')!,
          'Authorization': authHeader
        }
      }
    );

    if (!userResponse.ok) {
      throw new Error('Invalid authentication');
    }

    const user = await userResponse.json();
    const userId = user.id;

    switch (action) {
      case 'get': {
        // Get user profile
        const profileResponse = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/rest/v1/user_profiles?user_id=eq.${userId}&select=*`,
          {
            headers: {
              'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!profileResponse.ok) {
          throw new Error('Failed to fetch profile');
        }

        const profiles = await profileResponse.json();
        const profile = profiles[0] || null;

        return new Response(JSON.stringify({ success: true, data: profile }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'update': {
        const { profile_data } = requestData;
        
        // Update user profile
        const updateResponse = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/rest/v1/user_profiles?user_id=eq.${userId}`,
          {
            method: 'PATCH',
            headers: {
              'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            },
            body: JSON.stringify({
              ...profile_data,
              updated_at: new Date().toISOString()
            })
          }
        );

        if (!updateResponse.ok) {
          const errorText = await updateResponse.text();
          throw new Error(`Failed to update profile: ${errorText}`);
        }

        const updatedProfile = await updateResponse.json();

        return new Response(JSON.stringify({ 
          success: true, 
          data: updatedProfile[0],
          message: 'Profile updated successfully'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'create_measurements': {
        const { measurements } = requestData;
        
        // First get user profile ID
        const profileResponse = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/rest/v1/user_profiles?user_id=eq.${userId}&select=id`,
          {
            headers: {
              'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!profileResponse.ok) {
          throw new Error('Failed to find user profile');
        }

        const profiles = await profileResponse.json();
        if (!profiles[0]) {
          throw new Error('User profile not found');
        }

        const userProfileId = profiles[0].id;

        // Deactivate existing measurements
        await fetch(
          `${Deno.env.get('SUPABASE_URL')}/rest/v1/menswear_measurements?user_profile_id=eq.${userProfileId}`,
          {
            method: 'PATCH',
            headers: {
              'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ is_active: false })
          }
        );

        // Create new measurement record
        const measurementData = {
          user_profile_id: userProfileId,
          ...measurements,
          last_measured: new Date().toISOString().split('T')[0],
          is_active: true
        };

        const insertResponse = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/rest/v1/menswear_measurements`,
          {
            method: 'POST',
            headers: {
              'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            },
            body: JSON.stringify(measurementData)
          }
        );

        if (!insertResponse.ok) {
          const errorText = await insertResponse.text();
          throw new Error(`Failed to create measurements: ${errorText}`);
        }

        const newMeasurement = await insertResponse.json();

        return new Response(JSON.stringify({ 
          success: true, 
          data: newMeasurement[0],
          message: 'Measurements saved successfully'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'get_measurements': {
        // Get user profile ID
        const profileResponse = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/rest/v1/user_profiles?user_id=eq.${userId}&select=id`,
          {
            headers: {
              'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!profileResponse.ok) {
          throw new Error('Failed to find user profile');
        }

        const profiles = await profileResponse.json();
        if (!profiles[0]) {
          return new Response(JSON.stringify({ success: true, data: null }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const userProfileId = profiles[0].id;

        // Get active measurements
        const measurementsResponse = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/rest/v1/menswear_measurements?user_profile_id=eq.${userProfileId}&is_active=eq.true&order=created_at.desc`,
          {
            headers: {
              'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!measurementsResponse.ok) {
          throw new Error('Failed to fetch measurements');
        }

        const measurements = await measurementsResponse.json();

        return new Response(JSON.stringify({ 
          success: true, 
          data: measurements[0] || null 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    console.error('Profile management error:', error);
    const errorResponse = {
      success: false,
      error: {
        code: 'PROFILE_ERROR',
        message: error.message
      }
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});