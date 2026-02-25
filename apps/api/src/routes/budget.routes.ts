import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import * as budgetController from "../controllers/budget.controller.js";

const router: Router = Router();

router.use(authMiddleware);

router.post("/plans", budgetController.createPlan);
router.get("/plans/active", budgetController.getActivePlan);
router.get("/plans", budgetController.listPlans);
router.get("/plans/:id", budgetController.getPlanById);
router.patch("/plans/:id", budgetController.updatePlan);

export default router;
