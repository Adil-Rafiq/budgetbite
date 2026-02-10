"""Parsers for extracting data from Foodpanda pages."""

import re
from playwright.sync_api import Page, Locator
from typing import List, Optional
from models import MenuItem


class FoodpandaParser:
    """Parser for Foodpanda-specific data extraction."""

    # ========== URL Parsing ==========
    
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
    
    # ========== Restaurant Details Parsing ==========
    
    @staticmethod
    def parse_rating(page: Page) -> Optional[float]:
        """Extract restaurant rating from page.
        
        Common selectors:
        - #vendor-rating span (first span contains rating)
        - [data-testid="vendor-rating"]
        - Rating is usually like "4.7" or "4.5"
        """
        try:
            # Try #vendor-rating span approach
            rating_container = page.locator("#vendor-rating")
            if rating_container.count() > 0:
                # First span usually contains the rating number
                spans = rating_container.locator("span").all()
                if spans:
                    rating_text = spans[0].inner_text().strip()
                    # Extract number (e.g., "4.7" from "4.7★")
                    match = re.search(r'(\d+\.?\d*)', rating_text)
                    if match:
                        return float(match.group(1))
            
            # Fallback: try data-testid
            rating_locator = page.locator("[data-testid='vendor-rating']")
            if rating_locator.count() > 0:
                rating_text = rating_locator.first.inner_text().strip()
                match = re.search(r'(\d+\.?\d*)', rating_text)
                if match:
                    return float(match.group(1))
            
            return None
        except Exception as e:
            print(f"[WARN] Failed to parse rating: {e}")
            return None

    @staticmethod
    def parse_rating_count(page: Page) -> Optional[int]:
        """Extract number of ratings/reviews.
        
        Common formats:
        - "(500+ ratings)"
        - "500 reviews"
        - "1.2K ratings"
        """
        try:
            # Try #vendor-rating span (second span often has count)
            rating_container = page.locator("#vendor-rating")
            if rating_container.count() > 0:
                spans = rating_container.locator("span").all()
                if len(spans) > 1:
                    count_text = spans[1].inner_text().strip()
                    return FoodpandaParser._parse_count_text(count_text)
            
            # Fallback: look for text containing "rating" or "review"
            review_locator = page.locator("text=/\\d+.*(?:rating|review)/i")
            if review_locator.count() > 0:
                count_text = review_locator.first.inner_text().strip()
                return FoodpandaParser._parse_count_text(count_text)
            
            return None
        except Exception as e:
            print(f"[WARN] Failed to parse rating count: {e}")
            return None

    @staticmethod
    def _parse_count_text(text: str) -> Optional[int]:
        """Parse count from text like '500+', '1.2K', '(1,234 ratings)'."""
        # Remove parentheses, commas
        text = re.sub(r'[(),]', '', text)
        
        # Handle 'K' notation (e.g., "1.2K" -> 1200)
        if 'K' in text.upper():
            match = re.search(r'(\d+\.?\d*)K', text, re.IGNORECASE)
            if match:
                return int(float(match.group(1)) * 1000)
        
        # Extract plain number
        match = re.search(r'(\d+)', text)
        if match:
            return int(match.group(1))
        
        return None
    
    @staticmethod
    def parse_delivery_fee(page: Page) -> float:
        """Extract delivery fee from page.
        
        Selector: div[data-testid="vendor-info-delivery-fee"] > span[data-testid="info-item-strike-through-title"]
        Format: "Rs. 159" or "Free delivery"
        
        Returns:
            Delivery fee in PKR (0.0 if free delivery)
        """
        try:
            # Primary selector
            fee_locator = page.locator(
                'div[data-testid="vendor-info-delivery-fee"] span[data-testid="info-item-strike-through-title"]'
            )
            
            if fee_locator.count() > 0:
                fee_text = fee_locator.first.inner_text().strip()
                
                # Check for free delivery
                if "free" in fee_text.lower():
                    return 0.0
                
                # Extract number from "Rs. 159" or "Rs.159"
                match = re.search(r'Rs\.?\s*(\d+(?:,\d+)*)', fee_text, re.IGNORECASE)
                if match:
                    # Remove commas and convert to float
                    return float(match.group(1).replace(',', ''))
            
            return 0.0
            
        except Exception as e:
            print(f"[WARN] Failed to parse delivery fee: {e}")
            return 0.0

    @staticmethod
    def parse_minimum_order(page: Page) -> float:
        """Extract minimum order value from page.
        
        Selector: div[data-testid="vendor-info-minimum-order-value"] > span
        Format: "Min. order Rs. 249"
        
        Returns:
            Minimum order amount in PKR (0.0 if no minimum)
        """
        try:
            # Primary selector
            min_order_locator = page.locator(
                'div[data-testid="vendor-info-minimum-order-value"] > span'
            )
            
            if min_order_locator.count() > 0:
                min_text = min_order_locator.first.inner_text().strip()
                
                # Extract number from "Min. order Rs. 249"
                match = re.search(r'Rs\.?\s*(\d+(?:,\d+)*)', min_text, re.IGNORECASE)
                if match:
                    # Remove commas and convert to float
                    return float(match.group(1).replace(',', ''))
            
            return 0.0
            
        except Exception as e:
            print(f"[WARN] Failed to parse minimum order: {e}")
            return 0.0
        
    # ========== Menu Item Parsing ==========

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

            # Extract product image URL
            image_url = FoodpandaParser._get_menu_product_image_url(product)

            return MenuItem(
                foodpanda_id=f"item_{index}",
                name=name,
                description=description,
                price=current_price,
                original_price=original_price,
                image_url=image_url,
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