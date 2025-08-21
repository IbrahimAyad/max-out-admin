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
        // Get environment variables
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        console.log('Testing vendor database insertion...');
        console.log('Supabase URL:', supabaseUrl);
        console.log('Service Role Key exists:', !!serviceRoleKey);

        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error('Missing Supabase environment variables');
        }

        // Test inserting a single product
        console.log('Attempting to insert test product...');
        const productResponse = await fetch(`${supabaseUrl}/rest/v1/vendor_products`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                shopify_product_id: 999999,
                handle: 'test-product',
                title: 'Test Product for Sync Debug',
                vendor: 'Test Vendor',
                product_type: 'Test Category',
                status: 'active'
            })
        });

        console.log('Product insert response status:', productResponse.status);
        const productResponseText = await productResponse.text();
        console.log('Product insert response:', productResponseText);

        if (!productResponse.ok) {
            throw new Error(`Failed to insert product: ${productResponse.status} - ${productResponseText}`);
        }

        // Test inserting a variant
        console.log('Attempting to insert test variant...');
        const variantResponse = await fetch(`${supabaseUrl}/rest/v1/vendor_variants`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                shopify_variant_id: 888888,
                shopify_product_id: 999999,
                sku: 'TEST-SKU-001',
                price: 99.99,
                position: 1,
                inventory_item_id: 777777
            })
        });

        console.log('Variant insert response status:', variantResponse.status);
        const variantResponseText = await variantResponse.text();
        console.log('Variant insert response:', variantResponseText);

        // Test inserting an image
        console.log('Attempting to insert test image...');
        const imageResponse = await fetch(`${supabaseUrl}/rest/v1/vendor_images`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                shopify_image_id: 666666,
                shopify_product_id: 999999,
                src: 'https://example.com/test-image.jpg',
                alt: 'Test Image',
                position: 1
            })
        });

        console.log('Image insert response status:', imageResponse.status);
        const imageResponseText = await imageResponse.text();
        console.log('Image insert response:', imageResponseText);

        // Check vendor inbox count
        console.log('Checking vendor inbox count...');
        const countResponse = await fetch(`${supabaseUrl}/rest/v1/v_vendor_inbox_count?select=inbox_count`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            }
        });

        const countData = await countResponse.json();
        console.log('Vendor inbox count:', countData);

        return new Response(JSON.stringify({
            success: true,
            data: {
                message: 'Database test completed',
                product_insert: {
                    status: productResponse.status,
                    response: productResponseText
                },
                variant_insert: {
                    status: variantResponse.status,
                    response: variantResponseText
                },
                image_insert: {
                    status: imageResponse.status,
                    response: imageResponseText
                },
                vendor_inbox_count: countData
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Database test error:', error);
        
        const errorResponse = {
            success: false,
            error: {
                code: 'DATABASE_TEST_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});