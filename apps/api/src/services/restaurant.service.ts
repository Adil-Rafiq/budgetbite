import type { ListRestaurantsQuery } from "../lib/validation.js";
import { restaurantRepository, menuRepository } from "@budgetbite/database";
import { AppError } from "../middleware/error.middleware.js";

export const restaurantService = {
  async list(query: ListRestaurantsQuery, userLat?: number, userLng?: number) {
    const lat = query.userLat ?? userLat;
    const lng = query.userLng ?? userLng;
    const results = await restaurantRepository.list({
      limit: query.limit,
      offset: query.offset,
      maxDistanceKm: query.maxDistanceKm,
      userLat: lat,
      userLng: lng,
      minRating: query.minRating,
    });
    return results.map((r) => ({
      ...r.restaurant,
      latitude: r.restaurant.latitude != null ? Number(r.restaurant.latitude) : null,
      longitude: r.restaurant.longitude != null ? Number(r.restaurant.longitude) : null,
      deliveryFee: r.restaurant.deliveryFee != null ? Number(r.restaurant.deliveryFee) : null,
      minimumOrder: r.restaurant.minimumOrder != null ? Number(r.restaurant.minimumOrder) : null,
      rating: r.restaurant.rating != null ? Number(r.restaurant.rating) : null,
      distanceKm: r.distanceKm != null ? Number(r.distanceKm) : undefined,
    }));
  },

  async getById(id: string) {
    const restaurant = await restaurantRepository.findById(id);
    if (!restaurant) throw new AppError(404, "Restaurant not found", "NOT_FOUND");
    return {
      ...restaurant,
      latitude: Number(restaurant.latitude),
      longitude: Number(restaurant.longitude),
      deliveryFee: restaurant.deliveryFee != null ? Number(restaurant.deliveryFee) : null,
      minimumOrder: restaurant.minimumOrder != null ? Number(restaurant.minimumOrder) : null,
      rating: restaurant.rating != null ? Number(restaurant.rating) : null,
    };
  },

  async getMenu(restaurantId: string) {
    const restaurant = await restaurantRepository.findById(restaurantId);
    if (!restaurant) throw new AppError(404, "Restaurant not found", "NOT_FOUND");
    const items = await menuRepository.findByRestaurantId(restaurantId);
    return items.map((item) => ({
      ...item,
      price: Number(item.price),
    }));
  },
};
