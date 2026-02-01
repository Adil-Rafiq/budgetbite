"""Main entry point for the scraper."""

import json
from scrapers import FoodpandaScraper
from config import config

def main():
    """Run the scraper."""
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
        print(json.dumps(restaurants, indent=2))
        
        # TODO: Save to database
        # save_to_database(restaurants)
        
    finally:
        scraper.close()

if __name__ == "__main__":
    main()