import { BaseScraper } from "#scrapers/base.scraper.js";
import { parseRestaurant, parseMenu } from "#parsers/index.js";

export class FoodPandaScraper extends BaseScraper {
  async scrapeRestaurant(url: string) {
    await this.page.goto(url, { waitUntil: "domcontentloaded" });

    // scroll to load dynamic content (check for pagination later)
    await this.page.mouse.wheel(0, 3000);
    await this.page.waitForTimeout(2000);

    const html = await this.page.content();

    return {
      restaurant: parseRestaurant(html),
      menu: parseMenu(html),
    };
  }
}
