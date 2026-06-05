# TODO

## In Progress

## Up Next

- [ ] Fix user flow & error handling for plan generation when onboarding/location is incomplete or no restaurants are nearby
  - Problem: Users can create a plan before completing onboarding or setting their location. Attempting to generate meal suggestions then either does nothing in the UI or fails with a console error like "No nearby restaurants available..." and the user receives no clear feedback.
  - Desired behavior: If required profile data (onboarding, location) is missing, or there are no nearby restaurants, the UI should prevent generation and show a clear, user-friendly message explaining what to do (e.g., "Please complete onboarding and set your location" or "No nearby restaurants found—try changing your location or adding restaurants").
  - Acceptance criteria:
    - Creating a plan without completed onboarding/location should show an inline warning and a link/button to complete onboarding or set location.
    - Clicking "Generate meal suggestions" with incomplete profile/location must show the warning and not call the generation service.
    - If generation fails due to no nearby restaurants, show a clear error to the user and log the cause for debugging.
    - No unhandled console errors should occur when generation is attempted.
  - Implementation notes:
    - Add front-end guard that checks profile.onboarded and profile.location before calling plan generation API.
    - API should validate required fields and return a structured AppError when preconditions aren't met.
    - Surface API error messages in the UI in a friendly format; avoid exposing raw console errors to users.
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
- [ ] The users can add restaurants of their choice with the approval of admin
- [ ] At a time only up to certain number of approval requests for restaurants will be allowed per user
- [ ] Add rate limiting
- [ ] Combo meals per slot: a slot should be able to hold multiple menu items (e.g. burger + wings + drink for one lunch) instead of a single item. Today the AI fills each slot with one item, which rarely reflects how a real order is composed. Needs schema change (slot → items[]), AI prompt + response shape update, plan-generation/replan logic, and UI for displaying/logging a multi-item slot and its combined cost.

## Backlog

- [ ] Integrate [Three Js](#threejs.org) and [GSAP](#gsap.com). [GSAP](#gsap.com) has a cool [design](#planetono.space)
- [ ] Push notifications - can leverage pubsub model using pg triggers. See [video](#https://www.youtube.com/watch?v=4-Z_I4SwgJQ)
- [ ] Calories statistics / Diet Planning

## Done

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
