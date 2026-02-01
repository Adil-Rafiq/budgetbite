import { load } from "cheerio";

export function parseRestaurant(html: string) {
  const $ = load(html);

  return {
    name: $("h1").text().trim(),
    rating: $(".rating").text(),
    address: $(".vendor-location").text(),
  };
}
