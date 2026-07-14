"""Foodpanda-specific scraper implementation."""

from typing import List
from .base import BaseScraper
from ..parsers import FoodpandaParser
from ..models import Restaurant, MenuItem

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
        return f"{self.base_url}/?lat={self.lat}&lng={self.lng}"

    def scrape_restaurant_links(self) -> List[str]:
        """Scrape all restaurant links from homepage."""
        page = self.browser.page
        
        home_url = self._build_home_url()
        print(f"[INFO] Loading homepage: {home_url}")
        
        page.goto(home_url, wait_until="domcontentloaded")

        # Wait for URL to contain lat/lng params — if redirected, navigate again
        if "lat=" not in page.url:
            print(f"[WARN] Redirected to {page.url}, retrying with params...")
            page.goto(home_url, wait_until="networkidle")
        
        print(f"[INFO] Final URL: {page.url}")
            
        # Scroll to load all restaurants
        self.scroll_to_bottom()
        
        # Extract links
        links = self.parser.parse_restaurant_links(page)
        absolute_links = [
            link if link.startswith('http') else f"{self.base_url}{link}"
            for link in links
            if '/restaurant/' in link
        ]
        
        print(f"[INFO] Found {len(absolute_links)} restaurant links")
        return absolute_links

    def scrape_restaurant(self, url: str) -> Restaurant:
        """Scrape data from a single restaurant page."""
        page = self.browser.page
        
        url_data = self.parser.parse_restaurant_url(url)
        vendor_id = url_data["vendor_id"]
        restaurant_slug = url_data["slug"]
        print(f"[INFO] Scraping: {vendor_id}/{restaurant_slug}")
        
        page.goto(url, wait_until="domcontentloaded")
        self.browser.delay(self.config.page_load_delay)

        # Handle CAPTCHA
        self.handle_captcha()
        self.browser.delay(self.config.page_load_delay)

        # Scroll to load lazy-loaded content
        self.scroll_to_bottom(step=1000, delay=1.0)

        # Parse restaurant details
        rating = self.parser.parse_rating(page)
        rating_count = self.parser.parse_rating_count(page)
        delivery_fee = self.parser.parse_delivery_fee(page)
        minimum_order = self.parser.parse_minimum_order(page)

        # Parse menu items
        menu = self.parser.parse_menu_items(page)
        
        print(f"[SUCCESS] Scraped {len(menu)} items from {vendor_id}")

        return Restaurant(
            url=url,
            vendor_id=vendor_id,
            slug=restaurant_slug,
            rating=rating,
            rating_count=rating_count,
            minimum_order=minimum_order,
            delivery_fee=delivery_fee,
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