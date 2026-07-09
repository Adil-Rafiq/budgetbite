import { budgetPlanRepository, orderRepository, type ActiveDigestPlanRow } from '@repo/database';
import { toNumber, type WeeklyDigestResult } from '@repo/shared';

import { daysRemaining, isOnBudgetPace } from '../lib/plan-math.js';
import { sendEmail } from '../lib/email/email.service.js';
import {
  weeklyDigestTemplate,
  type WeeklyDigestData,
} from '../lib/email/templates/weekly-digest.template.js';
import { allowedOrigins } from '../lib/origins.js';

/** Trailing window (in days, inclusive of today) that the "this week" section covers. */
const DIGEST_WINDOW_DAYS = 7;

/**
 * Minimum gap between two digests for the same plan. Set just below the weekly
 * cadence so a normal 7-day schedule always fires, but any re-trigger within
 * the same week (cron misfire, manual re-run) is a no-op. This is the
 * idempotency guard backing `budget_plan.last_weekly_digest_sent_at`.
 */
const DIGEST_MIN_INTERVAL_DAYS = 6;

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

/** YYYY-MM-DD `days` days before `date` (also YYYY-MM-DD). */
function subtractDays(date: string, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function dashboardUrl(): string {
  const base = allowedOrigins[0] ?? 'http://localhost:3000';
  return `${base}/dashboard`;
}

/**
 * A plan is eligible for a digest when it has a context row, an owner with a
 * verified email, today falls inside its own date window — we don't email
 * about a plan that hasn't started or has effectively ended (active-but-expired
 * plans are retired lazily on the next read; skipping them here avoids a
 * "spent X of Y" note for a plan the user can no longer act on) — and it hasn't
 * already been sent inside the cooldown window (idempotency guard).
 */
function isEligible(plan: ActiveDigestPlanRow, today: string, now: number): boolean {
  if (!plan.planContext) return false;
  if (!plan.user.emailVerified || !plan.user.email) return false;
  if (plan.startDate > today || today > plan.endDate) return false;
  if (plan.lastWeeklyDigestSentAt) {
    const daysSinceLast = (now - plan.lastWeeklyDigestSentAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceLast < DIGEST_MIN_INTERVAL_DAYS) return false;
  }
  return true;
}

function buildDigestData(
  plan: ActiveDigestPlanRow,
  weekly: { mealsLogged: number; amountSpent: number },
  today: string,
): WeeklyDigestData {
  const ctx = plan.planContext!;
  const totalBudget = toNumber(ctx.totalBudget);
  const amountSpent = toNumber(ctx.amountSpent);
  const amountRemaining = toNumber(ctx.amountRemaining);

  const percentSpent =
    totalBudget > 0
      ? Math.max(0, Math.min(100, Math.round((amountSpent / totalBudget) * 100)))
      : amountSpent > 0
        ? 100
        : 0;

  return {
    name: plan.user.name,
    planType: plan.planType as 'weekly' | 'monthly',
    totalBudget,
    amountSpent,
    amountRemaining,
    percentSpent,
    daysRemaining: daysRemaining(today, plan.endDate),
    mealsRemaining: ctx.mealsRemaining,
    mealsLoggedThisWeek: weekly.mealsLogged,
    spentThisWeek: weekly.amountSpent,
    onPace: isOnBudgetPace({
      totalBudget,
      amountSpent,
      startDate: plan.startDate,
      endDate: plan.endDate,
      today,
    }),
    dashboardUrl: dashboardUrl(),
  };
}

export const digestService = {
  /**
   * Send one weekly progress email per eligible active plan. Batch job with no
   * request context — there is no worker tier, so it is triggered by an external
   * cron calling `POST /api/cron/digests/weekly` with the cron secret. Each send
   * is isolated: one recipient's failure is counted and logged but never aborts
   * the run.
   */
  async sendWeeklyDigests(): Promise<WeeklyDigestResult> {
    const today = todayDateString();
    const now = Date.now();
    const since = subtractDays(today, DIGEST_WINDOW_DAYS - 1);

    const plans = await budgetPlanRepository.listActiveForDigest();
    const eligible = plans.filter((p) => isEligible(p, today, now));

    const statsByPlan = new Map(
      (
        await orderRepository.getWeeklyStatsByPlans(
          eligible.map((p) => p.id),
          since,
        )
      ).map((s) => [s.budgetPlanId, s]),
    );

    let sent = 0;
    let failed = 0;
    for (const plan of eligible) {
      const weekly = statsByPlan.get(plan.id) ?? { mealsLogged: 0, amountSpent: 0 };
      const data = buildDigestData(plan, weekly, today);
      const { subject, html } = weeklyDigestTemplate(data);
      try {
        await sendEmail({ to: plan.user.email, subject, html });
        // Stamp the marker only after a confirmed send, so a failed attempt is
        // retried on the next run rather than silently skipped by the cooldown.
        await budgetPlanRepository.markWeeklyDigestSent(plan.id);
        sent += 1;
      } catch (err) {
        failed += 1;
        console.error(
          `[digestService] weekly digest send failed for plan=${plan.id} user=${plan.user.email}`,
          err,
        );
      }
    }

    const result: WeeklyDigestResult = {
      total: plans.length,
      sent,
      skipped: plans.length - eligible.length,
      failed,
    };
    console.info('[digestService] weekly digest run complete', JSON.stringify(result));
    return result;
  },
};
