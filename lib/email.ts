/**
 * Email Service using Resend
 * Handles invoice and notification emails
 */

import { supabase } from './supabase';

// ============================================================================
// TYPES
// ============================================================================

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: string; // Base64 encoded
  }>;
}

interface InvoiceEmailData {
  customerEmail: string;
  customerName: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  pdfBase64?: string;
}

interface ShipmentNotificationData {
  customerEmail: string;
  customerName: string;
  awbNumber: string;
  status: string;
  trackingUrl: string;
}

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

const emailTemplates = {
  invoiceCreated: (data: InvoiceEmailData) => ({
    subject: `Invoice ${data.invoiceNumber} from TAC`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; }
          .footer { background: #1e1b4b; color: #94a3b8; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 8px 8px; }
          .amount { font-size: 32px; font-weight: bold; color: #7c3aed; }
          .btn { display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">TAC</h1>
            <p style="margin: 10px 0 0;">Invoice Generated</p>
          </div>
          <div class="content">
            <p>Dear ${data.customerName},</p>
            <p>A new invoice has been generated for your shipments.</p>
            
            <div class="details">
              <div class="detail-row">
                <span>Invoice Number</span>
                <strong>${data.invoiceNumber}</strong>
              </div>
              <div class="detail-row">
                <span>Amount Due</span>
                <span class="amount">₹${data.amount.toLocaleString('en-IN')}</span>
              </div>
              <div class="detail-row">
                <span>Due Date</span>
                <strong>${data.dueDate}</strong>
              </div>
            </div>
            
            <p>Please find the invoice attached to this email or download it from your portal.</p>
            
            <a href="https://portal.tapancargo.com/invoices" class="btn">View in Portal</a>
          </div>
          <div class="footer">
            <p>TAC - Enterprise Logistics Platform</p>
            <p>This is an automated email. Please do not reply directly.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  shipmentUpdate: (data: ShipmentNotificationData) => ({
    subject: `Shipment Update: ${data.awbNumber} - ${data.status.replace(/_/g, ' ')}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; }
          .footer { background: #1e1b4b; color: #94a3b8; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 8px 8px; }
          .status { display: inline-block; background: #10b981; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; }
          .btn { display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .awb { font-family: monospace; font-size: 18px; background: #e2e8f0; padding: 10px 20px; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">TAC</h1>
            <p style="margin: 10px 0 0;">Shipment Update</p>
          </div>
          <div class="content">
            <p>Dear ${data.customerName},</p>
            <p>Your shipment status has been updated.</p>
            
            <p style="text-align: center; margin: 30px 0;">
              <span class="awb">${data.awbNumber}</span>
            </p>
            
            <p style="text-align: center;">
              <span class="status">${data.status.replace(/_/g, ' ')}</span>
            </p>
            
            <p style="text-align: center;">
              <a href="${data.trackingUrl}" class="btn">Track Shipment</a>
            </p>
          </div>
          <div class="footer">
            <p>TAC - Enterprise Logistics Platform</p>
            <p>Track anytime at: ${data.trackingUrl}</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),
};

// ============================================================================
// EMAIL SERVICE
// ============================================================================

/**
 * Send email via Supabase Edge Function (Resend)
 */
export const sendEmail = async (
  options: EmailOptions
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase.functions.invoke('send-email', {
      body: options,
    });

    if (error) {
      console.error('[Email] Failed to send:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('[Email] Exception:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Send invoice email with PDF attachment
 */
export const sendInvoiceEmail = async (
  data: InvoiceEmailData
): Promise<{ success: boolean; error?: string }> => {
  const template = emailTemplates.invoiceCreated(data);

  return sendEmail({
    to: data.customerEmail,
    subject: template.subject,
    html: template.html,
    attachments: data.pdfBase64
      ? [
        {
          filename: `invoice-${data.invoiceNumber}.pdf`,
          content: data.pdfBase64,
        },
      ]
      : undefined,
  });
};

/**
 * Send shipment update notification
 */
export const sendShipmentNotification = async (
  data: ShipmentNotificationData
): Promise<{ success: boolean; error?: string }> => {
  const template = emailTemplates.shipmentUpdate(data);

  return sendEmail({
    to: data.customerEmail,
    subject: template.subject,
    html: template.html,
  });
};

// ============================================================================
// CONFIGURATION CHECK
// ============================================================================

/**
 * Check if email service is configured
 */
export const isEmailConfigured = (): boolean => {
  // Email is configured if the Resend feature flag is enabled
  // This should be checked before attempting to send emails
  return import.meta.env.VITE_RESEND_CONFIGURED === 'true';
};
