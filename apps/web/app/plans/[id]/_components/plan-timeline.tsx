'use client';

import { useMemo } from 'react';
import { AlertCircle, Calendar, Check, Pin, Sparkles, Utensils } from 'lucide-react';
import type {
  BudgetPlanDetail,
  PlanTimelineDay,
  PlanTimelineSlot,
  SuggestionOption,
} from '@repo/shared';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { usePlanTimeline } from '@/hooks/use-budget-plan';
import { getMealTypeVisual } from '@/lib/meal-type-visuals';
import { cn } from '@/lib/utils';

// ─── Date helpers ────────────────────────────────────────────────────────────

const dayFmt = new Intl.DateTimeFormat('en-PK', {
  weekday: 'long',
  month: 'short',
  day: 'numeric',
});

function formatDay(slotDate: string): string {
  // Anchor at noon UTC so DST flicker can't bump us a day.
  return dayFmt.format(new Date(`${slotDate}T12:00:00Z`));
}

// ─── Status badges (one per slot status) ─────────────────────────────────────

function StatusBadge({ status }: { status: PlanTimelineSlot['status'] }) {
  if (status === 'logged') {
    return (
      <Badge variant="secondary" className="text-accent bg-accent/10 border-0">
        <Check className="w-3 h-3 mr-1" />
        Logged
      </Badge>
    );
  }
  if (status === 'pinned') {
    return (
      <Badge variant="secondary" className="text-primary bg-primary/10 border-0">
        <Pin className="w-3 h-3 mr-1" />
        Pinned
      </Badge>
    );
  }
  if (status === 'suggested') {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        <Sparkles className="w-3 h-3 mr-1" />
        Suggested
      </Badge>
    );
  }
  return null;
}

// ─── Bodies ──────────────────────────────────────────────────────────────────

function LoggedBody({ slot }: { slot: PlanTimelineSlot }) {
  const c = slot.loggedChoice!;
  // Title resolution: catalogue-linked choices read from the menu item, but
  // when the join returns null (deleted item, legacy row) we fall back through
  // any manual description before giving up on a placeholder.
  const title = c.isCustom
    ? (c.manualDescription ?? 'Custom entry')
    : (c.menuItemName ?? c.manualDescription ?? '—');

  return (
    <div className="rounded-lg bg-accent/5 border border-accent/20 p-3 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="font-semibold text-sm text-card-foreground truncate">{title}</p>
        {c.restaurantName && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">{c.restaurantName}</p>
        )}
      </div>
      <span className="text-sm font-bold text-card-foreground shrink-0 whitespace-nowrap">
        PKR {c.actualAmountSpent.toLocaleString()}
      </span>
    </div>
  );
}

function PinnedBody({ option }: { option: SuggestionOption }) {
  return (
    <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="font-semibold text-sm text-card-foreground truncate">
          {option.menuItemName ?? '—'}
        </p>
        {option.restaurantName && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">{option.restaurantName}</p>
        )}
      </div>
      <span className="text-sm font-bold text-primary shrink-0 whitespace-nowrap">
        PKR {option.estimatedPrice.toLocaleString()}
      </span>
    </div>
  );
}

/**
 * Renders all options for a `suggested` slot as a compact numbered list. We
 * use rank purely as an enumeration affordance — the BE doesn't promise the
 * first option is "best", just that the AI returned them in optionIndex order.
 */
function SuggestedBody({ options }: { options: SuggestionOption[] }) {
  return (
    <div className="flex flex-col">
      {options.map((option, i) => (
        <div
          key={option.id}
          className={cn(
            'flex items-start justify-between gap-3 py-2.5',
            i > 0 && 'border-t border-border/60',
          )}
        >
          <div className="flex items-start gap-2.5 min-w-0">
            <span className="font-mono text-[11px] tabular-nums text-muted-foreground/80 mt-0.5 w-4 shrink-0">
              {i + 1}.
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-card-foreground truncate">
                {option.menuItemName ?? '—'}
              </p>
              {option.restaurantName && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {option.restaurantName}
                </p>
              )}
            </div>
          </div>
          <span className="text-sm font-semibold text-primary shrink-0 whitespace-nowrap">
            PKR {option.estimatedPrice.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

function EmptyBody({ relative }: { relative: PlanTimelineDay['relative'] }) {
  const message =
    relative === 'past'
      ? 'No meal logged'
      : relative === 'today'
        ? 'Nothing planned yet'
        : 'No suggestion yet';
  return (
    <div className="rounded-lg border border-dashed border-border/70 p-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
      <Utensils className="w-3.5 h-3.5" />
      <span>{message}</span>
    </div>
  );
}

// ─── Per-mealType section (within a day card) ────────────────────────────────

function MealSection({ slot, day }: { slot: PlanTimelineSlot; day: PlanTimelineDay }) {
  const { Icon, colors } = getMealTypeVisual(slot.mealTypeKey);

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className={cn('flex h-7 w-7 items-center justify-center rounded-md', colors)}>
            <Icon className="h-3.5 w-3.5" />
          </div>
          <h4 className="text-sm font-semibold capitalize text-card-foreground truncate">
            {slot.mealTypeLabel}
          </h4>
        </div>
        <StatusBadge status={slot.status} />
      </div>

      {slot.status === 'logged' && <LoggedBody slot={slot} />}
      {slot.status === 'pinned' && slot.options[0] && <PinnedBody option={slot.options[0]} />}
      {slot.status === 'suggested' && <SuggestedBody options={slot.options} />}
      {slot.status === 'empty' && <EmptyBody relative={day.relative} />}
    </div>
  );
}

// ─── Day card ────────────────────────────────────────────────────────────────

function DayCard({ day }: { day: PlanTimelineDay }) {
  const isToday = day.relative === 'today';
  const isPast = day.relative === 'past';

  // Quick at-a-glance count of how many slots in this day are pinned/logged.
  // Surfaced in the header so the user can scan past days for what they ate
  // without expanding everything.
  const counts = useMemo(() => {
    let logged = 0;
    let pinned = 0;
    for (const s of day.slots) {
      if (s.status === 'logged') logged++;
      else if (s.status === 'pinned') pinned++;
    }
    return { logged, pinned };
  }, [day.slots]);

  return (
    <Card
      className={cn(
        'border-border transition-colors',
        isToday && 'border-primary/40 ring-1 ring-primary/20',
        isPast && 'bg-muted/30',
      )}
    >
      <CardHeader className="pb-3 flex flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <h3
            className={cn(
              'text-base font-semibold truncate',
              isPast ? 'text-muted-foreground' : 'text-foreground',
            )}
          >
            {formatDay(day.slotDate)}
          </h3>
          {isToday && (
            <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
              Today
            </Badge>
          )}
        </div>

        {(counts.logged > 0 || counts.pinned > 0) && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
            {counts.logged > 0 && (
              <span className="flex items-center gap-1">
                <Check className="w-3 h-3 text-accent" />
                {counts.logged} logged
              </span>
            )}
            {counts.pinned > 0 && (
              <span className="flex items-center gap-1">
                <Pin className="w-3 h-3 text-primary" />
                {counts.pinned} pinned
              </span>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        {day.slots.map((slot, i) => (
          <div key={`${day.slotDate}-${slot.mealTypeId}`} className="flex flex-col gap-2.5">
            {i > 0 && <div className="border-t border-border/60 -mx-1" />}
            <MealSection slot={slot} day={day} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ─── Section banners ─────────────────────────────────────────────────────────

function SectionBanner({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
        {label}
      </span>
      <span className="text-xs text-muted-foreground/70">
        {count} day{count === 1 ? '' : 's'}
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

// ─── States: loading / error / empty ─────────────────────────────────────────

function TimelineSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-48 w-full rounded-xl" />
      ))}
    </div>
  );
}

// ─── Top-level component ─────────────────────────────────────────────────────

interface PlanTimelineProps {
  plan: BudgetPlanDetail;
}

/**
 * Day-by-day rendering of the user's actual living plan. Past days show the
 * logged choice, today/future days show pins (locked) or the active
 * generation's suggestions; gaps render as empty placeholders. Re-fetches
 * automatically while a generation is pending so the FE catches new
 * suggestions as soon as they land.
 */
export function PlanTimeline({ plan }: PlanTimelineProps) {
  const isPendingGeneration = plan.latestAttempt?.status === 'pending';
  const { data, isLoading, error } = usePlanTimeline(plan.id, isPendingGeneration);

  // Group days by relative bucket so we can render section banners between
  // past / today / future. Server already labels each day so this is a pure
  // partition, no client-side date math.
  const grouped = useMemo(() => {
    const past: PlanTimelineDay[] = [];
    const today: PlanTimelineDay[] = [];
    const future: PlanTimelineDay[] = [];
    for (const d of data?.days ?? []) {
      if (d.relative === 'past') past.push(d);
      else if (d.relative === 'today') today.push(d);
      else future.push(d);
    }
    return { past, today, future };
  }, [data]);

  const header = (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Calendar className="h-3.5 w-3.5" />
        </div>
        <h2 className="text-base font-semibold text-foreground">Your plan, day by day</h2>
      </div>
      {data && (
        <span className="text-xs text-muted-foreground">
          {data.days.length} day{data.days.length === 1 ? '' : 's'}
        </span>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {header}
        <TimelineSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-4">
        {header}
        <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Failed to load timeline: {error.message}</span>
        </div>
      </div>
    );
  }

  if (!data || data.days.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        {header}
        <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No days in this plan yet.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {header}

      {grouped.past.length > 0 && (
        <div className="flex flex-col gap-3">
          <SectionBanner label="Past" count={grouped.past.length} />
          <div className="flex flex-col gap-3">
            {grouped.past.map((day) => (
              <DayCard key={day.slotDate} day={day} />
            ))}
          </div>
        </div>
      )}

      {grouped.today.length > 0 && (
        <div className="flex flex-col gap-3">
          <SectionBanner label="Today" count={grouped.today.length} />
          <div className="flex flex-col gap-3">
            {grouped.today.map((day) => (
              <DayCard key={day.slotDate} day={day} />
            ))}
          </div>
        </div>
      )}

      {grouped.future.length > 0 && (
        <div className="flex flex-col gap-3">
          <SectionBanner label="Coming up" count={grouped.future.length} />
          <div className="flex flex-col gap-3">
            {grouped.future.map((day) => (
              <DayCard key={day.slotDate} day={day} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
