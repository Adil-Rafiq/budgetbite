import { Router } from 'express';
import { requireAdminOrService } from '../middleware/admin.middleware.js';
import * as adminController from '../controllers/admin.controller.js';

const router: Router = Router();

router.use(requireAdminOrService);

router.get('/restaurants', adminController.getRestaurantByExternalId);
router.post('/restaurants', adminController.createRestaurant);
router.patch('/restaurants/:id', adminController.updateRestaurant);
router.delete('/restaurants/:id', adminController.deleteRestaurant);
router.post('/restaurants/:id/menu-items', adminController.createMenuItems);
router.patch('/restaurants/:id/menu-items/:itemId', adminController.updateMenuItem);
router.delete('/restaurants/:id/menu-items/:itemId', adminController.deleteMenuItem);

router.get('/meal-types', adminController.listMealTypes);
router.post('/meal-types', adminController.createMealType);
router.patch('/meal-types/:id', adminController.updateMealType);
router.delete('/meal-types/:id', adminController.deleteMealType);

export default router;
