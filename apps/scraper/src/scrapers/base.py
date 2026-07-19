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

    def scroll_to_bottom(
        self,
        step: int | None = None,
        delay: float | None = None,
        stable_rounds: int | None = None,
    ):
        """Scroll page to bottom to load dynamic content.

        Stops only after `stable_rounds` consecutive wheel events fail to move
        the page. A single unchanged scrollY is not enough: it means this wheel
        event landed at the *current* bottom, which on a lazy-loaded menu often
        just means the next batch of items hasn't rendered yet. Waiting for a
        few settled rounds lets late content extend the page before we quit,
        which is what makes the shorter per-step delay safe.
        """
        step = step or self.config.scroll_step
        # `is not None` rather than `or`: delay=0 is a meaningful "don't sleep".
        delay = delay if delay is not None else self.config.scroll_delay
        stable_rounds = stable_rounds or self.config.scroll_stable_rounds

        page = self.browser.page
        # Carried across iterations so each round costs one evaluate(), not two.
        last_scroll = page.evaluate("window.scrollY")
        settled = 0

        while settled < stable_rounds:
            page.mouse.wheel(0, step)
            self.browser.delay(delay)
            curr_scroll = page.evaluate("window.scrollY")

            if curr_scroll == last_scroll:
                settled += 1
            else:
                settled = 0
                last_scroll = curr_scroll

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