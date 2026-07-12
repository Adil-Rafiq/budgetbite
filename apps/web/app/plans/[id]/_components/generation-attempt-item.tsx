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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useGenerateMealPlan } from '@/hooks/use-meal-plan';
import { GenerationSuggestionsGrid } from './generation-suggestions-grid';
import type { BudgetGeneration } from '@repo/shared';

type Tone = 'amber' | 'green' | 'tomato' | 'slate';

interface StatusVisual {
  Icon: LucideIcon;
  tone: Tone;
  label: (gen: BudgetGeneration) => string;
}

const STATUS_VISUALS: Record<BudgetGeneration['status'], StatusVisual> = {
  pending: {
    Icon: Loader2,
    tone: 'amber',
    label: () => 'Generating…',
  },
  succeeded: {
    Icon: CheckCircle2,
    tone: 'green',
    label: (gen) => `Succeeded ${formatDistanceToNow(gen.generatedAt, { addSuffix: true })}`,
  },
  failed: {
    Icon: AlertCircle,
    tone: 'tomato',
    label: (gen) => `Failed ${formatDistanceToNow(gen.generatedAt, { addSuffix: true })}`,
  },
  superseded: {
    Icon: MinusCircle,
    tone: 'slate',
    label: () => 'Discarded — replaced by a newer attempt',
  },
};

const TONE_DOT: Record<Tone, string> = {
  amber: 'bg-[#f5a623]/20 border-[#f5a623]',
  green: 'bg-green/20 border-green',
  tomato: 'bg-tomato/20 border-tomato',
  slate: 'bg-slate/20 border-slate',
};

const TONE_ICON: Record<Tone, string> = {
  amber: 'text-[#f5a623]',
  green: 'text-green',
  tomato: 'text-tomato',
  slate: 'text-slate',
};

interface GenerationAttemptItemProps {
  generation: BudgetGeneration;
  planId: string;
  isActive: boolean;
  isLatest: boolean;
  canTriggerRetry: boolean;
}

export function GenerationAttemptItem({
  generation,
  planId,
  isActive,
  isLatest,
  canTriggerRetry,
}: GenerationAttemptItemProps) {
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
      className="group/item relative pl-10"
      data-status={generation.status}
    >
      <span
        aria-hidden
        className={`absolute left-2 top-3 inline-block h-4 w-4 rounded-full border-2 shadow-[0_0_0_4px_#f7fbf0] ${TONE_DOT[visual.tone]}`}
      />

      <div
        className={`flex flex-col gap-2 rounded-xl border bg-white p-4 transition ${
          open ? 'border-green/40' : 'border-sage'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-2.5">
            <visual.Icon
              className={cn(
                'mt-0.5 h-4 w-4 shrink-0',
                isPending && 'animate-spin',
                TONE_ICON[visual.tone],
              )}
            />
            <div className="flex min-w-0 flex-col">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[14px] font-medium text-charcoal">{visual.label(generation)}</p>
                {isActive && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-dark-green">
                    <Sparkles className="h-3 w-3" />
                    Active
                  </span>
                )}
              </div>
              <span
                className="mt-0.5 text-[11px] text-slate"
                title={format(generation.generatedAt, 'PPpp')}
              >
                {format(generation.generatedAt, 'MMM d, yyyy · HH:mm')}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {showRetry && (
              <button
                type="button"
                onClick={() => generate.mutate(planId)}
                disabled={generate.isPending}
                className="inline-flex items-center gap-1.5 rounded-lg border border-tomato/30 bg-white px-3 py-1.5 text-[12px] font-medium text-tomato transition-colors hover:bg-tomato/10 disabled:pointer-events-none disabled:opacity-50"
              >
                <RefreshCw className={cn('h-3.5 w-3.5', generate.isPending && 'animate-spin')} />
                Retry
              </button>
            )}
            {isSucceeded && (
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg border border-sage bg-white px-3 py-1.5 text-[12px] font-medium text-slate transition-colors hover:bg-canvas',
                    open && 'bg-canvas',
                  )}
                >
                  <ChevronDown
                    className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')}
                  />
                  {open ? 'Hide' : 'View'}
                </button>
              </CollapsibleTrigger>
            )}
          </div>
        </div>

        {isFailed && generation.errorMessage && (
          <div className="rounded-lg border border-tomato/20 bg-tomato/[0.06] p-3 text-[12px] text-tomato">
            <span className="font-medium">{generation.errorCode ?? 'GENERATION_FAILED'}:</span>{' '}
            {generation.errorMessage}
          </div>
        )}
      </div>

      {isSucceeded && (
        <CollapsibleContent className="data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
          <div className="ml-2 mt-3 rounded-xl border border-dashed border-sage bg-canvas p-4">
            {open && <GenerationSuggestionsGrid planId={planId} generationId={generation.id} />}
          </div>
        </CollapsibleContent>
      )}
    </Collapsible>
  );
}
