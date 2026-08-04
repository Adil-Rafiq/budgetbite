import { OTP_EXPIRY_MINUTES } from '@repo/shared';

/**
 * The code that lets someone back into a locked-out account.
 *
 * Deliberately not the same email as `otpTemplate`. A verification code says
 * "finish what you started"; this one may well be the first a user hears that
 * somebody asked to reset their password, so it has to name the account, say
 * what the code does, and tell a recipient who did not ask for it that ignoring
 * the mail is a complete response.
 *
 * Inline styles and a table layout, matching the digest template: mail clients
 * strip <style> blocks and external stylesheets.
 */
export const passwordResetTemplate = (otp: string, email: string) => ({
  subject: 'Reset your BudgetBite password',
  html: `
  <div style="margin:0;padding:24px 0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#18181b;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;">
      <tr>
        <td style="padding:28px 32px 8px;">
          <div style="font-size:14px;font-weight:600;letter-spacing:0.02em;color:#ea580c;text-transform:uppercase;">BudgetBite</div>
          <h1 style="margin:8px 0 4px;font-size:22px;line-height:1.3;">Reset your password</h1>
          <p style="margin:0;color:#71717a;font-size:14px;">
            Enter this code on the reset screen to choose a new password for
            <strong style="color:#18181b;">${email}</strong>.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 32px 8px;">
          <div style="padding:16px;border:1px solid #e4e4e7;border-radius:10px;background:#fafafa;text-align:center;">
            <div style="font-size:32px;font-weight:700;letter-spacing:0.32em;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;">${otp}</div>
          </div>
          <p style="margin:12px 0 0;color:#71717a;font-size:13px;text-align:center;">
            Expires in ${OTP_EXPIRY_MINUTES} minutes.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 32px 28px;">
          <p style="margin:0;color:#71717a;font-size:13px;line-height:1.6;">
            Didn't ask for this? You can ignore this email — your password stays
            as it is, and nobody can change it without the code above.
          </p>
        </td>
      </tr>
    </table>
  </div>
  `,
});
