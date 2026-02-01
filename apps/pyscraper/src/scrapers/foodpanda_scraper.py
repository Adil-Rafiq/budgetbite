from scrapers.base_scraper import BaseScraper
from typing import List, Dict

class FoodPandaScraper(BaseScraper):
    def __init__(self, base_url: str, lat: float, lng: float):
        super().__init__()
        self.base_url = base_url
        self.lat = lat
        self.lng = lng

    def scrape_home(self) -> List[str]:
        if not self.page:
            raise RuntimeError("Scraper not initialized")

        home_url = f"{self.base_url}/restaurants/new?lng={self.lng}&lat={self.lat}&vertical=restaurants"
        self.page.goto(home_url)

        # Scroll to load restaurants
        self._scroll_to_bottom(step=500)

        links = self.page.locator(
            "xpath=//a[contains(@href, '/restaurant/')]"
        ).all()

        abs_links = [self.base_url + link.get_attribute("href") for link in links] 

        print(f"[INFO] Found {len(abs_links)} restaurant links")
        return abs_links
    
    def scrape_restaurant(self, url: str) -> Dict:
        if not self.page:
            raise RuntimeError("Scraper not initialized")

        self.page.goto(url, wait_until="domcontentloaded")
        self.delay(2)

        # Try automatic captcha click (checkbox)
        self.solve_captcha()
        self.delay(2)

        # Pause ONLY if captcha is still present
        if self._is_captcha_present():
            print("[CAPTCHA] Manual solve required. Solve it and resume ▶")
            self.page.pause()

        self.delay(2)

        products = self.page.get_by_test_id("menu-product").all()
        for i, product in enumerate(products):
            try:
                name = product.get_by_test_id("menu-product-name").inner_text().strip()
                description = (
                    product.get_by_test_id("menu-product-description").inner_text().strip()
                    if product.get_by_test_id("menu-product-description").count() > 0
                    else ""
                )

                full_price_text = product.get_by_test_id("menu-product-price").inner_text().strip()
                parts = [
                    p for p in full_price_text.replace("Rs.", "").split()
                    if p.replace(".", "").isdigit()
                ]

                current_price = float(parts[0]) if len(parts) >= 1 else None
                original_price = float(parts[1]) if len(parts) >= 2 else None

                print(
                    f"{i}: {name} | price={current_price} | original={original_price} | {description}"
                )

            except Exception as e:
                print(f"[WARN] Failed to parse product {i}: {e}")

        return {}

    def scrape_all_restaurants(self) -> List[Dict]:
        links = self.scrape_home()
        links = links[0:2]
        results = []
        for link in links:
            try:
                data = self.scrape_restaurant(link)
                results.append({"url": link, **data})
            except Exception as e:
                print(f"[ERROR] Failed to scrape {link}: {e}")

        return results
