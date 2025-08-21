import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'false'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    // Get environment variables
    const SHOPIFY_STORE_DOMAIN = Deno.env.get('SHOPIFY_STORE_DOMAIN');
    const SHOPIFY_ADMIN_TOKEN = Deno.env.get('SHOPIFY_ADMIN_TOKEN');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!SHOPIFY_STORE_DOMAIN || !SHOPIFY_ADMIN_TOKEN) {
      return new Response(JSON.stringify({ 
        error: 'Missing Shopify credentials',
        message: 'SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_TOKEN must be set'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log('Starting Shopify catalog sync...');
    let totalProducts = 0;
    let totalVariants = 0;
    let totalImages = 0;
    let hasNextPage = true;
    let cursor = null;
    const batchSize = 100;

    // GraphQL query for products with variants and images
    const PRODUCTS_QUERY = `
      query getProducts($first: Int!, $after: String) {
        products(first: $first, after: $after) {
          edges {
            node {
              id
              handle
              title
              bodyHtml
              vendor
              productType
              status
              tags
              createdAt
              updatedAt
              variants(first: 100) {
                edges {
                  node {
                    id
                    sku
                    barcode
                    price
                    compareAtPrice
                    position
                    inventoryItem {
                      id
                    }
                    selectedOptions {
                      name
                      value
                    }
                  }
                }
              }
              images(first: 50) {
                edges {
                  node {
                    id
                    src
                    altText
                    width
                    height
                  }
                }
              }
            }
            cursor
          }
          pageInfo {
            hasNextPage
          }
        }
      }
    `;

    // Function to extract Shopify ID from GraphQL global ID
    const extractShopifyId = (globalId: string): bigint => {
      const parts = globalId.split('/');
      return BigInt(parts[parts.length - 1]);
    };

    // Function to make GraphQL request to Shopify
    const shopifyGraphQL = async (query: string, variables: any) => {
      const response = await fetch(`https://${SHOPIFY_STORE_DOMAIN}/admin/api/2023-10/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': SHOPIFY_ADMIN_TOKEN,
        },
        body: JSON.stringify({ query, variables })
      });

      if (!response.ok) {
        throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }

      return result.data;
    };

    // Sync products in batches
    while (hasNextPage) {
      console.log(`Fetching batch of ${batchSize} products...`);
      
      const variables: any = { first: batchSize };
      if (cursor) {
        variables.after = cursor;
      }

      const data = await shopifyGraphQL(PRODUCTS_QUERY, variables);
      const products = data.products.edges;
      
      if (products.length === 0) {
        break;
      }

      // Prepare batch data for upsert
      const productsData = [];
      const variantsData = [];
      const imagesData = [];

      for (const edge of products) {
        const product = edge.node;
        const shopifyProductId = extractShopifyId(product.id);

        // Product data
        productsData.push({
          shopify_product_id: shopifyProductId,
          handle: product.handle,
          title: product.title,
          body_html: product.bodyHtml,
          vendor: product.vendor,
          product_type: product.productType,
          status: product.status.toLowerCase(),
          tags: product.tags,
          created_at: product.createdAt,
          updated_at: product.updatedAt
        });

        // Variants data
        for (const variantEdge of product.variants.edges) {
          const variant = variantEdge.node;
          const shopifyVariantId = extractShopifyId(variant.id);
          const inventoryItemId = variant.inventoryItem ? extractShopifyId(variant.inventoryItem.id) : null;

          // Map selected options to option1, option2, option3
          const options = { option1: null, option2: null, option3: null };
          variant.selectedOptions.forEach((option: any, index: number) => {
            if (index < 3) {
              options[`option${index + 1}` as keyof typeof options] = option.value;
            }
          });

          variantsData.push({
            shopify_variant_id: shopifyVariantId,
            shopify_product_id: shopifyProductId,
            sku: variant.sku,
            barcode: variant.barcode,
            price: parseFloat(variant.price) || 0,
            compare_at_price: variant.compareAtPrice ? parseFloat(variant.compareAtPrice) : null,
            position: variant.position,
            inventory_item_id: inventoryItemId,
            option1: options.option1,
            option2: options.option2,
            option3: options.option3
          });
        }

        // Images data
        product.images.edges.forEach((imageEdge: any, index: number) => {
          const image = imageEdge.node;
          const shopifyImageId = extractShopifyId(image.id);

          imagesData.push({
            shopify_image_id: shopifyImageId,
            shopify_product_id: shopifyProductId,
            src: image.src,
            alt: image.altText,
            position: index + 1,
            width: image.width,
            height: image.height
          });
        });
      }

      // Upsert to Supabase
      if (productsData.length > 0) {
        const { error: productsError } = await supabase
          .from('shopify_products')
          .upsert(productsData, { onConflict: 'shopify_product_id' });
        
        if (productsError) {
          console.error('Error upserting products:', productsError);
          throw productsError;
        }
        totalProducts += productsData.length;
      }

      if (variantsData.length > 0) {
        const { error: variantsError } = await supabase
          .from('shopify_variants')
          .upsert(variantsData, { onConflict: 'shopify_variant_id' });
        
        if (variantsError) {
          console.error('Error upserting variants:', variantsError);
          throw variantsError;
        }
        totalVariants += variantsData.length;
      }

      if (imagesData.length > 0) {
        const { error: imagesError } = await supabase
          .from('shopify_images')
          .upsert(imagesData, { onConflict: 'shopify_image_id' });
        
        if (imagesError) {
          console.error('Error upserting images:', imagesError);
          throw imagesError;
        }
        totalImages += imagesData.length;
      }

      // Update pagination
      hasNextPage = data.products.pageInfo.hasNextPage;
      cursor = products[products.length - 1]?.cursor;
      
      console.log(`Synced ${productsData.length} products in this batch`);
    }

    console.log(`Catalog sync complete: ${totalProducts} products, ${totalVariants} variants, ${totalImages} images`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Catalog sync completed successfully',
      stats: {
        products: totalProducts,
        variants: totalVariants,
        images: totalImages
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in vendor-shopify-sync:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
