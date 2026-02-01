import type { Page } from "playwright";

export async function pauseForCaptcha(page: Page) {
  console.log("⚠️ If CAPTCHA appears, solve it manually.");
  await page.pause();
}
