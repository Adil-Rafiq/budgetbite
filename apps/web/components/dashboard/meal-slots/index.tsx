'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { LogMealModal } from '@/components/dashboard/meal-slots/_components/log-meal-modal';
import { useMealSlots } from '@/components/dashboard/meal-slots/_hooks/use-meal-slots';
import { Pill } from '@/components/ui/pill';
import type { SuggestionSlot, SuggestionOption } from '@repo/shared';

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-lumen-dk bg-white p-5">
      <div className="h-3 w-20 animate-pulse rounded bg-lumen" />
      <div className="mt-4 h-14 w-full animate-pulse rounded-lg bg-lumen" />
      <div className="mt-3 h-14 w-full animate-pulse rounded-lg bg-lumen" />
      <div className="mt-3 h-9 w-full animate-pulse rounded-full bg-lumen" />
    </div>
  );
}

export function MealSlots() {
  const {
    slotsData,
    isSlotsLoading,
    slotsError,
    isSaving,
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
      <div className="flex items-center gap-3 rounded-xl border border-pulse bg-pulse/[0.06] p-4 text-[13px] text-pulse">
        <span style={{ fontFamily: 'var(--font-mono)' }}>!</span>
        Failed to load meal slots: {slotsError.message}
      </div>
    );

  if (!slotsData?.slots.length)
    return (
      <div className="rounded-2xl border border-lumen-dk bg-white p-5 text-[13px] text-ink">
        No meal suggestions available — create or activate a plan to get started.
      </div>
    );

  const dateStr = new Date(slotsData.date).toLocaleDateString('en-PK', {
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
                className="flex flex-col overflow-hidden rounded-2xl border border-lumen-dk bg-white shadow-[0_1px_0_rgba(0,0,0,0.02)]"
              >
                <div className="flex items-center justify-between border-b border-lumen-dk bg-lumen px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-fathom/10 text-[12px] text-fathom"
                      style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}
                    >
                      {slot.mealTypeLabel.slice(0, 1).toUpperCase()}
                    </span>
                    <div className="flex flex-col">
                      <span
                        className="capitalize text-vast"
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 16,
                          fontWeight: 600,
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {slot.mealTypeLabel}
                      </span>
                    </div>
                  </div>
                  {isLogged ? (
                    <StatusPill tone="fathom" label="logged" glyph="✓" />
                  ) : isPinned ? (
                    <StatusPill tone="amber" label="pinned" glyph="⊙" />
                  ) : (
                    <span
                      className="text-[10px] uppercase text-soft"
                      style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.18em' }}
                    >
                      ready
                    </span>
                  )}
                </div>

                <div className="flex flex-1 flex-col gap-3 p-5">
                  {isLogged && loggedMeal ? (
                    <>
                      <div className="rounded-xl border border-fathom/20 bg-fathom/5 p-4">
                        <div
                          className="text-[10px] uppercase text-fathom"
                          style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.22em' }}
                        >
                          logged
                        </div>
                        <div className="mt-1.5 flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p
                              className="truncate text-vast"
                              style={{
                                fontFamily: 'var(--font-display)',
                                fontSize: 15,
                                fontWeight: 600,
                                letterSpacing: '-0.01em',
                              }}
                            >
                              {loggedMeal.isCustom
                                ? (loggedMeal.manualDescription ?? 'Custom entry')
                                : (loggedMeal.menuItemName ?? '—')}
                            </p>
                            {loggedMeal.restaurantName && (
                              <p className="mt-0.5 truncate text-[12px] text-ink">
                                {loggedMeal.restaurantName}
                              </p>
                            )}
                          </div>
                          <span
                            className="text-vast"
                            style={{
                              fontFamily: 'var(--font-display)',
                              fontSize: 16,
                              fontWeight: 700,
                              letterSpacing: '-0.01em',
                            }}
                          >
                            ₨ {loggedMeal.actualAmountSpent.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {slot.options.length > 0 && (
                        <div className="flex flex-col gap-1.5">
                          <p
                            className="text-[10px] uppercase text-soft"
                            style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.18em' }}
                          >
                            other options
                          </p>
                          {slot.options.slice(0, 2).map((option: SuggestionOption) => (
                            <div
                              key={option.id}
                              className="flex items-center justify-between rounded-lg px-3 py-1.5 opacity-60"
                            >
                              <p className="mr-2 truncate text-[12px] text-ink">
                                {option.menuItemName ?? '—'}
                              </p>
                              <span
                                className="shrink-0 text-[11px] text-soft"
                                style={{ fontFamily: 'var(--font-mono)' }}
                              >
                                ₨ {option.estimatedPrice.toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      <Pill
                        variant="ghost"
                        size="xs"
                        onClick={() => actions.setExpandedSlotId(slot.mealTypeId)}
                        className="mt-auto w-full bg-transparent"
                      >
                        Change choice
                        <span style={{ fontFamily: 'var(--font-mono)', opacity: 0.5 }}>→</span>
                      </Pill>
                    </>
                  ) : (
                    <>
                      {slot.options.slice(0, 2).map((option: SuggestionOption) => (
                        <div
                          key={option.id}
                          className="rounded-xl border border-lumen-dk bg-lumen px-4 py-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p
                                className="truncate text-vast"
                                style={{
                                  fontFamily: 'var(--font-display)',
                                  fontSize: 14,
                                  fontWeight: 600,
                                  letterSpacing: '-0.01em',
                                }}
                              >
                                {option.menuItemName ?? '—'}
                              </p>
                              <p className="mt-0.5 truncate text-[12px] text-ink">
                                {option.restaurantName ?? '—'}
                              </p>
                            </div>
                            <span
                              className="shrink-0 text-fathom"
                              style={{
                                fontFamily: 'var(--font-display)',
                                fontSize: 14,
                                fontWeight: 700,
                                letterSpacing: '-0.01em',
                              }}
                            >
                              ₨ {option.estimatedPrice.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}

                      <Pill
                        size="sm"
                        onClick={() => actions.setExpandedSlotId(slot.mealTypeId)}
                        className="mt-auto w-full"
                      >
                        View all options
                        <span style={{ fontFamily: 'var(--font-mono)', opacity: 0.7 }}>→</span>
                      </Pill>
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
            <DialogTitle
              className="capitalize text-vast"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 20,
                fontWeight: 600,
                letterSpacing: '-0.01em',
              }}
            >
              Choose your {expandedSlot?.mealTypeLabel}
            </DialogTitle>
            <DialogDescription className="text-ink" style={{ fontSize: 13 }}>
              Pick a suggested meal or log your own.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 overflow-y-auto py-2 pr-1">
            {expandedSlot?.options.map((option: SuggestionOption) => (
              <div
                key={option.id}
                className="flex items-start justify-between gap-4 rounded-xl border border-lumen-dk bg-white p-4"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p
                    className="text-vast"
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 14,
                      fontWeight: 600,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {option.menuItemName ?? '—'}
                  </p>
                  <p className="text-[12px] text-ink">{option.restaurantName ?? '—'}</p>
                  {option.description && (
                    <p className="mt-0.5 line-clamp-2 text-[12px] text-ink">{option.description}</p>
                  )}
                  {option.notes && (
                    <p
                      className="mt-0.5 text-[12px] italic text-soft"
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      {option.notes}
                    </p>
                  )}
                  <p
                    className="mt-1 text-vast"
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 16,
                      fontWeight: 700,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    ₨ {option.estimatedPrice.toLocaleString()}
                  </p>
                </div>

                <Pill
                  size="xs"
                  onClick={() =>
                    actions.openLogModal(expandedSlotId!, { type: 'suggestion', option })
                  }
                  className="shrink-0"
                >
                  Choose
                </Pill>
              </div>
            ))}

            <div className="my-1 h-px bg-lumen-dk" />

            <div className="flex items-center justify-between gap-4 rounded-xl border border-dashed border-lumen-dk bg-lumen p-4">
              <div className="flex items-center gap-3">
                <span
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-fathom/10 text-[13px] text-fathom"
                  style={{ fontFamily: 'var(--font-mono)' }}
                  aria-hidden
                >
                  ✎
                </span>
                <div>
                  <p
                    className="text-vast"
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 14,
                      fontWeight: 600,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    Log your own
                  </p>
                  <p className="text-[12px] text-ink">Had something else? Enter it manually.</p>
                </div>
              </div>
              <Pill
                variant="ghost"
                size="xs"
                onClick={() => actions.openLogModal(expandedSlotId!, { type: 'custom' })}
                className="shrink-0"
              >
                Enter
              </Pill>
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
  tone: 'fathom' | 'amber';
  label: string;
  glyph: string;
}

function StatusPill({ tone, label, glyph }: StatusPillProps) {
  const toneClass = tone === 'fathom' ? 'bg-fathom/10 text-fathom' : 'bg-amber/10 text-amber';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase ${toneClass}`}
      style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.16em' }}
    >
      <span aria-hidden>{glyph}</span>
      {label}
    </span>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div className="flex flex-col gap-1">
        <span
          className="text-[10px] uppercase text-fathom"
          style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.22em' }}
        >
          /meals
        </span>
        <h2
          className="text-vast"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: '-0.02em',
          }}
        >
          {title}
        </h2>
      </div>
      {subtitle && (
        <span className="text-[12px] text-ink" style={{ fontFamily: 'var(--font-mono)' }}>
          {subtitle}
        </span>
      )}
    </div>
  );
}
