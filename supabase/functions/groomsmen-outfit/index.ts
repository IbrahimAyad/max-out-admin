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
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

        if (!supabaseUrl || !supabaseAnonKey) {
            throw new Error('Supabase configuration missing');
        }

        // Get user from auth header
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            throw new Error('No authorization header');
        }

        const token = authHeader.replace('Bearer ', '');

        // Verify token and get user
        const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': supabaseAnonKey
            }
        });

        if (!userResponse.ok) {
            throw new Error('Invalid token');
        }

        const userData = await userResponse.json();
        const userEmail = userData.email;

        // Get party member data
        const memberResponse = await fetch(`${supabaseUrl}/rest/v1/wedding_party_members?email=eq.${userEmail}&select=*`, {
            headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!memberResponse.ok) {
            throw new Error('Failed to fetch party member data');
        }

        const members = await memberResponse.json();

        if (members.length === 0) {
            throw new Error('No wedding party membership found for this user');
        }

        const member = members[0];
        const url = new URL(req.url);
        const method = req.method;

        if (method === 'GET') {
            // Get assigned outfit
            const outfitResponse = await fetch(`${supabaseUrl}/rest/v1/wedding_outfits?party_member_id=eq.${member.id}&select=*`, {
                headers: {
                    'apikey': supabaseAnonKey,
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const outfits = outfitResponse.ok ? await outfitResponse.json() : [];

            if (outfits.length === 0) {
                return new Response(JSON.stringify({
                    data: {
                        outfit: null,
                        hasOutfitAssigned: false,
                        message: 'No outfit assigned yet. Your outfit will be assigned after measurements are reviewed.'
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            const outfit = outfits[0];

            // Build comprehensive outfit data with product information
            const outfitData = {
                id: outfit.id,
                partyMemberId: outfit.party_member_id,
                outfitTemplateId: outfit.outfit_template_id,
                items: {
                    jacket: outfit.jacket_product_id ? {
                        productId: outfit.jacket_product_id,
                        type: 'jacket'
                    } : null,
                    trouser: outfit.trouser_product_id ? {
                        productId: outfit.trouser_product_id,
                        type: 'trouser'
                    } : null,
                    shirt: outfit.shirt_product_id ? {
                        productId: outfit.shirt_product_id,
                        type: 'shirt'
                    } : null,
                    vest: outfit.vest_product_id ? {
                        productId: outfit.vest_product_id,
                        type: 'vest'
                    } : null,
                    tie: outfit.tie_product_id ? {
                        productId: outfit.tie_product_id,
                        type: 'tie'
                    } : null,
                    pocketSquare: outfit.pocket_square_product_id ? {
                        productId: outfit.pocket_square_product_id,
                        type: 'pocket_square'
                    } : null,
                    cufflinks: outfit.cufflinks_product_id ? {
                        productId: outfit.cufflinks_product_id,
                        type: 'cufflinks'
                    } : null,
                    shoes: outfit.shoes_product_id ? {
                        productId: outfit.shoes_product_id,
                        type: 'shoes'
                    } : null
                },
                accessories: outfit.accessories || {},
                customizations: outfit.customizations || {},
                sizingDetails: outfit.sizing_details || {},
                colorCoordination: outfit.color_coordination || {},
                styleNotes: outfit.style_notes,
                rentalItems: outfit.rental_items || [],
                purchaseItems: outfit.purchase_items || [],
                costs: {
                    totalRental: outfit.total_rental_cost || 0,
                    totalPurchase: outfit.total_purchase_cost || 0,
                    alterations: outfit.alterations_cost || 0,
                    total: outfit.total_outfit_cost || 0
                },
                approvals: {
                    approvedByCouple: outfit.approved_by_couple || false,
                    approvedByMember: outfit.approved_by_member || false,
                    approvalNotes: outfit.approval_notes
                },
                timeline: {
                    selectionDeadline: outfit.selection_deadline,
                    fittingScheduledDate: outfit.fitting_scheduled_date,
                    orderPlacedAt: outfit.order_placed_at,
                    expectedDeliveryDate: outfit.expected_delivery_date
                },
                scores: {
                    coordination: outfit.coordination_score || 0,
                    styleConsistency: outfit.style_consistency_score || 0
                },
                createdAt: outfit.created_at,
                updatedAt: outfit.updated_at
            };

            return new Response(JSON.stringify({
                data: {
                    outfit: outfitData,
                    hasOutfitAssigned: true,
                    canApprove: !outfit.approved_by_member,
                    needsFitting: outfit.fitting_scheduled_date !== null,
                    isOrderPlaced: outfit.order_placed_at !== null
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } else if (method === 'POST' && url.pathname.endsWith('/approve')) {
            // Approve outfit
            const { approved, notes, customizationRequests } = await req.json();

            // Get current outfit
            const outfitResponse = await fetch(`${supabaseUrl}/rest/v1/wedding_outfits?party_member_id=eq.${member.id}&select=*`, {
                headers: {
                    'apikey': supabaseAnonKey,
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const outfits = await outfitResponse.json();

            if (outfits.length === 0) {
                throw new Error('No outfit found to approve');
            }

            const outfit = outfits[0];

            // Update outfit approval
            const updateData = {
                approved_by_member: approved,
                approval_notes: notes || '',
                updated_at: new Date().toISOString()
            };

            // Add customization requests if provided
            if (customizationRequests && Object.keys(customizationRequests).length > 0) {
                updateData.customizations = {
                    ...outfit.customizations,
                    member_requests: customizationRequests,
                    requested_at: new Date().toISOString()
                };
            }

            const updateResponse = await fetch(`${supabaseUrl}/rest/v1/wedding_outfits?id=eq.${outfit.id}`, {
                method: 'PATCH',
                headers: {
                    'apikey': supabaseAnonKey,
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(updateData)
            });

            if (!updateResponse.ok) {
                const errorText = await updateResponse.text();
                throw new Error(`Failed to update outfit approval: ${errorText}`);
            }

            const updatedOutfit = await updateResponse.json();

            // Update party member outfit status
            const memberStatus = approved ? 'approved' : 'review_requested';
            await fetch(`${supabaseUrl}/rest/v1/wedding_party_members?id=eq.${member.id}`, {
                method: 'PATCH',
                headers: {
                    'apikey': supabaseAnonKey,
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    outfit_status: memberStatus,
                    updated_at: new Date().toISOString()
                })
            });

            // Create communication record for approval/feedback
            const communicationData = {
                wedding_id: member.wedding_id,
                sender_id: member.id,
                sender_type: 'party_member',
                recipient_types: ['coordinator', 'admin'],
                message_type: approved ? 'outfit_approval' : 'outfit_feedback',
                subject: approved ? 'Outfit Approved' : 'Outfit Feedback Provided',
                message: approved 
                    ? `${member.first_name} ${member.last_name} has approved their outfit.${notes ? ` Notes: ${notes}` : ''}` 
                    : `${member.first_name} ${member.last_name} has provided feedback on their outfit.${notes ? ` Feedback: ${notes}` : ''}`,
                sent_at: new Date().toISOString(),
                created_at: new Date().toISOString()
            };

            await fetch(`${supabaseUrl}/rest/v1/wedding_communications`, {
                method: 'POST',
                headers: {
                    'apikey': supabaseAnonKey,
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(communicationData)
            });

            return new Response(JSON.stringify({
                data: {
                    outfit: updatedOutfit[0],
                    message: approved ? 'Outfit approved successfully' : 'Feedback submitted successfully'
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } else if (method === 'POST' && url.pathname.endsWith('/request-changes')) {
            // Request outfit changes
            const { changes, notes } = await req.json();

            if (!changes || Object.keys(changes).length === 0) {
                throw new Error('Change requests are required');
            }

            // Create communication record for change request
            const communicationData = {
                wedding_id: member.wedding_id,
                sender_id: member.id,
                sender_type: 'party_member',
                recipient_types: ['coordinator', 'admin'],
                message_type: 'outfit_change_request',
                subject: 'Outfit Change Request',
                message: `${member.first_name} ${member.last_name} has requested changes to their outfit:\n\n${JSON.stringify(changes, null, 2)}${notes ? `\n\nAdditional Notes: ${notes}` : ''}`,
                sent_at: new Date().toISOString(),
                created_at: new Date().toISOString()
            };

            await fetch(`${supabaseUrl}/rest/v1/wedding_communications`, {
                method: 'POST',
                headers: {
                    'apikey': supabaseAnonKey,
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(communicationData)
            });

            return new Response(JSON.stringify({
                data: {
                    message: 'Change request submitted successfully. A coordinator will review your request and respond soon.'
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } else {
            return new Response(JSON.stringify({
                error: {
                    code: 'METHOD_NOT_ALLOWED',
                    message: 'Method not allowed'
                }
            }), {
                status: 405,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

    } catch (error) {
        console.error('Groomsmen outfit error:', error);

        const errorResponse = {
            error: {
                code: 'OUTFIT_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});