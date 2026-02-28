export const otpTemplate = (otp: string) => ({
  subject: 'Your BudgetBite verification code',
  html: `
    <div>
      <h2>Your verification code</h2>
      <p>Enter this code to verify your email:</p>
      <h1>${otp}</h1>
      <p>Expires in 10 minutes.</p>
    </div>
  `,
});
