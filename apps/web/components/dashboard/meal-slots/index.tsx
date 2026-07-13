'use client';

import { ArrowRight, Check, Pin, RotateCw, TriangleAlert, ChefHat, PenLine } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { LogMealModal } from '@/components/dashboard/meal-slots/_components/log-meal-modal';
import { useMealSlots } from '@/components/dashboard/meal-slots/_hooks/use-meal-slots';
import { optionLabel } from '@/lib/suggestion';
import type { SuggestionSlot, SuggestionOption } from '@repo/shared';

const primaryBtn =
  'inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-dark-green disabled:pointer-events-none disabled:opacity-50';
const ghostBtn =
  'inline-flex w-full items-center justify-center gap-2 rounded-xl border border-sage bg-white px-4 py-2 text-sm font-medium text-charcoal transition-colors hover:bg-canvas disabled:pointer-events-none disabled:opacity-50';

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
    actions,
  } = useMealSlots();

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
      <div className="flex items-center gap-3 rounded-2xl border border-tomato/30 bg-tomato/[0.06] p-4 text-[13px] text-tomato">
        <TriangleAlert className="h-4 w-4 shrink-0" />
        Failed to load meal slots: {slotsError.message}
      </div>
    );

  if (!slotsData?.slots.length)
    return (
      <div className="rounded-2xl border border-dashed border-sage bg-white p-5 text-[13px] text-slate">
        No meal suggestions available — create or activate a plan to get started.
      </div>
    );

  const dateStr = new Date(`${slotsData.date}T00:00:00`).toLocaleDateString('en-PK', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <>
      <section className="flex flex-col gap-4">
        <SectionHeader title="Today's meals" subtitle={dateStr} />

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
                  isLogged ? 'border-green/50 bg-[#f0f9e0]/50' : 'border-sage bg-white'
                }`}
              >
                <div className="flex items-center justify-between border-b border-sage/70 px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-xl text-sm font-semibold ${
                        isLogged ? 'bg-green text-white' : 'bg-green/10 text-green'
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
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate/60">
                      Ready
                    </span>
                  )}
                </div>

                <div className="flex flex-1 flex-col gap-3 p-5">
                  {isLogged && loggedMeal ? (
                    <>
                      <div className="rounded-xl border border-green/20 bg-white p-4">
                        <div className="text-xs font-semibold uppercase tracking-wide text-green">
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
                            ₨ {loggedMeal.actualAmountSpent.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {slot.options.length > 0 && (
                        <div className="flex flex-col gap-1.5">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate/60">
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
                              <span className="shrink-0 text-[11px] text-slate/60">
                                ₨ {option.estimatedPrice.toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => actions.setExpandedSlotId(slot.mealTypeId)}
                        className={`${ghostBtn} mt-auto`}
                      >
                        Change choice
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </>
                  ) : (
                    <>
                      {slot.options.slice(0, 2).map((option: SuggestionOption) => (
                        <div
                          key={option.id}
                          className="rounded-xl border border-sage bg-canvas px-4 py-3"
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
                            <span className="shrink-0 font-display text-[14px] font-bold text-green">
                              ₨ {option.estimatedPrice.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => actions.setExpandedSlotId(slot.mealTypeId)}
                        className={`${primaryBtn} mt-auto`}
                      >
                        View all options
                        <ArrowRight className="h-4 w-4" />
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
          </DialogHeader>

          <div className="flex flex-col gap-3 overflow-y-auto py-2 pr-1">
            {expandedSlot?.options.map((option: SuggestionOption) => (
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
                          <span className="shrink-0 text-[11px] text-slate/60">
                            ₨ {item.price.toLocaleString()}
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
                    <p className="mt-0.5 text-[12px] italic text-slate/60">{option.notes}</p>
                  )}
                  <p className="mt-1 font-display text-base font-bold text-charcoal">
                    ₨ {option.estimatedPrice.toLocaleString()}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    actions.openLogModal(expandedSlotId!, { type: 'suggestion', option })
                  }
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-green px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-dark-green"
                >
                  Choose
                </button>
              </div>
            ))}

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
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-green/10 text-green">
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
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-sage bg-white px-3.5 py-2 text-xs font-medium text-charcoal transition-colors hover:bg-canvas"
              >
                Log
              </button>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-xl border border-dashed border-sage bg-canvas p-4">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-green/10 text-green">
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
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-sage bg-white px-3.5 py-2 text-xs font-medium text-charcoal transition-colors hover:bg-canvas"
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
  const toneClass = tone === 'green' ? 'bg-green/15 text-dark-green' : 'bg-sage text-dark-green';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${toneClass}`}
    >
      {icon}
      {label}
    </span>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-widest text-green">Meals</span>
        <h2 className="font-display text-2xl font-semibold tracking-tight text-charcoal">
          {title}
        </h2>
      </div>
      {subtitle && (
        <span className="flex items-center gap-1.5 text-[12px] text-slate">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green" />
          {subtitle}
        </span>
      )}
    </div>
  );
}
