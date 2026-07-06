import { assign, setup } from 'xstate';

interface OnboardingMachineContext {
  step: number;
  totalSteps: number;
}

type OnboardingMachineEvent =
  | { type: 'CONTINUE' }
  | { type: 'BACK' }
  | { type: 'START_LOCATION_SUBMIT' }
  | { type: 'LOCATION_SUBMIT_SUCCESS' }
  | { type: 'LOCATION_SUBMIT_FAILURE' }
  | { type: 'START_DIETARY_SUBMIT' }
  | { type: 'DIETARY_SUBMIT_SUCCESS' }
  | { type: 'DIETARY_SUBMIT_FAILURE' }
  | { type: 'START_FINISH_SUBMIT' }
  | { type: 'FINISH_SUBMIT_SUCCESS' }
  | { type: 'FINISH_SUBMIT_FAILURE' };

export const onboardingMachine = setup({
  types: {
    context: {} as OnboardingMachineContext,
    events: {} as OnboardingMachineEvent,
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
  id: 'onboarding',
  initial: 'editing',
  context: {
    step: 0,
    totalSteps: 4,
  },
  states: {
    editing: {
      on: {
        BACK: {
          guard: ({ context }) => context.step > 0,
          actions: 'previousStep',
        },
        CONTINUE: {
          guard: ({ context }) => context.step > 1 && context.step < context.totalSteps - 1,
          actions: 'nextStep',
        },
        START_LOCATION_SUBMIT: {
          guard: ({ context }) => context.step === 0,
          target: 'submittingLocation',
        },
        START_DIETARY_SUBMIT: {
          guard: ({ context }) => context.step === 1,
          target: 'submittingDietary',
        },
        START_FINISH_SUBMIT: {
          guard: ({ context }) => context.step === context.totalSteps - 1,
          target: 'submittingFinish',
        },
      },
    },
    submittingLocation: {
      on: {
        LOCATION_SUBMIT_SUCCESS: {
          target: 'editing',
          actions: 'nextStep',
        },
        LOCATION_SUBMIT_FAILURE: {
          target: 'editing',
        },
      },
    },
    submittingDietary: {
      on: {
        DIETARY_SUBMIT_SUCCESS: {
          target: 'editing',
          actions: 'nextStep',
        },
        DIETARY_SUBMIT_FAILURE: {
          target: 'editing',
        },
      },
    },
    submittingFinish: {
      on: {
        FINISH_SUBMIT_SUCCESS: {
          target: 'completed',
        },
        FINISH_SUBMIT_FAILURE: {
          target: 'editing',
        },
      },
    },
    completed: {
      type: 'final',
    },
  },
});
