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
import { Pill } from '@/components/motion';
import type { SuggestionSlot, SuggestionOption } from '@repo/shared';

const LUMEN = '#ffffeb';
const LUMEN_DK = '#e4e4d0';
const VAST = '#1a1a1a';
const FATHOM = '#034f46';
const AMBER = '#b8741a';
const WHITE = '#ffffff';
const MUTED = '#71716a';
const SOFT = '#a6a691';

function SkeletonCard() {
  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: WHITE, border: `1px solid ${LUMEN_DK}` }}
    >
      <div className="h-3 w-20 rounded animate-pulse" style={{ background: LUMEN }} />
      <div className="mt-4 h-14 w-full rounded-lg animate-pulse" style={{ background: LUMEN }} />
      <div className="mt-3 h-14 w-full rounded-lg animate-pulse" style={{ background: LUMEN }} />
      <div className="mt-3 h-9 w-full rounded-full animate-pulse" style={{ background: LUMEN }} />
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
      <div
        className="flex items-center gap-3 rounded-xl p-4 text-[13px]"
        style={{ background: 'rgba(127,28,52,0.06)', border: '1px solid #7f1c34', color: '#7f1c34' }}
      >
        <span style={{ fontFamily: 'var(--font-mono)' }}>!</span>
        Failed to load meal slots: {slotsError.message}
      </div>
    );

  if (!slotsData?.slots.length)
    return (
      <div
        className="rounded-2xl p-5 text-[13px]"
        style={{ background: WHITE, border: `1px solid ${LUMEN_DK}`, color: MUTED }}
      >
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
                className="flex flex-col overflow-hidden rounded-2xl"
                style={{
                  background: WHITE,
                  border: `1px solid ${LUMEN_DK}`,
                  boxShadow: '0 1px 0 rgba(0,0,0,0.02)',
                }}
              >
                <div
                  className="flex items-center justify-between px-5 py-3"
                  style={{ background: LUMEN, borderBottom: `1px solid ${LUMEN_DK}` }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[12px]"
                      style={{
                        background: 'rgba(3,79,70,0.10)',
                        color: FATHOM,
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 600,
                      }}
                    >
                      {slot.mealTypeLabel.slice(0, 1).toUpperCase()}
                    </span>
                    <div className="flex flex-col">
                      <span
                        className="capitalize"
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 16,
                          fontWeight: 600,
                          letterSpacing: '-0.01em',
                          color: VAST,
                        }}
                      >
                        {slot.mealTypeLabel}
                      </span>
                    </div>
                  </div>
                  {isLogged ? (
                    <StatusPill color={FATHOM} bg="rgba(3,79,70,0.10)" label="logged" glyph="✓" />
                  ) : isPinned ? (
                    <StatusPill color={AMBER} bg="rgba(184,116,26,0.10)" label="pinned" glyph="⊙" />
                  ) : (
                    <span
                      className="text-[10px] uppercase"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        color: SOFT,
                        letterSpacing: '0.18em',
                      }}
                    >
                      ready
                    </span>
                  )}
                </div>

                <div className="flex flex-1 flex-col gap-3 p-5">
                  {isLogged && loggedMeal ? (
                    <>
                      <div
                        className="rounded-xl p-4"
                        style={{
                          background: 'rgba(3,79,70,0.05)',
                          border: `1px solid rgba(3,79,70,0.18)`,
                        }}
                      >
                        <div
                          className="text-[10px] uppercase"
                          style={{
                            fontFamily: 'var(--font-mono)',
                            color: FATHOM,
                            letterSpacing: '0.22em',
                          }}
                        >
                          logged
                        </div>
                        <div className="mt-1.5 flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p
                              className="truncate"
                              style={{
                                fontFamily: 'var(--font-display)',
                                fontSize: 15,
                                fontWeight: 600,
                                color: VAST,
                                letterSpacing: '-0.01em',
                              }}
                            >
                              {loggedMeal.isCustom
                                ? (loggedMeal.manualDescription ?? 'Custom entry')
                                : (loggedMeal.menuItemName ?? '—')}
                            </p>
                            {loggedMeal.restaurantName && (
                              <p
                                className="mt-0.5 truncate text-[12px]"
                                style={{ color: MUTED }}
                              >
                                {loggedMeal.restaurantName}
                              </p>
                            )}
                          </div>
                          <span
                            style={{
                              fontFamily: 'var(--font-display)',
                              fontSize: 16,
                              fontWeight: 700,
                              color: VAST,
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
                            className="text-[10px] uppercase"
                            style={{
                              fontFamily: 'var(--font-mono)',
                              color: SOFT,
                              letterSpacing: '0.18em',
                            }}
                          >
                            other options
                          </p>
                          {slot.options.slice(0, 2).map((option: SuggestionOption) => (
                            <div
                              key={option.id}
                              className="flex items-center justify-between rounded-lg px-3 py-1.5 opacity-60"
                            >
                              <p className="mr-2 truncate text-[12px]" style={{ color: MUTED }}>
                                {option.menuItemName ?? '—'}
                              </p>
                              <span
                                className="shrink-0 text-[11px]"
                                style={{
                                  fontFamily: 'var(--font-mono)',
                                  color: SOFT,
                                }}
                              >
                                ₨ {option.estimatedPrice.toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      <Pill
                        variant="ghost"
                        onClick={() => actions.setExpandedSlotId(slot.mealTypeId)}
                        className="mt-auto w-full"
                        style={{ padding: '8px 16px', fontSize: 12, background: 'transparent' }}
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
                          className="rounded-xl px-4 py-3"
                          style={{
                            background: LUMEN,
                            border: `1px solid ${LUMEN_DK}`,
                          }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p
                                className="truncate"
                                style={{
                                  fontFamily: 'var(--font-display)',
                                  fontSize: 14,
                                  fontWeight: 600,
                                  color: VAST,
                                  letterSpacing: '-0.01em',
                                }}
                              >
                                {option.menuItemName ?? '—'}
                              </p>
                              <p
                                className="mt-0.5 truncate text-[12px]"
                                style={{ color: MUTED }}
                              >
                                {option.restaurantName ?? '—'}
                              </p>
                            </div>
                            <span
                              className="shrink-0"
                              style={{
                                fontFamily: 'var(--font-display)',
                                fontSize: 14,
                                fontWeight: 700,
                                color: FATHOM,
                                letterSpacing: '-0.01em',
                              }}
                            >
                              ₨ {option.estimatedPrice.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}

                      <Pill
                        onClick={() => actions.setExpandedSlotId(slot.mealTypeId)}
                        className="mt-auto w-full"
                        style={{ padding: '10px 16px', fontSize: 13 }}
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
              className="capitalize"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 20,
                fontWeight: 600,
                letterSpacing: '-0.01em',
                color: VAST,
              }}
            >
              Choose your {expandedSlot?.mealTypeLabel}
            </DialogTitle>
            <DialogDescription style={{ color: MUTED, fontSize: 13 }}>
              Pick a suggested meal or log your own.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 overflow-y-auto py-2 pr-1">
            {expandedSlot?.options.map((option: SuggestionOption) => (
              <div
                key={option.id}
                className="flex items-start justify-between gap-4 rounded-xl p-4"
                style={{ border: `1px solid ${LUMEN_DK}`, background: WHITE }}
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 14,
                      fontWeight: 600,
                      color: VAST,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {option.menuItemName ?? '—'}
                  </p>
                  <p className="text-[12px]" style={{ color: MUTED }}>
                    {option.restaurantName ?? '—'}
                  </p>
                  {option.description && (
                    <p className="mt-0.5 text-[12px] line-clamp-2" style={{ color: MUTED }}>
                      {option.description}
                    </p>
                  )}
                  {option.notes && (
                    <p
                      className="mt-0.5 text-[12px] italic"
                      style={{ color: SOFT, fontFamily: 'var(--font-mono)' }}
                    >
                      {option.notes}
                    </p>
                  )}
                  <p
                    className="mt-1"
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 16,
                      fontWeight: 700,
                      color: VAST,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    ₨ {option.estimatedPrice.toLocaleString()}
                  </p>
                </div>

                <Pill
                  onClick={() =>
                    actions.openLogModal(expandedSlotId!, { type: 'suggestion', option })
                  }
                  className="shrink-0"
                  style={{ padding: '8px 16px', fontSize: 12 }}
                >
                  Choose
                </Pill>
              </div>
            ))}

            <div
              className="my-1 h-px"
              style={{ background: LUMEN_DK }}
            />

            <div
              className="flex items-center justify-between gap-4 rounded-xl p-4"
              style={{
                border: `1px dashed ${LUMEN_DK}`,
                background: LUMEN,
              }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[13px]"
                  style={{
                    background: 'rgba(3,79,70,0.10)',
                    color: FATHOM,
                    fontFamily: 'var(--font-mono)',
                  }}
                  aria-hidden
                >
                  ✎
                </span>
                <div>
                  <p
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 14,
                      fontWeight: 600,
                      color: VAST,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    Log your own
                  </p>
                  <p className="text-[12px]" style={{ color: MUTED }}>
                    Had something else? Enter it manually.
                  </p>
                </div>
              </div>
              <Pill
                variant="ghost"
                onClick={() => actions.openLogModal(expandedSlotId!, { type: 'custom' })}
                className="shrink-0"
                style={{ padding: '8px 16px', fontSize: 12 }}
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
  color: string;
  bg: string;
  label: string;
  glyph: string;
}

function StatusPill({ color, bg, label, glyph }: StatusPillProps) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] uppercase"
      style={{
        background: bg,
        color,
        fontFamily: 'var(--font-mono)',
        letterSpacing: '0.16em',
        fontWeight: 600,
      }}
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
          className="text-[10px] uppercase"
          style={{ fontFamily: 'var(--font-mono)', color: FATHOM, letterSpacing: '0.22em' }}
        >
          /meals
        </span>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: '-0.02em',
            color: VAST,
          }}
        >
          {title}
        </h2>
      </div>
      {subtitle && (
        <span
          className="text-[12px]"
          style={{ fontFamily: 'var(--font-mono)', color: MUTED }}
        >
          {subtitle}
        </span>
      )}
    </div>
  );
}
