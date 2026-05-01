import { Router } from 'express';
import { body } from 'express-validator';
import { createBudget, deleteBudget, getBudgetStatus, listBudgets, updateBudget } from '../controllers/budgetsController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.get('/', authenticate, listBudgets);
router.get('/status', authenticate, getBudgetStatus);
router.post(
	'/',
	[
		body('category_id').isUUID(),
		body('amount').isFloat({ gt: 0 }),
		body('currency').isString().matches(/^[A-Za-z]{3}$/),
		body('period').isIn(['weekly', 'monthly', 'yearly']),
		body('start_date').isISO8601(),
		body('end_date').optional().isISO8601()
	],
	authenticate,
	validate,
	createBudget
);
router.patch(
	'/:id',
	[
		body('category_id').optional().isUUID(),
		body('amount').optional().isFloat({ gt: 0 }),
		body('currency').optional().isString().matches(/^[A-Za-z]{3}$/),
		body('period').optional().isIn(['weekly', 'monthly', 'yearly']),
		body('start_date').optional().isISO8601(),
		body('end_date').optional().isISO8601()
	],
	authenticate,
	validate,
	updateBudget
);
router.delete('/:id', authenticate, deleteBudget);

export default router;
