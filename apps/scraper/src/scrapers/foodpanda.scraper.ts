// import { expect } from "playwright/test";
// import { BaseScraper } from "#scrapers/base.scraper.js";
// import { parseRestaurantLinks, parseRestaurantDetails, parseMenu } from "#parsers/index.js";

// export class FoodPandaScraper extends BaseScraper {
//   protected base_url: string;
//   protected lat: number;
//   protected lng: number;

//   constructor(base_url: string, lat: number, lng: number) {
//     super();
//     this.base_url = base_url;
//     this.lat = lat;
//     this.lng = lng;
//   }

//   async scrapeHome(): Promise<string[]> {
//     const homeUrl = `${this.base_url}/restaurants/new?lng=${this.lng}&lat=${this.lat}&vertical=restaurants`;
//     await this.page.goto(homeUrl, { waitUntil: "domcontentloaded" });

//     // Scroll specifically the "All Restaurants" section
//     await this.scrollRestaurantSection();

//     const html = await this.page.content();
//     const links = parseRestaurantLinks(html);

//     console.log(`[INFO] Found ${links.length} restaurant links`);
//     return links;
//   }

//   /** Scrolls the "All Restaurants" section until all cards are loaded */
//   private async scrollRestaurantSection() {
//     await expect(this.page.locator(".organic-list")).toBeVisible();

//     const section = await this.page.evaluateHandle(() => {
//       const lists = Array.from(document.querySelectorAll(".organic-list"));
//       return lists.find((list) => list.textContent?.toLowerCase().includes("all restaurants")) || null;
//     });

//     const element = section.asElement();
//     if (!element) {
//       console.warn("All restaurants section not found");
//       return;
//     }

//     await element.scrollIntoViewIfNeeded();
//     await this.page.waitForTimeout(1500);

//     while (true) {
//       const prevScrollY = await this.page.evaluate(() => window.scrollY);

//       await this.page.mouse.wheel(0, 500);
//       await this.page.waitForTimeout(500);

//       const currScrollY = await this.page.evaluate(() => window.scrollY);

//       if (prevScrollY == currScrollY) break;
//     }
//   }

//   async scrapeRestaurant(url: string) {
//     await this.page.goto(url, { waitUntil: "domcontentloaded" });

//     // Pause for manual CAPTCHA if it appears
//     await this.page.pause();

//     await this.page.waitForTimeout(1000);
//     const html = await this.page.content();

//     return { restaurant: parseRestaurantDetails(html), menu: parseMenu(html) };
//   }

//   async scrapeAllRestaurants() {
//     const links = await this.scrapeHome();
//     const results = [];

//     for (const link of links) {
//       try {
//         const restaurantUrl = new URL(link, this.base_url).toString();
//         const data = await this.scrapeRestaurant(restaurantUrl);
//         results.push({ url: link, ...data });
//       } catch (err) {
//         console.error(`[ERROR] Failed to scrape ${link}:`, err);
//       }

//       break;
//     }

//     return results;
//   }
// }

import { BaseScraper } from "./base.scraper.js";

import { BaseScraper } from "./base.scraper.js";
import { parseRestaurantLinks } from "#parsers/restaurant.parser.js";

export class FoodPandaScraper extends BaseScraper {
  private baseUrl: string;
  private lat: number;
  private lng: number;

  constructor(baseUrl: string, lat: number, lng: number) {
    super();
    this.baseUrl = baseUrl;
    this.lat = lat;
    this.lng = lng;
  }

  async scrapeRestaurantIds(): Promise<string[]> {
    if (!this.page) throw new Error("Scraper not initialized");

    const homeUrl = `${this.baseUrl}/restaurants/new?lng=${this.lng}&lat=${this.lat}&vertical=restaurants`;

    console.log("[INFO] Navigating to homepage...");
    await this.page.goto(homeUrl, { waitUntil: "domcontentloaded" });

    try {
      await this.page.waitForSelector(".organic-list", { timeout: 10000 });
    } catch (error) {
      console.error("[ERROR] Failed to load restaurant list");
      throw error;
    }

    await this.scrollRestaurantSection();

    const html = await this.page.content();
    const links = parseRestaurantLinks(html);

    const vendorIds = links.map((link) => this.extractVendorId(link)).filter(Boolean);

    console.log(`[INFO] Found ${vendorIds.length} restaurant IDs`);
    return vendorIds as string[];
  }

  private extractVendorId(url: string): string | null {
    const match = url.match(/\/restaurant\/([^\/]+)\//);
    return match ? match[1] : null;
  }

  private async scrollRestaurantSection() {
    if (!this.page) return;

    const section = await this.page.evaluateHandle(() => {
      const lists = Array.from(document.querySelectorAll(".organic-list"));
      return lists.find((list) => list.textContent?.toLowerCase().includes("all restaurants")) || null;
    });

    const element = section.asElement();
    if (!element) {
      console.warn("[WARN] All restaurants section not found");
      return;
    }

    await element.scrollIntoViewIfNeeded();
    await this.delay(1500);

    let scrollAttempts = 0;
    const maxScrollAttempts = 50;

    while (scrollAttempts < maxScrollAttempts) {
      const prevScrollY = await this.page.evaluate(() => window.scrollY);
      await this.page.mouse.wheel(0, 500);
      await this.delay(500);
      const currScrollY = await this.page.evaluate(() => window.scrollY);
      if (prevScrollY === currScrollY) break;
      scrollAttempts++;
    }

    console.log(`[INFO] Scrolled ${scrollAttempts} times`);
  }

  /**
   * Extract session tokens from localStorage/cookies
   */
  private async getSessionHeaders(): Promise<Record<string, string>> {
    if (!this.page) throw new Error("Page not initialized");

    return await this.page.evaluate(() => {
      // Try to get session data from localStorage or window object
      const perseusClientId = localStorage.getItem("fd.perseusId") || "";
      const perseusSessionId = localStorage.getItem("fd.sessionId") || "";

      // Try to find session data in page scripts or global variables
      let dpsSessionId = "";

      // Check if there's a global config object
      const globalConfig = (window as any).__INITIAL_STATE__ || (window as any).FD_CONFIG;
      if (globalConfig?.session) {
        dpsSessionId = globalConfig.session.id || "";
      }

      return {
        "perseus-client-id": perseusClientId,
        "perseus-session-id": perseusSessionId,
        "dps-session-id": dpsSessionId,
      };
    });
  }

  /**
   * Fetch restaurant data using the browser's context with proper headers
   */
  // async fetchRestaurantData(vendorId: string) {
  //   if (!this.page) throw new Error("Page not initialized");

  //   console.log(`[INFO] Fetching data for vendor: ${vendorId}`);

  //   try {
  //     // Get session headers
  //     const sessionHeaders = await this.getSessionHeaders();

  //     // Make API call from within the browser context
  //     const data = await this.page.evaluate(
  //       async ({ vendorId, lat, lng, sessionHeaders }) => {
  //         const url = `https://pk.fd-api.com/api/v5/vendors/${vendorId}`;
  //         const params = new URLSearchParams({
  //           include: "menus,bundles,multiple_discounts",
  //           language_id: "1",
  //           opening_type: "delivery",
  //           basket_currency: "PKR",
  //           latitude: lat.toString(),
  //           longitude: lng.toString(),
  //         });

  //         const headers: Record<string, string> = {
  //           accept: "application/json, text/plain, */*",
  //           "accept-language": "en-US,en;q=0.9",
  //           "api-version": "7",
  //           origin: "https://www.foodpanda.pk",
  //           referer: "https://www.foodpanda.pk/",
  //           "x-fp-api-key": "volo",
  //           "x-pd-language-id": "1",
  //         };

  //         // Add session headers if available
  //         if (sessionHeaders["perseus-client-id"]) {
  //           headers["perseus-client-id"] = sessionHeaders["perseus-client-id"];
  //         }
  //         if (sessionHeaders["perseus-session-id"]) {
  //           headers["perseus-session-id"] = sessionHeaders["perseus-session-id"];
  //         }
  //         if (sessionHeaders["dps-session-id"]) {
  //           headers["dps-session-id"] = sessionHeaders["dps-session-id"];
  //         }

  //         const response = await fetch(`${url}?${params}`, {
  //           headers,
  //           credentials: "include", // Include cookies
  //         });

  //         if (!response.ok) {
  //           const errorBody = await response.text();
  //           throw new Error(`API error: ${response.status} - ${errorBody}`);
  //         }

  //         return response.json();
  //       },
  //       { vendorId, lat: this.lat, lng: this.lng, sessionHeaders },
  //     );

  //     return this.parseVendorResponse(data);
  //   } catch (error) {
  //     console.error(`[ERROR] Failed to fetch vendor ${vendorId}:`, error);
  //     return null;
  //   }
  // }

  async fetchRestaurantData(vendorId: string) {
    if (!this.page) throw new Error("Page not initialized");

    console.log(`[INFO] Fetching data for vendor: ${vendorId}`);

    return new Promise<any>(async (resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Timeout")), 30000);
      let resolved = false;

      // Intercept the actual API response
      const responseHandler = async (response: any) => {
        try {
          const url = response.url();

          if (url.includes(`/vendors/${vendorId}`) && url.includes("fd-api.com")) {
            if (!resolved) {
              resolved = true;
              clearTimeout(timeout);

              const json = await response.json();
              const parsed = this.parseVendorResponse(json);
              this.page?.off("response", responseHandler);
              resolve(parsed);
            }
          }
        } catch (error) {
          // Ignore parse errors from other responses
        }
      };

      this.page.on("response", responseHandler);

      try {
        // Visit the restaurant page to trigger the API call
        const restaurantUrl = `${this.baseUrl}/restaurant/${vendorId}`;
        await this.page.goto(restaurantUrl, { waitUntil: "networkidle" });
      } catch (error) {
        this.page.off("response", responseHandler);
        clearTimeout(timeout);
        if (!resolved) reject(error);
      }
    });
  }

  /**
   * Parse API response
   */
  private parseVendorResponse(data: any) {
    const vendor = data.data;

    const menuItems: any[] = [];
    (vendor.menus || []).forEach((menu: any) => {
      (menu.menu_categories || []).forEach((category: any) => {
        (category.products || []).forEach((product: any) => {
          const basePrice = product.product_variations?.[0]?.price || 0;

          const variations =
            product.product_variations?.map((variation: any) => ({
              id: variation.id,
              name: variation.name || "Regular",
              price: variation.price,
            })) || [];

          menuItems.push({
            foodpandaId: product.id,
            name: product.name,
            description: product.description || "",
            price: basePrice,
            variations: variations.length > 1 ? variations : undefined,
            category: category.name,
            imageUrl: product.file_path?.replace("%s", "400") || null,
            isAvailable: !product.is_sold_out,
            tags: product.tags || [],
          });
        });
      });
    });

    return {
      restaurant: {
        foodpandaId: vendor.id,
        name: vendor.name,
        code: vendor.code,
        cuisineTypes: vendor.cuisines?.map((c: any) => c.name) || [],
        rating: vendor.rating || 0,
        ratingCount: vendor.review_number || 0,
        deliveryTime: vendor.minimum_delivery_time || null,
        minimumOrder: vendor.minimum_order_amount || 0,
        deliveryFee: vendor.minimum_delivery_fee || 0,
        currency: "PKR",
        isAvailable: vendor.is_active && vendor.is_delivery_enabled,
        address: vendor.address || null,
        imageUrl: vendor.hero_image || null,
      },
      menu: menuItems,
    };
  }

  /**
   * Main scraping method
   */
  async scrapeAll() {
    await this.init();

    try {
      // Get all vendor IDs
      const vendorIds = await this.scrapeRestaurantIds();

      // Test with first 3
      const testIds = vendorIds.slice(0, 3);
      console.log(`[INFO] Processing ${testIds.length} restaurants\n`);

      const results = [];

      for (const vendorId of testIds) {
        try {
          const data = await this.fetchRestaurantData(vendorId);

          if (data) {
            results.push({
              vendorId,
              ...data,
            });
            console.log(`[SUCCESS] ${data.restaurant.name} - ${data.menu.length} items`);
          }
        } catch (error) {
          console.error(`[ERROR] Failed to fetch ${vendorId}:`, error);
        }

        await this.delay(2000);
      }

      console.log(`\n[DONE] Successfully scraped ${results.length}/${testIds.length} restaurants`);
      return results;
    } finally {
      await this.close();
    }
  }
}
