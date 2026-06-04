import { readDb, writeDb } from './db';
import { AppNotification } from '../src/types';

const RESEND_API_KEY = 're_eK8XBEiJ_4Hz6SiTcmgNYRiAPSmsrJMkz';

/**
 * Sends a real email notification via Resend.
 */
export async function sendEmailNotification(to: string, subject: string, htmlContent: string): Promise<boolean> {
  console.log(`[Notifier] Attempting to send email via Resend to: ${to}`);
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Amdox Nexus AI <onboarding@resend.dev>',
        to: [to],
        subject: subject,
        html: htmlContent
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`[Notifier] Resend email dispatched successfully. ID: ${data.id}`);
      return true;
    } else {
      const errorText = await response.text();
      console.warn(`[Notifier] Resend API returned error status ${response.status}:`, errorText);
      return false;
    }
  } catch (error) {
    console.error('[Notifier] Exception occurred while sending email through Resend API:', error);
    return false;
  }
}

/**
 * Triggers an integrated in-app + email notification alert
 */
export async function triggerNotification(params: {
  tenantId: string | null;
  userId: string | null;
  message: string;
  type: 'info' | 'warning' | 'success';
  sendEmail?: boolean;
  emailRecipient?: string;
  emailSubject?: string;
}) {
  const db = readDb();
  
  // Create the in-app notification record
  const newNotif: AppNotification = {
    id: `notif-${Date.now()}-${Math.round(Math.random() * 1000)}`,
    tenantId: params.tenantId,
    userId: params.userId,
    message: params.message,
    type: params.type,
    isRead: false,
    createdAt: new Date().toISOString()
  };

  db.notifications.unshift(newNotif);
  writeDb();

  // If email dispatch is requested
  if (params.sendEmail && params.emailRecipient) {
    const defaultSubject = `[Amdox Nexus AI] Notification Event`;
    const headerColor = params.type === 'success' ? '#10B981' : params.type === 'warning' ? '#F59E0B' : '#3B82F6';
    
    const formattedHtml = `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #E5E7EB; border-radius: 8px;">
        <div style="background-color: ${headerColor}; color: white; padding: 16px; border-radius: 6px; text-align: center; margin-bottom: 24px;">
          <h2 style="margin: 0; font-size: 20px;">Amdox Nexus ERP Core Alert</h2>
          <p style="margin: 4px 0 0 0; font-size: 13px;">${params.type.toUpperCase()} / Enterprise System Event</p>
        </div>
        <p style="font-size: 15px; color: #1F2937; line-height: 1.6;">${params.message}</p>
        <hr style="border: 0; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
        <div style="text-align: center; font-size: 11px; color: #9CA3AF;">
          <p style="margin: 0;">This is an algorithmic transaction notification from your corporate Amdox Nexus AI Platform deployment.</p>
          <p style="margin: 4px 0 0 0;">Tenant: ${params.tenantId || 'Nexus Global'}</p>
        </div>
      </div>
    `;

    // Fire-and-forget in background to not block main thread
    sendEmailNotification(params.emailRecipient, params.emailSubject || defaultSubject, formattedHtml)
      .then(success => {
        if (success) {
          console.log(`[Notifier] Background email successfully delivered to ${params.emailRecipient}`);
        } else {
          console.warn(`[Notifier] Background email delivery failed for ${params.emailRecipient}`);
        }
      })
      .catch(err => {
        console.error('[Notifier] Async mailer failure: ', err);
      });
  }
}
