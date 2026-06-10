"""
Upload scraped restaurant and menu data to the BudgetBite API (admin endpoints).

Requires ADMIN_API_KEY and optionally BUDGETBITE_API_URL in the environment.
"""

import json
import urllib.error
import urllib.parse
import urllib.request
from typing import Any

from config import config
from models import Restaurant


def _api_headers() -> dict[str, str]:
    """Headers for admin API (X-API-Key)."""
    return {
        "Content-Type": "application/json",
        "X-API-Key": config.admin_api_key,
    }


def _request(
    method: str,
    url: str,
    data: dict | list | None = None,
) -> tuple[int, dict | list | None]:
    """
    Send a request to the API. Returns (status_code, body_json or None).
    """
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode() if data is not None else None,
        headers=_api_headers(),
        method=method,
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            body: dict | list | None = None
            raw = resp.read().decode()
            if raw:
                body = json.loads(raw)
            return (resp.status, body)
    except urllib.error.HTTPError as e:
        body = None
        try:
            raw = e.read().decode()
            if raw:
                body = json.loads(raw)
        except Exception:
            pass
        return (e.code, body)
    except Exception as e:
        print(f"[ERROR] Request failed: {e}")
        raise


def _restaurant_payload(restaurant: Restaurant, lat: float, lng: float) -> dict[str, Any]:
    """Build API create-restaurant payload from scraped restaurant."""
    # Use slug as display name (vendor_id is internal id)
    slug = restaurant.get("slug")
    name = slug or restaurant.get("vendor_id") or "Unknown"
    payload: dict[str, Any] = {
        "externalId": restaurant["vendor_id"],
        "name": name[:300],
        "latitude": lat,
        "longitude": lng,
        "deliveryFee": restaurant.get("delivery_fee"),
        "minimumOrder": restaurant.get("minimum_order"),
        "rating": restaurant.get("rating"),
        "ratingCount": restaurant.get("rating_count") or 0,
    }
    # Foodpanda URL slug — drives the "Order on Foodpanda" deep-link on the
    # web app. Optional so older restaurant rows scraped before this field
    # was tracked stay valid; the API column is nullable.
    if slug:
        payload["slug"] = slug[:300]
    return payload


def _menu_item_payload(item: dict) -> dict[str, Any]:
    """Build API create-menu-item payload from scraped menu item."""
    payload = {
        "name": (item.get("name") or "Unnamed")[:300],
        "price": float(item.get("price", 0)),
    }
    if item.get("description"):
        payload["description"] = (item["description"])[:2000]
    if item.get("image_url"):
        payload["imageUrl"] = item["image_url"][:2000]
    return payload


def ensure_restaurant_id(restaurant: Restaurant, lat: float, lng: float) -> str:
    """
    Create restaurant or get existing id by externalId. Returns restaurant id (UUID).
    """
    base = config.api_base_url.rstrip("/")
    url_create = f"{base}/api/admin/restaurants"
    payload = _restaurant_payload(restaurant, lat, lng)

    status, body = _request("POST", url_create, payload)

    if status == 201 and isinstance(body, dict) and "id" in body:
        return body["id"]
    if status == 409:
        # Already exists: fetch by externalId
        url_get = f"{base}/api/admin/restaurants/external/{urllib.parse.quote(restaurant['vendor_id'], safe='')}"
        status2, body2 = _request("GET", url_get)
        if status2 == 200 and isinstance(body2, dict) and "id" in body2:
            return body2["id"]
        print(f"[WARN] Got 409 but could not fetch by externalId: {status2} {body2}")
    raise RuntimeError(f"Failed to ensure restaurant: {status} {body}")


def upload_restaurant_and_menu(
    restaurant: Restaurant,
    lat: float,
    lng: float,
) -> int:
    """
    Upload one scraped restaurant and its menu to the API.
    Creates restaurant (or resolves existing id), then POSTs menu items.
    Returns the number of menu items uploaded.
    """
    restaurant_id = ensure_restaurant_id(restaurant, lat, lng)
    base = config.api_base_url.rstrip("/")
    url_menu = f"{base}/api/admin/restaurants/{restaurant_id}/menu-items"

    menu = restaurant.get("menu") or []
    if not menu:
        print(f"[INFO] No menu items for {restaurant.get('vendor_id')}, skipping menu upload")
        return 0

    items_payload = [_menu_item_payload(item) for item in menu]
    status, body = _request("POST", url_menu, items_payload)
    if status not in (200, 201):
        raise RuntimeError(f"Failed to upload menu: {status} {body}")
    print(f"[INFO] Uploaded {len(items_payload)} menu items for restaurant {restaurant_id}")
    return len(items_payload)


def _start_scraper_run(lat: float, lng: float) -> str | None:
    """
    Open a scraper run so admins can see ingestion history. Best-effort:
    a failure here must never block the actual upload, so we log and move on.
    """
    base = config.api_base_url.rstrip("/")
    url = f"{base}/api/admin/scraper-runs"
    payload = {"source": "foodpanda", "latitude": lat, "longitude": lng}
    try:
        status, body = _request("POST", url, payload)
        if status in (200, 201) and isinstance(body, dict) and "id" in body:
            return body["id"]
        print(f"[WARN] Could not open scraper run: {status} {body}")
    except Exception as e:
        print(f"[WARN] Could not open scraper run: {e}")
    return None


def _finish_scraper_run(
    run_id: str | None,
    status_str: str,
    restaurants_upserted: int,
    items_upserted: int,
    error_message: str | None = None,
) -> None:
    """Close a scraper run with status + totals. Best-effort; never raises."""
    if not run_id:
        return
    base = config.api_base_url.rstrip("/")
    url = f"{base}/api/admin/scraper-runs/{run_id}"
    payload: dict[str, Any] = {
        "status": status_str,
        "restaurantsUpserted": restaurants_upserted,
        "itemsUpserted": items_upserted,
    }
    if error_message:
        payload["errorMessage"] = error_message[:2000]
    try:
        _request("PATCH", url, payload)
    except Exception as e:
        print(f"[WARN] Could not close scraper run {run_id}: {e}")


def upload_all(restaurants: list[Restaurant], lat: float, lng: float) -> None:
    """
    Upload all scraped restaurants and their menus to the API.
    Skips upload if ADMIN_API_KEY is not set.
    """
    if not config.admin_api_key:
        print("[WARN] ADMIN_API_KEY not set; skipping API upload")
        return

    print(f"[INFO] Uploading {len(restaurants)} restaurants to {config.api_base_url} ...")
    run_id = _start_scraper_run(lat, lng)
    restaurants_upserted = 0
    items_upserted = 0
    try:
        for i, restaurant in enumerate(restaurants):
            try:
                items_upserted += upload_restaurant_and_menu(restaurant, lat, lng)
                restaurants_upserted += 1
            except Exception as e:
                print(f"[ERROR] Upload failed for {restaurant.get('vendor_id')}: {e}")
        _finish_scraper_run(run_id, "succeeded", restaurants_upserted, items_upserted)
        print("[DONE] Upload complete")
    except Exception as e:
        _finish_scraper_run(run_id, "failed", restaurants_upserted, items_upserted, str(e))
        raise
