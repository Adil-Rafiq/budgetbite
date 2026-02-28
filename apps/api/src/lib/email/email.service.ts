import { resend } from './email.client.js';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (options: SendEmailOptions) => {
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM ?? 'noreply@budgetbite.com',
    ...options,
  });

  if (error) throw new Error(`Failed to send email: ${error.message}`);
};
