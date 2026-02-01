"""Browser management using Playwright + SeleniumBase CDP."""

from playwright.sync_api import sync_playwright, Page, Browser
from seleniumbase import sb_cdp

class BrowserManager:
    """Manages browser instance and CDP connection."""
    
    def __init__(self):
        self.sb = sb_cdp.Chrome()
        self._playwright = None
        self._browser: Browser | None = None
        self._page: Page | None = None

    @property
    def page(self) -> Page:
        """Get current page instance."""
        if not self._page:
            raise RuntimeError("Browser not initialized. Call connect() first.")
        return self._page

    def connect(self, endpoint_url: str | None = None) -> Page:
        """Connect to browser via CDP."""
        if endpoint_url is None:
            endpoint_url = self.sb.get_endpoint_url()

        self._playwright = sync_playwright().start()
        self._browser = self._playwright.chromium.connect_over_cdp(endpoint_url)
        
        context = self._browser.contexts[0]
        self._page = context.pages[0]
        
        return self._page

    def solve_captcha(self):
        """Attempt automatic captcha solving."""
        self.sb.solve_captcha()

    def is_captcha_present(self) -> bool:
        """Check if CAPTCHA is visible on page."""
        return self.page.locator(
            "iframe[src*='recaptcha'], iframe[src*='google.com/recaptcha']"
        ).count() > 0

    def wait_for_manual_captcha(self):
        """Pause execution for manual CAPTCHA solving."""
        if self.is_captcha_present():
            print("[CAPTCHA] Manual solve required. Solve it and click Resume ▶")
            self.page.pause()

    def close(self):
        """Close browser and cleanup resources."""
        if self._page:
            self._page.close()
        if self._browser:
            self._browser.close()
        if self._playwright:
            self._playwright.stop()
        # Note: sb_cdp.Chrome manages its own lifecycle

    def delay(self, seconds: float):
        """Wait for specified seconds."""
        self.sb.sleep(seconds)