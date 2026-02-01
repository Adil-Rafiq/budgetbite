import { Page } from "playwright";

export class FoodpandaApiClient {
  private lat: number;
  private lng: number;
  private baseApiUrl = "https://pk.fd-api.com/api/v5";
  private page: Page | null = null;

  constructor(lat: number, lng: number, page?: Page) {
    this.lat = lat;
    this.lng = lng;
    this.page = page || null;
  }

  setPage(page: Page) {
    this.page = page;
  }

  /**
   * Fetch vendor details using Playwright's page context (has cookies/headers)
   */
  async getVendorDetails(vendorId: string) {
    if (!this.page) {
      throw new Error("Page not set - call setPage() first");
    }

    const url = `${this.baseApiUrl}/vendors/${vendorId}`;

    const params = new URLSearchParams({
      include: "menus,bundles,multiple_discounts",
      language_id: "1",
      opening_type: "delivery",
      basket_currency: "PKR",
      latitude: this.lat.toString(),
      longitude: this.lng.toString(),
    });

    try {
      // Use Playwright's page.evaluate to make request with browser context
      const data = await this.page.evaluate(
        async ({ url, params }) => {
          const response = await fetch(`${url}?${params}`, {
            headers: {
              accept: "application/json, text/plain, */*",
              "accept-language": "en-US,en;q=0.9",
              "api-version": "7",
              "x-fp-api-key": "volo",
              "x-pd-language-id": "1",
            },
          });

          if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
          }

          return response.json();
        },
        { url, params: params.toString() },
      );

      return this.parseVendorResponse(data);
    } catch (error) {
      console.error(`[ERROR] API request failed for ${vendorId}:`, error);
      throw error;
    }
  }

  /**
   * Parse API response into clean structure
   */
  private parseVendorResponse(data: any) {
    const vendor = data.data;

    return {
      restaurant: {
        foodpandaId: vendor.id,
        name: vendor.name,
        code: vendor.code,
        cuisineTypes: vendor.cuisines?.map((c: any) => c.name) || [],
        rating: vendor.rating,
        ratingCount: vendor.review_number,
        deliveryTime: vendor.delivery_time,
        minimumOrder: vendor.minimum_order_amount?.value || 0,
        deliveryFee: vendor.delivery_fee?.value || 0,
        currency: vendor.currency?.code || "PKR",
        isAvailable: vendor.is_available_for_delivery,
        address: vendor.address,
        imageUrl: vendor.hero_image,
      },
      menu: this.parseMenu(vendor.menus || []),
    };
  }

  /**
   * Parse menu items from API response
   */
  private parseMenu(menus: any[]) {
    const items: any[] = [];

    menus.forEach((menu: any) => {
      menu.menu_categories?.forEach((category: any) => {
        category.products?.forEach((product: any) => {
          items.push({
            foodpandaId: product.id,
            name: product.name,
            description: product.description || "",
            price: product.product_variations?.[0]?.price?.value || 0,
            category: category.name,
            imageUrl: product.image_url,
            isAvailable: product.available,
          });
        });
      });
    });

    return items;
  }
}
