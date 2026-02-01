"""Data models for restaurant information."""

from typing import TypedDict, List, Optional

class MenuItemVariation(TypedDict):
    """Menu item variation (e.g., different sizes)."""
    id: str
    name: str
    price: float

class MenuItem(TypedDict):
    """Menu item data structure."""
    foodpanda_id: str
    name: str
    description: str
    price: float
    original_price: Optional[float]
    variations: Optional[List[MenuItemVariation]]
    category: str
    image_url: Optional[str]
    is_available: bool

class Restaurant(TypedDict):
    """Restaurant data structure."""
    url: str
    vendor_id: str
    name: str
    rating: Optional[float]
    rating_count: Optional[int]
    cuisine_types: List[str]
    delivery_time: Optional[int]
    minimum_order: float
    delivery_fee: float
    menu: List[MenuItem]