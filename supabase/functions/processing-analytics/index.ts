// Processing Analytics Function
// Calculates processing efficiency metrics and performance analytics

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
        const { action, orderId, timeframe, processorId } = await req.json();

        if (!action) {
            throw new Error('Action is required');
        }

        // Get environment variables
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        let result = {};

        switch (action) {
            case 'calculate_order_metrics':
                if (!orderId) {
                    throw new Error('Order ID is required');
                }
                result = await calculateOrderMetrics(supabaseUrl, serviceRoleKey, orderId);
                break;

            case 'get_efficiency_dashboard':
                result = await getEfficiencyDashboard(supabaseUrl, serviceRoleKey, timeframe || '30');
                break;

            case 'processor_performance':
                result = await getProcessorPerformance(supabaseUrl, serviceRoleKey, processorId, timeframe || '30');
                break;

            case 'bottleneck_analysis':
                result = await getBottleneckAnalysis(supabaseUrl, serviceRoleKey, timeframe || '7');
                break;

            case 'sla_compliance':
                result = await getSLACompliance(supabaseUrl, serviceRoleKey, timeframe || '30');
                break;

            case 'real_time_metrics':
                result = await getRealTimeMetrics(supabaseUrl, serviceRoleKey);
                break;

            default:
                throw new Error(`Invalid action: ${action}`);
        }

        return new Response(JSON.stringify({ data: result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Processing analytics error:', error);

        const errorResponse = {
            error: {
                code: 'ANALYTICS_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// Helper function to calculate metrics for a specific order
async function calculateOrderMetrics(supabaseUrl, serviceRoleKey, orderId) {
    // Get order with status history
    const orderResponse = await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${orderId}&select=*,order_status_history(*)`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        }
    });

    if (!orderResponse.ok) {
        throw new Error('Failed to fetch order details');
    }

    const orders = await orderResponse.json();
    if (orders.length === 0) {
        throw new Error('Order not found');
    }

    const order = orders[0];
    const statusHistory = order.order_status_history || [];

    // Calculate time spent in each stage
    const stageTimings = calculateStageTimings(order, statusHistory);
    const totalFulfillmentTime = calculateTotalFulfillmentTime(order);
    const efficiencyScore = calculateEfficiencyScore(stageTimings, totalFulfillmentTime, order);
    const bottleneckStage = identifyBottleneckStage(stageTimings);

    // Check SLA compliance
    const slaTarget = getSLATarget(order);
    const exceededSLA = totalFulfillmentTime > slaTarget;

    // Compare with similar orders
    const performanceComparison = await calculatePerformanceComparison(supabaseUrl, serviceRoleKey, order, totalFulfillmentTime);

    // Save analytics to database
    const analyticsData = {
        order_id: orderId,
        payment_to_processing_minutes: stageTimings.paymentToProcessing,
        processing_to_production_minutes: stageTimings.processingToProduction,
        production_to_quality_minutes: stageTimings.productionToQuality,
        quality_to_shipping_minutes: stageTimings.qualityToShipping,
        shipping_to_delivery_minutes: stageTimings.shippingToDelivery,
        total_fulfillment_minutes: totalFulfillmentTime,
        processing_efficiency_score: efficiencyScore,
        bottleneck_stage: bottleneckStage,
        exceeded_sla: exceededSLA,
        sla_target_minutes: slaTarget,
        vs_average_performance: performanceComparison.vsAverage,
        similar_orders_avg_time: performanceComparison.averageTime,
        quality_issues_count: countQualityIssues(statusHistory),
        reprocessing_required: checkReprocessingRequired(statusHistory)
    };

    // Check if analytics record exists, update or create
    const existingResponse = await fetch(`${supabaseUrl}/rest/v1/processing_analytics?order_id=eq.${orderId}`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        }
    });

    if (existingResponse.ok) {
        const existing = await existingResponse.json();
        if (existing.length > 0) {
            // Update existing record
            await fetch(`${supabaseUrl}/rest/v1/processing_analytics?order_id=eq.${orderId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(analyticsData)
            });
        } else {
            // Create new record
            await fetch(`${supabaseUrl}/rest/v1/processing_analytics`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(analyticsData)
            });
        }
    }

    return {
        orderId,
        stageTimings,
        totalFulfillmentTime,
        efficiencyScore,
        bottleneckStage,
        exceededSLA,
        slaTarget,
        performanceComparison
    };
}

// Helper function to get efficiency dashboard
async function getEfficiencyDashboard(supabaseUrl, serviceRoleKey, timeframeDays) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeframeDays));

    // Get processing metrics for timeframe
    const metricsResponse = await fetch(`${supabaseUrl}/rest/v1/processing_performance_metrics?processing_date=gte.${startDate.toISOString().split('T')[0]}`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        }
    });

    if (!metricsResponse.ok) {
        throw new Error('Failed to fetch processing metrics');
    }

    const metrics = await metricsResponse.json();

    // Calculate aggregated metrics
    const totalOrders = metrics.reduce((sum, day) => sum + day.order_count, 0);
    const totalValue = metrics.reduce((sum, day) => sum + parseFloat(day.total_value || 0), 0);
    const avgFulfillmentTime = metrics.reduce((sum, day) => sum + (parseFloat(day.avg_fulfillment_time) || 0), 0) / metrics.length;
    const avgEfficiencyScore = metrics.reduce((sum, day) => sum + (parseFloat(day.avg_efficiency_score) || 0), 0) / metrics.length;
    const totalSLAViolations = metrics.reduce((sum, day) => sum + (day.sla_violations || 0), 0);

    // Get current queue status
    const queueResponse = await fetch(`${supabaseUrl}/rest/v1/order_priority_queue?select=queue_status,count()`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        }
    });

    let queueStatus = {};
    if (queueResponse.ok) {
        const queueData = await queueResponse.json();
        queueStatus = queueData.reduce((acc, item) => {
            acc[item.queue_status] = item.count;
            return acc;
        }, {});
    }

    return {
        timeframe: `${timeframeDays} days`,
        overview: {
            totalOrders,
            totalValue,
            avgOrderValue: totalOrders > 0 ? totalValue / totalOrders : 0,
            avgFulfillmentTimeMinutes: avgFulfillmentTime,
            avgEfficiencyScore: avgEfficiencyScore,
            slaComplianceRate: totalOrders > 0 ? ((totalOrders - totalSLAViolations) / totalOrders) * 100 : 100
        },
        queueStatus,
        dailyMetrics: metrics
    };
}

// Helper function to get processor performance
async function getProcessorPerformance(supabaseUrl, serviceRoleKey, processorId, timeframeDays) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeframeDays));

    const ordersResponse = await fetch(`${supabaseUrl}/rest/v1/orders?assigned_processor_id=eq.${processorId}&created_at=gte.${startDate.toISOString()}&select=*,processing_analytics(*)`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        }
    });

    if (!ordersResponse.ok) {
        throw new Error('Failed to fetch processor orders');
    }

    const orders = await ordersResponse.json();
    const ordersWithAnalytics = orders.filter(o => o.processing_analytics && o.processing_analytics.length > 0);

    if (ordersWithAnalytics.length === 0) {
        return {
            processorId,
            ordersProcessed: orders.length,
            analytics: null
        };
    }

    const analytics = ordersWithAnalytics.map(o => o.processing_analytics[0]);
    const avgEfficiency = analytics.reduce((sum, a) => sum + (parseFloat(a.processing_efficiency_score) || 0), 0) / analytics.length;
    const avgFulfillmentTime = analytics.reduce((sum, a) => sum + (parseInt(a.total_fulfillment_minutes) || 0), 0) / analytics.length;
    const slaViolations = analytics.filter(a => a.exceeded_sla).length;

    return {
        processorId,
        timeframe: `${timeframeDays} days`,
        ordersProcessed: orders.length,
        ordersWithAnalytics: ordersWithAnalytics.length,
        avgEfficiencyScore: avgEfficiency,
        avgFulfillmentTimeMinutes: avgFulfillmentTime,
        slaComplianceRate: ((analytics.length - slaViolations) / analytics.length) * 100,
        qualityIssues: analytics.reduce((sum, a) => sum + (parseInt(a.quality_issues_count) || 0), 0)
    };
}

// Helper function to get bottleneck analysis
async function getBottleneckAnalysis(supabaseUrl, serviceRoleKey, timeframeDays) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeframeDays));

    const analyticsResponse = await fetch(`${supabaseUrl}/rest/v1/processing_analytics?created_at=gte.${startDate.toISOString()}&select=bottleneck_stage,count()`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        }
    });

    if (!analyticsResponse.ok) {
        throw new Error('Failed to fetch bottleneck data');
    }

    const bottlenecks = await analyticsResponse.json();

    // Get average times by stage
    const stageTimesResponse = await fetch(`${supabaseUrl}/rest/v1/processing_analytics?created_at=gte.${startDate.toISOString()}&select=payment_to_processing_minutes.avg(),processing_to_production_minutes.avg(),production_to_quality_minutes.avg(),quality_to_shipping_minutes.avg(),shipping_to_delivery_minutes.avg()`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        }
    });

    let avgStageTimes = {};
    if (stageTimesResponse.ok) {
        const stageData = await stageTimesResponse.json();
        if (stageData.length > 0) {
            avgStageTimes = stageData[0];
        }
    }

    return {
        timeframe: `${timeframeDays} days`,
        bottleneckFrequency: bottlenecks,
        avgStageTimes,
        recommendations: generateBottleneckRecommendations(bottlenecks, avgStageTimes)
    };
}

// Helper function to get SLA compliance
async function getSLACompliance(supabaseUrl, serviceRoleKey, timeframeDays) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeframeDays));

    const complianceResponse = await fetch(`${supabaseUrl}/rest/v1/processing_analytics?created_at=gte.${startDate.toISOString()}&select=exceeded_sla,count()`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        }
    });

    if (!complianceResponse.ok) {
        throw new Error('Failed to fetch SLA compliance data');
    }

    const compliance = await complianceResponse.json();
    const totalOrders = compliance.reduce((sum, item) => sum + item.count, 0);
    const violations = compliance.find(item => item.exceeded_sla)?.count || 0;
    const complianceRate = totalOrders > 0 ? ((totalOrders - violations) / totalOrders) * 100 : 100;

    return {
        timeframe: `${timeframeDays} days`,
        totalOrders,
        violations,
        complianceRate,
        trend: 'stable' // Could be calculated based on historical data
    };
}

// Helper function to get real-time metrics
async function getRealTimeMetrics(supabaseUrl, serviceRoleKey) {
    const today = new Date().toISOString().split('T')[0];

    // Get today's orders
    const todayOrdersResponse = await fetch(`${supabaseUrl}/rest/v1/orders?created_at=gte.${today}&select=status,count()`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        }
    });

    let todayOrders = {};
    if (todayOrdersResponse.ok) {
        const data = await todayOrdersResponse.json();
        todayOrders = data.reduce((acc, item) => {
            acc[item.status] = item.count;
            return acc;
        }, {});
    }

    // Get active exceptions
    const exceptionsResponse = await fetch(`${supabaseUrl}/rest/v1/order_exceptions?status=neq.resolved&select=severity,count()`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        }
    });

    let activeExceptions = {};
    if (exceptionsResponse.ok) {
        const data = await exceptionsResponse.json();
        activeExceptions = data.reduce((acc, item) => {
            acc[item.severity] = item.count;
            return acc;
        }, {});
    }

    // Get current queue length
    const queueResponse = await fetch(`${supabaseUrl}/rest/v1/order_priority_queue?queue_status=eq.waiting&select=count()`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        }
    });

    let queueLength = 0;
    if (queueResponse.ok) {
        const data = await queueResponse.json();
        queueLength = data[0]?.count || 0;
    }

    return {
        timestamp: new Date().toISOString(),
        todayOrders,
        activeExceptions,
        queueLength,
        systemStatus: 'operational' // Could be determined based on various factors
    };
}

// Utility functions
function calculateStageTimings(order, statusHistory) {
    const timings = {
        paymentToProcessing: 0,
        processingToProduction: 0,
        productionToQuality: 0,
        qualityToShipping: 0,
        shippingToDelivery: 0
    };

    // Calculate based on status history
    const sortedHistory = statusHistory.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    
    for (let i = 0; i < sortedHistory.length - 1; i++) {
        const current = sortedHistory[i];
        const next = sortedHistory[i + 1];
        const duration = (new Date(next.created_at) - new Date(current.created_at)) / (1000 * 60); // minutes
        
        if (current.new_status === 'payment_confirmed' && next.new_status === 'processing') {
            timings.paymentToProcessing = duration;
        } else if (current.new_status === 'processing' && next.new_status === 'in_production') {
            timings.processingToProduction = duration;
        } else if (current.new_status === 'in_production' && next.new_status === 'quality_check') {
            timings.productionToQuality = duration;
        } else if (current.new_status === 'quality_check' && next.new_status === 'shipped') {
            timings.qualityToShipping = duration;
        } else if (current.new_status === 'shipped' && next.new_status === 'delivered') {
            timings.shippingToDelivery = duration;
        }
    }

    return timings;
}

function calculateTotalFulfillmentTime(order) {
    if (order.delivered_at && order.created_at) {
        return (new Date(order.delivered_at) - new Date(order.created_at)) / (1000 * 60); // minutes
    }
    return 0;
}

function calculateEfficiencyScore(stageTimings, totalTime, order) {
    // Base score calculation (simplified)
    let score = 100;
    
    // Deduct points for long processing times
    const baselineTotal = getSLATarget(order);
    if (totalTime > baselineTotal) {
        score -= Math.min(50, (totalTime - baselineTotal) / baselineTotal * 100);
    }
    
    // Bonus for rush orders completed on time
    if (order.is_rush_order && totalTime <= baselineTotal * 0.8) {
        score += 10;
    }
    
    return Math.max(0, Math.min(100, score));
}

function identifyBottleneckStage(stageTimings) {
    const stages = {
        'payment_processing': stageTimings.paymentToProcessing,
        'production': stageTimings.processingToProduction + stageTimings.productionToQuality,
        'quality_shipping': stageTimings.qualityToShipping,
        'delivery': stageTimings.shippingToDelivery
    };
    
    return Object.keys(stages).reduce((a, b) => stages[a] > stages[b] ? a : b);
}

function getSLATarget(order) {
    // SLA targets in minutes
    if (order.is_rush_order) return 2880; // 48 hours
    if (order.order_priority === 'high') return 4320; // 72 hours
    return 7200; // 120 hours (5 days)
}

async function calculatePerformanceComparison(supabaseUrl, serviceRoleKey, order, totalTime) {
    // Get average time for similar orders
    const similarOrdersResponse = await fetch(`${supabaseUrl}/rest/v1/processing_analytics?select=total_fulfillment_minutes.avg()&limit=100`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        }
    });
    
    let averageTime = 4320; // Default 72 hours
    if (similarOrdersResponse.ok) {
        const data = await similarOrdersResponse.json();
        averageTime = data[0]?.avg || 4320;
    }
    
    const vsAverage = ((totalTime - averageTime) / averageTime) * 100;
    
    return {
        averageTime,
        vsAverage,
        performance: vsAverage < -10 ? 'excellent' : vsAverage < 10 ? 'good' : 'needs_improvement'
    };
}

function countQualityIssues(statusHistory) {
    return statusHistory.filter(h => h.is_exception && h.exception_type?.includes('quality')).length;
}

function checkReprocessingRequired(statusHistory) {
    return statusHistory.some(h => h.status_reason?.includes('reprocess') || h.status_reason?.includes('redo'));
}

function generateBottleneckRecommendations(bottlenecks, avgStageTimes) {
    const recommendations = [];
    
    // Analyze most common bottlenecks
    const topBottleneck = bottlenecks.reduce((max, current) => 
        current.count > max.count ? current : max, { count: 0 }
    );
    
    if (topBottleneck.bottleneck_stage === 'production') {
        recommendations.push('Consider adding production capacity or optimizing workflow');
    } else if (topBottleneck.bottleneck_stage === 'quality_shipping') {
        recommendations.push('Review quality control processes for efficiency improvements');
    }
    
    return recommendations;
}