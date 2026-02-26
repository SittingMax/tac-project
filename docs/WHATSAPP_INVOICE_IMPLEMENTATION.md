# WhatsApp Invoice Notification Implementation Guide

## Architecture Overview

TAC Cargo uses a **Vite SPA + Supabase Edge Functions** architecture. This guide details how to implement WhatsApp invoice notifications with PDF delivery using Twilio.

## Current Stack Analysis

### ✅ Existing Components
- **PDF Generation**: `lib/pdf-generator.ts` (client-side using pdf-lib)
- **Email Service**: Supabase Edge Function `send-email` (Resend API)
- **Invoice Management**: `pages/Finance.tsx`
- **Database**: Supabase PostgreSQL
- **Frontend**: Vite + React (port 3000)

### 🔧 What We Need to Build
1. Supabase Edge Function for Twilio WhatsApp
2. Secure PDF serving endpoint (Edge Function)
3. Token-based access control for PDFs
4. UI integration in Finance page

## Implementation Plan

### Phase 1: Supabase Edge Functions

#### 1.1 Create `send-whatsapp` Edge Function

**File**: `supabase/functions/send-whatsapp/index.ts`

```typescript
// @ts-nocheck - Deno Edge Function
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
const TWILIO_WHATSAPP_FROM = Deno.env.get('TWILIO_WHATSAPP_FROM'); // e.g., whatsapp:+14155238886

interface WhatsAppRequest {
  to: string; // Phone number with country code (e.g., +919876543210)
  templateName: string; // e.g., tac_invoice_notification
  variables: string[]; // Template variables [customerName, invoiceNumber, totalAmount, trackingId, pdfUrl]
}

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_FROM) {
      throw new Error('Twilio credentials not configured');
    }

    const { to, templateName, variables }: WhatsAppRequest = await req.json();

    if (!to || !templateName || !variables) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, templateName, variables' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format phone number for WhatsApp
    const whatsappTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

    // Build Twilio API request
    const formData = new URLSearchParams();
    formData.append('From', TWILIO_WHATSAPP_FROM);
    formData.append('To', whatsappTo);
    formData.append('ContentSid', templateName);
    
    // Add template variables
    variables.forEach((value, index) => {
      formData.append(`ContentVariables`, JSON.stringify({ [index + 1]: value }));
    });

    // Send via Twilio API
    const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error('[send-whatsapp] Twilio error:', result);
      return new Response(
        JSON.stringify({ error: result.message || 'Failed to send WhatsApp message' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[send-whatsapp] Message sent successfully:', result.sid);

    return new Response(
      JSON.stringify({ success: true, messageSid: result.sid }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[send-whatsapp] Exception:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

#### 1.2 Create `serve-invoice-pdf` Edge Function

**File**: `supabase/functions/serve-invoice-pdf/index.ts`

```typescript
// @ts-nocheck - Deno Edge Function
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const JWT_SECRET = Deno.env.get('JWT_SECRET') || 'your-secret-key';

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const invoiceId = url.searchParams.get('id');
    const token = url.searchParams.get('token');

    if (!invoiceId || !token) {
      return new Response('Missing invoice ID or token', { status: 400 });
    }

    // Validate token (simple HMAC-based validation)
    const expectedToken = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(`${invoiceId}:${JWT_SECRET}`)
    );
    const expectedTokenHex = Array.from(new Uint8Array(expectedToken))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    if (token !== expectedTokenHex.substring(0, 32)) {
      return new Response('Invalid token', { status: 403 });
    }

    // Fetch invoice from Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('*, customer:customers(name, phone, email)')
      .eq('id', invoiceId)
      .single();

    if (error || !invoice) {
      return new Response('Invoice not found', { status: 404 });
    }

    // Generate PDF (you'll need to implement server-side PDF generation)
    // For now, return a placeholder or redirect to client-side generation
    
    // Option A: Store PDFs in Supabase Storage and return signed URL
    // Option B: Generate PDF server-side using a library like jsPDF or puppeteer
    
    return new Response(
      JSON.stringify({
        message: 'PDF generation endpoint - implement server-side PDF generation here',
        invoice: invoice.invoice_no,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[serve-invoice-pdf] Exception:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

### Phase 2: Client-Side Integration

#### 2.1 Create WhatsApp Service

**File**: `lib/whatsapp.ts`

```typescript
import { supabase } from './supabase';
import { Invoice } from '@/types';

interface SendInvoiceWhatsAppParams {
  invoice: Invoice;
  customerPhone: string;
  customerName: string;
  pdfUrl: string;
}

export const sendInvoiceWhatsApp = async (
  params: SendInvoiceWhatsAppParams
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { invoice, customerPhone, customerName, pdfUrl } = params;

    // Format phone number (remove spaces, add country code if missing)
    const formattedPhone = customerPhone.replace(/\s/g, '');
    const phoneWithCountry = formattedPhone.startsWith('+') 
      ? formattedPhone 
      : `+91${formattedPhone}`;

    // Prepare template variables
    const variables = [
      customerName,
      invoice.invoiceNumber,
      invoice.financials.totalAmount.toString(),
      invoice.awb || 'N/A',
      pdfUrl,
    ];

    const { data, error } = await supabase.functions.invoke('send-whatsapp', {
      body: {
        to: phoneWithCountry,
        templateName: 'tac_invoice_notification',
        variables,
      },
    });

    if (error) {
      console.error('[WhatsApp] Failed to send:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('[WhatsApp] Exception:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const generateSecurePdfUrl = async (invoiceId: string): Promise<string> => {
  // Generate secure token
  const encoder = new TextEncoder();
  const data = encoder.encode(`${invoiceId}:${import.meta.env.VITE_JWT_SECRET || 'fallback'}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const token = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);

  // Build URL
  const baseUrl = import.meta.env.VITE_APP_URL || 'http://localhost:3000';
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  
  return `${supabaseUrl}/functions/v1/serve-invoice-pdf?id=${invoiceId}&token=${token}`;
};
```

#### 2.2 Update Finance Page

**File**: `pages/Finance.tsx` (add to existing file)

```typescript
import { sendInvoiceWhatsApp, generateSecurePdfUrl } from '@/lib/whatsapp';

// Add to Finance component
const handleSendWhatsAppInvoice = async (inv: Invoice) => {
  try {
    // Get customer phone from invoice or shipment
    const shipment = inv.awb ? await getShipment(inv.awb) : null;
    const phone = (inv as any).consignee?.phone || (shipment as any)?.consignee?.phone || '';
    
    if (!phone) {
      toast.error('No customer phone number found.');
      return;
    }

    const customerName = (inv as any).consignee?.name || inv.customerName || 'Customer';

    toast.info('Generating secure PDF link...');

    // Generate secure PDF URL
    const pdfUrl = await generateSecurePdfUrl(inv.id);

    toast.info('Sending WhatsApp notification...');

    // Send WhatsApp message
    const result = await sendInvoiceWhatsApp({
      invoice: inv,
      customerPhone: phone,
      customerName,
      pdfUrl,
    });

    if (result.success) {
      toast.success('Invoice sent via WhatsApp!');
    } else {
      toast.error(`Failed to send: ${result.error}`);
    }
  } catch (error) {
    console.error('[WhatsApp] Error:', error);
    toast.error('Failed to send WhatsApp notification');
  }
};

// Add button to invoice actions
<Button
  variant="outline"
  size="sm"
  onClick={() => handleSendWhatsAppInvoice(invoice)}
>
  <MessageCircle className="w-4 h-4 mr-2" />
  Send WhatsApp
</Button>
```

### Phase 3: Environment Configuration

#### 3.1 Update `.env.example`

```bash
# ============================================================================
# TWILIO CONFIGURATION (WhatsApp Notifications)
# ============================================================================
# Get from: https://console.twilio.com
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# ============================================================================
# APPLICATION CONFIGURATION
# ============================================================================
# Production URL (for PDF links in WhatsApp)
VITE_APP_URL=https://tac-cargo.vercel.app

# JWT Secret for PDF token generation
VITE_JWT_SECRET=your-random-secret-key-here
JWT_SECRET=your-random-secret-key-here
```

#### 3.2 Supabase Edge Function Secrets

Deploy secrets to Supabase:

```bash
# Set Twilio credentials
supabase secrets set TWILIO_ACCOUNT_SID=your-account-sid
supabase secrets set TWILIO_AUTH_TOKEN=your-auth-token
supabase secrets set TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
supabase secrets set JWT_SECRET=your-random-secret-key
```

### Phase 4: Deployment

#### 4.1 Deploy Edge Functions

```bash
# Deploy WhatsApp function
supabase functions deploy send-whatsapp

# Deploy PDF serving function
supabase functions deploy serve-invoice-pdf
```

#### 4.2 Development Testing with ngrok

```bash
# Start Vite dev server
npm run dev

# In another terminal, start ngrok
ngrok http 3000

# Use ngrok URL in VITE_APP_URL for testing
# Example: https://abc123.ngrok.io
```

#### 4.3 Production Deployment (Vercel)

1. Deploy to Vercel:
   ```bash
   vercel --prod
   ```

2. Set environment variables in Vercel dashboard:
   - `VITE_APP_URL`: Your Vercel URL
   - `VITE_JWT_SECRET`: Same as JWT_SECRET in Supabase

## WhatsApp Template Configuration

### Template Details

**Template Name**: `tac_invoice_notification`

**Content Type**: Media

**Variables**:
1. `{{1}}` - Customer Name
2. `{{2}}` - Invoice Number
3. `{{3}}` - Total Amount
4. `{{4}}` - Tracking ID (AWB)
5. `{{5}}` - PDF URL

**Body Text**:
```
Hello {{1}},

Your invoice from TAC Cargo is ready. Please find it attached.

Invoice Number: {{2}}
Total Amount: ₹{{3}}
Tracking ID: {{4}}

Thank you for choosing TAC Cargo.
```

**Media URL**: `{{5}}`

### Template Approval Process

1. Create template in Twilio Console
2. Submit for WhatsApp approval
3. Wait for "Approved" status
4. Use template name in code

## Security Considerations

### ✅ Token-Based PDF Access
- PDFs are served via secure endpoint
- HMAC-SHA256 token validation
- Tokens tied to specific invoice IDs
- No public PDF URLs

### ✅ Phone Number Validation
- Format validation before sending
- Country code normalization
- WhatsApp format prefix

### ✅ Rate Limiting
- Implement rate limiting in Edge Function
- Track sends per customer/hour
- Prevent spam

## Testing Checklist

- [ ] Edge functions deployed successfully
- [ ] Twilio credentials configured
- [ ] WhatsApp template approved
- [ ] PDF URL accessible via ngrok/Vercel
- [ ] Token validation working
- [ ] Phone number formatting correct
- [ ] Message delivery confirmed
- [ ] PDF downloads in WhatsApp
- [ ] Error handling tested
- [ ] Production deployment verified

## Troubleshooting

### Common Issues

**PDF not delivered**
- Check URL is publicly accessible (not localhost)
- Verify token generation matches validation
- Ensure Content-Type is `application/pdf`

**Template rejected**
- Avoid promotional language
- Keep variables clear
- Follow WhatsApp guidelines

**Twilio error 63016**
- Wrong number of variables
- Template name mismatch
- Check variable order

**File > 100MB**
- WhatsApp limit is 100MB
- Optimize PDF generation
- Use compression

## Alternative: Supabase Storage Approach

Instead of generating PDFs on-demand, you can:

1. Generate PDF client-side
2. Upload to Supabase Storage
3. Get signed URL (24hr expiry)
4. Send signed URL via WhatsApp

**Pros**: Simpler, no server-side PDF generation
**Cons**: Storage costs, URL expiry management

## Cost Estimation

- **Twilio WhatsApp**: ~$0.005 per message
- **Supabase Edge Functions**: Free tier: 500K invocations/month
- **Supabase Storage**: Free tier: 1GB

For 1000 invoices/month: ~$5/month

## Next Steps

1. Create Edge Functions
2. Configure Twilio credentials
3. Submit WhatsApp template for approval
4. Test with ngrok
5. Deploy to production
6. Monitor delivery rates

---

**Last Updated**: January 2026
**Maintained By**: TAC Cargo Development Team
