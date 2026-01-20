import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  email: string;
  name: string;
  skinType: string;
  concerns: string[];
  recommendation: string;
}

const formatRecommendationToHtml = (recommendation: string): string => {
  let html = recommendation
    .split('\n')
    .map(line => {
      if (line.startsWith('##') || line.startsWith('**')) {
        return `<h3 style="color: #1a1a1a; margin-top: 20px; margin-bottom: 10px; font-size: 18px;">${line.replace(/[#*]/g, '').trim()}</h3>`;
      }
      if (line.trim().startsWith('-') || line.trim().match(/^\d+\./)) {
        return `<li style="color: #4a4a4a; margin-bottom: 5px;">${line.trim().replace(/^[-\d.]+\s*/, '')}</li>`;
      }
      if (line.trim()) {
        return `<p style="color: #4a4a4a; margin-bottom: 10px;">${line}</p>`;
      }
      return '';
    })
    .join('');
  
  // Wrap list items in ul tags
  html = html.replace(/(<li.*?<\/li>)+/g, '<ul style="padding-left: 20px; margin: 10px 0;">$&</ul>');
  
  return html;
};

const handler = async (req: Request): Promise<Response> => {
  console.log("send-skincare-email function called");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, skinType, concerns, recommendation }: EmailRequest = await req.json();
    
    console.log(`Sending skincare routine to: ${email}`);

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const recommendationHtml = formatRecommendationToHtml(recommendation);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "SKINLABS <onboarding@resend.dev>",
        to: [email],
        subject: "Your Personalized AI Skincare Routine 🌟",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
            <div style="background: linear-gradient(135deg, #1a1a1a 0%, #333 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: #fff; margin: 0; font-size: 28px;">SKINLABS</h1>
              <p style="color: rgba(255,255,255,0.8); margin-top: 10px; font-size: 14px;">AI-Powered Skincare Science</p>
            </div>
            
            <div style="background: #fff; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <h2 style="color: #1a1a1a; margin-top: 0;">Hi ${name || 'there'}! 👋</h2>
              
              <p style="color: #4a4a4a;">
                Thank you for subscribing to SKINLABS! We've analyzed your skin profile and created a personalized skincare routine just for you.
              </p>
              
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #666;"><strong>Your Skin Profile:</strong></p>
                <p style="margin: 5px 0; color: #333;">
                  <strong>Skin Type:</strong> ${skinType.charAt(0).toUpperCase() + skinType.slice(1)}
                </p>
                <p style="margin: 5px 0; color: #333;">
                  <strong>Concerns:</strong> ${concerns.join(', ')}
                </p>
              </div>
              
              <div style="margin: 30px 0;">
                <h2 style="color: #1a1a1a; border-bottom: 2px solid #eee; padding-bottom: 10px;">
                  ✨ Your Personalized Skincare Routine
                </h2>
                ${recommendationHtml}
              </div>
              
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px; border-radius: 8px; text-align: center; margin-top: 30px;">
                <h3 style="color: #fff; margin: 0 0 10px 0;">Ready to Start Your Skincare Journey?</h3>
                <p style="color: rgba(255,255,255,0.9); margin-bottom: 20px; font-size: 14px;">
                  Shop our recommended products and get them delivered to your door.
                </p>
                <a href="https://shop.skinlabs.co.za" style="display: inline-block; background: #fff; color: #667eea; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold;">
                  Shop Now →
                </a>
              </div>
              
              <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 12px;">
                <p>You're receiving this email because you subscribed to SKINLABS AI Skincare.</p>
                <p>© ${new Date().getFullYear()} SKINLABS. All rights reserved.</p>
                <p>
                  <a href="https://skinlabs.co.za" style="color: #667eea;">skinlabs.co.za</a> | 
                  <a href="https://shop.skinlabs.co.za" style="color: #667eea;">Shop</a>
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Resend API error:", errorText);
      throw new Error(`Failed to send email: ${errorText}`);
    }

    const emailResponse = await res.json();
    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, ...emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
