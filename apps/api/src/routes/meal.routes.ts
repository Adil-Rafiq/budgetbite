import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import * as mealPlannerController from "../controllers/meal-planner.controller.js";
import * as mealTypeController from "../controllers/meal-type.controller.js";

const router = Router();

router.get("/types", mealTypeController.listMealTypes);

router.use(authMiddleware);

router.get("/suggestions", mealPlannerController.getSuggestions);
router.post("/plans/:planId/generate", mealPlannerController.generatePlan);

export default router;
