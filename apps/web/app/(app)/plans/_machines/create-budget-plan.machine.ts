import { assign, setup } from 'xstate';

interface CreatePlanContext {
  step: number;
  totalSteps: number;
}

type CreatePlanEvent =
  | { type: 'NEXT' }
  | { type: 'BACK' }
  | { type: 'START_SUBMIT' }
  | { type: 'SUBMIT_SUCCESS' }
  | { type: 'SUBMIT_FAILURE' }
  | { type: 'RESET' };

export const createBudgetPlanMachine = setup({
  types: {
    context: {} as CreatePlanContext,
    events: {} as CreatePlanEvent,
  },

  actions: {
    nextStep: assign({
      step: ({ context }) => Math.min(context.step + 1, context.totalSteps - 1),
    }),

    previousStep: assign({
      step: ({ context }) => Math.max(context.step - 1, 0),
    }),

    firstStep: assign({ step: 0 }),
  },
}).createMachine({
  id: 'createBudgetPlan',

  initial: 'editing',

  context: {
    step: 0,
    totalSteps: 3,
  },

  /**
   * Reopening the dialog starts a new plan, from any state.
   *
   * The dialog mounts this machine above `<Dialog>`, so Radix unmounting the
   * content on close never unmounts the machine. Without a reset the second
   * "New plan" click opened on "Step 03 · Review and confirm" showing the plan
   * that had just been created — and because `completed` is a final state,
   * `START_SUBMIT` was silently ignored there while the submit code below it
   * still ran, so the button never disabled and a double-tap could create two
   * plans. Declared at the root so it is honoured even from `completed`.
   */
  on: {
    RESET: {
      target: '.editing',
      actions: 'firstStep',
    },
  },

  states: {
    editing: {
      on: {
        NEXT: {
          guard: ({ context }) => context.step < context.totalSteps - 1,
          actions: 'nextStep',
        },

        BACK: {
          guard: ({ context }) => context.step > 0,
          actions: 'previousStep',
        },

        START_SUBMIT: {
          guard: ({ context }) => context.step === context.totalSteps - 1,

          target: 'submitting',
        },
      },
    },

    submitting: {
      on: {
        SUBMIT_SUCCESS: {
          target: 'completed',
        },

        SUBMIT_FAILURE: {
          target: 'editing',
        },
      },
    },

    /**
     * Deliberately not `type: 'final'`. A final child state stops the actor
     * outright, which is what made every later event — including RESET — a
     * no-op on a dialog the user can reopen. The flow is done; the machine is
     * not.
     */
    completed: {},
  },
});
