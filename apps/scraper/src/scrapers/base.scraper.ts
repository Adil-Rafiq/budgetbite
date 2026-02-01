// import { chromium, type Browser, type Page } from "playwright";

// export abstract class BaseScraper {
//   protected browser!: Browser;
//   protected page!: Page;

//   async init() {
//     this.browser = await chromium.launch({ headless: false, slowMo: 100 });
//     const context = await this.browser.newContext({
//       userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " + "AppleWebKit/537.36 (KHTML, like Gecko) " + "Chrome/121.0.0.0 Safari/537.36",
//       viewport: { width: 1366, height: 768 },
//       locale: "en-US",
//     });

//     this.page = await context.newPage();
//   }

//   async close() {
//     await this.browser.close();
//   }
// }

import { chromium, Browser, Page } from "playwright";

export abstract class BaseScraper {
  protected browser: Browser | null = null;
  protected page: Page | null = null;

  async init() {
    this.browser = await chromium.launch({
      headless: false, // Set to true once you verify it works
      slowMo: 100,
    });
    this.page = await this.browser.newPage();

    // Set realistic viewport and user agent
    await this.page.setViewportSize({ width: 1920, height: 1080 });
  }

  async close() {
    if (this.page) await this.page.close();
    if (this.browser) await this.browser.close();
  }

  protected async delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
