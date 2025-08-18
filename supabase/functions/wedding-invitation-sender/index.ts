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
        const requestData = await req.json();
        const { wedding_id, invitations } = requestData;

        // Validate required fields
        if (!wedding_id || !invitations || !Array.isArray(invitations)) {
            throw new Error('Missing required fields: wedding_id and invitations array');
        }

        const sendgridApiKey = Deno.env.get('SENDGRID_API_KEY');
        if (!sendgridApiKey) {
            throw new Error('SendGrid API key not configured');
        }

        const results = [];
        
        for (const invitation of invitations) {
            const { email, first_name, last_name, role, invite_code, custom_message } = invitation;
            
            if (!email || !invite_code) {
                results.push({
                    email,
                    success: false,
                    error: 'Missing email or invite_code'
                });
                continue;
            }

            try {
                // Send email via SendGrid
                const emailResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${sendgridApiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        from: {
                            email: 'weddings@kctmenswear.com',
                            name: 'KCT Menswear Wedding Team'
                        },
                        to: [{ email, name: `${first_name || ''} ${last_name || ''}`.trim() }],
                        subject: 'You\'re Invited to Join Our Wedding Party!',
                        html: `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                <h2 style="color: #2C3E50;">Wedding Party Invitation</h2>
                                <p>Dear ${first_name || 'Friend'},</p>
                                <p>You've been invited to join our wedding party as <strong>${role}</strong>!</p>
                                ${custom_message ? `<p><em>${custom_message}</em></p>` : ''}
                                <p>Please click the link below to accept your invitation and get started with your measurements and outfit selection:</p>
                                <a href="https://qs4j1oh0oweu.space.minimax.io?invite=${invite_code}" 
                                   style="background-color: #3498DB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
                                    Accept Invitation
                                </a>
                                <p>We're excited to have you as part of this special day!</p>
                                <p>Best regards,<br>The KCT Menswear Wedding Team</p>
                            </div>
                        `
                    })
                });

                if (emailResponse.ok) {
                    results.push({
                        email,
                        success: true,
                        invite_code
                    });
                } else {
                    const errorText = await emailResponse.text();
                    results.push({
                        email,
                        success: false,
                        error: `SendGrid error: ${errorText}`
                    });
                }
            } catch (error) {
                results.push({
                    email,
                    success: false,
                    error: error.message
                });
            }
        }

        const successCount = results.filter(r => r.success).length;
        const response = {
            success: true,
            sent_count: successCount,
            total_count: invitations.length,
            results
        };

        return new Response(JSON.stringify(response), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        const errorResponse = {
            error: {
                code: 'INVITATION_SENDER_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});