from playwright.sync_api import sync_playwright, Page, Browser
from seleniumbase import sb_cdp

class BaseScraper:
    def __init__(self):
        self.sb = sb_cdp.Chrome()
        self.pw = None
        self.browser: Browser | None = None
        self.page: Page | None = None

    def init(self, endpoint_url: str | None = None):
        if endpoint_url is None:
            endpoint_url = self.sb.get_endpoint_url()

        self.pw = sync_playwright().start()
        self.browser = self.pw.chromium.connect_over_cdp(endpoint_url)
        context = self.browser.contexts[0]
        self.page = context.pages[0]
    
    def solve_captcha(self):
        self.sb.solve_captcha()
    
    def _is_captcha_present(self) -> bool:
        if not self.page:
            return False
        return self.page.locator(
            "iframe[src*='recaptcha'], iframe[src*='google.com/recaptcha']"
        ).count() > 0
    
    def _scroll_to_bottom(self, step: int = 250, delay: float = 0.5):
        if not self.page:
            return

        while True:
            prev_scroll = self.page.evaluate("window.scrollY")
            self.page.mouse.wheel(0, step)
            self.delay(delay)
            curr_scroll = self.page.evaluate("window.scrollY")
            if curr_scroll == prev_scroll:
                break

    def close(self):
        if self.page:
            self.page.close()
        if self.browser:
            self.browser.close()
        if self.pw:
            self.pw.stop()
            
    def delay(self, seconds: float):
        self.sb.sleep(seconds)