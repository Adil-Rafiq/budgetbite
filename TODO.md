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
- [ ] The users can add restaurants of their choice with the approval of admin
- [ ] At a time only up to certain number of approval requests for restaurants will be allowed per user
- [ ] Add rate limiting
- [ ] Remove any unused component/code specially from web/components/ui

## Backlog

- [ ] Integrate [Three Js](#threejs.org) and [GSAP](#gsap.com). [GSAP](#gsap.com) has a cool [design](#planetono.space)
- [ ] Meal suggestions
- [ ] Analytics page
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
