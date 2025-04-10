import { supabaseAdmin } from "@/lib/supabase-admin";

export async function sendEmailNotification({ to, subject, message }) {
  try {
    console.log('Attempting to send email notification:', { to, subject, message });
    
    const { data, error } = await supabaseAdmin.functions.invoke('send-email', {
      body: {
        to,
        subject,
        message
      }
    });

    console.log('Edge Function response:', { data, error });

    if (error) {
      console.error('Error sending email:', error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in sendEmailNotification:', error);
    throw error;
  }
} 