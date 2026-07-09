export interface WeeklyDigestData {
  /** Recipient's display name, for the greeting. */
  name: string;
  planType: 'weekly' | 'monthly';
  /** Plan-to-date budget figures (Y, X, and Y−X). */
  totalBudget: number;
  amountSpent: number;
  amountRemaining: number;
  /** Whole-percent of the budget spent so far, already clamped to 0–100. */
  percentSpent: number;
  daysRemaining: number;
  mealsRemaining: number;
  /** Activity over the trailing 7 days. */
  mealsLoggedThisWeek: number;
  spentThisWeek: number;
  /** Whether spend is keeping pace with the plan's clock. */
  onPace: boolean;
  /** Absolute URL to the web dashboard for the CTA button. */
  dashboardUrl: string;
}

const money = (n: number): string => `₨ ${Math.round(n).toLocaleString('en-US')}`;

/**
 * Weekly progress digest. Self-contained HTML with inline styles (email clients
 * strip <style>/external CSS) on a light background — the "spent X of Y" budget
 * headline, a progress bar, and a "this week" activity summary, with a CTA back
 * to the dashboard.
 */
export const weeklyDigestTemplate = (data: WeeklyDigestData): { subject: string; html: string } => {
  const barColor = data.onPace ? '#16a34a' : '#dc2626';
  const paceBadge = data.onPace
    ? { label: 'On track', bg: '#dcfce7', fg: '#166534' }
    : { label: 'Over pace', bg: '#fee2e2', fg: '#991b1b' };
  const barWidth = Math.max(0, Math.min(100, data.percentSpent));

  const subject = `Your ${data.planType} BudgetBite check-in — ${money(data.amountSpent)} of ${money(
    data.totalBudget,
  )} spent`;

  const html = `
  <div style="margin:0;padding:24px 0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#18181b;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;">
      <tr>
        <td style="padding:28px 32px 12px;">
          <div style="font-size:14px;font-weight:600;letter-spacing:0.02em;color:#ea580c;text-transform:uppercase;">BudgetBite</div>
          <h1 style="margin:8px 0 4px;font-size:22px;line-height:1.3;">Hi ${data.name}, here's your week</h1>
          <p style="margin:0;color:#71717a;font-size:14px;">A quick look at how your ${data.planType} food budget is holding up.</p>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 32px 4px;">
          <div style="display:inline-block;padding:4px 10px;border-radius:9999px;background:${paceBadge.bg};color:${paceBadge.fg};font-size:12px;font-weight:600;">${paceBadge.label}</div>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 32px 8px;">
          <div style="font-size:13px;color:#71717a;">Spent so far</div>
          <div style="font-size:28px;font-weight:700;margin:2px 0 12px;">${money(
            data.amountSpent,
          )} <span style="font-size:16px;font-weight:400;color:#a1a1aa;">of ${money(
            data.totalBudget,
          )}</span></div>
          <div style="height:10px;background:#e4e4e7;border-radius:9999px;overflow:hidden;">
            <div style="height:10px;width:${barWidth}%;background:${barColor};border-radius:9999px;"></div>
          </div>
          <div style="margin-top:6px;font-size:13px;color:#71717a;">${money(
            data.amountRemaining,
          )} left · ${data.daysRemaining} day${data.daysRemaining === 1 ? '' : 's'} and ${
            data.mealsRemaining
          } meal${data.mealsRemaining === 1 ? '' : 's'} to go</div>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 32px 8px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e4e4e7;border-radius:10px;">
            <tr>
              <td style="padding:16px;text-align:center;border-right:1px solid #e4e4e7;">
                <div style="font-size:22px;font-weight:700;">${data.mealsLoggedThisWeek}</div>
                <div style="font-size:12px;color:#71717a;margin-top:2px;">meals logged this week</div>
              </td>
              <td style="padding:16px;text-align:center;">
                <div style="font-size:22px;font-weight:700;">${money(data.spentThisWeek)}</div>
                <div style="font-size:12px;color:#71717a;margin-top:2px;">spent this week</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 32px 28px;">
          <a href="${data.dashboardUrl}" style="display:inline-block;background:#ea580c;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:8px;">Open your dashboard</a>
          <p style="margin:18px 0 0;font-size:12px;color:#a1a1aa;line-height:1.5;">You're getting this because you have an active BudgetBite plan. Log meals as you order to keep these numbers accurate.</p>
        </td>
      </tr>
    </table>
  </div>`;

  return { subject, html };
};
