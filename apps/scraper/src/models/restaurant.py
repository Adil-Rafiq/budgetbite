"""Data models for restaurant information."""

from typing import TypedDict, List, Optional

class MenuItem(TypedDict):
    """Menu item data structure."""
    foodpanda_id: str
    name: str
    description: str
    price: float
    original_price: Optional[float]
    image_url: Optional[str]

class Restaurant(TypedDict):
    """Restaurant data structure."""
    url: str
    vendor_id: str
    slug: str
    name: Optional[str]
    # The vendor's own coordinates. None when the page exposes none, in which
    # case the uploader falls back to the scrape-origin coords.
    latitude: Optional[float]
    longitude: Optional[float]
    rating: Optional[float]
    rating_count: Optional[int]
    minimum_order: float
    delivery_fee: float
    menu: List[MenuItem]