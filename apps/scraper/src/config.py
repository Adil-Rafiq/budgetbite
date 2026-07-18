"""Configuration settings for the scraper."""

import os
from dotenv import load_dotenv
from dataclasses import dataclass

load_dotenv()


def _env_max_restaurants() -> int | None:
    """Read SCRAPE_MAX_RESTAURANTS: an int, or 'all' for no limit (default 10)."""
    raw = os.environ.get("SCRAPE_MAX_RESTAURANTS")
    if not raw:
        return 10
    if raw.strip().lower() == "all":
        return None
    try:
        return int(raw)
    except ValueError:
        return 10


@dataclass
class ScraperConfig:
    """Scraper configuration. Location / run size overridable via env (see README)."""
    base_url: str = os.environ.get("SCRAPE_BASE_URL", "https://www.foodpanda.pk")

    # Search origin — defaults to Lahore (DHA). Override per run via env.
    scrape_lat: float = float(os.environ.get("SCRAPE_LAT", "31.461658"))
    scrape_lng: float = float(os.environ.get("SCRAPE_LNG", "74.364802"))
    # Human-readable area label recorded on the scraper run (optional).
    area: str | None = os.environ.get("SCRAPE_AREA") or None

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