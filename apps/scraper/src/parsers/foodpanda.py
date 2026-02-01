"""Parsers for extracting data from Foodpanda pages."""

from playwright.sync_api import Page, Locator
from typing import List
from models import MenuItem

class FoodpandaParser:
    """Parser for Foodpanda-specific data extraction."""

    @staticmethod
    def extract_vendor_id(url: str) -> str:
        """Extract vendor ID from restaurant URL.
        
        Example: /restaurant/s9vx/ny-212-dha -> s9vx
        """
        parts = url.split('/')
        try:
            restaurant_idx = parts.index('restaurant')
            return parts[restaurant_idx + 1]
        except (ValueError, IndexError):
            raise ValueError(f"Could not extract vendor ID from URL: {url}")

    @staticmethod
    def parse_restaurant_links(page: Page) -> List[str]:
        """Extract all restaurant links from the page."""
        links = page.locator("xpath=//a[contains(@href, '/restaurant/')]").all()
        return [link.get_attribute("href") for link in links if link.get_attribute("href")]

    @staticmethod
    def parse_menu_item(product: Locator, index: int) -> MenuItem | None:
        """Parse a single menu item from the page."""
        try:
            name = product.get_by_test_id("menu-product-name").inner_text().strip()
            
            description = ""
            if product.get_by_test_id("menu-product-description").count() > 0:
                description = product.get_by_test_id("menu-product-description").inner_text().strip()

            # Parse price (handles "Rs. 1500 Rs. 1800" format for discounts)
            full_price_text = product.get_by_test_id("menu-product-price").inner_text().strip()
            price_parts = [
                p for p in full_price_text.replace("Rs.", "").split()
                if p.replace(".", "").replace(",", "").isdigit()
            ]

            current_price = float(price_parts[0].replace(",", "")) if len(price_parts) >= 1 else 0.0
            original_price = float(price_parts[1].replace(",", "")) if len(price_parts) >= 2 else None

            return MenuItem(
                foodpanda_id=f"item_{index}",  # Placeholder - extract from API later
                name=name,
                description=description,
                price=current_price,
                original_price=original_price,
                variations=None,
                category="General",  # Extract from page structure later
                image_url=None,  # Extract if needed
                is_available=True,
            )

        except Exception as e:
            print(f"[WARN] Failed to parse menu item {index}: {e}")
            return None

    @staticmethod
    def parse_menu_items(page: Page) -> List[MenuItem]:
        """Parse all menu items from restaurant page."""
        products = page.get_by_test_id("menu-product").all()
        items = []
        
        for i, product in enumerate(products):
            item = FoodpandaParser.parse_menu_item(product, i)
            if item:
                items.append(item)
        
        return items