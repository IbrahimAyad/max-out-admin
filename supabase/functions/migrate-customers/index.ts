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
    const { limit = 100, offset = 0, skip_existing = false } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Get customers to migrate
    const customersResponse = await fetch(
      `${supabaseUrl}/rest/v1/customers?select=*&limit=${limit}&offset=${offset}`,
      {
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!customersResponse.ok) {
      throw new Error(`Failed to fetch customers: ${customersResponse.statusText}`);
    }

    const customers = await customersResponse.json();
    
    if (!customers || customers.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No customers to migrate',
        migrated_count: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Transform customer data to user_profiles format
    const userProfiles = customers.map((customer: any) => {
      const sizeProfile = {
        // Enhanced comprehensive size profile
        suit_size: customer.size_preferences?.suit_size || null,
        chest: customer.size_preferences?.chest || null,
        waist: customer.size_preferences?.waist || null,
        inseam: customer.size_preferences?.inseam || null,
        sleeve: customer.size_preferences?.sleeve || null,
        neck: customer.size_preferences?.neck || null,
        shoulder_width: customer.size_preferences?.shoulder_width || null,
        jacket_length: customer.size_preferences?.jacket_length || null,
        trouser_rise: customer.size_preferences?.trouser_rise || null,
        height: customer.size_preferences?.height || null,
        weight: customer.size_preferences?.weight || null,
        shoe_size: customer.size_preferences?.shoe_size || null,
        preferred_fit: customer.size_preferences?.preferred_fit || 'regular',
        measurement_unit: 'imperial',
        notes: customer.size_preferences?.notes || '',
        last_measured: customer.size_preferences?.last_measured || null,
        measured_by: customer.size_preferences?.measured_by || 'self',
        measurement_history: customer.size_preferences?.measurement_history || []
      };

      const notificationPreferences = {
        sms_orders: customer.communication_preferences?.sms || false,
        email_orders: customer.communication_preferences?.email || true,
        sms_marketing: customer.accepts_sms_marketing || false,
        email_marketing: customer.accepts_email_marketing || customer.communication_preferences?.marketing || true,
        email_recommendations: customer.communication_preferences?.marketing || true
      };

      return {
        id: crypto.randomUUID(), // Generate new UUID for migrated profiles
        user_id: null, // No auth user ID for migrated customers
        email: customer.email,
        display_name: customer.name || `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || null,
        first_name: customer.first_name,
        last_name: customer.last_name,
        phone: customer.phone,
        date_of_birth: customer.date_of_birth,
        gender: customer.gender,
        address_line_1: customer.address_line_1,
        address_line_2: customer.address_line_2,
        city: customer.city,
        state: customer.state,
        postal_code: customer.postal_code,
        country: customer.country || 'US',
        total_orders: customer.total_orders || 0,
        total_spent: parseFloat(customer.total_spent) || 0.00,
        average_order_value: customer.average_order_value || 0.00,
        lifetime_value: customer.lifetime_value || 0.00,
        preferred_categories: customer.preferred_categories,
        customer_segment: customer.customer_segment || 'regular',
        account_status: customer.account_status || 'active',
        acquisition_source: customer.acquisition_source,
        notes: customer.notes,
        last_order_date: customer.last_order_date,
        customer_tier: customer.customer_tier || 'Bronze',
        engagement_score: customer.engagement_score || 0,
        repeat_customer: customer.repeat_customer || false,
        vip_status: customer.vip_status || false,
        primary_occasion: customer.primary_occasion,
        first_purchase_date: customer.first_purchase_date,
        last_purchase_date: customer.last_purchase_date,
        days_since_last_purchase: customer.days_since_last_purchase,
        tags: customer.tags,
        shipping_address: customer.shipping_address,
        migrated_from_customers_id: customer.id,
        full_name: customer.name || `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || null,
        size_profile: sizeProfile,
        notification_preferences: notificationPreferences,
        saved_addresses: customer.shipping_address ? [customer.shipping_address] : [],
        saved_payment_methods: [],
        wishlist_items: [],
        style_preferences: {},
        measurements: {},
        onboarding_completed: false,
        email_verified: false,
        is_wedding_customer: false,
        created_at: customer.created_at,
        updated_at: new Date().toISOString()
      };
    });

    // If skip_existing is true, check for already migrated customers
    if (skip_existing) {
      const existingIds = customers.map((c: any) => c.id);
      const existingResponse = await fetch(
        `${supabaseUrl}/rest/v1/user_profiles?select=migrated_from_customers_id&migrated_from_customers_id=in.(${existingIds.join(',')})`,
        {
          headers: {
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (existingResponse.ok) {
        const existingProfiles = await existingResponse.json();
        const existingCustomerIds = existingProfiles.map((p: any) => p.migrated_from_customers_id);
        
        // Filter out already migrated customers
        const newProfiles = userProfiles.filter(p => !existingCustomerIds.includes(p.migrated_from_customers_id));
        
        if (newProfiles.length === 0) {
          return new Response(JSON.stringify({
            success: true,
            message: 'All customers in this batch already migrated',
            migrated_count: 0,
            offset: offset + limit
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        // Insert only new profiles
        userProfiles.length = 0;
        userProfiles.push(...newProfiles);
      }
    }

    // Insert into user_profiles table using individual inserts to handle duplicates
    let successCount = 0;
    const errors = [];

    for (const profile of userProfiles) {
      const insertResponse = await fetch(
        `${supabaseUrl}/rest/v1/user_profiles`,
        {
          method: 'POST',
          headers: {
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(profile)
        }
      );

      if (insertResponse.ok) {
        successCount++;
      } else {
        const errorText = await insertResponse.text();
        errors.push({ email: profile.email, error: errorText });
      }
    }

    // Return success response
    return new Response(JSON.stringify({ 
      success: true, 
      message: `Successfully migrated ${successCount} customers out of ${userProfiles.length}`,
      migrated_count: successCount,
      errors: errors.length > 0 ? errors : undefined,
      offset: offset + limit
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Migration error:', error);
    const errorResponse = {
      success: false,
      error: {
        code: 'MIGRATION_ERROR',
        message: error.message
      }
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});