"""Configuration settings for the scraper."""

from dataclasses import dataclass

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
    max_restaurants: int | None = 2  # None = scrape all

config = ScraperConfig()