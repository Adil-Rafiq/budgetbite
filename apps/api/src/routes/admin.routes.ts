import { Router } from 'express';
import { requireAdminOrService } from '../middleware/admin.middleware.js';
import * as adminController from '../controllers/admin.controller.js';

const router: Router = Router();

router.use(requireAdminOrService);

// GET /restaurants?limit=20&offset=0&userLat=24.86&userLng=67.00&maxDistanceKm=5&minRating=4.0
router.get('/restaurants', adminController.listRestaurants);
// GET /restaurants/:id
router.get('/restaurants:id', adminController.getRestaurantById);
// GET /restaurants/external/:externalId
router.get('/restaurants/external/:externalId', adminController.getRestaurantByExternalId);
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
