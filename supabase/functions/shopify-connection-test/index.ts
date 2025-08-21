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
        const shopifyDomain = Deno.env.get('SHOPIFY_STORE_DOMAIN');
        const shopifyToken = Deno.env.get('SHOPIFY_ADMIN_TOKEN');
        
        console.log('Testing Shopify connection...');
        console.log('Domain:', shopifyDomain);
        console.log('Token exists:', !!shopifyToken);

        if (!shopifyDomain || !shopifyToken) {
            throw new Error(`Missing Shopify credentials: domain=${!!shopifyDomain}, token=${!!shopifyToken}`);
        }

        // Test basic Shopify API connection with a simple query
        const query = `
            query {
                products(first: 5) {
                    edges {
                        node {
                            id
                            title
                            handle
                            status
                        }
                    }
                }
            }
        `;

        const response = await fetch(`https://${shopifyDomain}/admin/api/2024-01/graphql.json`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': shopifyToken
            },
            body: JSON.stringify({ query })
        });

        console.log('Shopify API Response Status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Shopify API Error:', errorText);
            throw new Error(`Shopify API error: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('Shopify API Response:', JSON.stringify(result, null, 2));

        if (result.errors) {
            console.error('GraphQL Errors:', result.errors);
            throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
        }

        const products = result.data?.products?.edges || [];
        
        return new Response(JSON.stringify({
            success: true,
            message: 'Shopify connection test successful',
            data: {
                shopify_domain: shopifyDomain,
                products_found: products.length,
                sample_products: products.map(edge => ({
                    id: edge.node.id,
                    title: edge.node.title,
                    handle: edge.node.handle,
                    status: edge.node.status
                }))
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Shopify connection test failed:', error);
        
        const errorResponse = {
            success: false,
            error: {
                code: 'SHOPIFY_CONNECTION_TEST_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});