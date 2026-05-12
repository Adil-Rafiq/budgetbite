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
import { cn } from '@/lib/utils';
import { Pill } from '@/components/ui/pill';
import { useGenerateMealPlan } from '@/hooks/use-meal-plan';
import { GenerationSuggestionsGrid } from './generation-suggestions-grid';
import type { BudgetGeneration } from '@repo/shared';

type Tone = 'amber' | 'fathom' | 'pulse' | 'soft';

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
    tone: 'fathom',
    label: (gen) => `Succeeded ${formatDistanceToNow(gen.generatedAt, { addSuffix: true })}`,
  },
  failed: {
    Icon: AlertCircle,
    tone: 'pulse',
    label: (gen) => `Failed ${formatDistanceToNow(gen.generatedAt, { addSuffix: true })}`,
  },
  superseded: {
    Icon: MinusCircle,
    tone: 'soft',
    label: () => 'Discarded — replaced by a newer attempt',
  },
};

const TONE_DOT: Record<Tone, string> = {
  amber: 'bg-amber/20 border-amber',
  fathom: 'bg-fathom/20 border-fathom',
  pulse: 'bg-pulse/20 border-pulse',
  soft: 'bg-soft/20 border-soft',
};

const TONE_ICON: Record<Tone, string> = {
  amber: 'text-amber',
  fathom: 'text-fathom',
  pulse: 'text-pulse',
  soft: 'text-soft',
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
        className={`absolute left-2 top-3 inline-block h-4 w-4 rounded-full border-2 shadow-[0_0_0_4px_var(--color-lumen)] ${TONE_DOT[visual.tone]}`}
      />

      <div
        className={`flex flex-col gap-2 rounded-xl border bg-white p-4 transition ${
          open ? 'border-fathom/35' : 'border-lumen-dk'
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
                <p className="text-[14px] font-medium text-vast">{visual.label(generation)}</p>
                {isActive && (
                  <span
                    className="inline-flex items-center gap-1 rounded-full bg-fathom/[0.08] px-2 py-0.5 text-[10px] uppercase text-fathom"
                    style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.18em' }}
                  >
                    <Sparkles className="h-3 w-3" />
                    Active
                  </span>
                )}
              </div>
              <span
                className="mt-0.5 text-[11px] text-ink"
                style={{ fontFamily: 'var(--font-mono)' }}
                title={format(generation.generatedAt, 'PPpp')}
              >
                {format(generation.generatedAt, 'MMM d, yyyy · HH:mm')}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {showRetry && (
              <Pill
                variant="danger"
                size="xs"
                onClick={() => generate.mutate(planId)}
                disabled={generate.isPending}
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                <RefreshCw className={cn('h-3.5 w-3.5', generate.isPending && 'animate-spin')} />
                retry
              </Pill>
            )}
            {isSucceeded && (
              <CollapsibleTrigger asChild>
                <Pill
                  variant="ghost"
                  size="xs"
                  className={cn(open && 'border-[#cfcfb8] bg-lumen')}
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  <ChevronDown
                    className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')}
                  />
                  {open ? 'hide' : 'view'}
                </Pill>
              </CollapsibleTrigger>
            )}
          </div>
        </div>

        {isFailed && generation.errorMessage && (
          <div className="rounded-lg border border-pulse/20 bg-pulse/[0.06] p-3 text-[12px] text-pulse">
            <span className="font-medium">
              {generation.errorCode ?? 'GENERATION_FAILED'}:
            </span>{' '}
            {generation.errorMessage}
          </div>
        )}
      </div>

      {isSucceeded && (
        <CollapsibleContent className="data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
          <div className="ml-2 mt-3 rounded-xl border border-dashed border-lumen-dk bg-lumen p-4">
            {open && <GenerationSuggestionsGrid planId={planId} generationId={generation.id} />}
          </div>
        </CollapsibleContent>
      )}
    </Collapsible>
  );
}
