# apps/scraper

Python + Playwright + SeleniumBase scraper used during development to populate the BudgetBite database with restaurants and menu items. Posts to the API's admin endpoints (`/api/admin/*`) using `X-API-Key: $ADMIN_API_KEY` — the API never reads files from this directory.

## Disclaimer

This scraper exists for **personal, educational use only**. It is published as part of an open-source portfolio project to demonstrate the end-to-end architecture (browser automation → admin API → database) and is **not** intended to be run at scale, against production traffic, or in a way that violates any third party's Terms of Service.

If you fork this repo:

- Do not use the scraper against any site whose ToS prohibits automated access.
- No scraped data is bundled in this repository.
- You are responsible for complying with the laws and ToS that apply to you.

The maintainers offer no warranty and accept no responsibility for misuse. See the repository root `LICENSE` for the Elastic License 2.0 terms covering the code itself.

## How it fits the rest of the stack

```
apps/scraper  ──(HTTP, X-API-Key)──▶  apps/api  ──▶  packages/database  ──▶  Neon Postgres
```

The scraper does not import any TypeScript code from the monorepo. It speaks to the API like any other admin client; admin auth is described in `apps/api/DESIGN.md` § "Admin / Scraper API".

## Layout

```
src/
  main.py              entry point
  config.py            env + paths
  core/browser.py      Playwright/SeleniumBase wrapper
  scrapers/base.py     base scraper interface
  scrapers/foodpanda.py
  parsers/foodpanda.py parsing helpers
  models/              dataclasses for restaurants + menu items
  upload.py            posts to /api/admin/* with X-API-Key
  sounds/alert.mp3     captcha alert
```

## Running

```bash
cd apps/scraper
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
playwright install chromium
python -m src.main
```

Required env (in `apps/scraper/.env`):

| Var             | Purpose                              |
| --------------- | ------------------------------------ |
| `API_URL`       | Base URL of the BudgetBite API       |
| `ADMIN_API_KEY` | Must match the API's `ADMIN_API_KEY` |

Run only against a local API you control unless you have explicit permission to do otherwise.
