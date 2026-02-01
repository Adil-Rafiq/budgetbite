// import { load } from "cheerio";

// export function parseMenu(html: string) {
//   const $ = load(html);
//   const items: any[] = [];

//   $(".product-tile").each((_, productTile) => {
//     const tile = $(productTile);

//     const name = tile.find('[data-testid="menu-product-name"]').text().trim();
//     const price = tile.find('[data-testid="menu-product-price"]').text().trim();

//     items.push({ name, price });
//   });

//   return items;
// }

export function parseMenuFromApi(json: any) {
  const items: {
    name: string;
    price: number;
    description?: string;
  }[] = [];

  for (const menu of json.menus ?? []) {
    for (const category of menu.menu_categories ?? []) {
      for (const product of category.products ?? []) {
        items.push({
          name: product.name,
          price: product.price,
          description: product.description ?? undefined,
        });
      }
    }
  }

  return items;
}
