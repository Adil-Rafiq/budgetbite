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
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { useGenerateMealPlan } from '@/hooks/use-meal-plan';
import { GenerationSuggestionsGrid } from './generation-suggestions-grid';
import type { BudgetGeneration } from '@repo/shared';

const LUMEN = '#ffffeb';
const LUMEN_DK = '#e4e4d0';
const VAST = '#1a1a1a';
const FATHOM = '#034f46';
const PULSE = '#7f1c34';
const AMBER = '#b8741a';
const WHITE = '#ffffff';
const MUTED = '#71716a';
const SOFT = '#a6a691';

interface StatusVisual {
  Icon: LucideIcon;
  tint: string;
  label: (gen: BudgetGeneration) => string;
}

const STATUS_VISUALS: Record<BudgetGeneration['status'], StatusVisual> = {
  pending: {
    Icon: Loader2,
    tint: AMBER,
    label: () => 'Generating…',
  },
  succeeded: {
    Icon: CheckCircle2,
    tint: FATHOM,
    label: (gen) => `Succeeded ${formatDistanceToNow(gen.generatedAt, { addSuffix: true })}`,
  },
  failed: {
    Icon: AlertCircle,
    tint: PULSE,
    label: (gen) => `Failed ${formatDistanceToNow(gen.generatedAt, { addSuffix: true })}`,
  },
  superseded: {
    Icon: MinusCircle,
    tint: SOFT,
    label: () => 'Discarded — replaced by a newer attempt',
  },
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
        className="absolute left-2 top-3 inline-block h-4 w-4 rounded-full"
        style={{
          background: `${visual.tint}22`,
          border: `2px solid ${visual.tint}`,
          boxShadow: `0 0 0 4px ${LUMEN}`,
        }}
      />

      <div
        className="flex flex-col gap-2 rounded-xl p-4 transition"
        style={{
          background: WHITE,
          border: `1px solid ${open ? `${FATHOM}55` : LUMEN_DK}`,
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-2.5">
            <visual.Icon
              className={cn('mt-0.5 h-4 w-4 shrink-0', isPending && 'animate-spin')}
              style={{ color: visual.tint }}
            />
            <div className="flex min-w-0 flex-col">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[14px] font-medium" style={{ color: VAST }}>
                  {visual.label(generation)}
                </p>
                {isActive && (
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] uppercase"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      background: `${FATHOM}14`,
                      color: FATHOM,
                      letterSpacing: '0.18em',
                    }}
                  >
                    <Sparkles className="h-3 w-3" />
                    Active
                  </span>
                )}
              </div>
              <span
                className="mt-0.5 text-[11px]"
                style={{ fontFamily: 'var(--font-mono)', color: MUTED }}
                title={format(generation.generatedAt, 'PPpp')}
              >
                {format(generation.generatedAt, 'MMM d, yyyy · HH:mm')}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {showRetry && (
              <motion.button
                onClick={() => generate.mutate(planId)}
                disabled={generate.isPending}
                whileHover={generate.isPending ? undefined : { background: `${PULSE}10` }}
                whileTap={generate.isPending ? undefined : { scale: 0.97 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] disabled:opacity-40"
                style={{
                  fontFamily: 'var(--font-mono)',
                  background: WHITE,
                  color: PULSE,
                  border: `1px solid ${PULSE}55`,
                }}
              >
                <RefreshCw className={cn('h-3.5 w-3.5', generate.isPending && 'animate-spin')} />
                retry
              </motion.button>
            )}
            {isSucceeded && (
              <CollapsibleTrigger asChild>
                <motion.button
                  whileHover={{ background: LUMEN, borderColor: '#cfcfb8' }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.16, ease: 'easeOut' }}
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px]"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    background: open ? LUMEN : WHITE,
                    color: VAST,
                    border: `1px solid ${LUMEN_DK}`,
                  }}
                >
                  <ChevronDown
                    className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')}
                  />
                  {open ? 'hide' : 'view'}
                </motion.button>
              </CollapsibleTrigger>
            )}
          </div>
        </div>

        {isFailed && generation.errorMessage && (
          <div
            className="rounded-lg p-3 text-[12px]"
            style={{
              background: 'rgba(127,28,52,0.06)',
              border: `1px solid ${PULSE}22`,
              color: PULSE,
            }}
          >
            <span className="font-medium">
              {generation.errorCode ?? 'GENERATION_FAILED'}:
            </span>{' '}
            {generation.errorMessage}
          </div>
        )}
      </div>

      {isSucceeded && (
        <CollapsibleContent className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
          <div
            className="mt-3 ml-2 rounded-xl p-4"
            style={{ background: LUMEN, border: `1px dashed ${LUMEN_DK}` }}
          >
            {open && <GenerationSuggestionsGrid planId={planId} generationId={generation.id} />}
          </div>
        </CollapsibleContent>
      )}
    </Collapsible>
  );
}
