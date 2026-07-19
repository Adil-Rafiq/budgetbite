"""Configuration settings for the scraper."""

import os
from dotenv import load_dotenv
from dataclasses import dataclass

load_dotenv()


def _env(key: str, default: str | None = None) -> str | None:
    """Read an env var, treating blank/whitespace-only as unset.

    os.environ.get(key, default) only falls back when the key is absent, so a
    `KEY=` line would otherwise win with an empty value and, for the base URL,
    produce an unnavigable address.
    """
    value = os.environ.get(key)
    if value is None:
        return default
    return value.strip() or default


def _env_float(key: str, default: float) -> float:
    """Read a float env var, falling back when unset or unparseable."""
    raw = _env(key)
    if raw is None:
        return default
    try:
        return float(raw)
    except ValueError:
        print(f"[WARN] {key}={raw!r} is not a number; using {default}")
        return default


def _env_max_restaurants() -> int | None:
    """Read SCRAPE_MAX_RESTAURANTS: an int, or 'all' for no limit (default 10)."""
    raw = _env("SCRAPE_MAX_RESTAURANTS")
    if raw is None:
        return 10
    if raw.lower() == "all":
        return None
    try:
        return int(raw)
    except ValueError:
        print(f"[WARN] SCRAPE_MAX_RESTAURANTS={raw!r} is not an int; using 10")
        return 10


@dataclass
class ScraperConfig:
    """Scraper configuration. Location / run size overridable via env (see README)."""
    base_url: str = _env("SCRAPE_BASE_URL", "https://www.foodpanda.pk")

    # Search origin — defaults to Lahore (DHA). Override per run via env.
    scrape_lat: float = _env_float("SCRAPE_LAT", 31.461658)
    scrape_lng: float = _env_float("SCRAPE_LNG", 74.364802)
    # Human-readable area label recorded on the scraper run (optional).
    area: str | None = _env("SCRAPE_AREA")

    # Scraping settings
    scroll_step: int = 500
    scroll_delay: float = 0.5
    page_load_delay: float = 2.0
    captcha_wait_delay: float = 2.0

    # Rate limiting
    request_delay: float = 2.0
    max_restaurants: int | None = _env_max_restaurants()  # None = scrape all

    # API upload (BudgetBite API admin endpoints)
    api_base_url: str = os.environ.get("API_URL", "http://localhost:3001")
    admin_api_key: str = os.environ.get("ADMIN_API_KEY", "")


config = ScraperConfig()