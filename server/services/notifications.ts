import sgMail from '@sendgrid/mail';

let connectionSettings: any;

async function getSendGridCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=sendgrid',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key || !connectionSettings.settings.from_email)) {
    throw new Error('SendGrid not connected');
  }
  return { apiKey: connectionSettings.settings.api_key, email: connectionSettings.settings.from_email };
}

async function getUncachableSendGridClient() {
  const { apiKey, email } = await getSendGridCredentials();
  sgMail.setApiKey(apiKey);
  return {
    client: sgMail,
    fromEmail: email
  };
}

export interface SendEmailParams {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface SendWhatsAppParams {
  to: string;
  body: string;
}

export interface NotificationResult {
  emailSent: boolean;
  whatsappSent: boolean;
  emailError?: string;
  whatsappError?: string;
}

export async function sendEmail(params: SendEmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    const { client, fromEmail } = await getUncachableSendGridClient();
    
    await client.send({
      to: params.to,
      from: fromEmail,
      subject: params.subject,
      text: params.text,
      html: params.html || params.text,
    });
    
    return { success: true };
  } catch (error: any) {
    console.error('SendGrid error:', error);
    return { 
      success: false, 
      error: error.response?.body?.errors?.[0]?.message || error.message || 'فشل إرسال البريد الإلكتروني' 
    };
  }
}

export async function sendWhatsApp(params: SendWhatsAppParams): Promise<{ success: boolean; error?: string }> {
  const instanceId = process.env.ULTRAMSG_INSTANCE_ID;
  const token = process.env.ULTRAMSG_TOKEN;
  
  if (!instanceId || !token) {
    return { success: false, error: 'Ultramsg credentials not configured' };
  }
  
  try {
    const url = `https://api.ultramsg.com/${instanceId}/messages/chat`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        token: token,
        to: params.to,
        body: params.body,
      }),
    });
    
    const result = await response.json();
    
    if (result.sent === 'true' || result.sent === true) {
      return { success: true };
    } else {
      return { 
        success: false, 
        error: result.message || result.error || 'فشل إرسال رسالة الواتساب' 
      };
    }
  } catch (error: any) {
    console.error('Ultramsg error:', error);
    return { success: false, error: error.message || 'فشل إرسال رسالة الواتساب' };
  }
}

export async function sendNotification(
  emailParams: SendEmailParams | null,
  whatsappParams: SendWhatsAppParams | null
): Promise<NotificationResult> {
  const result: NotificationResult = {
    emailSent: false,
    whatsappSent: false,
  };
  
  if (emailParams) {
    const emailResult = await sendEmail(emailParams);
    result.emailSent = emailResult.success;
    if (!emailResult.success) {
      result.emailError = emailResult.error;
    }
  }
  
  if (whatsappParams) {
    const whatsappResult = await sendWhatsApp(whatsappParams);
    result.whatsappSent = whatsappResult.success;
    if (!whatsappResult.success) {
      result.whatsappError = whatsappResult.error;
    }
  }
  
  return result;
}
