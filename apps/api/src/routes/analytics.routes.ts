import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import * as analyticsController from "../controllers/analytics.controller.js";

const router: Router = Router();

router.use(authMiddleware);

router.get("/spending", analyticsController.getSpendingSummary);
router.get("/history", analyticsController.getMealHistory);

export default router;
