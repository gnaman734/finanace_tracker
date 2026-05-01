import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getCategoryBreakdown, getDashboardSummary, getMonthlyChart } from '../controllers/dashboardController.js';

const router = Router();
router.get('/', authenticate, getDashboardSummary);
router.get('/summary', authenticate, getDashboardSummary);
router.get('/chart/monthly', authenticate, getMonthlyChart);
router.get('/chart/category-breakdown', authenticate, getCategoryBreakdown);

export default router;
