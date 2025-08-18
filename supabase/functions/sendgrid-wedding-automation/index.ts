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
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.39.3');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const sendGridApiKey = Deno.env.get('SENDGRID_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const requestData = await req.json();
    const { 
      emailType, 
      weddingId, 
      partyMemberIds, 
      customData = {},
      scheduleDate 
    } = requestData;
    
    // Validate required fields
    if (!emailType || !weddingId) {
      throw new Error('Missing required fields: emailType, weddingId');
    }
    
    // Get wedding details
    const { data: wedding, error: weddingError } = await supabase
      .from('weddings')
      .select('*')
      .eq('id', weddingId)
      .single();
      
    if (weddingError || !wedding) {
      throw new Error('Wedding not found');
    }
    
    // Get party members (if specified) or all party members
    let partyMembersQuery = supabase
      .from('wedding_party_members')
      .select(`
        *,
        user_profiles!inner(full_name, email, phone),
        wedding_outfits(*)
      `)
      .eq('wedding_id', weddingId);
      
    if (partyMemberIds && partyMemberIds.length > 0) {
      partyMembersQuery = partyMembersQuery.in('id', partyMemberIds);
    }
    
    const { data: partyMembers, error: partyError } = await partyMembersQuery;
    
    if (partyError) {
      throw new Error('Failed to fetch party members');
    }
    
    // Calculate wedding timeline data
    const weddingDate = new Date(wedding.wedding_date);
    const today = new Date();
    const daysUntilWedding = Math.ceil((weddingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    // Email template configurations
    const emailTemplates = {
      'wedding_welcome': {
        templateId: 'd-wedding-welcome-001',
        subject: `Welcome to ${wedding.couple_names} Wedding Party!`,
        description: 'Welcome email for newly created wedding',
      },
      'invitation_reminder': {
        templateId: 'd-invitation-reminder-001',
        subject: `Your invitation to ${wedding.couple_names} wedding party is waiting`,
        description: 'Reminder for pending invitations',
      },
      'measurement_reminder': {
        templateId: 'd-measurement-reminder-001',
        subject: `Time to submit your measurements - ${wedding.couple_names} wedding`,
        description: 'Reminder to submit measurements',
      },
      'outfit_approval': {
        templateId: 'd-outfit-approval-001',
        subject: `Your wedding outfit is ready for approval`,
        description: 'Outfit selection ready for approval',
      },
      'order_confirmation': {
        templateId: 'd-order-confirmation-001',
        subject: `Order confirmed for ${wedding.couple_names} wedding`,
        description: 'Payment and order confirmation',
      },
      'shipping_notification': {
        templateId: 'd-shipping-notification-001',
        subject: `Your wedding outfit is on the way!`,
        description: 'Shipping and tracking information',
      },
      'fitting_reminder': {
        templateId: 'd-fitting-reminder-001',
        subject: `Fitting appointment reminder - ${wedding.couple_names} wedding`,
        description: 'Fitting appointment scheduling and reminders',
      },
      'wedding_day_prep': {
        templateId: 'd-wedding-day-prep-001',
        subject: `Final preparations for ${wedding.couple_names} wedding`,
        description: 'Wedding day preparation instructions',
      },
      'thank_you_feedback': {
        templateId: 'd-thank-you-feedback-001',
        subject: `Thank you for being part of ${wedding.couple_names} special day`,
        description: 'Post-wedding thank you and feedback collection',
      },
    };
    
    const template = emailTemplates[emailType];
    if (!template) {
      throw new Error(`Unknown email type: ${emailType}`);
    }
    
    // Prepare SendGrid API request
    const sendGridHeaders = {
      'Authorization': `Bearer ${sendGridApiKey}`,
      'Content-Type': 'application/json',
    };
    
    const emailPromises = [];
    const emailResults = [];
    
    // Send emails to each party member
    for (const member of partyMembers || []) {
      // Prepare dynamic template data
      const templateData = {
        // Wedding details
        wedding_couple_names: wedding.couple_names,
        wedding_date: wedding.wedding_date,
        wedding_venue: wedding.venue_name || 'TBD',
        wedding_venue_address: wedding.venue_address || '',
        days_until_wedding: daysUntilWedding,
        
        // Member details
        member_name: member.user_profiles.full_name,
        member_role: member.role,
        member_email: member.user_profiles.email,
        
        // Outfit details
        outfit_name: member.wedding_outfits?.[0]?.item_name || 'TBD',
        outfit_price: member.wedding_outfits?.[0]?.rental_price || member.wedding_outfits?.[0]?.price || 0,
        
        // Portal links
        groomsmen_portal_url: 'https://qs4j1oh0oweu.space.minimax.io',
        couples_portal_url: 'https://uac9impw13rm.space.minimax.io',
        invitation_code: member.invitation_code,
        
        // Timeline data
        measurement_deadline: member.measurement_deadline,
        fitting_date: member.fitting_appointment_date,
        
        // Custom data
        ...customData,
      };
      
      // Add email-type specific data
      switch (emailType) {
        case 'shipping_notification':
          // Get tracking information
          const { data: shipment } = await supabase
            .from('order_shipments')
            .select('tracking_code, carrier, estimated_delivery_date')
            .eq('party_member_id', member.id)
            .single();
            
          if (shipment) {
            templateData.tracking_code = shipment.tracking_code;
            templateData.carrier = shipment.carrier;
            templateData.estimated_delivery = shipment.estimated_delivery_date;
          }
          break;
          
        case 'order_confirmation':
          // Get order details
          const { data: orderData } = await supabase
            .from('wedding_party_orders')
            .select(`
              amount,
              wedding_orders!inner(total_amount, group_discount_percent)
            `)
            .eq('party_member_id', member.id)
            .single();
            
          if (orderData) {
            templateData.member_amount = orderData.amount;
            templateData.total_order_amount = orderData.wedding_orders.total_amount;
            templateData.group_discount = orderData.wedding_orders.group_discount_percent;
          }
          break;
      }
      
      const emailPayload = {
        personalizations: [
          {
            to: [
              {
                email: member.user_profiles.email,
                name: member.user_profiles.full_name,
              }
            ],
            dynamic_template_data: templateData,
          }
        ],
        from: {
          email: 'wedding@kctmenswear.com',
          name: 'KCT Menswear Wedding Team',
        },
        template_id: template.templateId,
        categories: ['wedding', emailType, `wedding-${weddingId}`],
        custom_args: {
          wedding_id: weddingId.toString(),
          party_member_id: member.id.toString(),
          email_type: emailType,
        },
      };
      
      // Schedule email if date specified
      if (scheduleDate) {
        emailPayload.send_at = Math.floor(new Date(scheduleDate).getTime() / 1000);
      }
      
      const emailPromise = fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: sendGridHeaders,
        body: JSON.stringify(emailPayload),
      }).then(async (response) => {
        const result = {
          partyMemberId: member.id,
          memberName: member.user_profiles.full_name,
          memberEmail: member.user_profiles.email,
          emailType,
          success: response.ok,
          status: response.status,
        };
        
        if (!response.ok) {
          const errorText = await response.text();
          result.error = errorText;
          console.error(`Failed to send ${emailType} email to ${member.user_profiles.email}:`, errorText);
        }
        
        return result;
      }).catch((error) => {
        console.error(`Email sending error for ${member.user_profiles.email}:`, error);
        return {
          partyMemberId: member.id,
          memberName: member.user_profiles.full_name,
          memberEmail: member.user_profiles.email,
          emailType,
          success: false,
          error: error.message,
        };
      });
      
      emailPromises.push(emailPromise);
    }
    
    // Wait for all emails to be sent
    const results = await Promise.all(emailPromises);
    
    // Log email communications
    const communicationLogs = results.map(result => ({
      wedding_id: weddingId,
      party_member_id: result.partyMemberId,
      communication_type: 'email',
      email_type: emailType,
      recipient_email: result.memberEmail,
      status: result.success ? 'sent' : 'failed',
      error_message: result.error || null,
      template_id: template.templateId,
      scheduled_at: scheduleDate || null,
    }));
    
    const { error: logError } = await supabase
      .from('wedding_communications')
      .insert(communicationLogs);
      
    if (logError) {
      console.error('Failed to log email communications:', logError);
    }
    
    // Update timeline tasks if applicable
    if (['measurement_reminder', 'fitting_reminder'].includes(emailType)) {
      const { error: timelineError } = await supabase
        .from('wedding_timeline_tasks')
        .update({ 
          reminder_sent: true, 
          reminder_sent_at: new Date().toISOString() 
        })
        .eq('wedding_id', weddingId)
        .eq('task_type', emailType.replace('_reminder', ''));
        
      if (timelineError) {
        console.error('Failed to update timeline tasks:', timelineError);
      }
    }
    
    const summary = {
      totalEmails: results.length,
      successfulEmails: results.filter(r => r.success).length,
      failedEmails: results.filter(r => !r.success).length,
    };
    
    return new Response(
      JSON.stringify({
        data: {
          emailType,
          weddingId,
          template: template.description,
          results,
          summary,
          scheduledAt: scheduleDate || null,
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error('SendGrid email automation error:', error);
    
    const errorResponse = {
      error: {
        code: 'SENDGRID_EMAIL_ERROR',
        message: error.message
      }
    };
    
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});