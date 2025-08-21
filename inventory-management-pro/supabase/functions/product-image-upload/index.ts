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
        const { imageData, fileName, productId, imageType = 'primary' } = await req.json();

        if (!imageData || !fileName) {
            throw new Error('Image data and filename are required');
        }

        // Get the service role key
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Extract base64 data from data URL
        const base64Data = imageData.split(',')[1];
        const mimeType = imageData.split(';')[0].split(':')[1];

        // Validate image type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(mimeType)) {
            throw new Error('Invalid image type. Only JPEG, PNG, WebP, and GIF are allowed.');
        }

        // Convert base64 to binary
        const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

        // Check file size (10MB limit)
        if (binaryData.length > 10485760) {
            throw new Error('File size too large. Maximum size is 10MB.');
        }

        // Generate unique filename with timestamp
        const timestamp = Date.now();
        const extension = fileName.split('.').pop();
        const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
        const uniqueFileName = `${timestamp}_${cleanFileName}`;
        const fullPath = productId ? `products/${productId}/${uniqueFileName}` : `temp/${uniqueFileName}`;

        // Upload to Supabase Storage
        const uploadResponse = await fetch(`${supabaseUrl}/storage/v1/object/product-images/${fullPath}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'Content-Type': mimeType,
                'x-upsert': 'true'
            },
            body: binaryData
        });

        if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            console.error('Storage upload error:', errorText);
            throw new Error(`Upload failed: ${errorText}`);
        }

        // Get public URL
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/product-images/${fullPath}`;

        // If productId is provided, update the product record
        if (productId && imageType) {
            try {
                if (imageType === 'primary') {
                    // Update primary_image field
                    const updateResponse = await fetch(`${supabaseUrl}/rest/v1/products?id=eq.${productId}`, {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                            'Content-Type': 'application/json',
                            'Prefer': 'return=minimal'
                        },
                        body: JSON.stringify({
                            primary_image: publicUrl,
                            updated_at: new Date().toISOString()
                        })
                    });

                    if (!updateResponse.ok) {
                        console.error('Failed to update primary image in database');
                    }
                } else if (imageType === 'gallery') {
                    // Get current gallery images
                    const getResponse = await fetch(`${supabaseUrl}/rest/v1/products?id=eq.${productId}&select=image_gallery`, {
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey
                        }
                    });

                    if (getResponse.ok) {
                        const products = await getResponse.json();
                        if (products.length > 0) {
                            const currentGallery = products[0].image_gallery || [];
                            const updatedGallery = [...currentGallery, publicUrl];

                            // Update gallery images
                            const updateResponse = await fetch(`${supabaseUrl}/rest/v1/products?id=eq.${productId}`, {
                                method: 'PATCH',
                                headers: {
                                    'Authorization': `Bearer ${serviceRoleKey}`,
                                    'apikey': serviceRoleKey,
                                    'Content-Type': 'application/json',
                                    'Prefer': 'return=minimal'
                                },
                                body: JSON.stringify({
                                    image_gallery: updatedGallery,
                                    gallery_count: updatedGallery.length,
                                    total_images: updatedGallery.length + (products[0].primary_image ? 1 : 0),
                                    updated_at: new Date().toISOString()
                                })
                            });

                            if (!updateResponse.ok) {
                                console.error('Failed to update gallery images in database');
                            }
                        }
                    }
                }
            } catch (dbError) {
                console.error('Database update error:', dbError);
                // Don't fail the entire operation if DB update fails
            }
        }

        return new Response(JSON.stringify({
            data: {
                publicUrl,
                fileName: uniqueFileName,
                fileSize: binaryData.length,
                mimeType,
                uploadPath: fullPath
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Image upload error:', error);

        const errorResponse = {
            error: {
                code: 'IMAGE_UPLOAD_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});