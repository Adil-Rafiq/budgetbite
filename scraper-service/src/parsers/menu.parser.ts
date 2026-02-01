import { load } from "cheerio";

export function parseMenu(html: string) {
  const $ = load(html);
  const items: any[] = [];

  $(".product-tile").each((_, productTile) => {
    const tile = $(productTile);

    const name = tile.find('[data-testid="menu-product-name"]').text().trim();
    const price = tile.find('[data-testid="menu-product-price"]').text().trim();

    items.push({ name, price });
  });

  return items;
}
