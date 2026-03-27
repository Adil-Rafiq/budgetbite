"""Configuration settings for the scraper."""

import os
from dotenv import load_dotenv
from dataclasses import dataclass

load_dotenv()

@dataclass
class ScraperConfig:
    """Scraper configuration."""
    base_url: str = "https://www.foodpanda.pk"
    lahore_lat: float = 31.461658
    lahore_lng: float = 74.364802

    # Scraping settings
    scroll_step: int = 500
    scroll_delay: float = 0.5
    page_load_delay: float = 2.0
    captcha_wait_delay: float = 2.0

    # Rate limiting
    request_delay: float = 2.0
    max_restaurants: int | None = 10  # None = scrape all

    # API upload (BudgetBite API admin endpoints)
    api_base_url: str = os.environ.get("API_URL", "http://localhost:3001")
    admin_api_key: str = os.environ.get("ADMIN_API_KEY", "")


config = ScraperConfig()