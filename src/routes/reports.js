import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { exportTransactions, getAnnualReport, getMonthlyReport } from '../controllers/reportsController.js';

const router = Router();
router.get('/monthly', authenticate, getMonthlyReport);
router.get('/annual', authenticate, getAnnualReport);
router.get('/export', authenticate, exportTransactions);

export default router;
