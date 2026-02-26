import { supabase } from './supabase';

interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  attachments?: Array<{
    filename: string;
    content: string;
  }>;
}

export const emailService = {
  /**
   * Send an email using Supabase Edge Function 'send-email'.
   */
  send: async (params: SendEmailParams) => {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: params,
    });

    if (error) {
      console.error('Failed to invoke send-email function:', error);
      throw error;
    }

    if (data?.error) {
      console.error('Email sending failed:', data.error);
      throw new Error(data.error.message || 'Failed to send email');
    }

    return data;
  },
};
