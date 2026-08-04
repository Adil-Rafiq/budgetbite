import { OTP_EXPIRY_MINUTES } from '@repo/shared';

export const otpTemplate = (otp: string) => ({
  subject: 'Your BudgetBite verification code',
  html: `
    <div>
      <h2>Your verification code</h2>
      <p>Enter this code to verify your email:</p>
      <h1>${otp}</h1>
      <p>Expires in ${OTP_EXPIRY_MINUTES} minutes.</p>
    </div>
  `,
});
