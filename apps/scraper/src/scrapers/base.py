"""Base scraper with common functionality."""

from abc import ABC, abstractmethod
from ..core import BrowserManager
from ..config import config

class BaseScraper(ABC):
    """Base class for all scrapers."""

    def __init__(self):
        self.browser = BrowserManager()
        self.config = config

    def init(self, endpoint_url: str | None = None):
        """Initialize browser connection."""
        self.browser.connect(endpoint_url)

    def scroll_to_bottom(self, step: int | None = None, delay: float | None = None):
        """Scroll page to bottom to load dynamic content."""
        step = step or self.config.scroll_step
        delay = delay or self.config.scroll_delay
        
        page = self.browser.page

        while True:
            prev_scroll = page.evaluate("window.scrollY")
            page.mouse.wheel(0, step)
            self.browser.delay(delay)
            curr_scroll = page.evaluate("window.scrollY")
            
            if curr_scroll == prev_scroll:
                break

    def handle_captcha(self):
        """Handle CAPTCHA if present."""
        self.browser.solve_captcha()
        self.browser.delay(self.config.captcha_wait_delay)
        self.browser.wait_for_manual_captcha()

    def close(self):
        """Cleanup resources."""
        self.browser.close()

    @abstractmethod
    def scrape(self):
        """Main scraping method - to be implemented by subclasses."""
        pass