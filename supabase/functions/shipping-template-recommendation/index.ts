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
        const { orderItems, totalWeight } = await req.json();

        // Get Supabase configuration
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error('Supabase configuration missing');
        }

        // Fetch all shipping templates
        const templatesResponse = await fetch(`${supabaseUrl}/rest/v1/shipping_templates?select=*&is_active=eq.true`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });

        if (!templatesResponse.ok) {
            throw new Error('Failed to fetch shipping templates');
        }

        const templates = await templatesResponse.json();

        // Analyze order items to determine product types
        const productTypes = analyzeOrderItems(orderItems);
        
        // Calculate total estimated weight if not provided
        const estimatedWeight = totalWeight || calculateEstimatedWeight(orderItems);

        // Find recommended templates based on product types and weight
        const recommendations = findRecommendedTemplates(templates, productTypes, estimatedWeight, orderItems.length);

        return new Response(JSON.stringify({
            data: {
                recommendations,
                productTypes,
                estimatedWeight,
                totalItems: orderItems.length,
                allTemplates: templates
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Template recommendation error:', error);

        const errorResponse = {
            error: {
                code: 'TEMPLATE_RECOMMENDATION_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// Analyze order items to determine product types
function analyzeOrderItems(orderItems: any[]) {
    const productTypes = new Set<string>();
    
    orderItems.forEach(item => {
        const productName = (item.product_name || '').toLowerCase();
        const productDescription = (item.product_description || '').toLowerCase();
        const combined = `${productName} ${productDescription}`;
        
        // Analyze product types based on name and description
        if (combined.includes('suit')) {
            if (item.quantity > 1 || combined.includes('set')) {
                productTypes.add('suit_sets');
            } else {
                productTypes.add('suits');
            }
        }
        
        if (combined.includes('blazer') || combined.includes('jacket') || combined.includes('coat')) {
            productTypes.add('blazers');
        }
        
        if (combined.includes('bow tie') || combined.includes('bowtie')) {
            productTypes.add('bow_ties');
        }
        
        if (combined.includes('tie') && !combined.includes('bow')) {
            productTypes.add('ties');
        }
        
        if (combined.includes('shoe') || combined.includes('boot') || combined.includes('footwear')) {
            productTypes.add('shoes');
        }
        
        if (combined.includes('vest') || combined.includes('waistcoat')) {
            productTypes.add('vests');
        }
        
        if (combined.includes('suspender')) {
            productTypes.add('suspenders');
        }
        
        if (combined.includes('belt') || combined.includes('accessory')) {
            productTypes.add('accessories');
        }
        
        if (combined.includes('shirt')) {
            productTypes.add('shirts');
        }
    });
    
    // Add generic categories based on item analysis
    if (orderItems.length > 5) {
        productTypes.add('bulk_orders');
    }
    
    if (orderItems.length > 1) {
        productTypes.add('multiple_items');
    }
    
    return Array.from(productTypes);
}

// Calculate estimated weight based on typical product weights
function calculateEstimatedWeight(orderItems: any[]): number {
    let totalWeight = 0;
    
    orderItems.forEach(item => {
        const productName = (item.product_name || '').toLowerCase();
        const quantity = item.quantity || 1;
        
        // Estimated weights in pounds
        let itemWeight = 0.5; // default weight
        
        if (productName.includes('suit')) {
            itemWeight = 2.5; // suits are heavier
        } else if (productName.includes('blazer') || productName.includes('jacket')) {
            itemWeight = 1.5;
        } else if (productName.includes('shoe') || productName.includes('boot')) {
            itemWeight = 1.0;
        } else if (productName.includes('shirt')) {
            itemWeight = 0.5;
        } else if (productName.includes('tie') || productName.includes('bow tie')) {
            itemWeight = 0.1;
        } else if (productName.includes('vest')) {
            itemWeight = 0.3;
        } else if (productName.includes('suspender')) {
            itemWeight = 0.2;
        }
        
        totalWeight += itemWeight * quantity;
    });
    
    return Math.max(totalWeight, 0.1); // minimum 0.1 lbs
}

// Find recommended templates based on analysis
function findRecommendedTemplates(templates: any[], productTypes: string[], weight: number, itemCount: number) {
    const scored = templates.map(template => {
        let score = 0;
        let reasons = [];
        
        // Check if template can handle the weight
        if (weight <= template.max_weight_lbs) {
            score += 10;
        } else {
            score -= 50; // heavily penalize if over weight limit
        }
        
        // Check product type matches
        const templateRecommendations = template.recommended_for || [];
        productTypes.forEach(type => {
            if (templateRecommendations.includes(type)) {
                score += 20;
                reasons.push(`Recommended for ${type}`);
            }
        });
        
        // Special scoring for specific scenarios
        if (itemCount > 10 && template.template_code === 'BIG_BIG_BOX_13_SUITS') {
            score += 15;
            reasons.push('Ideal for bulk orders');
        }
        
        if (itemCount === 1) {
            if (template.template_code.includes('SOFT_PACK') || template.template_code.includes('SMALL')) {
                score += 10;
                reasons.push('Good for single items');
            }
        }
        
        // Prefer appropriately sized boxes (not too big, not too small)
        const volume = template.length_inches * template.width_inches * template.height_inches;
        if (volume > 100 && itemCount < 3) {
            score -= 5; // too big for few items
            reasons.push('May be oversized for this order');
        }
        
        if (volume < 50 && itemCount > 5) {
            score -= 10; // too small for many items
            reasons.push('May be too small for this order');
        }
        
        return {
            ...template,
            score,
            reasons,
            canHandleWeight: weight <= template.max_weight_lbs,
            efficiency: score / Math.max(volume / 100, 1) // score per volume unit
        };
    });
    
    // Sort by score (highest first) and return top recommendations
    return scored
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map(template => ({
            ...template,
            recommendation_level: template.score > 20 ? 'highly_recommended' : 
                                 template.score > 0 ? 'recommended' : 'possible'
        }));
}