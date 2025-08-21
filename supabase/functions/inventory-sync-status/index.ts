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
        // Get Supabase configuration
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Missing required environment variables');
        }

        // Get recent sync history (last 20 syncs)
        const syncHistoryResponse = await fetch(
            `${supabaseUrl}/rest/v1/inventory_sync_log?order=started_at.desc&limit=20`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );

        if (!syncHistoryResponse.ok) {
            throw new Error('Failed to fetch sync history');
        }

        const syncHistory = await syncHistoryResponse.json();

        // Get currently running syncs
        const runningSync = syncHistory.find(sync => sync.status === 'running');

        // Get last completed sync
        const lastCompletedSync = syncHistory.find(sync => sync.status === 'completed');

        // Get last failed sync
        const lastFailedSync = syncHistory.find(sync => sync.status === 'failed');

        // Calculate next scheduled sync time (Tuesdays and Fridays at 6 AM)
        const nextScheduledSync = calculateNextScheduledSync();

        // Get sync statistics for the last 30 days
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const recentSyncs = syncHistory.filter(sync => sync.started_at >= thirtyDaysAgo);
        
        const stats = {
            totalSyncs: recentSyncs.length,
            successfulSyncs: recentSyncs.filter(sync => sync.status === 'completed').length,
            failedSyncs: recentSyncs.filter(sync => sync.status === 'failed').length,
            scheduledSyncs: recentSyncs.filter(sync => sync.sync_type === 'scheduled').length,
            manualSyncs: recentSyncs.filter(sync => sync.sync_type === 'manual').length,
            totalProductsSynced: recentSyncs.reduce((sum, sync) => sum + (sync.products_synced || 0), 0),
            averageSyncDuration: calculateAverageDuration(recentSyncs.filter(sync => sync.completed_at))
        };

        // Check if manual refresh is available (not rate limited)
        const canManualRefresh = await checkManualRefreshAvailability(supabaseUrl, serviceRoleKey);

        // Get total vendor products count
        const vendorProductsResponse = await fetch(
            `${supabaseUrl}/rest/v1/vendor_products?select=count`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Prefer': 'count=exact'
                }
            }
        );

        let totalVendorProducts = 0;
        if (vendorProductsResponse.ok) {
            const countHeader = vendorProductsResponse.headers.get('content-range');
            if (countHeader) {
                totalVendorProducts = parseInt(countHeader.split('/')[1]) || 0;
            }
        }

        // Get inventory health metrics
        const inventoryHealthResponse = await fetch(
            `${supabaseUrl}/rest/v1/vendor_inventory_levels?select=available,last_change_at`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );

        let inventoryHealth = {
            totalItems: 0,
            inStock: 0,
            outOfStock: 0,
            lowStock: 0,
            lastUpdated: null
        };

        if (inventoryHealthResponse.ok) {
            const inventoryData = await inventoryHealthResponse.json();
            inventoryHealth = {
                totalItems: inventoryData.length,
                inStock: inventoryData.filter(item => item.available > 5).length,
                outOfStock: inventoryData.filter(item => item.available === 0).length,
                lowStock: inventoryData.filter(item => item.available > 0 && item.available <= 5).length,
                lastUpdated: inventoryData.length > 0 ? 
                    Math.max(...inventoryData.map(item => new Date(item.last_change_at || 0).getTime())) : null
            };
            
            if (inventoryHealth.lastUpdated) {
                inventoryHealth.lastUpdated = new Date(inventoryHealth.lastUpdated).toISOString();
            }
        }

        const statusData = {
            currentStatus: {
                isRunning: !!runningSync,
                runningSync: runningSync ? {
                    id: runningSync.id,
                    type: runningSync.sync_type,
                    startedAt: runningSync.started_at,
                    productsProcessed: runningSync.products_synced || 0,
                    triggeredBy: runningSync.triggered_by
                } : null
            },
            lastSync: {
                completed: lastCompletedSync ? {
                    id: lastCompletedSync.id,
                    type: lastCompletedSync.sync_type,
                    completedAt: lastCompletedSync.completed_at,
                    productsProcessed: lastCompletedSync.products_synced || 0,
                    duration: lastCompletedSync.completed_at && lastCompletedSync.started_at ?
                        calculateDuration(lastCompletedSync.started_at, lastCompletedSync.completed_at) : null,
                    triggeredBy: lastCompletedSync.triggered_by
                } : null,
                failed: lastFailedSync ? {
                    id: lastFailedSync.id,
                    type: lastFailedSync.sync_type,
                    failedAt: lastFailedSync.completed_at || lastFailedSync.started_at,
                    errorCount: lastFailedSync.errors_count || 0,
                    triggeredBy: lastFailedSync.triggered_by
                } : null
            },
            scheduling: {
                nextScheduledSync,
                canManualRefresh: canManualRefresh.allowed,
                manualRefreshCooldown: canManualRefresh.cooldownEndsAt
            },
            statistics: stats,
            inventoryHealth,
            totalVendorProducts,
            syncHistory: syncHistory.slice(0, 10).map(sync => ({
                id: sync.id,
                type: sync.sync_type,
                status: sync.status,
                startedAt: sync.started_at,
                completedAt: sync.completed_at,
                productsProcessed: sync.products_synced || 0,
                errorsCount: sync.errors_count || 0,
                triggeredBy: sync.triggered_by,
                duration: sync.completed_at && sync.started_at ?
                    calculateDuration(sync.started_at, sync.completed_at) : null
            }))
        };

        return new Response(JSON.stringify({ data: statusData }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Inventory sync status error:', error);

        const errorResponse = {
            error: {
                code: 'STATUS_FETCH_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// Helper function to calculate next scheduled sync (Tuesdays and Fridays at 6 AM)
function calculateNextScheduledSync() {
    const now = new Date();
    const nextSync = new Date(now);
    
    // Set to 6 AM
    nextSync.setHours(6, 0, 0, 0);
    
    // If it's already past 6 AM today, start from tomorrow
    if (now.getHours() >= 6) {
        nextSync.setDate(nextSync.getDate() + 1);
    }
    
    // Find next Tuesday (2) or Friday (5)
    while (nextSync.getDay() !== 2 && nextSync.getDay() !== 5) {
        nextSync.setDate(nextSync.getDate() + 1);
    }
    
    return nextSync.toISOString();
}

// Helper function to check manual refresh availability
async function checkManualRefreshAvailability(supabaseUrl, serviceRoleKey) {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const recentSyncResponse = await fetch(
        `${supabaseUrl}/rest/v1/inventory_sync_log?sync_type=eq.manual&started_at=gte.${fiveMinutesAgo}&order=started_at.desc&limit=1`,
        {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        }
    );

    if (recentSyncResponse.ok) {
        const recentSyncs = await recentSyncResponse.json();
        if (recentSyncs.length > 0) {
            const lastSync = recentSyncs[0];
            if (lastSync.status === 'running') {
                return { allowed: false, reason: 'sync_in_progress', cooldownEndsAt: null };
            }
            
            const cooldownEndsAt = new Date(new Date(lastSync.started_at).getTime() + 5 * 60 * 1000).toISOString();
            return { allowed: false, reason: 'rate_limited', cooldownEndsAt };
        }
    }
    
    return { allowed: true, reason: null, cooldownEndsAt: null };
}

// Helper function to calculate duration in seconds
function calculateDuration(startTime, endTime) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    return Math.round((end.getTime() - start.getTime()) / 1000);
}

// Helper function to calculate average duration
function calculateAverageDuration(completedSyncs) {
    if (completedSyncs.length === 0) return null;
    
    const totalDuration = completedSyncs.reduce((sum, sync) => {
        if (sync.started_at && sync.completed_at) {
            return sum + calculateDuration(sync.started_at, sync.completed_at);
        }
        return sum;
    }, 0);
    
    return Math.round(totalDuration / completedSyncs.length);
}