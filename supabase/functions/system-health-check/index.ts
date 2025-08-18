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
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error('Supabase configuration missing');
        }

        const healthChecks = {
            timestamp: new Date().toISOString(),
            environment: 'production',
            checks: {}
        };

        // 1. Check shipping package templates
        try {
            const templatesResponse = await fetch(`${supabaseUrl}/rest/v1/shipping_package_templates?select=count`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Prefer': 'count=exact'
                }
            });

            const templateCount = parseInt(templatesResponse.headers.get('Content-Range')?.split('/')[1] || '0');
            
            healthChecks.checks.package_templates = {
                status: templateCount >= 11 ? 'healthy' : 'warning',
                count: templateCount,
                expected: 11,
                message: templateCount >= 11 ? 'All package templates available' : `Only ${templateCount}/11 templates found`
            };
        } catch (error) {
            healthChecks.checks.package_templates = {
                status: 'error',
                message: `Failed to check package templates: ${error.message}`
            };
        }

        // 2. Check essential database tables
        const tablesToCheck = ['orders', 'order_items', 'customers', 'email_logs'];
        
        for (const table of tablesToCheck) {
            try {
                const response = await fetch(`${supabaseUrl}/rest/v1/${table}?select=count&limit=1`, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Prefer': 'count=exact'
                    }
                });

                if (response.ok) {
                    healthChecks.checks[`table_${table}`] = {
                        status: 'healthy',
                        message: `Table ${table} accessible`
                    };
                } else {
                    healthChecks.checks[`table_${table}`] = {
                        status: 'error',
                        message: `Table ${table} not accessible: ${response.status}`
                    };
                }
            } catch (error) {
                healthChecks.checks[`table_${table}`] = {
                    status: 'error',
                    message: `Failed to check table ${table}: ${error.message}`
                };
            }
        }

        // 3. Check Edge Functions availability
        const functionsToCheck = ['shipping-template-recommendation', 'send-email', 'shipping-rates'];
        
        for (const func of functionsToCheck) {
            try {
                const response = await fetch(`${supabaseUrl}/functions/v1/${func}`, {
                    method: 'OPTIONS',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                });

                healthChecks.checks[`function_${func}`] = {
                    status: response.ok ? 'healthy' : 'warning',
                    message: response.ok ? `Function ${func} available` : `Function ${func} may not be deployed`
                };
            } catch (error) {
                healthChecks.checks[`function_${func}`] = {
                    status: 'error',
                    message: `Failed to check function ${func}: ${error.message}`
                };
            }
        }

        // 4. Overall health assessment
        const allChecks = Object.values(healthChecks.checks);
        const errorCount = allChecks.filter(check => check.status === 'error').length;
        const warningCount = allChecks.filter(check => check.status === 'warning').length;
        
        healthChecks.overall_status = errorCount > 0 ? 'unhealthy' : 
                                    warningCount > 0 ? 'degraded' : 'healthy';
        
        healthChecks.summary = {
            total_checks: allChecks.length,
            healthy: allChecks.filter(check => check.status === 'healthy').length,
            warnings: warningCount,
            errors: errorCount
        };

        return new Response(JSON.stringify({
            data: healthChecks
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: healthChecks.overall_status === 'healthy' ? 200 : 
                   healthChecks.overall_status === 'degraded' ? 206 : 500
        });

    } catch (error) {
        console.error('Health check error:', error);

        const errorResponse = {
            error: {
                code: 'HEALTH_CHECK_FAILED',
                message: error.message,
                timestamp: new Date().toISOString()
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});