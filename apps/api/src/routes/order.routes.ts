import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import * as orderController from "../controllers/order.controller.js";

const router: Router = Router();

router.use(authMiddleware);

router.post("/choices", orderController.recordChoice);
router.get("/plans/:planId/choices", orderController.listByPlan);

export default router;
