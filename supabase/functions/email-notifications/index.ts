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
    const { email_type, recipient_email, data } = await req.json();

    if (!email_type || !recipient_email) {
      throw new Error('email_type and recipient_email are required');
    }

    // Get environment variables
    const sendgridApiKey = Deno.env.get('SENDGRID_API_KEY');
    const fromEmail = Deno.env.get('SENDGRID_FROM_EMAIL') || Deno.env.get('EMAIL_FROM');
    
    if (!sendgridApiKey) {
      throw new Error('SendGrid API key not configured');
    }

    if (!fromEmail) {
      throw new Error('From email not configured');
    }

    // Email templates
    const emailTemplates = {
      'profile_completion_reminder': {
        subject: 'Complete Your Profile for Better Recommendations',
        template: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Complete Your Style Profile</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Get personalized menswear recommendations</p>
            </div>
            
            <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="color: #334155; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Hello ${data?.first_name || 'there'},</p>
              
              <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
                We noticed your profile is <strong>${data?.completion_percentage || 0}% complete</strong>. 
                Complete your measurements and style preferences to get personalized recommendations for:
              </p>
              
              <ul style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 25px 20px;">
                <li>Perfect-fitting suits and formal wear</li>
                <li>Style recommendations based on your preferences</li>
                <li>Seasonal clothing suggestions</li>
                <li>Exclusive offers for your customer tier</li>
              </ul>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data?.profile_url || 'https://r7l04rp7iyef.space.minimax.io'}" 
                   style="background: #1e293b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                  Complete Profile
                </a>
              </div>
              
              <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px; color: #64748b; font-size: 13px; text-align: center;">
                <p style="margin: 0;">Need help? Contact our style consultants at support@menswear.com</p>
              </div>
            </div>
          </div>
        `
      },
      
      'style_recommendations_update': {
        subject: 'New Style Recommendations Just for You',
        template: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: bold;">New Style Recommendations</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Curated specifically for your style</p>
            </div>
            
            <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="color: #334155; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Hello ${data?.first_name || 'there'},</p>
              
              <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
                Based on your updated style profile, we have new recommendations perfect for your 
                <strong>${data?.style_personality || 'unique'}</strong> style:
              </p>
              
              ${data?.recommendations ? data.recommendations.map((rec: any) => `
                <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 0 0 15px 0;">
                  <h3 style="color: #1e293b; margin: 0 0 10px 0; font-size: 18px;">${rec.title}</h3>
                  <p style="color: #64748b; margin: 0; font-size: 14px;">${rec.description}</p>
                  ${rec.size ? `<span style="background: #f1f5f9; color: #475569; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; margin-top: 10px; display: inline-block;">Size: ${rec.size}</span>` : ''}
                </div>
              `).join('') : ''}
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data?.recommendations_url || 'https://r7l04rp7iyef.space.minimax.io'}" 
                   style="background: #7c3aed; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                  View All Recommendations
                </a>
              </div>
              
              <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px; color: #64748b; font-size: 13px; text-align: center;">
                <p style="margin: 0;">Update your preferences anytime in your profile settings</p>
              </div>
            </div>
          </div>
        `
      },
      
      'measurement_reminder': {
        subject: 'Add Your Measurements for Perfect Fit',
        template: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Complete Your Measurements</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Ensure the perfect fit every time</p>
            </div>
            
            <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="color: #334155; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Hello ${data?.first_name || 'there'},</p>
              
              <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
                To ensure you get the perfect fit, we need a few key measurements. 
                Our measurement guide makes it easy to get accurate results.
              </p>
              
              <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
                <p style="color: #065f46; margin: 0; font-weight: bold;">Quick Tip:</p>
                <p style="color: #047857; margin: 5px 0 0 0; font-size: 14px;">Have someone help you measure for the most accurate results, or visit our store for professional measuring.</p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data?.measurements_url || 'https://r7l04rp7iyef.space.minimax.io'}" 
                   style="background: #059669; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                  Add Measurements
                </a>
              </div>
              
              <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px; color: #64748b; font-size: 13px; text-align: center;">
                <p style="margin: 0;">Questions about measuring? Our team is here to help!</p>
              </div>
            </div>
          </div>
        `
      },
      
      'welcome': {
        subject: 'Welcome to Our Menswear Community',
        template: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Welcome!</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your style journey begins here</p>
            </div>
            
            <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="color: #334155; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Hello ${data?.first_name || 'there'},</p>
              
              <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
                Welcome to our enhanced profile system! We're excited to help you discover your perfect style and ensure every piece fits you perfectly.
              </p>
              
              <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #1e293b; margin: 0 0 15px 0; font-size: 18px;">Get Started:</h3>
                <ul style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
                  <li style="margin-bottom: 8px;">Complete your profile information</li>
                  <li style="margin-bottom: 8px;">Add your measurements for perfect fits</li>
                  <li style="margin-bottom: 8px;">Set your style preferences</li>
                  <li>Discover personalized recommendations</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data?.profile_url || 'https://r7l04rp7iyef.space.minimax.io'}" 
                   style="background: #1e293b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                  Complete Your Profile
                </a>
              </div>
              
              <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px; color: #64748b; font-size: 13px; text-align: center;">
                <p style="margin: 0;">Questions? Contact us at support@menswear.com</p>
              </div>
            </div>
          </div>
        `
      }
    };

    const template = emailTemplates[email_type as keyof typeof emailTemplates];
    if (!template) {
      throw new Error(`Unknown email type: ${email_type}`);
    }

    // Prepare SendGrid email payload
    const emailData = {
      personalizations: [
        {
          to: [{ email: recipient_email }],
          subject: template.subject
        }
      ],
      from: { email: fromEmail, name: 'KCT Menswear' },
      content: [
        {
          type: 'text/html',
          value: template.template
        }
      ]
    };

    // Send email via SendGrid API
    const sendgridResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendgridApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    });

    if (!sendgridResponse.ok) {
      const errorText = await sendgridResponse.text();
      console.error('SendGrid API error:', errorText);
      throw new Error(`Failed to send email: ${sendgridResponse.status} - ${errorText}`);
    }

    // Log email sent for debugging
    console.log(`Email sent successfully: ${email_type} to ${recipient_email}`);

    // Return success response
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Email sent successfully',
      email_type,
      recipient: recipient_email
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Email service error:', error);
    const errorResponse = {
      success: false,
      error: {
        code: 'EMAIL_SEND_FAILED',
        message: error.message
      }
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});