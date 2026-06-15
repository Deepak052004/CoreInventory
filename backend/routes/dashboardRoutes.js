import express from 'express';
import { protect } from '../middleware/auth.js';
import { getKpis, getInventoryDistribution, getCategoryStats, getStockMovementHistory, getDashboardFilters } from '../controllers/dashboardController.js';

const router = express.Router();
router.use(protect);

router.get('/kpis', getKpis);
router.get('/inventory-distribution', getInventoryDistribution);
router.get('/category-stats', getCategoryStats);
router.get('/stock-movement', getStockMovementHistory);
router.get('/filters', getDashboardFilters);

export default router;
