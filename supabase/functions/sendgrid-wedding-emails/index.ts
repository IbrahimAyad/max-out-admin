const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'false'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { action, wedding_id, email_type, recipient_data, template_data, schedule_data } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const sendGridApiKey = Deno.env.get('SENDGRID_API_KEY');
    const emailFrom = Deno.env.get('EMAIL_FROM') || 'weddings@kctmenswear.com';
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }
    
    if (!sendGridApiKey) {
      throw new Error('SendGrid API key not configured');
    }

    const headers = {
      'Authorization': `Bearer ${supabaseKey}`,
      'apikey': supabaseKey,
      'Content-Type': 'application/json'
    };

    switch (action) {
      case 'send_wedding_invitation': {
        const result = await sendWeddingInvitation({
          wedding_id,
          recipient_data,
          template_data
        }, sendGridApiKey, emailFrom, supabaseUrl, headers);
        
        return new Response(JSON.stringify({ data: result }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'send_measurement_reminder': {
        const result = await sendMeasurementReminder({
          wedding_id,
          recipient_data
        }, sendGridApiKey, emailFrom, supabaseUrl, headers);
        
        return new Response(JSON.stringify({ data: result }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'send_fitting_confirmation': {
        const result = await sendFittingConfirmation({
          wedding_id,
          recipient_data,
          template_data
        }, sendGridApiKey, emailFrom, supabaseUrl, headers);
        
        return new Response(JSON.stringify({ data: result }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'send_shipping_notification': {
        const result = await sendShippingNotification({
          wedding_id,
          recipient_data,
          template_data
        }, sendGridApiKey, emailFrom, supabaseUrl, headers);
        
        return new Response(JSON.stringify({ data: result }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'schedule_automated_sequence': {
        const result = await scheduleAutomatedSequence({
          wedding_id,
          email_type,
          schedule_data
        }, sendGridApiKey, emailFrom, supabaseUrl, headers);
        
        return new Response(JSON.stringify({ data: result }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'send_wedding_timeline_update': {
        const result = await sendTimelineUpdate({
          wedding_id,
          recipient_data,
          template_data
        }, sendGridApiKey, emailFrom, supabaseUrl, headers);
        
        return new Response(JSON.stringify({ data: result }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'send_bulk_party_communication': {
        const result = await sendBulkPartyCommunication({
          wedding_id,
          email_type,
          template_data
        }, sendGridApiKey, emailFrom, supabaseUrl, headers);
        
        return new Response(JSON.stringify({ data: result }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    console.error('SendGrid wedding email error:', error);
    
    return new Response(JSON.stringify({
      error: {
        code: 'EMAIL_ERROR',
        message: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Send wedding party invitation emails
async function sendWeddingInvitation(params, sendGridApiKey, emailFrom, supabaseUrl, headers) {
  const { wedding_id, recipient_data, template_data } = params;
  
  // Get wedding details
  const weddingResponse = await fetch(
    `${supabaseUrl}/rest/v1/weddings?id=eq.${wedding_id}`,
    { headers }
  );
  
  const wedding = await weddingResponse.json();
  if (!wedding[0]) {
    throw new Error('Wedding not found');
  }
  
  const weddingData = wedding[0];
  
  const emailContent = generateWeddingInvitationTemplate({
    ...template_data,
    wedding_date: weddingData.wedding_date,
    wedding_code: weddingData.wedding_code,
    venue_name: weddingData.venue_name
  });
  
  const emailData = {
    personalizations: [{
      to: [{ email: recipient_data.email, name: recipient_data.name }],
      subject: `🤵 You're Invited to Join ${template_data.couple_names}'s Wedding Party!`,
      dynamic_template_data: {
        recipient_name: recipient_data.name,
        couple_names: template_data.couple_names,
        wedding_date: new Date(weddingData.wedding_date).toLocaleDateString(),
        wedding_code: weddingData.wedding_code,
        invitation_link: `${template_data.portal_url}/join/${weddingData.wedding_code}`,
        role: recipient_data.role
      }
    }],
    from: { email: emailFrom, name: 'KCT Menswear Wedding Team' },
    content: [{
      type: 'text/html',
      value: emailContent
    }]
  };
  
  const response = await sendEmail(emailData, sendGridApiKey);
  
  // Log communication
  await logCommunication({
    wedding_id,
    recipient_email: recipient_data.email,
    email_type: 'wedding_invitation',
    subject: emailData.personalizations[0].subject,
    status: 'sent'
  }, supabaseUrl, headers);
  
  return {
    sent: true,
    recipient: recipient_data.email,
    message_id: response.message_id
  };
}

// Send measurement reminder emails
async function sendMeasurementReminder(params, sendGridApiKey, emailFrom, supabaseUrl, headers) {
  const { wedding_id, recipient_data } = params;
  
  // Get wedding and party member details
  const weddingResponse = await fetch(
    `${supabaseUrl}/rest/v1/weddings?id=eq.${wedding_id}`,
    { headers }
  );
  
  const wedding = await weddingResponse.json();
  const weddingData = wedding[0];
  
  const daysUntilWedding = Math.ceil(
    (new Date(weddingData.wedding_date) - new Date()) / (1000 * 60 * 60 * 24)
  );
  
  const emailContent = generateMeasurementReminderTemplate({
    recipient_name: recipient_data.name,
    wedding_date: weddingData.wedding_date,
    days_until_wedding: daysUntilWedding,
    portal_url: recipient_data.portal_url
  });
  
  const emailData = {
    personalizations: [{
      to: [{ email: recipient_data.email, name: recipient_data.name }],
      subject: `⏰ Measurement Reminder - ${daysUntilWedding} Days Until Wedding!`
    }],
    from: { email: emailFrom, name: 'KCT Menswear Wedding Team' },
    content: [{
      type: 'text/html',
      value: emailContent
    }]
  };
  
  const response = await sendEmail(emailData, sendGridApiKey);
  
  await logCommunication({
    wedding_id,
    recipient_email: recipient_data.email,
    email_type: 'measurement_reminder',
    subject: emailData.personalizations[0].subject,
    status: 'sent'
  }, supabaseUrl, headers);
  
  return {
    sent: true,
    recipient: recipient_data.email,
    reminder_type: 'measurement'
  };
}

// Send fitting confirmation emails
async function sendFittingConfirmation(params, sendGridApiKey, emailFrom, supabaseUrl, headers) {
  const { wedding_id, recipient_data, template_data } = params;
  
  const emailContent = generateFittingConfirmationTemplate({
    recipient_name: recipient_data.name,
    fitting_date: template_data.fitting_date,
    fitting_time: template_data.fitting_time,
    location: template_data.location,
    instructions: template_data.instructions
  });
  
  const emailData = {
    personalizations: [{
      to: [{ email: recipient_data.email, name: recipient_data.name }],
      subject: `📅 Fitting Appointment Confirmed - ${template_data.fitting_date}`
    }],
    from: { email: emailFrom, name: 'KCT Menswear Wedding Team' },
    content: [{
      type: 'text/html',
      value: emailContent
    }]
  };
  
  const response = await sendEmail(emailData, sendGridApiKey);
  
  await logCommunication({
    wedding_id,
    recipient_email: recipient_data.email,
    email_type: 'fitting_confirmation',
    subject: emailData.personalizations[0].subject,
    status: 'sent'
  }, supabaseUrl, headers);
  
  return {
    sent: true,
    recipient: recipient_data.email,
    fitting_date: template_data.fitting_date
  };
}

// Send shipping notification emails
async function sendShippingNotification(params, sendGridApiKey, emailFrom, supabaseUrl, headers) {
  const { wedding_id, recipient_data, template_data } = params;
  
  const emailContent = generateShippingNotificationTemplate({
    recipient_name: recipient_data.name,
    tracking_number: template_data.tracking_number,
    estimated_delivery: template_data.estimated_delivery,
    carrier: template_data.carrier,
    tracking_url: template_data.tracking_url
  });
  
  const emailData = {
    personalizations: [{
      to: [{ email: recipient_data.email, name: recipient_data.name }],
      subject: `📦 Your Wedding Attire Has Shipped! Tracking: ${template_data.tracking_number}`
    }],
    from: { email: emailFrom, name: 'KCT Menswear Wedding Team' },
    content: [{
      type: 'text/html',
      value: emailContent
    }]
  };
  
  const response = await sendEmail(emailData, sendGridApiKey);
  
  await logCommunication({
    wedding_id,
    recipient_email: recipient_data.email,
    email_type: 'shipping_notification',
    subject: emailData.personalizations[0].subject,
    status: 'sent'
  }, supabaseUrl, headers);
  
  return {
    sent: true,
    recipient: recipient_data.email,
    tracking_number: template_data.tracking_number
  };
}

// Schedule automated email sequence
async function scheduleAutomatedSequence(params, sendGridApiKey, emailFrom, supabaseUrl, headers) {
  const { wedding_id, email_type, schedule_data } = params;
  
  // Get all party members for the wedding
  const membersResponse = await fetch(
    `${supabaseUrl}/rest/v1/wedding_party_members?wedding_id=eq.${wedding_id}`,
    { headers }
  );
  
  const partyMembers = await membersResponse.json();
  
  const scheduledEmails = [];
  
  for (const member of partyMembers) {
    const scheduleRecord = {
      wedding_id,
      recipient_email: member.email,
      email_type,
      scheduled_date: schedule_data.send_date,
      template_data: JSON.stringify({
        member_name: member.name,
        member_role: member.role,
        ...schedule_data.template_data
      }),
      status: 'scheduled',
      created_at: new Date().toISOString()
    };
    
    await fetch(`${supabaseUrl}/rest/v1/email_queue`, {
      method: 'POST',
      headers,
      body: JSON.stringify(scheduleRecord)
    });
    
    scheduledEmails.push({
      recipient: member.email,
      scheduled_for: schedule_data.send_date,
      email_type
    });
  }
  
  return {
    scheduled_count: scheduledEmails.length,
    scheduled_emails: scheduledEmails
  };
}

// Send timeline update emails
async function sendTimelineUpdate(params, sendGridApiKey, emailFrom, supabaseUrl, headers) {
  const { wedding_id, recipient_data, template_data } = params;
  
  const emailContent = generateTimelineUpdateTemplate({
    recipient_name: recipient_data.name,
    update_type: template_data.update_type,
    message: template_data.message,
    new_deadline: template_data.new_deadline,
    action_required: template_data.action_required
  });
  
  const emailData = {
    personalizations: [{
      to: [{ email: recipient_data.email, name: recipient_data.name }],
      subject: `📋 Wedding Timeline Update - ${template_data.update_type}`
    }],
    from: { email: emailFrom, name: 'KCT Menswear Wedding Team' },
    content: [{
      type: 'text/html',
      value: emailContent
    }]
  };
  
  const response = await sendEmail(emailData, sendGridApiKey);
  
  await logCommunication({
    wedding_id,
    recipient_email: recipient_data.email,
    email_type: 'timeline_update',
    subject: emailData.personalizations[0].subject,
    status: 'sent'
  }, supabaseUrl, headers);
  
  return {
    sent: true,
    recipient: recipient_data.email,
    update_type: template_data.update_type
  };
}

// Send bulk communication to all party members
async function sendBulkPartyCommunication(params, sendGridApiKey, emailFrom, supabaseUrl, headers) {
  const { wedding_id, email_type, template_data } = params;
  
  // Get all party members
  const membersResponse = await fetch(
    `${supabaseUrl}/rest/v1/wedding_party_members?wedding_id=eq.${wedding_id}`,
    { headers }
  );
  
  const partyMembers = await membersResponse.json();
  
  const sentEmails = [];
  
  for (const member of partyMembers) {
    const personalizedContent = generatePersonalizedContent(email_type, {
      ...template_data,
      recipient_name: member.name,
      member_role: member.role
    });
    
    const emailData = {
      personalizations: [{
        to: [{ email: member.email, name: member.name }],
        subject: template_data.subject
      }],
      from: { email: emailFrom, name: 'KCT Menswear Wedding Team' },
      content: [{
        type: 'text/html',
        value: personalizedContent
      }]
    };
    
    try {
      const response = await sendEmail(emailData, sendGridApiKey);
      
      await logCommunication({
        wedding_id,
        recipient_email: member.email,
        email_type: 'bulk_communication',
        subject: template_data.subject,
        status: 'sent'
      }, supabaseUrl, headers);
      
      sentEmails.push({
        recipient: member.email,
        status: 'sent',
        message_id: response.message_id
      });
    } catch (error) {
      sentEmails.push({
        recipient: member.email,
        status: 'failed',
        error: error.message
      });
    }
  }
  
  return {
    total_sent: sentEmails.filter(e => e.status === 'sent').length,
    total_failed: sentEmails.filter(e => e.status === 'failed').length,
    details: sentEmails
  };
}

// Core email sending function
async function sendEmail(emailData, sendGridApiKey) {
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${sendGridApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(emailData)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`SendGrid API error: ${errorText}`);
  }
  
  return {
    sent: true,
    message_id: response.headers.get('x-message-id')
  };
}

// Log communication to database
async function logCommunication(data, supabaseUrl, headers) {
  await fetch(`${supabaseUrl}/rest/v1/wedding_communications`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      ...data,
      created_at: new Date().toISOString()
    })
  });
}

// Email template generators
function generateWeddingInvitationTemplate(data) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #000 0%, #333 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">🤵 Wedding Party Invitation</h1>
        <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">KCT Menswear</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin: 0 0 20px 0;">Dear ${data.recipient_name},</h2>
        
        <p style="font-size: 16px; line-height: 1.6; color: #555;">
          You've been invited to join <strong>${data.couple_names}</strong>'s wedding party! 
          We're excited to help coordinate all the formal wear for this special celebration.
        </p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #000;">
          <h3 style="margin: 0 0 15px 0; color: #333;">Wedding Details</h3>
          <p style="margin: 5px 0;"><strong>Date:</strong> ${data.wedding_date}</p>
          <p style="margin: 5px 0;"><strong>Venue:</strong> ${data.venue_name}</p>
          <p style="margin: 5px 0;"><strong>Your Role:</strong> ${data.role}</p>
          <p style="margin: 5px 0;"><strong>Wedding Code:</strong> <code style="background: #f0f0f0; padding: 2px 6px; border-radius: 4px;">${data.wedding_code}</code></p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.invitation_link}" style="background: #000; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Join Wedding Party Portal</a>
        </div>
        
        <p style="font-size: 14px; color: #666; text-align: center;">
          Questions? Contact our wedding coordination team at weddings@kctmenswear.com
        </p>
      </div>
    </div>
  `;
}

function generateMeasurementReminderTemplate(data) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #ff6b35; color: white; padding: 20px; text-align: center; border-radius: 8px;">
        <h1 style="margin: 0;">⏰ Measurement Reminder</h1>
        <p style="margin: 10px 0 0 0; font-size: 18px;">Only ${data.days_until_wedding} days until the wedding!</p>
      </div>
      
      <div style="padding: 20px; background: #f9f9f9;">
        <h2>Hi ${data.recipient_name},</h2>
        <p>We need your measurements to ensure your wedding attire fits perfectly. Please submit them as soon as possible!</p>
        
        <a href="${data.portal_url}" style="background: #ff6b35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">Submit Measurements</a>
      </div>
    </div>
  `;
}

function generateFittingConfirmationTemplate(data) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #000;">📅 Fitting Appointment Confirmed</h1>
      <p>Hi ${data.recipient_name},</p>
      <p>Your fitting appointment has been confirmed:</p>
      <ul>
        <li><strong>Date:</strong> ${data.fitting_date}</li>
        <li><strong>Time:</strong> ${data.fitting_time}</li>
        <li><strong>Location:</strong> ${data.location}</li>
      </ul>
      <p><strong>Instructions:</strong> ${data.instructions}</p>
    </div>
  `;
}

function generateShippingNotificationTemplate(data) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #000;">📦 Your Wedding Attire Has Shipped!</h1>
      <p>Hi ${data.recipient_name},</p>
      <p>Great news! Your wedding attire is on its way:</p>
      <ul>
        <li><strong>Tracking Number:</strong> ${data.tracking_number}</li>
        <li><strong>Carrier:</strong> ${data.carrier}</li>
        <li><strong>Estimated Delivery:</strong> ${data.estimated_delivery}</li>
      </ul>
      <a href="${data.tracking_url}" style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Track Your Package</a>
    </div>
  `;
}

function generateTimelineUpdateTemplate(data) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #000;">📋 Wedding Timeline Update</h1>
      <p>Hi ${data.recipient_name},</p>
      <p><strong>Update Type:</strong> ${data.update_type}</p>
      <p>${data.message}</p>
      ${data.new_deadline ? `<p><strong>New Deadline:</strong> ${data.new_deadline}</p>` : ''}
      ${data.action_required ? `<p><strong>Action Required:</strong> ${data.action_required}</p>` : ''}
    </div>
  `;
}

function generatePersonalizedContent(emailType, data) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #000;">${data.title || 'Wedding Update'}</h1>
      <p>Hi ${data.recipient_name},</p>
      <p>As our ${data.member_role}, ${data.message}</p>
      ${data.action_url ? `<a href="${data.action_url}" style="background: #000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">${data.action_text || 'Take Action'}</a>` : ''}
    </div>
  `;
}