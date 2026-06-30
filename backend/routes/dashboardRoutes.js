import express from 'express';
import { protect } from '../middleware/auth.js';
import * as dashboardController from '../controllers/dashboardController.js';

const router = express.Router();
router.use(protect);

router.get('/kpis', dashboardController.getKpis);
router.get('/inventory-distribution', dashboardController.getInventoryDistribution);
router.get('/category-stats', dashboardController.getCategoryStats);
router.get('/stock-movement', dashboardController.getStockMovementHistory);
router.get('/filters', dashboardController.getDashboardFilters);

router.get('/top-selling', dashboardController.getTopSellingItems);
router.get('/low-stock', dashboardController.getLowStockAlerts);
router.get('/recent-activity', dashboardController.getRecentActivity);

export default router;
