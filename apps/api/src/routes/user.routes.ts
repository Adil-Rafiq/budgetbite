import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import * as userController from "../controllers/user.controller.js";

const router: Router = Router();

router.use(authMiddleware);

router.get("/profile", userController.getProfile);
router.patch("/profile", userController.updateProfile);

export default router;
