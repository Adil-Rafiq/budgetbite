'use client';

import { AlertCircle, Loader2 } from 'lucide-react';
import { useBudgetPlanGenerationDetail } from '@/hooks/use-budget-plan';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getMealTypeVisual } from '@/lib/meal-type-visuals';
import type { SuggestionOption, SuggestionSlot } from '@repo/shared';

interface GenerationSuggestionsGridProps {
  planId: string;
  generationId: string;
}

const dateFormatter = new Intl.DateTimeFormat('en-PK', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
});

function formatDay(slotDate: string): string {
  // Treat as a calendar day in the user's locale; safe because the BE always
  // sends YYYY-MM-DD strings, never timestamps.
  return dateFormatter.format(new Date(`${slotDate}T00:00:00`));
}

function GridSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      {Array.from({ length: 2 }).map((_, dayIdx) => (
        <div key={dayIdx} className="flex flex-col gap-3">
          <Skeleton className="h-5 w-32" />
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, slotIdx) => (
              <Skeleton key={slotIdx} className="h-40 w-full rounded-xl" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function GridError({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
      <AlertCircle className="h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

function SlotCard({ slot }: { slot: SuggestionSlot }) {
  const { Icon, colors } = getMealTypeVisual(slot.mealTypeKey);
  return (
    <Card className="border-border h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className={`flex h-7 w-7 items-center justify-center rounded-md ${colors}`}>
            <Icon className="h-3.5 w-3.5" />
          </div>
          <CardTitle className="text-sm capitalize text-card-foreground">
            {slot.mealTypeLabel}
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-2 pt-0">
        {slot.options.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No options generated.</p>
        ) : (
          slot.options.map((option: SuggestionOption) => (
            <div
              key={option.id}
              className="flex items-start justify-between gap-3 rounded-lg bg-secondary/60 p-2.5 transition-colors hover:bg-secondary"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-card-foreground">
                  {option.menuItemName ?? '—'}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {option.restaurantName ?? '—'}
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold text-primary">
                PKR {option.estimatedPrice.toLocaleString()}
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Lazy-loaded body for an expanded succeeded generation. Renders a vertical
 * stack of day groups (one per `slotDate`), each with a responsive grid of
 * mealType cards. The hook only fires once `generationId` is non-null —
 * mounting/unmounting drives lazy loading from the parent's collapsible.
 */
export function GenerationSuggestionsGrid({
  planId,
  generationId,
}: GenerationSuggestionsGridProps) {
  const { data, isLoading, error } = useBudgetPlanGenerationDetail(planId, generationId);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>Loading suggestions…</span>
        </div>
        <GridSkeleton />
      </div>
    );
  }

  if (error) {
    return <GridError message={`Failed to load suggestions: ${error.message}`} />;
  }

  if (!data || data.days.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
        This generation didn&apos;t produce any suggestions.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {data.days.map((day) => (
        <div key={day.slotDate} className="flex flex-col gap-3">
          <h4 className="text-sm font-semibold text-foreground">{formatDay(day.slotDate)}</h4>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {day.slots.map((slot) => (
              <SlotCard key={slot.mealTypeId} slot={slot} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
