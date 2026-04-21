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
  | { type: 'SUBMIT_FAILURE' };

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
  },
}).createMachine({
  id: 'createBudgetPlan',

  initial: 'editing',

  context: {
    step: 0,
    totalSteps: 2,
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

    completed: {
      type: 'final',
    },
  },
});
