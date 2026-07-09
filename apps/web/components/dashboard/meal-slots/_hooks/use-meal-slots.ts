import { useState, useMemo } from 'react';
import { localDateString } from '@/lib/date';
import { useMealPlanSuggestions, useRerollSlot } from '@/hooks/use-meal-plan';
import { useActiveBudgetPlan } from '@/hooks/use-budget-plan';
import { useRecordMealChoice, useMealChoices } from '@/hooks/use-meal-choice';
import { useSubmitFeedback } from '@/hooks/use-feedback';
import { showToast } from '@/lib/toast';
import { getErrorMessage } from '@/lib/api/errors';
import type { GetSuggestionsQuery, SuggestionOption } from '@repo/shared';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ModalMode =
  | { type: 'suggestion'; option: SuggestionOption }
  | { type: 'custom' }
  | { type: 'home' };

export interface LogModalState {
  open: boolean;
  mealTypeId: string | null;
  mode: ModalMode | null;
}

export interface SavePayload {
  actualAmountSpent: number;
  rating: number;
  liked: boolean | null;
  comment?: string;
  restaurantName?: string;
  manualDescription?: string;
}

// Shape stored per logged slot — enough to render on the card
export interface LoggedMeal {
  id: string;
  menuItemName: string | null;
  restaurantName: string | null;
  actualAmountSpent: number;
  isCustom: boolean;
  isHomeCooked: boolean;
  manualDescription: string | null;
}

const CLOSED_MODAL: LogModalState = { open: false, mealTypeId: null, mode: null };

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useMealSlots() {
  const today = localDateString();

  const { data: activePlanData } = useActiveBudgetPlan();
  const planId = activePlanData?.plan.id ?? '';

  const {
    data: slotsData,
    isLoading: isSlotsLoading,
    error: slotsError,
  } = useMealPlanSuggestions({ date: today } satisfies GetSuggestionsQuery);

  const { data: choicesData } = useMealChoices(planId, { limit: 20 });

  // Keyed by mealTypeId — stores enough to render the logged meal on the card
  const loggedByMealType = useMemo(() => {
    const map: Record<string, LoggedMeal> = {};
    for (const choice of choicesData?.data ?? []) {
      if (choice.slotDate !== today) continue;
      map[choice.mealTypeId] = {
        id: choice.id,
        menuItemName: choice.menuItemName,
        restaurantName: choice.restaurantName,
        actualAmountSpent: choice.actualAmountSpent,
        isCustom: choice.suggestionId === null,
        isHomeCooked: choice.isHomeCooked,
        manualDescription: choice.manualDescription,
      };
    }
    return map;
  }, [choicesData, today]);

  const { mutateAsync: recordChoice, isPending: isSaving } = useRecordMealChoice(planId);
  const { mutateAsync: submitFeedback } = useSubmitFeedback();
  const { mutateAsync: rerollSlot, isPending: isRerolling } = useRerollSlot(planId);

  const [expandedSlotId, setExpandedSlotId] = useState<string | null>(null);
  const [logModal, setLogModal] = useState<LogModalState>(CLOSED_MODAL);

  const expandedSlot = slotsData?.slots.find((s) => s.mealTypeId === expandedSlotId);

  const openLogModal = (mealTypeId: string, mode: ModalMode) => {
    setExpandedSlotId(null);
    setLogModal({ open: true, mealTypeId, mode });
  };

  const closeLogModal = () => setLogModal(CLOSED_MODAL);

  // "None of these" — swap the slot's 3 options for fresh AI suggestions.
  // Errors are toasted by useRerollSlot; the dialog stays open so the user
  // sees the options change in place.
  const handleReroll = async (mealTypeId: string) => {
    if (!planId) return;
    const result = await rerollSlot({ slotDate: today, mealTypeId }).catch(() => null);
    if (result) {
      showToast.success({
        title: 'New suggestions ready',
        description:
          result.rerollsRemaining > 0
            ? `${result.rerollsRemaining} reroll${result.rerollsRemaining === 1 ? '' : 's'} left for this meal.`
            : 'That was the last reroll for this meal.',
      });
    }
  };

  const handleSave = async (payload: SavePayload) => {
    if (!logModal.mealTypeId || !planId) return;

    try {
      const mode = logModal.mode?.type;
      const option =
        mode === 'suggestion'
          ? (logModal.mode as { type: 'suggestion'; option: SuggestionOption }).option
          : null;

      const choice = await recordChoice({
        slotDate: today,
        mealTypeId: logModal.mealTypeId,
        actualAmountSpent: payload.actualAmountSpent,
        ...(mode === 'suggestion' && option
          ? { suggestionId: option.id, restaurantName: option.restaurantName ?? undefined }
          : mode === 'home'
            ? { isHomeCooked: true, manualDescription: payload.manualDescription }
            : {
                manualDescription: payload.manualDescription,
                restaurantName: payload.restaurantName,
              }),
      });

      // Fire-and-forget — rating, liked, comment are all optional per FeedbackInput
      const hasFeedback = payload.rating > 0 || payload.liked !== null || payload.comment;
      if (hasFeedback) {
        submitFeedback({
          mealChoiceId: choice.id,
          ...(payload.rating > 0 && { rating: payload.rating }),
          ...(payload.liked !== null && { liked: payload.liked }),
          ...(payload.comment && { comment: payload.comment }),
        }).catch((err) => console.warn('[meal-slots] feedback submit failed silently', err));
      }

      showToast.success({ title: 'Meal logged' });
      closeLogModal();
    } catch (err) {
      showToast.error({ title: 'Could not log meal', description: getErrorMessage(err) });
    }
  };

  return {
    today,
    slotsData,
    isSlotsLoading,
    slotsError,
    isSaving,
    isRerolling,
    expandedSlotId,
    expandedSlot,
    logModal,
    loggedByMealType,
    actions: {
      setExpandedSlotId,
      openLogModal,
      closeLogModal,
      handleSave,
      handleReroll,
    },
  };
}
