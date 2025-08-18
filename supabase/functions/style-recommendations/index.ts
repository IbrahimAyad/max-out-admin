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
    const action = url.searchParams.get('action') || 'recommend';
    const requestData = req.method !== 'GET' ? await req.json() : null;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    // Get user from JWT token
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
      case 'create_style_profile': {
        const { style_data } = requestData;
        
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
          throw new Error('User profile not found');
        }

        const userProfileId = profiles[0].id;

        // Check if style profile exists
        const existingStyleResponse = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/rest/v1/style_profiles?user_profile_id=eq.${userProfileId}`,
          {
            headers: {
              'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!}`,
              'Content-Type': 'application/json'
            }
          }
        );

        const existingStyles = await existingStyleResponse.json();
        
        const styleProfileData = {
          user_profile_id: userProfileId,
          ...style_data,
          last_style_update: new Date().toISOString()
        };

        let response;
        if (existingStyles && existingStyles.length > 0) {
          // Update existing
          response = await fetch(
            `${Deno.env.get('SUPABASE_URL')}/rest/v1/style_profiles?user_profile_id=eq.${userProfileId}`,
            {
              method: 'PATCH',
              headers: {
                'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
              },
              body: JSON.stringify(styleProfileData)
            }
          );
        } else {
          // Create new
          response = await fetch(
            `${Deno.env.get('SUPABASE_URL')}/rest/v1/style_profiles`,
            {
              method: 'POST',
              headers: {
                'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
              },
              body: JSON.stringify(styleProfileData)
            }
          );
        }

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to save style profile: ${errorText}`);
        }

        const styleProfile = await response.json();

        return new Response(JSON.stringify({ 
          success: true, 
          data: styleProfile[0] || styleProfile,
          message: 'Style profile saved successfully'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'get_style_profile': {
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

        // Get style profile
        const styleResponse = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/rest/v1/style_profiles?user_profile_id=eq.${userProfileId}`,
          {
            headers: {
              'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!styleResponse.ok) {
          throw new Error('Failed to fetch style profile');
        }

        const styleProfiles = await styleResponse.json();

        return new Response(JSON.stringify({ 
          success: true, 
          data: styleProfiles[0] || null 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'recommend': {
        // Get user profile and measurements for recommendations
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

        const profiles = await profileResponse.json();
        const userProfile = profiles[0];

        if (!userProfile) {
          throw new Error('User profile not found');
        }

        // Get style profile
        const styleResponse = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/rest/v1/style_profiles?user_profile_id=eq.${userProfile.id}`,
          {
            headers: {
              'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!}`,
              'Content-Type': 'application/json'
            }
          }
        );

        const styleProfiles = await styleResponse.json();
        const styleProfile = styleProfiles[0];

        // Get active measurements
        const measurementsResponse = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/rest/v1/menswear_measurements?user_profile_id=eq.${userProfile.id}&is_active=eq.true&order=created_at.desc`,
          {
            headers: {
              'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!}`,
              'Content-Type': 'application/json'
            }
          }
        );

        const measurements = await measurementsResponse.json();
        const activeMeasurement = measurements[0];

        // Generate recommendations based on profile data
        const recommendations = generateRecommendations(userProfile, styleProfile, activeMeasurement);

        return new Response(JSON.stringify({ 
          success: true, 
          data: recommendations
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    console.error('Style recommendations error:', error);
    const errorResponse = {
      success: false,
      error: {
        code: 'STYLE_ERROR',
        message: error.message
      }
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function generateRecommendations(userProfile: any, styleProfile: any, measurements: any) {
  const recommendations = {
    suits: [],
    shirts: [],
    accessories: [],
    seasonal: [],
    fit_advice: []
  };

  // Generate suit recommendations based on measurements and style preferences
  if (measurements) {
    const { suit_size, preferred_fit, chest, waist, height } = measurements;
    
    if (suit_size) {
      recommendations.suits.push({
        title: `${preferred_fit || 'Regular'} Fit Business Suit`,
        size: suit_size,
        description: `Perfect for your ${preferred_fit || 'regular'} fit preference`,
        confidence: 0.9
      });
    }

    if (chest && waist) {
      const ratio = chest / waist;
      if (ratio > 1.4) {
        recommendations.fit_advice.push('Consider structured shoulders for balanced proportions');
      } else if (ratio < 1.2) {
        recommendations.fit_advice.push('Opt for fitted cuts to enhance your natural build');
      }
    }
  }

  // Generate recommendations based on style preferences
  if (styleProfile) {
    const { color_preferences, style_personality, occasion_preferences } = styleProfile;
    
    if (color_preferences && color_preferences.length > 0) {
      recommendations.shirts.push({
        title: `${color_preferences[0]} Dress Shirt`,
        description: `Matches your preferred color palette`,
        confidence: 0.8
      });
    }

    if (style_personality === 'classic') {
      recommendations.accessories.push({
        title: 'Classic Leather Belt',
        description: 'Timeless accessory for your classic style',
        confidence: 0.85
      });
    }
  }

  // Add seasonal recommendations
  const currentMonth = new Date().getMonth();
  if (currentMonth >= 2 && currentMonth <= 4) { // Spring
    recommendations.seasonal.push({
      title: 'Spring Lightweight Blazer',
      description: 'Perfect for spring weather',
      season: 'spring'
    });
  } else if (currentMonth >= 5 && currentMonth <= 7) { // Summer
    recommendations.seasonal.push({
      title: 'Breathable Linen Suit',
      description: 'Stay cool in summer heat',
      season: 'summer'
    });
  } else if (currentMonth >= 8 && currentMonth <= 10) { // Fall
    recommendations.seasonal.push({
      title: 'Wool Business Suit',
      description: 'Perfect weight for fall weather',
      season: 'fall'
    });
  } else { // Winter
    recommendations.seasonal.push({
      title: 'Heavy Wool Overcoat',
      description: 'Stay warm in winter weather',
      season: 'winter'
    });
  }

  return recommendations;
}