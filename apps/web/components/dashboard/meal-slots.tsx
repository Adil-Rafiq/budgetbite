'use client';

import { useState } from 'react';
import { Coffee, Sun, Moon, Check, Star, ThumbsDown, PenLine } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useMealPlanSuggestions } from '@/hooks/use-meal-plan';
import type { GetSuggestionsQuery } from '@repo/shared';

// ─── Types ────────────────────────────────────────────────────────────────────

type SlotData = NonNullable<ReturnType<typeof useMealPlanSuggestions>['data']>['slots'][number];
type MealOption = SlotData['options'][number];

type LogPayload =
  | { type: 'suggestion'; option: MealOption; actualAmountSpent: number; rating: number }
  | {
      type: 'custom';
      restaurantName: string;
      manualDescription: string;
      actualAmountSpent: number;
      rating: number;
    };

// ─── Mock hook — swap body for real mutation when ready ───────────────────────

function useLogMealChoice() {
  const [isLoading, setIsLoading] = useState(false);

  const logChoice = async (_mealTypeId: string, _payload: LogPayload): Promise<void> => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 800)); // simulate network
    setIsLoading(false);
    // TODO: replace with real API call + cache invalidation
  };

  return { logChoice, isLoading };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const slotIcons: Record<string, React.ElementType> = {
  breakfast: Coffee,
  lunch: Sun,
  dinner: Moon,
};

const slotColors: Record<string, string> = {
  breakfast: 'text-chart-1 bg-chart-1/10',
  lunch: 'text-chart-4 bg-chart-4/10',
  dinner: 'text-chart-3 bg-chart-3/10',
};

const defaultSlotColor = 'text-primary bg-primary/10';

// ─── Sub-components ───────────────────────────────────────────────────────────

function MealSlotsSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Skeleton className="w-8 h-8 rounded-lg" />
              <div className="flex flex-col gap-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Skeleton className="h-14 w-full rounded-lg" />
            <Skeleton className="h-14 w-full rounded-lg" />
            <Skeleton className="h-8 w-full rounded-md mt-1" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function MealSlotsError({ message }: { message: string }) {
  return (
    <div className="p-4 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 text-sm">
      {message}
    </div>
  );
}

// ─── Log modal (shared for both suggestion + custom) ─────────────────────────

interface LogModalState {
  open: boolean;
  mealTypeId: string | null;
  option: MealOption | null; // null = custom entry
}

function LogMealModal({
  state,
  onClose,
  onSave,
  isSaving,
}: {
  state: LogModalState;
  onClose: () => void;
  onSave: (payload: LogPayload) => void;
  isSaving: boolean;
}) {
  const [rating, setRating] = useState(0);
  const [actualAmount, setActualAmount] = useState(state.option?.estimatedPrice ?? 0);
  const [restaurantName, setRestaurantName] = useState('');
  const [manualDescription, setManualDescription] = useState('');

  const isCustom = state.option === null;

  const handleSave = () => {
    if (isCustom) {
      onSave({
        type: 'custom',
        restaurantName,
        manualDescription,
        actualAmountSpent: actualAmount,
        rating,
      });
    } else {
      onSave({
        type: 'suggestion',
        option: state.option!,
        actualAmountSpent: actualAmount,
        rating,
      });
    }
  };

  return (
    <Dialog open={state.open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {isCustom ? 'Log custom meal' : 'Log your meal'}
          </DialogTitle>
          <DialogDescription>
            {isCustom
              ? 'Enter the details of what you had.'
              : 'Confirm the amount spent and rate your meal.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-2">
          {/* Suggestion summary OR custom fields */}
          {!isCustom ? (
            <div className="rounded-lg bg-secondary p-3">
              <p className="font-medium text-card-foreground">
                {state.option!.menuItemName ?? '—'}
              </p>
              <p className="text-sm text-muted-foreground">{state.option!.restaurantName ?? '—'}</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                <Label htmlFor="restaurant-name">Restaurant name</Label>
                <Input
                  id="restaurant-name"
                  placeholder="e.g. Burns Road Nihari"
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="manual-desc">What did you have?</Label>
                <Input
                  id="manual-desc"
                  placeholder="e.g. Nihari with naan"
                  value={manualDescription}
                  onChange={(e) => setManualDescription(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="actual-amount">Actual amount spent (PKR)</Label>
            <Input
              id="actual-amount"
              type="number"
              value={actualAmount}
              onChange={(e) => setActualAmount(Number(e.target.value))}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Rating</Label>
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setRating(i + 1)}
                  className="p-0.5"
                  aria-label={`Rate ${i + 1} stars`}
                >
                  <Star
                    className={`w-6 h-6 transition-colors ${
                      i < rating ? 'text-chart-4 fill-chart-4' : 'text-muted-foreground/30'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <Button className="w-full" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save meal'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function MealSlots() {
  const query: GetSuggestionsQuery = { date: new Date().toISOString().split('T')[0]! };
  const { data: slotsData, isLoading, error } = useMealPlanSuggestions(query);
  const { logChoice, isLoading: isSaving } = useLogMealChoice();

  const [chosenMeals, setChosenMeals] = useState<Record<string, MealOption | 'custom'>>({});
  const [expandedSlotId, setExpandedSlotId] = useState<string | null>(null);
  const [logModal, setLogModal] = useState<LogModalState>({
    open: false,
    mealTypeId: null,
    option: null,
  });

  const openLogModal = (mealTypeId: string, option: MealOption | null) => {
    setExpandedSlotId(null);
    setLogModal({ open: true, mealTypeId, option });
  };

  const handleLogClose = () => setLogModal({ open: false, mealTypeId: null, option: null });

  const handleSave = async (payload: LogPayload) => {
    if (!logModal.mealTypeId) return;
    await logChoice(logModal.mealTypeId, payload);
    // Mark as chosen only after successful save
    setChosenMeals((prev) => ({
      ...prev,
      [logModal.mealTypeId!]: payload.type === 'suggestion' ? payload.option : 'custom',
    }));
    handleLogClose();
  };

  if (isLoading)
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-6 w-40" />
        <MealSlotsSkeleton />
      </div>
    );

  if (error) return <MealSlotsError message={`Failed to load meal slots: ${error.message}`} />;

  if (!slotsData?.slots.length)
    return (
      <p className="text-sm text-muted-foreground">No meal suggestions available for today.</p>
    );

  const expandedSlot = slotsData.slots.find((s) => s.mealTypeId === expandedSlotId);

  return (
    <>
      <div className="flex flex-col gap-4">
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

        <div className="grid gap-4 lg:grid-cols-3">
          {slotsData.slots.map((slot) => {
            const key = slot.mealTypeKey.toLowerCase();
            const Icon = slotIcons[key] ?? Coffee;
            const colors = slotColors[key] ?? defaultSlotColor;
            const chosen = chosenMeals[slot.mealTypeId];

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
                    {chosen && (
                      <Badge variant="secondary" className="text-accent bg-accent/10 border-0">
                        <Check className="w-3 h-3 mr-1" />
                        Logged
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  {chosen && chosen !== 'custom' ? (
                    <div className="rounded-lg bg-secondary p-3">
                      <p className="font-medium text-sm text-card-foreground">
                        {chosen.menuItemName ?? '—'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {chosen.restaurantName ?? '—'}
                      </p>
                      <p className="text-sm font-semibold text-primary mt-1">
                        PKR {chosen.estimatedPrice.toLocaleString()}
                      </p>
                    </div>
                  ) : chosen === 'custom' ? (
                    <div className="rounded-lg bg-secondary p-3">
                      <p className="font-medium text-sm text-card-foreground">Custom entry</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Logged manually</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {slot.options.slice(0, 2).map((option) => (
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
                        onClick={() => setExpandedSlotId(slot.mealTypeId)}
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
      <Dialog open={expandedSlotId !== null} onOpenChange={() => setExpandedSlotId(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="text-foreground capitalize">
              Choose your {expandedSlot?.mealTypeLabel}
            </DialogTitle>
            <DialogDescription>Pick a suggested meal or log your own.</DialogDescription>
          </DialogHeader>

          {/* Scrollable options list */}
          <div className="flex flex-col gap-3 overflow-y-auto pr-1 py-2">
            {expandedSlot?.options.map((option) => (
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
                  <Button size="sm" onClick={() => openLogModal(expandedSlotId!, option)}>
                    Choose
                  </Button>
                  <Button variant="ghost" size="sm" className="text-muted-foreground">
                    <ThumbsDown className="w-3.5 h-3.5" />
                    <span className="sr-only">Not interested</span>
                  </Button>
                </div>
              </div>
            ))}

            {/* Custom entry card */}
            <Separator className="my-1" />
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
                onClick={() => openLogModal(expandedSlotId!, null)}
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
        onClose={handleLogClose}
        onSave={handleSave}
        isSaving={isSaving}
      />
    </>
  );
}
