import { FoodPandaScraper } from "#scrapers/foodpanda.scraper.js";

const foodPandaScraper = new FoodPandaScraper();

await foodPandaScraper.init();
const result = await foodPandaScraper.scrapeRestaurant("https://www.foodpanda.pk/restaurant/txpe/daily-deli-co-isb");

console.log(result);

await foodPandaScraper.close();
