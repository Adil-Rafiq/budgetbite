budgetbite/
├── apps/
│   ├── web/                          # Next.js frontend (DEPLOY)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── dashboard/
│   │   │   │   ├── meals/
│   │   │   │   └── layout.tsx
│   │   │   ├── components/
│   │   │   │   ├── ui/
│   │   │   │   ├── meal-card.tsx
│   │   │   │   └── budget-tracker.tsx
│   │   │   ├── lib/
│   │   │   └── types/
│   │   ├── public/
│   │   ├── package.json
│   │   ├── next.config.js
│   │   └── tsconfig.json
│   │
│   ├── api/                          # Backend API (DEPLOY)
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   │   ├── auth.routes.ts
│   │   │   │   ├── meal.routes.ts
│   │   │   │   ├── order.routes.ts
│   │   │   │   └── budget.routes.ts
│   │   │   ├── controllers/
│   │   │   │   ├── meal.controller.ts
│   │   │   │   └── order.controller.ts
│   │   │   ├── services/
│   │   │   │   ├── meal-planner.service.ts
│   │   │   │   ├── budget.service.ts
│   │   │   │   └── order.service.ts
│   │   │   ├── middleware/
│   │   │   │   ├── auth.middleware.ts
│   │   │   │   └── error.middleware.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── scraper/                      # Scraping service (RUN LOCALLY)
│       ├── src/
│       │   ├── scrapers/
│       │   │   ├── foodpanda.scraper.ts
│       │   │   └── base.scraper.ts
│       │   ├── parsers/
│       │   │   ├── restaurant.parser.ts
│       │   │   └── menu.parser.ts
│       │   ├── utils/
│       │   │   ├── captcha-handler.ts
│       │   │   └── delay.ts
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   ├── database/                     # Shared database (Neon)
│   │   ├── src/
│   │   │   ├── schema/
│   │   │   │   ├── users.ts
│   │   │   │   ├── restaurants.ts
│   │   │   │   ├── menu-items.ts
│   │   │   │   ├── meal-plans.ts
│   │   │   │   └── orders.ts
│   │   │   ├── repositories/
│   │   │   │   ├── restaurant.repo.ts
│   │   │   │   ├── menu.repo.ts
│   │   │   │   └── order.repo.ts
│   │   │   ├── migrations/
│   │   │   └── index.ts
│   │   ├── drizzle.config.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── shared-types/                 # Shared TypeScript types
│   │   ├── src/
│   │   │   ├── restaurant.types.ts
│   │   │   ├── order.types.ts
│   │   │   ├── meal.types.ts
│   │   │   └── user.types.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── utils/                        # Shared utilities
│       ├── src/
│       │   ├── date.utils.ts
│       │   ├── currency.utils.ts
│       │   └── validation.ts
│       ├── package.json
│       └── tsconfig.json
│
├── .github/
│   └── workflows/
│       ├── deploy-web.yml
│       └── deploy-api.yml
│
├── package.json                      # Root package.json
├── tsconfig.json                     # Base TS config
├── .eslintrc.js
├── .prettierrc
├── .prettierignore
├── .gitignore
├── .env.example
├── .env                             # DATABASE_URL points to Neon
└── README.md