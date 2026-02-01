// import { FoodPandaScraper } from "#scrapers/foodpanda.scraper.js";

// const FOODPANDA_BASE_URL = "https://www.foodpanda.pk";
// const LOCATION_COORDS = { lng: 74.36502637116425, lat: 31.461357906467217 };

// const foodPandaScraper = new FoodPandaScraper(FOODPANDA_BASE_URL, LOCATION_COORDS.lat, LOCATION_COORDS.lng);

// await foodPandaScraper.init();

// const result = await foodPandaScraper.scrapeAllRestaurants();

// console.log(JSON.stringify(result));

// await foodPandaScraper.close();

///////////////////////////////////////////////////////////
import { FoodPandaScraper } from "./scrapers/foodpanda.scraper.js";
// import "dotenv/config";

async function main() {
  // Lahore coordinates (DHA area as example)
  const LAT = 31.461658;
  const LNG = 74.364802;
  const BASE_URL = "http://www.foodpanda.pk";

  const scraper = new FoodPandaScraper(BASE_URL, LAT, LNG);

  try {
    console.log("[INFO] Starting scraper...");
    const results = await scraper.scrapeAll();

    console.log("\n[RESULTS]");
    console.log(JSON.stringify(results, null, 2));

    // TODO: Save to database here
    // await saveToDatabase(results);
  } catch (error) {
    console.error("[FATAL] Scraper failed:", error);
    process.exit(1);
  }
}

main().catch(console.error);
