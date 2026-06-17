// Per-resource schema barrel. Every Zod schema, every inferred type, every
// input DTO and response DTO in the app lives under this tree.
//
// File layout mirrors the HTTP resource map: one file per resource, each
// exporting its input schemas + response DTOs + inferred types side-by-side.

export * from './common.js';
export * from './auth.js';
export * from './user.js';
export * from './restaurant.js';
export * from './menu-item.js';
export * from './meal-type.js';
export * from './budget-state.js';
export * from './budget-plan.js';
export * from './meal-plan.js';
export * from './meal-plan-timeline.js';
export * from './meal-choice.js';
export * from './meal-pin.js';
export * from './feedback.js';
export * from './restaurant-recommendation.js';
export * from './analytics.js';
export * from './ai-output.js';
export * from './audit-log.js';
export * from './scraper-run.js';
export * from './admin-plan.js';
export * from './admin-analytics.js';
export * from './admin-config.js';
