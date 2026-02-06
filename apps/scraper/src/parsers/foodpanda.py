"""Parsers for extracting data from Foodpanda pages."""

import re
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
    def extract_restaurant_slug(url: str) -> str:
        """Extract restaurant name slug from URL.
        
        Example: /restaurant/s9vx/ny-212-dha -> ny-212-dha
        """
        parts = url.split('/')
        try:
            restaurant_idx = parts.index('restaurant')
            return parts[restaurant_idx + 2]
        except (ValueError, IndexError):
            raise ValueError(f"Could not extract restaurant slug from URL: {url}")

    @staticmethod
    def parse_restaurant_url(url: str) -> dict[str, str]:
        """Parse restaurant URL into components.
        
        Example: /restaurant/s9vx/ny-212-dha -> 
                {"vendor_id": "s9vx", "slug": "ny-212-dha"}
        """
        return {
            "vendor_id": FoodpandaParser.extract_vendor_id(url),
            "slug": FoodpandaParser.extract_restaurant_slug(url),
        }

    @staticmethod
    def parse_restaurant_links(page: Page) -> List[str]:
        """Extract all restaurant links from the page."""
        links = page.locator("xpath=//a[contains(@href, '/restaurant/')]").all()
        return [link.get_attribute("href") for link in links if link.get_attribute("href")]

    @staticmethod
    def _get_menu_product_image_url(product: Locator) -> str | None:
        """Get image URL from data-testid='menu-product-image': <img src> or background-image."""
        image_locator = product.get_by_test_id("menu-product-image")
        if image_locator.count() == 0:
            return None
        el = image_locator.first

        # 1) <img src="...">
        image_url = el.get_attribute("src")
        if not image_url and el.locator("img").count() > 0:
            image_url = el.locator("img").first.get_attribute("src")

        # 2) background-image: url("...") on div (e.g. lazy-loaded-dish-photo)
        if not image_url:
            style = el.get_attribute("style")
            if style:
                match = re.search(r'url\s*\(\s*(?:"|\'|&quot;)(.+?)(?:"|\'|&quot;)\s*\)', style)
                if match:
                    url = match.group(1).replace("&amp;", "&").replace("&quot;", '"').strip()
                    if url.startswith("http"):
                        image_url = url

        # Reject known placeholder (Foodpanda logo)
        if image_url and ("logo-simple-fp.svg" in image_url or "micro-assets.foodora.com" in image_url):
            return None
        return image_url

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

            # Extract product image URL from data-testid="menu-product-image"
            image_url = FoodpandaParser._get_menu_product_image_url(product)

            return MenuItem(
                foodpanda_id=f"item_{index}",  # Placeholder - extract from API later
                name=name,
                description=description,
                price=current_price,
                original_price=original_price,
                variations=None,
                category="General",  # Extract from page structure later
                image_url=image_url,
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