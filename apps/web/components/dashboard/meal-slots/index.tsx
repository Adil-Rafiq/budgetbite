'use client';

import { useState } from 'react';
import { ArrowRight, Check, Pin, RotateCw, ChefHat, PenLine, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { LogMealModal } from '@/components/dashboard/meal-slots/_components/log-meal-modal';
import { useMealSlots } from '@/components/dashboard/meal-slots/_hooks/use-meal-slots';
import { BudgetFitBadge } from '@/components/budget-fit-badge';
import { DataError } from '@/components/data-error';
import { optionLabel } from '@/lib/suggestion';
import { formatPKR } from '@/lib/currency';
import { classifyBudgetFit, estimateMealCost } from '@repo/shared';
import type { SuggestionSlot, SuggestionOption, BudgetFit } from '@repo/shared';
import { FOCUS_RING } from '@/lib/focus-ring';

const ghostBtn = `inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-sage bg-white px-4 py-2 text-sm font-medium text-charcoal transition-colors hover:bg-canvas disabled:pointer-events-none disabled:opacity-50 ${FOCUS_RING}`;

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-sage bg-white p-5">
      <div className="h-3 w-20 animate-pulse rounded bg-sage" />
      <div className="mt-4 h-14 w-full animate-pulse rounded-lg bg-canvas" />
      <div className="mt-3 h-14 w-full animate-pulse rounded-lg bg-canvas" />
      <div className="mt-3 h-9 w-full animate-pulse rounded-xl bg-canvas" />
    </div>
  );
}

export function MealSlots() {
  const {
    slotsData,
    isSlotsLoading,
    slotsError,
    isSaving,
    isRerolling,
    expandedSlotId,
    expandedSlot,
    logModal,
    loggedByMealType,
    budget,
    refetchSlots,
    isRemoving,
    actions,
  } = useMealSlots();

  // Which logged slot is showing its inline "remove this meal?" confirm.
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  // Fit cue for one option against the budget, or null when there's no usable
  // per-meal target yet.
  //
  // This takes the whole option rather than a bare price on purpose. It used to
  // take `option.estimatedPrice` — the AI's menu subtotal, with no delivery fee
  // and no minimum-order floor — while the restaurants surface passed the same
  // dish through `estimateMealCost`. The comment here claimed both screens
  // agreed; they did not, and a ₨640 order could read "Fits budget" on the
  // dashboard and "Tight" on the restaurant page. One badge, one meaning.
  const fitOf = (option: {
    estimatedPrice: number;
    deliveryFee?: number | null;
    minimumOrder?: number | null;
  }): BudgetFit | null =>
    budget.hasBudget
      ? classifyBudgetFit({
          itemPrice: estimateMealCost({
            itemPrice: option.estimatedPrice,
            deliveryFee: option.deliveryFee,
            minimumOrder: option.minimumOrder,
          }),
          avgBudgetPerRemainingMeal: budget.avgPerMeal,
          amountRemaining: budget.amountRemaining,
        })
      : null;

  if (isSlotsLoading)
    return (
      <section className="flex flex-col gap-4">
        <SectionHeader title="Today's meals" subtitle="" />
        <div className="grid gap-4 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </section>
    );

  if (slotsError)
    return (
      <DataError
        message="We couldn't load today's meals just now."
        onRetry={() => refetchSlots()}
      />
    );

  if (!slotsData?.slots.length)
    return (
      <div className="rounded-2xl border border-dashed border-sage bg-white p-5 text-[13px] text-slate">
        No meals suggested for today yet. Once your plan generates today&apos;s options,
        they&apos;ll show up here.
      </div>
    );

  const dateStr = new Date(`${slotsData.date}T00:00:00`).toLocaleDateString('en-PK', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const loggedCount = slotsData.slots.filter((s) => loggedByMealType[s.mealTypeId]).length;
  const totalSlots = slotsData.slots.length;

  return (
    <>
      <section className="flex flex-col gap-4">
        <SectionHeader
          title="Today's meals"
          subtitle={dateStr}
          progress={{ logged: loggedCount, total: totalSlots }}
        />

        <div className="grid gap-4 lg:grid-cols-3">
          {slotsData.slots.map((slot: SuggestionSlot) => {
            const loggedMeal = loggedByMealType[slot.mealTypeId];
            const isLogged = !!loggedMeal;
            const isPinned =
              !isLogged && slot.options.length > 0 && slot.options[0]?.source === 'pin';

            return (
              <article
                key={slot.mealTypeId}
                className={`flex flex-col overflow-hidden rounded-2xl border shadow-sm ${
                  isLogged ? 'border-green/50 bg-green-tint/50' : 'border-sage bg-white'
                }`}
              >
                <div className="flex items-center justify-between border-b border-sage/70 px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-xl text-sm font-semibold ${
                        isLogged ? 'bg-green-deep text-white' : 'bg-green/10 text-green-deep'
                      }`}
                    >
                      {isLogged ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        slot.mealTypeLabel.slice(0, 1).toUpperCase()
                      )}
                    </span>
                    <span className="font-display text-base font-semibold capitalize text-charcoal">
                      {slot.mealTypeLabel}
                    </span>
                  </div>
                  {isLogged ? (
                    <StatusPill tone="green" label="Logged" icon={<Check className="h-3 w-3" />} />
                  ) : isPinned ? (
                    <StatusPill tone="sage" label="Pinned" icon={<Pin className="h-3 w-3" />} />
                  ) : (
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate">
                      Undecided
                    </span>
                  )}
                </div>

                <div className="flex flex-1 flex-col gap-3 p-5">
                  {isLogged && loggedMeal ? (
                    <>
                      <div className="rounded-xl bg-white/70 p-4">
                        <div className="text-xs font-semibold uppercase tracking-wide text-green-deep">
                          Logged
                        </div>
                        <div className="mt-1.5 flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-display text-[15px] font-semibold text-charcoal">
                              {loggedMeal.isHomeCooked
                                ? (loggedMeal.manualDescription ?? 'Home-cooked meal')
                                : loggedMeal.isCustom
                                  ? (loggedMeal.manualDescription ?? 'Custom entry')
                                  : (loggedMeal.menuItemName ??
                                    loggedMeal.manualDescription ??
                                    '—')}
                            </p>
                            {loggedMeal.isHomeCooked ? (
                              <p className="mt-0.5 truncate text-[12px] text-slate">
                                🍳 Cooked at home
                              </p>
                            ) : (
                              loggedMeal.restaurantName && (
                                <p className="mt-0.5 truncate text-[12px] text-slate">
                                  {loggedMeal.restaurantName}
                                </p>
                              )
                            )}
                          </div>
                          <span className="font-display text-base font-bold text-charcoal">
                            {formatPKR(loggedMeal.actualAmountSpent)}
                          </span>
                        </div>
                      </div>

                      {slot.options.length > 0 && (
                        <div className="flex flex-col gap-1.5">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate">
                            Other options
                          </p>
                          {slot.options.slice(0, 2).map((option: SuggestionOption) => (
                            <div
                              key={option.id}
                              className="flex items-center justify-between rounded-lg px-3 py-1.5 opacity-60"
                            >
                              <p className="mr-2 truncate text-[12px] text-slate">
                                {optionLabel(option)}
                              </p>
                              <span className="shrink-0 text-[11px] text-slate">
                                {formatPKR(option.estimatedPrice)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {confirmRemoveId === loggedMeal.id ? (
                        <div className="mt-auto flex items-center gap-2 rounded-xl border border-tomato/30 bg-tomato/[0.06] p-2">
                          <span className="px-1 text-[12px] font-medium text-tomato-ink">
                            Remove this meal?
                          </span>
                          <div className="ml-auto flex gap-2">
                            <button
                              type="button"
                              onClick={() => setConfirmRemoveId(null)}
                              disabled={isRemoving}
                              className={`rounded-lg border border-sage bg-white px-3 py-1.5 text-[12px] font-medium text-charcoal transition-colors hover:bg-canvas disabled:opacity-50 ${FOCUS_RING}`}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              disabled={isRemoving}
                              onClick={async () => {
                                await actions.removeChoice(loggedMeal.id);
                                setConfirmRemoveId(null);
                              }}
                              className={`rounded-lg bg-tomato-ink px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-tomato-ink/90 disabled:opacity-50 ${FOCUS_RING}`}
                            >
                              {isRemoving ? 'Removing…' : 'Remove'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-auto flex gap-2">
                          <button
                            type="button"
                            onClick={() => actions.setExpandedSlotId(slot.mealTypeId)}
                            className={`${ghostBtn} flex-1`}
                          >
                            Change choice
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmRemoveId(loggedMeal.id)}
                            aria-label="Remove this logged meal"
                            className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-sage bg-white px-4 py-2 text-sm font-medium text-slate transition-colors hover:border-tomato/40 hover:text-tomato-ink ${FOCUS_RING}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Remove
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {slot.options.slice(0, 3).map((option: SuggestionOption) => {
                        const fit = fitOf(option);
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() =>
                              actions.openLogModal(slot.mealTypeId, { type: 'suggestion', option })
                            }
                            className={`rounded-xl border border-sage bg-canvas px-4 py-3 text-left transition-colors hover:border-green/60 hover:bg-green-tint/50 ${FOCUS_RING}`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate font-display text-[14px] font-semibold text-charcoal">
                                  {optionLabel(option)}
                                </p>
                                <p className="mt-0.5 truncate text-[12px] text-slate">
                                  {option.restaurantName ?? '—'}
                                </p>
                              </div>
                              <div className="flex shrink-0 flex-col items-end gap-1">
                                <span className="font-display text-[14px] font-bold text-green-deep">
                                  {formatPKR(option.estimatedPrice)}
                                </span>
                                {fit && <BudgetFitBadge fit={fit} />}
                              </div>
                            </div>
                          </button>
                        );
                      })}

                      <button
                        type="button"
                        onClick={() => actions.setExpandedSlotId(slot.mealTypeId)}
                        className={`${ghostBtn} mt-auto`}
                      >
                        More options
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <Dialog open={expandedSlotId !== null} onOpenChange={() => actions.setExpandedSlotId(null)}>
        <DialogContent className="flex max-h-[80vh] max-w-lg flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="font-display text-xl font-semibold capitalize tracking-tight text-charcoal">
              Choose your {expandedSlot?.mealTypeLabel}
            </DialogTitle>
            <DialogDescription className="text-[13px] text-slate">
              Pick a suggested meal or log your own.
            </DialogDescription>
            {budget.hasBudget && (
              <p className="text-[12px] text-slate">
                Per meal left:{' '}
                <span className="font-semibold text-green-deep">
                  {formatPKR(budget.avgPerMeal)}
                </span>{' '}
                · {formatPKR(budget.amountRemaining)} remaining
              </p>
            )}
          </DialogHeader>

          <div className="flex flex-col gap-3 overflow-y-auto py-2 pr-1">
            {expandedSlot?.options.map((option: SuggestionOption) => {
              const fit = fitOf(option);
              return (
                <div
                  key={option.id}
                  className="flex items-start justify-between gap-4 rounded-xl border border-sage bg-white p-4"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p className="font-display text-[14px] font-semibold text-charcoal">
                      {optionLabel(option)}
                    </p>
                    <p className="text-[12px] text-slate">{option.restaurantName ?? '—'}</p>
                    {option.items.length > 1 ? (
                      <div className="mt-0.5 flex flex-col gap-0.5">
                        {option.items.map((item) => (
                          <div
                            key={item.menuItemId}
                            className="flex items-center justify-between gap-3"
                          >
                            <p className="truncate text-[12px] text-slate">
                              {item.menuItemName ?? '—'}
                            </p>
                            <span className="shrink-0 text-[11px] text-slate">
                              {formatPKR(item.price)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      option.items[0]?.description && (
                        <p className="mt-0.5 line-clamp-2 text-[12px] text-slate">
                          {option.items[0].description}
                        </p>
                      )
                    )}
                    {option.notes && (
                      <p className="mt-0.5 text-[12px] italic text-slate">{option.notes}</p>
                    )}
                    <div className="mt-1 flex items-center gap-2">
                      <p className="font-display text-base font-bold text-charcoal">
                        {formatPKR(option.estimatedPrice)}
                      </p>
                      {fit && <BudgetFitBadge fit={fit} />}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      actions.openLogModal(expandedSlotId!, { type: 'suggestion', option })
                    }
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-green-deep px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-green-deeper ${FOCUS_RING}`}
                  >
                    Choose
                  </button>
                </div>
              );
            })}

            {expandedSlotId &&
              !loggedByMealType[expandedSlotId] &&
              expandedSlot &&
              expandedSlot.options.length > 0 &&
              expandedSlot.options[0]?.source !== 'pin' && (
                <button
                  type="button"
                  disabled={isRerolling}
                  onClick={() => actions.handleReroll(expandedSlotId)}
                  className={ghostBtn}
                >
                  {isRerolling ? (
                    'Finding new options…'
                  ) : (
                    <>
                      None of these? Get new options
                      <RotateCw className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              )}

            <div className="my-1 h-px bg-sage" />

            <div className="flex items-center justify-between gap-4 rounded-xl border border-dashed border-sage bg-canvas p-4">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-green/10 text-green-deep">
                  <ChefHat className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-display text-[14px] font-semibold text-charcoal">
                    Cook at home
                  </p>
                  <p className="text-[12px] text-slate">Made it yourself? Log the cost.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => actions.openLogModal(expandedSlotId!, { type: 'home' })}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-sage bg-white px-3.5 py-2 text-xs font-medium text-charcoal transition-colors hover:bg-canvas ${FOCUS_RING}`}
              >
                Log
              </button>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-xl border border-dashed border-sage bg-canvas p-4">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-green/10 text-green-deep">
                  <PenLine className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-display text-[14px] font-semibold text-charcoal">
                    Log your own
                  </p>
                  <p className="text-[12px] text-slate">Ordered elsewhere? Enter it manually.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => actions.openLogModal(expandedSlotId!, { type: 'custom' })}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-sage bg-white px-3.5 py-2 text-xs font-medium text-charcoal transition-colors hover:bg-canvas ${FOCUS_RING}`}
              >
                Enter
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <LogMealModal
        state={logModal}
        onClose={actions.closeLogModal}
        onSave={actions.handleSave}
        isSaving={isSaving}
        budget={budget}
      />
    </>
  );
}

interface StatusPillProps {
  tone: 'green' | 'sage';
  label: string;
  icon: React.ReactNode;
}

function StatusPill({ tone, label, icon }: StatusPillProps) {
  const toneClass = tone === 'green' ? 'bg-green/15 text-green-deep' : 'bg-sage text-green-deep';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${toneClass}`}
    >
      {icon}
      {label}
    </span>
  );
}

function SectionHeader({
  title,
  subtitle,
  progress,
}: {
  title: string;
  subtitle: string;
  progress?: { logged: number; total: number };
}) {
  const done = progress && progress.total > 0 && progress.logged >= progress.total;
  return (
    <div className="flex items-end justify-between gap-4">
      <h2 className="font-display text-2xl font-semibold tracking-tight text-charcoal sm:text-[28px]">
        {title}
      </h2>
      <div className="flex flex-col items-end gap-0.5 text-right">
        {progress && progress.total > 0 && (
          <span
            className={`inline-flex items-center gap-1.5 text-[12px] font-semibold ${
              done ? 'text-green-deep' : 'text-slate'
            }`}
          >
            {done && <Check className="h-3.5 w-3.5" />}
            {done ? 'All set for today' : `${progress.logged} of ${progress.total} logged`}
          </span>
        )}
        {subtitle && <span className="text-[12px] text-slate">{subtitle}</span>}
      </div>
    </div>
  );
}
