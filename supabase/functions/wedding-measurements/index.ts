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
        const { action, measurement_data, member_id, filters } = await req.json();
        
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
            case 'submit_measurements': {
                // Validate measurement data
                const validationResult = validateMeasurements(measurement_data.measurements);
                if (!validationResult.valid) {
                    throw new Error(`Invalid measurements: ${validationResult.errors.join(', ')}`);
                }

                // AI-powered measurement analysis
                let aiAnalysis = null;
                let confidenceScore = 0.8; // Default confidence
                
                if (openaiApiKey && measurement_data.measurement_method === 'ai_assisted') {
                    aiAnalysis = await performAIMeasurementAnalysis(
                        measurement_data.measurements,
                        measurement_data.additional_data,
                        openaiApiKey
                    );
                    confidenceScore = aiAnalysis.confidence_score;
                }

                // Mark previous measurements as not current
                await fetch(`${supabaseUrl}/rest/v1/wedding_measurements?party_member_id=eq.${member_id}`, {
                    method: 'PATCH',
                    headers,
                    body: JSON.stringify({
                        is_current: false,
                        updated_at: new Date().toISOString()
                    })
                });

                // Get version number
                const existingResponse = await fetch(
                    `${supabaseUrl}/rest/v1/wedding_measurements?party_member_id=eq.${member_id}&order=version_number.desc&limit=1`,
                    { headers }
                );
                
                const existing = await existingResponse.json();
                const versionNumber = existing.length > 0 ? existing[0].version_number + 1 : 1;

                // Create new measurement record
                const measurementRecord = {
                    party_member_id: member_id,
                    measurements: measurement_data.measurements,
                    fit_preferences: measurement_data.fit_preferences || {},
                    measurement_method: measurement_data.measurement_method,
                    confidence_score: confidenceScore,
                    measured_by: measurement_data.measured_by,
                    measurement_location: measurement_data.measurement_location,
                    requires_fitting: measurement_data.requires_fitting || false,
                    professional_review_needed: confidenceScore < 0.7 || measurement_data.requires_review,
                    notes: measurement_data.notes,
                    special_considerations: measurement_data.special_considerations || {},
                    is_current: true,
                    version_number: versionNumber,
                    previous_measurement_id: existing.length > 0 ? existing[0].id : null
                };

                // Add AI analysis results
                if (aiAnalysis) {
                    measurementRecord.size_recommendations = aiAnalysis.size_recommendations;
                    measurementRecord.professional_notes = aiAnalysis.professional_notes;
                    measurementRecord.special_considerations = {
                        ...measurementRecord.special_considerations,
                        ai_analysis: aiAnalysis.analysis_notes
                    };
                }

                const response = await fetch(`${supabaseUrl}/rest/v1/wedding_measurements`, {
                    method: 'POST',
                    headers: { ...headers, 'Prefer': 'return=representation' },
                    body: JSON.stringify(measurementRecord)
                });

                if (!response.ok) {
                    throw new Error(`Failed to submit measurements: ${await response.text()}`);
                }

                const measurements = await response.json();
                
                // Update party member status
                await updateMemberMeasurementStatus(member_id, 'submitted', supabaseUrl, headers);
                
                // Create measurement review task if needed
                if (measurementRecord.professional_review_needed) {
                    await createMeasurementReviewTask(member_id, measurements[0].id, supabaseUrl, headers);
                }

                return new Response(JSON.stringify({ 
                    data: {
                        measurement: measurements[0],
                        ai_analysis: aiAnalysis,
                        requires_review: measurementRecord.professional_review_needed,
                        confidence_score: confidenceScore
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'get_measurements': {
                let query = `party_member_id=eq.${member_id}`;
                
                if (filters?.current_only) {
                    query += '&is_current=eq.true';
                }
                
                if (filters?.include_history) {
                    query += '&order=version_number.desc';
                }

                const response = await fetch(
                    `${supabaseUrl}/rest/v1/wedding_measurements?${query}`,
                    { headers }
                );

                if (!response.ok) {
                    throw new Error(`Failed to fetch measurements: ${await response.text()}`);
                }

                const measurements = await response.json();
                
                return new Response(JSON.stringify({ 
                    data: filters?.current_only ? (measurements[0] || null) : measurements 
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'validate_measurements': {
                const validation = validateMeasurements(measurement_data.measurements);
                
                let aiValidation = null;
                if (openaiApiKey) {
                    aiValidation = await performAIMeasurementValidation(
                        measurement_data.measurements,
                        openaiApiKey
                    );
                }

                return new Response(JSON.stringify({ 
                    data: {
                        validation,
                        ai_validation: aiValidation,
                        recommendations: generateMeasurementRecommendations(measurement_data.measurements)
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'generate_size_recommendations': {
                const measurementsResponse = await fetch(
                    `${supabaseUrl}/rest/v1/wedding_measurements?party_member_id=eq.${member_id}&is_current=eq.true`,
                    { headers }
                );
                
                if (!measurementsResponse.ok) {
                    throw new Error('No measurements found for member');
                }
                
                const measurements = await measurementsResponse.json();
                if (measurements.length === 0) {
                    throw new Error('No current measurements found');
                }
                
                const currentMeasurement = measurements[0];
                const sizeRecommendations = await generateSizeRecommendations(
                    currentMeasurement.measurements,
                    measurement_data.product_categories || ['jacket', 'trouser', 'shirt'],
                    openaiApiKey
                );

                // Update measurements with size recommendations
                await fetch(`${supabaseUrl}/rest/v1/wedding_measurements?id=eq.${currentMeasurement.id}`, {
                    method: 'PATCH',
                    headers,
                    body: JSON.stringify({
                        size_recommendations: sizeRecommendations,
                        updated_at: new Date().toISOString()
                    })
                });

                return new Response(JSON.stringify({ 
                    data: {
                        size_recommendations: sizeRecommendations,
                        confidence_score: currentMeasurement.confidence_score
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'professional_review': {
                const reviewData = measurement_data.review_data;
                const measurementId = measurement_data.measurement_id;
                
                const updateData = {
                    professional_review_needed: false,
                    reviewed_by_professional: true,
                    professional_notes: reviewData.professional_notes,
                    reviewed_at: new Date().toISOString(),
                    confidence_score: reviewData.confidence_score,
                    requires_fitting: reviewData.requires_fitting,
                    updated_at: new Date().toISOString()
                };
                
                // Update size recommendations if provided
                if (reviewData.size_recommendations) {
                    updateData.size_recommendations = reviewData.size_recommendations;
                }

                const response = await fetch(`${supabaseUrl}/rest/v1/wedding_measurements?id=eq.${measurementId}`, {
                    method: 'PATCH',
                    headers,
                    body: JSON.stringify(updateData)
                });

                if (!response.ok) {
                    throw new Error(`Failed to complete professional review: ${await response.text()}`);
                }

                // Update member status to confirmed if review is positive
                if (reviewData.confidence_score >= 0.8 && !reviewData.requires_fitting) {
                    const measurementResponse = await fetch(
                        `${supabaseUrl}/rest/v1/wedding_measurements?id=eq.${measurementId}&select=party_member_id`,
                        { headers }
                    );
                    
                    if (measurementResponse.ok) {
                        const measurement = await measurementResponse.json();
                        await updateMemberMeasurementStatus(measurement[0].party_member_id, 'confirmed', supabaseUrl, headers);
                    }
                }

                return new Response(JSON.stringify({ data: { success: true } }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'schedule_fitting': {
                const fittingData = measurement_data.fitting_data;
                const measurementId = measurement_data.measurement_id;
                
                // Update measurement record
                await fetch(`${supabaseUrl}/rest/v1/wedding_measurements?id=eq.${measurementId}`, {
                    method: 'PATCH',
                    headers,
                    body: JSON.stringify({
                        requires_fitting: true,
                        special_considerations: {
                            ...measurement_data.special_considerations,
                            fitting_appointment: fittingData
                        },
                        updated_at: new Date().toISOString()
                    })
                });
                
                // Create fitting task
                const measurementResponse = await fetch(
                    `${supabaseUrl}/rest/v1/wedding_measurements?id=eq.${measurementId}&select=party_member_id`,
                    { headers }
                );
                
                if (measurementResponse.ok) {
                    const measurement = await measurementResponse.json();
                    await createFittingTask(measurement[0].party_member_id, fittingData, supabaseUrl, headers);
                }

                return new Response(JSON.stringify({ data: { success: true } }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'ai_measurement_assistant': {
                if (!openaiApiKey) {
                    throw new Error('AI measurement assistant not available');
                }
                
                const assistantResponse = await performAIMeasurementAssistance(
                    measurement_data.user_input,
                    measurement_data.context,
                    openaiApiKey
                );

                return new Response(JSON.stringify({ 
                    data: {
                        assistant_response: assistantResponse,
                        suggestions: assistantResponse.suggestions,
                        next_steps: assistantResponse.next_steps
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            default:
                throw new Error(`Unknown action: ${action}`);
        }

    } catch (error) {
        console.error('Wedding measurements error:', error);
        
        return new Response(JSON.stringify({
            error: {
                code: 'WEDDING_MEASUREMENTS_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// Helper functions
function validateMeasurements(measurements) {
    const required = ['chest', 'waist', 'height', 'weight'];
    const errors = [];
    
    for (const field of required) {
        if (!measurements[field] || measurements[field] <= 0) {
            errors.push(`${field} is required and must be positive`);
        }
    }
    
    // Validate ranges
    if (measurements.chest && (measurements.chest < 30 || measurements.chest > 60)) {
        errors.push('Chest measurement seems unrealistic (30-60 inches expected)');
    }
    
    if (measurements.waist && (measurements.waist < 24 || measurements.waist > 55)) {
        errors.push('Waist measurement seems unrealistic (24-55 inches expected)');
    }
    
    if (measurements.height && (measurements.height < 48 || measurements.height > 84)) {
        errors.push('Height seems unrealistic (48-84 inches expected)');
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
}

async function performAIMeasurementAnalysis(measurements, additionalData, openaiApiKey) {
    const prompt = `
Analyze these body measurements for a wedding party member and provide detailed sizing recommendations:

Measurements:
${JSON.stringify(measurements, null, 2)}

Additional Data:
${JSON.stringify(additionalData, null, 2)}

Please provide:
1. Confidence score (0-1) for measurement accuracy
2. Size recommendations for jacket, trouser, and shirt
3. Fit recommendations (slim, regular, relaxed)
4. Any concerns or red flags
5. Professional review recommendations

Return as JSON with fields: confidence_score, size_recommendations, analysis_notes, professional_notes, concerns
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
                    content: 'You are an expert tailor and fitting specialist with 20+ years of experience in menswear sizing and alterations.'
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
        const aiResponse = JSON.parse(data.choices[0].message.content);
        
        return aiResponse;
    } catch (error) {
        console.error('AI analysis failed:', error);
        return {
            confidence_score: 0.6,
            size_recommendations: {},
            analysis_notes: 'AI analysis unavailable',
            professional_notes: 'Please have measurements reviewed by a professional',
            concerns: ['AI analysis failed - manual review recommended']
        };
    }
}

async function performAIMeasurementValidation(measurements, openaiApiKey) {
    const prompt = `
Validate these body measurements for consistency and accuracy:

${JSON.stringify(measurements, null, 2)}

Check for:
1. Measurement consistency (proportional relationships)
2. Realistic ranges for adult male
3. Common measurement errors
4. Missing critical measurements

Return JSON with: is_valid, confidence_level, issues, recommendations
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
                    content: 'You are a measurement validation expert specializing in menswear fitting.'
                }, {
                    role: 'user',
                    content: prompt
                }],
                temperature: 0.2
            })
        });
        
        const data = await response.json();
        return JSON.parse(data.choices[0].message.content);
    } catch (error) {
        console.error('AI validation failed:', error);
        return null;
    }
}

async function generateSizeRecommendations(measurements, productCategories, openaiApiKey) {
    const recommendations = {};
    
    for (const category of productCategories) {
        switch (category) {
            case 'jacket':
                recommendations.jacket = calculateJacketSize(measurements);
                break;
            case 'trouser':
                recommendations.trouser = calculateTrouserSize(measurements);
                break;
            case 'shirt':
                recommendations.shirt = calculateShirtSize(measurements);
                break;
        }
    }
    
    // Enhance with AI if available
    if (openaiApiKey) {
        try {
            const aiRecommendations = await getAISizeRecommendations(measurements, productCategories, openaiApiKey);
            Object.assign(recommendations, aiRecommendations);
        } catch (error) {
            console.error('AI size recommendations failed:', error);
        }
    }
    
    return recommendations;
}

function calculateJacketSize(measurements) {
    // Basic jacket sizing algorithm
    const chest = measurements.chest;
    const height = measurements.height;
    
    let size = Math.round(chest);
    let length = 'Regular';
    
    if (height < 66) length = 'Short';
    else if (height > 74) length = 'Long';
    
    return {
        size: `${size}${length.charAt(0)}`,
        chest_size: size,
        length: length,
        fit_recommendation: 'Regular'
    };
}

function calculateTrouserSize(measurements) {
    const waist = Math.round(measurements.waist);
    const inseam = measurements.inseam || 32; // Default if not provided
    
    return {
        waist: waist,
        inseam: Math.round(inseam),
        size: `${waist}x${Math.round(inseam)}`,
        fit_recommendation: 'Regular'
    };
}

function calculateShirtSize(measurements) {
    const neck = measurements.neck || Math.round(measurements.chest / 2.5); // Estimate if not provided
    const sleeve = measurements.sleeve || 33; // Default if not provided
    
    return {
        neck: Math.round(neck * 2) / 2, // Round to nearest half inch
        sleeve: Math.round(sleeve),
        size: `${Math.round(neck * 2) / 2}-${Math.round(sleeve)}`,
        fit_recommendation: 'Regular'
    };
}

async function getAISizeRecommendations(measurements, categories, openaiApiKey) {
    const prompt = `
Generate precise size recommendations for these product categories based on the measurements:

Measurements: ${JSON.stringify(measurements, null, 2)}
Categories: ${categories.join(', ')}

For each category, provide:
- Specific size (e.g., 42R for jacket, 34x32 for trousers)
- Fit recommendation (slim, regular, relaxed)
- Confidence level
- Alternative sizes to try

Return as JSON object with category keys.
`;

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
                content: 'You are a master tailor with expertise in precise sizing for luxury menswear.'
            }, {
                role: 'user',
                content: prompt
            }],
            temperature: 0.2
        })
    });
    
    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
}

async function updateMemberMeasurementStatus(memberId, status, supabaseUrl, headers) {
    await fetch(`${supabaseUrl}/rest/v1/wedding_party_members?id=eq.${memberId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
            measurements_status: status,
            updated_at: new Date().toISOString()
        })
    });
}

async function createMeasurementReviewTask(memberId, measurementId, supabaseUrl, headers) {
    // Get member's wedding ID
    const memberResponse = await fetch(
        `${supabaseUrl}/rest/v1/wedding_party_members?id=eq.${memberId}&select=wedding_id,first_name,last_name`,
        { headers }
    );
    
    if (!memberResponse.ok) return;
    
    const member = await memberResponse.json();
    if (member.length === 0) return;
    
    const task = {
        wedding_id: member[0].wedding_id,
        task_name: `Review Measurements - ${member[0].first_name} ${member[0].last_name}`,
        description: `Professional review required for measurements (ID: ${measurementId})`,
        category: 'measurements',
        phase: 'review',
        assigned_to: 'coordinator',
        assigned_member_id: memberId,
        due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days
        priority: 'high',
        auto_created: true
    };
    
    await fetch(`${supabaseUrl}/rest/v1/wedding_timeline_tasks`, {
        method: 'POST',
        headers,
        body: JSON.stringify(task)
    });
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
        description: `Scheduled fitting appointment: ${fittingData.appointment_date} at ${fittingData.location}`,
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

function generateMeasurementRecommendations(measurements) {
    const recommendations = [];
    
    // Basic measurement tips
    if (!measurements.neck) {
        recommendations.push('Consider adding neck measurement for more accurate shirt sizing');
    }
    
    if (!measurements.sleeve) {
        recommendations.push('Sleeve length measurement recommended for custom fit');
    }
    
    if (!measurements.inseam) {
        recommendations.push('Inseam measurement needed for proper trouser length');
    }
    
    // Fit recommendations based on body type
    const chestToWaist = measurements.chest / measurements.waist;
    if (chestToWaist > 1.3) {
        recommendations.push('Athletic build detected - consider tailored fit options');
    }
    
    return recommendations;
}

async function performAIMeasurementAssistance(userInput, context, openaiApiKey) {
    const prompt = `
User needs help with measurements for wedding party coordination.

User input: "${userInput}"
Context: ${JSON.stringify(context, null, 2)}

Provide helpful guidance on:
1. How to take accurate measurements
2. Common mistakes to avoid
3. When professional help is recommended
4. Next steps in the process

Be encouraging and practical. Return JSON with: response, suggestions, next_steps
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
                    content: 'You are a friendly, expert menswear fitting consultant helping wedding party members with measurements.'
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
        console.error('AI assistant failed:', error);
        return {
            response: "I'm here to help with your measurements! Please let me know what specific guidance you need.",
            suggestions: [
                "Take measurements over fitted clothing",
                "Use a flexible measuring tape",
                "Have someone help you for accuracy",
                "Measure twice to confirm"
            ],
            next_steps: [
                "Complete your measurements",
                "Submit for review",
                "Wait for size recommendations"
            ]
        };
    }
}