# TODO

## In Progress

## Up Next

- [ ] Fix budget generating suggestions for a generation
- [ ] Add logic checks in services
- [ ] Remove any `try-catch` from the AI related code. Use `AppError` instead
- [ ] In scraper, write the failed restaurants to a log file so that they can be added one by one or manually
- [ ] There's a mismatch between web and api better-auth setup
- [ ] After log-in the user should go to /onboarding if their profile is not set yet
- [ ] Integrate a logger
- [ ] Onboarding page
- [ ] Dashboard page
- [ ] Budget plan creation
- [ ] Menu image upload for restaurant recommendations: instead of typing menu items one by one, let the user upload a photo of the menu. Pass the image to the AI to extract the items (name + price, description if present) and pre-fill the editable items form. The user verifies/edits the extracted items, then submits the recommendation. Should fall back gracefully to manual entry if extraction fails or finds nothing.
- [ ] Combo meals per slot: a slot should be able to hold multiple menu items (e.g. burger + wings + drink for one lunch) instead of a single item. Today the AI fills each slot with one item, which rarely reflects how a real order is composed. Needs schema change (slot → items[]), AI prompt + response shape update, plan-generation/replan logic, and UI for displaying/logging a multi-item slot and its combined cost.

## Backlog

- [ ] Integrate [Three Js](#threejs.org) and [GSAP](#gsap.com). [GSAP](#gsap.com) has a cool [design](#planetono.space)
- [ ] Push notifications - can leverage pubsub model using pg triggers. See [video](#https://www.youtube.com/watch?v=4-Z_I4SwgJQ)
- [ ] Calories statistics / Diet Planning

## Done

- [x] The users can add restaurants of their choice with the approval of admin
- [x] At a time only up to certain number of approval requests for restaurants will be allowed per user
- [x] Add rate limiting
- [x] Fix user flow & error handling for plan generation when onboarding/location is incomplete or no restaurants are nearby
- [x] AI returns invalid plan often times, sometimes uuid is invalid, sometimes the max-token limit is reached etc
- [x] Auth setup (email + password)
- [x] Email OTP verification
- [x] Google OAuth
- [x] GitHub OAuth
- [x] Cleanup schemas, specifically remove `users` table
- [x] Remove JWT implementation
- [x] Insert tables relations
- [x] In scraper, add a sound effect when a captcha needs to be solved manually
- [x] We are repeating restaurant's menu items
- [x] Add `xstate` in onboarding steps in web
- [x] Convert queries that use complex joins to use `relations` instead
- [x] Update Google Auth Provider
- [x] Analytics page
- [x] Add API cold-start wakeup banner for Render free-tier delays
