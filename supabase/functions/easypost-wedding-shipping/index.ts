const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'false'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { action, wedding_id, shipping_data, tracking_number, address_data } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const easyPostApiKey = Deno.env.get('EASYPOST_API_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }
    
    if (!easyPostApiKey) {
      throw new Error('EasyPost API key not configured');
    }

    const headers = {
      'Authorization': `Bearer ${supabaseKey}`,
      'apikey': supabaseKey,
      'Content-Type': 'application/json'
    };

    switch (action) {
      case 'create_wedding_shipment': {
        const shipment = await createWeddingShipment({
          wedding_id,
          shipping_data
        }, easyPostApiKey, supabaseUrl, headers);
        
        return new Response(JSON.stringify({ data: shipment }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'get_shipping_rates': {
        const rates = await getShippingRates({
          shipping_data
        }, easyPostApiKey);
        
        return new Response(JSON.stringify({ data: rates }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'track_shipment': {
        const tracking = await trackShipment({
          tracking_number
        }, easyPostApiKey, supabaseUrl, headers);
        
        return new Response(JSON.stringify({ data: tracking }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'validate_address': {
        const validation = await validateAddress({
          address_data
        }, easyPostApiKey);
        
        return new Response(JSON.stringify({ data: validation }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'schedule_wedding_delivery': {
        const delivery = await scheduleWeddingDelivery({
          wedding_id,
          shipping_data
        }, easyPostApiKey, supabaseUrl, headers);
        
        return new Response(JSON.stringify({ data: delivery }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'get_wedding_shipments': {
        const shipments = await getWeddingShipments({
          wedding_id
        }, supabaseUrl, headers);
        
        return new Response(JSON.stringify({ data: shipments }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    console.error('EasyPost wedding shipping error:', error);
    
    return new Response(JSON.stringify({
      error: {
        code: 'SHIPPING_ERROR',
        message: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Create wedding-specific shipment with EasyPost
async function createWeddingShipment(params, easyPostApiKey, supabaseUrl, headers) {
  const { wedding_id, shipping_data } = params;
  
  // Get wedding details for special handling
  const weddingResponse = await fetch(
    `${supabaseUrl}/rest/v1/weddings?id=eq.${wedding_id}`,
    { headers }
  );
  
  const wedding = await weddingResponse.json();
  if (!wedding[0]) {
    throw new Error('Wedding not found');
  }
  
  const weddingDate = new Date(wedding[0].wedding_date);
  const deliveryDate = new Date(weddingDate);
  deliveryDate.setDate(deliveryDate.getDate() - 7); // Deliver 1 week before wedding
  
  // Create EasyPost shipment
  const shipmentData = {
    to_address: {
      name: shipping_data.recipient_name,
      street1: shipping_data.street1,
      street2: shipping_data.street2 || '',
      city: shipping_data.city,
      state: shipping_data.state,
      zip: shipping_data.zip,
      country: shipping_data.country || 'US',
      phone: shipping_data.phone
    },
    from_address: {
      name: 'KCT Menswear',
      street1: '123 Business Ave',
      city: 'Atlanta',
      state: 'GA',
      zip: '30309',
      country: 'US',
      phone: '404-555-0123'
    },
    parcel: {
      length: shipping_data.length || 20,
      width: shipping_data.width || 15,
      height: shipping_data.height || 6,
      weight: shipping_data.weight || 32 // oz
    },
    options: {
      delivery_confirmation: 'SIGNATURE',
      delivery_min_datetime: deliveryDate.toISOString(),
      special_rates_eligibility: 'USPS.PRIORITY',
      handling_instructions: 'FRAGILE - Wedding Attire'
    },
    customs_info: shipping_data.international ? {
      contents_type: 'merchandise',
      contents_explanation: 'Wedding formal wear',
      customs_certify: true,
      customs_signer: 'KCT Menswear',
      non_delivery_option: 'return',
      restriction_type: 'none',
      customs_items: [{
        description: 'Formal wedding attire',
        quantity: shipping_data.items_count || 1,
        weight: shipping_data.weight || 32,
        value: shipping_data.declared_value || 500,
        hs_tariff_number: '6203.19.90',
        origin_country: 'US'
      }]
    } : undefined
  };
  
  const easyPostResponse = await fetch('https://api.easypost.com/v2/shipments', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${easyPostApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ shipment: shipmentData })
  });
  
  if (!easyPostResponse.ok) {
    const errorText = await easyPostResponse.text();
    throw new Error(`EasyPost shipment creation failed: ${errorText}`);
  }
  
  const shipment = await easyPostResponse.json();
  
  // Save shipment to database
  const shipmentRecord = {
    wedding_id,
    easypost_shipment_id: shipment.id,
    tracking_code: shipment.tracking_code,
    shipping_label_url: shipment.postage_label?.label_url,
    estimated_delivery_date: deliveryDate.toISOString(),
    status: 'created',
    shipping_cost: shipment.selected_rate?.rate,
    carrier: shipment.selected_rate?.carrier,
    service: shipment.selected_rate?.service,
    recipient_address: JSON.stringify(shipment.to_address),
    special_instructions: 'Wedding delivery - handle with care',
    created_at: new Date().toISOString()
  };
  
  await fetch(`${supabaseUrl}/rest/v1/wedding_shipments`, {
    method: 'POST',
    headers,
    body: JSON.stringify(shipmentRecord)
  });
  
  return {
    shipment_id: shipment.id,
    tracking_code: shipment.tracking_code,
    label_url: shipment.postage_label?.label_url,
    estimated_delivery: deliveryDate.toISOString(),
    rates: shipment.rates
  };
}

// Get shipping rates for wedding items
async function getShippingRates(params, easyPostApiKey) {
  const { shipping_data } = params;
  
  const shipmentData = {
    to_address: {
      street1: shipping_data.street1,
      city: shipping_data.city,
      state: shipping_data.state,
      zip: shipping_data.zip,
      country: shipping_data.country || 'US'
    },
    from_address: {
      street1: '123 Business Ave',
      city: 'Atlanta',
      state: 'GA',
      zip: '30309',
      country: 'US'
    },
    parcel: {
      length: shipping_data.length || 20,
      width: shipping_data.width || 15,
      height: shipping_data.height || 6,
      weight: shipping_data.weight || 32
    }
  };
  
  const response = await fetch('https://api.easypost.com/v2/shipments', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${easyPostApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ shipment: shipmentData })
  });
  
  if (!response.ok) {
    throw new Error('Failed to get shipping rates');
  }
  
  const shipment = await response.json();
  
  // Filter and format rates for wedding delivery
  const weddingRates = shipment.rates
    .filter(rate => rate.delivery_days <= 5) // Only fast delivery for weddings
    .map(rate => ({
      id: rate.id,
      carrier: rate.carrier,
      service: rate.service,
      rate: parseFloat(rate.rate),
      delivery_days: rate.delivery_days,
      delivery_date: rate.delivery_date,
      delivery_date_guaranteed: rate.delivery_date_guaranteed,
      recommended: rate.service.includes('PRIORITY') || rate.service.includes('EXPRESS')
    }))
    .sort((a, b) => a.delivery_days - b.delivery_days);
  
  return weddingRates;
}

// Track wedding shipment
async function trackShipment(params, easyPostApiKey, supabaseUrl, headers) {
  const { tracking_number } = params;
  
  const response = await fetch(`https://api.easypost.com/v2/trackers/${tracking_number}`, {
    headers: {
      'Authorization': `Bearer ${easyPostApiKey}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to track shipment');
  }
  
  const tracker = await response.json();
  
  // Update database with latest tracking info
  await fetch(`${supabaseUrl}/rest/v1/wedding_shipments?tracking_code=eq.${tracking_number}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      status: tracker.status,
      tracking_details: JSON.stringify(tracker.tracking_details),
      updated_at: new Date().toISOString()
    })
  });
  
  return {
    tracking_code: tracker.tracking_code,
    status: tracker.status,
    tracking_details: tracker.tracking_details,
    estimated_delivery_date: tracker.est_delivery_date,
    public_url: tracker.public_url
  };
}

// Validate wedding delivery address
async function validateAddress(params, easyPostApiKey) {
  const { address_data } = params;
  
  const response = await fetch('https://api.easypost.com/v2/addresses', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${easyPostApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      address: {
        street1: address_data.street1,
        street2: address_data.street2 || '',
        city: address_data.city,
        state: address_data.state,
        zip: address_data.zip,
        country: address_data.country || 'US'
      },
      verify: ['delivery']
    })
  });
  
  const address = await response.json();
  
  return {
    valid: !address.verifications?.delivery?.errors?.length,
    verified_address: address,
    deliverable: address.verifications?.delivery?.success,
    suggestions: address.verifications?.delivery?.details?.delivery_point_validation || []
  };
}

// Schedule coordinated wedding delivery
async function scheduleWeddingDelivery(params, easyPostApiKey, supabaseUrl, headers) {
  const { wedding_id, shipping_data } = params;
  
  // Get all party members for coordinated delivery
  const membersResponse = await fetch(
    `${supabaseUrl}/rest/v1/wedding_party_members?wedding_id=eq.${wedding_id}`,
    { headers }
  );
  
  const partyMembers = await membersResponse.json();
  
  // Group by delivery address for efficiency
  const deliveryGroups = groupByAddress(partyMembers, shipping_data);
  
  const deliverySchedule = [];
  
  for (const group of deliveryGroups) {
    const shipment = await createWeddingShipment({
      wedding_id,
      shipping_data: group.address
    }, easyPostApiKey, supabaseUrl, headers);
    
    deliverySchedule.push({
      group_id: group.id,
      members: group.members,
      shipment_id: shipment.shipment_id,
      tracking_code: shipment.tracking_code,
      estimated_delivery: shipment.estimated_delivery
    });
  }
  
  return {
    total_shipments: deliverySchedule.length,
    delivery_groups: deliverySchedule,
    coordination_complete: true
  };
}

// Get all shipments for a wedding
async function getWeddingShipments(params, supabaseUrl, headers) {
  const { wedding_id } = params;
  
  const response = await fetch(
    `${supabaseUrl}/rest/v1/wedding_shipments?wedding_id=eq.${wedding_id}&order=created_at.desc`,
    { headers }
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch wedding shipments');
  }
  
  const shipments = await response.json();
  
  return shipments.map(shipment => ({
    id: shipment.id,
    tracking_code: shipment.tracking_code,
    status: shipment.status,
    estimated_delivery_date: shipment.estimated_delivery_date,
    shipping_cost: shipment.shipping_cost,
    carrier: shipment.carrier,
    service: shipment.service,
    label_url: shipment.shipping_label_url,
    special_instructions: shipment.special_instructions
  }));
}

// Helper function to group party members by delivery address
function groupByAddress(partyMembers, defaultShipping) {
  const groups = new Map();
  
  partyMembers.forEach((member, index) => {
    const address = member.shipping_address || defaultShipping;
    const addressKey = `${address.street1}-${address.city}-${address.zip}`;
    
    if (!groups.has(addressKey)) {
      groups.set(addressKey, {
        id: `group-${groups.size + 1}`,
        address,
        members: []
      });
    }
    
    groups.get(addressKey).members.push({
      id: member.id,
      name: member.name,
      role: member.role
    });
  });
  
  return Array.from(groups.values());
}