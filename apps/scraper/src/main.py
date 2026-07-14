"""Main entry point for the scraper."""

from .scrapers import FoodpandaScraper
from .config import config
from .upload import upload_all


def main():
    """Run the scraper and upload results to the API."""
    print("[INFO] Starting Foodpanda scraper...")

    scraper = FoodpandaScraper(
        base_url=config.base_url,
        lat=config.lahore_lat,
        lng=config.lahore_lng,
    )

    try:
        scraper.init()
        restaurants = scraper.scrape()

        # Output results
        print(f"\n[DONE] Scraped {len(restaurants)} restaurants")
        # print(json.dumps(restaurants, indent=2))

        # Upload to BudgetBite API (admin endpoints); skips if ADMIN_API_KEY not set
        upload_all(restaurants, lat=config.lahore_lat, lng=config.lahore_lng)

    finally:
        scraper.close()


if __name__ == "__main__":
    main()