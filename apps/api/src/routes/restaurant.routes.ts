import { Router } from "express";
import { optionalAuthMiddleware } from "../middleware/auth.middleware.js";
import * as restaurantController from "../controllers/restaurant.controller.js";

const router = Router();

router.get("/", optionalAuthMiddleware, restaurantController.listRestaurants);
router.get("/:id", restaurantController.getRestaurant);
router.get("/:id/menu", restaurantController.getMenu);

export default router;
