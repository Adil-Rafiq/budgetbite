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
│   └── scraper/                      # Python scraping service (RUN LOCALLY)
│       ├── src/
│       │   ├── main.py               # Entry: FoodpandaScraper init → scrape() → JSON output
│       │   ├── config.py             # ScraperConfig (base_url, lat/lng, scroll/rate limits)
│       │   ├── core/
│       │   │   └── browser.py        # BrowserManager: Playwright + SeleniumBase CDP, captcha handling
│       │   ├── models/
│       │   │   └── restaurant.py     # TypedDicts: Restaurant, MenuItem, MenuItemVariation
│       │   ├── scrapers/
│       │   │   ├── base.py           # BaseScraper (ABC): init, scroll_to_bottom, handle_captcha, close
│       │   │   └── foodpanda.py       # FoodpandaScraper: home URL, restaurant links, per-restaurant scrape
│       │   └── parsers/
│       │       └── foodpanda.py      # FoodpandaParser: vendor_id, restaurant_links, menu items (testids)
│       ├── requirements.txt          # playwright, seleniumbase
│       └── (no package.json – Python)
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
├── scraper-service/                 # TypeScript scraper (standalone, single-restaurant)
│   ├── src/
│   │   ├── index.ts                 # Runs FoodPandaScraper.scrapeRestaurant(url) → console.log
│   │   ├── scrapers/
│   │   │   ├── base.scraper.ts      # BaseScraper: Playwright chromium.launch, init/close
│   │   │   └── foodpanda.scraper.ts # FoodPandaScraper: goto URL, scroll, parseRestaurant + parseMenu(html)
│   │   └── parsers/
│   │       ├── index.ts
│   │       ├── restaurant.parser.ts # parseRestaurant(html): cheerio, name/rating/address
│   │       └── menu.parser.ts       # parseMenu(html): cheerio, product-tile → name/price
│   ├── package.json
│   └── tsconfig.json
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

---

## Scraper implementation (Python – `apps/scraper`)

The main scraper is implemented in **Python** under `apps/scraper`. It targets **Foodpanda** and uses **Playwright** with **SeleniumBase CDP** for browser control and captcha handling.

### Flow

1. **Entry** (`main.py`)  
   - Reads `config` (base URL, Lahore lat/lng, limits).  
   - Instantiates `FoodpandaScraper`, calls `init()` then `scrape()`.  
   - Prints count and JSON of scraped restaurants; `close()` in a `finally` block.  
   - Database persistence is left as TODO.

2. **Browser** (`core/browser.py`)  
   - `BrowserManager` starts SeleniumBase Chrome and connects Playwright via CDP.  
   - Exposes `page`, `connect(endpoint_url)`, `solve_captcha()`, `is_captcha_present()`, `wait_for_manual_captcha()`, `delay(seconds)`, `close()`.

3. **Base scraper** (`scrapers/base.py`)  
   - `BaseScraper` (ABC) holds `BrowserManager` and `config`.  
   - `init()` connects the browser; `scroll_to_bottom()` uses mouse wheel and configurable step/delay; `handle_captcha()` runs solve + delay + optional manual pause; `close()` cleans up.  
   - Subclasses implement `scrape()`.

4. **Foodpanda scraper** (`scrapers/foodpanda.py`)  
   - `FoodpandaScraper(base_url, lat, lng)` uses `FoodpandaParser`.  
   - `_build_home_url()` builds the listing URL with location.  
   - `scrape_restaurant_links()`: goto home → `scroll_to_bottom()` → parser gets all `/restaurant/` links (absolute).  
   - `scrape_restaurant(url)`: goto url → delay → `handle_captcha()` → parser extracts `vendor_id` and `parse_menu_items(page)`; returns a `Restaurant` (menu filled; name/rating/cuisine etc. stubbed).  
   - `scrape()`: gets links, optionally limits by `config.max_restaurants`, then scrapes each link with `request_delay` between requests; returns list of `Restaurant`.

5. **Parser** (`parsers/foodpanda.py`)  
   - `FoodpandaParser`: `extract_vendor_id(url)` (path segment after `restaurant`); `parse_restaurant_links(page)` via XPath `//a[contains(@href, '/restaurant/')]`; `parse_menu_item(product, index)` and `parse_menu_items(page)` using Playwright `get_by_test_id("menu-product-name")`, `menu-product-description`, `menu-product-price` and numeric parsing (Rs. / discounts); returns `MenuItem` list.

6. **Models** (`models/restaurant.py`)  
   - TypedDicts: `MenuItemVariation`, `MenuItem` (foodpanda_id, name, description, price, original_price, variations, category, image_url, is_available), `Restaurant` (url, vendor_id, name, rating, rating_count, cuisine_types, delivery_time, minimum_order, delivery_fee, menu).

### Config (`config.py`)

- `ScraperConfig`: `base_url`, `lahore_lat` / `lahore_lng`, `scroll_step` / `scroll_delay`, `page_load_delay`, `captcha_wait_delay`, `request_delay`, `max_restaurants` (e.g. 2 or None for all). Singleton `config` is used across the app.

### Dependencies

- `requirements.txt`: **playwright**, **seleniumbase**.

---

## Scraper-service (TypeScript – `scraper-service/`)

A separate **TypeScript** scraper lives at repo root in `scraper-service/`. It uses **Playwright** and **Cheerio** to scrape a **single** Foodpanda restaurant URL.

- **Entry** (`index.ts`): Creates `FoodPandaScraper`, `init()`, then `scrapeRestaurant(singleUrl)`, logs result, `close()`.  
- **Base** (`scrapers/base.scraper.ts`): Launches Chromium (headed, slowMo), new context/page; `init()` / `close()`.  
- **FoodPanda** (`scrapers/foodpanda.scraper.ts`): `scrapeRestaurant(url)` → goto → wheel scroll → `page.content()` → `parseRestaurant(html)` and `parseMenu(html)`.  
- **Parsers**: `restaurant.parser.ts` (Cheerio: h1, .rating, .vendor-location); `menu.parser.ts` (Cheerio: .product-tile, data-testid menu-product-name / menu-product-price).  

Use this for quick single-page runs; use `apps/scraper` for full listing + multi-restaurant and captcha handling.