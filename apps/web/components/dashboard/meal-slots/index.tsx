'use client';

import { Check, Pin, ThumbsDown, PenLine } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { LogMealModal } from '@/components/dashboard/meal-slots/_components/log-meal-modal';
import { MealSlotsSkeleton } from '@/components/dashboard/meal-slots/_components/meal-slots-skeleton';
import { MealSlotsError } from '@/components/dashboard/meal-slots/_components/meal-slots-error';
import { useMealSlots } from '@/components/dashboard/meal-slots/_hooks/use-meal-slots';
import { getMealTypeVisual } from '@/lib/meal-type-visuals';
import type { SuggestionSlot, SuggestionOption } from '@repo/shared';

// ─── Main component ───────────────────────────────────────────────────────────

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
      <div className="flex flex-col gap-4">
        <Skeleton className="h-6 w-40" />
        <MealSlotsSkeleton />
      </div>
    );

  if (slotsError)
    return <MealSlotsError message={`Failed to load meal slots: ${slotsError.message}`} />;

  if (!slotsData?.slots.length)
    return (
      <div className="p-4 bg-muted text-muted-foreground rounded-lg border border-border text-sm">
        No meal suggestions available — create or activate a plan to get started.
      </div>
    );

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">{"Today's Meals"}</h2>
          <span className="text-sm text-muted-foreground">
            {new Date(slotsData.date).toLocaleDateString('en-PK', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </span>
        </div>

        {/* ── Slot cards ── */}
        <div className="grid gap-4 lg:grid-cols-3">
          {slotsData.slots.map((slot: SuggestionSlot) => {
            const { Icon, colors } = getMealTypeVisual(slot.mealTypeKey);
            const loggedMeal = loggedByMealType[slot.mealTypeId];
            const isLogged = !!loggedMeal;
            // Pin merge in mealPlanService.getSuggestionsForDay collapses a
            // pinned slot to a single option with source='pin'. Surface that
            // to the user with a small badge so they know this slot is locked.
            const isPinned = !isLogged && slot.options.length > 0 && slot.options[0]?.source === 'pin';

            return (
              <Card key={slot.mealTypeId} className="border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-lg ${colors}`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <CardTitle className="text-sm capitalize text-card-foreground">
                        {slot.mealTypeLabel}
                      </CardTitle>
                    </div>
                    {isLogged ? (
                      <Badge variant="secondary" className="text-accent bg-accent/10 border-0">
                        <Check className="w-3 h-3 mr-1" />
                        Logged
                      </Badge>
                    ) : isPinned ? (
                      <Badge variant="secondary" className="text-primary bg-primary/10 border-0">
                        <Pin className="w-3 h-3 mr-1" />
                        Pinned
                      </Badge>
                    ) : null}
                  </div>
                </CardHeader>

                <CardContent>
                  {isLogged && loggedMeal ? (
                    <div className="flex flex-col gap-3">
                      {/* Logged meal hero */}
                      <div className="rounded-lg bg-accent/5 border border-accent/20 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-accent uppercase tracking-wide mb-1">
                              Logged
                            </p>
                            <p className="font-semibold text-sm text-card-foreground truncate">
                              {loggedMeal.isCustom
                                ? (loggedMeal.manualDescription ?? 'Custom entry')
                                : (loggedMeal.menuItemName ?? '—')}
                            </p>
                            {loggedMeal.restaurantName && (
                              <p className="text-xs text-muted-foreground truncate mt-0.5">
                                {loggedMeal.restaurantName}
                              </p>
                            )}
                          </div>
                          <span className="text-sm font-bold text-card-foreground shrink-0">
                            PKR {loggedMeal.actualAmountSpent.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Other options — condensed + muted */}
                      {slot.options.length > 0 && (
                        <div className="flex flex-col gap-1">
                          <p className="text-xs text-muted-foreground px-0.5">Other options</p>
                          {slot.options.slice(0, 2).map((option: SuggestionOption) => (
                            <div
                              key={option.id}
                              className="flex items-center justify-between rounded-md px-2.5 py-1.5 opacity-50"
                            >
                              <p className="text-xs text-muted-foreground truncate mr-2">
                                {option.menuItemName ?? '—'}
                              </p>
                              <span className="text-xs text-muted-foreground shrink-0">
                                PKR {option.estimatedPrice.toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-muted-foreground h-7"
                        onClick={() => actions.setExpandedSlotId(slot.mealTypeId)}
                      >
                        Change choice
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {/* Preview of first 2 options */}
                      {slot.options.slice(0, 2).map((option: SuggestionOption) => (
                        <div
                          key={option.id}
                          className="flex items-center justify-between rounded-lg bg-secondary p-3"
                        >
                          <div className="min-w-0 mr-3">
                            <p className="font-medium text-sm text-card-foreground truncate">
                              {option.menuItemName ?? '—'}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {option.restaurantName ?? '—'}
                            </p>
                          </div>
                          <span className="text-sm font-semibold text-primary shrink-0">
                            PKR {option.estimatedPrice.toLocaleString()}
                          </span>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-1"
                        onClick={() => actions.setExpandedSlotId(slot.mealTypeId)}
                      >
                        View all options
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* ── Suggestion modal ── */}
      <Dialog open={expandedSlotId !== null} onOpenChange={() => actions.setExpandedSlotId(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="text-foreground capitalize">
              Choose your {expandedSlot?.mealTypeLabel}
            </DialogTitle>
            <DialogDescription>Pick a suggested meal or log your own.</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 overflow-y-auto pr-1 py-2">
            {expandedSlot?.options.map((option: SuggestionOption) => (
              <div
                key={option.id}
                className="flex items-start justify-between gap-4 rounded-lg border border-border p-4"
              >
                <div className="flex flex-col gap-1 min-w-0 flex-1">
                  <p className="font-semibold text-sm text-card-foreground">
                    {option.menuItemName ?? '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">{option.restaurantName ?? '—'}</p>
                  {option.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {option.description}
                    </p>
                  )}
                  {option.notes && (
                    <p className="text-xs text-muted-foreground italic mt-0.5">{option.notes}</p>
                  )}
                  <p className="text-sm font-bold text-card-foreground mt-1">
                    PKR {option.estimatedPrice.toLocaleString()}
                  </p>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  <Button
                    size="sm"
                    onClick={() =>
                      actions.openLogModal(expandedSlotId!, { type: 'suggestion', option })
                    }
                  >
                    Choose
                  </Button>
                  <Button variant="ghost" size="sm" className="text-muted-foreground" disabled>
                    <ThumbsDown className="w-3.5 h-3.5" />
                    <span className="sr-only">Not interested</span>
                  </Button>
                </div>
              </div>
            ))}

            <Separator className="my-1" />

            {/* Custom entry */}
            <div className="flex items-center justify-between gap-4 rounded-lg border border-dashed border-border p-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary shrink-0">
                  <PenLine className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-card-foreground">Log your own</p>
                  <p className="text-xs text-muted-foreground">
                    Had something else? Enter it manually.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="shrink-0"
                onClick={() => actions.openLogModal(expandedSlotId!, { type: 'custom' })}
              >
                Enter
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Log meal modal ── */}
      <LogMealModal
        state={logModal}
        onClose={actions.closeLogModal}
        onSave={actions.handleSave}
        isSaving={isSaving}
      />
    </>
  );
}
