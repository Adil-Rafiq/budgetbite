"""Foodpanda-specific scraper implementation."""

from typing import List
from scrapers import BaseScraper
from parsers import FoodpandaParser
from models import Restaurant, MenuItem

class FoodpandaScraper(BaseScraper):
    """Scraper for Foodpanda restaurant data."""

    def __init__(self, base_url: str, lat: float, lng: float):
        super().__init__()
        self.base_url = base_url
        self.lat = lat
        self.lng = lng
        self.parser = FoodpandaParser()

    def _build_home_url(self) -> str:
        """Build homepage URL with location parameters."""
        return f"{self.base_url}/restaurants/new?lng={self.lng}&lat={self.lat}&vertical=restaurants"

    def scrape_restaurant_links(self) -> List[str]:
        """Scrape all restaurant links from homepage."""
        page = self.browser.page
        
        home_url = self._build_home_url()
        print(f"[INFO] Loading homepage: {home_url}")
        
        page.goto(home_url, wait_until="domcontentloaded")
        
        # Scroll to load all restaurants
        self.scroll_to_bottom()
        
        # Extract links
        links = self.parser.parse_restaurant_links(page)
        absolute_links = [
            link if link.startswith('http') else f"{self.base_url}{link}"
            for link in links
        ]
        
        print(f"[INFO] Found {len(absolute_links)} restaurant links")
        return absolute_links

    def scrape_restaurant(self, url: str) -> Restaurant:
        """Scrape data from a single restaurant page."""
        page = self.browser.page
        
        vendor_id = self.parser.extract_vendor_id(url)
        print(f"[INFO] Scraping restaurant: {vendor_id}")
        
        page.goto(url, wait_until="domcontentloaded")
        self.browser.delay(self.config.page_load_delay)

        # Handle CAPTCHA
        self.handle_captcha()
        self.browser.delay(self.config.page_load_delay)

        # Parse menu items
        menu = self.parser.parse_menu_items(page)
        
        print(f"[SUCCESS] Scraped {len(menu)} items from {vendor_id}")

        return Restaurant(
            url=url,
            vendor_id=vendor_id,
            name="",  # Extract from page/API
            rating=None,
            rating_count=None,
            cuisine_types=[],
            delivery_time=None,
            minimum_order=0.0,
            delivery_fee=0.0,
            menu=menu,
        )

    def scrape(self) -> List[Restaurant]:
        """Main scraping method - scrape all restaurants."""
        # Get all restaurant links
        links = self.scrape_restaurant_links()
        
        # Limit if configured
        if self.config.max_restaurants and self.config.max_restaurants < len(links):
            links = links[:self.config.max_restaurants]
            print(f"[INFO] Limited to {len(links)} restaurants")

        # Scrape each restaurant
        results = []
        for link in links:
            try:
                data = self.scrape_restaurant(link)
                results.append(data)
                
                # Rate limiting
                self.browser.delay(self.config.request_delay)
                
            except Exception as e:
                print(f"[ERROR] Failed to scrape {link}: {e}")

        return results