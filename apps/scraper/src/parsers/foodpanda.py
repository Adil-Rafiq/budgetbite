"""Parsers for extracting data from Foodpanda pages."""

import json
import re
from playwright.sync_api import Page, Locator
from typing import List, Optional
from ..models import MenuItem


class FoodpandaParser:
    """Parser for Foodpanda-specific data extraction."""

    # ========== URL Parsing ==========
    
    @staticmethod
    def _clean_segment(segment: str) -> str:
        """Drop any query string / fragment from a URL path segment.

        Homepage carousel links carry tracking params
        (?eo=large_order_swimlane&vco=vendor_swimlane) which would otherwise be
        baked into the slug and break the "Order on Foodpanda" deep-link.
        """
        return segment.split('?')[0].split('#')[0]

    @staticmethod
    def extract_vendor_id(url: str) -> str:
        """Extract vendor ID from restaurant URL.

        Example: /restaurant/s9vx/ny-212-dha -> s9vx
        """
        parts = url.split('/')
        try:
            restaurant_idx = parts.index('restaurant')
            return FoodpandaParser._clean_segment(parts[restaurant_idx + 1])
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
            return FoodpandaParser._clean_segment(parts[restaurant_idx + 2])
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
        hrefs: List[str] = []
        for link in page.locator("xpath=//a[contains(@href, '/restaurant/')]").all():
            # One bounded read per link. These handles come from a snapshot of a
            # homepage whose carousels keep re-rendering, so a node that detached
            # in between would otherwise cost the full default timeout — and used
            # to cost it twice, once to test the href and once to keep it.
            try:
                href = link.get_attribute("href", timeout=FoodpandaParser.ELEMENT_TIMEOUT_MS)
            except Exception:
                continue
            if href:
                hrefs.append(href)
        return hrefs


    # ========== Element reading ==========

    # Every read below happens against a page we have already loaded, settled
    # and scrolled, so an element that isn't there is one the page doesn't have
    # — not one still on its way. Playwright's 30s default turns each such miss
    # into half a minute of waiting: a vendor whose product markup has drifted
    # burns 30s *per item*, which is what makes a run look hung rather than
    # failed. Two and a half seconds is far past the point of new information.
    ELEMENT_TIMEOUT_MS = 2500

    @staticmethod
    def _text(locator: Locator, timeout_ms: float | None = None) -> Optional[str]:
        """Read an element's trimmed text, or None if it isn't there in time.

        Wraps every text read in the file so that "this element is missing" is
        a fast, ordinary answer instead of a timeout exception thrown 30s later.
        """
        try:
            text = locator.inner_text(
                timeout=timeout_ms if timeout_ms is not None else FoodpandaParser.ELEMENT_TIMEOUT_MS
            )
        except Exception:
            return None
        return text.strip() or None

    # What proves a vendor page actually rendered: its own heading, or its
    # products. Anything less (a bare <body>, a bot wall, an SPA shell that
    # never hydrated) means there is nothing on the page worth parsing.
    _VENDOR_CONTENT_SELECTOR = 'h1.main-info__title, h1, [data-testid="menu-product"]'

    @staticmethod
    def wait_for_vendor_content(page: Page, timeout_ms: float) -> bool:
        """Block until the vendor page has rendered its own content.

        Without this, parsing starts whenever the fixed post-navigation delay
        happens to elapse. A page that was still loading — or was quietly
        replaced by a block page — parses as a restaurant with no name, no
        coordinates, no rating and no menu, which the uploader then writes as a
        real row parked on the scrape origin. Better to know it never rendered.
        """
        try:
            page.wait_for_selector(
                FoodpandaParser._VENDOR_CONTENT_SELECTOR,
                timeout=timeout_ms,
                state="visible",
            )
            return True
        except Exception:
            return False

    # ========== Restaurant Details Parsing ==========

    @staticmethod
    def parse_restaurant_name(page: Page) -> Optional[str]:
        """Extract the restaurant's actual display name from the page.

        Foodpanda renders the vendor name as the page's main heading. We try a
        few stable anchors, then fall back to structured data, returning None if
        nothing matches so the caller can prettify the URL slug instead.
        """
        try:
            # 1) Confirmed vendor title heading on foodpanda.pk
            title = page.locator("h1.main-info__title")
            if title.count() > 0:
                name = FoodpandaParser._text(title.first)
                if name:
                    return name

            # 2) Any main <h1> (guards against class-name changes)
            h1 = page.locator("h1")
            if h1.count() > 0:
                name = FoodpandaParser._text(h1.first)
                if name:
                    return name

            # 3) JSON-LD structured data (locale-independent last resort)
            return FoodpandaParser._name_from_json_ld(page)
        except Exception as e:
            print(f"[WARN] Failed to parse restaurant name: {e}")
            return None

    @staticmethod
    def _json_ld_restaurants(page: Page) -> List[dict]:
        """Collect Restaurant/FoodEstablishment entries from any ld+json blob."""
        found: List[dict] = []
        for script in page.locator('script[type="application/ld+json"]').all():
            # Bounded like every other read: these handles come from a snapshot,
            # and a node that detached under a re-render would otherwise cost 30s
            # — now paid on every vendor, since the hero photo reads this too.
            try:
                raw = script.text_content(timeout=FoodpandaParser.ELEMENT_TIMEOUT_MS)
            except Exception:
                continue
            if not raw:
                continue
            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                continue
            # Blob may be a bare object, a list, or a {"@graph": [...]} wrapper.
            if isinstance(data, dict):
                entries = data.get("@graph", [data])
            elif isinstance(data, list):
                entries = data
            else:
                continue
            for entry in entries:
                if not isinstance(entry, dict):
                    continue
                types = entry.get("@type")
                types = types if isinstance(types, list) else [types]
                if any(t in ("Restaurant", "FoodEstablishment") for t in types):
                    found.append(entry)
        return found

    @staticmethod
    def _name_from_json_ld(page: Page) -> Optional[str]:
        """Pull a Restaurant/FoodEstablishment name from any ld+json blob."""
        for entry in FoodpandaParser._json_ld_restaurants(page):
            if entry.get("name"):
                return str(entry["name"]).strip()
        return None

    @staticmethod
    def _to_float(value) -> Optional[float]:
        """Coerce a JSON scalar to float, tolerating numeric strings."""
        try:
            return float(value)
        except (TypeError, ValueError):
            return None

    @staticmethod
    def parse_restaurant_geo(page: Page) -> tuple[Optional[float], Optional[float]]:
        """Extract the restaurant's own coordinates as (latitude, longitude).

        Without this every vendor inherits the scrape-origin coords, so they all
        sit at the same point and distance-based sorting is meaningless.

        Only the JSON-LD `geo` block is trusted: it is scoped to the Restaurant
        entity. A page-wide regex for "latitude"/"longitude" is deliberately NOT
        used, because the embedded app state also carries the *search* location
        and would silently attach the runner's coords to the vendor — worse than
        an honest fallback. Returns (None, None) when nothing is found.
        """
        try:
            for entry in FoodpandaParser._json_ld_restaurants(page):
                geo = entry.get("geo")
                if not isinstance(geo, dict):
                    continue
                lat = FoodpandaParser._to_float(geo.get("latitude"))
                lng = FoodpandaParser._to_float(geo.get("longitude"))
                if lat is not None and lng is not None:
                    return (lat, lng)
            return (None, None)
        except Exception as e:
            print(f"[WARN] Failed to parse restaurant geo: {e}")
            return (None, None)

    # Foodpanda serves its own branding when a vendor has no artwork of its own.
    # Storing those would fill the app with identical panda logos, which is
    # worse than the honest "no photo" placeholder the UI already draws.
    _PLACEHOLDER_IMAGE_MARKERS = ("logo-simple-fp.svg", "micro-assets.foodora.com")

    @staticmethod
    def _is_placeholder_image(url: Optional[str]) -> bool:
        """True for Foodpanda's own stand-in artwork rather than a real photo."""
        return bool(url) and any(m in url for m in FoodpandaParser._PLACEHOLDER_IMAGE_MARKERS)

    @staticmethod
    def _background_image_url(style: Optional[str]) -> Optional[str]:
        """Pull an absolute URL out of a `background-image: url("…")` style."""
        if not style:
            return None
        match = re.search(r'url\s*\(\s*(?:"|\'|&quot;)(.+?)(?:"|\'|&quot;)\s*\)', style)
        if not match:
            return None
        url = match.group(1).replace("&amp;", "&").replace("&quot;", '"').strip()
        return url if url.startswith("http") else None

    # Where the vendor's hero photo lives in the DOM, most specific first. The
    # hero has moved between an <img>, a wrapper with a background-image, and a
    # <picture>, so each candidate is probed for both shapes.
    _HERO_IMAGE_SELECTORS = (
        '[data-testid="vendor-hero-image"]',
        '[data-testid="vendor-image"]',
        ".vendor-hero-image",
        ".hero-image",
        ".vendor__hero",
    )

    @staticmethod
    def parse_restaurant_image(page: Page) -> Optional[str]:
        """Extract the vendor's own hero/banner photo URL.

        Structured data first: JSON-LD and og:image are scoped to the vendor and
        survive class-name churn, whereas the hero element has been re-skinned
        repeatedly. Returns None when the page offers nothing but placeholder
        artwork — the app renders its own fallback, so a wrong photo is worse
        than no photo.
        """
        try:
            # 1) JSON-LD `image`: a URL string, a list of them, or an ImageObject.
            for entry in FoodpandaParser._json_ld_restaurants(page):
                candidate = entry.get("image")
                if isinstance(candidate, list):
                    candidate = candidate[0] if candidate else None
                if isinstance(candidate, dict):
                    candidate = candidate.get("url")
                if isinstance(candidate, str) and candidate.startswith("http"):
                    if not FoodpandaParser._is_placeholder_image(candidate):
                        return candidate.strip()

            # 2) og:image — what Foodpanda itself uses to represent the vendor.
            og = page.locator('meta[property="og:image"]')
            if og.count() > 0:
                url = (og.first.get_attribute("content") or "").strip()
                if url.startswith("http") and not FoodpandaParser._is_placeholder_image(url):
                    return url

            # 3) The hero element, as <img src> or a background-image.
            for selector in FoodpandaParser._HERO_IMAGE_SELECTORS:
                hero = page.locator(selector)
                if hero.count() == 0:
                    continue
                el = hero.first
                url = el.get_attribute("src")
                if not url and el.locator("img").count() > 0:
                    url = el.locator("img").first.get_attribute("src")
                if not url:
                    url = FoodpandaParser._background_image_url(el.get_attribute("style"))
                if url and url.startswith("http") and not FoodpandaParser._is_placeholder_image(url):
                    return url

            return None
        except Exception as e:
            print(f"[WARN] Failed to parse restaurant image: {e}")
            return None

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
                    rating_text = FoodpandaParser._text(spans[0])
                    # Extract number (e.g., "4.7" from "4.7★")
                    match = re.search(r'(\d+\.?\d*)', rating_text) if rating_text else None
                    if match:
                        return float(match.group(1))

            # Fallback: try data-testid
            rating_locator = page.locator("[data-testid='vendor-rating']")
            if rating_locator.count() > 0:
                rating_text = FoodpandaParser._text(rating_locator.first)
                match = re.search(r'(\d+\.?\d*)', rating_text) if rating_text else None
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
                    count_text = FoodpandaParser._text(spans[1])
                    if count_text:
                        return FoodpandaParser._parse_count_text(count_text)

            # Fallback: look for text containing "rating" or "review"
            review_locator = page.locator("text=/\\d+.*(?:rating|review)/i")
            if review_locator.count() > 0:
                count_text = FoodpandaParser._text(review_locator.first)
                if count_text:
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
                fee_text = FoodpandaParser._text(fee_locator.first) or ""

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
                min_text = FoodpandaParser._text(min_order_locator.first) or ""

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
        """Get image URL from data-testid='menu-product-image': <img src> or background-image.

        Swallows its own failures. A photo is the least important thing on a
        menu item, so a lazy-loading image that detaches mid-read must cost the
        photo, not the item — letting it raise into parse_menu_item would drop a
        priced, named dish over a picture.
        """
        try:
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
                image_url = FoodpandaParser._background_image_url(el.get_attribute("style"))
        except Exception:
            return None

        # Reject known placeholder (Foodpanda logo)
        if FoodpandaParser._is_placeholder_image(image_url):
            return None
        return image_url

    @staticmethod
    def parse_menu_item(product: Locator, index: int) -> MenuItem | None:
        """Parse a single menu item from the page."""
        try:
            # A product card with no name is a skeleton the page never filled
            # in, or a card whose markup we no longer recognise. Either way it
            # is not an item, and the answer has to come back in milliseconds:
            # this runs once per product, and menus run to hundreds.
            #
            # `.first` throughout: a card that happens to carry two of the same
            # test id is a strict-mode violation, which would fail the whole
            # item rather than the one ambiguous field.
            name = FoodpandaParser._text(product.get_by_test_id("menu-product-name").first)
            if not name:
                return None

            description = ""
            if product.get_by_test_id("menu-product-description").count() > 0:
                description = (
                    FoodpandaParser._text(
                        product.get_by_test_id("menu-product-description").first
                    )
                    or ""
                )

            # Parse price (handles "Rs. 1500 Rs. 1800" format for discounts)
            full_price_text = (
                FoodpandaParser._text(product.get_by_test_id("menu-product-price").first) or ""
            )
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
                # Filled in by parse_menu_items, which reads the section the
                # product sits under. A single product knows nothing about it.
                category=None,
            )

        except Exception as e:
            print(f"[WARN] Failed to parse menu item {index}: {e}")
            return None

    # Vendor pages group products under a section per menu category. The
    # container's markup has changed more than once, so try the known shapes in
    # order and take the first that actually holds products.
    _CATEGORY_SECTION_SELECTORS = (
        '[data-testid="menu-category"]',
        'section[class*="dish-category"]',
        'div[class*="dish-category-section"]',
        'div[class*="menu-category"]',
    )

    # Where the section's own title lives inside that container.
    _CATEGORY_TITLE_SELECTORS = (
        '[data-testid="menu-category-name"]',
        '[class*="dish-category-title"]',
        "h2",
        "h3",
    )

    @staticmethod
    def _category_title(section: Locator) -> Optional[str]:
        """Read a section's heading, trying each known title selector."""
        for selector in FoodpandaParser._CATEGORY_TITLE_SELECTORS:
            heading = section.locator(selector)
            if heading.count() == 0:
                continue
            title = FoodpandaParser._text(heading.first)
            if not title:
                continue
            # Foodpanda appends a count to some headings ("Deals (12)"); the
            # count is not part of the category's name and would fragment the
            # grouping the moment the vendor adds an item.
            title = re.sub(r"\s*\(\s*\d+\s*\)\s*$", "", title).strip()
            if title:
                return title[:120]
        return None

    @staticmethod
    def _menu_categories_by_item_name(page: Page) -> dict[str, str]:
        """Map each menu item's name to the section heading above it.

        Keyed by name because that is the only identifier shared between the
        section walk and the flat product parse — and the API dedupes menu items
        by (restaurant, name) anyway, so a name is already unique per vendor.

        Returns an empty map when the page has no recognisable sections, which
        is a legitimate outcome: some vendors really do publish one flat list.
        """
        for selector in FoodpandaParser._CATEGORY_SECTION_SELECTORS:
            try:
                sections = page.locator(selector).all()
            except Exception:
                continue
            if not sections:
                continue

            mapping: dict[str, str] = {}
            for section in sections:
                try:
                    title = FoodpandaParser._category_title(section)
                    if not title:
                        continue
                    for product in section.get_by_test_id("menu-product").all():
                        name_locator = product.get_by_test_id("menu-product-name")
                        if name_locator.count() == 0:
                            continue
                        name = FoodpandaParser._text(name_locator.first)
                        if name:
                            mapping[name] = title
                except Exception as e:
                    print(f"[WARN] Failed to read a menu section: {e}")
                    continue

            if mapping:
                return mapping

        return {}

    # The fields a real menu item is made of. A `menu-product` card carrying
    # neither is not an orderable item — vendor pages reuse the test id for the
    # popular-items swimlane and for skeletons the page never fills in. Dropping
    # those is correct, so they must not be reported as parse failures: a
    # warning that fires on all but two vendors is one nobody reads, and genuine
    # selector drift hides inside it.
    _PRODUCT_FIELD_TEST_IDS = ("menu-product-name", "menu-product-price")

    @staticmethod
    def _looks_like_product_card(product: Locator) -> bool:
        """True when a card carries at least one field a menu item is made of."""
        try:
            return any(
                product.get_by_test_id(test_id).count() > 0
                for test_id in FoodpandaParser._PRODUCT_FIELD_TEST_IDS
            )
        except Exception:
            return False

    @staticmethod
    def parse_menu_items(page: Page) -> List[MenuItem]:
        """Parse all menu items from restaurant page, grouped by section.

        The flat product list stays the source of truth for *which* items exist;
        the section walk only decorates them. Doing it the other way round would
        mean a vendor whose section markup we no longer recognise loses their
        entire menu rather than just its grouping.
        """
        products = page.get_by_test_id("menu-product").all()
        items = []
        skipped: List[Locator] = []

        for i, product in enumerate(products):
            item = FoodpandaParser.parse_menu_item(product, i)
            if item:
                items.append(item)
            else:
                skipped.append(product)

        # Split the skips: a card that has a name or price field we still failed
        # to read is selector drift and has to stay loud; a card with neither was
        # never a menu item, and saying so at INFO keeps the warning meaningful.
        if skipped:
            drifted = sum(1 for p in skipped if FoodpandaParser._looks_like_product_card(p))
            if drifted:
                print(
                    f"[WARN] {drifted}/{len(products)} product cards carry a name or "
                    f"price we could not read (markup drift?)"
                )
            not_items = len(skipped) - drifted
            if not_items:
                print(
                    f"[INFO] Ignored {not_items} card(s) with neither name nor price "
                    f"(swimlane/placeholder, not menu items)"
                )

        categories = FoodpandaParser._menu_categories_by_item_name(page)
        if categories:
            for item in items:
                item["category"] = categories.get(item["name"])
            grouped = sum(1 for item in items if item["category"])
            print(
                f"[INFO] Grouped {grouped}/{len(items)} menu items into "
                f"{len(set(categories.values()))} categories"
            )
        elif items:
            # Not an error — but if it starts happening to every vendor, the
            # section selectors have drifted and the menu pages quietly flatten.
            print(f"[INFO] No menu sections found; {len(items)} items left uncategorized")

        return items