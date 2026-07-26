/**
 * Plain-language explanations for a failed generation attempt.
 *
 * The history feed used to print `AI_GENERATION_FAILED: <raw message>` into the
 * UI — an internal error code and a server-side sentence, shown to someone who
 * only wants to know whether their plan is broken and what to do next. Nielsen
 * #9 in one line: name the problem, then the fix.
 *
 * Unknown codes fall back to a generic sentence rather than leaking the code;
 * the raw detail stays available as secondary text for anyone reporting a bug.
 */

const MESSAGES: Record<string, { title: string; fix: string }> = {
  TIMEOUT: {
    title: 'The AI took too long to respond.',
    fix: 'Try again — this usually clears on the next attempt.',
  },
  AI_PROVIDER_ERROR: {
    title: 'The AI service was unavailable.',
    fix: 'Nothing on your side. Try again in a moment.',
  },
  AI_RESPONSE_TRUNCATED: {
    title: 'The AI ran out of room mid-plan.',
    fix: 'Try again — a fresh attempt usually fits.',
  },
  AI_GENERATION_FAILED: {
    title: "We couldn't build a plan from the menus nearby.",
    fix: 'Try again, or widen your search radius if this keeps happening.',
  },
  NO_REMAINING_DATES: {
    title: 'This plan has no days left to fill.',
    fix: 'Start a new plan to keep getting suggestions.',
  },
};

const FALLBACK = {
  title: "We couldn't generate suggestions.",
  fix: 'Try again — if it keeps happening, please contact support.',
};

export function describeGenerationError(errorCode: string | null | undefined): {
  title: string;
  fix: string;
} {
  return (errorCode && MESSAGES[errorCode]) || FALLBACK;
}
