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
        const { action, outfit_data, member_id, outfit_id, filters } = await req.json();
        
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
        
        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        const headers = {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        };

        switch (action) {
            case 'create_outfit_selection': {
                // Get member's measurements for sizing
                const measurementsResponse = await fetch(
                    `${supabaseUrl}/rest/v1/wedding_measurements?party_member_id=eq.${member_id}&is_current=eq.true`,
                    { headers }
                );
                
                let measurements = null;
                if (measurementsResponse.ok) {
                    const measurementData = await measurementsResponse.json();
                    measurements = measurementData[0] || null;
                }

                // AI-powered outfit coordination
                let coordinationAnalysis = null;
                if (openaiApiKey) {
                    coordinationAnalysis = await performOutfitCoordination(
                        outfit_data,
                        measurements,
                        openaiApiKey
                    );
                }

                // Calculate total costs
                const totalRentalCost = calculateRentalCost(outfit_data.rental_items || {});
                const totalPurchaseCost = calculatePurchaseCost(outfit_data.purchase_items || {});
                const alterationsCost = outfit_data.alterations_cost || 0;

                const outfitRecord = {
                    party_member_id: member_id,
                    outfit_template_id: outfit_data.outfit_template_id,
                    jacket_product_id: outfit_data.jacket_product_id,
                    trouser_product_id: outfit_data.trouser_product_id,
                    shirt_product_id: outfit_data.shirt_product_id,
                    vest_product_id: outfit_data.vest_product_id,
                    tie_product_id: outfit_data.tie_product_id,
                    pocket_square_product_id: outfit_data.pocket_square_product_id,
                    cufflinks_product_id: outfit_data.cufflinks_product_id,
                    shoes_product_id: outfit_data.shoes_product_id,
                    accessories: outfit_data.accessories || {},
                    customizations: outfit_data.customizations || {},
                    sizing_details: measurements?.size_recommendations || {},
                    color_coordination: outfit_data.color_coordination || {},
                    style_notes: outfit_data.style_notes,
                    rental_items: outfit_data.rental_items || {},
                    purchase_items: outfit_data.purchase_items || {},
                    total_rental_cost: totalRentalCost,
                    total_purchase_cost: totalPurchaseCost,
                    alterations_cost: alterationsCost,
                    total_outfit_cost: totalRentalCost + totalPurchaseCost + alterationsCost,
                    coordination_score: coordinationAnalysis?.coordination_score || 0.8,
                    style_consistency_score: coordinationAnalysis?.style_consistency_score || 0.8,
                    approved_by_couple: false,
                    approved_by_member: outfit_data.approved_by_member || false,
                    selection_deadline: outfit_data.selection_deadline,
                    fitting_scheduled_date: outfit_data.fitting_scheduled_date
                };

                const response = await fetch(`${supabaseUrl}/rest/v1/wedding_outfits`, {
                    method: 'POST',
                    headers: { ...headers, 'Prefer': 'return=representation' },
                    body: JSON.stringify(outfitRecord)
                });

                if (!response.ok) {
                    throw new Error(`Failed to create outfit selection: ${await response.text()}`);
                }

                const outfit = await response.json();
                
                // Update member outfit status
                await updateMemberOutfitStatus(member_id, 'selected', supabaseUrl, headers);
                
                // Create approval task for couple
                await createOutfitApprovalTask(member_id, outfit[0].id, supabaseUrl, headers);

                return new Response(JSON.stringify({ 
                    data: {
                        outfit: outfit[0],
                        coordination_analysis: coordinationAnalysis,
                        requires_approval: true
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'get_outfit_selections': {
                let query = `party_member_id=eq.${member_id}`;
                
                if (filters?.include_products) {
                    query += '&select=*,jacket:jacket_product_id(*),trouser:trouser_product_id(*),shirt:shirt_product_id(*)';
                }

                const response = await fetch(
                    `${supabaseUrl}/rest/v1/wedding_outfits?${query}`,
                    { headers }
                );

                if (!response.ok) {
                    throw new Error(`Failed to fetch outfit selections: ${await response.text()}`);
                }

                const outfits = await response.json();
                
                return new Response(JSON.stringify({ data: outfits }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'approve_outfit': {
                const approvalData = outfit_data.approval_data;
                const approverType = outfit_data.approver_type; // 'couple' or 'member'
                
                const updateFields = {
                    approval_notes: approvalData.notes,
                    updated_at: new Date().toISOString()
                };
                
                if (approverType === 'couple') {
                    updateFields.approved_by_couple = true;
                } else if (approverType === 'member') {
                    updateFields.approved_by_member = true;
                }

                const response = await fetch(`${supabaseUrl}/rest/v1/wedding_outfits?id=eq.${outfit_id}`, {
                    method: 'PATCH',
                    headers,
                    body: JSON.stringify(updateFields)
                });

                if (!response.ok) {
                    throw new Error(`Failed to approve outfit: ${await response.text()}`);
                }

                // Check if both approvals are complete
                const outfitResponse = await fetch(
                    `${supabaseUrl}/rest/v1/wedding_outfits?id=eq.${outfit_id}`,
                    { headers }
                );
                
                if (outfitResponse.ok) {
                    const outfits = await outfitResponse.json();
                    const outfit = outfits[0];
                    
                    if (outfit.approved_by_couple && outfit.approved_by_member) {
                        // Update member status to confirmed
                        await updateMemberOutfitStatus(outfit.party_member_id, 'confirmed', supabaseUrl, headers);
                        
                        // Create order processing task
                        await createOrderProcessingTask(outfit.party_member_id, outfit.id, supabaseUrl, headers);
                    }
                }

                return new Response(JSON.stringify({ data: { success: true } }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'generate_outfit_recommendations': {
                if (!openaiApiKey) {
                    throw new Error('AI outfit recommendations not available');
                }
                
                // Get member details and wedding theme
                const memberResponse = await fetch(
                    `${supabaseUrl}/rest/v1/wedding_party_members?id=eq.${member_id}&select=*,wedding:weddings(*),measurements:wedding_measurements(*)`,
                    { headers }
                );
                
                if (!memberResponse.ok) {
                    throw new Error('Member not found');
                }
                
                const members = await memberResponse.json();
                const member = members[0];
                
                const recommendations = await generateAIOutfitRecommendations(
                    member,
                    outfit_data.preferences || {},
                    openaiApiKey
                );

                return new Response(JSON.stringify({ 
                    data: {
                        recommendations,
                        member_context: {
                            role: member.role,
                            wedding_theme: member.wedding.wedding_theme,
                            formality_level: member.wedding.formality_level,
                            color_scheme: member.wedding.color_scheme
                        }
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'coordinate_party_outfits': {
                const weddingId = outfit_data.wedding_id;
                
                // Get all party members and their outfits
                const membersResponse = await fetch(
                    `${supabaseUrl}/rest/v1/wedding_party_members?wedding_id=eq.${weddingId}&select=*,outfits:wedding_outfits(*)`,
                    { headers }
                );
                
                if (!membersResponse.ok) {
                    throw new Error('Failed to fetch party members');
                }
                
                const members = await membersResponse.json();
                
                // Get wedding details
                const weddingResponse = await fetch(
                    `${supabaseUrl}/rest/v1/weddings?id=eq.${weddingId}`,
                    { headers }
                );
                
                const weddings = await weddingResponse.json();
                const wedding = weddings[0];
                
                // Perform coordination analysis
                const coordinationAnalysis = await analyzePartyCoordination(
                    members,
                    wedding,
                    openaiApiKey
                );

                return new Response(JSON.stringify({ 
                    data: {
                        coordination_analysis: coordinationAnalysis,
                        party_size: members.length,
                        coordination_score: coordinationAnalysis.overall_score,
                        recommendations: coordinationAnalysis.recommendations
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'calculate_group_pricing': {
                const weddingId = outfit_data.wedding_id;
                
                // Get all confirmed outfits for the wedding
                const outfitsResponse = await fetch(
                    `${supabaseUrl}/rest/v1/wedding_outfits?party_member_id=in.(select id from wedding_party_members where wedding_id=${weddingId})&approved_by_couple=eq.true&approved_by_member=eq.true`,
                    { headers }
                );
                
                if (!outfitsResponse.ok) {
                    throw new Error('Failed to fetch outfits');
                }
                
                const outfits = await outfitsResponse.json();
                
                const pricingAnalysis = calculateGroupPricing(outfits, outfit_data.discount_rules || {});

                return new Response(JSON.stringify({ 
                    data: {
                        pricing_analysis: pricingAnalysis,
                        total_savings: pricingAnalysis.total_discount_amount,
                        per_member_savings: pricingAnalysis.per_member_discount
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'schedule_fitting': {
                const fittingData = outfit_data.fitting_data;
                
                const updateFields = {
                    fitting_scheduled_date: fittingData.appointment_date,
                    customizations: {
                        ...outfit_data.customizations,
                        fitting_appointment: fittingData
                    },
                    updated_at: new Date().toISOString()
                };

                const response = await fetch(`${supabaseUrl}/rest/v1/wedding_outfits?id=eq.${outfit_id}`, {
                    method: 'PATCH',
                    headers,
                    body: JSON.stringify(updateFields)
                });

                if (!response.ok) {
                    throw new Error(`Failed to schedule fitting: ${await response.text()}`);
                }

                // Create fitting task
                await createFittingTask(member_id, fittingData, supabaseUrl, headers);

                return new Response(JSON.stringify({ data: { success: true } }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'update_sizing': {
                const sizingData = outfit_data.sizing_data;
                
                const updateFields = {
                    sizing_details: sizingData,
                    updated_at: new Date().toISOString()
                };
                
                // If alterations are needed, calculate cost
                if (sizingData.requires_alterations) {
                    updateFields.alterations_cost = calculateAlterationsCost(sizingData.alterations_needed);
                    updateFields.total_outfit_cost = 
                        (outfit_data.total_rental_cost || 0) + 
                        (outfit_data.total_purchase_cost || 0) + 
                        updateFields.alterations_cost;
                }

                const response = await fetch(`${supabaseUrl}/rest/v1/wedding_outfits?id=eq.${outfit_id}`, {
                    method: 'PATCH',
                    headers,
                    body: JSON.stringify(updateFields)
                });

                if (!response.ok) {
                    throw new Error(`Failed to update sizing: ${await response.text()}`);
                }

                return new Response(JSON.stringify({ data: { success: true } }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            default:
                throw new Error(`Unknown action: ${action}`);
        }

    } catch (error) {
        console.error('Wedding outfit coordination error:', error);
        
        return new Response(JSON.stringify({
            error: {
                code: 'WEDDING_OUTFIT_COORDINATION_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// Helper functions
async function performOutfitCoordination(outfitData, measurements, openaiApiKey) {
    if (!openaiApiKey) {
        return {
            coordination_score: 0.8,
            style_consistency_score: 0.8,
            analysis_notes: 'AI coordination analysis not available'
        };
    }
    
    const prompt = `
Analyze this wedding party outfit for coordination and style consistency:

Outfit Details:
${JSON.stringify(outfitData, null, 2)}

Measurements:
${JSON.stringify(measurements?.measurements, null, 2)}

Provide analysis on:
1. Color coordination (0-1 score)
2. Style consistency (0-1 score)
3. Formality appropriateness
4. Fit recommendations
5. Improvement suggestions

Return JSON with: coordination_score, style_consistency_score, analysis_notes, recommendations
`;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openaiApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4',
                messages: [{
                    role: 'system',
                    content: 'You are a luxury wedding fashion coordinator with expertise in menswear styling and coordination.'
                }, {
                    role: 'user',
                    content: prompt
                }],
                temperature: 0.3
            })
        });
        
        if (!response.ok) {
            throw new Error('OpenAI API request failed');
        }
        
        const data = await response.json();
        return JSON.parse(data.choices[0].message.content);
    } catch (error) {
        console.error('AI coordination analysis failed:', error);
        return {
            coordination_score: 0.8,
            style_consistency_score: 0.8,
            analysis_notes: 'AI analysis unavailable - manual review recommended'
        };
    }
}

function calculateRentalCost(rentalItems) {
    return Object.values(rentalItems).reduce((total, item) => {
        return total + (item.price || 0) * (item.quantity || 1);
    }, 0);
}

function calculatePurchaseCost(purchaseItems) {
    return Object.values(purchaseItems).reduce((total, item) => {
        return total + (item.price || 0) * (item.quantity || 1);
    }, 0);
}

function calculateAlterationsCost(alterationsNeeded) {
    const alterationPrices = {
        jacket_sleeve: 25,
        jacket_length: 35,
        jacket_body: 50,
        trouser_hem: 20,
        trouser_waist: 30,
        trouser_taper: 25,
        shirt_sleeve: 20,
        shirt_body: 30
    };
    
    return alterationsNeeded.reduce((total, alteration) => {
        return total + (alterationPrices[alteration.type] || 25);
    }, 0);
}

async function updateMemberOutfitStatus(memberId, status, supabaseUrl, headers) {
    await fetch(`${supabaseUrl}/rest/v1/wedding_party_members?id=eq.${memberId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
            outfit_status: status,
            updated_at: new Date().toISOString()
        })
    });
}

async function createOutfitApprovalTask(memberId, outfitId, supabaseUrl, headers) {
    const memberResponse = await fetch(
        `${supabaseUrl}/rest/v1/wedding_party_members?id=eq.${memberId}&select=wedding_id,first_name,last_name`,
        { headers }
    );
    
    if (!memberResponse.ok) return;
    
    const member = await memberResponse.json();
    if (member.length === 0) return;
    
    const task = {
        wedding_id: member[0].wedding_id,
        task_name: `Approve Outfit - ${member[0].first_name} ${member[0].last_name}`,
        description: `Review and approve outfit selection (ID: ${outfitId})`,
        category: 'selection',
        phase: 'approval',
        assigned_to: 'couple',
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days
        priority: 'medium',
        auto_created: true
    };
    
    await fetch(`${supabaseUrl}/rest/v1/wedding_timeline_tasks`, {
        method: 'POST',
        headers,
        body: JSON.stringify(task)
    });
}

async function createOrderProcessingTask(memberId, outfitId, supabaseUrl, headers) {
    const memberResponse = await fetch(
        `${supabaseUrl}/rest/v1/wedding_party_members?id=eq.${memberId}&select=wedding_id,first_name,last_name`,
        { headers }
    );
    
    if (!memberResponse.ok) return;
    
    const member = await memberResponse.json();
    if (member.length === 0) return;
    
    const task = {
        wedding_id: member[0].wedding_id,
        task_name: `Process Order - ${member[0].first_name} ${member[0].last_name}`,
        description: `Create order for approved outfit (ID: ${outfitId})`,
        category: 'orders',
        phase: 'processing',
        assigned_to: 'coordinator',
        due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 day
        priority: 'high',
        auto_created: true
    };
    
    await fetch(`${supabaseUrl}/rest/v1/wedding_timeline_tasks`, {
        method: 'POST',
        headers,
        body: JSON.stringify(task)
    });
}

async function generateAIOutfitRecommendations(member, preferences, openaiApiKey) {
    const prompt = `
Generate outfit recommendations for a wedding party member:

Member Details:
- Role: ${member.role}
- Measurements: ${JSON.stringify(member.measurements?.[0]?.measurements, null, 2)}

Wedding Details:
- Theme: ${member.wedding.wedding_theme}
- Formality: ${member.wedding.formality_level}
- Color Scheme: ${JSON.stringify(member.wedding.color_scheme)}
- Venue: ${member.wedding.venue_name}

Preferences:
${JSON.stringify(preferences, null, 2)}

Provide 3 outfit recommendations with:
1. Specific product suggestions
2. Color coordination
3. Style reasoning
4. Rental vs purchase recommendations

Return as JSON array of outfit objects.
`;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openaiApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4',
                messages: [{
                    role: 'system',
                    content: 'You are a luxury wedding fashion stylist specializing in coordinated wedding party outfits.'
                }, {
                    role: 'user',
                    content: prompt
                }],
                temperature: 0.7
            })
        });
        
        const data = await response.json();
        return JSON.parse(data.choices[0].message.content);
    } catch (error) {
        console.error('AI recommendations failed:', error);
        return [
            {
                name: 'Classic Formal',
                description: 'Traditional formal wedding attire',
                items: ['Black tuxedo', 'White dress shirt', 'Black bow tie'],
                reasoning: 'Timeless and appropriate for formal weddings'
            }
        ];
    }
}

async function analyzePartyCoordination(members, wedding, openaiApiKey) {
    const outfitSummary = members.map(member => ({
        role: member.role,
        outfits: member.outfits
    }));
    
    if (!openaiApiKey) {
        return {
            overall_score: 0.8,
            recommendations: ['AI analysis not available'],
            coordination_issues: []
        };
    }
    
    const prompt = `
Analyze wedding party outfit coordination:

Wedding Theme: ${wedding.wedding_theme}
Formality: ${wedding.formality_level}
Color Scheme: ${JSON.stringify(wedding.color_scheme)}

Party Outfits:
${JSON.stringify(outfitSummary, null, 2)}

Analyze:
1. Overall coordination (0-1 score)
2. Color harmony
3. Formality consistency
4. Role-appropriate styling
5. Improvement recommendations

Return JSON with: overall_score, color_harmony_score, formality_score, recommendations, coordination_issues
`;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openaiApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4',
                messages: [{
                    role: 'system',
                    content: 'You are a master wedding coordinator specializing in party outfit coordination and styling.'
                }, {
                    role: 'user',
                    content: prompt
                }],
                temperature: 0.3
            })
        });
        
        const data = await response.json();
        return JSON.parse(data.choices[0].message.content);
    } catch (error) {
        console.error('AI coordination analysis failed:', error);
        return {
            overall_score: 0.8,
            recommendations: ['Manual coordination review recommended'],
            coordination_issues: []
        };
    }
}

function calculateGroupPricing(outfits, discountRules) {
    const totalPartySize = outfits.length;
    const totalCost = outfits.reduce((sum, outfit) => sum + (outfit.total_outfit_cost || 0), 0);
    
    // Apply group discounts based on party size
    let discountPercentage = 0;
    if (totalPartySize >= 10) discountPercentage = 0.15; // 15% for 10+
    else if (totalPartySize >= 6) discountPercentage = 0.10; // 10% for 6-9
    else if (totalPartySize >= 4) discountPercentage = 0.05; // 5% for 4-5
    
    // Apply custom discount rules
    if (discountRules.minimum_spend && totalCost >= discountRules.minimum_spend) {
        discountPercentage = Math.max(discountPercentage, discountRules.discount_percentage || 0);
    }
    
    const totalDiscountAmount = totalCost * discountPercentage;
    const finalCost = totalCost - totalDiscountAmount;
    const perMemberDiscount = totalDiscountAmount / totalPartySize;
    
    return {
        party_size: totalPartySize,
        original_total: totalCost,
        discount_percentage: discountPercentage,
        total_discount_amount: totalDiscountAmount,
        final_total: finalCost,
        per_member_discount: perMemberDiscount,
        savings_per_member: perMemberDiscount,
        qualified_discounts: {
            group_size_discount: discountPercentage > 0,
            minimum_spend_discount: discountRules.minimum_spend && totalCost >= discountRules.minimum_spend
        }
    };
}

async function createFittingTask(memberId, fittingData, supabaseUrl, headers) {
    const memberResponse = await fetch(
        `${supabaseUrl}/rest/v1/wedding_party_members?id=eq.${memberId}&select=wedding_id,first_name,last_name`,
        { headers }
    );
    
    if (!memberResponse.ok) return;
    
    const member = await memberResponse.json();
    if (member.length === 0) return;
    
    const task = {
        wedding_id: member[0].wedding_id,
        task_name: `Fitting Appointment - ${member[0].first_name} ${member[0].last_name}`,
        description: `Outfit fitting: ${fittingData.appointment_date} at ${fittingData.location}`,
        category: 'fitting',
        phase: 'execution',
        assigned_to: 'party_member',
        assigned_member_id: memberId,
        due_date: fittingData.appointment_date,
        priority: 'medium',
        auto_created: true
    };
    
    await fetch(`${supabaseUrl}/rest/v1/wedding_timeline_tasks`, {
        method: 'POST',
        headers,
        body: JSON.stringify(task)
    });
}