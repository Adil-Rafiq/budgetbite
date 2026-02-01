// import { load } from "cheerio";

// export function parseRestaurantLinks(html: string): string[] {
//   const $ = load(html);

//   return $(".vendor-tile-new-l a")
//     .map((_, el) => $(el).attr("href"))
//     .get()
//     .filter(Boolean);
// }

// export function parseRestaurantDetails(html: string) {
//   const $ = load(html);

//   const ratingText = $("#vendor-rating span").first().text().trim();
//   const totalRatings = $("#vendor-rating span").eq(1).text().trim();

//   return {
//     name: $("h1.main-info__title").text().trim(),
//     rating: ratingText,
//     totalRatings,
//   };
// }

import { load } from "cheerio";

/**
 * Parse restaurant links from homepage HTML
 */
export function parseRestaurantLinks(html: string): string[] {
  const $ = load(html);

  return $(".vendor-tile-new-l a")
    .map((_, el) => $(el).attr("href"))
    .get()
    .filter(Boolean);
}
