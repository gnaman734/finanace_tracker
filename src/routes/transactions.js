import { Router } from 'express';
import { body } from 'express-validator';
import {
	createTransaction,
	deleteTransaction,
	getTransaction,
	listTransactions,
	updateTransaction
} from '../controllers/transactionsController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.get('/', authenticate, listTransactions);
router.post(
	'/',
	[
		body('category_id').optional().isUUID(),
		body('type').isIn(['income', 'expense']),
		body('amount').isFloat({ gt: 0 }),
		body('currency').isString().matches(/^[A-Za-z]{3}$/),
		body('description').isString().trim().notEmpty(),
		body('date').isISO8601(),
		body('is_refund').optional().isBoolean()
	],
	authenticate,
	validate,
	createTransaction
);
router.get('/:id', authenticate, getTransaction);
router.patch(
	'/:id',
	[
		body('category_id').optional().custom((value) => value === null || /^[0-9a-fA-F-]{36}$/.test(String(value))),
		body('type').optional().isIn(['income', 'expense']),
		body('amount').optional().isFloat({ gt: 0 }),
		body('currency').optional().isString().matches(/^[A-Za-z]{3}$/),
		body('description').optional().isString().trim().notEmpty(),
		body('date').optional().isISO8601(),
		body('is_refund').optional().isBoolean()
	],
	authenticate,
	validate,
	updateTransaction
);
router.delete('/:id', authenticate, deleteTransaction);

export default router;
