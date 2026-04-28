'use client';

import { useState } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Loader2,
  MinusCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useGenerateMealPlan } from '@/hooks/use-meal-plan';
import { GenerationSuggestionsGrid } from './generation-suggestions-grid';
import type { BudgetGeneration } from '@repo/shared';

// ─── Status visual map ───────────────────────────────────────────────────────
//
// Centralized so the rail dot, icon, and label tone all stay in lockstep. We
// intentionally avoid emoji or duplicated literals — every status row reads
// from the same row of the table.

interface StatusVisual {
  Icon: LucideIcon;
  /** Tailwind color tokens for the status icon and rail dot. */
  iconClass: string;
  /** Tailwind background+border classes for the rail dot circle. */
  dotClass: string;
  label: (gen: BudgetGeneration) => string;
}

const STATUS_VISUALS: Record<BudgetGeneration['status'], StatusVisual> = {
  pending: {
    Icon: Loader2,
    iconClass: 'text-chart-4',
    dotClass: 'bg-chart-4/20 border-chart-4',
    label: () => 'Generating…',
  },
  succeeded: {
    Icon: CheckCircle2,
    iconClass: 'text-accent',
    dotClass: 'bg-accent/20 border-accent',
    label: (gen) => `Succeeded ${formatDistanceToNow(gen.generatedAt, { addSuffix: true })}`,
  },
  failed: {
    Icon: AlertCircle,
    iconClass: 'text-destructive',
    dotClass: 'bg-destructive/20 border-destructive',
    label: (gen) => `Failed ${formatDistanceToNow(gen.generatedAt, { addSuffix: true })}`,
  },
  superseded: {
    Icon: MinusCircle,
    iconClass: 'text-muted-foreground',
    dotClass: 'bg-muted border-border',
    label: () => 'Discarded — replaced by a newer attempt',
  },
};

interface GenerationAttemptItemProps {
  generation: BudgetGeneration;
  planId: string;
  isActive: boolean;
  isLatest: boolean;
  /** Disable the inline Retry CTA when a newer attempt is already pending. */
  canTriggerRetry: boolean;
}

export function GenerationAttemptItem({
  generation,
  planId,
  isActive,
  isLatest,
  canTriggerRetry,
}: GenerationAttemptItemProps) {
  // Track the open state ourselves so we can lazy-mount the suggestions grid
  // only when it's actually visible. The Radix CollapsibleContent unmounts on
  // close, but that's only useful if the consumer is gated on the same flag.
  const [open, setOpen] = useState(false);

  const visual = STATUS_VISUALS[generation.status];
  const isSucceeded = generation.status === 'succeeded';
  const isPending = generation.status === 'pending';
  const isFailed = generation.status === 'failed';
  const showRetry = isFailed && isLatest && canTriggerRetry;

  const generate = useGenerateMealPlan();

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="relative pl-10 group/item"
      data-status={generation.status}
    >
      {/* Rail dot — anchored to the left of the row, same column as the rail line */}
      <span
        aria-hidden
        className={cn(
          'absolute left-2 top-2 h-4 w-4 rounded-full border-2 ring-4 ring-background',
          visual.dotClass,
        )}
      />

      {/* Header row — always visible */}
      <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 transition-colors group-data-[state=open]/item:border-primary/30">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <visual.Icon
              className={cn(
                'mt-0.5 h-4 w-4 shrink-0',
                visual.iconClass,
                isPending && 'animate-spin',
              )}
            />
            <div className="min-w-0 flex flex-col">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-card-foreground">{visual.label(generation)}</p>
                {isActive && (
                  <Badge
                    variant="secondary"
                    className="bg-primary/10 text-primary border-0 text-[10px] uppercase tracking-wide"
                  >
                    <Sparkles className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                )}
              </div>
              <span
                className="text-xs text-muted-foreground mt-0.5"
                title={format(generation.generatedAt, 'PPpp')}
              >
                {format(generation.generatedAt, 'MMM d, yyyy · HH:mm')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {showRetry && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => generate.mutate(planId)}
                disabled={generate.isPending}
              >
                <RefreshCw
                  className={cn('h-3.5 w-3.5 mr-1', generate.isPending && 'animate-spin')}
                />
                Retry
              </Button>
            )}
            {isSucceeded && (
              <CollapsibleTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2 text-muted-foreground hover:text-foreground"
                >
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 transition-transform duration-200',
                      open && 'rotate-180',
                    )}
                  />
                  <span className="ml-1 text-xs">{open ? 'Hide' : 'View'} suggestions</span>
                </Button>
              </CollapsibleTrigger>
            )}
          </div>
        </div>

        {/* Error body — failed only */}
        {isFailed && generation.errorMessage && (
          <div className="rounded-lg bg-destructive/5 border border-destructive/15 p-3 text-xs text-destructive/90">
            <span className="font-medium">{generation.errorCode ?? 'GENERATION_FAILED'}:</span>{' '}
            {generation.errorMessage}
          </div>
        )}
      </div>

      {/* Lazy-loaded suggestions grid — succeeded only */}
      {isSucceeded && (
        <CollapsibleContent className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
          <div className="mt-3 ml-2 rounded-xl border border-dashed border-border/80 bg-muted/30 p-4">
            {open && <GenerationSuggestionsGrid planId={planId} generationId={generation.id} />}
          </div>
        </CollapsibleContent>
      )}
    </Collapsible>
  );
}
