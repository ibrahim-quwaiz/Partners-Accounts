import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

function getGmailTransporter() {
  if (transporter) return transporter;
  
  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
  
  if (!gmailUser || !gmailAppPassword) {
    throw new Error('Gmail credentials not configured (GMAIL_USER and GMAIL_APP_PASSWORD required)');
  }
  
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailAppPassword,
    },
  });
  
  return transporter;
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
    const transport = getGmailTransporter();
    const gmailUser = process.env.GMAIL_USER;
    
    await transport.sendMail({
      from: gmailUser,
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html || params.text,
    });
    
    return { success: true };
  } catch (error: any) {
    console.error('Gmail error:', error);
    return { 
      success: false, 
      error: error.message || 'فشل إرسال البريد الإلكتروني' 
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
